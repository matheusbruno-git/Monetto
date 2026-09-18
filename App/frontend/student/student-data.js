(() => {
  function getSession() {
    try { return JSON.parse(localStorage.getItem('session') || '{}'); }
    catch (_) { return {}; }
  }

  const session = getSession();
  const studentId = session.id_usuario || session.id || null;
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' })[char]);
  const toDate = (value) => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const formatDate = (value) => {
    const d = toDate(value);
    return d ? d.toLocaleDateString('pt-BR') : 'Sem prazo';
  };
  const formatDateTime = (value) => {
    const d = toDate(value);
    return d ? d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
  };

  function setText(selector, value) {
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
  }

  function setValue(selector, value) {
    const el = document.querySelector(selector);
    if (el) el.value = value ?? '';
  }

  function applyShared(data) {
    const { student, stats } = data;

    document.querySelectorAll('.xp-topbar').forEach((el) => {
      el.innerHTML = `⚡ <strong>${student.xp_atual} XP</strong> &nbsp;· Nível ${student.nivel_atual}`;
    });

    const updateSidebar = () => {
      const info = document.querySelector('.sb-user-info');
      if (info) info.innerHTML = `<strong>${escapeHtml(student.nome)}</strong><span>⚡ ${student.xp_atual} XP · Nível ${student.nivel_atual}</span>`;
    };
    updateSidebar();
    new MutationObserver(updateSidebar).observe(document.body, { childList: true, subtree: true });

    if (document.body.classList.contains('settings-page')) {
      const profileInfo = document.querySelector('.profile-info');
      if (profileInfo) {
        profileInfo.innerHTML = `<strong>${escapeHtml(student.nome)}</strong><span>${escapeHtml(student.email)}</span><div class="profile-badges"><span class="pb pb-gold">⭐ Nível ${student.nivel_atual}</span><span class="pb pb-green">🔥 ${student.sequencia_dias} dias</span><span class="pb">🎓 ${escapeHtml(student.turma || 'Sem turma')}</span></div>`;
      }
      setValue('#nome_usuario', student.nome);
      setValue('#email_usuario', student.email);
      setValue('#turma_usuario', student.turma || 'Sem turma');
      setValue('#escola_usuario', student.escola || 'Não vinculada');
      setText('#conta_escola', student.escola || 'Não vinculada');
    }

    if (document.body.classList.contains('rewards-page')) {
      const pct = Math.min(100, Math.round((student.xp_atual / Math.max(student.xp_proximo_nivel, 1)) * 100));
      setText('.xp-prog-label', `${student.xp_atual} / ${student.xp_proximo_nivel} XP → Nível ${student.nivel_atual + 1}`);
      setText('.xp-big', student.xp_atual);
      setText('.xp-sub', `⚡ XP Total · Nível ${student.nivel_atual}`);
      const fill = document.querySelector('.xp-prog-f');
      if (fill) fill.style.width = `${pct}%`;
    }

    return { student, stats };
  }

  function taskClass(task) {
    if (task.concluida) return 'done';
    const due = toDate(task.data_vencimento);
    return due && due < new Date() ? 'late' : 'pendent';
  }

  function renderDashboard(data) {
    const { student, tasks, ranking, stats } = data;
    const firstName = String(student.nome || 'Aluno').trim().split(/\s+/)[0];
    const heading = document.querySelector('.topbar h1');
    if (heading) heading.innerHTML = `Olá, <span>${escapeHtml(firstName)}!</span> 👋`;
    const subtitle = document.querySelector('.topbar p');
    if (subtitle) subtitle.textContent = `Você tem ${stats.pendingTasks} tarefa(s) pendente(s)`;

    const statValues = document.querySelectorAll('.stats-row .stat-val');
    [student.xp_atual, stats.completedTasks, student.sequencia_dias, Math.round(stats.completionRate || 0)].forEach((value, i) => {
      if (statValues[i]) statValues[i].textContent = value;
    });
    const statLabels = document.querySelectorAll('.stats-row .stat-lbl');
    if (statLabels[3]) statLabels[3].textContent = 'Progresso (%)';

    const taskCard = document.querySelector('.section-row > .card');
    if (taskCard) {
      const visible = tasks.slice(0, 5);
      taskCard.innerHTML = `<div class="card-title">Tarefas do Professor <span class="badge-count">${stats.totalTasks} tarefas</span></div><div class="filter-tabs"><div class="ftab active">Todas</div></div>` +
        (visible.length ? visible.map((task) => `<div class="task-item ${taskClass(task)}"><div class="priority p-med"></div><div class="task-check ${task.concluida ? 'done' : ''}"></div><div class="task-body"><div class="task-name ${task.concluida ? 'done-text' : ''}">${escapeHtml(task.titulo)}</div><div class="task-meta"><span class="task-subject">${escapeHtml(task.curso || 'Sem matéria')}</span><span class="task-due">${task.concluida ? 'Concluída' : `Prazo: ${formatDate(task.data_vencimento)}`}</span></div></div><span class="task-xp">${task.xp_recompensa ? `+${task.xp_recompensa} XP` : 'Tarefa'}</span></div>`).join('') : '<p>Seu professor ainda não cadastrou tarefas.</p>');
    }

    const rankingList = document.querySelector('.rank-list');
    if (rankingList) rankingList.innerHTML = ranking.length ? ranking.slice(0,5).map((entry, index) => `<div class="rank-row-item"><div class="rpos">${index + 1}</div><span class="rname">${escapeHtml(entry.nome)}${String(entry.id_usuario) === String(student.id_usuario) ? ' <span class="me-tag">você</span>' : ''}</span><span class="rxp">${Number(entry.xp)||0} XP</span></div>`).join('') : '<p>Você ainda não está em uma turma.</p>';

    const miniCards = document.querySelectorAll('.mini-card');
    if (miniCards[0]) {
      const percent = Math.min(100, Math.round((student.xp_atual / Math.max(student.xp_proximo_nivel, 1)) * 100));
      miniCards[0].innerHTML = `<div class="mini-title">⚡ Progresso de Nível</div><div style="text-align:center;font-size:2.2rem;font-weight:800">${student.nivel_atual}</div><div class="xp-progress-wrap"><div class="xp-labels"><span>${student.xp_atual} XP</span><span>${student.xp_proximo_nivel} XP</span></div><div class="xp-bar-bg"><div class="xp-bar-fill" style="width:${percent}%"></div></div></div>`;
    }
  }

  function renderTasks(data) {
    const { tasks, stats, student } = data;
    const values = document.querySelectorAll('.stats-row .sc-val');
    [stats.totalTasks, stats.pendingTasks, stats.completedTasks, student.xp_atual].forEach((value, i) => { if (values[i]) values[i].textContent = value; });

    document.querySelectorAll('.ftab').forEach((tab) => {
      const text = tab.textContent;
      if (text.includes('Todas')) tab.textContent = `Todas (${stats.totalTasks})`;
      if (text.includes('Pendentes')) tab.textContent = `⏳ Pendentes (${stats.pendingTasks})`;
      if (text.includes('Concluídas')) tab.textContent = `✅ Concluídas (${stats.completedTasks})`;
    });

    const list = document.querySelector('.task-list-card');
    if (!list) return;
    list.innerHTML = `<div class="tlc-header"><h3>Lista de Tarefas</h3></div>` + (tasks.length ? tasks.map((task) => `<div class="task-item ${task.concluida ? 'done-item' : ''}" data-task-id="${task.id_tarefa}"><div class="priority-bar pb-med"></div><div class="check-circle ${task.concluida ? 'checked' : ''}"></div><div class="task-body"><div class="task-name ${task.concluida ? 'done-txt' : ''}">${escapeHtml(task.titulo)}</div><div class="task-chips"><span class="tchip tc-subj">${escapeHtml(task.curso || 'Sem matéria')}</span></div><div class="due-row"><span class="due-icon">${task.concluida ? '✅' : '📅'}</span><span>${task.concluida ? 'Concluída' : `Prazo: ${formatDate(task.data_vencimento)}`}</span></div></div><div class="task-right">${task.concluida ? '<span class="xp-badge earned">✓ Concluída</span>' : `<button class="td-btn td-btn-primary" data-complete="${task.id_tarefa}">Concluir tarefa</button>`}</div><div class="task-detail"><div class="td-desc">${escapeHtml(task.descricao || 'Sem descrição fornecida.')}</div></div></div>`).join('') : '<p>Nenhuma tarefa disponível no momento.</p>');

    list.querySelectorAll('[data-complete]').forEach((button) => button.addEventListener('click', async () => {
      button.disabled = true;
      const result = await window.api.completeStudentTask(studentId, Number(button.dataset.complete));
      if (!result?.success) { button.disabled = false; alert(result?.message || 'Erro ao concluir tarefa.'); return; }
      await load();
    }));
  }

  function renderGames(data) {
    const { ranking, student } = data;
    const leaderboard = document.querySelector('.lb-grid');
    if (!leaderboard) return;
    if (!ranking.length) { leaderboard.innerHTML = '<p>Ranking indisponível: aluno ainda não está vinculado a uma turma.</p>'; return; }
    const medals = ['🥇','🥈','🥉'];
    leaderboard.innerHTML = ranking.slice(0, 4).map((entry, index) => `<div class="lb-card"><div class="lb-pos">${medals[index] || (index + 1)}</div><div class="lb-av la${index + 1}"></div><div class="lb-info"><strong>${escapeHtml(entry.nome)}${String(entry.id_usuario) === String(student.id_usuario) ? ' (você)' : ''}</strong><span>${Number(entry.xp)||0} XP total</span></div></div>`).join('');
  }

  function renderRewards(data) {
    const { deliveries, student } = data;
    const badgeDescriptions = document.querySelectorAll('.badge-desc');
    if (badgeDescriptions[0]) badgeDescriptions[0].textContent = `${student.sequencia_dias} dias seguidos`;
    if (badgeDescriptions[3]) badgeDescriptions[3].textContent = `Alcançou Nível ${student.nivel_atual}`;
    const historyContainer = document.querySelector('.hist-list, .history-list');
    if (!historyContainer || !deliveries?.length) return;
    historyContainer.innerHTML = deliveries.slice(0, 10).map((d) => `<div class="hist-item"><div class="hist-icon">✅</div><div class="hist-body"><strong>Tarefa concluída</strong><span>${formatDateTime(d.criado_em)}</span></div><span class="hist-xp">${Number(d.xp_ganho) ? `+${Number(d.xp_ganho)} XP` : 'Concluída'}</span></div>`).join('');
  }

  async function load() {
    if (!studentId) {
      console.error('Sessão do aluno não encontrada em localStorage.session');
      return;
    }
    if (!window.api?.getStudentDashboard) {
      console.error('API getStudentDashboard não está disponível no preload.js');
      return;
    }

    const result = await window.api.getStudentDashboard(studentId);
    if (!result?.success) {
      console.error(result?.message || 'Erro ao carregar dados do aluno.');
      return;
    }

    applyShared(result.data);
    if (document.body.classList.contains('student-dashboard-page')) renderDashboard(result.data);
    if (document.body.classList.contains('tasks-page')) renderTasks(result.data);
    if (document.body.classList.contains('games-page')) renderGames(result.data);
    if (document.body.classList.contains('rewards-page')) renderRewards(result.data);
    window.studentData = result.data;
  }

  window.reloadStudentData = load;
  document.addEventListener('DOMContentLoaded', load);
})();
