document.getElementById("btn").addEventListener("click", async () => {
  const dados = {
    id_escola: "123",
    nome: document.getElementById("nome").value,
    data_nascimento: document.getElementById("data").value,
    cpf: document.getElementById("cpf").value,
    telefone: document.getElementById("tel").value,
    email: document.getElementById("email").value,
    serie: document.getElementById("serie").value,
    foto_url: document.getElementById("foto").value
  };

  const result = await window.api.registerProfessor(dados);
  console.log(result);
});

(() => {
  const container = document.getElementById("sidebar-container");
  if (!container) return;

  const sidebar = "../../Assets/Components/admin-school-sidebar.html";

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
