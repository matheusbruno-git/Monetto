const db = require("./connection.js");

async function getUserPhoto(id_usuario) {
    try {
        if (!id_usuario) return { success: false, message: "Usuário não informado." };

        const [rows] = await db
            .promise()
            .execute(
                "SELECT foto_url FROM usuarios WHERE id_usuario = ? LIMIT 1",
                [id_usuario],
            );

        if (!rows.length) return { success: false, message: "Usuário não encontrado." };

        return { success: true, foto: rows[0].foto_url || null };
    } catch (err) {
        console.error("getUserPhoto Error:", err);
        return { success: false, message: "Erro ao buscar a foto." };
    }
}

module.exports = { getUserPhoto };