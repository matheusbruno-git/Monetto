const db = require("./connection.js");

async function resolveEscolaId(currentUserId) {
  if (!currentUserId) return null;

  const [rows] = await db.promise().execute(
    `SELECT id_escola
     FROM usuarios
     WHERE id_usuario = ?
       AND ativo = 1
     LIMIT 1`,
    [currentUserId],
  );

  return rows[0]?.id_escola || null;
}

async function getAdminProfile(currentUserId) {
  try {
    if (!currentUserId)
      return { success: false, message: "ID do usuário não informado." };

    const escolaId = await resolveEscolaId(currentUserId);
    sss;
    if (!escolaId)
      return {
        success: false,
        message: "Usuário não está associado a uma escola.",
      };

    const [rows] = await db.promise().execute(
      `SELECT u.id_usuario, u.nome, u.email, u.criado_em, u.id_perfil, u.id_escola,
              u.ativo, u.ultimo_acesso,
              e.nome AS escola_nome, e.email AS escola_email, e.telefone,
              e.endereco, e.cnpj, e.cidade, e.estado
       FROM usuarios u
       LEFT JOIN escolas e ON e.id_escola = u.id_escola
       WHERE u.id_usuario = ? AND u.id_escola = ? AND u.id_perfil = 3
       LIMIT 1`,
      [currentUserId, escolaId],
    );

    if (!rows.length)
      return {
        success: false,
        message: "Perfil do administrador não encontrado.",
      };

    const profile = rows[0];
    const [[stats]] = await db.promise().execute(
      `SELECT
         (SELECT COUNT(*) FROM usuarios WHERE id_perfil = 2 AND ativo = 1 AND id_escola = ?) AS professores,
         (SELECT COUNT(*) FROM usuarios WHERE id_perfil = 1 AND ativo = 1 AND id_escola = ?) AS alunos,
         (SELECT COUNT(*) FROM turmas WHERE id_escola = ?) AS turmas`,
      [escolaId, escolaId, escolaId],
    );

    return {
      success: true,
      data: {
        id: profile.id_usuario,
        nome: profile.nome || "",
        email: profile.email || "",
        criado_em: profile.criado_em,
        ativo: profile.ativo,
        ultimo_acesso: profile.ultimo_acesso,
        id_escola: escolaId,
        escola: {
          nome: profile.escola_nome || "",
          email: profile.escola_email || "",
          telefone: profile.telefone || "",
          endereco: profile.endereco || "",
          cnpj: profile.cnpj || "",
          cidade: profile.cidade || "",
          estado: profile.estado || "",
        },
        stats: {
          professores: Number(stats.professores) || 0,
          alunos: Number(stats.alunos) || 0,
          turmas: Number(stats.turmas) || 0,
        },
      },
    };
  } catch (err) {
    console.error("getAdminProfile Error:", err);
    return {
      success: false,
      message: "Erro ao carregar perfil: " + err.message,
    };
  }
}

module.exports = { getAdminProfile };
