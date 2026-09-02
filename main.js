const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const basePath = path.join(__dirname, "App");
require(path.join(basePath, "./backend/connection.js"));

const db = require(path.join(basePath, "backend/connection.js"));

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  win.loadFile(
    path.join(basePath, "frontend/user/monetto-landing/monetto-landing.html"),
  );
  win.webContents.openDevTools();
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ====================== IPC Handlers ======================

// Resolves the id_escola for a given logged-in user. Every "list" handler
// below uses this so a school admin can only ever see rows that belong to
// their own school, regardless of what the renderer asks for.
async function resolveEscolaId(db, currentUserId) {
  if (!currentUserId) return null;
  const [rows] = await db
    .promise()
    .execute(
      "SELECT id_escola FROM usuarios WHERE id_usuario = ? AND ativo = 1 LIMIT 1",
      [currentUserId],
    );
  return rows[0] && rows[0].id_escola ? rows[0].id_escola : null;
}

ipcMain.handle("registerUser", async (event, dados) => {
  try {
    console.log("📝 Tentando cadastrar usuário:", dados.email);

    if (!dados.nome || !dados.email || !dados.senha || !dados.id_perfil) {
      return { success: false, message: "Todos os campos são obrigatórios." };
    }

    // Check if email already exists
    const [existing] = await db
      .promise()
      .execute("SELECT id_usuario FROM usuarios WHERE email = ?", [
        dados.email,
      ]);

    if (existing.length > 0) {
      return { success: false, message: "Este email já está cadastrado." };
    }

    const seed = await bcrypt.genSalt(10);
    const senha_hash = await bcrypt.hash(dados.senha, seed);

    const id_usuario = uuidv4();

    const sql = `
        INSERT INTO usuarios 
        (id_usuario, id_perfil, nome, email, senha_hash, id_escola, ativo, criado_em)
        VALUES (?, ?, ?, ?, ?, ?, 1, NOW())
      `;

    await db
      .promise()
      .execute(sql, [
        id_usuario,
        dados.id_perfil,
        dados.nome,
        dados.email,
        senha_hash,
        dados.id_escola || null,
      ]);

    console.log("✅ Usuário criado com sucesso!");

    return {
      success: true,
      message: "Conta criada com sucesso! Você já pode fazer login.",
    };
  } catch (err) {
    console.error("❌ ERRO AO CADASTRAR:", err);
    return {
      success: false,
      message: "Erro ao criar conta. Tente novamente.",
    };
  }
});

ipcMain.handle("login", async (event, { email, senha }) => {
  try {
    const db = require(path.join(basePath, "backend/connection.js"));
    const [rows] = await db
      .promise()
      .execute(
        "SELECT id_usuario, nome, email, id_perfil, id_escola, senha_hash FROM usuarios WHERE email = ? AND ativo = 1",
        [email],
      );
    if (rows.length === 0)
      return { success: false, message: "Email ou senha incorretos." };

    const user = rows[0];
    const senhaCorreta = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaCorreta)
      return { success: false, message: "Email ou senha incorretos." };

    // Track last-login time (used by the "inactive students" dashboard stat)
    db.promise()
      .execute(
        "UPDATE usuarios SET ultimo_acesso = NOW() WHERE id_usuario = ?",
        [user.id_usuario],
      )
      .catch((e) => console.warn("Failed to update ultimo_acesso:", e.message));

    let redirect =
      "../../admin_general/dashboard-admin-geral/dashboard-admin-geral.html";
    if (user.id_perfil === 1)
      redirect = "../../frontend/student/dashboard-aluno/dashboard-aluno.html";
    if (user.id_perfil === 2)
      redirect =
        "../../frontend/teacher/dashboard-professor/dashboard-professor.html";
    if (user.id_perfil === 3)
      redirect =
        "../../frontend/admin_school/dashboard-admin-escolar/dashboard-admin-escolar.html";

    // Return the logged-in user's data so the frontend can save it as the "session"
    // (id_escola in particular is required by every school-admin screen).
    return {
      success: true,
      message: "Login realizado com sucesso!",
      redirect,
      user: {
        id: user.id_usuario,
        id_usuario: user.id_usuario,
        nome: user.nome,
        email: user.email,
        id_perfil: user.id_perfil,
        id_escola: user.id_escola,
      },
    };
  } catch (err) {
    console.error("Login Error:", err);
    return { success: false, message: "Erro no servidor." };
  }
});

ipcMain.handle("registerAluno", async (event, dados) => {
  try {
    const { registerAluno } = require(
      path.join(basePath, "backend/create_aluno.js"),
    );
    return await registerAluno(dados);
  } catch (err) {
    console.error("registerAluno Error:", err);
    return { success: false, message: "Erro ao cadastrar aluno." };
  }
});

