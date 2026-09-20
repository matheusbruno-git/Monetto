(() => {
  function getSession() {
    try {
      return JSON.parse(localStorage.getItem("session") || "{}");
    } catch (_) {
      return {};
    }
  }

  function normalizePath(url) {
    try {
      return new URL(url, window.location.href).pathname.replace(/\/+$/, "");
    } catch (err) {
      console.error("Erro ao normalizar caminho:", err);

      return "";
    }
  }

  function updateSidebarActiveLink() {
    const currentPath = normalizePath(window.location.href);

    document.querySelectorAll(".sidebar .sb-link").forEach((link) => {
      const href = link.getAttribute("href");

      if (
        !href ||
        href === "#" ||
        href.startsWith("javascript:") ||
        link.classList.contains("sb-logout")
      ) {
        link.classList.remove("active");
        return;
      }

      const targetPath = normalizePath(href);

      link.classList.toggle(
        "active",
        Boolean(targetPath && currentPath === targetPath),
      );
    });
  }

  function fillSidebarUser() {
    const session = getSession();

    const info = document.querySelector(".sb-user-info");

    if (!info) {
      return;
    }

    const nome = session.nome || "Aluno";

    info.innerHTML = `
      <strong>
        ${String(nome).replace(/[&<>"']/g, "")}
      </strong>

      <span class="sb-student-progress">
        Carregando progresso...
      </span>
    `;
  }

  async function loadStudentSidebar() {
    const container = document.getElementById("sidebar-container");

    if (!container) {
      return;
    }

    try {
      const response = await fetch(
        "../../Assets/Components/student-sidebar.html",
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      container.innerHTML = await response.text();

      updateSidebarActiveLink();

      fillSidebarUser();

      document.dispatchEvent(new CustomEvent("student:sidebar-loaded"));
    } catch (err) {
      console.error("Erro ao carregar sidebar do aluno:", err);

      container.innerHTML = `
        <div
          style="
            padding:16px;
            color:#fff;
          "
        >
          Não foi possível carregar o menu.
        </div>
      `;
    }
  }

  function sairDaConta(destino = "../../login/login.html") {
    if (!confirm("Tem certeza que deseja sair da conta?")) {
      return;
    }

    localStorage.removeItem("session");

    sessionStorage.clear();

    window.location.href = destino;
  }

  window.normalizePath = normalizePath;

  window.updateSidebarActiveLink = updateSidebarActiveLink;

  window.loadStudentSidebar = loadStudentSidebar;

  window.sairDaConta = sairDaConta;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadStudentSidebar, {
      once: true,
    });
  } else {
    loadStudentSidebar();
  }
})();
