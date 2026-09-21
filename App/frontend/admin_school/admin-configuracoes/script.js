function toast(message, type) {
  if (typeof MonettoUI !== "undefined") MonettoUI.toast(message, type);
  else alert(message);
}

function currentUserId() {
  const session = JSON.parse(localStorage.getItem("session") || "{}");
  return session.id_usuario || session.id || null;
}

async function loadProfile() {
  const id = currentUserId();
  if (!id) return toast("Sessão não encontrada. Faça login novamente.", "error");

  const result = await window.api.getAdminProfile(id);
  if (!result?.success) return toast(result?.message || "Não foi possível carregar o perfil.", "error");

  const profile = result.data;
  document.getElementById("school-name").textContent = profile.escola?.nome || "Escola";
  document.getElementById("perfil-email-escola").textContent = profile.email || "—";
  document.getElementById("campo-nome").value = profile.nome || "";
  document.getElementById("campo-email").value = profile.email || "";
}

async function saveProfile() {
  const id = currentUserId();
  const result = await window.api.updateAdmin({
    id_usuario: id,
    nome: document.getElementById("campo-nome").value.trim(),
    email: document.getElementById("campo-email").value.trim(),
  });
  if (!result?.success) return toast(result?.message || "Não foi possível salvar o perfil.", "error");

  const session = JSON.parse(localStorage.getItem("session") || "{}");
  session.nome = document.getElementById("campo-nome").value.trim();
  session.email = document.getElementById("campo-email").value.trim();
  localStorage.setItem("session", JSON.stringify(session));
  toast(result.message, "success");
  loadProfile();
}

async function savePassword() {
  const atual = document.getElementById("senha-atual").value;
  const nova = document.getElementById("nova-senha").value;
  const confirmacao = document.getElementById("confirmar-senha").value;
  if (nova !== confirmacao) return toast("A confirmação da senha não corresponde.", "error");

  const result = await window.api.changeAdminPassword({
    id_usuario: currentUserId(), senhaAtual: atual, novaSenha: nova,
  });
  if (!result?.success) return toast(result?.message || "Não foi possível alterar a senha.", "error");

  document.getElementById("senha-atual").value = "";
  document.getElementById("nova-senha").value = "";
  document.getElementById("confirmar-senha").value = "";
  toast(result.message, "success");
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("save-btn").addEventListener("click", saveProfile);
  document.getElementById("save-password").addEventListener("click", savePassword);
  loadProfile().catch((error) => {
    console.error("Erro ao carregar perfil:", error);
    toast("Erro de comunicação ao carregar o perfil.", "error");
  });
});
