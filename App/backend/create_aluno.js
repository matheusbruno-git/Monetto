// backend/create_aluno.js
const db = require("./connection.js");

async function registerAluno(dados) {
  try {
    const sql = `
      INSERT INTO usuarios 
      (id_usuario, id_perfil, id_escola, nome, data_nascimento, cpf, responsavel, 
       telefone_responsavel, email_responsavel, serie)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const id_aluno = require('uuid').v4();

    await db.promise().execute(sql, [
      id_aluno,
      dados.id_escola,
      dados.nome,
      dados.data_nascimento,
      dados.cpf,
      dados.responsavel,
      dados.telefone_responsavel,
      dados.email_responsavel,
      dados.serie
    ]);

    return { success: true, message: "Aluno cadastrado com sucesso!" };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Erro ao cadastrar aluno." };
  }
}

module.exports = { registerAluno };