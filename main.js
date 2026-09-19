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
    const { registerUser } = require(
      path.join(basePath, "backend/create_user.js"),
    );
    return await registerUser(dados);
  } catch (err) {
    console.error("registerUser Error:", err);
    return { success: false, message: "Erro ao cadastrar usuário." };
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

    db.promise()
      .execute(
        "UPDATE usuarios SET ultimo_acesso = NOW() WHERE id_usuario = ?",
        [user.id_usuario],
      )
      .catch((e) => console.warn("Failed to update ultimo_acesso:", e.message));

    let redirect = null;
    if (user.id_perfil === 1) {
      redirect = "../student/dashboard-aluno/dashboard-aluno.html";
    } else if (user.id_perfil === 2) {
      redirect = "../teacher/dashboard-professor/dashboard-professor.html";
    } else if (user.id_perfil === 3) {
      redirect =
        "../admin_school/dashboard-admin-escolar/dashboard-admin-escolar.html";
    }

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
    const { getAluno } = require(path.join(basePath, "backend/get_aluno.js"));
    return await getAluno(currentUserId);
  } catch (err) {
    console.error("addAlunoToTurma Error:", err);
    return { success: false, message: "Erro ao adicionar aluno à turma." };
  }
});

ipcMain.handle("getAlunosProfessor", async (event, currentUserId) => {
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

    let rows;
    try {
      const [r] = await db.promise().execute(
        `SELECT u.id_usuario, u.nome, u.email, u.ativo,
                t.id_turma, t.nome_turma AS turma,
                COALESCE(pa.xp_atual, 0) AS xp
         FROM usuarios u
         INNER JOIN turmas t ON u.id_turma = t.id_turma
         LEFT JOIN progresso_aluno pa ON pa.id_aluno = u.id_usuario
         WHERE u.id_perfil = 1 AND u.id_escola = ?
           AND t.id_professor = ? AND t.id_escola = ?
         ORDER BY t.nome_turma ASC, u.nome ASC`,
        [escolaId, currentUserId, escolaId],
      );
      rows = r;
    } catch (e) {
      console.warn("getAlunosProfessor join failed:", e.message);
      const [r] = await db.promise().execute(
        `SELECT u.id_usuario, u.nome, u.email, u.ativo,
                t.id_turma, t.nome_turma AS turma
         FROM usuarios u
         INNER JOIN turmas t ON u.id_turma = t.id_turma
         WHERE u.id_perfil = 1 AND u.id_escola = ?
           AND t.id_professor = ?
         ORDER BY u.nome ASC`,
        [escolaId, currentUserId],
      );
      rows = r;
    }

    const total = rows.length;
    const ativos = rows.filter((a) => a.ativo == 1 || a.ativo === true).length;
    const comTurma = rows.filter((a) => a.turma).length;
    const taxa = total > 0 ? Math.round((comTurma / total) * 100) : 0;

    const turmasMap = new Map();
    for (const a of rows) {
      if (a.id_turma && a.turma) turmasMap.set(a.id_turma, a.turma);
    }

    return {
      success: true,
      data: rows,
      stats: {
        total,
        ativos,
        atencao: Math.max(0, total - ativos),
        taxaConclusao: taxa,
        turmasCount: turmasMap.size,
      },
      turmas: Array.from(turmasMap.entries()).map(([id, nome]) => ({
        id,
        nome,
      })),
    };
  } catch (err) {
    console.error("getAlunosProfessor Error:", err);
    return { success: false, message: "Erro ao buscar alunos do professor." };
  }
});

ipcMain.handle("getProfessores", async (event, currentUserId) => {
  try {
    const { getProfessores } = require(
      path.join(basePath, "backend/get_professores.js"),
    );
    return await getProfessores(currentUserId);
  } catch (err) {
    console.error("getProfessores Error:", err);
    return { success: false, message: "Erro ao buscar professores." };
  }
});

ipcMain.handle("getAdmins", async (event, currentUserId) => {
  try {
    const { getAdmins } = require(path.join(basePath, "backend/get_admins.js"));
    return await getAdmins(currentUserId);
  } catch (err) {
    console.error("getAdmins Error:", err);
    return { success: false, message: "Erro ao buscar administradores." };
  }
});

