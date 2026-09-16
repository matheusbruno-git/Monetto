// backend/create_turma.js
const db = require("./connection.js");
const { v4: uuidv4 } = require("uuid");

async function registerTurma(dados) {
  try {
    const db = require(path.join(basePath, "backend/connection.js"));
    const [result] = await db.promise().execute(
      `INSERT INTO turmas (id_escola, id_professor, id_nivel, nome_turma, ano_letivo, status)
         VALUES (?, ?, ?, ?, YEAR(CURDATE()), 'ativa')`,
      [dados.id_escola, dados.id_professor, dados.id_nivel, dados.nome_turma],
    );
    return {
      success: true,
      message: "Turma criada com sucesso!",
      id: result.insertId,
    };
  } catch (err) {
    console.error("registerTurma Error:", err);
    return {
      success: false,
      message: "Erro ao criar turma: " + err.sqlMessage,
    };
  }
}

module.exports = { registerTurma };
