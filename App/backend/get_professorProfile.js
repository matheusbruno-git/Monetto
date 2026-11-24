const { resolveEscolaId } = require("./resolve_escola_id.js");
const db = require("./connection.js");

async function getProfessorProfile(currentUserId) {
  try {
    if (!currentUserId) return { success: false, message: "ID do usuário não informado." };
    const escolaId = await resolveEscolaId(currentUserId);
    if (!escolaId) return { success: false, message: "Professor não está associado a uma escola." };
    const [rows] = await db.promise().execute(
      `SELECT u.id_usuario, u.nome, u.email, u.criado_em, u.id_escola,
              e.nome AS escola_nome, e.cidade, e.estado, e.telefone
       FROM usuarios u
       LEFT JOIN escolas e ON e.id_escola = u.id_escola
       WHERE u.id_usuario = ? AND u.id_escola = ? AND u.id_perfil = 2
       LIMIT 1`,
      [currentUserId, escolaId],
    );
    if (!rows.length) return { success: false, message: "Perfil do professor não encontrado." };
    const profile = rows[0];
    const [[stats]] = await db.promise().execute(
      `SELECT COUNT(DISTINCT a.id_usuario) AS alunos
       FROM turmas t LEFT JOIN usuarios a ON a.id_turma = t.id_turma AND a.id_perfil = 1 AND a.ativo = 1
       WHERE t.id_escola = ? AND t.id_professor = ?`,
      [escolaId, currentUserId],
    );
    return {
      success: true,
      data: {
        id: profile.id_usuario,
        nome: profile.nome || "",
        email: profile.email || "",
        criado_em: profile.criado_em,
        escola: { nome: profile.escola_nome || "", cidade: profile.cidade || "", estado: profile.estado || "", telefone: profile.telefone || "" },
        stats: { alunos: Number(stats?.alunos) || 0 },
      },
    };
  } catch (error) {
    console.error("getProfessorProfile Error:", error);
    return { success: false, message: "Erro ao carregar perfil do professor." };
  }
}

module.exports = { getProfessorProfile };
