// backend/create_tarefa.js
const db = require("./connection.js");
const { v4: uuidv4 } = require("uuid");

async function registerTarefa(dados) {
  try {
    const sql = `
      INSERT INTO tarefas 
      (id_tarefa, id_escola, titulo, descricao, data_criacao, data_vencimento, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pendente')
    `;

    const id_tarefa = uuidv4();

    const [result] = await db
      .promise()
      .execute(sql, [
        require("uuid").v4(),
        id_tarefa,
        dados.id_escola,
        dados.titulo,
        dados.descricao,
        dados.data_criacao,
        dados.data_vencimento,
      ]);

    return {
      success: true,
      message: "Tarefa criada com sucesso!",
      id: result.insertId,
    };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Erro ao criar tarefa." };
  }
}

module.exports = { registerTarefa };