ipcMain.handle("registerProfessor", async (event, dados) => {
  try {
    const { registerProfessor } = require(
      path.join(basePath, "backend/create_professor.js"),
    );
    return await registerProfessor(dados);
  } catch (err) {
    console.error("registerProfessor Error:", err);
    return { success: false, message: "Erro ao cadastrar professor." };
  }
});

ipcMain.handle("addAlunoToTurma", async (event, dados) => {
  try {
    const { addAlunoToTurma } = require(
      path.join(basePath, "backend/add_aluno_to_turma.js"),
    );
    return await addAlunoToTurma(dados);
  } catch (err) {
    console.error("addAlunoToTurma Error:", err);
    return { success: false, message: "Erro ao adicionar aluno à turma." };
  }
});

ipcMain.handle("getAlunos", async (event, currentUserId) => {
  try {
    const db = require(path.join(basePath, "backend/connection.js"));

    const escolaId = await resolveEscolaId(db, currentUserId);
    if (!escolaId) {
      return {
        success: false,
        message: "Usuário não está associado a uma escola.",
      };
    }

    const [rows] = await db.promise().execute(
      `SELECT id_usuario, nome, email, ativo
       FROM usuarios
       WHERE id_perfil = 1 AND id_escola = ?
       ORDER BY nome ASC`,
      [escolaId],
    );
    return { success: true, data: rows };
  } catch (err) {
    console.error("getAlunos Error:", err);
    return { success: false, message: "Erro ao buscar alunos." };
  }
});

ipcMain.handle("getProfessores", async (event, currentUserId) => {
  try {
    const db = require(path.join(basePath, "backend/connection.js"));

    const escolaId = await resolveEscolaId(db, currentUserId);
    if (!escolaId) {
      return {
        success: false,
        message: "Usuário não está associado a uma escola.",
      };
    }

    const [rows] = await db.promise().execute(
      `SELECT u.id_usuario, u.nome, u.email, u.ativo,
              (SELECT COUNT(*) FROM turmas t WHERE t.id_professor = u.id_usuario AND t.status = 'ativa') AS turmas_count,
              (SELECT COUNT(*) FROM usuarios a
                 WHERE a.id_perfil = 1 AND a.ativo = 1
                   AND a.id_turma IN (SELECT id_turma FROM turmas t WHERE t.id_professor = u.id_usuario)) AS alunos_count
       FROM usuarios u
       WHERE u.id_perfil = 2 AND u.id_escola = ?
       ORDER BY u.nome ASC`,
      [escolaId],
    );
    return { success: true, data: rows };
  } catch (err) {
    console.error("getProfessores Error:", err);
    return { success: false, message: "Erro ao buscar professores." };
  }
});

ipcMain.handle("getAdmins", async (event, currentUserId) => {
  try {
    const db = require(path.join(basePath, "backend/connection.js"));

    const escolaId = await resolveEscolaId(db, currentUserId);
    if (!escolaId) {
      return {
        success: false,
        message: "Usuário não está associado a uma escola.",
      };
    }

    const [rows] = await db.promise().execute(
      `SELECT id_usuario, nome, email, ativo, criado_em
       FROM usuarios
       WHERE id_perfil = 3 AND id_escola = ?
       ORDER BY nome ASC`,
      [escolaId],
    );
    return { success: true, data: rows };
  } catch (err) {
    console.error("getAdmins Error:", err);
    return { success: false, message: "Erro ao buscar administradores." };
  }
});

ipcMain.handle("getCursos", async () => {
  try {
    const db = require(path.join(basePath, "backend/connection.js"));
    const [rows] = await db
      .promise()
      .execute("SELECT id_curso, nome FROM cursos ORDER BY nome ASC");
    return { success: true, data: rows };
  } catch (err) {
    console.error("getCursos Error:", err);
    return { success: false, message: "Erro ao buscar disciplinas." };
  }
});

ipcMain.handle("registerTarefa", async (event, dados) => {
  try {
    const db = require(path.join(basePath, "backend/connection.js"));

    const [result] = await db.promise().execute(
      `INSERT INTO tarefas (id_escola, id_curso, titulo, descricao, data_criacao, data_vencimento, status)
       VALUES (?, ?, ?, ?, CURDATE(), ?, 'pendente')`,
      [
        dados.id_escola,
        dados.id_curso,
        dados.titulo,
        dados.descricao,
        dados.data_vencimento,
      ],
    );

    return {
      success: true,
      message: "Tarefa criada com sucesso!",
      id: result.insertId,
    };
  } catch (err) {
    console.error("registerTarefa Error:", err);
    return { success: false, message: "Erro ao criar tarefa." };
  }
});

