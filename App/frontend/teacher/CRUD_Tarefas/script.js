function switchTab(id, btn) {
  document.querySelectorAll('.ttab').forEach(t => t.classList.remove('active'));
  ['tarefa','quiz','jogo'].forEach(t => document.getElementById('tab-' + t).style.display = 'none');
  btn.classList.add('active');
  document.getElementById('tab-' + id).style.display = 'block';
}

function selTipo(el) {
  el.closest('.tipo-grid').querySelectorAll('.tipo-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
}

function selDif(el, cls) {
  document.querySelectorAll('.dif-btn').forEach(b => {
    b.classList.remove('sel-g','sel-y','sel-r');
  });
  el.classList.add(cls);
}

function sairDaConta(destino) {
  if (confirm("Tem certeza que deseja sair da conta?")) {
    window.location.href = destino;
  }
}

// ── Populate discipline dropdown from DB ──────────────────────
async function loadCursos() {
  try {
    if (!window.api?.getCursos) return;

    const result = await window.api.getCursos();
    if (!result.success) return;

    const selects = document.querySelectorAll('select[data-cursos]');
    selects.forEach(sel => {
      sel.innerHTML = result.data
        .map(c => `<option value="${c.id_curso}">${c.nome}</option>`)
        .join('');
    });
  } catch (err) {
    console.error("loadCursos:", err);
  }
}

// ── Load existing tarefas into the list panel ─────────────────
async function loadTarefasList() {
  const listArea = document.getElementById('tarefasList');
  if (!listArea) return;

  listArea.innerHTML = '<div style="color:var(--muted);font-size:.82rem;padding:8px 0">Carregando...</div>';

  try {
    const result = await window.api.getTarefas();
    if (!result.success || !result.data.length) {
      listArea.innerHTML = '<div style="color:var(--muted);font-size:.82rem;padding:8px 0">Nenhuma tarefa criada ainda.</div>';
      return;
    }

    listArea.innerHTML = result.data.map(t => {
      const vence = t.data_vencimento
        ? new Date(t.data_vencimento).toLocaleDateString('pt-BR')
        : '—';
      const disc = t.disciplina ?? '—';
      return `
        <div style="padding:12px 0;border-bottom:1px solid var(--border)">
          <div style="font-weight:600;font-size:.88rem;margin-bottom:3px">${t.titulo}</div>
          <div style="font-size:.75rem;color:var(--muted)">${disc} · Vence ${vence}</div>
        </div>`;
    }).join('');

    // Update the count in the header
    const countEl = document.querySelector('.list-hd span');
    if (countEl) countEl.textContent = result.data.length + ' tarefas';

  } catch (err) {
    listArea.innerHTML = `<div style="color:red;font-size:.82rem">Erro: ${err.message}</div>`;
  }
}

// ── Submit tarefa ─────────────────────────────────────────────
async function publicarTarefa() {
  const btn      = document.getElementById('btn');
  const msgEl    = document.getElementById('formMsg');

  const titulo       = document.querySelector('#tab-tarefa input[placeholder*="Título"], #tab-tarefa input[placeholder*="Exercícios"]')?.value.trim()
                    || document.querySelector('#tab-tarefa .fg:first-child input')?.value.trim();
  const descricao    = document.querySelector('#tab-tarefa textarea')?.value.trim();
  const id_curso     = document.querySelector('#tab-tarefa select[data-cursos]')?.value;
  const data_venc    = document.querySelector('#tab-tarefa input[type="datetime-local"]')?.value;

  if (!titulo) { showMsg(msgEl, 'O título é obrigatório.', false); return; }
  if (!id_curso) { showMsg(msgEl, 'Selecione uma disciplina.', false); return; }
  if (!data_venc) { showMsg(msgEl, 'Defina um prazo de entrega.', false); return; }

  // Format date: datetime-local gives "2026-05-28T23:59", we need "2026-05-28"
  const data_vencimento = data_venc.split('T')[0];

  btn.disabled = true;
  btn.textContent = '⏳ Publicando...';

  const result = await window.api.registerTarefa({
    id_escola: 1,       // TODO: replace with real session school ID
    id_curso:  parseInt(id_curso),
    titulo,
    descricao,
    data_vencimento
  });

  btn.disabled = false;
  btn.textContent = '🚀 Publicar Tarefa';

  showMsg(msgEl, result.message, result.success);

  if (result.success) {
    // Clear form
    document.querySelector('#tab-tarefa .fg:first-child input').value = '';
    document.querySelector('#tab-tarefa textarea').value = '';
    document.querySelector('#tab-tarefa input[type="datetime-local"]').value = '';
    // Refresh the list
    loadTarefasList();
  }
}

function showMsg(el, text, success) {
  if (!el) { alert(text); return; }
  el.textContent = text;
  el.style.color = success ? 'var(--green)' : 'var(--red)';
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 3500);
}

document.addEventListener('DOMContentLoaded', () => {
  loadCursos();
  loadTarefasList();
  document.getElementById('btn').addEventListener('click', publicarTarefa);
});