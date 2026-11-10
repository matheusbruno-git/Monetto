const TASK_TYPES = {
  exercicio: "Exercício",
  texto: "Texto",
  arquivo: "Envio de arquivo",
  leitura: "Leitura",
  video: "Vídeo",
  outro: "Outro",
};
const TASK_DIFFICULTIES = { facil: "Fácil", medio: "Médio", dificil: "Difícil" };

function getSession() {
  try { return JSON.parse(localStorage.getItem("session") || "{}"); }
  catch { return {}; }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function showMsg(text, success = false) {
  const el = document.getElementById("formMsg");
  if (!el) return;
  el.textContent = text || "";
  el.className = `form-message ${success ? "is-success" : "is-error"}`;
}

async function loadCursos() {
  const select = document.getElementById("disciplinaTarefa");
  try {
    if (!window.api?.getCursos) throw new Error("Serviço de disciplinas indisponível.");
    const result = await window.api.getCursos();
    if (!result?.success) throw new Error(result?.message || "Não foi possível carregar as disciplinas.");
    const courses = result.data || [];
    select.innerHTML = courses.length
      ? `<option value="">Selecione uma disciplina</option>${courses.map((course) => `<option value="${Number(course.id_curso)}">${escapeHtml(course.nome)}</option>`).join("")}`
      : '<option value="">Nenhuma disciplina disponível</option>';
  } catch (error) {
    select.innerHTML = '<option value="">Erro ao carregar disciplinas</option>';
    console.error("loadCursos:", error);
  }
}

function formatDate(value) {
  if (!value) return "Sem prazo";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "Sem prazo" : date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

async function loadTarefasList() {
  const list = document.getElementById("tarefasList");
  const count = document.getElementById("tarefasCount");
  const session = getSession();
  const userId = session.id_usuario || session.id;
  if (!userId) {
    list.innerHTML = '<div class="list-empty">Sua sessão expirou. Entre novamente para ver as tarefas.</div>';
    count.textContent = "0 tarefas";
    return;
  }
  try {
    const result = await window.api.getTarefas(userId);
    if (!result?.success) throw new Error(result?.message || "Não foi possível carregar as tarefas.");
    const tasks = result.data || [];
    count.textContent = `${tasks.length} ${tasks.length === 1 ? "tarefa" : "tarefas"}`;
    if (!tasks.length) {
      list.innerHTML = '<div class="list-empty">Suas tarefas publicadas aparecerão aqui.</div>';
      return;
    }
    list.innerHTML = tasks.slice(0, 6).map((task) => {
      const type = TASK_TYPES[task.tipo_tarefa] || "Tarefa";
      const xp = Math.max(0, Number(task.xp_recompensa) || 0);
      return `<article class="task-list-item">
        <div class="task-list-icon">${escapeHtml((type === "Exercício" ? "✎" : type === "Leitura" ? "▣" : type === "Vídeo" ? "▷" : "▤"))}</div>
        <div class="task-list-copy"><strong>${escapeHtml(task.titulo || "Sem título")}</strong><span>${escapeHtml(task.disciplina || "Sem disciplina")} · ${formatDate(task.data_vencimento)}</span></div>
        <span class="task-list-xp">+${xp}</span>
      </article>`;
    }).join("");
  } catch (error) {
    list.innerHTML = `<div class="list-empty">${escapeHtml(error.message || "Erro ao carregar as tarefas.")}</div>`;
    count.textContent = "Indisponível";
  }
}

function selectedValue(selector, fallback) {
  return document.querySelector(`${selector}.selected`)?.dataset[selector.includes("tipo") ? "tipo" : "dificuldade"] || fallback;
}

async function publicarTarefa() {
  const button = document.getElementById("btn");
  const session = getSession();
  const id_usuario = session.id_usuario || session.id || null;
  const titulo = document.getElementById("tituloTarefa").value.trim();
  const descricao = document.getElementById("descricaoTarefa").value.trim();
  const id_curso = Number(document.getElementById("disciplinaTarefa").value);
  const data_vencimento = document.getElementById("prazoTarefa").value;
  const xp_recompensa = Number(document.getElementById("xpTarefa").value);
  if (!titulo) return showMsg("Informe o título da tarefa.");
  if (!id_curso) return showMsg("Selecione uma disciplina.");
  if (!data_vencimento) return showMsg("Defina o prazo de entrega.");
  const today = new Date();
  const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  if (data_vencimento < localToday) return showMsg("O prazo precisa ser hoje ou uma data futura.");
  if (!Number.isInteger(xp_recompensa) || xp_recompensa < 0 || xp_recompensa > 500) return showMsg("Informe uma recompensa entre 0 e 500 XP.");
  if (!id_usuario) return showMsg("Sua sessão expirou. Entre novamente.");

  button.disabled = true;
  button.innerHTML = "<span>Publicando…</span><b>◌</b>";
  try {
    const result = await window.api.registerTarefa({
      id_escola: session.id_escola || undefined,
      id_usuario,
      id_professor: id_usuario,
      id_curso,
      titulo,
      descricao,
      data_vencimento,
      tipo_tarefa: selectedValue("[data-tipo]", "exercicio"),
      dificuldade: selectedValue("[data-dificuldade]", "medio"),
      xp_recompensa,
    });
    if (!result?.success) throw new Error(result?.message || "Não foi possível publicar a tarefa.");
    showMsg("Tarefa publicada! O tipo e a recompensa em XP foram salvos.", true);
    document.getElementById("tituloTarefa").value = "";
    document.getElementById("descricaoTarefa").value = "";
    document.getElementById("prazoTarefa").value = "";
    loadTarefasList();
  } catch (error) {
    showMsg(error.message || "Erro ao publicar a tarefa.");
  } finally {
    button.disabled = false;
    button.innerHTML = "<span>Publicar tarefa</span><b>→</b>";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadCursos();
  loadTarefasList();
  document.querySelectorAll("[data-tipo]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-tipo]").forEach((item) => item.classList.toggle("selected", item === button));
  }));
  document.querySelectorAll("[data-dificuldade]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-dificuldade]").forEach((item) => item.classList.toggle("selected", item === button));
  }));
  const xpInput = document.getElementById("xpTarefa");
  xpInput.addEventListener("input", () => { document.getElementById("xpPreview").textContent = xpInput.value || "0"; });
  document.getElementById("btn").addEventListener("click", publicarTarefa);
});
