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

  try {
    const result = await window.api.getTurmas();

    if (!result.success || !result.data.length) {
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

(() => {
  const container = document.getElementById("sidebar-container");
  if (!container) return;

  const sidebar = "../../Assets/Components/admin-school-sidebar.html";

  console.log(`Loading sidebar from: ${sidebar}`);

  fetch(sidebar, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load sidebar: ${response.status}`);
      }
      return response.text();
    })
    .then((html) => {
      container.innerHTML = html;
    })
    .catch((err) => {
      console.error(err);
    });
})();
