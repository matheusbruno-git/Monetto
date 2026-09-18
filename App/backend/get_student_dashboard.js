const db = require("./connection.js");

function dateOnly(value) {
  if (!value) return null;
  return new Date(value).toISOString().slice(0, 10);
}

async function getStudentDashboard(studentId) {
  if (!studentId) return { success: false, message: "Sessão inválida." };

  try {
    const [[student]] = await db.promise().execute(
      `SELECT u.id_usuario, u.nome, u.email, u.criado_em, u.id_turma,
              e.nome AS escola, t.nome_turma AS turma,
              COALESCE(p.xp_atual, 0) AS xp_atual,
              COALESCE(p.xp_proximo_nivel, 100) AS xp_proximo_nivel,
              COALESCE(p.nivel_atual, 1) AS nivel_atual,
              COALESCE(p.sequencia_dias, 0) AS sequencia_dias
         FROM usuarios u
         LEFT JOIN escolas e ON e.id_escola = u.id_escola
         LEFT JOIN turmas t ON t.id_turma = u.id_turma
         LEFT JOIN progresso_aluno p ON p.id_aluno = u.id_usuario
        WHERE u.id_usuario = ? AND u.id_perfil = 1 AND u.ativo = 1`,
      [studentId],
    );
    if (!student) return { success: false, message: "Aluno não encontrado." };

    await db.promise().execute(
      `INSERT INTO progresso_aluno (id_aluno) VALUES (?)
       ON DUPLICATE KEY UPDATE atualizado_em = atualizado_em`,
      [studentId],
    );
    await db.promise().execute(
      `CREATE TABLE IF NOT EXISTS entregas_tarefas (
        id_entrega INT AUTO_INCREMENT PRIMARY KEY,
        id_tarefa INT NOT NULL,
        id_aluno INT NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'concluida',
        concluida_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_task_delivery (id_tarefa, id_aluno),
        FOREIGN KEY (id_tarefa) REFERENCES tarefas(id_tarefa),
        FOREIGN KEY (id_aluno) REFERENCES usuarios(id_usuario)
      )`,
    );

    const [tasks] = await db.promise().execute(
      `SELECT t.id_tarefa, t.titulo, t.descricao, t.data_vencimento,
              c.nome AS curso,
              et.concluida_em,
              CASE WHEN et.id_entrega IS NULL THEN 0 ELSE 1 END AS concluida
         FROM tarefas t
         LEFT JOIN cursos c ON c.id_curso = t.id_curso
         LEFT JOIN entregas_tarefas et ON et.id_tarefa = t.id_tarefa AND et.id_aluno = ?
        WHERE t.id_escola = (SELECT id_escola FROM usuarios WHERE id_usuario = ?)
          AND (t.status IS NULL OR t.status <> 'cancelada')
        ORDER BY t.data_vencimento IS NULL, t.data_vencimento ASC, t.id_tarefa DESC`,
      [studentId, studentId],
    );

    const [ranking] = student.id_turma
      ? await db.promise().execute(
          `SELECT u.id_usuario, u.nome, COALESCE(p.xp_atual, 0) AS xp
             FROM usuarios u
             LEFT JOIN progresso_aluno p ON p.id_aluno = u.id_usuario
            WHERE u.id_turma = ? AND u.id_perfil = 1 AND u.ativo = 1
            ORDER BY xp DESC, u.nome ASC LIMIT 5`,
          [student.id_turma],
        )
      : [[]];

    const completed = tasks.filter((task) => task.concluida).length;
    return {
      success: true,
      data: {
        student,
        tasks: tasks.map((task) => ({ ...task, data_vencimento: dateOnly(task.data_vencimento) })),
        ranking,
        stats: { totalTasks: tasks.length, completedTasks: completed, pendingTasks: tasks.length - completed },
      },
    };
  } catch (error) {
    console.error("getStudentDashboard Error:", error);
    return { success: false, message: "Não foi possível carregar os dados do aluno." };
  }
}

async function completeStudentTask(studentId, taskId) {
  if (!studentId || !taskId) return { success: false, message: "Tarefa inválida." };
  try {
    const [[task]] = await db.promise().execute(
      `SELECT t.id_tarefa FROM tarefas t
        JOIN usuarios u ON u.id_escola = t.id_escola
       WHERE t.id_tarefa = ? AND u.id_usuario = ? AND u.id_perfil = 1`,
      [taskId, studentId],
    );
    if (!task) return { success: false, message: "Tarefa não disponível para este aluno." };
    await db.promise().execute(
      `INSERT INTO entregas_tarefas (id_tarefa, id_aluno, status) VALUES (?, ?, 'concluida')
       ON DUPLICATE KEY UPDATE status = 'concluida', concluida_em = CURRENT_TIMESTAMP`,
      [taskId, studentId],
    );
    return { success: true, message: "Tarefa concluída." };
  } catch (error) {
    console.error("completeStudentTask Error:", error);
    return { success: false, message: "Não foi possível concluir a tarefa." };
  }
}

async function awardStudentXp(studentId, amount, source) {
  const xp = Math.max(0, Math.min(Number(amount) || 0, 500));
  if (!studentId || !xp) return { success: false, message: "Pontuação inválida." };
  try {
    await db.promise().execute(
      `INSERT INTO progresso_aluno (id_aluno, xp_atual, pontos_totais)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE xp_atual = xp_atual + VALUES(xp_atual),
         pontos_totais = pontos_totais + VALUES(pontos_totais), atualizado_em = CURRENT_TIMESTAMP`,
      [studentId, xp, xp],
    );
    await db.promise().execute(
      `INSERT INTO logs_atividade (id_usuario, acao, tabela_afetada, dados_novos)
       VALUES (?, ?, 'progresso_aluno', JSON_OBJECT('xp', ?))`,
      [studentId, source || "xp", xp],
    );
    return { success: true };
  } catch (error) {
    console.error("awardStudentXp Error:", error);
    return { success: false, message: "Não foi possível registrar os XP." };
  }
}

module.exports = { getStudentDashboard, completeStudentTask, awardStudentXp };
