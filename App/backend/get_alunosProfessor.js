const { resolveEscolaId } = require("./resolve_escola_id.js");

async function getAlunosProfessor(currentUserId) {

    try {
        const db = require(path.join(basePath, "backend/connection.js"));

        if (!currentUserId) {
            return { success: false, message: "ID do usuário não informado." };
        }

        const escolaId = await resolveEscolaId(currentUserId);
        if (!escolaId) {
            return {
                success: false,
                message: "Usuário não está associado a uma escola.",
            };
        }

        let rows;
        try {
            const [r] = await db.promise().execute(
                `SELECT u.id_usuario, u.nome, u.email, u.ativo,
                t.id_turma, t.nome_turma AS turma,
                COALESCE(pa.xp_atual, 0) AS xp
         FROM usuarios u
         INNER JOIN turmas t ON u.id_turma = t.id_turma
         LEFT JOIN progresso_aluno pa ON pa.id_aluno = u.id_usuario
         WHERE u.id_perfil = 1 AND u.id_escola = ?
           AND t.id_professor = ? AND t.id_escola = ?
         ORDER BY t.nome_turma ASC, u.nome ASC`,
                [escolaId, currentUserId, escolaId],
            );
            rows = r;
        } catch (e) {
            console.warn("getAlunosProfessor join failed:", e.message);
            const [r] = await db.promise().execute(
                `SELECT u.id_usuario, u.nome, u.email, u.ativo,
                t.id_turma, t.nome_turma AS turma
         FROM usuarios u
         INNER JOIN turmas t ON u.id_turma = t.id_turma
         WHERE u.id_perfil = 1 AND u.id_escola = ?
           AND t.id_professor = ?
         ORDER BY u.nome ASC`,
                [escolaId, currentUserId],
            );
            rows = r;
        }

        const total = rows.length;
        const ativos = rows.filter((a) => a.ativo == 1 || a.ativo === true).length;
        const comTurma = rows.filter((a) => a.turma).length;
        const taxa = total > 0 ? Math.round((comTurma / total) * 100) : 0;

        const turmasMap = new Map();
        for (const a of rows) {
            if (a.id_turma && a.turma) turmasMap.set(a.id_turma, a.turma);
        }

        return {
            success: true,
            data: rows,
            stats: {
                total,
                ativos,
                atencao: Math.max(0, total - ativos),
                taxaConclusao: taxa,
                turmasCount: turmasMap.size,
            },
            turmas: Array.from(turmasMap.entries()).map(([id, nome]) => ({
                id,
                nome,
            })),
        };
    } catch (err) {
        console.error("getAlunosProfessor Error:", err);
        return { success: false, message: "Erro ao buscar alunos do professor." };
    }

}

module.exports = { getAlunosProfessor };