ipcMain.handle("updateAdmin", async (event, dados) => {
  try {
    const db = require(path.join(basePath, "backend/connection.js"));

    const UpdateQuery = `UPDATE usuarios
       SET nome = ?, email = ?
       WHERE id_usuario = ?`;
    const [result] = await db
      .promise()
      .execute(UpdateQuery, [dados.nome, dados.email, dados.id_usuario]);
    return { success: true, message: "Administrador atualizado com sucesso!" };
  } catch (err) {
    console.error("updateAdmin Error:", err);
    return { success: false, message: "Erro ao atualizar administrador." };
  }
});

ipcMain.handle("updateEscola", async (event, dados) => {
  try {
    const db = require(path.join(basePath, "backend/connection.js"));

    const UpdateQuery = `UPDATE escolas
       SET nome = ?, email = ?, telefone = ?, endereco = ?, cnpj = ?
       WHERE id_escola = ?`;
    const [result] = await db
      .promise()
      .execute(UpdateQuery, [
        dados.nome,
        dados.email,
        dados.telefone,
        dados.endereco,
        dados.cnpj,
        dados.id_escola,
      ]);
    return { success: true, message: "Escola atualizada com sucesso!" };
  } catch (err) {
    console.error("updateEscola Error:", err);
    return { success: false, message: "Erro ao atualizar escola." };
  }
});

ipcMain.handle("getTarefas", async (event, currentUserId) => {
  try {
    const db = require(path.join(basePath, "backend/connection.js"));

    const escolaId = await resolveEscolaId(db, currentUserId);
    if (!escolaId) {
      return {
        success: false,
        message: "Usuário não está associado a uma escola.",
      };
    }

    const [rows] = await db.promise().execute(
      `SELECT 
        t.id_tarefa,
        t.titulo,
        t.descricao,
        t.data_criacao,
        t.data_vencimento,
        t.status,
        c.nome AS disciplina
       FROM tarefas t
       LEFT JOIN cursos c ON t.id_curso = c.id_curso
       WHERE t.id_escola = ?
       ORDER BY t.data_vencimento ASC`,
      [escolaId],
    );
    return { success: true, data: rows };
  } catch (err) {
    console.error("getTarefas Error:", err);
    return { success: false, message: "Erro ao buscar tarefas." };
  }
});

ipcMain.handle("getNiveis", async () => {
  try {
    const db = require(path.join(basePath, "backend/connection.js"));
    const [rows] = await db
      .promise()
      .execute(
        "SELECT id_nivel, nome FROM niveis_educacionais WHERE ativo = 1 ORDER BY ordem_nivel ASC",
      );
    return { success: true, data: rows };
  } catch (err) {
    console.error("getNiveis Error:", err);
    return { success: false, message: "Erro ao buscar níveis." };
  }
});

ipcMain.handle("registerTurma", async (event, dados) => {
  try {
    const db = require(path.join(basePath, "backend/connection.js"));
    const [result] = await db.promise().execute(
      `INSERT INTO turmas (id_escola, id_professor, id_nivel, nome_turma, ano_letivo, status)
       VALUES (?, ?, ?, ?, YEAR(CURDATE()), 'ativa')`,
      [dados.id_escola, dados.id_professor, dados.id_nivel, dados.nome_turma],
    );
    return {
      success: true,
      message: "Turma criada com sucesso!",
      id: result.insertId,
    };
  } catch (err) {
    console.error("registerTurma Error:", err);
    return {
      success: false,
      message: "Erro ao criar turma: " + err.sqlMessage,
    };
  }
});

ipcMain.handle("getTurmas", async (event, currentUserId) => {
  try {
    const db = require(path.join(basePath, "backend/connection.js"));

    const escolaId = await resolveEscolaId(db, currentUserId);

    if (!escolaId) {
      return {
        success: false,
        message: "Usuário não está associado a uma escola.",
      };
    }

    const [rows] = await db.promise().execute(
      `SELECT 
        t.id_turma,
        t.nome_turma,
        t.ano_letivo,
        t.status,
        t.id_professor,
        u.nome AS professor_nome,
        u.email AS professor_email,
        n.nome AS nivel
      FROM turmas t
      LEFT JOIN usuarios u 
        ON t.id_professor = u.id_usuario
        AND u.id_perfil = 2
      LEFT JOIN niveis_educacionais n 
        ON t.id_nivel = n.id_nivel
      WHERE t.id_escola = ?
      ORDER BY t.nome_turma ASC`,
      [escolaId],
    );

    return {
      success: true,
      data: rows,
    };
  } catch (err) {
    console.error("getTurmas Error:", err);

    return {
      success: false,
      message: "Erro ao buscar turmas.",
    };
  }
});

