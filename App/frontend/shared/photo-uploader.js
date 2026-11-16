(function () {
    "use strict";

    const MAX_BYTES = 2 * 1024 * 1024;

    function readAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }

    function currentUserId() {
        try {
            const s = JSON.parse(localStorage.getItem("session") || "{}");
            return s.id_usuario || s.id || null;
        } catch (_) {
            return null;
        }
    }

    function paint(element, foto) {
        if (!element) return;
        if (foto) {
            element.style.backgroundImage = `url("${foto}")`;
            element.style.backgroundSize = "cover";
            element.style.backgroundPosition = "center";
            element.textContent = "";
            element.classList.add("has-photo");
        } else {
            element.style.backgroundImage = "";
            element.classList.remove("has-photo");
        }
    }

    function buildInput() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/png,image/jpeg,image/webp,image/gif";
        input.style.display = "none";
        return input;
    }

    async function uploadPhoto(file, opts) {
        if (!file) return { success: false, message: "Nenhum arquivo selecionado." };

        if (file.size > MAX_BYTES) {
            return { success: false, message: "A imagem deve ter no máximo 2MB." };
        }

        if (!/^image\/(png|jpe?g|gif|webp)$/i.test(file.type)) {
            return { success: false, message: "Formato de imagem não suportado." };
        }

        const id = opts?.id_usuario || currentUserId();
        if (!id) {
            return { success: false, message: "Sessão não encontrada." };
        }

        if (!window.api?.updateUserPhoto) {
            return { success: false, message: "Função indisponível." };
        }

        const dataUrl = await readAsDataUrl(file);
        const result = await window.api.updateUserPhoto({ id_usuario: id, foto: dataUrl });

        if (result?.success) {
            paint(opts?.element, dataUrl);
            document.dispatchEvent(new CustomEvent("user:photo-updated", { detail: { foto: dataUrl } }));
        }

        return result;
    }

    async function removePhoto(opts) {
        const id = opts?.id_usuario || currentUserId();
        if (!id || !window.api?.updateUserPhoto) {
            return { success: false, message: "Função indisponível." };
        }
        const result = await window.api.updateUserPhoto({ id_usuario: id, foto: null });
        if (result?.success) {
            paint(opts?.element, null);
            document.dispatchEvent(new CustomEvent("user:photo-updated", { detail: { foto: null } }));
        }
        return result;
    }

    async function loadPhoto(opts) {
        const id = opts?.id_usuario || currentUserId();
        if (!id || !window.api?.getUserPhoto) return null;
        const result = await window.api.getUserPhoto(id);
        if (result?.success && result.foto) paint(opts?.element, result.foto);
        return result?.foto || null;
    }

    function attach(element, opts = {}) {
        if (!element) return null;
        element.classList.add("photo-drop");
        element.setAttribute("tabindex", "0");
        element.setAttribute("role", "button");
        element.setAttribute("title", "Clique para alterar a foto");

        const input = buildInput();
        document.body.appendChild(input);

        const onClick = () => input.click();
        const onKey = (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                input.click();
            }
        };
        const onChange = async () => {
            const file = input.files && input.files[0];
            input.value = "";
            if (!file) return;
            const result = await uploadPhoto(file, { ...opts, element });
            if (window.MonettoUI?.toast) {
                window.MonettoUI.toast(result.message || "Foto atualizada!", result.success ? "success" : "error");
            } else if (!result.success) {
                alert(result.message);
            }
        };

        element.addEventListener("click", onClick);
        element.addEventListener("keydown", onKey);
        input.addEventListener("change", onChange);

        return {
            load: () => loadPhoto({ ...opts, element }),
            remove: () => removePhoto({ ...opts, element }),
            destroy() {
                element.removeEventListener("click", onClick);
                element.removeEventListener("keydown", onKey);
                input.removeEventListener("change", onChange);
                input.remove();
            },
        };
    }

    window.MonettoPhoto = { attach, uploadPhoto, removePhoto, loadPhoto };
})();