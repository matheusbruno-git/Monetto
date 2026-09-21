const db = require("./connection.js");

async function updateAluno(dados) {

    try {
        if (!dados?.id_usuario || !dados?.nome || !dados?.email) {
            return {
                success: false,
                message: "Nome e e-mail são obrigatórios.",
            };
        }

        const [duplicado] = await db.promise().execute(
            `
      SELECT id_usuario
      FROM usuarios
      WHERE email = ?
        AND id_usuario <> ?
      LIMIT 1
      `,
            [String(dados.email).trim(), dados.id_usuario],
        );

        if (duplicado.length > 0) {
            return {
                success: false,
                message: "Este e-mail já está em uso.",
            };
        }

        const [result] = await db.promise().execute(
            `
      UPDATE usuarios
      SET nome = ?,
          email = ?
      WHERE id_usuario = ?
        AND id_perfil = 1
        AND ativo = 1
      `,
            [String(dados.nome).trim(), String(dados.email).trim(), dados.id_usuario],
        );

        if (!result.affectedRows) {
            return {
                success: false,
                message: "Aluno não encontrado.",
            };
        }

        return {
            success: true,
            message: "Perfil atualizado com sucesso!",
        };
    } catch (err) {
        console.error("updateAluno Error:", err);

        return {
            success: false,
            message: "Erro ao atualizar perfil: " + err.message,
        };
    }

}

module.exports = { updateAluno };