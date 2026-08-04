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
