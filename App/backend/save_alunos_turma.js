const db = require("./connection.js");

async function saveAlunosTurma(dados) {
  const id_turma = Number(dados?.id_turma);
  const ids = Array.isArray(dados?.id_alunos)
    ? [...new Set(dados.id_alunos.map(Number).filter(Number.isInteger))]
    : [];

  if (!id_turma) {
    return { success: false, message: "Turma inválida." };
  }

  const conn = await db.promise().getConnection();

  try {
    await conn.beginTransaction();

    // Find the school of the turma.
    const [turmas] = await conn.execute(
      `SELECT id_turma, id_escola
       FROM turmas
       WHERE id_turma = ?
       LIMIT 1`,
      [id_turma]
    );

    if (!turmas.length) {
      await conn.rollback();
      return { success: false, message: "Turma não encontrada." };
    }

    const id_escola = turmas[0].id_escola;

    // Only students from the same school can be assigned.
    if (ids.length) {
      const placeholders = ids.map(() => "?").join(",");
      const [students] = await conn.execute(
        `SELECT id_usuario
         FROM usuarios
         WHERE id_usuario IN (${placeholders})
           AND id_escola = ?
           AND id_perfil = 1
           AND ativo = 1`,
        [...ids, id_escola]
      );

      if (students.length !== ids.length) {
        await conn.rollback();
        return {
          success: false,
          message: "Um ou mais alunos são inválidos ou pertencem a outra escola.",
        };
      }
    }

    // Remove students that were previously in THIS turma but are no longer selected.
    if (ids.length) {
      const placeholders = ids.map(() => "?").join(",");
      await conn.execute(
        `UPDATE usuarios
         SET id_turma = NULL
         WHERE id_turma = ?
           AND id_perfil = 1
           AND id_usuario NOT IN (${placeholders})`,
        [id_turma, ...ids]
      );
    } else {
      await conn.execute(
        `UPDATE usuarios
         SET id_turma = NULL
         WHERE id_turma = ?
           AND id_perfil = 1`,
        [id_turma]
      );
    }

    // Assign the selected students. A student can only belong to one turma,
    // so this automatically moves a student from another turma if necessary.
    if (ids.length) {
      const placeholders = ids.map(() => "?").join(",");
      await conn.execute(
        `UPDATE usuarios
         SET id_turma = ?
         WHERE id_usuario IN (${placeholders})
           AND id_escola = ?
           AND id_perfil = 1
           AND ativo = 1`,
        [id_turma, ...ids, id_escola]
      );
    }

    await conn.commit();

    return {
      success: true,
      message: "Alunos atribuídos à turma com sucesso.",
      id_turma,
      total: ids.length,
    };
  } catch (err) {
    await conn.rollback();
    console.error("saveAlunosTurma:", err);
    return {
      success: false,
      message: "Erro ao salvar alunos da turma: " + err.message,
    };
  } finally {
    conn.release();
  }
}

module.exports = { saveAlunosTurma };
