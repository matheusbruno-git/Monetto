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

// ── Session helper ────────────────────────────────────────────
function getSession() {
  try {
    return JSON.parse(localStorage.getItem('session') || '{}');
  } catch (_) {
    return {};
  }
}

// ── Path helpers for active sidebar link ──────────────────────
function normalizePath(url) {
  try {
    const parsed = new URL(url, window.location.href);
    let path = parsed.pathname.replace(/\/+$/, '').toLowerCase();
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
      updateSidebarActiveLink();
    })
    .catch((err) => {
      console.error('Erro ao carregar sidebar:', err);
    });
}

// ── Escape HTML ───────────────────────────────────────────────
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Render dashboard sections from API data ───────────────────
function renderDashboardAdminEscolar(d) {
  if (!d) return;

  // Hero
  const elSchool = document.getElementById('school-name');
  if (elSchool) elSchool.textContent = d.school?.name || 'Escola';

  const elSub = document.getElementById('school-subtitle');
  if (elSub) {
    const sub = d.school?.subtitle
      ? `Dashboard do Administrador Escolar · ${d.school.subtitle}`
      : 'Dashboard do Administrador Escolar';
    elSub.textContent = sub;
  }

  const chipsEl = document.getElementById('school-chips');
  if (chipsEl && Array.isArray(d.school?.chips)) {
    chipsEl.innerHTML = d.school.chips
      .map((c, i) => {
        const style = String(c).includes('ativo') ? ' style="color:var(--green)"' : '';
        return `<span class="shc"${style}>${escapeHtml(c)}</span>`;
      })
      .join('');
  }

  // Hero counters
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val ?? '—';
  };

  setText('alunos-count', d.school?.stats?.[0]?.value);
  setText('professores-count', d.school?.stats?.[1]?.value);
  setText('turmas-count', d.school?.stats?.[2]?.value);

  // Stat cards
  setText('alunos-matriculados-count', d.stats?.[0]?.value);
  setText('completion-rate', d.stats?.[1]?.value);
  setText('tarefas-count', d.stats?.[2]?.value);
  setText('xp-distribuido-count', d.stats?.[3]?.value);
  setText('xp-count', d.stats?.[3]?.value);
  setText('xp-distributed', d.stats?.[3]?.value);
  setText('deactivated-alunos-count', d.stats?.[4]?.value);
  setText('xp-month-value', d.xpMonthValue ?? d.stats?.[3]?.value);
  setText('xp-month-delta', d.xpMonthDelta ?? '—');

  // Teachers
  const teachersEl = document.getElementById('teachers-list');
  if (teachersEl) {
    const list = Array.isArray(d.teachers) ? d.teachers : [];
    if (!list.length) {
      teachersEl.innerHTML = `
        <div class="teach-item">
          <div class="tav ta1">👨‍🏫</div>
          <div class="teach-info"><strong>Nenhum professor cadastrado</strong>
            <span>Cadastre professores no menu lateral</span></div>
        </div>`;
    } else {
      teachersEl.innerHTML = list
        .map((t, i) => {
          const eng = Number(t.engagement) || 0;
          const emoji = t.emoji || (i % 2 === 0 ? '👨‍🏫' : '👩‍🏫');
          const av = t.avatarClass || `ta${(i % 4) + 1}`;
          return `
          <div class="teach-item">
            <div class="tav ${escapeHtml(av)}">${emoji}</div>
            <div class="teach-info">
              <strong>${escapeHtml(t.name)}</strong>
              <span>${escapeHtml(t.subtitle || t.email || '')}</span>
            </div>
            <div class="teach-right">
              <div class="eng-val">${eng}%</div>
              <div class="eng-lbl">engajamento</div>
              <div class="mini-prog"><div class="mini-f" style="width:${eng}%"></div></div>
            </div>
          </div>`;
        })
        .join('');
    }
  }

  // Alerts
  const alertsEl = document.getElementById('alerts-list');
  if (alertsEl) {
    const list = Array.isArray(d.alerts) ? d.alerts : [];
    alertsEl.innerHTML = list
      .map((a) => {
        const level = a.level === 'red' ? 'al-red' : a.level === 'yellow' ? 'al-yellow' : 'al-blue';
        return `
        <div class="alert-item ${level}">
          <div class="alert-icon">${a.icon || '🔵'}</div>
          <div class="alert-body">
            <strong>${escapeHtml(a.title)}</strong>
            <span>${escapeHtml(a.subtitle || '')}</span>
          </div>
          <button class="alert-action">${escapeHtml(a.action || 'Ver')}</button>
        </div>`;
      })
      .join('');
  }

  // Classes / turmas
  const turmasEl = document.getElementById('turmas-list');
  if (turmasEl) {
    const list = Array.isArray(d.classes) ? d.classes : [];
    if (!list.length) {
      turmasEl.innerHTML = `
        <div class="turma-row">
          <div style="font-size:.85rem;font-weight:600">Nenhuma turma</div>
          <div style="color:var(--muted);font-size:.82rem">0</div>
          <div>—</div>
          <div><span style="font-size:.72rem;color:var(--muted)">—</span></div>
        </div>`;
    } else {
      turmasEl.innerHTML = list
        .map((c) => {
          const pct = Number(c.completion) || 0;
          const color =
            pct >= 90 ? 'var(--green)' : pct >= 75 ? 'var(--accent)' : 'var(--orange)';
          return `
          <div class="turma-row">
            <div style="font-size:.85rem;font-weight:600">${escapeHtml(c.name)}</div>
            <div style="color:var(--muted);font-size:.82rem">${c.students ?? 0}</div>
            <div>
              <div class="pbar-wrap">
                <div class="pbar"><div class="pbar-f" style="width:${pct}%"></div></div>
                <span style="font-size:.72rem;color:${color}">${pct}%</span>
              </div>
            </div>
            <div>
              <span class="status-dot ${escapeHtml(c.statusClass || 'sd-y')}"></span>
              <span style="font-size:.72rem;color:${color}">${escapeHtml(c.statusLabel || '')}</span>
            </div>
          </div>`;
        })
        .join('');
    }
  }

  // XP chart
  const chartEl = document.getElementById('xp-chart');
  if (chartEl && Array.isArray(d.xpChart)) {
    chartEl.innerHTML = d.xpChart
      .map((bar, i) => {
        const h = Number(bar.height) || 20;
        const cls = i === d.xpChart.length - 1 ? 'gold' : 'blue';
        return `
        <div class="bc">
          <div class="bc-bar ${cls}" style="height:${h}px"></div>
          <div class="bc-lbl">${escapeHtml(bar.label || '')}</div>
        </div>`;
      })
      .join('');
  }

  // Activities
  const actEl = document.getElementById('activities-list');
  if (actEl) {
    const list = Array.isArray(d.activities) ? d.activities : [];
    actEl.innerHTML = list
      .map(
        (a) => `
      <div class="act-item">
        <div class="act-icon ${escapeHtml(a.iconClass || 'ai-b')}">${a.icon || '📌'}</div>
        <div class="act-body">
          <strong>${escapeHtml(a.title)}</strong>
          <span>${escapeHtml(a.subtitle || '')}</span>
        </div>
        <div class="act-time">${escapeHtml(a.time || '')}</div>
      </div>`
      )
      .join('');
  }
}

