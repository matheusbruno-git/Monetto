const { resolveEscolaId } = require("./resolve_escola_id.js");

async function getTarefas(currentUserId) {
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
      `SELECT 
        t.id_tarefa,
        t.titulo,
        t.descricao,
        t.data_criacao,
        t.data_vencimento,
        t.status,
        c.nome AS disciplina
       FROM tarefas t
       LEFT JOIN cursos c ON t.id_curso = c.id_curso
       WHERE t.id_escola = ?
       ORDER BY t.data_vencimento ASC`,
      [escolaId],
    );
    return { success: true, data: rows };
  } catch (err) {
    console.error("getTarefas Error:", err);
    return { success: false, message: "Erro ao buscar tarefas." };
  }
}

module.exports = { getTarefas };
