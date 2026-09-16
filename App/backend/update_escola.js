async function updateEscola(dados) {
  try {
    const db = require(path.join(basePath, "backend/connection.js"));

    const UpdateQuery = `UPDATE escolas
       SET nome = ?, email = ?, telefone = ?, endereco = ?, cnpj = ?
       WHERE id_escola = ?`;
    const [result] = await db
      .promise()
      .execute(UpdateQuery, [
        dados.nome,
        dados.email,
        dados.telefone,
        dados.endereco,
        dados.cnpj,
        dados.id_escola,
      ]);
    return { success: true, message: "Escola atualizada com sucesso!" };
  } catch (err) {
    console.error("updateEscola Error:", err);
    return { success: false, message: "Erro ao atualizar escola." };
  }
}

module.exports = { updateEscola };