ipcMain.handle("changeAdminPassword", async (event, dados) => {
  try {
    if (!dados?.id_usuario || !dados?.senhaAtual || !dados?.novaSenha) {
      return { success: false, message: "Preencha todos os campos de senha." };
    }
    if (String(dados.novaSenha).length < 6) {
      return {
        success: false,
        message: "A nova senha deve ter pelo menos 6 caracteres.",
      };
    }

    const escolaId = await resolveEscolaId(db, dados.id_usuario);
    if (!escolaId)
      return {
        success: false,
        message: "Administrador não está associado a uma escola.",
      };

    const [rows] = await db.promise().execute(
      `SELECT senha_hash FROM usuarios
       WHERE id_usuario = ? AND id_escola = ? AND id_perfil = 3 AND ativo = 1 LIMIT 1`,
      [dados.id_usuario, escolaId],
    );
    if (!rows.length)
      return { success: false, message: "Administrador não encontrado." };

    const ok = await bcrypt.compare(
      String(dados.senhaAtual),
      rows[0].senha_hash,
    );
    if (!ok)
      return { success: false, message: "A senha atual está incorreta." };

    const hash = await bcrypt.hash(String(dados.novaSenha), 10);
    await db
      .promise()
      .execute(
        `UPDATE usuarios SET senha_hash = ? WHERE id_usuario = ? AND id_escola = ? AND id_perfil = 3`,
        [hash, dados.id_usuario, escolaId],
      );

    return { success: true, message: "Senha alterada com sucesso!" };
  } catch (err) {
    console.error("changeAdminPassword Error:", err);
    return { success: false, message: "Erro ao alterar senha: " + err.message };
  }
});

ipcMain.handle("deleteTurma", async (event, dados) => {
  try {
    const { deleteTurma } = require(
      path.join(basePath, "backend/delete_turma.js"),
    );
    return await deleteTurma(dados);
  } catch (err) {
    console.error("deleteTurma Error:", err);
    return { success: false, message: "Erro ao excluir turma." };
  }
});

