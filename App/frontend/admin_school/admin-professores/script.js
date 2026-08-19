document.getElementById("btn").addEventListener("click", registerTeacher);
document.getElementById("btn").addEventListener("click", function() {
    document.getElementById('addModal').classList.remove('open');
});

async function registerTeacher() {
  const session = JSON.parse(localStorage.getItem('session') || '{}');
  const fullName = document.getElementById("nome").value + " " + document.getElementById("sobrenome").value;
  const dados = {
    id_escola: session.id_escola,
    nome: fullName,
    data_nascimento: document.getElementById("data-nascimento").value,
    cpf: document.getElementById("cpf").value,
    telefone: document.getElementById("tel").value,
    email: document.getElementById("email").value,
    senha_provisoria: document.getElementById("senha-provisoria").value
  };

  if (!dados.id_escola) {
    console.error('Sessão inválida — faça login novamente.');
    return;
  }

  const result = await window.api.registerProfessor(dados);
  console.log(result);
  alert(result.message);
  
};