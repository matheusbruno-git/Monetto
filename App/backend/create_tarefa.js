const db = require("./connection.js");
const { resolveEscolaId } = require("./resolve_escola_id.js");

async function ensureTaskMetadataColumns() {
  const columns = [
    ["tipo_tarefa", "VARCHAR(50) NOT NULL DEFAULT 'exercicio'"],
    ["dificuldade", "VARCHAR(20) NOT NULL DEFAULT 'medio'"],
    ["xp_recompensa", "INT NOT NULL DEFAULT 50"],
  ];
  for (const [name, definition] of columns) {
    const [found] = await db.promise().execute(
      "SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tarefas' AND COLUMN_NAME = ? LIMIT 1",
      [name],
    );
    if (!found.length) {
      await db.promise().query(`ALTER TABLE tarefas ADD COLUMN ${name} ${definition}`);
    }
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
      idEscola = await resolveEscolaId(dados.id_usuario);
    }
    if (!idEscola) {
      return {
        success: false,
        message: "Escola não identificada. Faça login novamente.",
      };
    }

    await ensureTaskMetadataColumns();

    const tipoTarefa = ["texto", "exercicio", "arquivo", "leitura", "video", "outro"].includes(dados.tipo_tarefa)
      ? dados.tipo_tarefa
      : "exercicio";
    const dificuldade = ["facil", "medio", "dificil"].includes(dados.dificuldade)
      ? dados.dificuldade
      : "medio";
    const xp = Math.max(0, Math.min(500, Math.round(Number(dados.xp_recompensa) || 0)));
    const [columnRows] = await db.promise().query("SHOW COLUMNS FROM tarefas");
    const columns = new Set(columnRows.map((column) => column.Field));
    const fields = [
      ["id_escola", idEscola],
      ["id_curso", dados.id_curso],
      ["titulo", dados.titulo],
      ["descricao", dados.descricao || null],
      ["data_criacao", null, "CURDATE()"],
      ["data_vencimento", dados.data_vencimento],
      ["status", "pendente"],
      ["id_professor", dados.id_professor || dados.id_usuario || null],
      ["id_usuario", dados.id_usuario || null],
      ["tipo_tarefa", tipoTarefa],
      ["dificuldade", dificuldade],
      ["xp_recompensa", xp],
    ].filter(([name]) => columns.has(name));
    const values = fields.filter(([, , expression]) => !expression).map(([, value]) => value);
    const [result] = await db.promise().execute(
      `INSERT INTO tarefas (${fields.map(([name]) => `\`${name}\``).join(", ")}) VALUES (${fields.map(([, , expression]) => expression || "?").join(", ")})`,
      values,
    );
    return {
      success: true,
      message: "Tarefa criada com sucesso!",
      id: result.insertId,
    };
  } catch (err) {
    console.error("registerTarefa Error:", err);
    return { success: false, message: "Erro ao criar tarefa." };
  }
}

module.exports = { registerTarefa, ensureTaskMetadataColumns };
