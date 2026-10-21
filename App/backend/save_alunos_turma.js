
const db = require("./connection.js");

async function saveAlunosTurma(dados) {
  const id_turma = Number(dados?.id_turma);

  const ids = Array.isArray(dados?.id_alunos)
    ? [
      ...new Set(
        dados.id_alunos
          .map(Number)
          .filter((id) => Number.isSafeInteger(id) && id > 0)
      ),
    ]
    : [];

  if (!Number.isSafeInteger(id_turma) || id_turma <= 0) {
    return {
      success: false,
      message: "Turma inválida.",
    };
  }

  try {
    const connection = db.promise();

    // Confirm that the turma exists and identify its school.
    const [turmas] = await connection.execute(
      `SELECT id_turma, id_escola
       FROM turmas
       WHERE id_turma = ?
       LIMIT 1`,
      [id_turma]
    );

    if (!turmas.length) {
      return {
        success: false,
        message: "Turma não encontrada.",
      };
    }

    const id_escola = turmas[0].id_escola;

    // Validate that every selected student belongs to this school.
    if (ids.length > 0) {
      const placeholders = ids.map(() => "?").join(", ");

      const [alunos] = await connection.execute(
        `SELECT id_usuario
         FROM usuarios
         WHERE id_usuario IN (${placeholders})
           AND id_escola = ?
           AND id_perfil = 1
           AND ativo = 1`,
        [...ids, id_escola]
      );

      if (alunos.length !== ids.length) {
        return {
          success: false,
          message:
            "Um ou mais alunos são inválidos, inativos ou pertencem a outra escola.",
        };
      }
    }

    // Remove students no longer selected from this turma.
    if (ids.length > 0) {
      const placeholders = ids.map(() => "?").join(", ");

      await connection.execute(
        `UPDATE usuarios
         SET id_turma = NULL
         WHERE id_turma = ?
           AND id_perfil = 1
           AND id_usuario NOT IN (${placeholders})`,
        [id_turma, ...ids]
      );
    } else {
      await connection.execute(
        `UPDATE usuarios
         SET id_turma = NULL
         WHERE id_turma = ?
           AND id_perfil = 1`,
        [id_turma]
      );
    }

    // Assign selected students to the turma.
    // A student previously assigned elsewhere will be moved.
    if (ids.length > 0) {
      const placeholders = ids.map(() => "?").join(", ");

      await connection.execute(
        `UPDATE usuarios
         SET id_turma = ?
         WHERE id_usuario IN (${placeholders})
           AND id_escola = ?
           AND id_perfil = 1
           AND ativo = 1`,
        [id_turma, ...ids, id_escola]
      );
    }

    return {
      success: true,
      message: "Alunos atribuídos à turma com sucesso.",
      id_turma,
      total: ids.length,
    };
  } catch (err) {
    console.error("saveAlunosTurma Error:", err);

    return {
      success: false,
      message: "Erro ao salvar alunos da turma: " + err.message,
    };
  }
}

module.exports = { saveAlunosTurma };
