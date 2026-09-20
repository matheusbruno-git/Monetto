

const db = require("./connection.js");

async function resolveEscolaId(currentUserId) {
  if (!currentUserId) return null;

  const [rows] = await db.promise().execute(
    `SELECT id_escola
     FROM usuarios
     WHERE id_usuario = ?
       AND ativo = 1
     LIMIT 1`,
    [currentUserId]
  );

  return rows[0]?.id_escola || null;
}

function formatRelative(dateVal) {
  if (!dateVal) return "—";

  try {
    const d = new Date(dateVal);

    if (Number.isNaN(d.getTime())) return "—";

    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 60000);

    if (mins < 1) return "agora";
    if (mins < 60) return `há ${mins}min`;

    const hours = Math.floor(mins / 60);
    if (hours < 24) return `há ${hours}h`;

    const days = Math.floor(hours / 24);
    if (days === 1) return "ontem";
    if (days < 30) return `há ${days}d`;

    return d.toLocaleDateString("pt-BR");
  } catch (_) {
    return "—";
  }
}

async function getDashboardAdminEscolar(currentUserId) {
  try {

    if (!currentUserId) {
      return { success: false, message: "ID do usuário não informado." };
    }

    const escolaId = await resolveEscolaId(currentUserId);
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

    const alunosTotal = await safeCount(
      `SELECT COUNT(*) AS total FROM usuarios WHERE id_perfil = 1 AND ativo = 1 AND id_escola = ?`,
      [escolaId],
    );
    const deactivatedAlunosTotal = await safeCount(
      `SELECT COUNT(*) AS total FROM usuarios WHERE id_perfil = 1 AND ativo = 1 AND id_escola = ? AND (ultimo_acesso IS NULL OR DATEDIFF(CURDATE(), ultimo_acesso) > 7)`,
      [escolaId],
    );
    const professoresTotal = await safeCount(
      `SELECT COUNT(*) AS total FROM usuarios WHERE id_perfil = 2 AND ativo = 1 AND id_escola = ?`,
      [escolaId],
    );
    const turmasTotal = await safeCount(
      `SELECT COUNT(*) AS total FROM turmas WHERE status = 'ativa' AND id_escola = ?`,
      [escolaId],
    );
    const tarefasTotal = await safeCount(
      `SELECT COUNT(*) AS total FROM tarefas WHERE id_escola = ?`,
      [escolaId],
    );
    const xpTotal = await safeCount(
      `SELECT COALESCE(SUM(pa.xp_atual), 0) AS total
       FROM progresso_aluno pa
       JOIN usuarios u ON u.id_usuario = pa.id_aluno
       WHERE u.id_escola = ?`,
      [escolaId],
    );

    // Alunos com turma / total (proxy de "taxa de conclusão")
    let taxaConclusao = 0;
    if (alunosTotal > 0) {
      const comTurma = await safeCount(
        `SELECT COUNT(*) AS total FROM usuarios
         WHERE id_perfil = 1 AND ativo = 1 AND id_escola = ?
           AND id_turma IS NOT NULL`,
        [escolaId],
      );
      taxaConclusao = Math.round((comTurma / alunosTotal) * 100);
    }

    let escolaNome = "";
    let escolaSub = "";
    let escolaEmail = "";
    try {
      const escolas = await db
        .promise()
        .execute(
          `SELECT nome, cidade, estado, email FROM escolas`,
          [escolaId]
        );
      if (escolas[0]) {
        escolaNome = escolas[0].nome;
        escolaEmail = escolas[0].email;
        escolaSub = [escolas[0].cidade, escolas[0].estado]
          .filter(Boolean)
          .join(" · ");
      }
    } catch (e) {
      console.warn("escolas table missing or empty");
    }

    // Professores
    const profRows = await safeQuery(
      `SELECT u.id_usuario, u.nome, u.email,
              (SELECT COUNT(*) FROM turmas t WHERE t.id_professor = u.id_usuario AND t.status = 'ativa') AS turmas_count
       FROM usuarios u
       WHERE u.id_escola = ? AND u.id_perfil = 2 AND u.ativo = 1
       ORDER BY u.nome ASC
       LIMIT 8`,
      [escolaId],
    );
    const studentRows = await safeQuery(
      `SELECT u.id_usuario, u.nome, u.email,
              (SELECT COUNT(*) FROM turmas t WHERE t.id_turma = u.id_turma AND t.status = 'ativa') AS turmas_count
       FROM usuarios u
       WHERE u.id_escola = ? AND u.id_perfil = 1 AND u.ativo = 1
       ORDER BY u.nome ASC
       LIMIT 8`,
      [escolaId],
    );
    const teachers = profRows.map((p, i) => ({
      id: p.id_usuario,
      name: p.nome,
      email: p.email || "",
      subtitle: `${Number(p.turmas_count) || 0} turma(s)`,
      engagement: 70 + (((Number(p.turmas_count) || 0) * 5) % 25),
      avatarClass: `ta${(i % 4) + 1}`,
      emoji: i % 2 === 0 ? "👨‍🏫" : "👩‍🏫",
    }));

    const students = studentRows.map((p, i) => ({
      id: p.id_usuario,
      name: p.nome,
      email: p.email || "",
      subtitle: `${Number(p.turmas_count) || 0} turma(s)`,
      engagement: 70 + (((Number(p.turmas_count) || 0) * 5) % 25),
      avatarClass: `ta${(i % 4) + 1}`,
      emoji: i % 2 === 0 ? "👨‍🏫" : "👩‍🏫",
    }));

    // Turmas
    const turmaRows = await safeQuery(
      `SELECT t.id_turma, t.nome_turma, t.status,
              (SELECT COUNT(*) FROM usuarios u
               WHERE u.id_turma = t.id_turma AND u.id_perfil = 1 AND u.ativo = 1) AS alunos_count
       FROM turmas t
       WHERE t.id_escola = ?
       ORDER BY t.nome_turma ASC
       LIMIT 10`,
      [escolaId],
    );
    const classes = turmaRows.map((t) => {
      const nAlunos = Number(t.alunos_count) || 0;
      let conclusao = t.status === "ativa" ? 80 : 55;
      if (nAlunos === 0) conclusao = 0;
      else if (nAlunos >= 25) conclusao = 90;
      let statusLabel = "Bom";
      let statusClass = "sd-y";
      if (conclusao >= 90) {
        statusLabel = "Ótimo";
        statusClass = "sd-g";
      } else if (conclusao < 70) {
        statusLabel = "Atenção";
        statusClass = "sd-r";
      }
      return {
        id: t.id_turma,
        name: t.nome_turma,
        students: nAlunos,
        completion: conclusao,
        statusLabel,
        statusClass,
      };
    });

    // Alertas a partir de sinais reais
    const alerts = [];
    if (deactivatedAlunosTotal > 0) {
      alerts.push({
        level: "red",
        icon: "🔴",
        title: `${deactivatedAlunosTotal} aluno(s) sem acesso há +7 dias`,
        subtitle: "Ação recomendada",
        action: "Alertar",
      });
    }
    if (professoresTotal === 0) {
      alerts.push({
        level: "yellow",
        icon: "🟡",
        title: "Nenhum professor cadastrado",
        subtitle: "Cadastre professores para começar",
        action: "Cadastrar",
      });
    }
    if (turmasTotal === 0) {
      alerts.push({
        level: "blue",
        icon: "🔵",
        title: "Nenhuma turma ativa",
        subtitle: "Crie turmas e vincule alunos",
        action: "Criar",
      });
    }
    if (alunosTotal === 0) {
      alerts.push({
        level: "yellow",
        icon: "🟡",
        title: "Nenhum aluno matriculado",
        subtitle: "Cadastre ou importe alunos",
        action: "Cadastrar",
      });
    }
    if (!alerts.length) {
      alerts.push({
        level: "blue",
        icon: "🔵",
        title: "Tudo em ordem",
        subtitle: "Nenhum alerta crítico no momento",
        action: "OK",
      });
    }

    // Atividades recentes
    const activities = [];
    const recentProfs = await safeQuery(
      `SELECT nome, criado_em FROM usuarios
       WHERE id_escola = ? AND id_perfil = 2
       ORDER BY criado_em DESC LIMIT 3`,
      [escolaId],
    );
    for (const r of recentProfs) {
      activities.push({
        icon: "👨‍🏫",
        iconClass: "ai-b",
        title: `Professor: ${r.nome}`,
        subtitle: "Cadastro no sistema",
        time: formatRelative(r.criado_em),
      });
    }
    let recentTurmas = await safeQuery(
      `SELECT nome_turma, data_inicio AS ref_date FROM turmas
       WHERE id_escola = ?
       ORDER BY id_turma DESC LIMIT 3`,
      [escolaId],
    );
    if (!recentTurmas.length) {
      recentTurmas = await safeQuery(
        `SELECT nome_turma, NULL AS ref_date FROM turmas
         WHERE id_escola = ?
         ORDER BY id_turma DESC LIMIT 3`,
        [escolaId],
      );
    }
    for (const r of recentTurmas) {
      activities.push({
        icon: "✅",
        iconClass: "ai-g",
        title: `Turma: ${r.nome_turma}`,
        subtitle: "Turma na escola",
        time: formatRelative(r.ref_date),
      });
    }
    if (!activities.length) {
      activities.push({
        icon: "📊",
        iconClass: "ai-b",
        title: "Dashboard atualizado",
        subtitle: "Dados carregados do banco",
        time: "agora",
      });
    }

    const formatXp = (n) => {
      if (n >= 1000) return (n / 1000).toFixed(1) + "k";
      return String(n);
    };

    return {
      success: true,
      data: {
        school: {
          name: escolaNome,
          subtitle: escolaSub,
          email: escolaEmail,
          chips: [
            `📅 Ano letivo ${new Date().getFullYear()}`,
            "🔒 Admin",
            "● Sistema ativo",
          ],
          stats: [
            { value: String(alunosTotal), label: "Alunos" },
            { value: String(professoresTotal), label: "Professores" },
            { value: String(turmasTotal), label: "Turmas" },
          ],
        },
        stats: [
          { value: String(alunosTotal) },
          { value: taxaConclusao + "%" },
          { value: String(tarefasTotal) },
          { value: formatXp(xpTotal) },
          { value: String(deactivatedAlunosTotal) },
        ],
        teachers,
        students,
        alerts,
        classes,
        xpChart: [
          { label: "Sem 1", height: 40 },
          { label: "Sem 2", height: 55 },
          { label: "Sem 3", height: 48 },
          {
            label: "Sem 4",
            height: Math.min(90, 30 + Math.round(xpTotal / 100)),
          },
        ],
        xpMonthValue: formatXp(xpTotal),
        xpMonthDelta: "—",
        activities,
      },
    };
  } catch (err) {
    console.error("getDashboardAdminEscolar Error:", err);
    return {
      success: false,
      message: "Erro ao carregar dashboard: " + err.message,
    };
  }
}

module.exports = { getDashboardAdminEscolar };
