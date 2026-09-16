const db = require("./connection.js");
const bcrypt = require("bcryptjs");

async function resolveEscolaId(dbConnection, idUsuario) {
  try {
    const [rows] = await dbConnection
      .promise()
      .execute("SELECT id_escola FROM usuarios WHERE id = ? LIMIT 1", [
        idUsuario,
      ]);
    return rows[0] ? rows[0].id_escola : null;
  } catch (error) {
    console.error("resolveEscolaId Error:", error);
    return null;
  }
}

async function registerTarefa(dados) {
  try {
    if (!dados || !dados.titulo || !dados.id_curso || !dados.data_vencimento) {
      return {
        success: false,
        message: "Dados obrigatórios ausentes.",
      };
    }

    let idEscola = dados.id_escola || null;
    if (!idEscola && dados.id_usuario) {
      idEscola = await resolveEscolaId(db, dados.id_usuario);
    }
    if (!idEscola) {
      return {
        success: false,
        message: "Escola não identificada. Faça login novamente.",
      };
    }

    const baseParams = [
      idEscola,
      dados.id_curso,
      dados.titulo,
      dados.descricao || null,
      dados.data_vencimento,
    ];

    try {
      const [result] = await db.promise().execute(
        `INSERT INTO tarefas (id_escola, id_curso, titulo, descricao, data_criacao, data_vencimento, status, id_professor, id_usuario)
         VALUES (?, ?, ?, ?, CURDATE(), ?, 'pendente', ?, ?)`,
        [
          ...baseParams,
          dados.id_professor || dados.id_usuario || null,
          dados.id_usuario || null,
        ],
      );
      return {
        success: true,
        message: "Tarefa criada com sucesso!",
        id: result.insertId,
      };
    } catch (colErr) {
      console.warn(
        "registerTarefa extended insert failed, using minimal columns:",
        colErr.message,
      );
      const [result] = await db.promise().execute(
        `INSERT INTO tarefas (id_escola, id_curso, titulo, descricao, data_criacao, data_vencimento, status)
         VALUES (?, ?, ?, ?, CURDATE(), ?, 'pendente')`,
        baseParams,
      );
      return {
        success: true,
        message: "Tarefa criada com sucesso!",
        id: result.insertId,
      };
    }
  } catch (err) {
    console.error("registerTarefa Error:", err);
    return { success: false, message: "Erro ao criar tarefa." };
  }
}

module.exports = { registerTarefa };
