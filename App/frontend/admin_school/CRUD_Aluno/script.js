function getCurrentUserId() {
  try {
    const session = JSON.parse(localStorage.getItem("session") || "{}");
    return session.id_usuario || session.id || null;
  } catch (e) {
    return null;
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
document.getElementById("btn")?.addEventListener("click", async () => {
  // id_escola comes from the logged-in admin's own session, never a hardcoded
  // value, so a new student is always enrolled into the admin's own school.
  const session = JSON.parse(localStorage.getItem("session") || "{}");
  const dados = {
    id_escola: session.id_escola,
    nome: document.getElementById("nome").value,
    data_nascimento: document.getElementById("data").value,
    cpf: document.getElementById("cpf").value,
    responsavel: document.getElementById("resp").value,
    telefone_responsavel: document.getElementById("tel").value,
    email_responsavel: document.getElementById("email").value,
    serie: document.getElementById("serie").value,
  };

  if (!dados.id_escola) {
    console.error("Sessão inválida — faça login novamente.");
    return;
  }

  const result = await window.api.registerAluno(dados);
  console.log(result);
});

// Fallback sidebar loader (monetto-app.js preferred when present)
(() => {
  if (typeof loadAdminSchoolSidebar === "function") return;

  const container = document.getElementById("sidebar-container");
  if (!container) return;

  const sidebar = "../../Assets/Components/admin-school-sidebar.html";

  fetch(sidebar, { cache: "no-store" })
    .then((response) => {
      if (!response.ok)
        throw new Error(`Failed to load sidebar: ${response.status}`);
      return response.text();
    })
    .then((html) => {
      container.innerHTML = html;
      if (typeof updateSidebarActiveLink === "function") {
        updateSidebarActiveLink();
      }
    })
    .catch((err) => console.error(err));
})();

async function loadDashboard() {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) {
    setText("school-name", "Sessão inválida");
    setText(
      "school-subtitle",
      "Faça login novamente para ver os dados da sua escola.",
    );
    return;
  }

  const result = await window.api.getDashboardAdminEscolar(currentUserId);
  if (!result.success) {
    setText("school-name", "Erro ao carregar");
    setText(
      "school-subtitle",
      result.message || "Não foi possível carregar os dados da escola.",
    );
    return;
  }

  const d = result.data;

  const chipsEl = document.getElementById("school-chips");
  if (chipsEl && d.school.chips) {
    chipsEl.innerHTML = d.school.chips
      .map((c) => `<span class="shc">${c}</span>`)
      .join("");
  }
  const alunos = d.school.stats || null;
  console.log(alunos);
  if (alunos) setText("alunos-count", alunos.value);

  // Stats row: [alunos, taxaConclusao, tarefas, xp, inativos]
  const [statAlunos, statTaxa, statTarefas, statXp] = d.stats || [];
  if (statAlunos) setText("alunos-matriculados-count", statAlunos.value);

  renderStudents(d.students);
  console.log("Dashboard data loaded:", d);
}

document.addEventListener("DOMContentLoaded", loadDashboard);

function renderStudents(students) {
  const el = document.getElementById("students-list");
  if (!el) return;
  if (!students || !students.length) {
    el.innerHTML =
      '<div class="teach-item"><div class="teach-info"><strong>Nenhum aluno cadastrado</strong></div></div>';
    return;
  }
  el.innerHTML = students
    .map(
      (s) => `
    <div class="teach-item">
      <div class="tav ${s.avatarClass || "ta1"}">${s.emoji || "👨‍ Schüler"}</div>
      <div class="teach-info"><strong>${s.name}</strong><span>${s.subtitle || ""}</span></div>
    </div>`,
    )
    .join("");
}

loadDashboard();
