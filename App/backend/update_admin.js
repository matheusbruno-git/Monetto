const db = require("./connection.js");

async function updateAdmin(dados) {
  try {
    const idUsuario = Number(dados?.id_usuario);
    const nome = String(dados?.nome || "").trim();
    const email = String(dados?.email || "").trim();

    if (!idUsuario) {
      return { success: false, message: "Usuário não informado." };
    }

    if (!nome || !email) {
      return { success: false, message: "Nome e e-mail são obrigatórios." };
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValido) {
      return { success: false, message: "E-mail inválido." };
    }

    const [result] = await db.promise().execute(
      `UPDATE usuarios
       SET nome = ?, email = ?
       WHERE id_usuario = ? AND id_perfil = 3
       LIMIT 1`,
      [nome, email, idUsuario],
    );

    if (!result.affectedRows) {
      return {
        success: false,
        message: "Administrador não encontrado para atualização.",
      };
    }

    return { success: true, message: "Perfil atualizado com sucesso!" };
  } catch (err) {
    console.error("updateAdmin Error:", err);
    return { success: false, message: "Erro ao atualizar perfil: " + err.message };
  }
}

module.exports = { updateAdmin };
