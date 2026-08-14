// Fallback sidebar loader (monetto-app.js preferred when present)
(() => {
  if (typeof loadAdminSchoolSidebar === 'function') return;

  const container = document.getElementById('sidebar-container');
  if (!container) return;

  const sidebar = '../../Assets/Components/admin-school-sidebar.html';

  fetch(sidebar, { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load sidebar: ${response.status}`);
      return response.text();
    })
    .then((html) => {
      container.innerHTML = html;
      if (typeof updateSidebarActiveLink === 'function') {
        updateSidebarActiveLink();
      }
    })
    .catch((err) => console.error(err));
})();
