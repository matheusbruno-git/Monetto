(() => {
  function getSession() {
    try {
      return JSON.parse(localStorage.getItem("session") || "{}");
    } catch (_) {
      return {};
    }
  }

  const session = getSession();

  const studentId = session.id_usuario || session.id || null;

  function escapeHtml(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );
  }

  function toDate(value) {
    if (!value) {
      return null;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDate(value) {
    const date = toDate(value);

    return date ? date.toLocaleDateString("pt-BR") : "Sem prazo";
  }

  function formatDateTime(value) {
    const date = toDate(value);

    return date
      ? date.toLocaleString("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "—";
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);

    if (element) {
      element.textContent = value;
    }
  }

  function setValue(selector, value) {
    const element = document.querySelector(selector);

    if (element) {
      element.value = value ?? "";
    }
  }

  function isToday(value) {
    const date = toDate(value);

    if (!date) {
      return false;
    }

    const today = new Date();

    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }

  function taskClass(task) {
    if (task.concluida) {
      return "done";
    }

    const due = toDate(task.data_vencimento);

    if (!due) {
      return "pendent";
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    return due < today ? "late" : "pendent";
  }

  function updateSidebar(student) {
    const info = document.querySelector(".sb-user-info");

    if (!info) {
      return false;
    }

    info.innerHTML = `
      <strong>
        ${escapeHtml(student.nome)}
      </strong>

      <span>
        ⚡ ${Number(student.xp_atual) || 0} XP
        · Nível ${Number(student.nivel_atual) || 1}
      </span>
    `;

    return true;
  }

  function waitForSidebar(student) {
    if (updateSidebar(student)) {
      return;
    }

    const observer = new MutationObserver(() => {
      if (updateSidebar(student)) {
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
    }, 10000);
  }

  function applyShared(data) {
    const { student } = data;

    document.querySelectorAll(".xp-topbar").forEach((element) => {
      element.innerHTML = `
          ⚡
          <strong>
            ${Number(student.xp_atual) || 0} XP
          </strong>
          &nbsp;·
          Nível
          ${Number(student.nivel_atual) || 1}
        `;
    });

    waitForSidebar(student);

    if (document.body.classList.contains("settings-page")) {
      const profileInfo = document.querySelector(".profile-info");

      if (profileInfo) {
        profileInfo.innerHTML = `
          <strong>
            ${escapeHtml(student.nome)}
          </strong>

          <span>
            ${escapeHtml(student.email)}
          </span>

          <div class="profile-badges">

            <span class="pb pb-gold">
              ⭐ Nível
              ${Number(student.nivel_atual) || 1}
            </span>

            <span class="pb pb-green">
              🔥
              ${Number(student.sequencia_dias) || 0}
              dias
            </span>

            <span class="pb">
              🎓
              ${escapeHtml(student.turma || "Sem turma")}
            </span>

          </div>
        `;
      }

      setValue("#nome_usuario", student.nome);

      setValue("#email_usuario", student.email);

      setValue("#turma_usuario", student.turma || "Sem turma");

      setValue("#escola_usuario", student.escola || "Não vinculada");

      setText("#conta_escola", student.escola || "Não vinculada");
    }
  }

  function renderDashboard(data) {
    const {
      student,
      tasks = [],
      ranking = [],
      stats = {},
      rewards = [],
    } = data;

    const firstName = String(student.nome || "Aluno")
      .trim()
      .split(/\s+/)[0];

    const heading = document.querySelector(".topbar h1");

    if (heading) {
      heading.innerHTML = `
        Olá,
        <span>
          ${escapeHtml(firstName)}!
        </span>
        👋
      `;
    }

    const subtitle = document.querySelector(".topbar p");

    if (subtitle) {
      subtitle.textContent = `Você tem ${
        Number(stats.pendingTasks) || 0
      } tarefa(s) pendente(s)`;
    }

    const statValues = document.querySelectorAll(".stats-row .stat-val");

    const values = [
      Number(student.xp_atual) || 0,

      Number(stats.completedTasks) || 0,

      Number(student.sequencia_dias) || 0,

      Math.round(Number(stats.completionRate) || 0),
    ];

    values.forEach((value, index) => {
      if (statValues[index]) {
        statValues[index].textContent = value;
      }
    });

    const statLabels = document.querySelectorAll(".stats-row .stat-lbl");

    if (statLabels[3]) {
      statLabels[3].textContent = "Progresso (%)";
    }

    const taskCard = document.querySelector(".section-row > .card");

    if (taskCard) {
      const visible = tasks.slice(0, 5);

      taskCard.innerHTML = `
        <div class="card-title">

          Tarefas do Professor

          <span class="badge-count">
            ${Number(stats.totalTasks) || 0}
            tarefas
          </span>

        </div>

        <div class="filter-tabs">

          <div class="ftab active">
            Todas
          </div>

        </div>

        ${
          visible.length
            ? visible
                .map(
                  (task) => `
              <div
                class="
                  task-item
                  ${taskClass(task)}
                "
              >

                <div
                  class="
                    priority
                    p-med
                  "
                ></div>

                <div
                  class="
                    task-check
                    ${task.concluida ? "done" : ""}
                  "
                ></div>

                <div class="task-body">

                  <div
                    class="
                      task-name
                      ${task.concluida ? "done-text" : ""}
                    "
                  >
                    ${escapeHtml(task.titulo)}
                  </div>

                  <div class="task-meta">

                    <span class="task-subject">
                      ${escapeHtml(task.curso || "Sem matéria")}
                    </span>

                    <span class="task-due">

                      ${
                        task.concluida
                          ? "Concluída"
                          : `Prazo: ${formatDate(task.data_vencimento)}`
                      }

                    </span>

                  </div>

                </div>

                <span class="task-xp">

                  ${
                    Number(task.xp_ganho)
                      ? `+${Number(task.xp_ganho)} XP`
                      : task.concluida
                        ? "Concluída"
                        : "Tarefa"
                  }

                </span>

              </div>
            `,
                )
                .join("")
            : `
              <p>
                Seu professor ainda não cadastrou tarefas.
              </p>
            `
        }
      `;
    }

    const rankingList = document.querySelector(".rank-list");

    if (rankingList) {
      if (!ranking.length) {
        rankingList.innerHTML = `
          <p>
            Você ainda não está em uma turma.
          </p>
        `;
      } else {
        rankingList.innerHTML = ranking
          .slice(0, 5)
          .map(
            (entry, index) => `
            <div class="rank-row-item">

              <div class="rpos">
                ${index + 1}
              </div>

              <span class="rname">

                ${escapeHtml(entry.nome)}

                ${
                  String(entry.id_usuario) === String(student.id_usuario)
                    ? `
                      <span class="me-tag">
                        você
                      </span>
                    `
                    : ""
                }

              </span>

              <span class="rxp">
                ${Number(entry.xp) || 0}
                XP
              </span>

            </div>
          `,
          )
          .join("");
      }
    }

    const miniCards = document.querySelectorAll(".mini-card");

    if (miniCards[0]) {
      const currentXp = Number(student.xp_atual) || 0;

      const nextXp = Math.max(Number(student.xp_proximo_nivel) || 100, 1);

      const percent = Math.min(
        100,
        Math.max(0, Math.round((currentXp / nextXp) * 100)),
      );

      miniCards[0].innerHTML = `
        <div class="mini-title">
          ⚡ Progresso de Nível
        </div>

        <div
          style="
            text-align:center;
            font-size:2.2rem;
            font-weight:800;
          "
        >
          ${Number(student.nivel_atual) || 1}
        </div>

        <div class="xp-progress-wrap">

          <div class="xp-labels">

            <span>
              ${currentXp} XP
            </span>

            <span>
              ${nextXp} XP
            </span>

          </div>

          <div class="xp-bar-bg">

            <div
              class="xp-bar-fill"
              style="width:${percent}%"
            ></div>

          </div>

        </div>
      `;
    }

    const rewardCount = document.querySelector("[data-student-rewards-count]");

    if (rewardCount) {
      rewardCount.textContent = rewards.length;
    }
  }

  function renderTasks(data) {
    const { tasks = [], stats = {}, student } = data;

    const values = document.querySelectorAll(".stats-row .sc-val");

    const cardValues = [
      Number(stats.totalTasks) || 0,

      Number(stats.pendingTasks) || 0,

      Number(stats.completedTasks) || 0,

      Number(student.xp_atual) || 0,
    ];

    cardValues.forEach((value, index) => {
      if (values[index]) {
        values[index].textContent = value;
      }
    });

    const todayCount = tasks.filter(
      (task) => !task.concluida && isToday(task.data_vencimento),
    ).length;

    document.querySelectorAll(".ftab").forEach((tab) => {
      const text = tab.textContent;

      if (text.includes("Todas")) {
        tab.textContent = `Todas (${Number(stats.totalTasks) || 0})`;
      }

      if (text.includes("Pendentes")) {
        tab.textContent = `⏳ Pendentes (${Number(stats.pendingTasks) || 0})`;
      }

      if (text.includes("Vence hoje")) {
        tab.textContent = `🔴 Vence hoje (${todayCount})`;
      }

      if (text.includes("Concluídas")) {
        tab.textContent = `✅ Concluídas (${
          Number(stats.completedTasks) || 0
        })`;
      }
    });

    const list = document.querySelector(".task-list-card");

    if (!list) {
      return;
    }

    list.innerHTML = `
      <div class="tlc-header">

        <h3>
          Lista de Tarefas
        </h3>

      </div>

      ${
        tasks.length
          ? tasks
              .map(
                (task) => `
          <div
            class="
              task-item
              ${task.concluida ? "done-item" : ""}
            "
            data-task-id="${task.id_tarefa}"
          >

            <div
              class="
                priority-bar
                pb-med
              "
            ></div>

            <div
              class="
                check-circle
                ${task.concluida ? "checked" : ""}
              "
            ></div>

            <div class="task-body">

              <div
                class="
                  task-name
                  ${task.concluida ? "done-txt" : ""}
                "
              >
                ${escapeHtml(task.titulo)}
              </div>

              <div class="task-chips">

                <span
                  class="
                    tchip
                    tc-subj
                  "
                >
                  ${escapeHtml(task.curso || "Sem matéria")}
                </span>

              </div>

              <div class="due-row">

                <span class="due-icon">

                  ${task.concluida ? "✅" : "📅"}

                </span>

                <span>

                  ${
                    task.concluida
                      ? "Concluída"
                      : `Prazo: ${formatDate(task.data_vencimento)}`
                  }

                </span>

              </div>

              <div class="task-detail">

                <div class="td-desc">

                  ${escapeHtml(task.descricao || "Sem descrição fornecida.")}

                </div>

              </div>

            </div>

            <div class="task-right">

              ${
                task.concluida
                  ? `
                    <span
                      class="
                        xp-badge
                        earned
                      "
                    >
                      ✓ Concluída
                    </span>
                  `
                  : `
                    <button
                      class="
                        td-btn
                        td-btn-primary
                      "
                      data-complete="${task.id_tarefa}"
                    >
                      Concluir tarefa
                    </button>
                  `
              }

            </div>

          </div>
        `,
              )
              .join("")
          : `
            <p
              style="
                padding:20px;
              "
            >
              Nenhuma tarefa disponível no momento.
            </p>
          `
      }
    `;

    list.querySelectorAll("[data-complete]").forEach((button) => {
      button.addEventListener("click", async () => {
        button.disabled = true;

        try {
          const result = await window.api.completeStudentTask(
            studentId,

            Number(button.dataset.complete),
          );

          if (!result?.success) {
            button.disabled = false;

            alert(result?.message || "Erro ao concluir tarefa.");

            return;
          }

          await load();
        } catch (error) {
          console.error("Erro ao concluir tarefa:", error);

          button.disabled = false;

          alert("Não foi possível concluir a tarefa.");
        }
      });
    });
  }

  function renderGames(data) {
    const { ranking = [], student } = data;

    const leaderboard = document.querySelector(".lb-grid");

    if (!leaderboard) {
      return;
    }

    if (!ranking.length) {
      leaderboard.innerHTML = `
        <p>
          Ranking indisponível:
          aluno ainda não está vinculado a uma turma.
        </p>
      `;

      return;
    }

    const medals = ["🥇", "🥈", "🥉"];

    leaderboard.innerHTML = ranking
      .slice(0, 4)
      .map(
        (entry, index) => `
        <div class="lb-card">

          <div class="lb-pos">
            ${medals[index] || index + 1}
          </div>

          <div
            class="
              lb-av
              la${index + 1}
            "
          ></div>

          <div class="lb-info">

            <strong>

              ${escapeHtml(entry.nome)}

              ${
                String(entry.id_usuario) === String(student.id_usuario)
                  ? " (você)"
                  : ""
              }

            </strong>

            <span>
              ${Number(entry.xp) || 0}
              XP total
            </span>

          </div>

        </div>
      `,
      )
      .join("");
  }

  function renderRewards(data) {
    const { deliveries = [], rewards = [], student } = data;

    const currentXp = Number(student.xp_atual) || 0;

    const nextXp = Math.max(Number(student.xp_proximo_nivel) || 100, 1);

    const percent = Math.min(
      100,
      Math.max(0, Math.round((currentXp / nextXp) * 100)),
    );

    setText(
      ".xp-prog-label",
      `${currentXp} / ${nextXp} XP → Nível ${
        (Number(student.nivel_atual) || 1) + 1
      }`,
    );

    setText(".xp-big", currentXp);

    setText(
      ".xp-sub",
      `⚡ XP Total · Nível ${Number(student.nivel_atual) || 1}`,
    );

    const fill = document.querySelector(".xp-prog-f");

    if (fill) {
      fill.style.width = `${percent}%`;
    }

    const badges = document.querySelector(".badges-grid");

    if (badges) {
      if (!rewards.length) {
        badges.innerHTML = `
          <div class="badge-item locked">

            <span class="badge-icon">
              🏅
            </span>

            <div class="badge-name">
              Nenhuma recompensa ainda
            </div>

            <div class="badge-desc">
              Continue realizando atividades
              para conquistar recompensas.
            </div>

          </div>
        `;
      } else {
        badges.innerHTML = rewards
          .map(
            (reward) => `
          <div class="badge-item">

            <span class="badge-icon">
              🏅
            </span>

            <div class="badge-name">
              ${escapeHtml(reward.nome)}
            </div>

            <div class="badge-desc">
              ${escapeHtml(reward.descricao || "Recompensa conquistada")}
            </div>

            ${
              Number(reward.valor_bonus)
                ? `
                  <div class="badge-xp">
                    +${Number(reward.valor_bonus)} XP
                  </div>
                `
                : ""
            }

          </div>
        `,
          )
          .join("");
      }
    }

    const historyContainer = document.querySelector(
      ".hist-list, .history-list",
    );

    if (!historyContainer) {
      return;
    }

    if (!deliveries.length) {
      historyContainer.innerHTML = `
        <p
          style="
            padding:16px;
          "
        >
          Nenhuma tarefa concluída ainda.
        </p>
      `;

      return;
    }

    historyContainer.innerHTML = deliveries
      .slice(0, 10)
      .map(
        (delivery) => `
        <div class="hist-item">

          <div class="hist-icon">
            ✅
          </div>

          <div class="hist-body">

            <strong>
              Tarefa concluída
            </strong>

            <span>
              ${formatDateTime(delivery.criado_em)}
            </span>

          </div>

          <span class="hist-xp">

            ${
              Number(delivery.xp_ganho)
                ? `+${Number(delivery.xp_ganho)} XP`
                : "Concluída"
            }

          </span>

        </div>
      `,
      )
      .join("");
  }

  function renderLearning(data) {
    const student = data.student;

    const percentage = Math.max(
      0,
      Math.min(100, Number(student.percentual_conclusao) || 0),
    );

    setText(".op-pct", `${percentage}%`);

    const bar = document.querySelector(".op-bar-f");

    if (bar) {
      bar.style.width = `${percentage}%`;
    }
  }

  async function load() {
    if (!studentId) {
      console.error("Sessão do aluno não encontrada em localStorage.session");

      return;
    }

    if (!window.api?.getStudentDashboard) {
      console.error(
        "API getStudentDashboard não está disponível no preload.js",
      );

      return;
    }

    try {
      const result = await window.api.getStudentDashboard(studentId);

      if (!result?.success) {
        console.error(result?.message || "Erro ao carregar dados do aluno.");

        return;
      }

      const data = result.data;

      applyShared(data);

      if (document.body.classList.contains("student-dashboard-page")) {
        renderDashboard(data);
      }

      if (document.body.classList.contains("tasks-page")) {
        renderTasks(data);
      }

      if (document.body.classList.contains("games-page")) {
        renderGames(data);
      }

      if (document.body.classList.contains("rewards-page")) {
        renderRewards(data);
      }

      if (document.body.classList.contains("learning-page")) {
        renderLearning(data);
      }

      window.studentData = data;
    } catch (error) {
      console.error("Erro ao carregar área Student:", error);
    }
  }

  window.reloadStudentData = load;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load, {
      once: true,
    });
  } else {
    load();
  }
})();
