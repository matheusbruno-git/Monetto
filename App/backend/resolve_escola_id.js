async function resolveEscolaId(db, currentUserId) {
  if (!currentUserId) return null;

  const [rows] = await db
    .promise()
    .execute(
      "SELECT id_escola FROM usuarios WHERE id_usuario = ? AND ativo = 1 LIMIT 1",
      [currentUserId],
    );

  return rows[0]?.id_escola ?? null;
}

module.exports = { resolveEscolaId };
