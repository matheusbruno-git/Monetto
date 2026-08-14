document.getElementById("btn").addEventListener("click", async () => {
  // id_escola comes from the logged-in admin's own session, never a hardcoded
  // value, so a new teacher is always registered into the admin's own school.
  const session = JSON.parse(localStorage.getItem('session') || '{}');
  const dados = {
    id_escola: session.id_escola,
    nome: document.getElementById("nome").value,
    data_nascimento: document.getElementById("data").value,
    cpf: document.getElementById("cpf").value,
    telefone: document.getElementById("tel").value,
    email: document.getElementById("email").value,
    serie: document.getElementById("serie").value,
    foto_url: document.getElementById("foto").value
  };

  if (!dados.id_escola) {
    console.error('Sessão inválida — faça login novamente.');
    return;
  }

  const result = await window.api.registerProfessor(dados);
  console.log(result);
});