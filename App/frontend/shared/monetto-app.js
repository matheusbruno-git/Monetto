// monetto-app.js
async function carregarDashboardAdminEscolar() {
  try {
    if (!window.api || typeof window.api.getDashboardAdminEscolar !== 'function') {
      console.warn('API getDashboardAdminEscolar não disponível');
      return;
    }

    const result = await window.api.getDashboardAdminEscolar();
    if (!result.success) {
      console.warn('Erro do backend:', result.message);
      return;
    }

    const d = result.data;

    // Nome da escola
    const elSchool = document.getElementById('school-name');
    if (elSchool) elSchool.textContent = d.school.name;

    // Hero counters  →  d.school.stats
    const elAlunos = document.getElementById('alunos-count');
    if (elAlunos) elAlunos.textContent = d.school.stats[0].value;      // Alunos

    const elDeactivatedAlunos = document.getElementById('deactivated-alunos-count');
    if (elDeactivatedAlunos) elDeactivatedAlunos.textContent = d.stats[4]?.value || '0'; // Alunos inativos +7 dias

    const elCompletionRate = document.getElementById('completion-rate');
    if (elCompletionRate) elCompletionRate.textContent = d.stats[1]?.value || '0'; // Taxa de conclusão

    const elXpDistributed = document.getElementById('xp-distributed');
    if (elXpDistributed) elXpDistributed.textContent = d.stats[3]?.value || '0'; // XP distribuído

    const elProf = document.getElementById('professores-count');
    if (elProf) elProf.textContent = d.school.stats[1].value;          // Professores

    const elTurmas = document.getElementById('turmas-count');
    if (elTurmas) elTurmas.textContent = d.school.stats[2].value;       // Turmas

    // Cards de stats  →  d.stats
    const elMatric = document.getElementById('alunos-matriculados-count');
    if (elMatric) elMatric.textContent = d.stats[0].value;              // Alunos matriculados

    const elTarefas = document.getElementById('tarefas-count');
    if (elTarefas) elTarefas.textContent = d.stats[2].value;            // Tarefas

    const elXp = document.getElementById('xp-count');
    if (elXp) elXp.textContent = d.stats[3].value;                      // XP

  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
  }
}

// Roda quando a página carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', carregarDashboardAdminEscolar);
} else {
  carregarDashboardAdminEscolar();
}