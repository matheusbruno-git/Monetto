(() => {
  const container = document.getElementById("sidebar-container");
  if (!container) return;

  const sidebar = "../../Assets/Components/admin-school-sidebar.html";

  console.log(`Loading sidebar from: ${sidebar}`);

  fetch(sidebar, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load sidebar: ${response.status}`);
      }
      return response.text();
    })
    .then((html) => {
      container.innerHTML = html;
    })
    .catch((err) => {
      console.error(err);
    });
})();

// Reads the logged-in user saved at login time (see main.js's 'login' handler).
// We only ever send this user's id to the backend; the backend re-derives
// id_escola from it server-side, so this admin can never pull another
// school's data even if localStorage were tampered with.
function getCurrentUserId() {
  try {
    const session = JSON.parse(localStorage.getItem('session') || '{}');
    return session.id_usuario || session.id || null;
  } catch (e) {
    return null;
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderTeachers(teachers) {
  const el = document.getElementById('teachers-list');
  if (!el) return;
  if (!teachers || !teachers.length) {
    el.innerHTML = '<div class="teach-item"><div class="teach-info"><strong>Nenhum professor cadastrado</strong></div></div>';
    return;
  }
  el.innerHTML = teachers.map(t => `
    <div class="teach-item">
      <div class="tav ${t.avatarClass || 'ta1'}">${t.emoji || '👨‍🏫'}</div>
      <div class="teach-info"><strong>${t.name}</strong><span>${t.subtitle || ''}</span></div>
    </div>`).join('');
}

function renderAlerts(alerts) {
  const el = document.getElementById('alerts-list');
  if (!el) return;
  if (!alerts || !alerts.length) {
    el.innerHTML = '<div class="alert-item al-blue"><div class="alert-body"><strong>Nenhum alerta</strong></div></div>';
    return;
  }
  el.innerHTML = alerts.map(a => `
    <div class="alert-item al-${a.level}">
      <div class="alert-icon">${a.icon}</div>
      <div class="alert-body"><strong>${a.title}</strong><span>${a.subtitle}</span></div>
    </div>`).join('');
}

function renderClasses(classes) {
  const el = document.getElementById('turmas-list');
  if (!el) return;
  if (!classes || !classes.length) {
    el.innerHTML = '<div class="turma-row"><div>Nenhuma turma cadastrada</div><div>—</div><div>—</div><div>—</div></div>';
    return;
  }
  el.innerHTML = classes.map(c => `
    <div class="turma-row">
      <div style="font-size:.85rem;font-weight:600">${c.name}</div>
      <div style="color:var(--muted);font-size:.82rem">${c.students}</div>
      <div>${c.completion}%</div>
      <div><span class="${c.statusClass}">${c.statusLabel}</span></div>
    </div>`).join('');
}

function renderXpChart(xpChart) {
  const el = document.getElementById('xp-chart');
  if (!el) return;
  if (!xpChart || !xpChart.length) return;
  const max = Math.max(...xpChart.map(b => b.height), 1);
  el.innerHTML = xpChart.map(b => `
    <div class="bc">
      <div class="bc-bar blue" style="height:${Math.max(4, (b.height / max) * 90)}px"></div>
      <div class="bc-lbl">${b.label}</div>
    </div>`).join('');
}

function renderActivities(activities) {
  const el = document.getElementById('activities-list');
  if (!el) return;
  if (!activities || !activities.length) {
    el.innerHTML = '<div class="act-item"><div class="act-body"><strong>Nenhuma atividade recente</strong></div></div>';
    return;
  }
  el.innerHTML = activities.map(a => `
    <div class="act-item">
      <div class="act-icon ${a.iconClass}">${a.icon}</div>
      <div class="act-body"><strong>${a.title}</strong><span>${a.subtitle}</span></div>
      <div class="act-time">${a.time}</div>
    </div>`).join('');
}

async function loadDashboard() {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) {
    setText('school-name', 'Sessão inválida');
    setText('school-subtitle', 'Faça login novamente para ver os dados da sua escola.');
    return;
  }

  const result = await window.api.getDashboardAdminEscolar(currentUserId);
  if (!result.success) {
    setText('school-name', 'Erro ao carregar');
    setText('school-subtitle', result.message || 'Não foi possível carregar os dados da escola.');
    return;
  }

  const d = result.data;

  // School hero
  setText('school-name', d.school.name);
  setText('school-subtitle', d.school.subtitle || 'Dashboard do Administrador Escolar');
  const chipsEl = document.getElementById('school-chips');
  if (chipsEl && d.school.chips) {
    chipsEl.innerHTML = d.school.chips.map(c => `<span class="shc">${c}</span>`).join('');
  }
  const [alunos, professores, turmas] = d.school.stats || [];
  if (alunos) setText('alunos-count', alunos.value);
  if (professores) setText('professores-count', professores.value);
  if (turmas) setText('turmas-count', turmas.value);

  // Stats row: [alunos, taxaConclusao, tarefas, xp, inativos]
  const [statAlunos, statTaxa, statTarefas, statXp] = d.stats || [];
  if (statAlunos) setText('alunos-matriculados-count', statAlunos.value);
  if (statTaxa) setText('completion-rate', statTaxa.value);
  if (statTarefas) setText('tarefas-count', statTarefas.value);
  if (statXp) setText('xp-distribuido-count', statXp.value);

  renderTeachers(d.teachers);
  renderAlerts(d.alerts);
  renderClasses(d.classes);
  renderXpChart(d.xpChart);
  setText('xp-month-value', d.xpMonthValue);
  setText('xp-month-delta', d.xpMonthDelta);
  renderActivities(d.activities);
}

document.addEventListener('DOMContentLoaded', loadDashboard);
