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
  const btn = document.getElementById("btn");
  const formMsg = document.getElementById("formMsg");
  const successMsg = document.getElementById("successMsg");

  const session = JSON.parse(localStorage.getItem("session") || "{}");
  const dados = {
    id_escola: session.id_escola,
    nome: document.getElementById("nome").value?.trim(),
    data_nascimento: document.getElementById("data").value,
    cpf: document.getElementById("cpf").value?.trim(),
    responsavel: document.getElementById("resp").value?.trim(),
    telefone_responsavel: document.getElementById("tel").value?.trim(),
    email_responsavel: document.getElementById("email").value?.trim(),
    serie: document.getElementById("serie").value?.trim(),
  };

  function showFormMsg(text, type) {
    if (!formMsg) return;
    formMsg.textContent = text;
    formMsg.className = "";
    if (type === "ok") formMsg.classList.add("ok");
    if (type === "err") formMsg.classList.add("err");
    formMsg.style.display = "block";
  }

  function hideFormMsg() {
    if (!formMsg) return;
    formMsg.style.display = "none";
    formMsg.className = "";
    formMsg.textContent = "";
  }

  if (!dados.id_escola) {
    showFormMsg("Sessão inválida — faça login novamente.", "err");
    return;
  }

  // Basic validation for required fields
  if (
    !dados.nome ||
    !dados.data_nascimento ||
    !dados.cpf ||
    !dados.responsavel
  ) {
    showFormMsg(
      "Preencha todos os campos obrigatórios (nome, data, CPF, responsável).",
      "err",
    );
    return;
  }

  btn.disabled = true;
  showFormMsg("Enviando...", null);

  try {
    const result = await window.api.registerAluno(dados);
    console.log(result);

    if (result && result.success) {
      showFormMsg(result.message || "Aluno cadastrado com sucesso.", "ok");
      if (successMsg) successMsg.style.display = "block";

      // Clear form fields
      ["nome", "data", "cpf", "resp", "tel", "email", "serie"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });

      // Reload dashboard/list so the new aluno appears
      if (typeof loadDashboard === "function") loadDashboard();

      // hide success text after a short delay
      setTimeout(() => {
        if (successMsg) successMsg.style.display = "none";
        hideFormMsg();
      }, 2500);
    } else {
      const msg = (result && result.message) || "Erro ao cadastrar aluno.";
      showFormMsg(msg, "err");
      btn.disabled = false;
    }
  } catch (err) {
    console.error(err);
    showFormMsg("Erro de comunicação com o servidor.", "err");
    btn.disabled = false;
  }
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
