function switchTab(id, btn) {
  document.querySelectorAll(".ttab").forEach((t) => t.classList.remove("active"));
  ["tarefa", "quiz", "jogo"].forEach((t) => {
    const el = document.getElementById("tab-" + t);
    if (el) el.style.display = "none";
  });
  if (btn) btn.classList.add("active");
  const target = document.getElementById("tab-" + id);
  if (target) target.style.display = "block";
}

function selTipo(el) {
  el.closest(".tipo-grid")
    ?.querySelectorAll(".tipo-btn")
    .forEach((b) => b.classList.remove("selected"));
  el.classList.add("selected");
}

function selDif(el, cls) {
  document.querySelectorAll(".dif-btn").forEach((b) => {
    b.classList.remove("sel-g", "sel-y", "sel-r");
  });
  el.classList.add(cls);
}

function sairDaConta(destino) {
  if (confirm("Tem certeza que deseja sair da conta?")) {
    localStorage.removeItem("session");
    window.location.href = destino;
  }
}

function getCurrentUserId() {
  try {
    const session = JSON.parse(localStorage.getItem("session") || "{}");
    return session.id_usuario || session.id || null;
  } catch (e) {
    return null;
  }
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem("session") || "{}");
  } catch (e) {
    return {};
  }
}

async function loadCursos() {
  try {
    if (!window.api?.getCursos) return;

    const result = await window.api.getCursos();
    if (!result.success) return;

    const selects = document.querySelectorAll("select[data-cursos]");
    selects.forEach((sel) => {
      sel.innerHTML = (result.data || [])
        .map((c) => `<option value="${c.id_curso}">${c.nome}</option>`)
        .join("");
    });
  } catch (err) {
    console.error("loadCursos:", err);
  }
}

async function loadTarefasList() {
  const listArea = document.getElementById("tarefasList");
  if (!listArea) return;

  listArea.innerHTML =
    '<div style="color:var(--muted);font-size:.82rem;padding:8px 0">Carregando...</div>';

  try {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      listArea.innerHTML =
        '<div style="color:red;font-size:.82rem;padding:8px 0">Sessão inválida. Faça login novamente.</div>';
      return;
    }

    const result = await window.api.getTarefas(currentUserId);
    if (!result.success) {
      listArea.innerHTML = `<div style="color:red;font-size:.82rem;padding:8px 0">${result.message || "Erro ao carregar tarefas."}</div>`;
      return;
    }
    if (!result.data || !result.data.length) {
      listArea.innerHTML =
        '<div style="color:var(--muted);font-size:.82rem;padding:8px 0">Nenhuma tarefa criada ainda.</div>';
      return;
    }

    listArea.innerHTML = result.data
      .map((t) => {
        const vence = t.data_vencimento
          ? new Date(t.data_vencimento).toLocaleDateString("pt-BR")
          : "—";
        const disc = t.disciplina ?? "—";
        return `
        <div style="padding:12px 0;border-bottom:1px solid var(--border)">
          <div style="font-weight:600;font-size:.88rem;margin-bottom:3px">${t.titulo || "Sem título"}</div>
          <div style="font-size:.75rem;color:var(--muted)">${disc} · Vence ${vence}</div>
        </div>`;
      })
      .join("");

    const countEl = document.querySelector(".list-hd span");
    if (countEl) countEl.textContent = result.data.length + " tarefas";
  } catch (err) {
    listArea.innerHTML = `<div style="color:red;font-size:.82rem">Erro: ${err.message}</div>`;
  }
}

async function publicarTarefa() {
  const btn = document.getElementById("btn");
  const msgEl = document.getElementById("formMsg");

  const titulo =
    document
      .querySelector(
        '#tab-tarefa input[placeholder*="Título"], #tab-tarefa input[placeholder*="Exercícios"]',
      )
      ?.value.trim() ||
    document.querySelector("#tab-tarefa .fg:first-child input")?.value.trim();
  const descricao = document.querySelector("#tab-tarefa textarea")?.value.trim();
  const id_curso = document.querySelector(
    "#tab-tarefa select[data-cursos]",
  )?.value;
  const data_venc = document.querySelector(
    '#tab-tarefa input[type="datetime-local"]',
  )?.value;

  if (!titulo) {
    showMsg(msgEl, "O título é obrigatório.", false);
    return;
  }
  if (!id_curso) {
    showMsg(msgEl, "Selecione uma disciplina.", false);
    return;
  }
  if (!data_venc) {
    showMsg(msgEl, "Defina um prazo de entrega.", false);
    return;
  }

  const session = getSession();
  const id_usuario = session.id_usuario || session.id || null;
  const id_escola = session.id_escola || null;

  if (!id_usuario) {
    showMsg(msgEl, "Sessão inválida. Faça login novamente.", false);
    return;
  }

  const data_vencimento = data_venc.split("T")[0];

  if (btn) {
    btn.disabled = true;
    btn.textContent = "⏳ Publicando...";
  }

  const result = await window.api.registerTarefa({
    id_escola: id_escola || undefined,
    id_usuario,
    id_professor: id_usuario,
    id_curso: parseInt(id_curso, 10),
    titulo,
    descricao,
    data_vencimento,
  });

  if (btn) {
    btn.disabled = false;
    btn.textContent = "🚀 Publicar Tarefa";
  }

  showMsg(msgEl, result.message, result.success);

  if (result.success) {
    const titleInput =
      document.querySelector("#tab-tarefa .fg:first-child input") ||
      document.querySelector(
        '#tab-tarefa input[placeholder*="Título"], #tab-tarefa input[placeholder*="Exercícios"]',
      );
    if (titleInput) titleInput.value = "";
    const ta = document.querySelector("#tab-tarefa textarea");
    if (ta) ta.value = "";
    const dt = document.querySelector('#tab-tarefa input[type="datetime-local"]');
    if (dt) dt.value = "";
    loadTarefasList();
  }
}

function showMsg(el, text, success) {
  if (!el) {
    alert(text);
    return;
  }
  el.textContent = text;
  el.style.color = success ? "var(--green)" : "var(--red)";
  el.style.display = "block";
  setTimeout(() => {
    el.style.display = "none";
  }, 3500);
}

document.addEventListener("DOMContentLoaded", () => {
  loadCursos();
  loadTarefasList();
  const btn = document.getElementById("btn");
  if (btn) btn.addEventListener("click", publicarTarefa);
});