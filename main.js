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
    } else if (user.id_perfil === 4) {
      redirect = "../admin_general/dashboard-admin-geral/dashboard-admin-geral.html";
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
    const { getAlunosProfessor } = require(
      path.join(basePath, "backend/get_alunosProfessor.js"),
    );
    return await getAlunosProfessor(currentUserId);
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

ipcMain.handle("updateAdmin", async (event, dados) => {
  try {
    const { updateAdmin } = require(
      path.join(basePath, "backend/update_admin.js"),
    );
    return await updateAdmin(dados);
  } catch (err) {
    console.error("updateAdmin Error:", err);
    return { success: false, message: "Erro ao atualizar perfil." };
  }
});

ipcMain.handle("changeAdminPassword", async (event, dados) => {
  try {
    const { changeAdminPassword } = require(
      path.join(basePath, "backend/change_adminPassword.js"),
    );
    return await changeAdminPassword(dados);
  } catch (err) {
    console.error("changeAdminPassword Error:", err);
    return { success: false, message: "Erro ao alterar senha." };
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
    const { getAdminReports } = require(
      path.join(basePath, "backend/get_adminReports.js"),
    );
    return await getAdminReports(currentUserId);
  } catch (err) {
    console.error("getAdminReports Error:", err);
    return { success: false, message: "Erro ao buscar relatórios." };
  }
});

ipcMain.handle("getAdminProfile", async (event, currentUserId) => {

  console.log("🔥 MAIN: getAdminProfile recebido");
  console.log("🔥 MAIN ID:", currentUserId);

  try {

    const { getAdminProfile } = require(
      path.join(basePath, "backend/get_adminProfile.js")
    );

    console.log("🔥 MAIN: chamando backend");

    return await getAdminProfile(currentUserId);

  } catch (err) {

    console.error("🔥 MAIN ERRO:", err);

    return {
      success: false,
      message: "Erro ao carregar perfil: " + err.message
    };
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
    const { updateAluno } = require(
      path.join(basePath, "backend/update_aluno.js"),
    );

    return await updateAluno(dados);
  } catch (err) {
    console.error("updateAluno Error:", err);

    return {
      success: false,
      message: "Erro ao atualizar perfil.",
    };
  }
});

ipcMain.handle("changeAlunoPassword", async (event, dados) => {
  try {
    const { changeAlunoPassword } = require(
      path.join(basePath, "backend/change_alunoPassword.js"),
    );

    return await changeAlunoPassword(dados);
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

ipcMain.handle("getDashboardAdminGeral", async (event, currentUserId) => {
  try {
    const { getDashboardAdminGeral } = require(
      path.join(basePath, "backend/get_dashboardAdminGeral.js"),
    );
    return await getDashboardAdminGeral(currentUserId);
  } catch (err) {
    console.error("getDashboardAdminGeral Error:", err);
    return { success: false, message: "Erro ao buscar dashboard do administrador geral." };
  }
});
