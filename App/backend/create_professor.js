// backend/create_professor.js
const db = require("./connection.js");

async function registerProfessor(dados) {
  try {
    const sql = `
      INSERT INTO usuarios 
      (id_perfil INT NOT NULL,
        id_escola INT, nome VARCHAR(150) NOT NULL, email VARCHAR(100) NOT NULL UNIQUE, senha_hash VARCHAR(255) NOT NULL, cpf VARCHAR(14) UNIQUE,
        data_nascimento DATE, telefone VARCHAR(20), foto_url VARCHAR(255), ativo BOOLEAN DEFAULT 1, ultimo_acesso TIMESTAMP NULL, criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
      VALUES (?, 2, ?, ?, ?, ?, ?, ?, ?)
      id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    `;

    const id_professor = require('uuid').v4();

    await db.promise().execute(sql, [
      id_professor,
      dados.id_escola,
      dados.nome,
      dados.data_nascimento,
      dados.cpf,
      dados.telefone,
      dados.email,
      dados.senha_hash
      dados.foto_url
    ]);

    return { success: true, message: "Professor cadastrado com sucesso!" };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Erro ao cadastrar professor." };
  }
}

module.exports = { registerProfessor };