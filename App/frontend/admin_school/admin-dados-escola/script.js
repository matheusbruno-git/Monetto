function showToast(msg, tipo) {
  if (typeof MonettoUI !== "undefined") {
    MonettoUI.toast(msg || "Ação realizada!", tipo || "success");
  }
}

// Only ever ask for this logged-in admin's own school — the backend
// re-derives id_escola from the user id server-side, so nothing here
// can accidentally show another school's data.
async function loadDadosEscola() {
  const session = JSON.parse(localStorage.getItem("session") || "{}");
  const currentUserId = session.id_usuario || session.id;
  if (!currentUserId || !window.api?.getDashboardAdminEscolar) return;

  const result = await window.api.getDashboardAdminEscolar(currentUserId);
  if (!result.success) return;

  const d = result.data;
  const nomeEl = document.getElementById("campo-nome-escola");
  if (nomeEl) nomeEl.value = d.school.name;
  const cidadeEl = document.getElementById("campo-cidade-estado");
  if (cidadeEl) cidadeEl.value = d.school.subtitle || "";

  const [statAlunos, , statTarefas] = d.stats || [];
  const alunosEl = document.getElementById("resumo-alunos");
  if (alunosEl) alunosEl.textContent = statAlunos ? statAlunos.value : "0";
  const [, professores, turmas] = d.school.stats || [];
  const profEl = document.getElementById("resumo-professores");
  if (profEl) profEl.textContent = professores ? professores.value : "0";
  const turmasEl = document.getElementById("resumo-turmas");
  if (turmasEl) turmasEl.textContent = turmas ? turmas.value : "0";
}

const successDisplay = document.querySelector(".success-display");

function showSuccess() {
  successDisplay.classList.add("active");

  setTimeout(() => {
    hideSuccess();
  }, 2000);
}

function hideSuccess() {
  successDisplay.classList.remove("active");
  window.load("../dashboard-admin-escolar/dashboard-admin-escolar.html");
}

successDisplay.addEventListener("click", (event) => {
  if (event.target === successDisplay) {
    hideSuccess();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hideSuccess();
  }
});

async function salvarEscola() {
  const session = JSON.parse(localStorage.getItem("session") || "{}");
  const currentUserId = session.id_usuario || session.id;
  if (!currentUserId) return;

  const nome = document.getElementById("campo-nome-escola").value.trim();
  const email = document.getElementById("email-escola").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const endereco = document.getElementById("endereco").value.trim();
  const cnpj = document.getElementById("cnpj").value.trim();
  const id_escola = session.id_escola || session.id;

  try {
    const result = await window.api.updateEscola({
      nome,
      email,
      telefone,
      endereco,
      cnpj,
      id_escola,
    });
    if (result.success) {
      showToast("Escola atualizada com sucesso!", "success");

      session.nome = nome;
      session.email = email;
      localStorage.setItem("session", JSON.stringify(session));

      showSuccess();

      loadDadosEscola();
    } else {
      showToast(result.message || "Falha ao atualizar escola.", "error");
      alert(result.message || "Falha ao atualizar escola.", "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Erro de comunicação com o servidor.", "error");
  }
}

document.addEventListener("DOMContentLoaded", loadDadosEscola);
document.getElementById("save-btn").addEventListener("click", salvarEscola);
