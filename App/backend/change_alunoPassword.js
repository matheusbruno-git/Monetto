async function changeAlunoPassword(dados) {

    try {
        if (!dados?.id_usuario || !dados?.senhaAtual || !dados?.novaSenha) {
            return {
                success: false,
                message: "Preencha todos os campos de senha.",
            };
        }

        if (String(dados.novaSenha).length < 6) {
            return {
                success: false,
                message: "A nova senha deve ter pelo menos 6 caracteres.",
            };
        }

        const [rows] = await db.promise().execute(
            `
      SELECT senha_hash
      FROM usuarios
      WHERE id_usuario = ?
        AND id_perfil = 1
        AND ativo = 1
      LIMIT 1
      `,
            [dados.id_usuario],
        );

        if (!rows.length) {
            return {
                success: false,
                message: "Aluno não encontrado.",
            };
        }

        const senhaCorreta = await bcrypt.compare(
            String(dados.senhaAtual),
            rows[0].senha_hash,
        );

        if (!senhaCorreta) {
            return {
                success: false,
                message: "A senha atual está incorreta.",
            };
        }

        const hash = await bcrypt.hash(String(dados.novaSenha), 10);

        await db.promise().execute(
            `
      UPDATE usuarios
      SET senha_hash = ?
      WHERE id_usuario = ?
        AND id_perfil = 1
      `,
            [hash, dados.id_usuario],
        );

        return {
            success: true,
            message: "Senha alterada com sucesso!",
        };
    } catch (err) {
        console.error("changeAlunoPassword Error:", err);

        return {
            success: false,
            message: "Erro ao alterar senha: " + err.message,
        };
    }

}

module.exports = { changeAlunoPassword };