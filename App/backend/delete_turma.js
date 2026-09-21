const db = require("./connection.js");
const { v4: uuidv4 } = require("uuid");

async function deleteTurma(turmaId) {
  try {
    const db = require("./connection.js");
    const [result] = await db
      .promise()
      .execute(`DELETE FROM turmas WHERE id = ?`, [turmaId]);
    return {
      success: true,
      message: "Turma excluída com sucesso!",
    };
  } catch (err) {
    console.error("deleteTurma Error:", err);
    return {
      success: false,
      message: "Erro ao excluir turma: " + err.sqlMessage,
    };
  }
}

module.exports = { deleteTurma };
