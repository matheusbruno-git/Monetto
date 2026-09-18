(() => {
  const session = JSON.parse(localStorage.getItem("session") || "{}");
  const studentId = session.id || session.id_usuario;
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  const formatDate = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR") : "Sem prazo";

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  }

  function applyShared(data) {
    const { student, stats } = data;
    document.querySelectorAll(".xp-topbar").forEach((element) => {
      element.innerHTML = `⚡ <strong>${student.xp_atual} XP</strong> &nbsp;· Nível ${student.nivel_atual}`;
    });
    const updateSidebar = () => {
      const info = document.querySelector(".sb-user-info");
      if (info) info.innerHTML = `<strong>${escapeHtml(student.nome)}</strong><span>⚡ ${student.xp_atual} XP · Nível ${student.nivel_atual}</span>`;
    };
    updateSidebar();
    new MutationObserver(updateSidebar).observe(document.body, { childList: true, subtree: true });
    document.title = document.title.replace("Monetto", `Monetto – ${student.nome}`);
    if (document.body.classList.contains("settings-page")) {
      const profileInfo = document.querySelector(".profile-info");
      if (profileInfo) profileInfo.innerHTML = `<strong>${escapeHtml(student.nome)}</strong><span>${escapeHtml(student.email)}</span><div class="profile-badges"><span class="pb pb-gold">⭐ Nível ${student.nivel_atual}</span><span class="pb pb-green">🔥 ${student.sequencia_dias} dias</span><span class="pb">🎓 ${escapeHtml(student.turma || "Sem turma")}</span></div>`;
      const nameInput = document.querySelector("#nome_usuario");
      if (nameInput) nameInput.value = student.nome;
      const emailInput = document.querySelector('input[type="email"]');
      if (emailInput) emailInput.value = student.email;
      const schoolInput = document.querySelectorAll('input[type="text"]')[2];
      if (schoolInput) schoolInput.value = student.escola || "Não vinculada";
    }
    if (document.body.classList.contains("rewards-page")) {
      setText(".xp-prog-label", `${student.xp_atual} / ${student.xp_proximo_nivel} XP → Nível ${student.nivel_atual + 1}`);
      setText(".xp-sub", `⚡ XP Total · Nível ${student.nivel_atual}`);
    }
    return { student, stats };
  }

  function taskClass(task) {
    if (task.concluida) return "done";
    if (task.data_vencimento && task.data_vencimento < new Date().toISOString().slice(0, 10)) return "late";
    return "pendent";
  }

  function renderDashboard(data) {
    const { student, tasks, ranking, stats } = data;
    const heading = document.querySelector(".topbar h1");
    if (heading) heading.innerHTML = `Olá, <span>${escapeHtml(student.nome.split(" ")[0])}!</span> 👋`;
    const subtitle = document.querySelector(".topbar p");
    if (subtitle) subtitle.textContent = `Você tem ${stats.pendingTasks} tarefa(s) pendente(s)`;
    const statValues = document.querySelectorAll(".stats-row .stat-val");
    [student.xp_atual, stats.completedTasks, student.sequencia_dias, 0].forEach((value, index) => {
      if (statValues[index]) statValues[index].textContent = value;
    });
    const taskCard = document.querySelector(".section-row > .card");
    if (taskCard) {
      const visible = tasks.slice(0, 5);
      taskCard.innerHTML = `<div class="card-title">Tarefas do Professor <span class="badge-count">${stats.totalTasks} tarefas</span></div>
        <div class="filter-tabs"><div class="ftab active">Todas</div></div>` +
        (visible.length ? visible.map((task) => `<div class="task-item ${taskClass(task)}"><div class="priority p-med"></div><div class="task-check ${task.concluida ? "done" : ""}"></div><div class="task-body"><div class="task-name ${task.concluida ? "done-text" : ""}">${escapeHtml(task.titulo)}</div><div class="task-meta"><span class="task-subject">${escapeHtml(task.curso || "Sem matéria")}</span><span class="task-due">${task.concluida ? "Concluída" : `Prazo: ${formatDate(task.data_vencimento)}`}</span></div></div><span class="task-xp">${task.concluida ? "✓ " : ""}Tarefa</span></div>`).join("") : "<p>Seu professor ainda não cadastrou tarefas.</p>");
    }
    const rankingList = document.querySelector(".rank-list");
    if (rankingList) rankingList.innerHTML = ranking.length ? ranking.map((entry, index) => `<div class="rank-row-item"><div class="rpos">${index + 1}</div><span class="rname">${escapeHtml(entry.nome)}${entry.id_usuario === student.id_usuario ? ' <span class="me-tag">você</span>' : ""}</span><span class="rxp">${entry.xp} XP</span></div>`).join("") : "<p>Você ainda não está em uma turma.</p>";
    const miniCards = document.querySelectorAll(".mini-card");
    if (miniCards[0]) {
      const percent = Math.min(100, Math.round((student.xp_atual / Math.max(student.xp_proximo_nivel, 1)) * 100));
      miniCards[0].innerHTML = `<div class="mini-title">⚡ Progresso de Nível</div><div style="text-align:center;font-size:2.2rem;font-weight:800">${student.nivel_atual}</div><div class="xp-progress-wrap"><div class="xp-labels"><span>${student.xp_atual} XP</span><span>${student.xp_proximo_nivel} XP</span></div><div class="xp-bar-bg"><div class="xp-bar-fill" style="width:${percent}%"></div></div></div>`;
    }
  }

  function renderTasks(data) {
    const { tasks, stats } = data;
    const values = document.querySelectorAll(".stats-row .sc-val");
    [stats.totalTasks, stats.pendingTasks, stats.completedTasks, data.student.xp_atual].forEach((value, index) => {
      if (values[index]) values[index].textContent = value;
    });
    document.querySelectorAll(".ftab").forEach((tab) => {
      const text = tab.textContent;
      if (text.includes("Todas")) tab.textContent = `Todas (${stats.totalTasks})`;
      if (text.includes("Pendentes")) tab.textContent = `⏳ Pendentes (${stats.pendingTasks})`;
      if (text.includes("Concluídas")) tab.textContent = `✅ Concluídas (${stats.completedTasks})`;
    });
    const list = document.querySelector(".task-list-card");
    if (!list) return;
    list.innerHTML = `<div class="tlc-header"><h3>Lista de Tarefas</h3></div>` + (tasks.length ? tasks.map((task) => `<div class="task-item ${task.concluida ? "done-item" : ""}" data-task-id="${task.id_tarefa}"><div class="priority-bar pb-med"></div><div class="check-circle ${task.concluida ? "checked" : ""}"></div><div class="task-body"><div class="task-name ${task.concluida ? "done-txt" : ""}">${escapeHtml(task.titulo)}</div><div class="task-chips"><span class="tchip tc-subj">${escapeHtml(task.curso || "Sem matéria")}</span></div><div class="due-row"><span class="due-icon">${task.concluida ? "✅" : "📅"}</span><span>${task.concluida ? "Concluída" : `Prazo: ${formatDate(task.data_vencimento)}`}</span></div></div><div class="task-right">${task.concluida ? '<span class="xp-badge earned">✓ Concluída</span>' : `<button class="td-btn td-btn-primary" data-complete="${task.id_tarefa}">Concluir tarefa</button>`}</div><div class="task-detail"><div class="td-desc">${escapeHtml(task.descricao || "Sem descrição fornecida.")}</div></div></div>`).join("") : "<p>Nenhuma tarefa disponível no momento.</p>");
    list.querySelectorAll("[data-complete]").forEach((button) => button.addEventListener("click", async () => {
      button.disabled = true;
      const result = await window.api.completeStudentTask(studentId, Number(button.dataset.complete));
      if (!result.success) { button.disabled = false; alert(result.message); return; }
      load();
    }));
  }

  async function load() {
    if (!studentId || !window.api?.getStudentDashboard) return;
    const result = await window.api.getStudentDashboard(studentId);
    if (!result.success) { console.error(result.message); return; }
    applyShared(result.data);
    if (document.body.classList.contains("student-dashboard-page")) renderDashboard(result.data);
    if (document.body.classList.contains("tasks-page")) renderTasks(result.data);
  }

  document.addEventListener("DOMContentLoaded", load);
})();
