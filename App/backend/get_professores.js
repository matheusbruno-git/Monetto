async function getProfessores(currentUserId) {
  try {
    const db = require("./connection.js");

    const escolaId = await resolveEscolaId(db, currentUserId);
    if (!escolaId) {
      return {
        success: false,
        message: "Usuário não está associado a uma escola.",
      };
    }

    const [rows] = await db.promise().execute(
      `SELECT u.id_usuario, u.nome, u.email, u.ativo,
              (SELECT COUNT(*) FROM turmas t WHERE t.id_professor = u.id_usuario AND t.status = 'ativa') AS turmas_count,
              (SELECT COUNT(*) FROM usuarios a
                 WHERE a.id_perfil = 1 AND a.ativo = 1
                   AND a.id_turma IN (SELECT id_turma FROM turmas t WHERE t.id_professor = u.id_usuario)) AS alunos_count
       FROM usuarios u
       WHERE u.id_perfil = 2 AND u.id_escola = ?
       ORDER BY u.nome ASC`,
      [escolaId],
    );
    return { success: true, data: rows };
  } catch (err) {
    console.error("getProfessores Error:", err);
    return { success: false, message: "Erro ao buscar professores." };
  }
}

module.exports = { getProfessores };
