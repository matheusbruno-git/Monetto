// monetto-app.js

// ── Logout helper (used by sidebar) ───────────────────────────
function sairDaConta(destino) {
  if (confirm('Tem certeza que deseja sair da conta?')) {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (_) { /* ignore */ }
    window.location.href = destino || '../../login/login.html';
  }
}

// ── Path helpers for active sidebar link ──────────────────────
function normalizePath(url) {
  try {
    const parsed = new URL(url, window.location.href);
    let path = parsed.pathname.replace(/\/+$/, '').toLowerCase();

    // Treat index.html as the folder itself
    if (path.endsWith('/index.html')) {
      path = path.slice(0, -'/index.html'.length);
    }

    return path;
  } catch (error) {
    console.error('Erro ao normalizar caminho:', error);
    return '';
  }
}

function updateSidebarActiveLink() {
  const currentPath = normalizePath(window.location.href);
  const links = document.querySelectorAll('.sidebar .sb-link');

  links.forEach((link) => {
    const href = link.getAttribute('href');

    // Skip logout / empty / javascript links
    if (
      !href ||
      href === '#' ||
      href.startsWith('javascript:') ||
      link.classList.contains('sb-logout')
    ) {
      link.classList.remove('active');
      return;
    }

    const targetPath = normalizePath(new URL(href, window.location.href).href);
    link.classList.toggle('active', !!(targetPath && currentPath === targetPath));
  });
}

// ── Load admin-school sidebar into #sidebar-container ─────────
function loadAdminSchoolSidebar() {
  const container = document.getElementById('sidebar-container');
  if (!container) return Promise.resolve();

  const sidebarUrl = '../../Assets/Components/admin-school-sidebar.html';

  return fetch(sidebarUrl, { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load sidebar: ${response.status}`);
      }
      return response.text();
    })
    .then((html) => {
      container.innerHTML = html;
      // Scripts inside fetched HTML do not run via innerHTML — set active here
      updateSidebarActiveLink();
    })
    .catch((err) => {
      console.error('Erro ao carregar sidebar:', err);
    });
}

// ── Dashboard data (admin escolar) ────────────────────────────
async function carregarDashboardAdminEscolar() {
  try {
    if (!window.api || typeof window.api.getDashboardAdminEscolar !== 'function') {
      console.warn('API getDashboardAdminEscolar não disponível');
      return;
    }

    const result = await window.api.getDashboardAdminEscolar();
    if (!result.success) {
      console.warn('Erro do backend:', result.message);
      return;
    }

    const d = result.data;

    const elSchool = document.getElementById('school-name');
    if (elSchool) elSchool.textContent = d.school.name;

    const elAlunos = document.getElementById('alunos-count');
    if (elAlunos) elAlunos.textContent = d.school.stats[0].value;

    const elDeactivatedAlunos = document.getElementById('deactivated-alunos-count');
    if (elDeactivatedAlunos) elDeactivatedAlunos.textContent = d.stats[4]?.value || '0';

    const elCompletionRate = document.getElementById('completion-rate');
    if (elCompletionRate) elCompletionRate.textContent = d.stats[1]?.value || '0';

    const elXpDistributed = document.getElementById('xp-distributed');
    if (elXpDistributed) elXpDistributed.textContent = d.stats[3]?.value || '0';

    const elProf = document.getElementById('professores-count');
    if (elProf) elProf.textContent = d.school.stats[1].value;

    const elTurmas = document.getElementById('turmas-count');
    if (elTurmas) elTurmas.textContent = d.school.stats[2].value;

    const elMatric = document.getElementById('alunos-matriculados-count');
    if (elMatric) elMatric.textContent = d.stats[0].value;

    const elTarefas = document.getElementById('tarefas-count');
    if (elTarefas) elTarefas.textContent = d.stats[2].value;

    const elXp = document.getElementById('xp-count');
    if (elXp) elXp.textContent = d.stats[3].value;
  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
  }
}

// ── Boot ──────────────────────────────────────────────────────
function bootMonettoApp() {
  loadAdminSchoolSidebar();
  carregarDashboardAdminEscolar();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootMonettoApp);
} else {
  bootMonettoApp();
}
