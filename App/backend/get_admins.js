const { resolveEscolaId } = require("./resolve_escola_id.js");

async function getAdmins(currentUserId) {
  try {
    const db = require("./connection.js");

    const escolaId = await resolveEscolaId(currentUserId);
    if (!escolaId) {
      return {
        success: false,
        message: "Usuário não está associado a uma escola.",
      };
    }

    const [rows] = await db.promise().execute(
      `SELECT id_usuario, nome, email, ativo, criado_em
       FROM usuarios
       WHERE id_perfil = 3 AND id_escola = ?
       ORDER BY nome ASC`,
      [escolaId],
    );
    return { success: true, data: rows };
  } catch (err) {
    console.error("getAdmins Error:", err);
    return { success: false, message: "Erro ao buscar administradores." };
  }
}

module.exports = { getAdmins };
