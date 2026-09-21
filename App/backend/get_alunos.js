const { resolveEscolaId } = require("./resolve_escola_id.js");

async function getAlunos(currentUserId) {
  try {
    const db = require("./connection.js");

    const escolaId = await resolveEscolaId(currentUserId);
    if (!escolaId) {
      return {
        success: false,
        message: "Usuário não está associado a uma escola.",
      };
    }

    try {
      const [rows] = await db.promise().execute(
        `SELECT u.id_usuario, u.nome, u.email, u.ativo,
                t.nome_turma AS turma,
                COALESCE(pa.xp_atual, 0) AS xp
         FROM usuarios u
         LEFT JOIN turmas t ON t.id_turma = u.id_turma
         LEFT JOIN progresso_aluno pa ON pa.id_aluno = u.id_usuario
         WHERE u.id_perfil = 1 AND u.id_escola = ?
         ORDER BY u.nome ASC`,
        [escolaId],
      );
      return { success: true, data: rows };
    } catch (richErr) {
      console.warn(
        "getAlunos rich query failed, falling back:",
        richErr.message,
      );
      const [rows] = await db.promise().execute(
        `SELECT id_usuario, nome, email, ativo
         FROM usuarios
         WHERE id_perfil = 1 AND id_escola = ?
         ORDER BY nome ASC`,
        [escolaId],
      );
      return { success: true, data: rows };
    }
  } catch (err) {
    console.error("getAlunos Error:", err);
    return { success: false, message: "Erro ao buscar alunos." };
  }
}

module.exports = { getAlunos };
