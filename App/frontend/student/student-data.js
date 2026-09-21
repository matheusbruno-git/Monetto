(() => {
  function getSession() {
    try {
      return JSON.parse(localStorage.getItem("session") || "{}");
    } catch (_) {
      return {};
    }
  }

  const session = getSession();
  const studentId =
    session.id_usuario ||
    session.id ||
    null;

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

    const date =
      new Date(value);

    return Number.isNaN(
      date.getTime(),
    )
      ? null
      : date;
  }

  function formatDate(value) {
    const date =
      toDate(value);

    return date
      ? date.toLocaleDateString("pt-BR")
      : "Sem prazo";
  }

  function formatDateTime(value) {
    const date =
      toDate(value);

    return date
      ? date.toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      })
      : "—";
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .toLowerCase()
      .trim();
  }

  function setText(
    selector,
    value,
  ) {
    const element =
      document.querySelector(
        selector,
      );

    if (element) {
      element.textContent =
        value;
    }
  }

  function setValue(
    selector,
    value,
  ) {
    const element =
      document.querySelector(
        selector,
      );

    if (element) {
      element.value =
        value ?? "";
    }
  }

  function isToday(value) {
    const date =
      toDate(value);

    if (!date) {
      return false;
    }

    const today =
      new Date();

    return (
      date.getFullYear() ===
      today.getFullYear() &&
      date.getMonth() ===
      today.getMonth() &&
      date.getDate() ===
      today.getDate()
    );
  }

  function taskClass(task) {
    if (task.concluida) {
      return "done";
    }

    const due =
      toDate(
        task.data_vencimento,
      );

    if (!due) {
      return "pendent";
    }

    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0,
    );

    due.setHours(
      0,
      0,
      0,
      0,
    );

    return due < today
      ? "late"
      : "pendent";
  }

  function updateSidebar(
    student,
  ) {
    const info =
      document.querySelector(
        ".sb-user-info",
      );

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

  function waitForSidebar(
    student,
  ) {
    if (
      updateSidebar(student)
    ) {
      return;
    }

    const observer =
      new MutationObserver(
        () => {
          if (
            updateSidebar(
              student,
            )
          ) {
            observer.disconnect();
          }
        },
      );

    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true,
      },
    );

    setTimeout(
      () => {
        observer.disconnect();
      },
      10000,
    );
  }

  function setupNotification(
    data,
  ) {
    const {
      stats = {},
      tasks = [],
    } = data;

    const buttons =
      document.querySelectorAll(
        ".notif-btn",
      );

    buttons.forEach(
      (button) => {
        const pending =
          Number(
            stats.pendingTasks,
          ) || 0;

        const dot =
          button.querySelector(
            ".notif-dot",
          );

        if (dot) {
          if (pending > 0) {
            dot.textContent =
              pending > 9
                ? "9+"
                : String(
                  pending,
                );

            dot.style.display =
              "flex";

            dot.style.alignItems =
              "center";

            dot.style.justifyContent =
              "center";

            dot.style.fontSize =
              "8px";

            dot.style.fontWeight =
              "700";
          } else {
            dot.style.display =
              "none";
          }
        }

        if (
          button.dataset
            .studentNotificationReady ===
          "true"
        ) {
          return;
        }

        button.dataset
          .studentNotificationReady =
          "true";

        button.style.cursor =
          "pointer";

        button.addEventListener(
          "click",
          () => {
            const existing =
              document.querySelector(
                "#student-notification-popup",
              );

            if (existing) {
              existing.remove();
              return;
            }

            const pendingTasks =
              tasks
                .filter(
                  (task) =>
                    !task.concluida,
                )
                .sort(
                  (a, b) => {
                    const dateA =
                      toDate(
                        a.data_vencimento,
                      )?.getTime() ??
                      Number.MAX_SAFE_INTEGER;

                    const dateB =
                      toDate(
                        b.data_vencimento,
                      )?.getTime() ??
                      Number.MAX_SAFE_INTEGER;

                    return (
                      dateA -
                      dateB
                    );
                  },
                );

            const popup =
              document.createElement(
                "div",
              );

            popup.id =
              "student-notification-popup";

            popup.style.position =
              "fixed";

            popup.style.top =
              "80px";

            popup.style.right =
              "35px";

            popup.style.width =
              "320px";

            popup.style.maxHeight =
              "380px";

            popup.style.overflowY =
              "auto";

            popup.style.padding =
              "18px";

            popup.style.borderRadius =
              "16px";

            popup.style.background =
              "#182454";

            popup.style.border =
              "1px solid rgba(255,255,255,.15)";

            popup.style.boxShadow =
              "0 18px 45px rgba(0,0,0,.35)";

            popup.style.zIndex =
              "99999";

            popup.style.color =
              "#fff";

            popup.innerHTML = `
              <div
                style="
                  font-weight:800;
                  margin-bottom:12px;
                "
              >
                🔔 Notificações
              </div>

              ${pendingTasks.length
                ? pendingTasks
                  .slice(
                    0,
                    5,
                  )
                  .map(
                    (task) => `
                          <div
                            style="
                              padding:10px 0;
                              border-top:1px solid rgba(255,255,255,.1);
                            "
                          >
                            <strong>
                              ${escapeHtml(task.titulo)}
                            </strong>

                            <div
                              style="
                                margin-top:4px;
                                opacity:.75;
                                font-size:.85rem;
                              "
                            >
                              Prazo:
                              ${formatDate(task.data_vencimento)}
                            </div>
                          </div>
                        `,
                  )
                  .join("")
                : `
                    <p
                      style="
                        margin:0;
                        opacity:.8;
                      "
                    >
                      Você não possui tarefas pendentes.
                    </p>
                  `
              }
            `;

            document.body.appendChild(
              popup,
            );
          },
        );
      },
    );
  }

  function applyShared(data) {
    const {
      student,
    } = data;

    document
      .querySelectorAll(
        ".xp-topbar",
      )
      .forEach(
        (element) => {
          element.innerHTML = `
            ⚡
            <strong>
              ${Number(student.xp_atual) || 0} XP
            </strong>
            &nbsp;· Nível
            ${Number(student.nivel_atual) || 1}
          `;
        },
      );

    waitForSidebar(student);

    setupNotification(data);

    if (
      document.body.classList.contains(
        "settings-page",
      )
    ) {
      const profileInfo =
        document.querySelector(
          ".profile-info",
        );

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

      setValue(
        "#nome_usuario",
        student.nome,
      );

      setValue(
        "#email_usuario",
        student.email,
      );

      setValue(
        "#turma_usuario",
        student.turma ||
        "Sem turma",
      );

      setValue(
        "#escola_usuario",
        student.escola ||
        "Não vinculada",
      );

      setText(
        "#conta_escola",
        student.escola ||
        "Não vinculada",
      );
    }
  }

  function renderStreak(
    container,
    student,
  ) {
    if (!container) {
      return;
    }

    const streak =
      Math.max(
        0,
        Number(
          student.sequencia_dias,
        ) || 0,
      );

    const weekDays = [
      "Seg",
      "Ter",
      "Qua",
      "Qui",
      "Sex",
      "Sáb",
      "Dom",
    ];

    const today =
      new Date();

    const jsDay =
      today.getDay();

    const todayIndex =
      jsDay === 0
        ? 6
        : jsDay - 1;

    const activeIndexes =
      new Set();

    const daysToShow =
      Math.min(
        streak,
        7,
      );

    for (
      let i = 0;
      i < daysToShow;
      i++
    ) {
      let index =
        todayIndex - i;

      if (index < 0) {
        index += 7;
      }

      activeIndexes.add(
        index,
      );
    }

    container.innerHTML = `
      <div class="mc-title">
        🔥 Sequência de Acesso
      </div>

      <div class="streak-days">

        ${weekDays
        .map(
          (
            day,
            index,
          ) => {
            let classes =
              "sd";

            if (
              activeIndexes.has(
                index,
              )
            ) {
              classes +=
                " sd-done";
            } else {
              classes +=
                " sd-empty";
            }

            if (
              index ===
              todayIndex
            ) {
              classes +=
                " sd-today";
            }

            return `
                <div
                  class="${classes}"
                >
                  <span
                    style="
                      font-size:.55rem
                    "
                  >
                    ${day}
                  </span>
                </div>
              `;
          },
        )
        .join("")}

      </div>

      <div class="streak-sub">
        ${streak > 0
        ? `
              Sequência atual:
              ${streak}
              dia${streak === 1 ? "" : "s"}
              🔥
            `
        : "Comece sua sequência de acessos."
      }
      </div>
    `;
  }

  function renderDashboard(
    data,
  ) {
    const {
      student,
      tasks = [],
      ranking = [],
      stats = {},
      rewards = [],
    } = data;

    const firstName =
      String(
        student.nome ||
        "Aluno",
      )
        .trim()
        .split(/\s+/)[0];

    const heading =
      document.querySelector(
        ".topbar h1",
      );

    if (heading) {
      heading.innerHTML = `
        Olá,
        <span>
          ${escapeHtml(firstName)}!
        </span>
        👋
      `;
    }

    const subtitle =
      document.querySelector(
        ".topbar p",
      );

    if (subtitle) {
      const today =
        new Date();

      const dateText =
        today.toLocaleDateString(
          "pt-BR",
          {
            weekday:
              "long",
            day:
              "2-digit",
            month:
              "long",
          },
        );

      const prettyDate =
        dateText
          .charAt(0)
          .toUpperCase() +
        dateText.slice(1);

      subtitle.textContent =
        `${prettyDate} · ${Number(
          stats.pendingTasks,
        ) || 0
        } tarefa(s) pendente(s)`;
    }

    const statValues =
      document.querySelectorAll(
        ".stats-row .stat-val",
      );

    const values = [
      Number(
        student.xp_atual,
      ) || 0,

      Number(
        stats.completedTasks,
      ) || 0,

      Number(
        student.sequencia_dias,
      ) || 0,

      Math.round(
        Number(
          stats.completionRate,
        ) || 0,
      ),
    ];

    values.forEach(
      (
        value,
        index,
      ) => {
        if (
          statValues[
          index
          ]
        ) {
          statValues[
            index
          ].textContent =
            value;
        }
      },
    );

    const statLabels =
      document.querySelectorAll(
        ".stats-row .stat-lbl",
      );

    if (statLabels[0]) {
      statLabels[0].textContent =
        "XP Total";
    }

    if (statLabels[1]) {
      statLabels[1].textContent =
        "Tarefas concluídas";
    }

    if (statLabels[2]) {
      statLabels[2].textContent =
        "Dias de sequência";
    }

    if (statLabels[3]) {
      statLabels[3].textContent =
        "Progresso (%)";
    }

    const statChanges =
      document.querySelectorAll(
        ".stats-row .stat-change",
      );

    if (statChanges[0]) {
      statChanges[0].textContent =
        `Nível ${Number(
          student.nivel_atual,
        ) || 1
        }`;
    }

    if (statChanges[1]) {
      statChanges[1].textContent =
        `${Number(
          stats.completedTasks,
        ) || 0
        } de ${Number(
          stats.totalTasks,
        ) || 0
        } tarefas`;
    }

    if (statChanges[2]) {
      const streak =
        Number(
          student.sequencia_dias,
        ) || 0;

      statChanges[2].textContent =
        streak > 0
          ? `Sequência atual: ${streak} dia${streak === 1 ? "" : "s"}`
          : "Sem sequência ativa";
    }

    if (statChanges[3]) {
      statChanges[3].textContent =
        `${Number(
          stats.pendingTasks,
        ) || 0
        } pendente(s)`;
    }

    const taskCard =
      document.querySelector(
        ".section-row > .card",
      );

    if (taskCard) {
      const visible =
        tasks.slice(0, 5);

      taskCard.innerHTML = `
        <div class="card-title">

          Tarefas do Professor

          <span class="badge-count">
            ${Number(
        stats.totalTasks,
      ) || 0
        }
            tarefas
          </span>

        </div>

        <div class="filter-tabs">

          <div class="ftab active">
            Todas
          </div>

        </div>

        ${visible.length
          ? visible
            .map(
              (task) => `
                    <div
                      class="
                        task-item
                        ${taskClass(task)}
                      "
                      data-task-toggle="${task.id_tarefa}"
                      role="button"
                      tabindex="0"
                      title="${task.concluida
                  ? "Clique para reabrir a tarefa"
                  : "Clique para concluir a tarefa"
                }"
                      style="
                        cursor:pointer;
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
                      >
                        ${task.concluida
                  ? ""
                  : ""
                }
                      </div>

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
                            ${task.concluida
                  ? "Concluída"
                  : `Prazo: ${formatDate(task.data_vencimento)}`
                }
                          </span>

                        </div>

                      </div>

                      <span class="task-xp">
                        ${task.concluida
                  ? "Concluída"
                  : Number(task.xp_recompensa)
                    ? `+${Number(task.xp_recompensa)} XP`
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

      async function toggleTask(
        control,
      ) {
        if (
          control.dataset
            .busy ===
          "true"
        ) {
          return;
        }

        control.dataset.busy =
          "true";

        control.style.opacity =
          ".65";

        try {
          const result =
            await window.api.completeStudentTask(
              studentId,
              Number(
                control.dataset
                  .taskToggle,
              ),
            );

          if (
            !result?.success
          ) {
            alert(
              result?.message ||
              "Erro ao alterar tarefa.",
            );

            return;
          }

          await load();
        } catch (error) {
          console.error(
            "Erro ao alterar tarefa:",
            error,
          );

          alert(
            "Não foi possível alterar a tarefa.",
          );
        } finally {
          control.dataset.busy =
            "false";

          control.style.opacity =
            "";
        }
      }

      taskCard
        .querySelectorAll(
          "[data-task-toggle]",
        )
        .forEach(
          (
            control,
          ) => {
            control.addEventListener(
              "click",
              () => {
                toggleTask(
                  control,
                );
              },
            );

            control.addEventListener(
              "keydown",
              (
                event,
              ) => {
                if (
                  event.key ===
                  "Enter" ||
                  event.key ===
                  " "
                ) {
                  event.preventDefault();

                  toggleTask(
                    control,
                  );
                }
              },
            );
          },
        );
    }

    const miniCards =
      document.querySelectorAll(
        ".mini-card",
      );

    if (miniCards[0]) {
      const currentXp =
        Number(
          student.xp_atual,
        ) || 0;

      const nextXp =
        Math.max(
          Number(
            student.xp_proximo_nivel,
          ) || 100,
          1,
        );

      const percent =
        Math.min(
          100,
          Math.max(
            0,
            Math.round(
              (
                currentXp /
                nextXp
              ) *
              100,
            ),
          ),
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
          ${Number(
        student.nivel_atual,
      ) || 1
        }
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
              style="
                width:${percent}%
              "
            ></div>

          </div>

        </div>
      `;
    }

    if (miniCards[1]) {
      renderStreak(
        miniCards[1],
        student,
      );
    }

    if (miniCards[2]) {
      const rankingCard =
        miniCards[2];

      if (
        !student.id_turma
      ) {
        rankingCard.innerHTML = `
          <div class="mini-title">
            🏆 Ranking da Turma
          </div>

          <p>
            Este aluno ainda não está vinculado a uma turma.
          </p>
        `;
      } else if (
        !ranking.length
      ) {
        rankingCard.innerHTML = `
          <div class="mini-title">
            🏆 Ranking da Turma
          </div>

          <p>
            Ainda não há alunos disponíveis no ranking.
          </p>
        `;
      } else {
        rankingCard.innerHTML = `
          <div class="mini-title">
            🏆 Ranking da Turma
          </div>

          <div class="rank-list">

            ${ranking
            .slice(
              0,
              5,
            )
            .map(
              (
                entry,
                index,
              ) => `
                  <div class="rank-row-item">

                    <div class="rpos">
                      ${index + 1}
                    </div>

                    <span class="rname">

                      ${escapeHtml(entry.nome)}

                      ${String(entry.id_usuario) ===
                  String(student.id_usuario)
                  ? `
                            <span class="me-tag">
                              você
                            </span>
                          `
                  : ""
                }

                    </span>

                    <span class="rxp">
                      ${Number(entry.xp) || 0
                }
                      XP
                    </span>

                  </div>
                `,
            )
            .join("")}

          </div>
        `;
      }
    }

    const rewardCount =
      document.querySelector(
        "[data-student-rewards-count]",
      );

    if (rewardCount) {
      rewardCount.textContent =
        rewards.length;
    }
  }

  function renderTasks(data) {
    const { tasks = [], stats = {}, student } = data;

    const subtitle = document.querySelector(".topbar p");

    if (subtitle) {
      subtitle.textContent =
        `${Number(stats.pendingTasks) || 0} pendente(s) · ` +
        `${Number(stats.completedTasks) || 0} concluída(s)`;
    }

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
      (task) =>
        !task.concluida &&
        isToday(task.data_vencimento),
    ).length;

    document
      .querySelectorAll(".filter-bar .ftab")
      .forEach((tab) => {
        const type = tab.dataset.filter;

        if (type === "todas") {
          tab.textContent =
            `Todas (${Number(stats.totalTasks) || 0})`;
        }

        if (type === "pendentes") {
          tab.textContent =
            `⏳ Pendentes (${Number(stats.pendingTasks) || 0})`;
        }

        if (type === "hoje") {
          tab.textContent =
            `🔴 Vence hoje (${todayCount})`;
        }

        if (type === "concluidas") {
          tab.textContent =
            `✅ Concluídas (${Number(stats.completedTasks) || 0})`;
        }
      });

    const list = document.querySelector(".task-list-card");

    if (!list) {
      return;
    }

    const searchInput =
      document.querySelector(".search-wrap input");

    const subjectSelect =
      document.querySelector(".filter-sel");

    let currentFilter =
      document.querySelector(
        ".filter-bar .ftab.active",
      )?.dataset.filter || "todas";

    if (subjectSelect) {
      const previous = subjectSelect.value;

      const subjects = [
        ...new Set(
          tasks
            .map((task) => task.curso)
            .filter(Boolean),
        ),
      ].sort((a, b) =>
        String(a).localeCompare(String(b), "pt-BR"),
      );

      subjectSelect.innerHTML = `
        <option value="">
          Todas as matérias
        </option>

        ${subjects
          .map(
            (subject) => `
              <option value="${escapeHtml(subject)}">
                ${escapeHtml(subject)}
              </option>
            `,
          )
          .join("")}
      `;

      if (subjects.includes(previous)) {
        subjectSelect.value = previous;
      }
    }

    function getFilteredTasks() {
      let filtered = [...tasks];

      const search = normalizeText(
        searchInput?.value,
      );

      const subject =
        subjectSelect?.value || "";

      if (search) {
        filtered = filtered.filter((task) => {
          const searchable = normalizeText(
            [
              task.titulo,
              task.descricao,
              task.curso,
              task.professor,
            ].join(" "),
          );

          return searchable.includes(search);
        });
      }

      if (subject) {
        filtered = filtered.filter(
          (task) =>
            String(task.curso || "") ===
            String(subject),
        );
      }

      if (currentFilter === "pendentes") {
        filtered = filtered.filter(
          (task) => !task.concluida,
        );
      }

      if (currentFilter === "hoje") {
        filtered = filtered.filter(
          (task) =>
            !task.concluida &&
            isToday(task.data_vencimento),
        );
      }

      if (currentFilter === "concluidas") {
        filtered = filtered.filter(
          (task) => task.concluida,
        );
      }

      return filtered;
    }

    function renderTaskList() {
      const filteredTasks =
        getFilteredTasks();

      list.innerHTML = `
        <div class="tlc-header">
          <h3>Lista de Tarefas</h3>
          <span style="opacity:.7;font-size:.9rem;">
            ${filteredTasks.length} resultado(s)
          </span>
        </div>

        ${filteredTasks.length
          ? filteredTasks
            .map(
              (task) => `
                    <div
                      class="task-item ${task.concluida ? "done-item" : ""}"
                      data-task-id="${task.id_tarefa}"
                    >
                      <div class="priority-bar pb-med"></div>

                      <div
                        class="check-circle ${task.concluida ? "checked" : ""}"
                      >
                        ${task.concluida ? "✓" : ""}
                      </div>

                      <div class="task-body">
                        <div
                          class="task-name ${task.concluida ? "done-txt" : ""}"
                        >
                          ${escapeHtml(task.titulo)}
                        </div>

                        <div class="task-chips">
                          <span class="tchip tc-subj">
                            ${escapeHtml(task.curso || "Sem matéria")}
                          </span>

                          ${task.professor
                  ? `
                                <span class="tchip">
                                  ${escapeHtml(task.professor)}
                                </span>
                              `
                  : ""
                }
                        </div>

                        <div class="due-row">
                          <span class="due-icon">
                            ${task.concluida ? "✅" : "📅"}
                          </span>

                          <span>
                            ${task.concluida
                  ? "Concluída"
                  : `Prazo: ${formatDate(task.data_vencimento)}`
                }
                          </span>
                        </div>

                        <div class="task-detail">
                          <div class="td-desc">
                            ${escapeHtml(
                  task.descricao ||
                  "Sem descrição fornecida.",
                )}
                          </div>
                        </div>
                      </div>

                      <div class="task-right">
                        ${task.concluida
                  ? `
                              <button
                                class="td-btn td-btn-secondary"
                                data-toggle-task="${task.id_tarefa}"
                              >
                                Reabrir tarefa
                              </button>
                            `
                  : `
                              <button
                                class="td-btn td-btn-primary"
                                data-toggle-task="${task.id_tarefa}"
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
                  padding:25px;
                  text-align:center;
                  opacity:.75;
                "
              >
                Nenhuma tarefa encontrada com esses filtros.
              </p>
            `
        }
      `;

      list
        .querySelectorAll("[data-toggle-task]")
        .forEach((button) => {
          button.addEventListener(
            "click",
            async () => {
              if (button.dataset.busy === "true") {
                return;
              }

              button.dataset.busy = "true";
              button.disabled = true;

              try {
                const result =
                  await window.api.completeStudentTask(
                    studentId,
                    Number(button.dataset.toggleTask),
                  );

                if (!result?.success) {
                  alert(
                    result?.message ||
                    "Erro ao alterar tarefa.",
                  );
                  return;
                }

                await load();
              } catch (error) {
                console.error(
                  "Erro ao alterar tarefa:",
                  error,
                );

                alert(
                  "Não foi possível alterar a tarefa.",
                );
              } finally {
                button.dataset.busy = "false";
                button.disabled = false;
              }
            },
          );
        });
    }

    if (
      searchInput &&
      searchInput.dataset.studentSearchReady !==
      "true"
    ) {
      searchInput.dataset.studentSearchReady =
        "true";

      searchInput.addEventListener(
        "input",
        renderTaskList,
      );
    }

    if (
      subjectSelect &&
      subjectSelect.dataset.studentSubjectReady !==
      "true"
    ) {
      subjectSelect.dataset.studentSubjectReady =
        "true";

      subjectSelect.addEventListener(
        "change",
        renderTaskList,
      );
    }

    document
      .querySelectorAll(".filter-bar .ftab")
      .forEach((tab) => {
        if (
          tab.dataset.studentFilterReady ===
          "true"
        ) {
          return;
        }

        tab.dataset.studentFilterReady =
          "true";

        tab.addEventListener("click", () => {
          currentFilter =
            tab.dataset.filter || "todas";

          document
            .querySelectorAll(".filter-bar .ftab")
            .forEach((item) => {
              item.classList.remove("active");
            });

          tab.classList.add("active");
          renderTaskList();
        });
      });

    renderTaskList();

    const taskMiniCards =
      document.querySelectorAll(
        ".right-col .mini-card",
      );

    if (taskMiniCards[0]) {
      const subjects = {};

      tasks.forEach((task) => {
        const subject =
          task.curso || "Sem matéria";

        if (!subjects[subject]) {
          subjects[subject] = {
            total: 0,
            completed: 0,
          };
        }

        subjects[subject].total += 1;

        if (task.concluida) {
          subjects[subject].completed += 1;
        }
      });

      const entries =
        Object.entries(subjects);

      taskMiniCards[0].innerHTML = `
        <div class="mc-title">
          📊 Progresso por Matéria
        </div>

        ${entries.length
          ? entries
            .map(
              ([subject, information]) => {
                const percentage =
                  information.total
                    ? Math.round(
                      (
                        information.completed /
                        information.total
                      ) *
                      100,
                    )
                    : 0;

                return `
                      <div style="margin-top:14px;">
                        <div
                          style="
                            display:flex;
                            justify-content:space-between;
                            gap:12px;
                          "
                        >
                          <strong>
                            ${escapeHtml(subject)}
                          </strong>

                          <span>
                            ${information.completed}/${information.total}
                            · ${percentage}%
                          </span>
                        </div>
                      </div>
                    `;
              },
            )
            .join("")
          : `
              <p>Nenhuma matéria disponível.</p>
            `
        }
      `;
    }

    if (taskMiniCards[1]) {
      const withDate = tasks
        .filter((task) => task.data_vencimento)
        .sort(
          (a, b) =>
            new Date(a.data_vencimento).getTime() -
            new Date(b.data_vencimento).getTime(),
        );

      taskMiniCards[1].innerHTML = `
        <div class="mc-title">
          📅 Calendário
        </div>

        ${withDate.length
          ? withDate
            .slice(0, 6)
            .map(
              (task) => `
                    <div style="margin-top:14px;">
                      <strong>
                        ${formatDate(task.data_vencimento)}
                      </strong>

                      <div>
                        ${escapeHtml(task.titulo)}
                        ·
                        ${task.concluida ? "Concluída" : "Pendente"}
                      </div>
                    </div>
                  `,
            )
            .join("")
          : `
              <p>Nenhum prazo cadastrado.</p>
            `
        }
      `;
    }

    if (taskMiniCards[2]) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const upcoming = tasks
        .filter((task) => {
          if (
            task.concluida ||
            !task.data_vencimento
          ) {
            return false;
          }

          const dueDate = new Date(
            `${task.data_vencimento}T12:00:00`,
          );

          dueDate.setHours(0, 0, 0, 0);

          return dueDate >= now;
        })
        .sort(
          (a, b) =>
            new Date(
              `${a.data_vencimento}T12:00:00`,
            ).getTime() -
            new Date(
              `${b.data_vencimento}T12:00:00`,
            ).getTime(),
        )
        .slice(0, 5);

      if (!upcoming.length) {
        taskMiniCards[2].innerHTML = `
          <div class="mc-title">
            ⏰ Próximos Prazos
          </div>

          <p>
            Nenhum prazo pendente no momento.
          </p>
        `;
      } else {
        taskMiniCards[2].innerHTML = `
          <div class="mc-title">
            ⏰ Próximos Prazos
          </div>

          ${upcoming
            .map(
              (task) => `
                <div style="margin-top:14px;">
                  <strong>
                    ${escapeHtml(task.titulo)}
                  </strong>

                  <div>
                    Prazo:
                    ${formatDate(task.data_vencimento)}
                  </div>
                </div>
              `,
            )
            .join("")}
        `;
      }
    }

    if (taskMiniCards[3]) {
      renderStreak(
        taskMiniCards[3],
        student,
      );
    }
  }

  function renderGames(data) {
    const {
      ranking = [],
      student,
    } = data;

    const leaderboard =
      document.querySelector(
        ".lb-grid",
      );

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

    const medals = [
      "🥇",
      "🥈",
      "🥉",
    ];

    leaderboard.innerHTML =
      ranking
        .slice(0, 4)
        .map(
          (
            entry,
            index,
          ) => `
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

                  ${String(
            entry.id_usuario,
          ) ===
              String(
                student.id_usuario,
              )
              ? " (você)"
              : ""
            }
                </strong>

                <span>
                  ${Number(
              entry.xp,
            ) || 0
            }
                  XP total
                </span>

              </div>

            </div>
          `,
        )
        .join("");
  }

  function rewardIcon(
    reward,
  ) {
    const name =
      normalizeText(
        reward?.nome,
      );

    const type =
      normalizeText(
        reward?.tipo,
      );

    if (
      name.includes(
        "sequencia",
      ) ||
      type === "streak"
    ) {
      return "🔥";
    }

    if (
      name.includes(
        "matematica",
      ) ||
      name.includes(
        "juros",
      ) ||
      type ===
      "habilidade"
    ) {
      return "🧠";
    }

    if (
      name.includes(
        "orcamento",
      ) ||
      type ===
      "atividade"
    ) {
      return "🎯";
    }

    if (
      name.includes(
        "investidor",
      )
    ) {
      return "📈";
    }

    if (
      type ===
      "ranking"
    ) {
      return "🏆";
    }

    return "🏅";
  }

  function renderRewards(
    data,
  ) {
    const {
      deliveries = [],
      rewards = [],
      student,
      tasks = [],
    } = data;

    const currentXp =
      Number(
        student.xp_atual,
      ) || 0;

    const nextXp =
      Math.max(
        Number(
          student.xp_proximo_nivel,
        ) || 100,
        1,
      );

    const percent =
      Math.min(
        100,
        Math.max(
          0,
          Math.round(
            (
              currentXp /
              nextXp
            ) *
            100,
          ),
        ),
      );

    setText(
      ".xp-prog-label",
      `${currentXp} / ${nextXp} XP → Nível ${(
        Number(
          student.nivel_atual,
        ) || 1
      ) + 1
      }`,
    );

    setText(
      ".xp-big",
      currentXp,
    );

    setText(
      ".xp-sub",
      `⚡ XP Total · Nível ${Number(
        student.nivel_atual,
      ) || 1
      }`,
    );

    const fill =
      document.querySelector(
        ".xp-prog-f",
      );

    if (fill) {
      fill.style.width =
        `${percent}%`;
    }

    const earnedMap =
      new Map(
        rewards.map(
          (reward) => [
            normalizeText(
              reward.nome,
            ),
            reward,
          ],
        ),
      );

    const featuredRewards = [
      {
        nome:
          "Primeiro Login",

        descricao:
          "Bem-vindo à plataforma!",

        bonus: 10,

        icon: "🏅",
      },

      {
        nome:
          "Sequência de 7 dias",

        descricao:
          "Estudou 7 dias seguidos",

        bonus: 25,

        icon: "🔥",
      },

      {
        nome:
          "Mestre da Matemática",

        descricao:
          "Acertou 10 exercícios de matemática financeira",

        bonus: 50,

        icon: "🧠",
      },

      {
        nome:
          "Orçamento Perfeito",

        descricao:
          "Completou a atividade de orçamento com nota máxima",

        bonus: 30,

        icon: "🎯",
      },
    ];

    const badges =
      document.querySelector(
        ".badges-grid",
      );

    if (badges) {
      const renderedNames =
        new Set();

      const mainBadges =
        featuredRewards.map(
          (
            featured,
          ) => {
            const key =
              normalizeText(
                featured.nome,
              );

            const earned =
              earnedMap.get(
                key,
              );

            renderedNames.add(
              key,
            );

            if (earned) {
              return `
                <div class="badge-item">

                  <span class="badge-icon">
                    ${featured.icon}
                  </span>

                  <div class="badge-name">
                    ${escapeHtml(
                earned.nome,
              )}
                  </div>

                  <div class="badge-desc">
                    ${escapeHtml(
                earned.descricao ||
                featured.descricao,
              )}
                  </div>

                  <div class="badge-xp">
                    +${Number(
                earned.valor_bonus,
              ) ||
                featured.bonus
                }
                    XP
                  </div>

                </div>
              `;
            }

            return `
              <div
                class="
                  badge-item
                  locked
                "
                style="
                  opacity:.42;
                  filter:grayscale(1);
                "
              >

                <span class="badge-icon">
                  🔒
                </span>

                <div class="badge-name">
                  ${escapeHtml(
              featured.nome,
            )}
                </div>

                <div class="badge-desc">
                  Ainda não conquistada
                </div>

                <div class="badge-xp">
                  +${featured.bonus} XP
                </div>

              </div>
            `;
          },
        );

      const extraBadges =
        rewards
          .filter(
            (
              reward,
            ) =>
              !renderedNames.has(
                normalizeText(
                  reward.nome,
                ),
              ),
          )
          .map(
            (
              reward,
            ) => `
              <div class="badge-item">

                <span class="badge-icon">
                  ${rewardIcon(
              reward,
            )}
                </span>

                <div class="badge-name">
                  ${escapeHtml(
              reward.nome,
            )}
                </div>

                <div class="badge-desc">
                  ${escapeHtml(
              reward.descricao ||
              "Recompensa conquistada",
            )}
                </div>

                ${Number(
              reward.valor_bonus,
            )
                ? `
                      <div class="badge-xp">
                        +${Number(
                  reward.valor_bonus,
                )}
                        XP
                      </div>
                    `
                : ""
              }

              </div>
            `,
          );

      badges.innerHTML = [
        ...mainBadges,
        ...extraBadges,
      ].join("");
    }

    const historyContainer =
      document.querySelector(
        ".hist-list, .history-list",
      );

    if (!historyContainer) {
      return;
    }

    const taskMap =
      new Map(
        tasks.map(
          (task) => [
            String(
              task.id_tarefa,
            ),
            task,
          ],
        ),
      );

    const historyItems = [];

    deliveries.forEach(
      (
        delivery,
      ) => {
        const task =
          taskMap.get(
            String(
              delivery.id_tarefa,
            ),
          );

        historyItems.push({
          type:
            "task",

          title:
            task?.titulo
              ? task.titulo
              : "Tarefa concluída",

          subtitle:
            task?.curso
              ? `${task.curso
              } · ${formatDateTime(
                delivery.criado_em,
              )}`
              : formatDateTime(
                delivery.criado_em,
              ),

          date:
            delivery.criado_em
              ? new Date(
                delivery.criado_em,
              )
              : null,

          xp:
            Number(
              delivery.xp_ganho,
            ) || 0,

          icon:
            "✅",
        });
      },
    );

    rewards.forEach(
      (
        reward,
      ) => {
        if (
          !reward.conquistado_em
        ) {
          return;
        }

        historyItems.push({
          type:
            "reward",

          title:
            `Conquista: ${reward.nome}`,

          subtitle:
            formatDateTime(
              reward.conquistado_em,
            ),

          date:
            new Date(
              reward.conquistado_em,
            ),

          xp:
            Number(
              reward.valor_bonus,
            ) || 0,

          icon:
            rewardIcon(
              reward,
            ),
        });
      },
    );

    historyItems.sort(
      (
        a,
        b,
      ) =>
        (
          b.date?.getTime() ||
          0
        ) -
        (
          a.date?.getTime() ||
          0
        ),
    );

    if (
      !historyItems.length
    ) {
      historyContainer.innerHTML = `
        <p
          style="
            padding:18px;
            opacity:.75;
          "
        >
          Nenhuma atividade registrada ainda.
        </p>
      `;

      return;
    }

    historyContainer.innerHTML =
      historyItems
        .slice(
          0,
          15,
        )
        .map(
          (
            item,
          ) => `
            <div class="hist-item">

              <div class="hist-icon">
                ${item.icon}
              </div>

              <div class="hist-body">

                <strong>
                  ${escapeHtml(
            item.title,
          )}
                </strong>

                <span>
                  ${escapeHtml(
            item.subtitle,
          )}
                </span>

              </div>

              <span class="hist-xp">

                ${item.xp > 0
              ? `+${item.xp} XP`
              : item.type ===
                "reward"
                ? "Conquistada"
                : "Concluída"
            }

              </span>

            </div>
          `,
        )
        .join("");
  }

  const learningLessons = [
    {
      id: "m1a1",

      module: 1,

      title:
        "Aula 1: O que é dinheiro?",

      shortTitle:
        "Aula 1: O que é dinheiro?",

      moduleName:
        "Conceitos Básicos",

      minutes: 5,

      xp: 20,

      level:
        "Iniciante",

      locked: false,

      content: `
        <h3>
          O que é dinheiro?
        </h3>

        <p>
          Dinheiro é um meio usado para facilitar trocas.
          Em vez de trocar diretamente um produto por outro,
          usamos o dinheiro para representar valor.
        </p>

        <p>
          Ele também permite comparar preços,
          guardar recursos para o futuro
          e organizar melhor nossas escolhas.
        </p>

        <div class="highlight-box">
          💡
          <strong>
            Ideia principal:
          </strong>

          dinheiro é uma ferramenta.
          Saber utilizá-lo bem é mais importante
          do que apenas possuir dinheiro.
        </div>

        <h3>
          Três funções básicas
        </h3>

        <ul>

          <li>
            <strong>
              Meio de troca:
            </strong>
            facilita compras e vendas.
          </li>

          <li>
            <strong>
              Unidade de valor:
            </strong>
            permite comparar preços.
          </li>

          <li>
            <strong>
              Reserva de valor:
            </strong>
            pode ser guardado para uso futuro.
          </li>

        </ul>
      `,
    },

    {
      id: "m1a2",

      module: 1,

      title:
        "Aula 2: Receita vs Despesa",

      shortTitle:
        "Aula 2: Receita vs Despesa",

      moduleName:
        "Conceitos Básicos",

      minutes: 6,

      xp: 25,

      level:
        "Iniciante",

      locked: false,

      content: `
        <h3>
          Receita e despesa
        </h3>

        <p>
          <strong>
            Receita
          </strong>
          é todo dinheiro que entra.
          Pode ser mesada, salário,
          pagamento por um trabalho,
          presente ou outra fonte de renda.
        </p>

        <p>
          <strong>
            Despesa
          </strong>
          é todo dinheiro que sai
          para pagar alguma coisa.
        </p>

        <div class="formula-box">
          💰 Saldo = Receitas − Despesas
        </div>

        <h3>
          Por que comparar?
        </h3>

        <p>
          Quando as receitas são maiores que as despesas,
          existe uma sobra que pode ser poupada.
          Quando as despesas são maiores,
          é necessário revisar os gastos.
        </p>
      `,
    },

    {
      id: "m1a3",

      module: 1,

      title:
        "Aula 3: Necessidade vs Desejo",

      shortTitle:
        "Aula 3: Necessidade vs Desejo",

      moduleName:
        "Conceitos Básicos",

      minutes: 7,

      xp: 30,

      level:
        "Iniciante",

      locked: false,

      content: `
        <h3>
          Necessidade ou desejo?
        </h3>

        <p>
          Uma
          <strong>
            necessidade
          </strong>
          está ligada ao que é importante para viver,
          estudar e manter o bem-estar.
        </p>

        <p>
          Já um
          <strong>
            desejo
          </strong>
          é algo que queremos,
          mas que normalmente pode esperar.
        </p>

        <ul>

          <li>
            Alimentação e transporte
            podem ser necessidades.
          </li>

          <li>
            Um novo jogo ou uma roupa extra
            podem ser desejos.
          </li>

        </ul>

        <div class="highlight-box">
          🎯 Antes de comprar, pergunte:

          <strong>
            eu preciso disso agora
            ou apenas quero isso?
          </strong>
        </div>
      `,
    },

    {
      id: "m2a1",

      module: 2,

      title:
        "Aula 1: Metas Financeiras",

      shortTitle:
        "Aula 1: Metas Financeiras",

      moduleName:
        "Planejamento Financeiro",

      minutes: 6,

      xp: 40,

      level:
        "Iniciante",

      locked: false,

      content: `
        <h3>
          O que é uma meta financeira?
        </h3>

        <p>
          É um objetivo relacionado ao uso do dinheiro
          que possui valor e prazo definidos.
        </p>

        <p>
          Por exemplo:
          guardar R$ 300 em seis meses
          para comprar algo importante.
        </p>

        <div class="highlight-box">
          💡 Uma boa meta responde:

          <strong>
            quanto preciso,
            para quê e até quando?
          </strong>
        </div>

        <h3>
          Divida metas grandes
        </h3>

        <p>
          Se você precisa guardar R$ 300 em seis meses,
          pode transformar a meta em R$ 50 por mês.
        </p>
      `,
    },

    {
      id: "m2a2",

      module: 2,

      title:
        "Aula 2: Como Poupar",

      shortTitle:
        "Aula 2: Como Poupar",

      moduleName:
        "Planejamento Financeiro",

      minutes: 8,

      xp: 50,

      level:
        "Iniciante",

      locked: false,

      content: `
        <h3>
          Poupar antes de gastar
        </h3>

        <p>
          Poupar significa separar uma parte do dinheiro
          de hoje para uma necessidade ou objetivo futuro.
        </p>

        <p>
          Uma estratégia simples é definir um valor
          ou percentual assim que o dinheiro entra,
          em vez de esperar para ver o que sobra.
        </p>

        <div class="formula-box">
          💰 Receita − Poupança = Limite para gastos
        </div>

        <h3>
          Comece com pouco
        </h3>

        <p>
          O hábito é mais importante do que o valor inicial.
          Pequenas quantias guardadas com frequência
          podem gerar resultados importantes
          ao longo do tempo.
        </p>
      `,
    },

    {
      id: "m2a3",

      module: 2,

      title:
        "Aula 3: Orçamento Pessoal na Prática",

      shortTitle:
        "Aula 3: Orçamento Pessoal",

      moduleName:
        "Planejamento Financeiro",

      minutes: 8,

      xp: 60,

      level:
        "Iniciante",

      locked: false,

      content: `
        <h3>
          O que é um orçamento pessoal?
        </h3>

        <p>
          Um orçamento pessoal é um
          <strong>
            plano financeiro
          </strong>
          que registra todas as entradas
          (receitas) e saídas (despesas)
          de dinheiro em um período,
          geralmente mensal.
        </p>

        <p>
          Ele ajuda a entender para onde o dinheiro vai,
          quanto é possível gastar
          e quanto pode ser reservado
          para objetivos futuros.
        </p>

        <div class="highlight-box">
          💡
          <strong>
            Ideia principal:
          </strong>

          organizar receitas e despesas ajuda
          a tomar decisões financeiras
          com mais consciência.
        </div>

        <h3>
          Como montar um orçamento em 4 passos
        </h3>

        <ul>

          <li>
            <strong>
              1. Liste suas rendas
            </strong>

            — mesada, trabalhos,
            presentes em dinheiro
            ou outras entradas.
          </li>

          <li>
            <strong>
              2. Liste seus gastos
            </strong>

            — alimentação, transporte,
            lazer, escola e outras despesas.
          </li>

          <li>
            <strong>
              3. Compare receitas e despesas
            </strong>

            — verifique quanto sobra
            ou se os gastos estão maiores
            que a renda.
          </li>

          <li>
            <strong>
              4. Defina metas
            </strong>

            — separe parte do dinheiro
            para poupança ou objetivos futuros.
          </li>

        </ul>

        <div class="formula-box">
          💰 Sobra =
          Receita Total − Despesas Totais
        </div>

        <h3>
          A Regra 50-30-20
        </h3>

        <p>
          Uma forma simples de organizar o orçamento
          é dividir a renda em categorias.
        </p>

        <ul>

          <li>
            <strong
              style="
                color:#5B9BF8
              "
            >
              50%
            </strong>

            para necessidades
          </li>

          <li>
            <strong
              style="
                color:var(--accent)
              "
            >
              30%
            </strong>

            para desejos
          </li>

          <li>
            <strong
              style="
                color:var(--green)
              "
            >
              20%
            </strong>

            para poupança ou objetivos
          </li>

        </ul>

        <div class="highlight-box">
          🎯
          <strong>
            Exemplo:
          </strong>

          se uma pessoa recebe R$ 200
          e decide reservar 20%,
          ela separa R$ 40
          para poupança ou metas.
        </div>
      `,
    },

    {
      id: "m2a4",

      module: 2,

      title:
        "Aula 4: Poupança e Juros",

      shortTitle:
        "Aula 4: Poupança e Juros",

      moduleName:
        "Planejamento Financeiro",

      minutes: 9,

      xp: 70,

      level:
        "Intermediário",

      locked: false,

      content: `
        <h3>
          Poupança e juros
        </h3>

        <p>
          Juros representam uma remuneração
          pelo uso do dinheiro ao longo do tempo.
        </p>

        <p>
          Eles podem trabalhar a favor
          de quem investe
          ou aumentar o custo
          de quem possui uma dívida.
        </p>

        <h3>
          Juros simples
        </h3>

        <p>
          Nos juros simples,
          o cálculo ocorre sempre
          sobre o valor inicial.
        </p>

        <div class="formula-box">
          J = Capital × Taxa × Tempo
        </div>

        <h3>
          Juros compostos
        </h3>

        <p>
          Nos juros compostos,
          os juros acumulados passam
          a fazer parte do valor utilizado
          nos períodos seguintes.
        </p>

        <div class="highlight-box">
          💡 Quanto mais cedo se começa a poupar,
          maior é o tempo disponível
          para o dinheiro crescer.
        </div>
      `,
    },

    {
      id: "m2a5",

      module: 2,

      title:
        "Aula 5: Quiz do Módulo",

      shortTitle:
        "Aula 5: Quiz do Módulo",

      moduleName:
        "Planejamento Financeiro",

      minutes: 5,

      xp: 80,

      level:
        "Desafio",

      locked: false,

      content: `
        <h3>
          Quiz do Módulo
        </h3>

        <p>
          Esta etapa revisa os principais assuntos
          estudados no módulo:
          metas, poupança,
          orçamento e juros.
        </p>

        <div class="highlight-box">
          🎯 Vá para

          <strong>
            Jogos & Quiz
          </strong>

          para realizar os desafios interativos
          da plataforma.
        </div>

        <p>
          Revise as aulas anteriores
          antes de iniciar o quiz
          caso ainda tenha dúvidas.
        </p>
      `,
    },

    {
      id: "m3a1",

      module: 3,

      title:
        "Aula 1: O que é crédito?",

      shortTitle:
        "Aula 1: O que é crédito?",

      moduleName:
        "Crédito e Dívida",

      minutes: 7,

      xp: 70,

      level:
        "Intermediário",

      locked: true,

      content: "",
    },

    {
      id: "m3a2",

      module: 3,

      title:
        "Aula 2: Juros e tarifas",

      shortTitle:
        "Aula 2: Juros e tarifas",

      moduleName:
        "Crédito e Dívida",

      minutes: 8,

      xp: 80,

      level:
        "Intermediário",

      locked: true,

      content: "",
    },
  ];

  function renderLearning(data) {
    const student = data.student;

    const progressKey = `monetto_learning_completed_${studentId}`;

    const currentKey = `monetto_learning_current_${studentId}`;

    const availableLessons = learningLessons.filter(
      (lesson) => !lesson.locked,
    );

    const totalLessons = availableLessons.length;

    let completedLessons = [];

    try {
      completedLessons = JSON.parse(
        localStorage.getItem(progressKey) || "[]",
      );

      if (!Array.isArray(completedLessons)) {
        completedLessons = [];
      }
    } catch (_) {
      completedLessons = [];
    }

    completedLessons = completedLessons.filter((id) =>
      availableLessons.some((lesson) => lesson.id === id),
    );

    const savedCurrentId =
      localStorage.getItem(currentKey);

    let currentIndex = learningLessons.findIndex(
      (lesson) =>
        lesson.id === savedCurrentId &&
        !lesson.locked,
    );

    if (currentIndex < 0) {
      currentIndex = 0;
    }

    const lessonPlayer =
      document.querySelector(".lesson-player");

    const headerTitle =
      document.querySelector(".lp-meta > strong");

    const headerSubtitle =
      document.querySelector(".lp-meta > span");

    const badges =
      document.querySelectorAll(".lp-badge");

    const body =
      document.querySelector(".lesson-body");

    const previousButton =
      document.querySelector(".btn-prev");

    const nextButton =
      document.querySelector(".btn-next");

    const moduleItems = Array.from(
      document.querySelectorAll(
        ".module-sidebar .mod-item",
      ),
    );

    const percentageElement =
      document.querySelector(".op-pct");

    const progressBar =
      document.querySelector(".op-bar-f");

    const overallProgress =
      document.querySelector(".overall-prog");

    function saveProgress() {
      localStorage.setItem(
        progressKey,
        JSON.stringify(completedLessons),
      );

      const lesson =
        learningLessons[currentIndex];

      if (lesson) {
        localStorage.setItem(
          currentKey,
          lesson.id,
        );
      }
    }

    function completeLesson(lesson) {
      if (
        !lesson ||
        lesson.locked ||
        completedLessons.includes(lesson.id)
      ) {
        return;
      }

      completedLessons.push(lesson.id);

      saveProgress();
    }

    function updateProgress() {
      const completedCount =
        availableLessons.filter((lesson) =>
          completedLessons.includes(lesson.id),
        ).length;

      const percentage =
        totalLessons > 0
          ? Math.round(
            (completedCount / totalLessons) * 100,
          )
          : 0;

      if (percentageElement) {
        percentageElement.textContent =
          `${percentage}%`;
      }

      if (progressBar) {
        progressBar.style.width =
          `${percentage}%`;
      }

      if (overallProgress) {
        const loadingText = Array.from(
          overallProgress.querySelectorAll("div"),
        ).find(
          (element) =>
            element.textContent.includes(
              "Carregando progresso",
            ) ||
            element.classList.contains("op-sub"),
        );

        if (loadingText) {
          loadingText.textContent =
            `${completedCount} de ${totalLessons} aulas concluídas`;
        } else {
          const info =
            overallProgress.querySelector(
              ".learning-progress-info",
            );

          if (info) {
            info.textContent =
              `${completedCount} de ${totalLessons} aulas concluídas`;
          } else {
            const newInfo =
              document.createElement("div");

            newInfo.className =
              "learning-progress-info";

            newInfo.style.marginTop =
              "8px";

            newInfo.textContent =
              `${completedCount} de ${totalLessons} aulas concluídas`;

            overallProgress.appendChild(
              newInfo,
            );
          }
        }
      }
    }

    function updateModuleSidebar() {
      moduleItems.forEach(
        (item, index) => {
          const lesson =
            learningLessons[index];

          if (!lesson) {
            return;
          }

          const check =
            item.querySelector(
              ".mod-check",
            );

          const status =
            item.querySelector(
              ".mod-item-body span",
            );

          item.classList.remove(
            "active",
            "done",
          );

          if (lesson.locked) {
            item.style.opacity =
              ".4";

            item.style.cursor =
              "not-allowed";

            if (check) {
              check.textContent =
                "🔒";

              check.className =
                "mod-check mc-locked";
            }

            if (status) {
              status.textContent =
                "Bloqueado";
            }

            return;
          }

          item.style.opacity =
            "1";

          item.style.cursor =
            "pointer";

          if (
            completedLessons.includes(
              lesson.id,
            )
          ) {
            item.classList.add(
              "done",
            );

            if (check) {
              check.textContent =
                "✓";

              check.className =
                "mod-check mc-done";
            }

            if (status) {
              status.textContent =
                `${lesson.minutes} min · Concluída`;
            }

            return;
          }

          if (index === currentIndex) {
            item.classList.add(
              "active",
            );

            if (check) {
              check.textContent =
                "→";

              check.className =
                "mod-check mc-active";
            }

            if (status) {
              status.textContent =
                `${lesson.minutes} min · Em andamento`;
            }

            return;
          }

          if (check) {
            check.textContent =
              String(index + 1);

            check.className =
              "mod-check";
          }

          if (status) {
            status.textContent =
              `${lesson.minutes} min · Próxima`;
          }
        },
      );
    }

    function findNextIndex() {
      for (
        let index = currentIndex + 1;
        index < learningLessons.length;
        index++
      ) {
        if (!learningLessons[index].locked) {
          return index;
        }
      }

      return -1;
    }

    function findPreviousIndex() {
      for (
        let index = currentIndex - 1;
        index >= 0;
        index--
      ) {
        if (!learningLessons[index].locked) {
          return index;
        }
      }

      return -1;
    }

    function renderCurrentLesson() {
      const lesson =
        learningLessons[currentIndex];

      if (!lesson || lesson.locked) {
        return;
      }

      saveProgress();

      if (headerTitle) {
        headerTitle.textContent =
          lesson.title;
      }

      if (headerSubtitle) {
        headerSubtitle.textContent =
          `Módulo ${lesson.module} – ${lesson.moduleName} · ${lesson.minutes} min de leitura`;
      }

      if (badges[0]) {
        badges[0].textContent =
          "📖 Leitura";
      }

      if (badges[1]) {
        badges[1].textContent =
          `⚡ +${lesson.xp} XP`;
      }

      if (badges[2]) {
        badges[2].textContent =
          `🎯 ${lesson.level}`;
      }

      if (body) {
        body.innerHTML =
          lesson.content;
      }

      const previousIndex =
        findPreviousIndex();

      const nextIndex =
        findNextIndex();

      if (previousButton) {
        if (previousIndex === -1) {
          previousButton.disabled =
            true;

          previousButton.textContent =
            "← Primeira aula";
        } else {
          previousButton.disabled =
            false;

          previousButton.textContent =
            `← ${learningLessons[
              previousIndex
            ].shortTitle
            }`;
        }
      }

      if (nextButton) {
        nextButton.disabled =
          false;

        if (nextIndex === -1) {
          const isCompleted =
            completedLessons.includes(
              lesson.id,
            );

          nextButton.textContent =
            isCompleted
              ? "Módulo concluído ✓"
              : "✓ Concluir módulo";

          nextButton.dataset.action =
            "finish";
        } else {
          nextButton.textContent =
            `Próxima: ${learningLessons[
              nextIndex
            ].shortTitle
            } →`;

          nextButton.dataset.action =
            "next";
        }
      }

      updateModuleSidebar();
      updateProgress();
    }

    if (
      previousButton &&
      previousButton.dataset.learningProgressReady !==
      "true"
    ) {
      previousButton.dataset.learningProgressReady =
        "true";

      previousButton.addEventListener(
        "click",
        () => {
          const previousIndex =
            findPreviousIndex();

          if (previousIndex === -1) {
            return;
          }

          currentIndex =
            previousIndex;

          renderCurrentLesson();

          if (lessonPlayer) {
            lessonPlayer.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        },
      );
    }

    if (
      nextButton &&
      nextButton.dataset.learningProgressReady !==
      "true"
    ) {
      nextButton.dataset.learningProgressReady =
        "true";

      nextButton.addEventListener(
        "click",
        () => {
          const currentLesson =
            learningLessons[currentIndex];

          completeLesson(
            currentLesson,
          );

          if (
            nextButton.dataset.action ===
            "finish"
          ) {
            updateProgress();
            updateModuleSidebar();

            nextButton.textContent =
              "Módulo concluído ✓";

            let message =
              document.getElementById(
                "learning-complete-message",
              );

            if (!message) {
              message =
                document.createElement("div");

              message.id =
                "learning-complete-message";

              message.style.margin =
                "18px 0";

              message.style.padding =
                "18px";

              message.style.borderRadius =
                "14px";

              message.style.textAlign =
                "center";

              message.style.fontWeight =
                "700";

              message.style.background =
                "rgba(46,204,113,.15)";

              message.style.border =
                "1px solid rgba(46,204,113,.4)";

              message.innerHTML = `
                🎉
                <strong>
                  Parabéns!
                </strong>

                Você concluiu todas as aulas
                disponíveis deste curso.
              `;

              const navigation =
                document.querySelector(
                  ".lesson-nav",
                );

              if (
                navigation &&
                navigation.parentNode
              ) {
                navigation.parentNode.insertBefore(
                  message,
                  navigation,
                );
              }
            }

            return;
          }

          const nextIndex =
            findNextIndex();

          if (nextIndex !== -1) {
            currentIndex =
              nextIndex;

            renderCurrentLesson();

            if (lessonPlayer) {
              lessonPlayer.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }
          }
        },
      );
    }

    moduleItems.forEach(
      (item, index) => {
        if (
          item.dataset.learningProgressReady ===
          "true"
        ) {
          return;
        }

        item.dataset.learningProgressReady =
          "true";

        item.addEventListener(
          "click",
          () => {
            const lesson =
              learningLessons[index];

            if (
              !lesson ||
              lesson.locked
            ) {
              return;
            }

            currentIndex =
              index;

            renderCurrentLesson();

            if (lessonPlayer) {
              lessonPlayer.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }
          },
        );
      },
    );

    renderCurrentLesson();
  }

  async function load() {
    if (!studentId) {
      console.error(
        "Sessão do aluno não encontrada em localStorage.session",
      );

      return;
    }

    if (
      !window.api?.getStudentDashboard
    ) {
      console.error(
        "API getStudentDashboard não está disponível no preload.js",
      );

      return;
    }

    try {
      const result =
        await window.api.getStudentDashboard(
          studentId,
        );

      if (!result?.success) {
        console.error(
          result?.message ||
          "Erro ao carregar dados do aluno.",
        );

        return;
      }

      const data =
        result.data;

      applyShared(data);

      if (
        document.body.classList.contains(
          "student-dashboard-page",
        )
      ) {
        renderDashboard(data);
      }

      if (
        document.body.classList.contains(
          "tasks-page",
        )
      ) {
        renderTasks(data);
      }

      if (
        document.body.classList.contains(
          "games-page",
        )
      ) {
        renderGames(data);
      }

      if (
        document.body.classList.contains(
          "rewards-page",
        )
      ) {
        renderRewards(data);
      }

      if (
        document.body.classList.contains(
          "learning-page",
        )
      ) {
        renderLearning(data);
      }

      window.studentData =
        data;
    } catch (error) {
      console.error(
        "Erro ao carregar área Student:",
        error,
      );
    }
  }

  window.reloadStudentData =
    load;

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      load,
      {
        once: true,
      },
    );
  } else {
    load();
  }
})();