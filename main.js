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
      'SELECT id_usuario, nome, email, id_perfil, id_escola, senha_hash FROM usuarios WHERE email = ? AND ativo = 1',
      [email]
    );
    if (rows.length === 0) return { success: false, message: "Email ou senha incorretos." };

    const user = rows[0];
    const senhaCorreta = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaCorreta) return { success: false, message: "Email ou senha incorretos." };

    // Track last-login time (used by the "inactive students" dashboard stat)
    db.promise().execute('UPDATE usuarios SET ultimo_acesso = NOW() WHERE id_usuario = ?', [user.id_usuario])
      .catch(e => console.warn('Failed to update ultimo_acesso:', e.message));

    let redirect = '../../admin_general/dashboard-admin-geral/dashboard-admin-geral.html';
    if (user.id_perfil === 1) redirect = '../../frontend/student/dashboard-aluno/dashboard-aluno.html';
    if (user.id_perfil === 2) redirect = '../../frontend/teacher/dashboard-professor/dashboard-professor.html';
    if (user.id_perfil === 3) redirect = '../../frontend/admin_school/dashboard-admin-escolar/dashboard-admin-escolar.html';

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
        id_escola: user.id_escola
      }
    };
  } catch (err) {
    console.error("Login Error:", err);
    return { success: false, message: "Erro no servidor." };
  }
});

ipcMain.handle('registerAluno', async (event, dados) => {
  try {
    const { registerAluno } = require(path.join(basePath, 'backend/create_aluno.js'));
    return await registerAluno(dados);
  } catch (err) {
    console.error("registerAluno Error:", err);
    return { success: false, message: "Erro ao cadastrar aluno." };
  }
});

ipcMain.handle('registerProfessor', async (event, dados) => {
  try {
    const { registerProfessor } = require(path.join(basePath, 'backend/create_professor.js'));
    return await registerProfessor(dados);
  } catch (err) {
    console.error("registerProfessor Error:", err);
    return { success: false, message: "Erro ao cadastrar professor." };
  }
});

ipcMain.handle('addAlunoToTurma', async (event, dados) => {
  try {
    const { addAlunoToTurma } = require(path.join(basePath, 'backend/add_aluno_to_turma.js'));
    return await addAlunoToTurma(dados);
  } catch (err) {
    console.error("addAlunoToTurma Error:", err);
    return { success: false, message: "Erro ao adicionar aluno à turma." };
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
    return { success: true, data: rows };
  } catch (err) {
    console.error("getAlunos Error:", err);
    return { success: false, message: "Erro ao buscar alunos." };
  }
});

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

// ============================================================
// DASHBOARD ADMIN ESCOLAR – dados agregados do banco
// ============================================================
ipcMain.handle('getDashboardAdminEscolar', async (event, currentUserId) => {
  try {
    const db = require(path.join(basePath, 'backend/connection.js'));

    if (!currentUserId) {
      return { success: false, message: 'ID do usuário não informado.' };
    }

    const [userRows] = await db.promise().execute(
      'SELECT id_escola FROM usuarios WHERE id_usuario = ? AND ativo = 1 LIMIT 1',
      [currentUserId]
    );

    if (!userRows[0] || !userRows[0].id_escola) {
      return { success: false, message: 'Usuário não está associado a uma escola.' };
    }

    const escolaId = userRows[0].id_escola;

    // Helper: run a count query, return 0 if table is missing
    async function safeCount(sql, params = []) {
      try {
        const [[row]] = await db.promise().execute(sql, params);
        return Number(row.total) || 0;
      } catch (e) {
        console.warn('safeCount failed:', e.sqlMessage || e.message);
        return 0;
      }
    }

    const alunosTotal = await safeCount(
      `SELECT COUNT(*) AS total FROM usuarios WHERE id_perfil = 1 AND ativo = 1 AND id_escola = ?`,
      [escolaId]
    );
    const deactivatedAlunosTotal = await safeCount(
      `SELECT COUNT(*) AS total FROM usuarios WHERE id_perfil = 1 AND ativo = 1 AND id_escola = ? AND (ultimo_acesso IS NULL OR DATEDIFF(CURDATE(), ultimo_acesso) > 7)`,
      [escolaId]
    );
    const professoresTotal = await safeCount(
      `SELECT COUNT(*) AS total FROM usuarios WHERE id_perfil = 2 AND ativo = 1 AND id_escola = ?`,
      [escolaId]
    );
    const turmasTotal = await safeCount(
      `SELECT COUNT(*) AS total FROM turmas WHERE status = 'ativa' AND id_escola = ?`,
      [escolaId]
    );
    const tarefasTotal = await safeCount(
      `SELECT COUNT(*) AS total FROM tarefas WHERE id_escola = ?`,
      [escolaId]
    );
    // progresso_aluno has no id_escola column of its own — join through usuarios instead
    const xpTotal = await safeCount(
      `SELECT COALESCE(SUM(pa.xp_atual), 0) AS total
       FROM progresso_aluno pa
       JOIN usuarios u ON u.id_usuario = pa.id_aluno
       WHERE u.id_escola = ?`,
      [escolaId]
    );

    // Escola (was previously not filtered by the current user's school at all)
    let escolaNome = 'Escola';
    try {
      const [escolas] = await db.promise().execute(`SELECT nome FROM escolas WHERE id_escola = ? LIMIT 1`, [escolaId]);
      if (escolas[0]) escolaNome = escolas[0].nome;
    } catch (e) {
      console.warn('escolas table missing or empty');
    }

    return {
      success: true,
      data: {
        school: {
          name: escolaNome,
          stats: [
            { value: String(alunosTotal),      label: 'Alunos' },
            { value: String(professoresTotal), label: 'Professores' },
            { value: String(turmasTotal),      label: 'Turmas' }
          ]},
        stats: [
          { value: String(alunosTotal) },                    // 0 – alunos matriculados
          { value: '—' },                                    // 1 – taxa
          { value: String(tarefasTotal) },                   // 2 – tarefas
          { value: (xpTotal / 1000).toFixed(1) + 'k' },      // 3 – XP
          { value: String(deactivatedAlunosTotal) }          // 4 – alunos inativos +7 dias
        ]
      }
    };
  } catch (err) {
    console.error('getDashboardAdminEscolar Error:', err);
    return { success: false, message: 'Erro ao carregar dashboard: ' + err.message };
  }
});