async function getNiveis() {
  try {
    const db = require("./connection.js");
    const [rows] = await db
      .promise()
      .execute(
        "SELECT id_nivel, nome FROM niveis_educacionais WHERE ativo = 1 ORDER BY ordem_nivel ASC",
      );
    return { success: true, data: rows };
  } catch (err) {
    console.error("getNiveis Error:", err);
    return { success: false, message: "Erro ao buscar níveis." };
  }
}

module.exports = { getNiveis };
