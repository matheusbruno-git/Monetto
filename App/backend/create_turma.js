const db = require("./connection.js");

async function registerTurma(dados) {
  const {
    id_escola,
    id_professor = null,
    id_nivel,
    nome_turma,
    ano_letivo = new Date().getFullYear(),
  } = dados || {};

  if (!id_escola || !id_nivel || !nome_turma) {
    return {
      success: false,
      message: "Escola, nível e nome da turma são obrigatórios.",
    };
  }

  const conn = await db.promise().getConnection();

  try {
    // Professor is optional at creation time. The admin can assign one later.
    const [result] = await conn.execute(
      `INSERT INTO turmas
       (id_escola, id_professor, id_nivel, nome_turma, ano_letivo, status)
       VALUES (?, ?, ?, ?, ?, 'ativa')`,
      [Number(id_escola), id_professor ? Number(id_professor) : null,
       Number(id_nivel), String(nome_turma).trim(), Number(ano_letivo)]
    );

    return {
      success: true,
      message: "Turma criada com sucesso.",
      id_turma: result.insertId,
    };
  } catch (err) {
    console.error("registerTurma:", err);
    return { success: false, message: "Erro ao criar turma: " + err.message };
  } finally {
    conn.release();
  }
}

module.exports = { registerTurma };