// ── Fetch + render dashboard ──────────────────────────────────
async function carregarDashboardAdminEscolar() {
  // Only run on dashboard page (has hero counters)
  if (!document.getElementById('school-name') && !document.getElementById('alunos-count')) {
    return;
  }

  try {
    if (!window.api || typeof window.api.getDashboardAdminEscolar !== 'function') {
      console.warn('API getDashboardAdminEscolar não disponível');
      const elSchool = document.getElementById('school-name');
      if (elSchool) elSchool.textContent = 'API indisponível';
      return;
    }

    const session = getSession();
    const currentUserId = session.id_usuario || session.id || null;
    if (!currentUserId) {
      console.warn('Sessão sem id_usuario — faça login novamente.');
      const elSchool = document.getElementById('school-name');
      if (elSchool) elSchool.textContent = 'Faça login novamente';
      return;
    }
    const result = await window.api.getDashboardAdminEscolar(currentUserId);

    if (!result || !result.success) {
      console.warn('Erro do backend:', result?.message);
      const elSchool = document.getElementById('school-name');
      if (elSchool) elSchool.textContent = result?.message || 'Erro ao carregar';
      return;
    }

    renderDashboardAdminEscolar(result.data);
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

async function carregarTeacherEscolar() {
  // Only run on dashboard page (has hero counters)
  if (!document.getElementById('school-name') && !document.getElementById('alunos-count')) {
    return;
  }

  try {
    if (!window.api || typeof window.api.getDashboardTeacher !== 'function') {
      console.warn('API getDashboardTeacher não disponível');
      const elSchool = document.getElementById('school-name');
      if (elSchool) elSchool.textContent = 'API indisponível';
      return;
    }

    const session = getSession();
    const currentUserId = session.id_usuario || session.id || null;
    if (!currentUserId) {
      console.warn('Sessão sem id_usuario — faça login novamente.');
      const elSchool = document.getElementById('school-name');
      if (elSchool) elSchool.textContent = 'Faça login novamente';
      return;
    }
    const result = await window.api.getDashboardAdminEscolar(currentUserId);

    if (!result || !result.success) {
      console.warn('Erro do backend:', result?.message);
      const elSchool = document.getElementById('school-name');
      if (elSchool) elSchool.textContent = result?.message || 'Erro ao carregar';
      return;
    }

    renderDashboardAdminEscolar(result.data);
  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
  }
}

document.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    document.body.classList.add('fade-out');
    setTimeout(() => {
      window.location.href = this.href;
    }, 500);
  });
});