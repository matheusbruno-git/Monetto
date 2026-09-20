const { resolveEscolaId } = require("./resolve_escola_id.js");

async function getDashboardTeacher(currentUserId) {
  try {
    const db = require("./connection.js");

    if (!currentUserId) {
      return { success: false, message: "ID do usuário não informado." };
    }

    const escolaId = await resolveEscolaId(db, currentUserId);
    if (!escolaId) {
      return {
        success: false,
        message: "Usuário não está associado a uma escola.",
      };
    }

    async function safeCount(sql, params = []) {
      try {
        const [[row]] = await db.promise().execute(sql, params);
        return Number(row.total) || 0;
      } catch (e) {
        console.warn("safeCount failed:", e.sqlMessage || e.message);
        return 0;
      }
    }

    async function safeQuery(sql, params = []) {
      try {
        const [rows] = await db.promise().execute(sql, params);
        return rows;
      } catch (e) {
        console.warn("safeQuery failed:", e.sqlMessage || e.message);
        return [];
      }
    }

    let teacherName = "Professor";
    let teacherSub = "Dashboard do Professor";
    try {
      const [users] = await db
        .promise()
        .execute(
          `SELECT nome, email FROM usuarios WHERE id_usuario = ? LIMIT 1`,
          [currentUserId],
        );
      if (users[0]) {
        teacherName = users[0].nome || teacherName;
      }
    } catch (e) {
      console.warn("usuario lookup failed:", e.sqlMessage || e.message);
    }

    const turmasTotal = await safeCount(
      `SELECT COUNT(*) AS total FROM turmas
       WHERE status = 'ativa' AND id_escola = ? AND id_professor = ?`,
      [escolaId, currentUserId],
    );

    const alunosAtivos = await safeCount(
      `SELECT COUNT(*) AS total FROM usuarios u
       INNER JOIN turmas t ON u.id_turma = t.id_turma
       WHERE u.id_perfil = 1 AND u.ativo = 1 AND u.id_escola = ?
         AND t.id_professor = ? AND t.id_escola = ?`,
      [escolaId, currentUserId, escolaId],
    );

    const tarefasAtivas = await safeCount(
      `SELECT COUNT(*) AS total FROM tarefas
       WHERE id_escola = ? AND (id_professor = ? OR id_usuario = ?)`,
      [escolaId, currentUserId, currentUserId],
    );

    let taxaConclusao = 0;
    let taxaSub = "Alunos nas suas turmas";
    if (alunosAtivos > 0) {
      const comEntrega = await safeCount(
        `SELECT COUNT(DISTINCT e.id_usuario) AS total
         FROM entregas e
         INNER JOIN usuarios u ON u.id_usuario = e.id_usuario
         INNER JOIN turmas t ON u.id_turma = t.id_turma
         WHERE t.id_professor = ? AND t.id_escola = ?
           AND u.id_perfil = 1 AND u.ativo = 1`,
        [currentUserId, escolaId],
      );
      if (comEntrega > 0) {
        taxaConclusao = Math.round((comEntrega / alunosAtivos) * 100);
        taxaSub = "Com entregas registradas";
      } else {
        taxaConclusao = 100;
        taxaSub = "Vinculados a turmas";
      }
    }

    let avaliacaoMedia = "—";
    let avaliacaoSub = "Nota dos alunos";
    const avgRow = await safeQuery(
      `SELECT ROUND(AVG(nota), 1) AS media FROM avaliacoes_professor
       WHERE id_professor = ?`,
      [currentUserId],
    );
    if (avgRow[0] && avgRow[0].media != null) {
      avaliacaoMedia = String(avgRow[0].media);
    }

    teacherSub = `${turmasTotal} turma${turmasTotal === 1 ? "" : "s"} · ${alunosAtivos} aluno${alunosAtivos === 1 ? "" : "s"}`;

    const turmaRows = await safeQuery(
      `SELECT t.id_turma, t.nome_turma, t.status, t.sala,
              (SELECT COUNT(*) FROM usuarios u
               WHERE u.id_turma = t.id_turma
                 AND u.id_perfil = 1 AND u.ativo = 1 AND u.id_escola = ?) AS alunos_count
       FROM turmas t
       WHERE t.id_escola = ? AND t.id_professor = ?
       ORDER BY t.nome_turma ASC
       LIMIT 10`,
      [escolaId, escolaId, currentUserId],
    );

    const turmas = turmaRows.map((t) => {
      const nAlunos = Number(t.alunos_count) || 0;
      let engagement = t.status === "ativa" ? 75 : 40;
      if (nAlunos === 0) engagement = 0;
      else if (nAlunos >= 30) engagement = 92;
      else if (nAlunos >= 20) engagement = 85;
      else if (nAlunos >= 10) engagement = 78;

      const sala = t.sala ? `Sala ${t.sala}` : "";
      const subtitle = [nAlunos ? `${nAlunos} alunos` : "Sem alunos", sala]
        .filter(Boolean)
        .join(" · ");

      return {
        id: t.id_turma,
        name: t.nome_turma,
        subtitle,
        engagement,
        students: nAlunos,
      };
    });

    const activities = [];

    const recentEntregas = await safeQuery(
      `SELECT u.nome AS aluno_nome, tar.titulo AS tarefa_titulo, e.criado_em,
              t.nome_turma, e.xp_ganho
       FROM entregas e
       INNER JOIN usuarios u ON u.id_usuario = e.id_usuario
       INNER JOIN tarefas tar ON tar.id_tarefa = e.id_tarefa
       INNER JOIN turmas t ON u.id_turma = t.id_turma
       WHERE t.id_professor = ? AND t.id_escola = ?
       ORDER BY e.criado_em DESC
       LIMIT 5`,
      [currentUserId, escolaId],
    );
    for (const r of recentEntregas) {
      const xp = r.xp_ganho != null ? ` · +${r.xp_ganho} XP` : "";
      activities.push({
        title: `${r.aluno_nome} concluiu "${r.tarefa_titulo || "tarefa"}"`,
        subtitle: `${r.nome_turma || ""}${xp}`.trim(),
        time: formatRelative(r.criado_em),
        dotClass: "ad-g",
      });
    }

    const recentTarefas = await safeQuery(
      `SELECT titulo, criado_em FROM tarefas
       WHERE id_escola = ? AND (id_professor = ? OR id_usuario = ?)
       ORDER BY criado_em DESC LIMIT 3`,
      [escolaId, currentUserId, currentUserId],
    );
    for (const r of recentTarefas) {
      if (activities.length >= 6) break;
      activities.push({
        title: `Nova tarefa: ${r.titulo || "sem título"}`,
        subtitle: "Publicada por você",
        time: formatRelative(r.criado_em),
        dotClass: "ad-b",
      });
    }

    if (!activities.length) {
      activities.push({
        title: "Dashboard atualizado",
        subtitle: "Dados das suas turmas",
        time: "agora",
        dotClass: "ad-b",
      });
    }

    const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const completionsByDay = await safeQuery(
      `SELECT DAYOFWEEK(e.criado_em) AS dow, COUNT(*) AS total
       FROM entregas e
       INNER JOIN usuarios u ON u.id_usuario = e.id_usuario
       INNER JOIN turmas t ON u.id_turma = t.id_turma
       WHERE t.id_professor = ? AND t.id_escola = ?
         AND e.criado_em >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY DAYOFWEEK(e.criado_em)`,
      [currentUserId, escolaId],
    );
    const byDow = {};
    for (const r of completionsByDay) {
      byDow[Number(r.dow)] = Number(r.total) || 0;
    }
    const completionsChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const mysqlDow = d.getDay() + 1;
      const label = dayLabels[d.getDay()];
      completionsChart.push({
        label,
        height: byDow[mysqlDow] || 0,
        value: byDow[mysqlDow] || 0,
      });
    }

    const schoolName = await safeQuery(
      `SELECT nome FROM escolas WHERE id_escola = ? LIMIT 1`,
      [escolaId],
    );
    const schoolTitle = schoolName[0] ? schoolName[0].nome : "Escola";

    const topRows = await safeQuery(
      `SELECT u.nome, t.nome_turma,
              COALESCE(SUM(e.xp_ganho), 0) AS xp
       FROM usuarios u
       INNER JOIN turmas t ON u.id_turma = t.id_turma
       LEFT JOIN entregas e ON e.id_usuario = u.id_usuario
         AND e.criado_em >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       WHERE u.id_perfil = 1 AND u.ativo = 1 AND u.id_escola = ?
         AND t.id_professor = ?
       GROUP BY u.id_usuario, u.nome, t.nome_turma
       ORDER BY xp DESC
       LIMIT 5`,
      [escolaId, currentUserId],
    );
    const topAlunos = topRows.map((r) => ({
      name: r.nome,
      turma: r.nome_turma,
      xp: Number(r.xp) || 0,
    }));

    const pendingRows = await safeQuery(
      `SELECT tar.id_tarefa, tar.titulo, tar.data_entrega,
              t.nome_turma,
              (SELECT COUNT(*) FROM usuarios u
               WHERE u.id_turma = t.id_turma AND u.id_perfil = 1 AND u.ativo = 1) AS total_alunos,
              (SELECT COUNT(DISTINCT e.id_usuario) FROM entregas e
               WHERE e.id_tarefa = tar.id_tarefa) AS entregues
       FROM tarefas tar
       INNER JOIN turmas t ON t.id_turma = tar.id_turma
       WHERE tar.id_escola = ?
         AND t.id_professor = ?
         AND (tar.data_entrega IS NULL OR tar.data_entrega >= DATE_SUB(CURDATE(), INTERVAL 1 DAY))
       ORDER BY tar.data_entrega ASC
       LIMIT 6`,
      [escolaId, currentUserId],
    );

    const pending = pendingRows.map((r) => {
      const total = Number(r.total_alunos) || 0;
      const entregues = Number(r.entregues) || 0;
      const faltam = Math.max(0, total - entregues);
      let urgency = "pu-y";
      let chip = "em prazo";
      let when = "Sem prazo";
      if (r.data_entrega) {
        const deadline = new Date(r.data_entrega);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((deadline - today) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          urgency = "pu-r";
          chip = "atrasada";
          when = `Atrasada · ${faltam} pendentes`;
        } else if (diffDays === 0) {
          urgency = "pu-r";
          chip = "urgente";
          when = `Hoje · ${faltam} não entregaram`;
        } else if (diffDays <= 2) {
          urgency = "pu-y";
          chip = "em prazo";
          when = `${deadline.toLocaleDateString("pt-BR")} · ${faltam} pendentes`;
        } else {
          urgency = "pu-g";
          chip = "tranquilo";
          when = `${deadline.toLocaleDateString("pt-BR")} · ${faltam} pendentes`;
        }
      } else {
        when = `${faltam} pendentes`;
      }
      return {
        title: r.titulo || "Tarefa",
        subtitle: r.nome_turma ? `${r.nome_turma} · ${when}` : when,
        urgency,
        chip,
      };
    });

    return {
      success: true,
      data: {
        teacher: {
          name: teacherName,
          subtitle: teacherSub,
        },
        stats: [
          {
            value: String(alunosAtivos),
            sub: `${turmasTotal} turma${turmasTotal === 1 ? "" : "s"}`,
          },
          { value: taxaConclusao + "%", sub: taxaSub },
          { value: String(tarefasAtivas), sub: "Publicadas por você" },
          { value: avaliacaoMedia, sub: avaliacaoSub },
        ],
        turmas,
        school: {
          name: schoolName[0] ? schoolName[0].nome : "Escola",
          subtitle: schoolTitle,
        },
        activities,
        completionsChart,
        topAlunos,
        pending,
      },
    };
  } catch (err) {
    console.error("getDashboardTeacher Error:", err);
    return {
      success: false,
      message: "Erro ao carregar dashboard: " + err.message,
    };
  }
}

module.exports = { getDashboardTeacher };
