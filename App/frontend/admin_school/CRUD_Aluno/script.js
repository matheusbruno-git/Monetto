document.getElementById("btn")?.addEventListener("click", async () => {
  // id_escola comes from the logged-in admin's own session, never a hardcoded
  // value, so a new student is always enrolled into the admin's own school.
  const session = JSON.parse(localStorage.getItem('session') || '{}');
  const dados = {
    id_escola: session.id_escola,
    nome: document.getElementById("nome").value,
    data_nascimento: document.getElementById("data").value,
    cpf: document.getElementById("cpf").value,
    responsavel: document.getElementById("resp").value,
    telefone_responsavel: document.getElementById("tel").value,
    email_responsavel: document.getElementById("email").value,
    serie: document.getElementById("serie").value
  };

  if (!dados.id_escola) {
    console.error('Sessão inválida — faça login novamente.');
    return;
  }

  const result = await window.api.registerAluno(dados);
  console.log(result);
});

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
