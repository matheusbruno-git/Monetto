const { resolveEscolaId } = require("./resolve_escola_id.js");

async function getSchools() {
  const db = require("./connection.js");
  try {
    const [escolas] = await db.promise().execute(`
      SELECT id_escola, nome
      FROM escolas
      ORDER BY nome ASC
    `);
    console.log("Escolas encontradas:", escolas);
    return escolas;
  } catch (error) {
    console.error("Erro ao buscar escolas:", error);
    return [];
  }
}

module.exports = { getSchools };
