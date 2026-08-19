// backend/create_professor.js
const db = require("./connection.js");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

async function registerProfessor(dados) {
  try {
    if (!dados.nome || !dados.email || !dados.senha_provisoria || !dados.id_escola) {
      return { success: false, message: "Campos obrigatórios faltando." };
    }

    // Check if email already exists
    const [existing] = await db.promise().execute(
      "SELECT id_usuario FROM usuarios WHERE email = ?",
      [dados.email]
    );

    if (existing.length > 0) {
      return { success: false, message: "Este email já está cadastrado." };
    }

    const senha_hash = await bcrypt.hash(dados.senha_provisoria, 10);
    const id_usuario = uuidv4();

    const sql = `
      INSERT INTO usuarios 
        (id_usuario, id_perfil, id_escola, nome, email, senha_hash, cpf, data_nascimento, telefone, ativo, criado_em)
      VALUES (?, 2, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
    `;

    await db.promise().execute(sql, [
      id_usuario,
      dados.id_escola,
      dados.nome,
      dados.email,
      senha_hash,
      dados.cpf || null,
      dados.data_nascimento || null,
      dados.telefone || null
    ]);

    return { success: true, message: "Professor cadastrado com sucesso!" };
  } catch (err) {
    console.error("❌ ERRO AO CADASTRAR PROFESSOR:", err);
    return { success: false, message: "Erro ao cadastrar professor." };
  }
}

module.exports = { registerProfessor };