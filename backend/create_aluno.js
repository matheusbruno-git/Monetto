const db = require("./connection.js");
const { v4: uuidv4 } = require("uuid");

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

function registerAluno(dados) {
  try {
    const aluno = createAluno(dados);

    db.prepare(`
      INSERT INTO aluno
      (id_aluno,id_escola,nome,data_nascimento,cpf,responsavel,telefone_responsavel,email_responsavel,serie)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(
      aluno.id_aluno,
      aluno.id_escola,
      aluno.nome,
      aluno.data_nascimento,
      aluno.cpf,
      aluno.responsavel,
      aluno.telefone_responsavel,
      aluno.email_responsavel,
      aluno.serie
    );

    return { success: true, message: "Aluno cadastrado!" };

  } catch (err) {
    console.log(err);
    return { success: false, message: "Erro ao cadastrar." };
  }
}

module.exports = { registerAluno };