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

function getCurrentUserId() {
  try {
    const session = JSON.parse(localStorage.getItem("session") || "{}");
    return session.id_usuario || session.id || null;
  } catch (e) {
    return null;
  }
}

function setTab(el) {
  document.querySelectorAll(".ftab").forEach((t) => t.classList.remove("active"));
  el.classList.add("active");
}

function openModal(aluno) {
  if (aluno) {
    const nameEl = document.getElementById("modalName");
    const emailEl = document.getElementById("modalEmail");
    const xpEl = document.getElementById("modalXP");
    const levelEl = document.getElementById("modalLevel");
    if (nameEl) nameEl.textContent = aluno.nome || "—";
    if (emailEl)
      emailEl.textContent =
        (aluno.email || "—") + " · " + (aluno.turma || "—");
    if (xpEl) xpEl.textContent = aluno.xp != null ? aluno.xp : "—";
    if (levelEl) levelEl.textContent = "Nível " + xpToLevel(aluno.xp);
  }
  document.getElementById("modalOverlay")?.classList.add("open");
}

function closeModal() {
  document.getElementById("modalOverlay")?.classList.remove("open");
}

document.getElementById("modalOverlay")?.addEventListener("click", function (e) {
  if (e.target === this) closeModal();
});

function sairDaConta(destino) {
  if (confirm("Tem certeza que deseja sair da conta?")) {
    localStorage.removeItem("session");
    window.location.href = destino;
  }
}

const AV_CLASSES = ["av1", "av2", "av3", "av4", "av5", "av6", "av7", "av8"];

function xpToLevel(xp) {
  if (!xp) return 1;
  if (xp >= 1000) return 6;
  if (xp >= 700) return 5;
  if (xp >= 500) return 4;
  if (xp >= 300) return 3;
  if (xp >= 150) return 2;
  return 1;
}

