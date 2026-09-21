const path = require("path");

const basePath = path.join(__dirname, "..");
const db = require(path.join(basePath, "backend/connection.js"));

async function safeCount(sql, params = []) {
  try {
    const [[row]] = await db.promise().execute(sql, params);
    return Number(row?.total) || 0;
  } catch (err) {
    console.warn("getDashboardAdminGeral count failed:", err.sqlMessage || err.message);
    return 0;
  }
}

async function safeQuery(sql, params = []) {
  try {
    const [rows] = await db.promise().execute(sql, params);
    return rows;
  } catch (err) {
    console.warn("getDashboardAdminGeral query failed:", err.sqlMessage || err.message);
    return [];
  }
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatRelative(dateValue) {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "—";

  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes}min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days}d`;

  return date.toLocaleDateString("pt-BR");
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date) {
  return date.toLocaleDateString("pt-BR", {
    month: "short",
    year: "numeric",
  }).replace(".", "");
}

async function getDashboardAdminGeral(currentUserId) {
  if (!currentUserId) {
    return { success: false, message: "ID do usuário não informado." };
  }

  // The general administrator is profile 4. The renderer never receives
  // unrestricted SQL access; this check only authorizes this dashboard.
  const admins = await safeQuery(
    `SELECT id_usuario, nome, email
       FROM usuarios
      WHERE id_usuario = ? AND id_perfil = 4 AND ativo = 1
      LIMIT 1`,
    [currentUserId],
  );

  if (!admins.length) {
    return {
      success: false,
      message: "Usuário não autorizado para o painel do administrador geral.",
    };
  }

  const now = new Date();
  const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const escolasTotal = await safeCount(
    `SELECT COUNT(*) AS total FROM escolas`,
  );

  const alunosTotal = await safeCount(
    `SELECT COUNT(*) AS total
       FROM usuarios
      WHERE id_perfil = 1 AND ativo = 1`,
  );

  const professoresTotal = await safeCount(
    `SELECT COUNT(*) AS total
       FROM usuarios
      WHERE id_perfil = 2 AND ativo = 1`,
  );

  const alunosNovosMes = await safeCount(
    `SELECT COUNT(*) AS total
       FROM usuarios
      WHERE id_perfil = 1
        AND ativo = 1
        AND criado_em >= ?
        AND criado_em < ?`,
    [firstDayCurrentMonth, firstDayNextMonth],
  );

  const professoresNovosMes = await safeCount(
    `SELECT COUNT(*) AS total
       FROM usuarios
      WHERE id_perfil = 2
        AND ativo = 1
        AND criado_em >= ?
        AND criado_em < ?`,
    [firstDayCurrentMonth, firstDayNextMonth],
  );

  const xpTotalRows = await safeQuery(
    `SELECT COALESCE(SUM(pa.xp_atual), 0) AS total
       FROM progresso_aluno pa
       INNER JOIN usuarios u ON u.id_usuario = pa.id_aluno
      WHERE u.id_perfil = 1 AND u.ativo = 1`,
  );
  const xpTotal = Number(xpTotalRows[0]?.total) || 0;

  const mrrRows = await safeQuery(
    `SELECT COALESCE(SUM(valor), 0) AS total
       FROM pagamentos
      WHERE LOWER(status) = 'pago'
        AND data_pagamento >= ?
        AND data_pagamento < ?`,
    [firstDayCurrentMonth, firstDayNextMonth],
  );
  const mrr = Number(mrrRows[0]?.total) || 0;

  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = firstDayCurrentMonth;
  const previousMrrRows = await safeQuery(
    `SELECT COALESCE(SUM(valor), 0) AS total
       FROM pagamentos
      WHERE LOWER(status) = 'pago'
        AND data_pagamento >= ?
        AND data_pagamento < ?`,
    [previousMonthStart, previousMonthEnd],
  );
  const previousMrr = Number(previousMrrRows[0]?.total) || 0;

  let mrrTrend = "—";
  if (previousMrr > 0) {
    const pct = ((mrr - previousMrr) / previousMrr) * 100;
    mrrTrend = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% vs. mês anterior`;
  } else if (mrr > 0) {
    mrrTrend = "primeiro mês com pagamentos";
  }

  const topSchools = await safeQuery(
    `SELECT
        e.id_escola,
        e.nome,
        e.cidade,
        e.estado,
        COUNT(DISTINCT CASE
          WHEN u.id_perfil = 1 AND u.ativo = 1 THEN u.id_usuario
        END) AS alunos,
        COALESCE(ROUND(AVG(
          CASE
            WHEN u.id_perfil = 1 AND u.ativo = 1
            THEN COALESCE(pa.percentual_conclusao, 0)
          END
        )), 0) AS conclusao
       FROM escolas e
       LEFT JOIN usuarios u ON u.id_escola = e.id_escola
       LEFT JOIN progresso_aluno pa ON pa.id_aluno = u.id_usuario
      GROUP BY e.id_escola, e.nome, e.cidade, e.estado
      ORDER BY conclusao DESC, alunos DESC, e.nome ASC
      LIMIT 5`,
  );

  const paymentSummary = await safeQuery(
    `SELECT
        LOWER(status) AS status,
        COUNT(*) AS quantidade,
        COALESCE(SUM(valor), 0) AS valor
       FROM pagamentos
      GROUP BY LOWER(status)
      ORDER BY quantidade DESC`,
  );

  const growthRows = await safeQuery(
    `SELECT
        YEAR(criado_em) AS ano,
        MONTH(criado_em) AS mes,
        COUNT(*) AS total
       FROM usuarios
      WHERE id_perfil = 1
        AND ativo = 1
        AND criado_em >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 3 MONTH)
      GROUP BY YEAR(criado_em), MONTH(criado_em)
      ORDER BY ano ASC, mes ASC`,
  );

  const growthMap = new Map(
    growthRows.map((r) => [
      `${r.ano}-${String(r.mes).padStart(2, "0")}`,
      Number(r.total) || 0,
    ]),
  );

  const growth = [];
  for (let i = 3; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    growth.push({
      key: monthKey(date),
      label: monthLabel(date),
      total: growthMap.get(monthKey(date)) || 0,
    });
  }

  const courseUsage = await safeQuery(
    `SELECT
        c.id_curso,
        c.nome,
        COUNT(e.id_entrega) AS entregas
       FROM cursos c
       LEFT JOIN tarefas t ON t.id_curso = c.id_curso
       LEFT JOIN entregas e ON e.id_tarefa = t.id_tarefa
      GROUP BY c.id_curso, c.nome
      ORDER BY entregas DESC, c.nome ASC
      LIMIT 4`,
  );

  const maxCourseUsage = Math.max(
    1,
    ...courseUsage.map((item) => Number(item.entregas) || 0),
  );

  const activities = await safeQuery(
    `SELECT tipo, titulo, subtitulo, evento_em
       FROM (
         SELECT
           'school' AS tipo,
           'Nova escola cadastrada' AS titulo,
           CONCAT(e.nome, ' · ', COALESCE(e.cidade, ''), 
                  CASE WHEN e.estado IS NULL OR e.estado = '' THEN '' ELSE CONCAT('/', e.estado) END) AS subtitulo,
           e.data_cadastro AS evento_em
         FROM escolas e

         UNION ALL

         SELECT
           'user' AS tipo,
           'Novo usuário cadastrado' AS titulo,
           CONCAT(u.nome, ' · ', COALESCE(p.nome, 'Perfil')) AS subtitulo,
           u.criado_em AS evento_em
         FROM usuarios u
         LEFT JOIN perfis p ON p.id_perfil = u.id_perfil

         UNION ALL

         SELECT
           'payment' AS tipo,
           'Pagamento registrado' AS titulo,
           CONCAT(e.nome, ' · ', 'R$ ', FORMAT(pg.valor, 2, 'pt_BR')) AS subtitulo,
           pg.data_pagamento AS evento_em
         FROM pagamentos pg
         INNER JOIN escolas e ON e.id_escola = pg.id_escola
      ) AS eventos
      ORDER BY evento_em DESC
      LIMIT 8`,
  );

  const paymentByStatus = {
    pago: { quantidade: 0, valor: 0 },
    pendente: { quantidade: 0, valor: 0 },
    outros: { quantidade: 0, valor: 0 },
  };

  for (const item of paymentSummary) {
    const key = item.status === "pago"
      ? "pago"
      : item.status === "pendente"
        ? "pendente"
        : "outros";

    paymentByStatus[key].quantidade += Number(item.quantidade) || 0;
    paymentByStatus[key].valor += Number(item.valor) || 0;
  }

  return {
    success: true,
    data: {
      admin: {
        id: admins[0].id_usuario,
        nome: admins[0].nome || "",
        email: admins[0].email || "",
      },
      period: {
        label: now.toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
        }),
      },
      stats: {
        escolasTotal,
        alunosTotal,
        professoresTotal,
        xpTotal,
        mrr,
        alunosNovosMes,
        professoresNovosMes,
        mrrTrend,
      },
      topSchools: topSchools.map((school) => ({
        id: school.id_escola,
        name: school.nome,
        location: [school.cidade, school.estado].filter(Boolean).join(" · "),
        students: Number(school.alunos) || 0,
        completion: Number(school.conclusao) || 0,
      })),
      payments: {
        paid: paymentByStatus.pago,
        pending: paymentByStatus.pendente,
        other: paymentByStatus.outros,
        mrr,
        mrrFormatted: formatCurrency(mrr),
        previousMrr,
        previousMrrFormatted: formatCurrency(previousMrr),
      },
      growth,
      courseUsage: courseUsage.map((course) => ({
        id: course.id_curso,
        name: course.nome,
        deliveries: Number(course.entregas) || 0,
        percentage: Math.round(
          ((Number(course.entregas) || 0) / maxCourseUsage) * 100,
        ),
      })),
      activities: activities.map((activity) => ({
        type: activity.tipo,
        title: activity.titulo,
        subtitle: activity.subtitulo || "",
        time: formatRelative(activity.evento_em),
      })),
    },
  };
}

module.exports = { getDashboardAdminGeral };
