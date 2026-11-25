(() => {
    const container = document.getElementById("sidebar-container");

    function sairDaConta(destino) {
        if (!confirm("Tem certeza que deseja sair da conta?")) return;

        try {
            localStorage.removeItem("session");
            sessionStorage.clear();
        } catch (_) { }

        const loginUrl = new URL(destino || "../../login/login.html", window.location.href);
        loginUrl.searchParams.set("fresh", "1");
        window.location.replace(loginUrl.href);
    }

    window.sairDaConta = sairDaConta;

    if (!container) return;

    const sidebar = "../../Assets/Components/admin-geral-sidebar.html";

    console.log(`Loading sidebar from: ${sidebar}`);

    fetch(sidebar, { cache: "no-store" })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Failed to load sidebar: ${response.status}`);
            }
            return response.text();
        })
        .then((html) => {
            container.innerHTML = html;
        })
        .catch((err) => {
            console.error(err);
        });
})();