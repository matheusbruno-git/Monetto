(() => {
  const container = document.getElementById("sidebar-container");
  if (!container) return;

  const sidebar = "../../Assets/Components/teacher-sidebar.html";

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
// permissions from it server-side, so this teacher can never pull another
// teacher's data even if localStorage were tampered with.
function getCurrentUserId() {
  try {
    const session = JSON.parse(localStorage.getItem("session") || "{}");
    return session.id_usuario || session.id || null;
  } catch (e) {
    return null;
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderTurmas(turmas) {
  const el = document.getElementById("turmas-list");
  if (!el) return;
  if (!turmas || !turmas.length) {
    el.innerHTML =
      '<div class="turma-item"><div class="turma-info"><strong>Nenhuma turma vinculada</strong><span>Peça ao admin para associar turmas</span></div></div>';
    return;
  }
  const avatarClasses = ["ta-b", "ta-g", "ta-y", "ta-p"];
  const emojis = ["📘", "📗", "📙", "📒"];
  el.innerHTML = turmas
    .map((t, i) => {
      const av = t.avatarClass || avatarClasses[i % avatarClasses.length];
      const emoji = t.emoji || emojis[i % emojis.length];
      const eng = t.engagement != null ? t.engagement : 0;
      return `
    <div class="turma-item">
      <div class="turma-av ${av}">${emoji}</div>
      <div class="turma-info"><strong>${t.name}</strong><span>${t.subtitle || ""}</span></div>
      <div class="turma-meta">
        <div class="eng">${eng}%</div>
        <div class="cnt">engajamento</div>
        <div class="prog-bar">
          <div class="prog-f" style="width:${eng}%"></div>
        </div>
      </div>
    </div>`;
    })
    .join("");
}

function renderActivities(activities) {
  const el = document.getElementById("activities-list");
  if (!el) return;
  if (!activities || !activities.length) {
    el.innerHTML =
      '<div class="act-item"><div class="act-body"><strong>Nenhuma atividade recente</strong></div></div>';
    return;
  }
  el.innerHTML = activities
    .map((a) => {
      const dotClass = a.dotClass || a.iconClass || "ad-b";
      return `
    <div class="act-item">
      <div class="act-dot ${dotClass}"></div>
      <div class="act-body"><strong>${a.title}</strong><span>${a.subtitle || ""}</span></div>
      <div class="act-time">${a.time || ""}</div>
    </div>`;
    })
    .join("");
}

function renderCompletionsChart(chart) {
  const el = document.getElementById("completions-chart");
  if (!el) return;
  if (!chart || !chart.length) {
    el.innerHTML =
      '<div class="bar-col"><div class="bar-fill" style="height:20px;opacity:.3"></div><div class="bar-label">—</div></div>';
    return;
  }
  const max = Math.max(...chart.map((b) => b.height || b.value || 0), 1);
  el.innerHTML = chart
    .map((b) => {
      const h = b.height != null ? b.height : b.value || 0;
      const px = Math.max(4, (h / max) * 95);
      const opacity = h === 0 ? "opacity:.25" : "";
      return `
    <div class="bar-col">
      <div class="bar-fill" style="height:${px}px;${opacity}"></div>
      <div class="bar-label">${b.label}</div>
    </div>`;
    })
    .join("");
}

function renderTopAlunos(alunos) {
  const el = document.getElementById("top-alunos-list");
  if (!el) return;
  if (!alunos || !alunos.length) {
    el.innerHTML =
      '<div class="top-aluno"><span class="ta-nm">Nenhum dado de ranking ainda</span></div>';
    return;
  }
  const medals = ["🥇", "2", "3", "4", "5"];
  const avatars = ["tav1", "tav2", "tav3", "tav4", "tav5"];
  el.innerHTML = alunos
    .map((a, i) => {
      const pos = i + 1;
      const medal = medals[i] || String(pos);
      const posClass = pos === 1 ? "tp1" : pos === 2 ? "tp2" : "tp3";
      const style = pos > 3 ? ' style="color:var(--muted)"' : "";
      const av = a.avatarClass || avatars[i % avatars.length];
      return `
    <div class="top-aluno">
      <div class="ta-pos ${posClass}"${style}>${medal}</div>
      <div class="ta-av2 ${av}"></div>
      <span class="ta-nm">${a.name}${a.turma ? " · " + a.turma : ""}</span>
      <span class="ta-xp">${a.xp != null ? a.xp + " XP" : "—"}</span>
    </div>`;
    })
    .join("");
}

function renderPending(tasks) {
  const el = document.getElementById("pending-list");
  if (!el) return;
  if (!tasks || !tasks.length) {
    el.innerHTML =
      '<div class="pend-item"><div class="pend-body"><strong>Nenhuma tarefa pendente</strong><span>Tudo em dia</span></div></div>';
    return;
  }
  el.innerHTML = tasks
    .map((t) => {
      const urgency = t.urgency || "pu-y";
      const chip = t.chip || "em prazo";
      return `
    <div class="pend-item">
      <div class="pend-urgency ${urgency}"></div>
      <div class="pend-body"><strong>${t.title}</strong><span>${t.subtitle || ""}</span></div>
      <span class="pend-chip">${chip}</span>
    </div>`;
    })
    .join("");
}

async function loadDashboard() {
  console.log("Loading teacher dashboard data...");
  const currentUserId = getCurrentUserId();
  if (!currentUserId) {
    setText("teacher-name", "Sessão inválida");
    setText(
      "teacher-subtitle",
      "Faça login novamente para ver os dados das suas turmas.",
    );
    return;
  }

  const result = await window.api.getDashboardTeacher(currentUserId);
  if (!result.success) {
    setText("teacher-name", "Erro ao carregar");
    setText(
      "teacher-subtitle",
      result.message || "Não foi possível carregar os dados do professor.",
    );
    return;
  }

  const d = result.data;

  // Topbar
  setText("teacher-name", d.teacher?.name || d.name || "Professor");
  setText(
    "teacher-subtitle",
    d.teacher?.subtitle || d.subtitle || "Dashboard do Professor",
  );

  // Stats row — expected shape:
  // d.stats = [{ value, sub }, ...] for [alunos, conclusao, tarefas, avaliacao]
  // or named keys: d.stats.alunos, etc.
  const stats = d.stats || {};
  if (Array.isArray(stats)) {
    const [sAlunos, sConclusao, sTarefas, sAvaliacao] = stats;
    if (sAlunos) {
      setText("stat-alunos", sAlunos.value);
      if (sAlunos.sub) setText("stat-alunos-sub", sAlunos.sub);
    }
    if (sConclusao) {
      setText("stat-conclusao", sConclusao.value);
      if (sConclusao.sub) setText("stat-conclusao-sub", sConclusao.sub);
    }
    if (sTarefas) {
      setText("stat-tarefas", sTarefas.value);
      if (sTarefas.sub) setText("stat-tarefas-sub", sTarefas.sub);
    }
    if (sAvaliacao) {
      setText("stat-avaliacao", sAvaliacao.value);
      if (sAvaliacao.sub) setText("stat-avaliacao-sub", sAvaliacao.sub);
    }
  } else {
    if (stats.alunos) {
      setText("stat-alunos", stats.alunos.value ?? stats.alunos);
      if (stats.alunos.sub) setText("stat-alunos-sub", stats.alunos.sub);
    }
    if (stats.conclusao || stats.completion) {
      const c = stats.conclusao || stats.completion;
      setText("stat-conclusao", c.value ?? c);
      if (c.sub) setText("stat-conclusao-sub", c.sub);
    }
    if (stats.tarefas) {
      setText("stat-tarefas", stats.tarefas.value ?? stats.tarefas);
      if (stats.tarefas.sub) setText("stat-tarefas-sub", stats.tarefas.sub);
    }
    if (stats.avaliacao || stats.rating) {
      const a = stats.avaliacao || stats.rating;
      setText("stat-avaliacao", a.value ?? a);
      if (a.sub) setText("stat-avaliacao-sub", a.sub);
    }
  }

  renderTurmas(d.turmas || d.classes || []);
  renderActivities(d.activities || []);
  renderCompletionsChart(d.completionsChart || d.chart || []);
  renderTopAlunos(d.topAlunos || d.topStudents || []);
  renderPending(d.pending || d.tarefasPendentes || []);

  console.log("Dashboard data loaded:", d);
}

document.addEventListener("DOMContentLoaded", loadDashboard);
