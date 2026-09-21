const bcrypt = require("bcryptjs");
const db = require("./connection.js");
const { resolveEscolaId } = require("./resolve_escola_id.js");

async function changeAdminPassword(dados) {
    try {
        if (!dados?.id_usuario || !dados?.senhaAtual || !dados?.novaSenha) {
            return { success: false, message: "Preencha todos os campos de senha." };
        }
        if (String(dados.novaSenha).length < 6) {
            return {
                success: false,
                message: "A nova senha deve ter pelo menos 6 caracteres.",
            };
        }

        const escolaId = await resolveEscolaId(dados.id_usuario);
        if (!escolaId)
            return {
                success: false,
                message: "Administrador não está associado a uma escola.",
            };

        const [rows] = await db.promise().execute(
            `SELECT senha_hash FROM usuarios
           WHERE id_usuario = ? AND id_escola = ? AND id_perfil = 3 AND ativo = 1 LIMIT 1`,
            [dados.id_usuario, escolaId],
        );
        if (!rows.length)
            return { success: false, message: "Administrador não encontrado." };

        const ok = await bcrypt.compare(
            String(dados.senhaAtual),
            rows[0].senha_hash,
        );
        if (!ok)
            return { success: false, message: "A senha atual está incorreta." };

        const hash = await bcrypt.hash(String(dados.novaSenha), 10);
        await db
            .promise()
            .execute(
                `UPDATE usuarios SET senha_hash = ? WHERE id_usuario = ? AND id_escola = ? AND id_perfil = 3`,
                [hash, dados.id_usuario, escolaId],
            );

        return { success: true, message: "Senha alterada com sucesso!" };
    } catch (err) {
        console.error("changeAdminPassword Error:", err);
        return { success: false, message: "Erro ao alterar senha: " + err.message };
    }
}

module.exports = { changeAdminPassword };
