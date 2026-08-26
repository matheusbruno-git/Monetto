// ============================================================
// LOGOUT
// ============================================================

function sairDaConta(destino) {
  if (confirm("Tem certeza que deseja sair da conta?")) {
    window.location.href = destino;
  }
}

// ============================================================
// MENSAGENS
// ============================================================

function showMsg(el, text, success) {
  if (!el) {
    alert(text);
    return;
  }

  el.textContent = text;

  el.style.color = success ? "var(--green)" : "var(--red)";

  el.style.display = "block";

  setTimeout(() => (el.style.display = "none"), 3500);
}

// ============================================================
// POPULATE NÍVEIS DROPDOWN
// ============================================================

async function loadNiveis() {
  try {
    if (!window.api?.getNiveis) {
      console.error("window.api.getNiveis não existe.");
      return;
    }

    const result = await window.api.getNiveis();

    if (!result.success) {
      console.error("Erro ao carregar níveis:", result.message);

      return;
    }

    const sel = document.getElementById("nivelSelect");

    if (!sel) return;

    // IMPORTANTE:
    // Não existe mais espaço antes do ID.

    sel.innerHTML =
      '<option value="">Selecione o nível...</option>' +
      result.data
        .map((n) => `<option value="${n.id_nivel}">${n.nome}</option>`)
        .join("");
  } catch (err) {
    console.error("loadNiveis:", err);
  }
}

// ============================================================
// LOAD TURMAS LIST
// ============================================================

