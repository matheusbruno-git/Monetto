// backend/create_user.js
const db = require("./connection.js");
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require("uuid");

async function registerUser(dados) {
  try {
    console.log("📝 Tentando cadastrar usuário:", dados.email);

    if (!dados.nome || !dados.email || !dados.senha || !dados.id_perfil) {
      return { success: false, message: "Todos os campos são obrigatórios." };
    }

    // Check if email already exists
    const [existing] = await db.promise().execute(
      "SELECT id_usuario FROM usuarios WHERE email = ?", 
      [dados.email]
    );

    if (existing.length > 0) {
      return { success: false, message: "Este email já está cadastrado." };
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const senha_hash = await bcrypt.hash(dados.senha, salt);

    const id_usuario = uuidv4();

    const sql = `
      INSERT INTO usuarios 
      (id_usuario, id_perfil, nome, email, senha_hash, ativo, criado_em)
      VALUES (?, ?, ?, ?, ?, 1, NOW())
    `;

    await db.promise().execute(sql, [
      id_usuario,
      dados.id_perfil,
      dados.nome,
      dados.email,
      senha_hash
    ]);

    console.log("✅ Usuário criado com sucesso!");

    return { 
      success: true, 
      message: "Conta criada com sucesso! Você já pode fazer login." 
    };

  } catch (err) {
    console.error("❌ ERRO AO CADASTRAR:", err);
    return { 
      success: false, 
      message: "Erro ao criar conta. Tente novamente." 
    };
  }
}

module.exports = { registerUser };