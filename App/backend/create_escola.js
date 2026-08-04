// backend/create_escola.js
const db = require("./connection.js");

async function registerEscola(dados) {
  try {
    const sql = `
      INSERT INTO escolas 
      (id_escola, nome, cnpj, telefone, endereco, cidade, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const id_escola = require("uuid").v4();

    await db
      .promise()
      .execute(sql, [
        id_escola,
        dados.id_escola,
        dados.nome,
        dados.cnpj,
        dados.telefone,
        dados.endereco,
        dados.cidade,
        dados.estado,
      ]);

    return { success: true, message: "Escola cadastrada com sucesso!" };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Erro ao cadastrar escola." };
  }
}

module.exports = { registerEscola };