async function loadTurmasList() {
  const listBody = document.getElementById("turmasListBody");

  if (!listBody) return;

  listBody.innerHTML =
    '<div style="color:var(--muted);font-size:.82rem;padding:8px 0">Carregando...</div>';

  // ----------------------------------------------------------
  // SESSION
  // ----------------------------------------------------------

  const session = JSON.parse(localStorage.getItem("session") || "{}");

  const currentUserId = session.id;

  if (!currentUserId) {
    listBody.innerHTML =
      '<div style="color:red;font-size:.82rem">Sessão inválida — faça login novamente.</div>';

    return;
  }

  try {
    const result = await window.api.getTurmas(currentUserId);

    if (!result.success) {
      listBody.innerHTML = `<div style="color:red;font-size:.82rem">${result.message}</div>`;

      return;
    }

    // --------------------------------------------------------
    // NENHUMA TURMA
    // --------------------------------------------------------

    if (!result.data.length) {
      listBody.innerHTML =
        '<div style="color:var(--muted);font-size:.82rem;padding:12px 0">Nenhuma turma criada ainda.</div>';

      const counter = document.querySelector(".list-hd span");

      if (counter) {
        counter.textContent = "0 turmas";
      }

      return;
    }

    // --------------------------------------------------------
    // COUNTER
    // --------------------------------------------------------

    const counter = document.querySelector(".list-hd span");

    if (counter) {
      counter.textContent = result.data.length + " turmas";
    }

    // --------------------------------------------------------
    // RENDER TURMAS
    // --------------------------------------------------------

    listBody.innerHTML = result.data
      .map((t) => {
        const badge =
          t.status === "ativa"
            ? '<span style="color:var(--green);font-size:.72rem;font-weight:700">● Ativa</span>'
            : '<span style="color:var(--muted);font-size:.72rem">● Inativa</span>';

        // Escape simples para o nome da turma
        // antes de colocar no onclick.

        const nomeTurma = String(t.nome_turma || "")
          .replace(/\\/g, "\\\\")
          .replace(/'/g, "\\'")
          .replace(/"/g, "&quot;");

        return `

            <div
              style="
                padding:12px 0;
                border-bottom:1px solid var(--border);
                display:flex;
                justify-content:space-between;
                align-items:center
              "
            >

              <div>

                <div
                  style="
                    font-weight:600;
                    font-size:.88rem
                  "
                >
                  ${t.nome_turma}
                </div>


                <div
                  style="
                    font-size:.75rem;
                    color:var(--muted)
                  "
                >
                  ${t.nivel ?? "—"} · ${t.ano_letivo}
                </div>


                <div
                  style="
                    font-size:.75rem;
                    color:var(--muted)
                  "
                >
                  Criada em: ${t.criado_em}
                </div>


                <div
                  style="
                    font-size:.75rem;
                    color:var(--muted)
                  "
                >
                  Professor:
                  ${t.professor_nome || "—"}
                </div>


                <div
                  style="
                    font-size:.75rem;
                    color:var(--muted);
                    margin-top:6px
                  "
                >

                  <button
                    onclick="OpenModalAtribuirProfessor(${t.id_turma}, '${nomeTurma}')"
                    class="btn btn-primary"
                  >
                    Atribuir Professor
                  </button>


                  <button
                    onclick="deleteTurma(${t.id_turma})"
                    class="btn btn-danger"
                  >
                    Excluir
                  </button>

                </div>

              </div>


              ${badge}

            </div>

          `;
      })
      .join("");
  } catch (err) {
    listBody.innerHTML = `<div style="color:red;font-size:.82rem">Erro: ${err.message}</div>`;

    console.error("loadTurmasList:", err);
  }
}

// ============================================================
// DELETE TURMA
// ============================================================

async function deleteTurma(id_turma) {
  if (!confirm("Tem certeza que deseja excluir esta turma?")) {
    return;
  }

  try {
    const result = await window.api.deleteTurma(id_turma);

    if (result.success) {
      await loadTurmasList();
    } else {
      alert(result.message || "Erro ao excluir turma.");
    }
  } catch (error) {
    console.error("deleteTurma:", error);

    alert("Erro ao excluir turma.");
  }
}

// ============================================================
// TURMA SELECIONADA
// ============================================================

let turmaSelecionadaId = null;

// ============================================================
// ABRIR MODAL ATRIBUIR PROFESSOR
// ============================================================

async function OpenModalAtribuirProfessor(id_turma, nome_turma = "") {
  const modal = document.getElementById("modal-container");

  const professorSelect = document.getElementById("professorId");

  const nomeTurmaModal = document.getElementById("modalNomeTurma");

  if (!modal || !professorSelect) {
    console.error("Modal ou select de professor não encontrado.");

    return;
  }

  // Guarda a turma que está sendo editada.

  turmaSelecionadaId = id_turma;

  // Nome da turma no modal.

  if (nomeTurmaModal) {
    nomeTurmaModal.textContent = nome_turma;
  }

  // Mostra loading.

  professorSelect.innerHTML =
    '<option value="">Carregando professores...</option>';

  // Abre modal.

  modal.style.display = "block";

  // Carrega professores.

  await renderProfessores();
}

// ============================================================
// CARREGAR PROFESSORES NO SELECT
// ============================================================

async function renderProfessores() {
  const professorSelect = document.getElementById("professorId");

  if (!professorSelect) {
    return;
  }

  try {
    // --------------------------------------------------------
    // SESSION
    // --------------------------------------------------------

    const session = JSON.parse(localStorage.getItem("session") || "{}");

    const currentUserId = session.id;

    if (!currentUserId) {
      professorSelect.innerHTML = '<option value="">Sessão inválida</option>';

      return;
    }

    // --------------------------------------------------------
    // GET DASHBOARD
    // --------------------------------------------------------

    const result = await window.api.getDashboardAdminEscolar(currentUserId);

    if (!result.success) {
      professorSelect.innerHTML =
        '<option value="">Erro ao carregar professores</option>';

      console.error(result.message);

      return;
    }

    // --------------------------------------------------------
    // TEACHERS
    // --------------------------------------------------------

    const teachers = result.data?.teachers || [];

    console.log("Professores encontrados:", teachers);

    // --------------------------------------------------------
    // NENHUM PROFESSOR
    // --------------------------------------------------------

    if (!teachers.length) {
      professorSelect.innerHTML =
        '<option value="">Nenhum professor cadastrado</option>';

      return;
    }

    // --------------------------------------------------------
    // SELECT OPTIONS
    // --------------------------------------------------------

    professorSelect.innerHTML =
      '<option value="">Selecione um professor...</option>' +
      teachers
        .map((teacher) => {
          /*
           * O backend pode retornar o ID com nomes
           * diferentes. Tentamos os possíveis campos.
           */

          const id = teacher.id_usuario ?? teacher.id_professor ?? teacher.id;

          const name =
            teacher.nome ?? teacher.name ?? teacher.nome_usuario ?? "Professor";

          if (id === undefined || id === null) {
            console.warn("Professor sem ID:", teacher);

            return "";
          }

          return `
            <option value="${id}">
              ${name}
            </option>
          `;
        })
        .join("");
  } catch (error) {
    console.error("Erro ao carregar professores:", error);

    professorSelect.innerHTML =
      '<option value="">Erro ao carregar professores</option>';
  }
}

// ============================================================
// ATRIBUIR PROFESSOR
// ============================================================

async function AtribuirProfessor() {
  const professorSelect = document.getElementById("professorId");

  if (!professorSelect) {
    return;
  }

  // IMPORTANTE:
  // Aqui precisamos pegar o VALUE do select,
  // e não o elemento inteiro.

  const id_professor = professorSelect.value;

  // ----------------------------------------------------------
  // VALIDAR TURMA
  // ----------------------------------------------------------

  if (!turmaSelecionadaId) {
    alert("Nenhuma turma selecionada.");

    return;
  }

  // ----------------------------------------------------------
  // VALIDAR PROFESSOR
  // ----------------------------------------------------------

  if (!id_professor) {
    alert("Selecione um professor.");

    return;
  }

  try {
    // --------------------------------------------------------
    // BOTÃO
    // --------------------------------------------------------

    const button = document.getElementById("atribuirBtn");

    if (button) {
      button.disabled = true;

      button.textContent = "⏳ Atribuindo...";
    }

    // --------------------------------------------------------
    // API
    // --------------------------------------------------------

    const result = await window.api.atribuirProfessorATurma({
      id_turma: turmaSelecionadaId,

      id_professor: parseInt(id_professor),
    });

    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    if (result.success) {
      closeModal();

      await loadTurmasList();
    } else {
      alert(result.message || "Erro ao atribuir professor à turma.");
    }
  } catch (error) {
    console.error("Erro ao atribuir professor:", error);

    alert("Erro ao atribuir professor à turma.");
  } finally {
    const button = document.getElementById("atribuirBtn");

    if (button) {
      button.disabled = false;

      button.textContent = "Atribuir";
    }
  }
}

// ============================================================
// FECHAR MODAL
// ============================================================

function closeModal() {
  const modal = document.getElementById("modal-container");

  if (modal) {
    modal.style.display = "none";
  }

  // Limpa turma selecionada.

  turmaSelecionadaId = null;

  // Limpa select.

  const professorSelect = document.getElementById("professorId");

  if (professorSelect) {
    professorSelect.innerHTML =
      '<option value="">Selecione um professor...</option>';
  }

  // Limpa nome.

  const nomeTurmaModal = document.getElementById("modalNomeTurma");

  if (nomeTurmaModal) {
    nomeTurmaModal.textContent = "";
  }
}

// ============================================================
// CURRENT USER ID
// ============================================================

async function getCurrentUserId() {
  const session = JSON.parse(localStorage.getItem("session") || "{}");

  return session.id || null;
}

// ============================================================
// CRIAR TURMA
// ============================================================

async function criarTurma() {
  const btn = document.getElementById("btn");

  const msgEl = document.getElementById("formMsg");

  const nome_turma = document.getElementById("nomeTurma")?.value.trim();

  const id_nivel = document.getElementById("nivelSelect")?.value;

  // ----------------------------------------------------------
  // SESSION
  // ----------------------------------------------------------

  const session = JSON.parse(localStorage.getItem("session") || "{}");

  const id_escola = session.id_escola;

  const id_professor = session.id;

  // ----------------------------------------------------------
  // VALIDATIONS
  // ----------------------------------------------------------

  if (!nome_turma) {
    showMsg(msgEl, "O nome da turma é obrigatório.", false);

    return;
  }

  if (!id_nivel) {
    showMsg(msgEl, "Selecione o nível educacional.", false);

    return;
  }

  if (!id_escola) {
    showMsg(msgEl, "Sessão inválida — faça login novamente.", false);

    return;
  }

  if (!id_professor) {
    showMsg(msgEl, "Sessão inválida — faça login novamente.", false);

    return;
  }

  // ----------------------------------------------------------
  // BUTTON
  // ----------------------------------------------------------

  if (btn) {
    btn.disabled = true;

    btn.textContent = "⏳ Criando...";
  }

  try {
    const result = await window.api.registerTurma({
      id_escola: id_escola,

      id_professor: id_professor,

      id_nivel: parseInt(id_nivel),

      nome_turma: nome_turma,
    });

    // --------------------------------------------------------
    // RESET BUTTON
    // --------------------------------------------------------

    if (btn) {
      btn.disabled = false;

      btn.textContent = "🚀 Publicar Turma";
    }

    // --------------------------------------------------------
    // MESSAGE
    // --------------------------------------------------------

    showMsg(msgEl, result.message, result.success);

    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    if (result.success) {
      document.getElementById("nomeTurma").value = "";

      document.getElementById("nivelSelect").value = "";

      await loadTurmasList();
    }
  } catch (error) {
    console.error("Erro ao criar turma:", error);

    if (btn) {
      btn.disabled = false;

      btn.textContent = "🚀 Publicar Turma";
    }

    showMsg(msgEl, "Erro ao criar turma: " + error.message, false);
  }
}

// ============================================================
// LOAD STUDENTS / DASHBOARD
// ============================================================

async function loadStudentsPage() {
  const currentUserId = await getCurrentUserId();

  if (!currentUserId) {
    setText("school-name", "Sessão inválida");

    setText(
      "school-subtitle",
      "Faça login novamente para ver os dados da sua escola.",
    );

    return;
  }

  try {
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

    // --------------------------------------------------------
    // SCHOOL HERO
    // --------------------------------------------------------

    setText("school-name", d.school.name);

    setText(
      "school-subtitle",
      d.school.subtitle || "Dashboard do Administrador Escolar",
    );

    const chipsEl = document.getElementById("school-chips");

    if (chipsEl && d.school.chips) {
      chipsEl.innerHTML = d.school.chips
        .map((c) => `<span class="shc">${c}</span>`)
        .join("");
    }

    // --------------------------------------------------------
    // TEACHERS COUNT
    // --------------------------------------------------------

    const teachers = d.school.stats || null;

    if (teachers) {
      setText("teachers-count", teachers.value);
    }

    // --------------------------------------------------------
    // DASHBOARD TEACHERS
    // --------------------------------------------------------

    renderTeachers(d.teachers);
  } catch (error) {
    console.error("loadStudentsPage:", error);
  }
}

// ============================================================
// RENDER DASHBOARD TEACHERS
// ============================================================

function renderTeachers(teachers) {
  const el = document.getElementById("teachers-list");

  if (!el) {
    return;
  }

  if (!teachers || !teachers.length) {
    el.innerHTML =
      '<div class="teach-item"><div class="teach-info"><strong>Nenhum professor cadastrado</strong></div></div>';

    return;
  }

  el.innerHTML = teachers
    .map(
      (t) => `

          <div class="teach-item">

            <div
              class="tav ${t.avatarClass || "ta1"}"
            >
              ${t.emoji || "👨‍🏫"}
            </div>

            <div class="teach-info">

              <strong>
                ${t.name}
              </strong>

              <span>
                ${t.subtitle || ""}
              </span>

            </div>

          </div>

        `,
    )
    .join("");

  console.log("Teachers data loaded:", teachers);
}

// ============================================================
// DOM READY
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // Load levels
  loadNiveis();

  // Load classes
  loadTurmasList();

  // Load dashboard
  loadStudentsPage();

  // Create class button

  const criarBtn = document.getElementById("btn");

  if (criarBtn) {
    criarBtn.addEventListener("click", criarTurma);
  }

  // Assign teacher button

  const atribuirBtn = document.getElementById("atribuirBtn");

  if (atribuirBtn) {
    atribuirBtn.addEventListener("click", AtribuirProfessor);
  }
});
