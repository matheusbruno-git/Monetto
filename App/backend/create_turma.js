// backend/create_turma.js
const db = require("./connection.js");
const { v4: uuidv4 } = require("uuid");

async function registerTurma(dados) {
  try {
    const sql = `
      INSERT INTO turmas 
      (id_turma, id_escola, id_professor, id_nivel, nome_turma, ano_letivo, data_inicio, data_fim, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, "inativa")
    `;

    const id_turma = uuidv4();

    const [result] = await db.promise().execute(sql, [
      require('uuid').v4(),
      id_turma,
      dados.id_escola,
      dados.id_professor,
      dados.id_nivel,
      dados.nome_turma,
      dados.ano_letivo,
      dados.data_inicio,
      dados.data_fim,
    ]);

    return { 
      success: true, 
      message: "Turma criada com sucesso!",
      id: result.insertId 
    };

  } catch (err) {
    console.error(err);
    return { success: false, message: "Erro ao criar turma." };
  }
}

module.exports = { registerTurma };