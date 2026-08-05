(() => {
  const container = document.getElementById("sidebar-container");
  if (!container) return;

  const sidebar = "../../Assets/Components/admin-school-sidebar.html";

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

const result = await window.api.getDashboardAdminEscolar();
if (result.success) {
  const d = result.data;
  document.getElementById('school-name').textContent = d.school.name;
  document.getElementById('alunos-count').textContent = d.stats[0].value;
  // only the fields you care about
}