function statusChip(ativo) {
  if (ativo == 1 || ativo === true)
    return '<span class="status-chip sc-ok">✓ Ativo</span>';
  return '<span class="status-chip sc-bad">✕ Inativo</span>';
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderRow(aluno, index) {
  const avClass = AV_CLASSES[index % AV_CLASSES.length];
  const nivel = xpToLevel(aluno.xp);
  const xp = aluno.xp != null ? aluno.xp : "—";
  const turma = aluno.turma || "—";
  const nome = escapeHtml(aluno.nome);
  const email = escapeHtml(aluno.email);
  const payload = encodeURIComponent(JSON.stringify(aluno));

  return `
    <div class="tr" data-aluno="${payload}" onclick="openModalFromRow(this)">
      <div class="td-aluno">
        <div class="ava ${avClass}"></div>
        <div>
          <div class="al-name">${nome}</div>
          <div class="al-email">${email}</div>
        </div>
      </div>
      <div class="td-muted">${escapeHtml(turma)}</div>
      <div><span class="xp-chip">⚡ ${xp}</span></div>
      <div><span class="lvl-chip">Nível ${nivel}</span></div>
      <div class="td-text">—</div>
      <div>${statusChip(aluno.ativo)}</div>
      <div class="td-actions">
        <button class="act-btn" onclick="event.stopPropagation();openModalFromRow(this.closest('.tr'))">👁</button>
        <button class="act-btn" onclick="event.stopPropagation()">✉️</button>
      </div>
    </div>`;
}

function openModalFromRow(rowEl) {
  try {
    const raw = rowEl?.getAttribute("data-aluno");
    if (!raw) return;
    openModal(JSON.parse(decodeURIComponent(raw)));
  } catch (e) {
    console.error(e);
  }
}

window.openModalFromRow = openModalFromRow;
window.openModal = openModal;
window.closeModal = closeModal;
window.setTab = setTab;
window.sairDaConta = sairDaConta;

let allAlunos = [];
let currentFilter = "todos";

function renderAlunos(alunos) {
  const container = document.getElementById("alunosContainer");
  if (!container) return;

  if (!alunos.length) {
    container.innerHTML =
      '<div style="padding:2rem;text-align:center;color:var(--muted)">Nenhum aluno encontrado nas suas turmas.</div>';
    return;
  }

  container.innerHTML = alunos.map((a, i) => renderRow(a, i)).join("");
}

function applyFilters() {
  const searchInput = document.querySelector(".search-box input");
  const q = (searchInput?.value || "").trim().toLowerCase();
  const turmaSelect = document.querySelector(".filter-select");
  const turmaVal = turmaSelect?.value || "";

  let list = allAlunos.slice();

  if (turmaVal && turmaVal !== "Todas as turmas") {
    list = list.filter((a) => a.turma === turmaVal);
  }

  if (currentFilter === "ativos") {
    list = list.filter((a) => a.ativo == 1 || a.ativo === true);
  } else if (currentFilter === "inativos" || currentFilter === "atencao") {
    list = list.filter((a) => !(a.ativo == 1 || a.ativo === true));
  }

  if (q) {
    list = list.filter(
      (a) =>
        (a.nome || "").toLowerCase().includes(q) ||
        (a.email || "").toLowerCase().includes(q),
    );
  }

  renderAlunos(list);
}

function updateStats(stats, turmas) {
  const total = stats?.total ?? allAlunos.length;
  const ativos = stats?.ativos ?? allAlunos.filter((a) => a.ativo).length;
  const atencao = stats?.atencao ?? Math.max(0, total - ativos);
  const taxa = stats?.taxaConclusao ?? 0;
  const turmasCount = stats?.turmasCount ?? turmas?.length ?? 0;

  const subtitle = document.querySelector(".topbar p");
  if (subtitle) {
    subtitle.textContent = `${total} aluno${total !== 1 ? "s" : ""} em ${turmasCount} turma${turmasCount !== 1 ? "s" : ""}`;
  }

  const vals = document.querySelectorAll(".stats-mini .sm-val");
  if (vals[0]) vals[0].textContent = String(total);
  if (vals[1]) vals[1].textContent = String(ativos);
  if (vals[2]) vals[2].textContent = String(atencao);
  if (vals[3]) vals[3].textContent = taxa + "%";

  const ftabs = document.querySelectorAll(".filter-bar .ftab");
  if (ftabs[0]) ftabs[0].textContent = `Todos (${total})`;

  const select = document.querySelector(".filter-select");
  if (select && turmas && turmas.length) {
    select.innerHTML =
      '<option value="Todas as turmas">Todas as turmas</option>' +
      turmas
        .map((t) => `<option value="${escapeHtml(t.nome)}">${escapeHtml(t.nome)}</option>`)
        .join("");
  }
}

function bindFilters() {
  document.querySelectorAll(".filter-bar .ftab").forEach((tab, i) => {
    tab.addEventListener("click", () => {
      setTab(tab);
      if (i === 0) currentFilter = "todos";
      else if (i === 1) currentFilter = "ativos";
      else if (i === 2) currentFilter = "atencao";
      else currentFilter = "inativos";
      applyFilters();
    });
  });

  document.querySelector(".search-box input")?.addEventListener("input", applyFilters);
  document.querySelector(".filter-select")?.addEventListener("change", applyFilters);
}

async function loadAlunos() {
  const container = document.getElementById("alunosContainer");
  const currentUserId = getCurrentUserId();

  if (!currentUserId) {
    if (container) {
      container.innerHTML =
        '<div style="padding:2rem;text-align:center;color:red">Sessão inválida. Faça login novamente.</div>';
    }
    return;
  }

  try {
    let result;
    if (window.api?.getAlunosProfessor) {
      result = await window.api.getAlunosProfessor(currentUserId);
    } else {
      result = await window.api.getAlunos(currentUserId);
    }

    if (!result.success) {
      if (container) {
        container.innerHTML = `<div style="padding:2rem;text-align:center;color:red">${result.message || "Erro ao carregar alunos."}</div>`;
      }
      return;
    }

    allAlunos = (result.data || []).map((a) => ({
      ...a,
      xp: a.xp != null ? Number(a.xp) : 0,
      ativo: a.ativo == 1 || a.ativo === true,
    }));

    updateStats(result.stats, result.turmas);
    bindFilters();
    applyFilters();

    console.log("Alunos do professor carregados:", allAlunos.length);
  } catch (err) {
    console.error(err);
    if (container) {
      container.innerHTML = `<div style="padding:2rem;text-align:center;color:red">Erro: ${err.message}</div>`;
    }
  }
}

document.addEventListener("DOMContentLoaded", loadAlunos);