function updateSidebarActiveLink() {
  const currentPath = normalizePath(window.location.href);
  const links = document.querySelectorAll(".sidebar .sb-link");

  links.forEach((link) => {
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
    const targetPath = normalizePath(new URL(href, window.location.href).href);
    link.classList.toggle(
      "active",
      !!(targetPath && currentPath === targetPath),
    );
  });
}

function normalizePath(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname + parsedUrl.search;
  } catch (err) {
    console.error("Erro ao normalizar caminho:", err);
    return "";
  }
}

function loadTeacherSidebar() {
  const container = document.getElementById("sidebar-container");
  if (!container) return Promise.resolve();

  const sidebarUrl = "../../Assets/Components/teacher-sidebar.html";

  return fetch(sidebarUrl, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load sidebar: ${response.status}`);
      }
      return response.text();
    })
    .then((html) => {
      container.innerHTML = html;
      updateSidebarActiveLink();
    })
    .catch((err) => {
      console.error("Erro ao carregar sidebar:", err);
    });
}

loadTeacherSidebar();
updateSidebarActiveLink();
