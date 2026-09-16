async function getTurmas(currentUserId) {
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
      `SELECT 
        t.id_turma,
        t.nome_turma,
        t.ano_letivo,
        t.status,
        t.id_professor,
        u.nome AS professor_nome,
        u.email AS professor_email,
        n.nome AS nivel
      FROM turmas t
      LEFT JOIN usuarios u 
        ON t.id_professor = u.id_usuario
        AND u.id_perfil = 2
      LEFT JOIN niveis_educacionais n 
        ON t.id_nivel = n.id_nivel
      WHERE t.id_escola = ?
      ORDER BY t.nome_turma ASC`,
      [escolaId],
    );

    return {
      success: true,
      data: rows,
    };
  } catch (err) {
    console.error("getTurmas Error:", err);

    return {
      success: false,
      message: "Erro ao buscar turmas.",
    };
  }
}

module.exports = { getTurmas };