ipcMain.handle("getSchools", async () => {
  const db = require(path.join(basePath, "backend/connection.js"));
  try {
    const [escolas] = await db.promise().execute(`
      SELECT id_escola, nome
      FROM escolas
      ORDER BY nome ASC
    `);
    console.log("Escolas encontradas:", escolas);
    return escolas;
  } catch (error) {
    console.error("Erro ao buscar escolas:", error);
    return [];
  }
});

// ============================================================
// DASHBOARD ADMIN ESCOLAR – dados agregados do banco
// ============================================================
ipcMain.handle("getDashboardAdminEscolar", async (event, currentUserId) => {
  try {
    const db = require(path.join(basePath, "backend/connection.js"));

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

    let escolaNome = "Escola";
    let escolaSub = "";
    try {
      const [escolas] = await db
        .promise()
        .execute(
          `SELECT nome, cidade, estado FROM escolas WHERE id_escola = ? LIMIT 1`,
          [escolaId],
        );
      if (escolas[0]) {
        escolaNome = escolas[0].nome;
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
});

/**
 * IPC handler: getDashboardTeacher
 * Place this in main.js (or wherever the other ipcMain.handle dashboard handlers live).
 * Frontend expects the shape documented at the bottom.
 */
ipcMain.handle("getDashboardTeacher", async (event, currentUserId) => {
  try {
    const db = require(path.join(basePath, "backend/connection.js"));

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

    // ---- Professor info ----
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

    // Turmas deste professor
    const turmasTotal = await safeCount(
      `SELECT COUNT(*) AS total FROM turmas
       WHERE status = 'ativa' AND id_escola = ? AND id_professor = ?`,
      [escolaId, currentUserId],
    );

    // Alunos nas turmas deste professor
    const alunosAtivos = await safeCount(
      `SELECT COUNT(*) AS total FROM usuarios u
       INNER JOIN turmas t ON u.id_turma = t.id_turma
       WHERE u.id_perfil = 1 AND u.ativo = 1 AND u.id_escola = ?
         AND t.id_professor = ? AND t.id_escola = ?`,
      [escolaId, currentUserId, escolaId],
    );

    // Tarefas publicadas pelo professor (ajusta coluna se o schema for diferente)
    const tarefasAtivas = await safeCount(
      `SELECT COUNT(*) AS total FROM tarefas
       WHERE id_escola = ? AND (id_professor = ? OR id_usuario = ?)`,
      [escolaId, currentUserId, currentUserId],
    );

    // Taxa de conclusão: alunos com pelo menos 1 entrega / alunos (proxy)
    // Se não houver tabela de entregas, usa vínculo a turma como proxy
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

    // Avaliação média (se existir tabela de avaliações/feedback)
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

    // ---- Turmas (Minhas Turmas) ----
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

    // ---- Atividades recentes (escopo do professor) ----
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

    // ---- Conclusões por dia (últimos 7 dias) ----
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

    // ---- Top alunos da semana ----
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

    // ---- Tarefas pendentes ----
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
});

function formatRelative(dateVal) {
  if (!dateVal) return "—";
  try {
    const d = new Date(dateVal);
    if (Number.isNaN(d.getTime())) return "—";
    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "agora";
    if (mins < 60) return "há " + mins + "min";
    const hours = Math.floor(mins / 60);
    if (hours < 24) return "há " + hours + "h";
    const days = Math.floor(hours / 24);
    if (days === 1) return "ontem";
    if (days < 30) return "há " + days + "d";
    return d.toLocaleDateString("pt-BR");
  } catch (_) {
    return "—";
  }
}

ipcMain.handle("atribuirProfessorATurma", async (event, dados) => {
  const connection = require(path.join(basePath, "backend/connection.js"));

  try {
    const { id_turma, id_professor } = dados;

    console.log("Atribuindo professor:", {
      id_turma,
      id_professor,
    });

    if (!id_turma || !id_professor) {
      return {
        success: false,
        message: "Turma e professor são obrigatórios.",
      };
    }

    const sql = `
      UPDATE turmas
      SET id_professor = ?
      WHERE id_turma = ?
    `;

    const [result] = await connection
      .promise()
      .query(sql, [id_professor, id_turma]);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: "Turma não encontrada.",
      };
    }

    return {
      success: true,
      message: "Professor atribuído com sucesso.",
    };
  } catch (error) {
    console.error("Error in atribuirProfessorATurma:", error);

    return {
      success: false,
      message: "Erro ao atribuir professor: " + error.message,
    };
  }
});
