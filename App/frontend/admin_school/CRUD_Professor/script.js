document.getElementById("btn").addEventListener("click", async () => {
  const dados = {
    id_escola: "123",
    nome: document.getElementById("nome").value,
    data_nascimento: document.getElementById("data").value,
    cpf: document.getElementById("cpf").value,
    telefone: document.getElementById("tel").value,
    email: document.getElementById("email").value,
    serie: document.getElementById("serie").value
  };

  const result = await window.api.registerProfessor(dados);
  console.log(result);
});