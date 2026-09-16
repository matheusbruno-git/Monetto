const db = require("./connection.js");
const bcrypt = require("bcryptjs");

async function registerAluno(dados) {
  try {
    if (!dados.nome || !dados.email || !dados.senha || !dados.id_escola) {
      return {
        success: false,
        message: "Nome, email, senha e escola são obrigatórios.",
      };
    }

    const [existing] = await db
      .promise()
      .execute("SELECT id_usuario FROM usuarios WHERE email = ?", [
        dados.email,
      ]);

    if (existing.length > 0) {
      return {
        success: false,
        message: "Este email já está cadastrado.",
      };
    }

    const [perfil] = await db
      .promise()
      .execute("SELECT id_perfil FROM perfis WHERE nome = 'aluno' LIMIT 1");

    if (perfil.length === 0) {
      return {
        success: false,
        message: "Perfil 'aluno' não encontrado.",
      };
    }

    const senha_hash = await bcrypt.hash(dados.senha, 10);

    const sql = `
      INSERT INTO usuarios
        (
          id_perfil,
          id_escola,
          nome,
          email,
          senha_hash,
          cpf,
          data_nascimento,
          responsavel,
          telefone_responsavel,
          email_responsavel,
          serie,
          ativo
        )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `;

    const [result] = await db
      .promise()
      .execute(sql, [
        perfil[0].id_perfil,
        dados.id_escola,
        dados.nome,
        dados.email,
        senha_hash,
        dados.cpf || null,
        dados.data_nascimento || null,
        dados.responsavel || null,
        dados.telefone_responsavel || null,
        dados.email_responsavel || null,
        dados.serie || null,
      ]);

    return {
      success: true,
      message: "Aluno cadastrado com sucesso!",
      id: result.insertId,
    };
  } catch (err) {
    console.error("Erro ao cadastrar aluno:", err);

    return {
      success: false,
      message: "Erro ao cadastrar aluno.",
    };
  }
}

module.exports = { registerAluno };
