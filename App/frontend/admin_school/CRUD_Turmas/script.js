// ============================================================
// CRIAR / GERENCIAR TURMAS + ATRIBUIR ALUNOS
// ============================================================

let turmas = [];
let alunos = [];
let turmaSelecionadaId = null;
let alunosSelecionados = new Set();

function getSession() {
  try {
    return JSON.parse(localStorage.getItem("session") || "{}");
  } catch {
    return {};
  }
}

function currentUserId() {
  const session = getSession();
  return session.id_usuario || session.id || null;
}

function showMsg(text, success = false) {
  const el = document.getElementById("formMsg");
  if (!el) return;
  el.textContent = text || "";
  el.className = success ? "ok" : "err";
  el.style.display = "block";
  clearTimeout(showMsg.timer);
  showMsg.timer = setTimeout(() => {
    el.style.display = "none";
  }, 3500);
}

async function loadNiveis() {
  const sel = document.getElementById("nivelSelect");
  if (!sel || !window.api?.getNiveis) return;

  try {
    const result = await window.api.getNiveis();
    if (!result.success) throw new Error(result.message || "Erro ao carregar níveis.");

    sel.innerHTML =
      '<option value="">Selecione o nível...</option>' +
      (result.data || [])
        .map(n => `<option value="${n.id_nivel}">${escapeHtml(n.nome)}</option>`)
        .join("");
  } catch (err) {
    console.error("loadNiveis:", err);
    showMsg("Não foi possível carregar os níveis.", false);
  }
}

async function loadAlunos() {
  const id = currentUserId();
  if (!id || !window.api?.getAlunos) return;

  try {
    const result = await window.api.getAlunos(id);
    if (!result.success) throw new Error(result.message || "Erro ao carregar alunos.");
    alunos = Array.isArray(result.data) ? result.data : [];
  } catch (err) {
    console.error("loadAlunos:", err);
    alunos = [];
  }
}

async function loadTurmasList() {
  const body = document.getElementById("turmasListBody");
  const count = document.getElementById("turmasCount");
  if (!body) return;

  body.innerHTML = '<div class="empty-state">Carregando...</div>';

  const id = currentUserId();
  if (!id) {
    body.innerHTML = '<div class="empty-state">Sessão inválida — faça login novamente.</div>';
    return;
  }

  try {
    const result = await window.api.getTurmas(id);
    if (!result.success) throw new Error(result.message || "Erro ao carregar turmas.");

    turmas = Array.isArray(result.data) ? result.data : [];
    if (count) count.textContent = `${turmas.length} turma${turmas.length === 1 ? "" : "s"}`;

    if (!turmas.length) {
      body.innerHTML = '<div class="empty-state">Nenhuma turma criada ainda.</div>';
      return;
    }

    body.innerHTML = turmas.map(t => {
      const roster = alunos.filter(a => Number(a.id_turma) === Number(t.id_turma));
      const rosterHtml = roster.length
        ? roster.map(a => `<span class="student-chip">${escapeHtml(a.nome)}</span>`).join("")
        : '<span style="color:var(--muted)">Nenhum aluno atribuído</span>';

      return `
        <div class="turma-card">
          <div class="turma-head">
            <div>
              <h4>${escapeHtml(t.nome_turma || "Turma")}</h4>
              <span style="color:var(--muted);font-size:.78rem">
                ${escapeHtml(t.nivel || "—")} · ${escapeHtml(String(t.ano_letivo || ""))}
              </span>
            </div>
            <span style="color:${t.status === "ativa" ? "var(--green)" : "var(--muted)"};font-size:.72rem;font-weight:700">
              ● ${escapeHtml(t.status || "ativa")}
            </span>
          </div>

          <div class="turma-meta">
            <strong>Professor:</strong> ${escapeHtml(t.professor_nome || "—")}
            <div style="margin-top:10px"><strong>Alunos (${roster.length}):</strong></div>
            <div style="margin-top:5px">${rosterHtml}</div>
          </div>

          <div class="turma-actions">
            <button type="button" class="btn-acc" data-assign="${t.id_turma}">
              👥 Atribuir alunos
            </button>
            <button type="button" class="btn-cancel2" data-delete="${t.id_turma}">
              Excluir
            </button>
          </div>
        </div>
      `;
    }).join("");

    body.querySelectorAll("[data-assign]").forEach(btn => {
      btn.addEventListener("click", () => openStudentModal(Number(btn.dataset.assign)));
    });

    body.querySelectorAll("[data-delete]").forEach(btn => {
      btn.addEventListener("click", () => deleteTurma(Number(btn.dataset.delete)));
    });
  } catch (err) {
    console.error("loadTurmasList:", err);
    body.innerHTML = `<div class="empty-state" style="color:var(--red)">Erro: ${escapeHtml(err.message)}</div>`;
  }
}

