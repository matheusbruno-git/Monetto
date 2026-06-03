function showPage(id, btn) {
  document.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-tarefas').style.display   = 'none';
  document.getElementById('page-relatorios').style.display = 'none';
  btn.classList.add('active');
  document.getElementById('page-' + id).style.display = 'block';
  if (id === 'relatorios') {
    document.getElementById('pageTitle').textContent = '📊 Relatórios';
    document.getElementById('pageSub').textContent   = 'Análises de desempenho e engajamento';
    document.getElementById('exportBtn').style.display = 'block';
  } else {
    document.getElementById('pageTitle').textContent = '📋 Página de Tarefas';
    document.getElementById('exportBtn').style.display = 'none';
  }
}

function setFtab(el) {
  document.querySelectorAll('.ftab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

function sairDaConta(destino) {
  if (confirm("Tem certeza que deseja sair da conta?")) {
    window.location.href = destino;
  }
}

// ── Helpers ───────────────────────────────────────────────────
function classifyStatus(tarefa) {
  const hoje     = new Date(); hoje.setHours(0,0,0,0);
  const vence    = new Date(tarefa.data_vencimento); vence.setHours(0,0,0,0);
  const expirada = tarefa.status === 'expirada' || vence < hoje;
  const vencendo = !expirada && vence.getTime() === hoje.getTime();
  if (expirada) return 'expirada';
  if (vencendo) return 'vencendo';
  return 'ativa';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function buildCard(tarefa, tipo) {
  const opacity  = tipo === 'expirada' ? 'opacity:.7' : '';
  const footerLabel = tipo === 'expirada'
    ? `<span>Expirou ${formatDate(tarefa.data_vencimento)}</span><span style="color:var(--red)">🔴 Expirada</span>`
    : tipo === 'vencendo'
    ? `<span>Vence hoje 23:59</span><span style="color:var(--accent)">🟡 Atenção</span>`
    : `<span>Vence ${formatDate(tarefa.data_vencimento)}</span><span style="color:var(--green)">🟢 OK</span>`;

  const disc = tarefa.disciplina ?? 'Geral';

  return `
    <div class="tcard" style="${opacity}">
      <div class="tcard-title">${tarefa.titulo}</div>
      <div class="tcard-meta">
        <span class="chip">${disc}</span>
        <span class="chip" style="opacity:.6;font-size:.7rem">${tarefa.descricao?.slice(0,30) ?? ''}${tarefa.descricao?.length > 30 ? '…' : ''}</span>
      </div>
      <div class="tcard-footer">${footerLabel}</div>
    </div>`;
}

// ── Load from DB ──────────────────────────────────────────────
async function loadTarefas() {
  try {
    if (!window.api?.getTarefas) {
      throw new Error("window.api.getTarefas não encontrado — verifique o preload.js");
    }

    const result = await window.api.getTarefas();

    if (!result.success) {
      ['ativas','vencendo','expiradas'].forEach(k =>
        document.getElementById('cards-' + k).innerHTML =
          `<div style="padding:1rem;color:red;font-size:.82rem">Erro: ${result.message}</div>`
      );
      return;
    }

    const grupos = { ativa: [], vencendo: [], expirada: [] };

    result.data.forEach(t => {
      const tipo = classifyStatus(t);
      grupos[tipo === 'vencendo' ? 'vencendo' : tipo].push(t);
    });

    document.getElementById('cards-ativas').innerHTML    = grupos.ativa.map(t => buildCard(t,'ativa')).join('') || '<div style="padding:1rem;color:var(--muted);font-size:.82rem">Nenhuma tarefa ativa.</div>';
    document.getElementById('cards-vencendo').innerHTML  = grupos.vencendo.map(t => buildCard(t,'vencendo')).join('') || '<div style="padding:1rem;color:var(--muted);font-size:.82rem">Nenhuma vencendo hoje.</div>';
    document.getElementById('cards-expiradas').innerHTML = grupos.expirada.map(t => buildCard(t,'expirada')).join('') || '<div style="padding:1rem;color:var(--muted);font-size:.82rem">Nenhuma expirada.</div>';

    document.getElementById('count-ativas').textContent   = grupos.ativa.length;
    document.getElementById('count-vencendo').textContent = grupos.vencendo.length;
    document.getElementById('count-expiradas').textContent = grupos.expirada.length;

    // Update topbar subtitle
    const total   = result.data.length;
    const vencendo = grupos.vencendo.length;
    document.getElementById('pageSub').textContent =
      `${total} tarefa${total !== 1 ? 's' : ''} · ${vencendo} vencendo hoje`;

  } catch (err) {
    console.error(err);
    document.getElementById('cards-ativas').innerHTML =
      `<div style="padding:1rem;color:red;font-size:.82rem">Erro: ${err.message}</div>`;
  }
}

document.addEventListener('DOMContentLoaded', loadTarefas);