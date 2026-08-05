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
ipcMain.handle('getDashboardAdminEscolar', async () => {
  try {
    const db = require(path.join(basePath, 'backend/connection.js'));

    const [[alunos]] = await db.promise().execute(
      `SELECT COUNT(*) AS total FROM usuarios WHERE id_perfil = 1 AND ativo = 1`
    );
    const [[professores]] = await db.promise().execute(
      `SELECT COUNT(*) AS total FROM usuarios WHERE id_perfil = 2 AND ativo = 1`
    );
    const [[turmas]] = await db.promise().execute(
      `SELECT COUNT(*) AS total FROM turmas WHERE status = 'ativa'`
    );
    const [[tarefas]] = await db.promise().execute(
      `SELECT COUNT(*) AS total FROM tarefas`
    );
    const [[xpTotal]] = await db.promise().execute(
      `SELECT COALESCE(SUM(xp_atual), 0) AS total FROM progresso_aluno`
    );

    const [escolas] = await db.promise().execute(
      `SELECT nome, cidade, estado FROM escolas LIMIT 1`
    );
    const escola = escolas[0] || { nome: 'Escola', cidade: '', estado: '' };

    const [teachersRows] = await db.promise().execute(
      `SELECT 
         u.id_usuario,
         u.nome,
         COUNT(t.id_turma) AS qtd_turmas
       FROM usuarios u
       LEFT JOIN turmas t ON t.id_professor = u.id_usuario AND t.status = 'ativa'
       WHERE u.id_perfil = 2 AND u.ativo = 1
       GROUP BY u.id_usuario, u.nome
       ORDER BY qtd_turmas DESC
       LIMIT 6`
    );

    const [classesRows] = await db.promise().execute(
      `SELECT 
         t.id_turma,
         t.nome_turma,
         n.nome AS nivel,
         COUNT(u.id_usuario) AS alunos
       FROM turmas t
       LEFT JOIN niveis_educacionais n ON n.id_nivel = t.id_nivel
       LEFT JOIN usuarios u ON u.id_turma = t.id_turma AND u.id_perfil = 1
       WHERE t.status = 'ativa'
       GROUP BY t.id_turma, t.nome_turma, n.nome
       ORDER BY t.nome_turma
       LIMIT 8`
    );

    const [tarefasRecentes] = await db.promise().execute(
      `SELECT 
         t.titulo,
         t.data_criacao,
         c.nome AS disciplina
       FROM tarefas t
       LEFT JOIN cursos c ON c.id_curso = t.id_curso
       ORDER BY t.data_criacao DESC
       LIMIT 5`
    );

    const data = {
      school: {
        name: escola.nome,
        subtitle: `Dashboard do Administrador Escolar · ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
        chips: [
          `📅 Ano letivo ${new Date().getFullYear()}`,
          '🔒 Admin',
          '● Sistema ativo'
        ],
        stats: [
          { value: String(alunos.total), label: 'Alunos' },
          { value: String(professores.total), label: 'Professores' },
          { value: String(turmas.total), label: 'Turmas' }
        ]
      },
      stats: [
        {
          className: 'sc-b',
          icon: '👥',
          value: String(alunos.total),
          label: 'Alunos matriculados',
          sub: 'ativos no sistema'
        },
        {
          className: 'sc-g',
          icon: '✅',
          value: '—',
          label: 'Taxa de conclusão',
          sub: 'cálculo futuro'
        },
        {
          className: 'sc-y',
          icon: '📝',
          value: String(tarefas.total),
          label: 'Tarefas publicadas',
          sub: 'total no sistema'
        },
        {
          className: 'sc-r',
          icon: '⚡',
          value: (Number(xpTotal.total) / 1000).toFixed(1) + 'k',
          label: 'XP distribuído',
          sub: 'Total da escola'
        }
      ],
      teachers: teachersRows.map((t, i) => ({
        name: t.nome,
        details: `${t.qtd_turmas} turma(s)`,
        engagement: Math.min(95, 70 + Number(t.qtd_turmas) * 5),
        avatar: i % 2 === 0 ? '👨‍🏫' : '👩‍🏫',
        avatarClass: `ta${(i % 4) + 1}`
      })),
      alerts: [
        {
          className: 'al-blue',
          icon: '🔵',
          title: 'Dados carregados do banco',
          subtitle: 'Dashboard conectado com sucesso',
          actionLabel: 'OK'
        }
      ],
      classes: classesRows.map(c => {
        const completion = c.alunos > 0 ? Math.min(95, 60 + Number(c.alunos)) : 0;
        let status = 'Ótimo';
        if (completion < 75) status = 'Atenção';
        else if (completion < 85) status = 'Bom';
        return {
          name: c.nome_turma,
          students: c.alunos,
          completion,
          status
        };
      }),
      xpChart: [
        { label: 'Sem 1', height: 55, color: 'blue' },
        { label: 'Sem 2', height: 68, color: 'blue' },
        { label: 'Sem 3', height: 72, color: 'blue' },
        { label: 'Sem 4', height: 90, color: 'gold' }
      ],
      xpChartSummary: 'XP total distribuído por semana (placeholder)',
      xpMonthValue: (Number(xpTotal.total) / 1000).toFixed(1) + 'k',
      xpMonthDelta: '—',
      activities: tarefasRecentes.map(t => ({
        icon: '📝',
        iconClass: 'ai-y',
        title: t.titulo || 'Tarefa',
        subtitle: `${t.disciplina || 'Disciplina'} · ${t.data_criacao ? new Date(t.data_criacao).toLocaleDateString('pt-BR') : ''}`,
        time: 'recente'
      }))
    };

    return { success: true, data };
  } catch (err) {
    console.error('getDashboardAdminEscolar Error:', err);
    return { success: false, message: 'Erro ao carregar dashboard: ' + err.message };
  }
});