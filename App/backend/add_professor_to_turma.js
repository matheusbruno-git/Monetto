async function atribuirProfessorATurma(dados) {
  const connection = require(path.join(basePath, "connection.js"));

  try {
    const { id_turma, id_professor } = dados;

    console.log("Atribuindo professor:", {
      id_turma,
      id_professor,
    });

    if (!id_turma || !id_professor) {
      return {
        success: false,
        message: "Turma e professor são obrigatórios.",
      };
    }

    const sql = `
      UPDATE turmas
      SET id_professor = ?
      WHERE id_turma = ?
    `;

    const [result] = await connection
      .promise()
      .query(sql, [id_professor, id_turma]);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: "Turma não encontrada.",
      };
    }

    return {
      success: true,
      message: "Professor atribuído com sucesso.",
    };
  } catch (error) {
    console.error("Error in atribuirProfessorATurma:", error);

    return {
      success: false,
      message: "Erro ao atribuir professor: " + error.message,
    };
  }
}

module.exports = { atribuirProfessorATurma };
