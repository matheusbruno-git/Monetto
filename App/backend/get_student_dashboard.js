const db = require("./connection.js");

async function tableExists(tableName) {
  try {
    const [rows] = await db.promise().execute(
      `
      SELECT COUNT(*) AS total
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
      `,
      [tableName],
    );

    return Number(rows[0]?.total || 0) > 0;
  } catch (error) {
    console.error("tableExists Error:", error);
    return false;
  }
}

async function getColumns(tableName) {
  try {
    const [rows] = await db
      .promise()
      .query(`SHOW COLUMNS FROM \`${tableName}\``);

    return new Set(rows.map((row) => row.Field));
  } catch (error) {
    console.warn(
      `Não foi possível ler colunas de ${tableName}:`,
      error.message,
    );

    return new Set();
  }
}

function dateOnly(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

async function ensureStudentProgress(studentId) {
  await db.promise().execute(
    `
    INSERT INTO progresso_aluno (id_aluno)
    VALUES (?)

    ON DUPLICATE KEY UPDATE
      id_aluno = VALUES(id_aluno)
    `,
    [studentId],
  );
}

async function grantRewardByName(studentId, rewardName) {
  if (
    !studentId ||
    !rewardName ||
    !(await tableExists("recompensas")) ||
    !(await tableExists("recompensas_aluno"))
  ) {
    return {
      granted: false,
      reward: null,
      xpAwarded: 0,
    };
  }

  try {
    const [[reward]] = await db.promise().execute(
      `
        SELECT
          id_recompensa,
          nome,
          descricao,
          tipo,
          valor_bonus

        FROM recompensas

        WHERE
          nome = ?
          AND (
            ativo = 1
            OR ativo IS NULL
          )

        LIMIT 1
      `,
      [rewardName],
    );

    if (!reward) {
      return {
        granted: false,
        reward: null,
        xpAwarded: 0,
      };
    }

    const [insertResult] = await db.promise().execute(
      `
        INSERT IGNORE INTO recompensas_aluno
        (
          id_aluno,
          id_recompensa,
          visto
        )

        VALUES
        (
          ?,
          ?,
          0
        )
      `,
      [
        studentId,
        reward.id_recompensa,
      ],
    );

    if (!insertResult.affectedRows) {
      return {
        granted: false,
        reward,
        xpAwarded: 0,
      };
    }

    const bonus =
      Math.max(
        0,
        Number(
          reward.valor_bonus,
        ) || 0,
      );

    if (bonus > 0) {
      const xpResult =
        await awardStudentXp(
          studentId,
          bonus,
          `recompensa:${reward.nome}`,
        );

      if (!xpResult?.success) {
        await db.promise().execute(
          `
            DELETE FROM recompensas_aluno

            WHERE
              id_aluno = ?
              AND id_recompensa = ?
          `,
          [
            studentId,
            reward.id_recompensa,
          ],
        );

        return {
          granted: false,
          reward,
          xpAwarded: 0,
        };
      }

      return {
        granted: true,
        reward,
        xpAwarded: bonus,
        xp_atual: xpResult.xp_atual,
        nivel_atual: xpResult.nivel_atual,
      };
    }

    return {
      granted: true,
      reward,
      xpAwarded: 0,
    };
  } catch (error) {
    console.warn(
      `Não foi possível conceder a recompensa "${rewardName}":`,
      error.message,
    );

    return {
      granted: false,
      reward: null,
      xpAwarded: 0,
    };
  }
}

async function getPerfectGradeRewardNames(studentId) {
  const rewardNames =
    new Set();

  if (
    !(await tableExists("notas")) ||
    !(await tableExists("avaliacoes"))
  ) {
    return rewardNames;
  }

  try {
    const [rows] = await db.promise().execute(
      `
        SELECT
          n.nota,
          a.nota_maxima,
          a.titulo,
          a.descricao

        FROM notas n

        INNER JOIN avaliacoes a
          ON a.id_avaliacao =
             n.id_avaliacao

        WHERE
          n.id_aluno = ?
          AND n.nota IS NOT NULL
      `,
      [studentId],
    );

    rows.forEach((row) => {
      const note =
        Number(row.nota);

      const maximum =
        Number(
          row.nota_maxima,
        );

      if (
        !Number.isFinite(note) ||
        !Number.isFinite(maximum) ||
        note < maximum
      ) {
        return;
      }

      const text =
        `${row.titulo || ""} ${row.descricao || ""}`
          .normalize("NFD")
          .replace(
            /[\u0300-\u036f]/g,
            "",
          )
          .toLowerCase();

      if (
        text.includes(
          "orcamento",
        )
      ) {
        rewardNames.add(
          "Orçamento Perfeito",
        );
      }

      if (
        text.includes(
          "juros",
        )
      ) {
        rewardNames.add(
          "Mestre dos Juros",
        );
      }

      if (
        text.includes(
          "vibranium",
        )
      ) {
        rewardNames.add(
          "Rei de Wakanda",
        );
      }
    });
  } catch (error) {
    console.warn(
      "Não foi possível avaliar recompensas por nota:",
      error.message,
    );
  }

  return rewardNames;
}

async function evaluateAutomaticRewards({
  student,
  tasks,
  deliveries,
  ranking,
}) {
  if (
    !student?.id_usuario ||
    !(await tableExists("recompensas")) ||
    !(await tableExists("recompensas_aluno"))
  ) {
    return {
      granted: [],
      xpAwarded: 0,
      xp_atual:
        Number(student?.xp_atual) || 0,
      nivel_atual:
        Number(student?.nivel_atual) || 1,
    };
  }

  const rewardNames =
    new Set();

  rewardNames.add(
    "Primeiro Login",
  );

  const streak =
    Number(
      student.sequencia_dias,
    ) || 0;

  if (streak >= 7) {
    rewardNames.add(
      "Sequência de 7 dias",
    );
  }

  if (streak >= 14) {
    rewardNames.add(
      "Sequência de 14 dias",
    );
  }

  if (
    Array.isArray(deliveries) &&
    deliveries.length >= 1
  ) {
    rewardNames.add(
      "Primeiro Salto",
    );
  }

  const totalTasks =
    Array.isArray(tasks)
      ? tasks.length
      : 0;

  const completedTasks =
    Array.isArray(tasks)
      ? tasks.filter(
        (task) =>
          Boolean(task.concluida),
      ).length
      : 0;

  if (
    totalTasks > 0 &&
    completedTasks === totalTasks
  ) {
    rewardNames.add(
      "Bat-Sinal de Economia",
    );
  }

  if (
    student.id_turma &&
    Array.isArray(ranking) &&
    ranking.length
  ) {
    const position =
      ranking.findIndex(
        (entry) =>
          String(
            entry.id_usuario,
          ) ===
          String(
            student.id_usuario,
          ),
      );

    if (
      position >= 0 &&
      position < 3
    ) {
      rewardNames.add(
        "Top 3 da Turma",
      );
    }

    if (position === 0) {
      rewardNames.add(
        "Líder da Turma",
      );
    }
  }

  const gradeRewards =
    await getPerfectGradeRewardNames(
      student.id_usuario,
    );

  gradeRewards.forEach(
    (name) => {
      rewardNames.add(name);
    },
  );

  const granted = [];

  let totalXpAwarded = 0;

  let latestXp =
    Number(
      student.xp_atual,
    ) || 0;

  let latestLevel =
    Number(
      student.nivel_atual,
    ) || 1;

  for (
    const rewardName
    of rewardNames
  ) {
    const result =
      await grantRewardByName(
        student.id_usuario,
        rewardName,
      );

    if (!result.granted) {
      continue;
    }

    granted.push(
      rewardName,
    );

    totalXpAwarded +=
      Number(
        result.xpAwarded,
      ) || 0;

    if (
      Number.isFinite(
        Number(
          result.xp_atual,
        ),
      )
    ) {
      latestXp =
        Number(
          result.xp_atual,
        );
    }

    if (
      Number.isFinite(
        Number(
          result.nivel_atual,
        ),
      )
    ) {
      latestLevel =
        Number(
          result.nivel_atual,
        );
    }
  }

  return {
    granted,
    xpAwarded:
      totalXpAwarded,
    xp_atual:
      latestXp,
    nivel_atual:
      latestLevel,
  };
}

async function getStudentDashboard(studentId) {
  if (!studentId) {
    return {
      success: false,
      message: "Sessão inválida.",
    };
  }

  try {
    await ensureStudentProgress(studentId);

    const progressColumns = await getColumns("progresso_aluno");

    const xpAtualSelect = progressColumns.has("xp_atual")
      ? "COALESCE(p.xp_atual, 0)"
      : progressColumns.has("pontos_totais")
        ? "COALESCE(p.pontos_totais, 0)"
        : "0";

    const pontosSelect = progressColumns.has("pontos_totais")
      ? "COALESCE(p.pontos_totais, 0)"
      : xpAtualSelect;

    const nivelSelect = progressColumns.has("nivel_atual")
      ? "COALESCE(p.nivel_atual, 1)"
      : "1";

    const proximoNivelSelect = progressColumns.has("xp_proximo_nivel")
      ? "COALESCE(p.xp_proximo_nivel, 100)"
      : "100";

    const percentualSelect = progressColumns.has("percentual_conclusao")
      ? "COALESCE(p.percentual_conclusao, 0)"
      : "0";

    const sequenciaSelect = progressColumns.has("sequencia_dias")
      ? "COALESCE(p.sequencia_dias, 0)"
      : "0";

    const [[student]] = await db.promise().execute(
      `
        SELECT
          u.id_usuario,
          u.nome,
          u.email,
          u.criado_em,
          u.id_escola,
          u.id_turma,

          e.nome AS escola,
          t.nome_turma AS turma,

          ${xpAtualSelect}
            AS xp_atual,

          ${proximoNivelSelect}
            AS xp_proximo_nivel,

          ${nivelSelect}
            AS nivel_atual,

          ${pontosSelect}
            AS pontos_totais,

          ${percentualSelect}
            AS percentual_conclusao,

          ${sequenciaSelect}
            AS sequencia_dias

        FROM usuarios u

        LEFT JOIN escolas e
          ON e.id_escola =
             u.id_escola

        LEFT JOIN turmas t
          ON t.id_turma =
             u.id_turma

        LEFT JOIN progresso_aluno p
          ON p.id_aluno =
             u.id_usuario

        WHERE
          u.id_usuario = ?
          AND u.id_perfil = 1
          AND u.ativo = 1

        LIMIT 1
      `,
      [studentId],
    );

    if (!student) {
      return {
        success: false,
        message: "Aluno não encontrado.",
      };
    }

    const taskColumns = await getColumns("tarefas");

    let dueColumn = null;

    if (taskColumns.has("data_entrega")) {
      dueColumn = "data_entrega";
    } else if (taskColumns.has("data_vencimento")) {
      dueColumn = "data_vencimento";
    }

    const hasTurma = taskColumns.has("id_turma");
    const hasProfessor = taskColumns.has("id_professor");
    const hasCurso = taskColumns.has("id_curso");
    const hasDescricao = taskColumns.has("descricao");
    const hasStatus = taskColumns.has("status");

    let xpColumn = null;

    if (taskColumns.has("xp_recompensa")) {
      xpColumn = "xp_recompensa";
    } else if (taskColumns.has("xp")) {
      xpColumn = "xp";
    }

    const deliveryExists = await tableExists("entregas");

    if (!deliveryExists) {
      return {
        success: false,
        message: "A tabela de entregas não foi encontrada no banco.",
      };
    }

    const deliveryColumns = await getColumns("entregas");

    let deliveryStudentColumn;

    if (deliveryColumns.has("id_usuario")) {
      deliveryStudentColumn = "id_usuario";
    } else if (deliveryColumns.has("id_aluno")) {
      deliveryStudentColumn = "id_aluno";
    } else {
      return {
        success: false,
        message: "A tabela entregas não possui identificação do aluno.",
      };
    }

    let deliveryDateColumn;

    if (deliveryColumns.has("criado_em")) {
      deliveryDateColumn = "criado_em";
    } else if (deliveryColumns.has("concluida_em")) {
      deliveryDateColumn = "concluida_em";
    } else {
      deliveryDateColumn = null;
    }

    const where = [];
    const params = [];

    if (taskColumns.has("id_escola")) {
      where.push("tar.id_escola = ?");
      params.push(student.id_escola);
    }

    if (hasTurma && student.id_turma != null) {
      where.push("(tar.id_turma = ? OR tar.id_turma IS NULL)");
      params.push(student.id_turma);
    }

    if (hasStatus) {
      where.push(
        `
        (
          tar.status IS NULL
          OR LOWER(tar.status)
             NOT IN (
               'cancelada',
               'cancelado'
             )
        )
        `,
      );
    }

    const whereSql = where.length
      ? `WHERE ${where.join(" AND ")}`
      : "";

    const descriptionSelect = hasDescricao
      ? "tar.descricao"
      : "NULL AS descricao";

    const dueSelect = dueColumn
      ? `tar.${dueColumn} AS data_vencimento`
      : "NULL AS data_vencimento";

    const courseSelect = hasCurso
      ? "c.nome AS curso"
      : "NULL AS curso";

    const professorSelect = hasProfessor
      ? "prof.nome AS professor"
      : "NULL AS professor";

    const xpSelect = xpColumn
      ? `COALESCE(tar.${xpColumn}, 0) AS xp_recompensa`
      : "0 AS xp_recompensa";

    const deliveryDateSelect = deliveryDateColumn
      ? `ent.${deliveryDateColumn} AS concluida_em`
      : "NULL AS concluida_em";

    const deliveryXpSelect = deliveryColumns.has("xp_ganho")
      ? "COALESCE(ent.xp_ganho, 0) AS xp_ganho"
      : "0 AS xp_ganho";

    const joins = [];

    if (hasCurso) {
      joins.push(
        `
        LEFT JOIN cursos c
          ON c.id_curso =
             tar.id_curso
        `,
      );
    }

    if (hasProfessor) {
      joins.push(
        `
        LEFT JOIN usuarios prof
          ON prof.id_usuario =
             tar.id_professor
        `,
      );
    }

    joins.push(
      `
      LEFT JOIN entregas ent
        ON ent.id_tarefa =
           tar.id_tarefa

       AND ent.${deliveryStudentColumn}
           = ?
      `,
    );

    const orderSql = dueColumn
      ? `
          ORDER BY
            tar.${dueColumn} IS NULL,
            tar.${dueColumn} ASC,
            tar.id_tarefa DESC
        `
      : `
          ORDER BY
            tar.id_tarefa DESC
        `;

    const [tasks] = await db.promise().execute(
      `
        SELECT
          tar.id_tarefa,
          tar.titulo,

          ${descriptionSelect},
          ${dueSelect},
          ${courseSelect},
          ${professorSelect},
          ${xpSelect},
          ${deliveryDateSelect},
          ${deliveryXpSelect},

          CASE
            WHEN ent.id_tarefa IS NULL
            THEN 0
            ELSE 1
          END AS concluida

        FROM tarefas tar

        ${joins.join("\n")}

        ${whereSql}

        ${orderSql}
      `,
      [studentId, ...params],
    );

    let ranking = [];

    if (student.id_turma) {
      const [rankingRows] = await db.promise().execute(
        `
          SELECT
            u.id_usuario,
            u.nome,
            ${xpAtualSelect} AS xp

          FROM usuarios u

          LEFT JOIN progresso_aluno p
            ON p.id_aluno =
               u.id_usuario

          WHERE
            u.id_turma = ?
            AND u.id_perfil = 1
            AND u.ativo = 1

          ORDER BY
            xp DESC,
            u.nome ASC

          LIMIT 20
        `,
        [student.id_turma],
      );

      ranking = rankingRows;
    }

    const deliverySelect = [
      "id_tarefa",

      `${deliveryStudentColumn}
         AS id_usuario`,

      deliveryDateColumn
        ? `${deliveryDateColumn}
             AS criado_em`
        : "NULL AS criado_em",

      deliveryColumns.has("xp_ganho")
        ? "COALESCE(xp_ganho, 0) AS xp_ganho"
        : "0 AS xp_ganho",
    ];

    const deliveryOrder = deliveryDateColumn
      ? `ORDER BY ${deliveryDateColumn} DESC`
      : "";

    const [deliveries] = await db.promise().execute(
      `
        SELECT
          ${deliverySelect.join(", ")}

        FROM entregas

        WHERE
          ${deliveryStudentColumn}
          = ?

        ${deliveryOrder}
      `,
      [studentId],
    );

    const normalizedTasks = tasks.map((task) => ({
      ...task,

      concluida: Boolean(task.concluida),

      data_vencimento: dateOnly(task.data_vencimento),

      xp_recompensa: Number(task.xp_recompensa) || 0,

      xp_ganho: Number(task.xp_ganho) || 0,
    }));

    const completed = normalizedTasks.filter(
      (task) => task.concluida,
    ).length;

    const totalTasks = normalizedTasks.length;

    const pendingTasks = totalTasks - completed;

    const completionRate = totalTasks
      ? Math.round((completed / totalTasks) * 100)
      : Number(student.percentual_conclusao) || 0;

    const automaticRewards =
      await evaluateAutomaticRewards({
        student,
        tasks: normalizedTasks,
        deliveries,
        ranking,
      });

    if (
      automaticRewards.xpAwarded > 0
    ) {
      student.xp_atual =
        automaticRewards.xp_atual;

      student.nivel_atual =
        automaticRewards.nivel_atual;

      student.xp_proximo_nivel =
        Math.max(
          100,
          Number(
            automaticRewards.nivel_atual,
          ) * 100,
        );

      if (
        progressColumns.has(
          "pontos_totais",
        )
      ) {
        student.pontos_totais =
          (
            Number(
              student.pontos_totais,
            ) || 0
          ) +
          automaticRewards.xpAwarded;
      }
    }

    let rewards = [];

    const hasRewards = await tableExists("recompensas");
    const hasStudentRewards = await tableExists("recompensas_aluno");

    if (hasRewards && hasStudentRewards) {
      try {
        const [rewardRows] = await db.promise().execute(
          `
            SELECT
              r.id_recompensa,
              r.nome,
              r.descricao,
              r.tipo,
              r.valor_bonus,

              ra.conquistado_em,
              ra.visto

            FROM recompensas_aluno ra

            INNER JOIN recompensas r
              ON r.id_recompensa =
                 ra.id_recompensa

            WHERE
              ra.id_aluno = ?

              AND (
                r.ativo = 1
                OR r.ativo IS NULL
              )

            ORDER BY
              ra.conquistado_em DESC
          `,
          [studentId],
        );

        rewards = rewardRows;
      } catch (rewardError) {
        console.warn(
          "Recompensas ainda não compatíveis:",
          rewardError.message,
        );

        rewards = [];
      }
    }

    return {
      success: true,

      data: {
        student: {
          ...student,

          xp_atual:
            Number(student.xp_atual) || 0,

          xp_proximo_nivel:
            Number(student.xp_proximo_nivel) || 100,

          nivel_atual:
            Number(student.nivel_atual) || 1,

          pontos_totais:
            Number(student.pontos_totais) || 0,

          sequencia_dias:
            Number(student.sequencia_dias) || 0,

          percentual_conclusao:
            completionRate,
        },

        tasks: normalizedTasks,

        ranking,

        deliveries,

        rewards,

        stats: {
          totalTasks,

          completedTasks: completed,

          pendingTasks,

          completionRate,
        },
      },
    };
  } catch (error) {
    console.error(
      "getStudentDashboard Error:",
      error,
    );

    return {
      success: false,

      message:
        "Não foi possível carregar os dados do aluno: " +
        error.message,
    };
  }
}

async function completeStudentTask(studentId, taskId) {
  if (!studentId || !taskId) {
    return {
      success: false,
      message: "Tarefa inválida.",
    };
  }

  try {
    const taskColumns = await getColumns("tarefas");

    const hasTurma = taskColumns.has("id_turma");

    const [[student]] = await db.promise().execute(
      `
        SELECT
          id_usuario,
          id_escola,
          id_turma

        FROM usuarios

        WHERE
          id_usuario = ?
          AND id_perfil = 1
          AND ativo = 1

        LIMIT 1
      `,
      [studentId],
    );

    if (!student) {
      return {
        success: false,
        message: "Aluno não encontrado.",
      };
    }

    const taskWhere = ["id_tarefa = ?"];

    const taskParams = [taskId];

    if (taskColumns.has("id_escola")) {
      taskWhere.push("id_escola = ?");
      taskParams.push(student.id_escola);
    }

    if (hasTurma && student.id_turma != null) {
      taskWhere.push("(id_turma = ? OR id_turma IS NULL)");
      taskParams.push(student.id_turma);
    }

    const [[task]] = await db.promise().execute(
      `
        SELECT id_tarefa

        FROM tarefas

        WHERE
          ${taskWhere.join(" AND ")}

        LIMIT 1
      `,
      taskParams,
    );

    if (!task) {
      return {
        success: false,
        message:
          "Tarefa não disponível para este aluno.",
      };
    }

    if (!(await tableExists("entregas"))) {
      return {
        success: false,
        message:
          "A tabela de entregas não foi encontrada.",
      };
    }

    const columns = await getColumns("entregas");

    const studentColumn = columns.has("id_usuario")
      ? "id_usuario"
      : columns.has("id_aluno")
        ? "id_aluno"
        : null;

    if (!studentColumn) {
      return {
        success: false,
        message:
          "A tabela de entregas não possui identificação do aluno.",
      };
    }

    const [existing] = await db.promise().execute(
      `
        SELECT id_tarefa

        FROM entregas

        WHERE
          id_tarefa = ?
          AND ${studentColumn} = ?

        LIMIT 1
      `,
      [taskId, studentId],
    );

    if (existing.length) {
      await db.promise().execute(
        `
          DELETE FROM entregas

          WHERE
            id_tarefa = ?
            AND ${studentColumn} = ?
        `,
        [taskId, studentId],
      );

      return {
        success: true,
        completed: false,
        message:
          "Tarefa reaberta com sucesso!",
      };
    }

    const insertColumns = [
      "id_tarefa",
      studentColumn,
    ];

    const values = [
      taskId,
      studentId,
    ];

    const placeholders = [
      "?",
      "?",
    ];

    if (columns.has("status")) {
      insertColumns.push("status");
      values.push("concluida");
      placeholders.push("?");
    }

    await db.promise().execute(
      `
        INSERT INTO entregas
          (${insertColumns.join(", ")})

        VALUES
          (${placeholders.join(", ")})
      `,
      values,
    );

    return {
      success: true,
      completed: true,
      message:
        "Tarefa concluída com sucesso!",
    };
  } catch (error) {
    console.error(
      "completeStudentTask Error:",
      error,
    );

    return {
      success: false,

      message:
        "Não foi possível alterar a tarefa: " +
        error.message,
    };
  }
}

async function awardStudentXp(
  studentId,
  amount,
  source,
) {
  const xp = Math.max(
    0,
    Math.min(Number(amount) || 0, 500),
  );

  if (!studentId || !xp) {
    return {
      success: false,
      message: "Pontuação inválida.",
    };
  }

  try {
    const [[student]] = await db.promise().execute(
      `
        SELECT id_usuario

        FROM usuarios

        WHERE
          id_usuario = ?
          AND id_perfil = 1
          AND ativo = 1

        LIMIT 1
      `,
      [studentId],
    );

    if (!student) {
      return {
        success: false,
        message: "Aluno não encontrado.",
      };
    }

    await ensureStudentProgress(studentId);

    const columns = await getColumns(
      "progresso_aluno",
    );

    const [progressRows] = await db.promise().execute(
      `
        SELECT *

        FROM progresso_aluno

        WHERE id_aluno = ?

        LIMIT 1
      `,
      [studentId],
    );

    const progress =
      progressRows[0] || {};

    const currentXp =
      Number(
        progress.xp_atual ??
        progress.pontos_totais ??
        0,
      ) || 0;

    const newXp =
      currentXp + xp;

    const newLevel = Math.max(
      1,
      Math.floor(newXp / 100) + 1,
    );

    const nextLevelXp =
      newLevel * 100;

    const updates = [];
    const values = [];

    if (columns.has("xp_atual")) {
      updates.push("xp_atual = ?");
      values.push(newXp);
    }

    if (columns.has("pontos_totais")) {
      updates.push(
        `
        pontos_totais =
          COALESCE(
            pontos_totais,
            0
          ) + ?
        `,
      );

      values.push(xp);
    }

    if (columns.has("nivel_atual")) {
      updates.push("nivel_atual = ?");
      values.push(newLevel);
    }

    if (columns.has("xp_proximo_nivel")) {
      updates.push(
        "xp_proximo_nivel = ?",
      );

      values.push(nextLevelXp);
    }

    if (columns.has("atualizado_em")) {
      updates.push(
        "atualizado_em = CURRENT_TIMESTAMP",
      );
    }

    if (!updates.length) {
      return {
        success: false,
        message:
          "A tabela de progresso não possui campos de XP compatíveis.",
      };
    }

    values.push(studentId);

    await db.promise().execute(
      `
      UPDATE progresso_aluno

      SET
        ${updates.join(", ")}

      WHERE id_aluno = ?
      `,
      values,
    );

    if (
      await tableExists("logs_atividade")
    ) {
      try {
        await db.promise().execute(
          `
          INSERT INTO logs_atividade
          (
            id_usuario,
            acao,
            tabela_afetada,
            dados_novos
          )

          VALUES
          (
            ?,
            ?,
            'progresso_aluno',
            JSON_OBJECT(
              'xp',
              ?
            )
          )
          `,
          [
            studentId,
            source || "xp",
            xp,
          ],
        );
      } catch (logError) {
        console.warn(
          "Não foi possível registrar log de XP:",
          logError.message,
        );
      }
    }

    return {
      success: true,

      message:
        `${xp} XP adicionados com sucesso!`,

      amount: xp,

      xp_atual: newXp,

      nivel_atual: newLevel,
    };
  } catch (error) {
    console.error(
      "awardStudentXp Error:",
      error,
    );

    return {
      success: false,

      message:
        "Não foi possível registrar os XP: " +
        error.message,
    };
  }
}

module.exports = {
  getStudentDashboard,
  completeStudentTask,
  awardStudentXp,
};