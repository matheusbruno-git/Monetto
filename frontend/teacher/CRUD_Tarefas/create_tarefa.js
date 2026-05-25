const db = require("../../../backend/connection.js");
const { v4: uuidv4 } = require('uuid');

function createTarefa(dados) {
  return {
    id_tarefa: uuidv4(),
    id_escola: dados.id_escola,
    titulo: dados.titulo,
    descricao: dados.descricao,
    data_criacao: new Date(),
    data_vencimento: dados.data_vencimento,
    status: "pendente"
  };
}

module.exports = { createTarefa, registerTarefa };

function registerTarefa(dados) {
  try {
    const tarefa = createTarefa(dados);
    db.prepare(`
      INSERT INTO tarefa (id_tarefa, id_escola, titulo, descricao, data_criacao, data_vencimento, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(tarefa.id_tarefa, tarefa.id_escola, tarefa.titulo, tarefa.descricao, tarefa.data_criacao, tarefa.data_vencimento, tarefa.status);

    return { success: true, message: "Tarefa criada!" };

  } catch (err) {
    return { success: false, message: "Erro ao criar tarefa." };
  }
}

module.exports = { createTarefa, registerTarefa };

function registerTarefa(dados) {
  try {
    const tarefa = createTarefa(dados);
    db.prepare(`
      INSERT INTO tarefa (id_tarefa, id_escola, titulo, descricao, data_criacao, data_vencimento, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(tarefa.id_tarefa, tarefa.id_escola, tarefa.titulo, tarefa.descricao, tarefa.data_criacao, tarefa.data_vencimento, tarefa.status);

    return { success: true, message: "Tarefa criada!" };

  } catch (err) {
    return { success: false, message: "Erro ao criar tarefa." };
  }
}

document.getElementById("btn").addEventListener("click", async () => {

  const dados = {
    id_escola: "SUA_ESCOLA_ID_AQUI", // coloque o ID real
    titulo: document.getElementById("titulo").value,
    descricao: document.getElementById("descricao").value,
    data_vencimento: document.getElementById("data_vencimento").value
  };

  const result = await window.api.registerTarefa(dados);

  const msg = document.getElementById("msg");
  msg.textContent = result.message;
  msg.style.color = result.success ? "green" : "red";
});