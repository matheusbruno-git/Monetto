const db = require("./connection.js");

const MAX_BYTES = 2 * 1024 * 1024; // 2MB

async function updateFoto({ id_usuario, foto }) {
    try {
        if (!id_usuario) {
            return { success: false, message: "Usuário não informado." };
        }

        if (typeof foto !== "string" || !foto.length) {
            return { success: false, message: "Foto inválida." };
        }

        // Accept only data URLs of images or http(s) URLs, or empty to remove
        const isDataUrl = /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(foto);
        const isHttpUrl = /^https?:\/\//i.test(foto);

        if (!isDataUrl && !isHttpUrl) {
            return { success: false, message: "Formato de imagem não suportado." };
        }

        // Rough byte size check for base64 payloads
        if (isDataUrl) {
            const base64 = foto.split(",")[1] || "";
            const bytes = Math.floor((base64.length * 3) / 4);
            if (bytes > MAX_BYTES) {
                return { success: false, message: "A imagem deve ter no máximo 2MB." };
            }
        }

        const [result] = await db
            .promise()
            .execute(
                "UPDATE usuarios SET foto_url = ? WHERE id_usuario = ? AND ativo = 1",
                [foto, id_usuario],
            );

        if (!result.affectedRows) {
            return { success: false, message: "Usuário não encontrado." };
        }

        return { success: true, message: "Foto atualizada com sucesso!" };
    } catch (err) {
        console.error("updateFoto Error:", err);
        return { success: false, message: "Erro ao atualizar a foto." };
    }
}

async function removeFoto({ id_usuario }) {
    return updateFoto({ id_usuario, foto: "http://placeholder.local/none.png" });
}

async function updateFoto({ id_usuario, foto }) {
    try {
        if (!id_usuario) {
            return { success: false, message: "Usuário não informado." };
        }

        // Allow clearing the photo
        if (foto === null || foto === "" || foto === undefined) {
            const [result] = await db
                .promise()
                .execute(
                    "UPDATE usuarios SET foto_url = NULL WHERE id_usuario = ? AND ativo = 1",
                    [id_usuario],
                );
            if (!result.affectedRows) {
                return { success: false, message: "Usuário não encontrado." };
            }
            return { success: true, message: "Foto removida." };
        }

        if (typeof foto !== "string") {
            return { success: false, message: "Foto inválida." };
        }

        const isDataUrl = /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(foto);
        const isHttpUrl = /^https?:\/\//i.test(foto);

        if (!isDataUrl && !isHttpUrl) {
            return { success: false, message: "Formato de imagem não suportado." };
        }

        if (isDataUrl) {
            const base64 = foto.split(",")[1] || "";
            const bytes = Math.floor((base64.length * 3) / 4);
            if (bytes > MAX_BYTES) {
                return { success: false, message: "A imagem deve ter no máximo 2MB." };
            }
        }

        const [result] = await db
            .promise()
            .execute(
                "UPDATE usuarios SET foto_url = ? WHERE id_usuario = ? AND ativo = 1",
                [foto, id_usuario],
            );

        if (!result.affectedRows) {
            return { success: false, message: "Usuário não encontrado." };
        }

        return { success: true, message: "Foto atualizada com sucesso!" };
    } catch (err) {
        console.error("updateFoto Error:", err);
        return { success: false, message: "Erro ao atualizar a foto." };
    }
}

module.exports = { updateFoto };

module.exports = { updateFoto, removeFoto };