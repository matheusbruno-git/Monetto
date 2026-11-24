(() => {
  const $ = (selector) => document.querySelector(selector);
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

  function getSession() {
    try { return JSON.parse(localStorage.getItem("session") || "{}"); }
    catch (_) { return {}; }
  }

  function showMessage(message, success) {
    const element = $("#formMsg");
    if (!element) return;
    element.textContent = message;
    element.className = `form-message ${success ? "is-success" : "is-error"}`;
  }

  async function loadCursos() {
    const select = $("#disciplinaTarefa");
    if (!select || !window.api?.getCursos) return;
    try {
      const result = await window.api.getCursos();
      if (!result?.success) throw new Error(result?.message || "Não foi possível carregar disciplinas.");
      const courses = result.data || [];
      select.innerHTML = '<option value="">Selecione a disciplina</option>' + courses.map((course) => `<option value="${escapeHtml(course.id_curso)}">${escapeHtml(course.nome)}</option>`).join("");
      if (!courses.length) select.innerHTML = '<option value="">Nenhuma disciplina disponível</option>';
    } catch (error) {
      select.innerHTML = '<option value="">Erro ao carregar disciplinas</option>';
      showMessage(error.message, false);
    }
  }

  async function loadTarefasList() {
    const list = $("#tarefasList");
    const count = $("#tarefasCount");
    if (!list) return;
    const session = getSession();
    const id = session.id_usuario || session.id;
    if (!id || !window.api?.getTarefas) {
      list.innerHTML = '<div class="list-empty">Entre novamente para consultar suas tarefas.</div>';
      if (count) count.textContent = "";
      return;
    }
    try {
      const result = await window.api.getTarefas(id);
      if (!result?.success) throw new Error(result?.message || "Não foi possível carregar tarefas.");
      const tasks = result.data || [];
      if (count) count.textContent = `${tasks.length} tarefa${tasks.length === 1 ? "" : "s"}`;
      if (!tasks.length) {
        list.innerHTML = '<div class="list-empty">Você ainda não publicou uma tarefa.</div>';
        return;
      }
      list.innerHTML = tasks.slice(0, 8).map((task) => {
        const due = task.data_vencimento ? new Date(`${String(task.data_vencimento).slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR") : "Sem prazo";
        return `<div class="task-list-item"><span class="task-list-icon">▤</span><div class="task-list-copy"><strong>${escapeHtml(task.titulo || "Tarefa")}</strong><span>${escapeHtml(task.disciplina || "Geral")} · ${due}</span></div></div>`;
      }).join("");
    } catch (error) {
      list.innerHTML = `<div class="list-empty">${escapeHtml(error.message)}</div>`;
      if (count) count.textContent = "";
    }
  }

  async function publishTask(event) {
    event.preventDefault();
    const button = $("#btn");
    const session = getSession();
    const id = session.id_usuario || session.id;
    const title = $("#tituloTarefa").value.trim();
    const course = $("#disciplinaTarefa").value;
    const due = $("#prazoTarefa").value;
    if (!id) return showMessage("Sessão inválida. Faça login novamente.", false);
    if (!title || !course || !due) return showMessage("Preencha o título, a disciplina e o prazo.", false);
    if (!window.api?.registerTarefa) return showMessage("Serviço de publicação indisponível.", false);
    button.disabled = true;
    button.querySelector("span").textContent = "Publicando…";
    try {
      const result = await window.api.registerTarefa({
        id_escola: session.id_escola || undefined,
        id_usuario: id,
        id_professor: id,
        id_curso: Number(course),
        titulo: title,
        descricao: $("#descricaoTarefa").value.trim(),
        data_vencimento: due,
      });
      if (!result?.success) throw new Error(result?.message || "Erro ao publicar tarefa.");
      showMessage(result.message || "Tarefa publicada com sucesso.", true);
      $("#taskForm").reset();
      await loadTarefasList();
    } catch (error) {
      showMessage(error.message, false);
    } finally {
      button.disabled = false;
      button.querySelector("span").textContent = "Publicar tarefa";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadCursos();
    loadTarefasList();
    $("#taskForm")?.addEventListener("submit", publishTask);
  });
})();
