const { resolveEscolaId } = require("./resolve_escola_id.js");
const db = require("./connection.js");

function formatRelative(dateValue) {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "—";

  const elapsed = Date.now() - date.getTime();
  const minutes = Math.floor(elapsed / 60000);
  const hours = Math.floor(elapsed / 3600000);
  const days = Math.floor(elapsed / 86400000);

  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  if (hours < 24) return `há ${hours}h`;
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  return date.toLocaleDateString("pt-BR");
}

async function getDashboardAdminEscolar(currentUserId) {
  if (!currentUserId) {
    return { success: false, message: "ID do usuário não informado." };
  }

  try {
    const escolaId = await resolveEscolaId(currentUserId);
    if (!escolaId) {
      return {
        success: false,
        message: "Usuário não está associado a uma escola.",
      };
    }

    const query = async (sql, params = []) => {
      const [rows] = await db.promise().execute(sql, params);
      return rows;
    };

    const count = async (sql, params = []) => {
      const rows = await query(sql, params);
      return Number(rows[0]?.total) || 0;
    };

    const [[school]] = await db.promise().execute(
      `SELECT nome, cidade, estado FROM escolas WHERE id_escola = ? LIMIT 1`,
      [escolaId],
    );
    const [counts] = await db.promise().execute(
      `SELECT
         SUM(p.nome = 'aluno' AND u.ativo = 1) AS students,
         SUM(p.nome = 'professor' AND u.ativo = 1) AS teachers
       FROM usuarios u
       INNER JOIN perfis p ON p.id_perfil = u.id_perfil
       WHERE u.id_escola = ?`,
      [escolaId],
    );

    const students = Number(counts[0]?.students) || 0;
    const teachers = Number(counts[0]?.teachers) || 0;
    const studentRows = await query(
      `SELECT u.id_usuario, u.nome, u.serie
       FROM usuarios u
       INNER JOIN perfis p ON p.id_perfil = u.id_perfil AND p.nome = 'aluno'
       WHERE u.id_escola = ? AND u.ativo = 1
       ORDER BY u.nome ASC
       LIMIT 100`,
      [escolaId],
    );
    const classes = await count(
      `SELECT COUNT(*) AS total FROM turmas WHERE id_escola = ?`,
      [escolaId],
    );
    const tasks = await count(
      `SELECT COUNT(*) AS total FROM tarefas WHERE id_escola = ?`,
      [escolaId],
    );
    const xpTotalRows = await query(
      `SELECT COALESCE(SUM(e.xp_ganho), 0) AS total
       FROM entregas e
       INNER JOIN tarefas t ON t.id_tarefa = e.id_tarefa
       WHERE t.id_escola = ?`,
      [escolaId],
    );
    const xpTotal = Number(xpTotalRows[0]?.total) || 0;
    const [submittedRows] = await db.promise().execute(
      `SELECT COUNT(DISTINCT e.id_usuario) AS total
       FROM entregas e
       INNER JOIN tarefas task ON task.id_tarefa = e.id_tarefa
       INNER JOIN usuarios u ON u.id_usuario = e.id_usuario
       WHERE task.id_escola = ? AND u.id_escola = ?
         AND u.ativo = 1 AND u.id_perfil = 1`,
      [escolaId, escolaId],
    );
    const completion = students
      ? Math.round((Number(submittedRows[0]?.total || 0) / students) * 100)
      : 0;

    const teacherRows = await query(
      `SELECT u.nome, COUNT(DISTINCT t.id_turma) AS classes
       FROM usuarios u
       INNER JOIN perfis p ON p.id_perfil = u.id_perfil AND p.nome = 'professor'
       LEFT JOIN turmas t ON t.id_professor = u.id_usuario AND t.id_escola = u.id_escola
       WHERE u.id_escola = ? AND u.ativo = 1
       GROUP BY u.id_usuario, u.nome
       ORDER BY u.nome ASC
       LIMIT 6`,
      [escolaId],
    );

    const classRows = await query(
      `SELECT t.id_turma, t.nome_turma, t.status,
         COUNT(DISTINCT CASE WHEN p.nome = 'aluno' AND u.ativo = 1 THEN u.id_usuario END) AS students,
         COALESCE(ROUND(AVG(CASE WHEN p.nome = 'aluno' AND u.ativo = 1
           THEN pa.percentual_conclusao END)), 0) AS completion
       FROM turmas t
       LEFT JOIN usuarios u ON u.id_turma = t.id_turma AND u.id_escola = t.id_escola
       LEFT JOIN perfis p ON p.id_perfil = u.id_perfil
       LEFT JOIN progresso_aluno pa ON pa.id_aluno = u.id_usuario
       WHERE t.id_escola = ?
       GROUP BY t.id_turma, t.nome_turma, t.status
       ORDER BY t.nome_turma ASC
       LIMIT 8`,
      [escolaId],
    );

    const [weeklyXpRows] = await db.promise().execute(
      `SELECT DATE(e.criado_em) AS day, COALESCE(SUM(e.xp_ganho), 0) AS total
       FROM entregas e
       INNER JOIN tarefas t ON t.id_tarefa = e.id_tarefa
       WHERE t.id_escola = ? AND e.criado_em >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY DATE(e.criado_em)`,
      [escolaId],
    );
    const xpByDay = new Map(
      weeklyXpRows.map((row) => [new Date(row.day).toDateString(), Number(row.total) || 0]),
    );
    const xpChart = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - offset);
      xpChart.push({
        label: day.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
        height: xpByDay.get(day.toDateString()) || 0,
      });
    }
    const maxXp = Math.max(...xpChart.map((day) => day.height), 1);
    xpChart.forEach((day) => {
      day.height = Math.max(4, Math.round((day.height / maxXp) * 90));
    });

    const [activityRows] = await db.promise().execute(
      `SELECT u.nome AS student_name, t.titulo AS task_title, e.criado_em, e.xp_ganho
       FROM entregas e
       INNER JOIN usuarios u ON u.id_usuario = e.id_usuario
       INNER JOIN tarefas t ON t.id_tarefa = e.id_tarefa
       WHERE u.id_escola = ?
       ORDER BY e.criado_em DESC
       LIMIT 6`,
      [escolaId],
    );

    const alerts = [];
    if (!teachers) {
      alerts.push({ level: "yellow", icon: "🟡", title: "Nenhum professor cadastrado", subtitle: "Cadastre professores para começar" });
    }
    if (!classes) {
      alerts.push({ level: "blue", icon: "🔵", title: "Nenhuma turma cadastrada", subtitle: "Crie turmas e vincule alunos" });
    }
    if (!students) {
      alerts.push({ level: "yellow", icon: "🟡", title: "Nenhum aluno matriculado", subtitle: "Cadastre alunos para começar" });
    }
    if (!alerts.length) {
      alerts.push({ level: "blue", icon: "🔵", title: "Tudo em ordem", subtitle: "Nenhum alerta crítico no momento" });
    }

    return {
      success: true,
      data: {
        school: {
          name: school?.nome || "Escola",
          subtitle: [school?.cidade, school?.estado].filter(Boolean).join(" · ") || "Dashboard do Administrador Escolar",
          stats: [
            { value: students },
            { value: teachers },
            { value: classes },
          ],
        },
        stats: [
          { value: students },
          { value: `${completion}%` },
          { value: tasks },
          { value: xpTotal },
        ],
        teachers: teacherRows.map((teacher, index) => ({
          name: teacher.nome,
          subtitle: `${Number(teacher.classes) || 0} turma(s)`,
          avatarClass: `ta${(index % 4) + 1}`,
          emoji: "👩‍🏫",
        })),
        students: studentRows.map((student) => ({
          id: student.id_usuario,
          name: student.nome,
          subtitle: student.serie || "Aluno ativo",
          emoji: "🎓",
        })),
        alerts,
        classes: classRows.map((item) => ({
          name: item.nome_turma,
          students: Number(item.students) || 0,
          completion: Number(item.completion) || 0,
          statusClass: item.status === "ativa" ? "sd-g" : "sd-y",
          statusLabel: item.status || "—",
        })),
        xpChart,
        activities: activityRows.map((item, index) => ({
          title: `${item.student_name} concluiu “${item.task_title || "tarefa"}”`,
          subtitle: `+${Number(item.xp_ganho) || 0} XP`,
          time: formatRelative(item.criado_em),
          iconClass: index % 2 ? "ai-g" : "ai-b",
          icon: "✓",
        })),
        xpMonthValue: xpTotal,
        xpMonthDelta: "—",
      },
    };
  } catch (error) {
    console.error("Erro ao carregar dashboard do administrador escolar:", error);
    return {
      success: false,
      message: `Erro ao carregar dashboard: ${error.message}`,
    };
  }
}

module.exports = { getDashboardAdminEscolar };
