// backend/create_aluno.js
const db = require("./connection.js");
const { v4: uuidv4 } = require("uuid");

async function registerAluno(dados) {
  try {
    // Note: the application treats id_perfil = 1 as "aluno"
    const sql = `
      INSERT INTO usuarios
        (id_usuario, id_perfil, id_escola, nome, data_nascimento, cpf,
         responsavel, telefone_responsavel, email_responsavel, serie)
      VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const id_aluno = uuidv4();

    await db.promise().execute(sql, [
      id_aluno,                       // id_usuario
      dados.id_escola,                // id_escola
      dados.nome,                     // nome
      dados.data_nascimento,          // data_nascimento
      dados.cpf,                      // cpf
      dados.responsavel,              // responsavel
      dados.telefone_responsavel,     // telefone_responsavel
      dados.email_responsavel,        // email_responsavel
      dados.serie,                    // serie
    ]);

    return { success: true, message: "Aluno cadastrado com sucesso!" };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Erro ao cadastrar aluno." };
  }
}

module.exports = { registerAluno };