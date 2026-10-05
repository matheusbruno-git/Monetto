const db = require("./connection.js");

async function getAluno(currentUserId) {
  if (!currentUserId) {
    return { success: false, message: "Usuário inválido." };
  }

  try {
    const [rows] = await db.promise().execute(
      `SELECT
         a.id_usuario,
         a.nome,
         a.email,
         a.id_turma,
         a.serie,
         t.nome_turma
       FROM usuarios a
       LEFT JOIN turmas t ON t.id_turma = a.id_turma
       WHERE a.id_escola = (
         SELECT id_escola
         FROM usuarios
         WHERE id_usuario = ? AND ativo = 1
         LIMIT 1
       )
       AND a.id_perfil = 1
       AND a.ativo = 1
       ORDER BY a.nome ASC`,
      [currentUserId]
    );

    return { success: true, data: rows };
  } catch (err) {
    console.error("getAluno:", err);
    return { success: false, message: "Erro ao buscar alunos: " + err.message };
  }
}

module.exports = { getAluno };
