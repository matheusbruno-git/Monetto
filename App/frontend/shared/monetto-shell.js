(() => {
  const STORAGE_KEY = "monetto-theme";
  const root = document.documentElement;
  const themeButton = document.getElementById("appThemeBtn");
  const menuButton = document.getElementById("appMenuBtn");

  const applyTheme = (theme) => {
    if (theme !== "light" && theme !== "dark") return;
    root.dataset.theme = theme;
    document.body.classList.toggle("theme-dark", theme === "dark");
    themeButton?.setAttribute("aria-pressed", String(theme === "dark"));
  };

  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem(STORAGE_KEY);
  } catch (_) {
    // Theme storage can be unavailable in restricted browser contexts.
  }
  const initialTheme = savedTheme === "dark" || savedTheme === "light"
    ? savedTheme
    : (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(initialTheme);

  themeButton?.addEventListener("click", () => {
    const systemDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const current = root.dataset.theme || (systemDark ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (_) {
      // Keep the selected theme for this page even when it cannot be saved.
    }
  });

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) applyTheme(event.newValue);
  });

  menuButton?.addEventListener("click", () => {
    const mobile = window.innerWidth <= 800;
    const className = mobile ? "nav-open" : "nav-closed";
    const open = document.body.classList.toggle(className);
    menuButton.setAttribute("aria-expanded", String(open));
  });

  document.addEventListener("click", (event) => {
    if (!document.body.classList.contains("nav-open")) return;
    if (event.target.closest(".sidebar, #appMenuBtn")) return;
    document.body.classList.remove("nav-open");
    menuButton?.setAttribute("aria-expanded", "false");
  });
  document.querySelectorAll(".sidebar a").forEach((link) => {
    link.addEventListener("click", () => {
      document.body.classList.remove("nav-open");
      menuButton?.setAttribute("aria-expanded", "false");
    });
  });
})();
