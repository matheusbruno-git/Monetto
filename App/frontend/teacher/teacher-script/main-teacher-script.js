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
      loadTeacherSidebarUser();
    })
    .catch((err) => {
      console.error("Erro ao carregar sidebar:", err);
    });
}

async function loadTeacherSidebarUser() {
  const nameEl = document.getElementById("sidebar-user-name");
  const infoEl = document.getElementById("sidebar-user-info");
  let session = {};
  try { session = JSON.parse(localStorage.getItem("session") || "{}"); } catch (_) { }
  if (nameEl) nameEl.textContent = session.nome || "Professor";
  if (!window.api?.getDashboardTeacher) return;
  const id = session.id_usuario || session.id;
  if (!id) return;
  try {
    const result = await window.api.getDashboardTeacher(id);
    const name = result?.data?.teacher?.name || session.nome || "Professor";
    if (nameEl) nameEl.textContent = name;
    if (infoEl) infoEl.textContent = result?.data?.school?.name || "Professor";
  } catch (error) {
    console.error("Erro ao carregar o nome do professor:", error);
  }
}

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

loadTeacherSidebar();
updateSidebarActiveLink();
