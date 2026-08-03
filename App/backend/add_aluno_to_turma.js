// backend/add_aluno_to_turma.js
const db = require("./connection");

async function addAlunoToTurma(dados) {
    try {

        // Verifica se o aluno pertence à escola
        const [usuario] = await db.promise().execute(
            `
            SELECT id_usuario
            FROM usuarios
            WHERE id_usuario = ?
            AND id_escola = ?
            `,
            [
                dados.id_aluno,
                dados.id_escola
            ]
        );

        if (usuario.length === 0) {
            return {
                success: false,
                message: "Aluno não encontrado."
            };
        }

        // Atualiza a turma
        await db.promise().execute(
            `
            UPDATE usuarios
            SET id_turma = ?
            WHERE id_usuario = ?
            `,
            [
                dados.id_turma,
                dados.id_aluno
            ]
        );

        return {
            success: true,
            message: "Aluno adicionado à turma com sucesso!"
        };

    } catch (err) {
        console.error(err);

        return {
            success: false,
            message: "Erro ao adicionar aluno à turma."
        };
    }
}

module.exports = { addAlunoToTurma };