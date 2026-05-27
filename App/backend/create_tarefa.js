// backend/create_tarefa.js
const db = require("./connection.js");

async function registerTarefa(dados) {
  try {
    const sql = `
      INSERT INTO tarefas 
      (id_tarefa, id_escola, titulo, descricao, data_criacao, data_vencimento, status)
      VALUES (?, ?, ?, ?, NOW(), ?, 'pendente')
    `;

    const [result] = await db.promise().execute(sql, [
      require('uuid').v4(),
      dados.id_escola || 1,
      dados.titulo,
      dados.descricao,
      dados.data_vencimento
    ]);

    return { 
      success: true, 
      message: "Tarefa criada com sucesso!",
      id: result.insertId 
    };

  } catch (err) {
    console.error(err);
    return { success: false, message: "Erro ao criar tarefa." };
  }
}

module.exports = { registerTarefa };