async function criarTurma() {
  const btn = document.getElementById("btn");
  const nome_turma = document.getElementById("nomeTurma")?.value.trim();
  const id_nivel = document.getElementById("nivelSelect")?.value;
  const session = getSession();

  if (!nome_turma) return showMsg("O nome da turma é obrigatório.", false);
  if (!id_nivel) return showMsg("Selecione o nível educacional.", false);
  if (!session.id_escola || !currentUserId()) return showMsg("Sessão inválida — faça login novamente.", false);

  btn.disabled = true;
  btn.textContent = "⏳ Criando...";

  try {
    const result = await window.api.registerTurma({
      id_escola: Number(session.id_escola),
      id_professor: null,
      id_nivel: Number(id_nivel),
      nome_turma,
      ano_letivo: new Date().getFullYear()
    });

    if (!result.success) throw new Error(result.message || "Erro ao criar turma.");

    document.getElementById("nomeTurma").value = "";
    document.getElementById("nivelSelect").value = "";
    showMsg("Turma criada com sucesso.", true);

    await loadAlunos();
    await loadTurmasList();
  } catch (err) {
    console.error("criarTurma:", err);
    showMsg(err.message || "Erro ao criar turma.", false);
  } finally {
    btn.disabled = false;
    btn.textContent = "🚀 Criar Turma";
  }
}

async function openStudentModal(turmaId) {
  const turma = turmas.find(t => Number(t.id_turma) === Number(turmaId));
  if (!turma) return;

  turmaSelecionadaId = turmaId;

  const modal = document.getElementById("studentModal");
  const title = document.getElementById("studentModalTurmaNome");
  const search = document.getElementById("studentSearch");

  title.textContent = turma.nome_turma || "";
  search.value = "";

  alunosSelecionados = new Set(
    alunos
      .filter(a => Number(a.id_turma) === Number(turmaId))
      .map(a => String(a.id_usuario))
  );

  renderStudentOptions();

  modal.style.display = "flex";
  modal.setAttribute("aria-hidden", "false");
}

function renderStudentOptions() {
  const container = document.getElementById("studentAssignments");
  const term = (document.getElementById("studentSearch")?.value || "").trim().toLowerCase();

  const filtered = alunos.filter(a => {
    const name = String(a.nome || "").toLowerCase();
    const email = String(a.email || "").toLowerCase();
    return !term || name.includes(term) || email.includes(term);
  });

  if (!filtered.length) {
    container.innerHTML = '<div class="empty-state">Nenhum aluno encontrado.</div>';
    return;
  }

  container.innerHTML = filtered.map(a => {
    const id = String(a.id_usuario);
    const checked = alunosSelecionados.has(id);
    const turmaAtual = Number(a.id_turma || 0);
    const outraTurma = turmaAtual && turmaAtual !== Number(turmaSelecionadaId);
    const outraTurmaNome = outraTurma
      ? (turmas.find(t => Number(t.id_turma) === turmaAtual)?.nome_turma || "outra turma")
      : "";

    return `
      <label class="student-option">
        <input type="checkbox" data-student-id="${escapeHtml(id)}" ${checked ? "checked" : ""}>
        <span>
          <strong>${escapeHtml(a.nome || "Aluno")}</strong>
          <small>${escapeHtml(a.email || "")}${outraTurma ? ` · Atualmente em: ${escapeHtml(outraTurmaNome)}` : ""}</small>
        </span>
      </label>
    `;
  }).join("");

  container.querySelectorAll("[data-student-id]").forEach(cb => {
    cb.addEventListener("change", () => {
      const id = String(cb.dataset.studentId);
      if (cb.checked) alunosSelecionados.add(id);
      else alunosSelecionados.delete(id);
    });
  });
}

async function saveStudents() {
  if (!turmaSelecionadaId) return;

  const btn = document.getElementById("saveStudentsBtn");
  btn.disabled = true;
  btn.textContent = "⏳ Salvando...";

  try {
    const result = await window.api.saveAlunosTurma({
      id_turma: Number(turmaSelecionadaId),
      id_alunos: Array.from(alunosSelecionados).map(Number)
    });

    if (!result.success) throw new Error(result.message || "Erro ao salvar alunos.");

    closeStudentModal();
    await loadAlunos();
    await loadTurmasList();
  } catch (err) {
    console.error("saveStudents:", err);
    alert(err.message || "Erro ao salvar alunos.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Salvar Alunos";
  }
}

async function deleteTurma(id_turma) {
  if (!confirm("Tem certeza que deseja excluir esta turma?")) return;

  try {
    const result = await window.api.deleteTurma(id_turma);
    if (!result.success) throw new Error(result.message || "Erro ao excluir turma.");
    await loadAlunos();
    await loadTurmasList();
  } catch (err) {
    console.error("deleteTurma:", err);
    alert(err.message || "Erro ao excluir turma.");
  }
}

function closeStudentModal() {
  const modal = document.getElementById("studentModal");
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
  turmaSelecionadaId = null;
  alunosSelecionados = new Set();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("btn")?.addEventListener("click", criarTurma);
  document.getElementById("saveStudentsBtn")?.addEventListener("click", saveStudents);
  document.getElementById("closeStudentModal")?.addEventListener("click", closeStudentModal);
  document.getElementById("cancelStudentModal")?.addEventListener("click", closeStudentModal);
  document.getElementById("studentSearch")?.addEventListener("input", renderStudentOptions);

  await loadNiveis();
  await loadAlunos();
  await loadTurmasList();
});
