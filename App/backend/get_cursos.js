async function getCursos() {
  try {
    const db = require("./connection.js");
    const [rows] = await db
      .promise()
      .execute("SELECT id_curso, nome FROM cursos ORDER BY nome ASC");
    return { success: true, data: rows };
  } catch (err) {
    console.error("getCursos Error:", err);
    return { success: false, message: "Erro ao buscar disciplinas." };
  }
}

module.exports = { getCursos };
