function sairDaConta(destino) {
  if (confirm("Tem certeza que deseja sair da conta?")) {
    window.location.href = destino;
  }
}

function showMsg(el, text, success) {
  if (!el) { alert(text); return; }
  el.textContent = text;
  el.style.color = success ? 'var(--green)' : 'var(--red)';
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 3500);
}

// ── Populate níveis dropdown ──────────────────────────────────
async function loadNiveis() {
  try {
    if (!window.api?.getNiveis) return;
    const result = await window.api.getNiveis();
    if (!result.success) return;

    const sel = document.getElementById('nivelSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">Selecione o nível...</option>' +
      result.data.map(n => `<option value=" ${n.id_nivel}">${n.nome}</option>`).join('');
  } catch (err) {
    console.error("loadNiveis:", err);
  }
}

// ── Load turmas list ──────────────────────────────────────────
async function loadTurmasList() {
  const listBody = document.getElementById('turmasListBody');
  if (!listBody) return;

  listBody.innerHTML = '<div style="color:var(--muted);font-size:.82rem;padding:8px 0">Carregando...</div>';

  // Only ever show turmas belonging to the logged-in admin's own school —
  // the backend re-derives id_escola from this user id, it does not trust
  // any school id sent from the renderer.
  const session = JSON.parse(localStorage.getItem('session') || '{}');
  const currentUserId = session.id;
  if (!currentUserId) {
    listBody.innerHTML = '<div style="color:red;font-size:.82rem">Sessão inválida — faça login novamente.</div>';
    return;
  }

  try {
    const result = await window.api.getTurmas(currentUserId);

    if (!result.success) {
      listBody.innerHTML = `<div style="color:red;font-size:.82rem">${result.message}</div>`;
      return;
    }

    if (!result.data.length) {
      listBody.innerHTML = '<div style="color:var(--muted);font-size:.82rem;padding:12px 0">Nenhuma turma criada ainda.</div>';
      document.querySelector('.list-hd span').textContent = '0 turmas';
      return;
    }

    document.querySelector('.list-hd span').textContent = result.data.length + ' turmas';

    listBody.innerHTML = result.data.map(t => {
      const badge = t.status === 'ativa'
        ? '<span style="color:var(--green);font-size:.72rem;font-weight:700">● Ativa</span>'
        : '<span style="color:var(--muted);font-size:.72rem">● Inativa</span>';
      return `
        <div style="padding:12px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:600;font-size:.88rem">${t.nome_turma}</div>
            <div style="font-size:.75rem;color:var(--muted)">${t.nivel ?? '—'} · ${t.ano_letivo}</div>
          </div>
          ${badge}
        </div>`;
    }).join('');
  } catch (err) {
    listBody.innerHTML = `<div style="color:red;font-size:.82rem">Erro: ${err.message}</div>`;
  }
}

// ── Submit turma ──────────────────────────────────────────────
async function criarTurma() {
  const btn   = document.getElementById('btn');
  const msgEl = document.getElementById('formMsg');

  const nome_turma  = document.getElementById('nomeTurma')?.value.trim();
  const id_nivel    = document.getElementById('nivelSelect')?.value;

  // Read session for real IDs
  const session     = JSON.parse(localStorage.getItem('session') || '{}');
  const id_escola   = session.id_escola;
  const id_professor = session.id;

  if (!nome_turma)   { showMsg(msgEl, 'O nome da turma é obrigatório.', false); return; }
  if (!id_nivel)     { showMsg(msgEl, 'Selecione o nível educacional.', false); return; }
  if (!id_escola)    { showMsg(msgEl, 'Sessão inválida — faça login novamente.', false); return; }
  if (!id_professor) { showMsg(msgEl, 'Sessão inválida — faça login novamente.', false); return; }

  btn.disabled = true;
  btn.textContent = '⏳ Criando...';

  const result = await window.api.registerTurma({ id_escola, id_professor, id_nivel: parseInt(id_nivel), nome_turma });

  btn.disabled = false;
  btn.textContent = '🚀 Publicar Turma';

  showMsg(msgEl, result.message, result.success);

  if (result.success) {
    document.getElementById('nomeTurma').value = '';
    document.getElementById('nivelSelect').value = '';
    loadTurmasList();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadNiveis();
  loadTurmasList();
  document.getElementById('btn').addEventListener('click', criarTurma);
});

async function loadStudentsPage() {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) {
    setText('school-name', 'Sessão inválida');
    setText('school-subtitle', 'Faça login novamente para ver os dados da sua escola.');
    return;
  }

  const result = await window.api.getDashboardAdminEscolar(currentUserId);
  if (!result.success) {
    setText('school-name', 'Erro ao carregar');
    setText('school-subtitle', result.message || 'Não foi possível carregar os dados da escola.');
    return;
  }

  const d = result.data;

  // School hero
  setText('school-name', d.school.name);
  setText('school-subtitle', d.school.subtitle || 'Dashboard do Administrador Escolar');
  const chipsEl = document.getElementById('school-chips');
  if (chipsEl && d.school.chips) {
    chipsEl.innerHTML = d.school.chips.map(c => `<span class="shc">${c}</span>`).join('');
  }
  const alunos = d.school.stats || null;
  if (alunos) setText('alunos-count', alunos.value);

  // Stats row: [alunos, taxaConclusao, tarefas, xp, inativos]
  const statAlunos = d.stats || null;
  if (statAlunos) setText('alunos-matriculados-count', statAlunos.value);

  renderStudents(d.teachers);
}

document.addEventListener('DOMContentLoaded', loadDashboard);