ipcMain.handle("getAdminReports", async (event, currentUserId) => {
  try {
    if (!currentUserId)
      return { success: false, message: "ID do usuário não informado." };

    const escolaId = await resolveEscolaId(db, currentUserId);
    if (!escolaId)
      return {
        success: false,
        message: "Usuário não está associado a uma escola.",
      };

    async function safeQuery(sql, params = []) {
      try {
        const [rows] = await db.promise().execute(sql, params);
        return rows;
      } catch (e) {
        console.warn(
          "getAdminReports query failed:",
          e.sqlMessage || e.message,
        );
        return [];
      }
    }

    async function safeOne(sql, params = []) {
      const rows = await safeQuery(sql, params);
      return rows[0] || {};
    }

    const school = await safeOne(
      `SELECT id_escola, nome, email, telefone, endereco, cnpj, cidade, estado
       FROM escolas WHERE id_escola = ? LIMIT 1`,
      [escolaId],
    );

    const students = await safeQuery(
      `SELECT u.id_usuario, u.nome, u.email, u.ativo, u.ultimo_acesso, u.id_turma,
              t.nome_turma AS turma,
              COALESCE(pa.xp_atual, 0) AS xp_atual,
              COALESCE(pa.pontos_totais, 0) AS pontos_totais,
              COALESCE(pa.nivel_atual, 0) AS nivel_atual,
              COALESCE(pa.percentual_conclusao, 0) AS percentual_conclusao
       FROM usuarios u
       LEFT JOIN turmas t ON t.id_turma = u.id_turma
       LEFT JOIN progresso_aluno pa ON pa.id_aluno = u.id_usuario
       WHERE u.id_perfil = 1 AND u.id_escola = ?
       ORDER BY u.nome ASC`,
      [escolaId],
    );

    const classes = await safeQuery(
      `SELECT t.id_turma, t.nome_turma, t.status, t.ano_letivo,
              COUNT(DISTINCT CASE WHEN u.id_perfil = 1 THEN u.id_usuario END) AS students
       FROM turmas t
       LEFT JOIN usuarios u ON u.id_turma = t.id_turma AND u.id_escola = ?
       WHERE t.id_escola = ?
       GROUP BY t.id_turma, t.nome_turma, t.status, t.ano_letivo
       ORDER BY t.nome_turma ASC`,
      [escolaId, escolaId],
    );

    let tasks = await safeQuery(
      `SELECT tar.id_tarefa, tar.titulo, tar.id_turma, tar.id_curso,
              tar.data_criacao, tar.data_entrega, tar.status,
              t.nome_turma AS turma, c.nome AS disciplina
       FROM tarefas tar
       LEFT JOIN turmas t ON t.id_turma = tar.id_turma
       LEFT JOIN cursos c ON c.id_curso = tar.id_curso
       WHERE tar.id_escola = ?
       ORDER BY tar.data_entrega ASC, tar.data_criacao DESC`,
      [escolaId],
    );

    if (!tasks.length) {
      tasks = await safeQuery(
        `SELECT tar.id_tarefa, tar.titulo, NULL AS id_turma, tar.id_curso,
                tar.data_criacao, tar.data_vencimento AS data_entrega, tar.status,
                NULL AS turma, c.nome AS disciplina
         FROM tarefas tar
         LEFT JOIN cursos c ON c.id_curso = tar.id_curso
         WHERE tar.id_escola = ?
         ORDER BY tar.data_vencimento ASC, tar.data_criacao DESC`,
        [escolaId],
      );
    }

    let deliveries = await safeQuery(
      `SELECT e.id_tarefa, e.id_usuario, e.criado_em,
              COALESCE(e.xp_ganho, 0) AS xp_ganho
       FROM entregas e
       INNER JOIN usuarios u ON u.id_usuario = e.id_usuario
       WHERE u.id_escola = ? AND u.id_perfil = 1`,
      [escolaId],
    );

    if (!deliveries.length) {
      deliveries = await safeQuery(
        `SELECT e.id_tarefa, e.id_usuario, e.criado_em, 0 AS xp_ganho
         FROM entregas e
         INNER JOIN usuarios u ON u.id_usuario = e.id_usuario
         WHERE u.id_escola = ? AND u.id_perfil = 1`,
        [escolaId],
      );
    }

    const deliveryKey = new Set(
      deliveries.map((e) => `${String(e.id_tarefa)}:${String(e.id_usuario)}`),
    );

    const activeStudents = students.filter(
      (s) => s.ativo == 1 || s.ativo === true,
    );

    const studentReports = students.map((s, index) => {
      const assigned = tasks.filter(
        (t) =>
          t.id_turma != null &&
          s.id_turma != null &&
          String(t.id_turma) === String(s.id_turma),
      );
      const completed = assigned.filter((t) =>
        deliveryKey.has(`${String(t.id_tarefa)}:${String(s.id_usuario)}`),
      );
      const progress = assigned.length
        ? Math.round((completed.length / assigned.length) * 100)
        : Number(s.percentual_conclusao) || 0;

      return {
        id: s.id_usuario,
        id_turma: s.id_turma,
        name: s.nome,
        email: s.email || "",
        turma: s.turma || "Sem turma",
        xp: Number(s.xp_atual) || Number(s.pontos_totais) || 0,
        nivel: Number(s.nivel_atual) || 0,
        tarefasFeitas: assigned.length
          ? completed.length
          : deliveries.filter(
              (e) => String(e.id_usuario) === String(s.id_usuario),
            ).length,
        tarefasTotal: assigned.length,
        progresso: Math.max(0, Math.min(100, progress)),
        ativo: s.ativo == 1 || s.ativo === true,
        ultimoAcesso: s.ultimo_acesso,
        avatarClass: `av${(index % 8) + 1}`,
      };
    });

    const classReports = classes.map((c) => {
      const classStudents = studentReports.filter(
        (s) =>
          students.find((raw) => String(raw.id_usuario) === String(s.id))
            ?.id_turma != null &&
          String(
            students.find((raw) => String(raw.id_usuario) === String(s.id))
              .id_turma,
          ) === String(c.id_turma),
      );
      const avg = classStudents.length
        ? Math.round(
            classStudents.reduce((sum, s) => sum + s.progresso, 0) /
              classStudents.length,
          )
        : 0;

      return {
        id: c.id_turma,
        name: c.nome_turma,
        students: Number(c.students) || 0,
        completion: avg,
        status: c.status || "",
        anoLetivo: c.ano_letivo,
      };
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeTasks = tasks.filter((t) => {
      const status = String(t.status || "").toLowerCase();
      if (
        [
          "concluida",
          "concluído",
          "concluido",
          "cancelada",
          "cancelado",
        ].includes(status)
      )
        return false;
      if (!t.data_entrega) return true;
      const d = new Date(t.data_entrega);
      return !Number.isNaN(d.getTime()) && d >= today;
    });

    const assignedPairs = [];
    for (const s of activeStudents) {
      for (const task of tasks) {
        if (
          task.id_turma != null &&
          s.id_turma != null &&
          String(task.id_turma) === String(s.id_turma)
        ) {
          assignedPairs.push([task.id_tarefa, s.id_usuario]);
        }
      }
    }
    const completedPairs = assignedPairs.filter(([taskId, studentId]) =>
      deliveryKey.has(`${String(taskId)}:${String(studentId)}`),
    );

    const completionRate = assignedPairs.length
      ? Math.round((completedPairs.length / assignedPairs.length) * 100)
      : activeStudents.length
        ? Math.round(
            activeStudents.reduce(
              (sum, s) => sum + (Number(s.percentual_conclusao) || 0),
              0,
            ) / activeStudents.length,
          )
        : 0;

    const totalXp =
      deliveries.reduce((sum, d) => sum + (Number(d.xp_ganho) || 0), 0) ||
      students.reduce((sum, s) => sum + (Number(s.xp_atual) || 0), 0);

    const riskStudents = studentReports
      .filter((s) => s.ativo && s.progresso < 50)
      .sort((a, b) => a.progresso - b.progresso);

    const taskReports = tasks.slice(0, 12).map((t) => {
      const target = activeStudents.filter(
        (s) =>
          t.id_turma != null &&
          s.id_turma != null &&
          String(s.id_turma) === String(t.id_turma),
      );
      const delivered = target.filter((s) =>
        deliveryKey.has(`${String(t.id_tarefa)}:${String(s.id_usuario)}`),
      ).length;
      return {
        id: t.id_tarefa,
        title: t.titulo || "Tarefa",
        turma: t.turma || "Toda a escola",
        disciplina: t.disciplina || "—",
        deadline: t.data_entrega,
        status: t.status,
        rate: target.length ? Math.round((delivered / target.length) * 100) : 0,
        delivered,
        total: target.length,
      };
    });

    const completionsChart = [];
    for (let i = 6; i >= 0; i--) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - i);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const value = deliveries.filter((e) => {
        const d = new Date(e.criado_em);
        return !Number.isNaN(d.getTime()) && d >= start && d < end;
      }).length;
      completionsChart.push({
        label: start
          .toLocaleDateString("pt-BR", { weekday: "short" })
          .replace(".", ""),
        value,
      });
    }

    const highlights = [...studentReports]
      .filter((s) => s.ativo)
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 3)
      .map((s) => ({
        ...s,
        tarefasFeitas: s.tarefasFeitas,
      }));

    return {
      success: true,
      data: {
        school,
        stats: {
          activeStudents: activeStudents.length,
          studentsTotal: students.length,
          teachers:
            Number(
              (
                await safeOne(
                  `SELECT COUNT(*) AS total FROM usuarios WHERE id_perfil = 2 AND ativo = 1 AND id_escola = ?`,
                  [escolaId],
                )
              ).total,
            ) || 0,
        },
        metrics: {
          students: activeStudents.length,
          completionRate,
          xpTotal: totalXp,
          activeTasks: activeTasks.length,
          riskCount: riskStudents.length,
        },
        classes: classReports,
        students: studentReports,
        tasks: taskReports,
        risks: riskStudents.slice(0, 8),
        highlights,
        completionsChart,
        deliveries,
        deliveryKeys: Array.from(deliveryKey),
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    console.error("getAdminReports Error:", err);
    return {
      success: false,
      message: "Erro ao carregar relatórios: " + err.message,
    };
  }
});

ipcMain.handle("getAdminProfile", async (event, currentUserId) => {
  try {
    const { getAdminProfile } = require(
      path.join(basePath, "backend/get_adminProfile.js"),
    );
    return await getAdminProfile(currentUserId);
  } catch (err) {
    console.error("getAdminProfile Error:", err);
    return { success: false, message: "Erro ao carregar perfil." };
  }
});

ipcMain.handle("getCursos", async () => {
  try {
    const { getCursos } = require(path.join(basePath, "backend/get_cursos.js"));
    return await getCursos();
  } catch (err) {
    console.error("getCursos Error:", err);
    return { success: false, message: "Erro ao buscar disciplinas." };
  }
});

ipcMain.handle("registerTarefa", async (event, dados) => {
  try {
    const { registerTarefa } = require(
      path.join(basePath, "backend/create_tarefa.js"),
    );
    return await registerTarefa(dados);
  } catch (err) {
    console.error("registerTarefa Error:", err);
    return { success: false, message: "Erro ao criar tarefa." };
  }
});

ipcMain.handle("updateEscola", async (event, dados) => {
  try {
    const { updateEscola } = require(
      path.join(basePath, "backend/update_escola.js"),
    );
    return await updateEscola(dados);
  } catch (err) {
    console.error("updateEscola Error:", err);
    return { success: false, message: "Erro ao atualizar escola." };
  }
});

ipcMain.handle("getTarefas", async (event, currentUserId) => {
  try {
    const { getTarefas } = require(
      path.join(basePath, "backend/get_tarefas.js"),
    );
    return await getTarefas(currentUserId);
  } catch (err) {
    console.error("getTarefas Error:", err);
    return { success: false, message: "Erro ao buscar tarefas." };
  }
});

ipcMain.handle("getNiveis", async () => {
  try {
    const { getNiveis } = require(path.join(basePath, "backend/get_niveis.js"));
    return await getNiveis();
  } catch (err) {
    console.error("getNiveis Error:", err);
    return { success: false, message: "Erro ao buscar níveis." };
  }
});

ipcMain.handle("registerTurma", async (event, dados) => {
  try {
    const db = require(path.join(basePath, "backend/connection.js"));
    const [rows] = await db
      .promise()
      .execute(
        "SELECT id_turma, nome_turma FROM turmas ORDER BY nome_turma ASC",
      );
    return { success: true, data: rows };
  } catch (err) {
    console.error("getTurmas Error:", err);
    return { success: false, message: "Erro ao buscar turmas." };
  }
});

ipcMain.handle("getTurmas", async (event, currentUserId) => {
  try {
    const { getTurmas } = require(path.join(basePath, "backend/get_turmas.js"));
    return await getTurmas(currentUserId);
  } catch (err) {
    console.error("getTurmas Error:", err);
    return { success: false, message: "Erro ao buscar turmas." };
  }
});

ipcMain.handle("getSchools", async () => {
  try {
    const { getSchools } = require(
      path.join(basePath, "backend/get_schools.js"),
    );
    return await getSchools();
  } catch (err) {
    console.error("getSchools Error:", err);
    return { success: false, message: "Erro ao buscar escolas." };
  }
});

ipcMain.handle("getDashboardAdminEscolar", async (event, currentUserId) => {
  try {
    const { getDashboardAdminEscolar } = require(
      path.join(basePath, "backend/get_dashboardAdminEscolar.js"),
    );
    return await getDashboardAdminEscolar(currentUserId);
  } catch (err) {
    console.error("getDashboardAdminEscolar Error:", err);
    return {
      success: false,
      message: "Erro ao buscar dashboard do admin escolar.",
    };
  }
});

ipcMain.handle("getDashboardTeacher", async (event, currentUserId) => {
  try {
    const { getDashboardTeacher } = require(
      path.join(basePath, "backend/get_dashboardTeacher.js"),
    );
    return await getDashboardTeacher(currentUserId);
  } catch (err) {
    console.error("getDashboardTeacher Error:", err);
    return {
      success: false,
      message: "Erro ao buscar dashboard do professor.",
    };
  }
});

ipcMain.handle("getStudentDashboard", async (event, studentId) => {
  try {
    const { getStudentDashboard } = require(
      path.join(basePath, "backend/get_student_dashboard.js"),
    );
    return await getStudentDashboard(studentId);
  } catch (err) {
    console.error("getStudentDashboard Error:", err);
    return { success: false, message: "Erro ao buscar dados do aluno." };
  }
});

ipcMain.handle("completeStudentTask", async (event, studentId, taskId) => {
  try {
    const { completeStudentTask } = require(
      path.join(basePath, "backend/get_student_dashboard.js"),
    );

    return await completeStudentTask(studentId, taskId);
  } catch (err) {
    console.error("completeStudentTask Error:", err);

    return {
      success: false,
      message: "Erro ao concluir tarefa.",
    };
  }
});

ipcMain.handle("awardStudentXp", async (event, studentId, amount, source) => {
  try {
    const { awardStudentXp } = require(
      path.join(basePath, "backend/get_student_dashboard.js"),
    );

    return await awardStudentXp(studentId, amount, source);
  } catch (err) {
    console.error("awardStudentXp Error:", err);

    return {
      success: false,
      message: "Erro ao registrar XP.",
    };
  }
});

ipcMain.handle("updateAluno", async (event, dados) => {
  try {
    if (!dados?.id_usuario || !dados?.nome || !dados?.email) {
      return {
        success: false,
        message: "Nome e e-mail são obrigatórios.",
      };
    }

    const [duplicado] = await db.promise().execute(
      `
      SELECT id_usuario
      FROM usuarios
      WHERE email = ?
        AND id_usuario <> ?
      LIMIT 1
      `,
      [String(dados.email).trim(), dados.id_usuario],
    );

    if (duplicado.length > 0) {
      return {
        success: false,
        message: "Este e-mail já está em uso.",
      };
    }

    const [result] = await db.promise().execute(
      `
      UPDATE usuarios
      SET nome = ?,
          email = ?
      WHERE id_usuario = ?
        AND id_perfil = 1
        AND ativo = 1
      `,
      [String(dados.nome).trim(), String(dados.email).trim(), dados.id_usuario],
    );

    if (!result.affectedRows) {
      return {
        success: false,
        message: "Aluno não encontrado.",
      };
    }

    return {
      success: true,
      message: "Perfil atualizado com sucesso!",
    };
  } catch (err) {
    console.error("updateAluno Error:", err);

    return {
      success: false,
      message: "Erro ao atualizar perfil: " + err.message,
    };
  }
});

ipcMain.handle("changeAlunoPassword", async (event, dados) => {
  try {
    if (!dados?.id_usuario || !dados?.senhaAtual || !dados?.novaSenha) {
      return {
        success: false,
        message: "Preencha todos os campos de senha.",
      };
    }

    if (String(dados.novaSenha).length < 6) {
      return {
        success: false,
        message: "A nova senha deve ter pelo menos 6 caracteres.",
      };
    }

    const [rows] = await db.promise().execute(
      `
      SELECT senha_hash
      FROM usuarios
      WHERE id_usuario = ?
        AND id_perfil = 1
        AND ativo = 1
      LIMIT 1
      `,
      [dados.id_usuario],
    );

    if (!rows.length) {
      return {
        success: false,
        message: "Aluno não encontrado.",
      };
    }

    const senhaCorreta = await bcrypt.compare(
      String(dados.senhaAtual),
      rows[0].senha_hash,
    );

    if (!senhaCorreta) {
      return {
        success: false,
        message: "A senha atual está incorreta.",
      };
    }

    const hash = await bcrypt.hash(String(dados.novaSenha), 10);

    await db.promise().execute(
      `
      UPDATE usuarios
      SET senha_hash = ?
      WHERE id_usuario = ?
        AND id_perfil = 1
      `,
      [hash, dados.id_usuario],
    );

    return {
      success: true,
      message: "Senha alterada com sucesso!",
    };
  } catch (err) {
    console.error("changeAlunoPassword Error:", err);

    return {
      success: false,
      message: "Erro ao alterar senha: " + err.message,
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
  try {
    const { atribuirProfessorATurma } = require(
      path.join(basePath, "backend/add_professor_to_turma.js"),
    );
    return await atribuirProfessorATurma(dados);
  } catch (err) {
    console.error("atribuirProfessorATurma Error:", err);
    return {
      success: false,
      message: "Erro ao atribuir professor à turma.",
    };
  }
});
