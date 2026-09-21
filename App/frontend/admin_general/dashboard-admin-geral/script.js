(() => {
  "use strict";

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem("session") || "{}");
    } catch {
      return {};
    }
  }

  function getCurrentUserId() {
    const session = getSession();
    return session.id_usuario || session.id || null;
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? "—";
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function number(value) {
    return Number(value || 0).toLocaleString("pt-BR");
  }

  function currency(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function renderSchools(schools) {
    const el = document.getElementById("schools-list");
    if (!el) return;

    if (!Array.isArray(schools) || !schools.length) {
      el.innerHTML =
        '<div class="ts-row"><div>—</div><div>Nenhuma escola cadastrada</div><div>0</div><div>0%</div><div>—</div></div>';
      return;
    }

    el.innerHTML = schools
      .map((school, index) => {
        const completion = Number(school.completion) || 0;
        const completionClass =
          completion >= 70
            ? "ts-eng"
            : completion > 0
              ? "ts-eng"
              : "";

        return `
          <div class="ts-row">
            <div class="ts-pos">${index + 1}</div>
            <div>
              <div style="font-size:.85rem;font-weight:600">${escapeHtml(school.name)}</div>
              <div style="font-size:.68rem;color:var(--muted)">${escapeHtml(school.location || "Local não informado")}</div>
            </div>
            <div style="color:var(--muted)">${number(school.students)}</div>
            <div class="${completionClass}">${completion}%</div>
            <div style="font-size:.72rem;color:var(--muted)">Cadastrada</div>
          </div>`;
      })
      .join("");
  }

  function renderPayments(payments) {
    setText("payments-paid-count", number(payments?.paid?.quantidade));
    setText("payments-pending-count", number(payments?.pending?.quantidade));
    setText("payments-paid-value", currency(payments?.paid?.valor));
    setText("payments-mrr", payments?.mrrFormatted || currency(payments?.mrr));
    setText(
      "payments-previous-mrr",
      payments?.previousMrrFormatted || currency(payments?.previousMrr),
    );
  }

  function renderGrowth(growth) {
    const el = document.getElementById("student-growth-chart");
    if (!el) return;

    const rows = Array.isArray(growth) ? growth : [];
    const max = Math.max(1, ...rows.map((item) => Number(item.total) || 0));

    el.innerHTML = rows.length
      ? rows
          .map(
            (item, index) => `
              <div class="bc">
                <div class="bc-bar ${index === rows.length - 1 ? "bc-gold" : "bc-purple"}"
                     style="height:${Math.max(8, ((Number(item.total) || 0) / max) * 90)}px"
                     title="${number(item.total)} alunos"></div>
                <div class="bc-lbl">${escapeHtml(item.label)}</div>
              </div>`,
          )
          .join("")
      : '<div style="font-size:.78rem;color:var(--muted)">Sem dados de crescimento.</div>';
  }

  function renderCourseUsage(courses) {
    const el = document.getElementById("course-usage-list");
    if (!el) return;

    if (!Array.isArray(courses) || !courses.length) {
      el.innerHTML =
        '<div style="font-size:.82rem;color:var(--muted)">Nenhum curso com tarefas cadastrado.</div>';
      return;
    }

    el.innerHTML = courses
      .map(
        (course) => `
          <div style="display:flex;align-items:center;gap:10px;font-size:.82rem">
            <span style="font-size:1.1rem">📚</span>
            <div style="flex:1">
              <div style="margin-bottom:3px">${escapeHtml(course.name)}</div>
              <div style="height:4px;background:rgba(255,255,255,.1);border-radius:99px;overflow:hidden">
                <div style="height:100%;width:${Math.max(0, Math.min(100, Number(course.percentage) || 0))}%;background:linear-gradient(90deg,var(--accent),#f0a500);border-radius:99px"></div>
              </div>
            </div>
            <span style="color:var(--accent);font-weight:700;font-size:.75rem">${number(course.deliveries)}</span>
          </div>`,
      )
      .join("");
  }

  function renderActivities(activities) {
    const el = document.getElementById("activities-list");
    if (!el) return;

    if (!Array.isArray(activities) || !activities.length) {
      el.innerHTML =
        '<div class="tl-item"><div class="tl-body"><strong>Nenhuma atividade encontrada</strong><span>O banco ainda não possui eventos recentes.</span></div></div>';
      return;
    }

    const icons = {
      school: "🏫",
      user: "👤",
      payment: "💳",
    };

    el.innerHTML = activities
      .map(
        (activity) => `
          <div class="tl-item">
            <div class="tl-dot" style="background:var(--green)"></div>
            <div class="tl-body">
              <strong>${escapeHtml(activity.title)}</strong>
              <span>${escapeHtml(activity.subtitle)}</span>
            </div>
            <div class="tl-time">${escapeHtml(activity.time)}</div>
          </div>`,
      )
      .join("");
  }

  function renderDashboard(data) {
    const stats = data.stats || {};

    setText("dashboard-period", data.period?.label || "—");
    setText("banner-escolas", number(stats.escolasTotal));
    setText("banner-alunos", number(stats.alunosTotal));
    setText("banner-professores", number(stats.professoresTotal));

    setText("stat-escolas", number(stats.escolasTotal));
    setText("stat-alunos", number(stats.alunosTotal));
    setText("stat-professores", number(stats.professoresTotal));
    setText("stat-xp", number(stats.xpTotal));
    setText("stat-mrr", currency(stats.mrr));

    setText(
      "stat-alunos-trend",
      `▲ +${number(stats.alunosNovosMes)} este mês`,
    );
    setText(
      "stat-professores-trend",
      `▲ +${number(stats.professoresNovosMes)} este mês`,
    );
    setText("stat-mrr-trend", stats.mrrTrend || "—");

    renderSchools(data.topSchools);
    renderPayments(data.payments);
    renderGrowth(data.growth);
    renderCourseUsage(data.courseUsage);
    renderActivities(data.activities);

    const session = getSession();
    const adminName = data.admin?.nome || session.nome || "Administrador";
    const userName = document.querySelector(".sb-user-info strong");
    if (userName) userName.textContent = adminName;

    const status = document.getElementById("dashboard-status");
    if (status) {
      status.value = `Atualizado às ${new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
  }

  async function carregarDashboardAdminGeral() {
    const status = document.getElementById("dashboard-status");
    const userId = getCurrentUserId();

    if (!userId) {
      if (status) status.value = "Sessão inválida";
      setText("stat-escolas", "—");
      setText("stat-alunos", "—");
      setText("stat-professores", "—");
      return;
    }

    if (!window.api || typeof window.api.getDashboardAdminGeral !== "function") {
      if (status) status.value = "API indisponível";
      console.error("window.api.getDashboardAdminGeral não está disponível.");
      return;
    }

    if (status) status.value = "Carregando dados...";

    try {
      const result = await window.api.getDashboardAdminGeral(userId);

      if (!result || !result.success) {
        throw new Error(
          result?.message || "Não foi possível carregar o dashboard.",
        );
      }

      renderDashboard(result.data);
      console.log("Dashboard Admin Geral carregado:", result.data);
    } catch (error) {
      console.error("Erro no Dashboard Admin Geral:", error);
      if (status) status.value = "Erro ao carregar";
      const message = error?.message || "Erro desconhecido";
      const activity = document.getElementById("activities-list");
      if (activity) {
        activity.innerHTML = `<div class="tl-item"><div class="tl-body"><strong>Erro ao carregar dados</strong><span>${escapeHtml(message)}</span></div></div>`;
      }
    }
  }

  window.carregarDashboardAdminGeral = carregarDashboardAdminGeral;

  document.addEventListener("DOMContentLoaded", carregarDashboardAdminGeral);
})();
