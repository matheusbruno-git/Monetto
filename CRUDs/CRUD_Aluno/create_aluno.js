const db = require("../../db");
const { v4: uuidv4 } = require('uuid');

function createAluno(dados) {
  return {
    id_aluno: uuidv4(),
    id_escola: dados.id_escola,
    nome: dados.nome,
    data_nascimento: dados.data_nascimento,
    cpf: dados.cpf,
    responsavel: dados.responsavel,
    telefone_responsavel: dados.telefone_responsavel,
    email_responsavel: dados.email_responsavel,
    serie: dados.serie
  };
}

module.exports = { createAluno, registerAluno };

function registerAluno(dados) {
  try {
    const aluno = createAluno(dados);
    db.prepare(`
      INSERT INTO aluno (id_aluno, id_escola, nome, data_nascimento, cpf, responsavel, telefone_responsavel, email_responsavel, serie)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(aluno.id_aluno, aluno.id_escola, aluno.nome, aluno.data_nascimento, aluno.cpf, aluno.responsavel, aluno.telefone_responsavel, aluno.email_responsavel, aluno.serie);

    return { success: true, message: "Aluno cadastrado!" };

  } catch (err) {
    return { success: false, message: "Erro ao cadastrar aluno." };
  }
}

document.getElementById("btn").addEventListener("click", async () => {

  const dados = {
    id_escola: "SUA_ESCOLA_ID_AQUI", // coloque o ID real
    nome: document.getElementById("nome").value,
    data_nascimento: document.getElementById("data").value,
    cpf: document.getElementById("cpf").value,
    responsavel: document.getElementById("resp").value,
    telefone_responsavel: document.getElementById("tel").value,
    email_responsavel: document.getElementById("email").value,
    serie: document.getElementById("serie").value
  };

  const result = await window.api.registerAluno(dados);

  const msg = document.getElementById("msg");
  msg.textContent = result.message;
  msg.style.color = result.success ? "green" : "red";
});