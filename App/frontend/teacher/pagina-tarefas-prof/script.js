function showPage(id, btn) {
  document.querySelectorAll(".ptab").forEach((t) => t.classList.remove("active"));
  const pageTarefas = document.getElementById("page-tarefas");
  const pageRelatorios = document.getElementById("page-relatorios");
  if (pageTarefas) pageTarefas.style.display = "none";
  if (pageRelatorios) pageRelatorios.style.display = "none";
  if (btn) btn.classList.add("active");
  const target = document.getElementById("page-" + id);
  if (target) target.style.display = "block";
  if (id === "relatorios") {
    const title = document.getElementById("pageTitle");
    const sub = document.getElementById("pageSub");
    const exportBtn = document.getElementById("exportBtn");
    if (title) title.textContent = "📊 Relatórios";
    if (sub) sub.textContent = "Análises de desempenho e engajamento";
    if (exportBtn) exportBtn.style.display = "block";
  } else {
    const title = document.getElementById("pageTitle");
    const exportBtn = document.getElementById("exportBtn");
    if (title) title.textContent = "📋 Página de Tarefas";
    if (exportBtn) exportBtn.style.display = "none";
  }
}

function setFtab(el) {
  document.querySelectorAll(".ftab").forEach((t) => t.classList.remove("active"));
  el.classList.add("active");
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

function classifyStatus(tarefa) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vence = tarefa.data_vencimento
    ? new Date(tarefa.data_vencimento)
    : null;
  if (vence) vence.setHours(0, 0, 0, 0);
  const expirada =
    tarefa.status === "expirada" || (vence && vence < hoje);
  const vencendo = !expirada && vence && vence.getTime() === hoje.getTime();
  if (expirada) return "expirada";
  if (vencendo) return "vencendo";
  return "ativa";
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function buildCard(tarefa, tipo) {
  const opacity = tipo === "expirada" ? "opacity:.7" : "";
  const footerLabel =
    tipo === "expirada"
      ? `<span>Expirou ${formatDate(tarefa.data_vencimento)}</span><span style="color:var(--red)">🔴 Expirada</span>`
      : tipo === "vencendo"
        ? `<span>Vence hoje 23:59</span><span style="color:var(--accent)">🟡 Atenção</span>`
        : `<span>Vence ${formatDate(tarefa.data_vencimento)}</span><span style="color:var(--green)">🟢 OK</span>`;

  const disc = tarefa.disciplina ?? "Geral";
  const desc = tarefa.descricao || "";

  return `
    <div class="tcard" style="${opacity}">
      <div class="tcard-title">${tarefa.titulo || "Sem título"}</div>
      <div class="tcard-meta">
        <span class="chip">${disc}</span>
        <span class="chip" style="opacity:.6;font-size:.7rem">${desc.slice(0, 30)}${desc.length > 30 ? "…" : ""}</span>
      </div>
      <div class="tcard-footer">${footerLabel}</div>
    </div>`;
}

async function loadTarefas() {
  try {
    if (!window.api?.getTarefas) {
      throw new Error(
        "window.api.getTarefas não encontrado — verifique o preload.js",
      );
    }

    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      ["ativas", "vencendo", "expiradas"].forEach((k) => {
        const el = document.getElementById("cards-" + k);
        if (el)
          el.innerHTML =
            '<div style="padding:1rem;color:red;font-size:.82rem">Sessão inválida. Faça login novamente.</div>';
      });
      return;
    }

    const result = await window.api.getTarefas(currentUserId);

    if (!result.success) {
      ["ativas", "vencendo", "expiradas"].forEach((k) => {
        const el = document.getElementById("cards-" + k);
        if (el)
          el.innerHTML = `<div style="padding:1rem;color:red;font-size:.82rem">Erro: ${result.message}</div>`;
      });
      return;
    }

    const grupos = { ativa: [], vencendo: [], expirada: [] };

    (result.data || []).forEach((t) => {
      const tipo = classifyStatus(t);
      if (tipo === "vencendo") grupos.vencendo.push(t);
      else if (tipo === "expirada") grupos.expirada.push(t);
      else grupos.ativa.push(t);
    });

    const setCards = (id, items, emptyMsg, tipo) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.innerHTML =
        items.map((t) => buildCard(t, tipo)).join("") ||
        `<div style="padding:1rem;color:var(--muted);font-size:.82rem">${emptyMsg}</div>`;
    };

    setCards("cards-ativas", grupos.ativa, "Nenhuma tarefa ativa.", "ativa");
    setCards("cards-vencendo", grupos.vencendo, "Nenhuma vencendo hoje.", "vencendo");
    setCards("cards-expiradas", grupos.expirada, "Nenhuma expirada.", "expirada");

    const cAtivas = document.getElementById("count-ativas");
    const cVenc = document.getElementById("count-vencendo");
    const cExp = document.getElementById("count-expiradas");
    if (cAtivas) cAtivas.textContent = grupos.ativa.length;
    if (cVenc) cVenc.textContent = grupos.vencendo.length;
    if (cExp) cExp.textContent = grupos.expirada.length;

    const total = (result.data || []).length;
    const vencendo = grupos.vencendo.length;
    const pageSub = document.getElementById("pageSub");
    if (pageSub) {
      pageSub.textContent = `${total} tarefa${total !== 1 ? "s" : ""} · ${vencendo} vencendo hoje`;
    }
  } catch (err) {
    console.error(err);
    const el = document.getElementById("cards-ativas");
    if (el)
      el.innerHTML = `<div style="padding:1rem;color:red;font-size:.82rem">Erro: ${err.message}</div>`;
  }
}

document.addEventListener("DOMContentLoaded", loadTarefas);