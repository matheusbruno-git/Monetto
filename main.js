const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const bcrypt = require('bcryptjs');

const basePath = path.join(__dirname, 'App');
require(path.join(basePath, './backend/connection.js'));

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  win.loadFile(path.join(basePath, 'frontend/user/monetto-landing/monetto-landing.html'));
  win.webContents.openDevTools();
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// ====================== IPC Handlers ======================

ipcMain.handle('registerUser', async (event, dados) => {
  try {
    const { registerUser } = require(path.join(basePath, 'backend/create_user.js'));
    return await registerUser(dados);
  } catch (err) {
    console.error("RegisterUser Error:", err);
    return { success: false, message: "Erro ao criar conta." };
  }
});

ipcMain.handle('login', async (event, { email, senha }) => {
  try {
    const db = require(path.join(basePath, 'backend/connection.js'));
    const [rows] = await db.promise().execute(
      'SELECT id_usuario, nome, id_perfil, senha_hash FROM usuarios WHERE email = ? AND ativo = 1',
      [email]
    );
    if (rows.length === 0) return { success: false, message: "Email ou senha incorretos." };

    const user = rows[0];
    const senhaCorreta = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaCorreta) return { success: false, message: "Email ou senha incorretos." };

    let redirect = '../../admin_general/dashboard-admin-geral/dashboard-admin-geral.html';
    if (user.id_perfil === 1) redirect = '../../frontend/student/dashboard-aluno/dashboard-aluno.html';
    if (user.id_perfil === 2) redirect = '../../frontend/teacher/dashboard-professor/dashboard-professor.html';
    if (user.id_perfil === 3) redirect = '../../frontend/admin_school/dashboard-admin-escolar/dashboard-admin-escolar.html';

    return { success: true, message: "Login realizado com sucesso!", redirect };
  } catch (err) {
    console.error("Login Error:", err);
    return { success: false, message: "Erro no servidor." };
  }
});

ipcMain.handle('getAlunos', async () => {
  try {
    const db = require(path.join(basePath, 'backend/connection.js'));
    const [rows] = await db.promise().execute(
      `SELECT id_usuario, nome, email, ativo
       FROM usuarios
       WHERE id_perfil = 1
       ORDER BY nome ASC`
    );
    return { success: true, data: rows };  // ← only this line was wrong
  } catch (err) {
    console.error("getAlunos Error:", err);
    return { success: false, message: "Erro ao buscar alunos." };
  }
});

// Fetch courses for the discipline dropdown
ipcMain.handle('getCursos', async () => {
  try {
    const db = require(path.join(basePath, 'backend/connection.js'));
    const [rows] = await db.promise().execute(
      'SELECT id_curso, nome FROM cursos ORDER BY nome ASC'
    );
    return { success: true, data: rows };
  } catch (err) {
    console.error("getCursos Error:", err);
    return { success: false, message: "Erro ao buscar disciplinas." };
  }
});

// Fix registerTarefa — old backend had a bug (passed too many params)
ipcMain.handle('registerTarefa', async (event, dados) => {
  try {
    const db = require(path.join(basePath, 'backend/connection.js'));

    const [result] = await db.promise().execute(
      `INSERT INTO tarefas (id_escola, id_curso, titulo, descricao, data_criacao, data_vencimento, status)
       VALUES (?, ?, ?, ?, CURDATE(), ?, 'pendente')`,
      [
        dados.id_escola,
        dados.id_curso,
        dados.titulo,
        dados.descricao,
        dados.data_vencimento
      ]
    );

    return { success: true, message: "Tarefa criada com sucesso!", id: result.insertId };
  } catch (err) {
    console.error("registerTarefa Error:", err);
    return { success: false, message: "Erro ao criar tarefa." };
  }
});

ipcMain.handle('getTarefas', async () => {
  try {
    const db = require(path.join(basePath, 'backend/connection.js'));
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
       ORDER BY t.data_vencimento ASC`
    );
    return { success: true, data: rows };
  } catch (err) {
    console.error("getTarefas Error:", err);
    return { success: false, message: "Erro ao buscar tarefas." };
  }
});

// Get níveis educacionais for the dropdown
ipcMain.handle('getNiveis', async () => {
  try {
    const db = require(path.join(basePath, 'backend/connection.js'));
    const [rows] = await db.promise().execute(
      'SELECT id_nivel, nome FROM niveis_educacionais WHERE ativo = 1 ORDER BY ordem_nivel ASC'
    );
    return { success: true, data: rows };
  } catch (err) {
    console.error("getNiveis Error:", err);
    return { success: false, message: "Erro ao buscar níveis." };
  }
});

// Create a turma
ipcMain.handle('registerTurma', async (event, dados) => {
  try {
    const db = require(path.join(basePath, 'backend/connection.js'));
    const [result] = await db.promise().execute(
      `INSERT INTO turmas (id_escola, id_professor, id_nivel, nome_turma, ano_letivo, status)
       VALUES (?, ?, ?, ?, YEAR(CURDATE()), 'ativa')`,
      [dados.id_escola, dados.id_professor, dados.id_nivel, dados.nome_turma]
    );
    return { success: true, message: "Turma criada com sucesso!", id: result.insertId };
  } catch (err) {
    console.error("registerTurma Error:", err);
    return { success: false, message: "Erro ao criar turma: " + err.sqlMessage };
  }
});

// Get turmas for the list panel
ipcMain.handle('getTurmas', async () => {
  try {
    const db = require(path.join(basePath, 'backend/connection.js'));
    const [rows] = await db.promise().execute(
      `SELECT t.id_turma, t.nome_turma, t.ano_letivo, t.status, n.nome AS nivel
       FROM turmas t
       LEFT JOIN niveis_educacionais n ON t.id_nivel = n.id_nivel
       ORDER BY t.nome_turma ASC`
    );
    return { success: true, data: rows };
  } catch (err) {
    console.error("getTurmas Error:", err);
    return { success: false, message: "Erro ao buscar turmas." };
  }
});