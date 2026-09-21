const { resolveEscolaId } = require("./resolve_escola_id.js");

async function getAdminReports(db, currentUserId) {

    try {
        if (!currentUserId)
            return { success: false, message: "ID do usuário não informado." };

        const escolaId = await resolveEscolaId(currentUserId);
        if (!escolaId)
            return {
                success: false,
                message: "Usuário não está associado a uma escola.",
            };

        async function safeQuery(sql, params = []) {
            try {
                const [rows] = await db.promise().execute(sql, params);
                return rows;
            } catch (e) {
                console.warn(
                    "getAdminReports query failed:",
                    e.sqlMessage || e.message,
                );
                return [];
            }
        }

        async function safeOne(sql, params = []) {
            const rows = await safeQuery(sql, params);
            return rows[0] || {};
        }

        const school = await safeOne(
            `SELECT id_escola, nome, email, telefone, endereco, cnpj, cidade, estado
       FROM escolas WHERE id_escola = ? LIMIT 1`,
            [escolaId],
        );

        const students = await safeQuery(
            `SELECT u.id_usuario, u.nome, u.email, u.ativo, u.ultimo_acesso, u.id_turma,
              t.nome_turma AS turma,
              COALESCE(pa.xp_atual, 0) AS xp_atual,
              COALESCE(pa.pontos_totais, 0) AS pontos_totais,
              COALESCE(pa.nivel_atual, 0) AS nivel_atual,
              COALESCE(pa.percentual_conclusao, 0) AS percentual_conclusao
       FROM usuarios u
       LEFT JOIN turmas t ON t.id_turma = u.id_turma
       LEFT JOIN progresso_aluno pa ON pa.id_aluno = u.id_usuario
       WHERE u.id_perfil = 1 AND u.id_escola = ?
       ORDER BY u.nome ASC`,
            [escolaId],
        );

        const classes = await safeQuery(
            `SELECT t.id_turma, t.nome_turma, t.status, t.ano_letivo,
              COUNT(DISTINCT CASE WHEN u.id_perfil = 1 THEN u.id_usuario END) AS students
       FROM turmas t
       LEFT JOIN usuarios u ON u.id_turma = t.id_turma AND u.id_escola = ?
       WHERE t.id_escola = ?
       GROUP BY t.id_turma, t.nome_turma, t.status, t.ano_letivo
       ORDER BY t.nome_turma ASC`,
            [escolaId, escolaId],
        );

        let tasks = await safeQuery(
            `SELECT tar.id_tarefa, tar.titulo, tar.id_turma, tar.id_curso,
              tar.data_criacao, tar.data_entrega, tar.status,
              t.nome_turma AS turma, c.nome AS disciplina
       FROM tarefas tar
       LEFT JOIN turmas t ON t.id_turma = tar.id_turma
       LEFT JOIN cursos c ON c.id_curso = tar.id_curso
       WHERE tar.id_escola = ?
       ORDER BY tar.data_entrega ASC, tar.data_criacao DESC`,
            [escolaId],
        );

        if (!tasks.length) {
            tasks = await safeQuery(
                `SELECT tar.id_tarefa, tar.titulo, NULL AS id_turma, tar.id_curso,
                tar.data_criacao, tar.data_vencimento AS data_entrega, tar.status,
                NULL AS turma, c.nome AS disciplina
         FROM tarefas tar
         LEFT JOIN cursos c ON c.id_curso = tar.id_curso
         WHERE tar.id_escola = ?
         ORDER BY tar.data_vencimento ASC, tar.data_criacao DESC`,
                [escolaId],
            );
        }

        let deliveries = await safeQuery(
            `SELECT e.id_tarefa, e.id_usuario, e.criado_em,
              COALESCE(e.xp_ganho, 0) AS xp_ganho
       FROM entregas e
       INNER JOIN usuarios u ON u.id_usuario = e.id_usuario
       WHERE u.id_escola = ? AND u.id_perfil = 1`,
            [escolaId],
        );

        if (!deliveries.length) {
            deliveries = await safeQuery(
                `SELECT e.id_tarefa, e.id_usuario, e.criado_em, 0 AS xp_ganho
         FROM entregas e
         INNER JOIN usuarios u ON u.id_usuario = e.id_usuario
         WHERE u.id_escola = ? AND u.id_perfil = 1`,
                [escolaId],
            );
        }

        const deliveryKey = new Set(
            deliveries.map((e) => `${String(e.id_tarefa)}:${String(e.id_usuario)}`),
        );

        const activeStudents = students.filter(
            (s) => s.ativo == 1 || s.ativo === true,
        );

        const studentReports = students.map((s, index) => {
            const assigned = tasks.filter(
                (t) =>
                    t.id_turma != null &&
                    s.id_turma != null &&
                    String(t.id_turma) === String(s.id_turma),
            );
            const completed = assigned.filter((t) =>
                deliveryKey.has(`${String(t.id_tarefa)}:${String(s.id_usuario)}`),
            );
            const progress = assigned.length
                ? Math.round((completed.length / assigned.length) * 100)
                : Number(s.percentual_conclusao) || 0;

            return {
                id: s.id_usuario,
                id_turma: s.id_turma,
                name: s.nome,
                email: s.email || "",
                turma: s.turma || "Sem turma",
                xp: Number(s.xp_atual) || Number(s.pontos_totais) || 0,
                nivel: Number(s.nivel_atual) || 0,
                tarefasFeitas: assigned.length
                    ? completed.length
                    : deliveries.filter(
                        (e) => String(e.id_usuario) === String(s.id_usuario),
                    ).length,
                tarefasTotal: assigned.length,
                progresso: Math.max(0, Math.min(100, progress)),
                ativo: s.ativo == 1 || s.ativo === true,
                ultimoAcesso: s.ultimo_acesso,
                avatarClass: `av${(index % 8) + 1}`,
            };
        });

        const classReports = classes.map((c) => {
            const classStudents = studentReports.filter(
                (s) =>
                    students.find((raw) => String(raw.id_usuario) === String(s.id))
                        ?.id_turma != null &&
                    String(
                        students.find((raw) => String(raw.id_usuario) === String(s.id))
                            .id_turma,
                    ) === String(c.id_turma),
            );
            const avg = classStudents.length
                ? Math.round(
                    classStudents.reduce((sum, s) => sum + s.progresso, 0) /
                    classStudents.length,
                )
                : 0;

            return {
                id: c.id_turma,
                name: c.nome_turma,
                students: Number(c.students) || 0,
                completion: avg,
                status: c.status || "",
                anoLetivo: c.ano_letivo,
            };
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeTasks = tasks.filter((t) => {
            const status = String(t.status || "").toLowerCase();
            if (
                [
                    "concluida",
                    "concluído",
                    "concluido",
                    "cancelada",
                    "cancelado",
                ].includes(status)
            )
                return false;
            if (!t.data_entrega) return true;
            const d = new Date(t.data_entrega);
            return !Number.isNaN(d.getTime()) && d >= today;
        });

        const assignedPairs = [];
        for (const s of activeStudents) {
            for (const task of tasks) {
                if (
                    task.id_turma != null &&
                    s.id_turma != null &&
                    String(task.id_turma) === String(s.id_turma)
                ) {
                    assignedPairs.push([task.id_tarefa, s.id_usuario]);
                }
            }
        }
        const completedPairs = assignedPairs.filter(([taskId, studentId]) =>
            deliveryKey.has(`${String(taskId)}:${String(studentId)}`),
        );

        const completionRate = assignedPairs.length
            ? Math.round((completedPairs.length / assignedPairs.length) * 100)
            : activeStudents.length
                ? Math.round(
                    activeStudents.reduce(
                        (sum, s) => sum + (Number(s.percentual_conclusao) || 0),
                        0,
                    ) / activeStudents.length,
                )
                : 0;

        const totalXp =
            deliveries.reduce((sum, d) => sum + (Number(d.xp_ganho) || 0), 0) ||
            students.reduce((sum, s) => sum + (Number(s.xp_atual) || 0), 0);

        const riskStudents = studentReports
            .filter((s) => s.ativo && s.progresso < 50)
            .sort((a, b) => a.progresso - b.progresso);

        const taskReports = tasks.slice(0, 12).map((t) => {
            const target = activeStudents.filter(
                (s) =>
                    t.id_turma != null &&
                    s.id_turma != null &&
                    String(s.id_turma) === String(t.id_turma),
            );
            const delivered = target.filter((s) =>
                deliveryKey.has(`${String(t.id_tarefa)}:${String(s.id_usuario)}`),
            ).length;
            return {
                id: t.id_tarefa,
                id_turma: t.id_turma, // ← ADD THIS
                title: t.titulo || "Tarefa",
                turma: t.turma || "Toda a escola",
                disciplina: t.disciplina || "—",
                deadline: t.data_entrega,
                status: t.status,
                rate: target.length
                    ? Math.round((delivered / target.length) * 100)
                    : 0,
                delivered,
                total: target.length,
            };
        });

        const completionsChart = [];
        for (let i = 6; i >= 0; i--) {
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            start.setDate(start.getDate() - i);
            const end = new Date(start);
            end.setDate(end.getDate() + 1);
            const value = deliveries.filter((e) => {
                const d = new Date(e.criado_em);
                return !Number.isNaN(d.getTime()) && d >= start && d < end;
            }).length;
            completionsChart.push({
                label: start
                    .toLocaleDateString("pt-BR", { weekday: "short" })
                    .replace(".", ""),
                value,
            });
        }

        const highlights = [...studentReports]
            .filter((s) => s.ativo)
            .sort((a, b) => b.xp - a.xp)
            .slice(0, 3)
            .map((s) => ({
                ...s,
                tarefasFeitas: s.tarefasFeitas,
            }));

        return {
            success: true,
            data: {
                school,
                stats: {
                    activeStudents: activeStudents.length,
                    studentsTotal: students.length,
                    teachers:
                        Number(
                            (
                                await safeOne(
                                    `SELECT COUNT(*) AS total FROM usuarios WHERE id_perfil = 2 AND ativo = 1 AND id_escola = ?`,
                                    [escolaId],
                                )
                            ).total,
                        ) || 0,
                },
                metrics: {
                    students: activeStudents.length,
                    completionRate,
                    xpTotal: totalXp,
                    activeTasks: activeTasks.length,
                    riskCount: riskStudents.length,
                },
                classes: classReports,
                students: studentReports,
                tasks: taskReports,
                risks: riskStudents.slice(0, 8),
                highlights,
                completionsChart,
                deliveries,
                deliveryKeys: Array.from(deliveryKey),
                generatedAt: new Date().toISOString(),
            },
        };
    } catch (err) {
        console.error("getAdminReports Error:", err);
        return {
            success: false,
            message: "Erro ao carregar relatórios: " + err.message,
        };
    }
}

module.exports = { getAdminReports };