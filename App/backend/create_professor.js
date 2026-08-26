// backend/create_professor.js
const db = require("./connection.js");
const bcrypt = require("bcryptjs");

async function registerProfessor(dados) {
  try {
    if (
      !dados.nome ||
      !dados.email ||
      !dados.senha_provisoria ||
      !dados.id_escola
    ) {
      return { success: false, message: "Campos obrigatórios faltando." };
    }

    // Check if email already exists
    const [existing] = await db
      .promise()
      .execute("SELECT id_usuario FROM usuarios WHERE email = ?", [
        dados.email,
      ]);

    if (existing.length > 0) {
      return { success: false, message: "Este email já está cadastrado." };
    }

    const senha_hash = await bcrypt.hash(dados.senha_provisoria, 10);

    // 1. Get the correct id_perfil for "professor" (now = 2, but we look it up by name)
    const [perfil] = await db
      .promise()
      .execute("SELECT id_perfil FROM perfis WHERE nome = 'professor' LIMIT 1");

    if (perfil.length === 0) {
      return { success: false, message: "Perfil 'professor' não encontrado." };
    }

    const id_perfil = perfil[0].id_perfil; // will be 2 with the new order

    // 2. Insert WITHOUT id_usuario (let AUTO_INCREMENT generate it)
    const sql = `
      INSERT INTO usuarios 
        (id_perfil, id_escola, nome, email, senha_hash, cpf, data_nascimento, telefone, ativo, criado_em)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
    `;

    await db
      .promise()
      .execute(sql, [
        id_perfil,
        dados.id_escola,
        dados.nome,
        dados.email,
        senha_hash,
        dados.cpf || null,
        dados.data_nascimento || null,
        dados.telefone || null,
      ]);

    return { success: true, message: "Professor cadastrado com sucesso!" };
  } catch (err) {
    console.error("❌ ERRO AO CADASTRAR PROFESSOR:", err);
    return { success: false, message: "Erro ao cadastrar professor." };
  }
}

module.exports = { registerProfessor };
