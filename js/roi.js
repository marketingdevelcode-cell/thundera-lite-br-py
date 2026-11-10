/* Thundera IA Lite — slide de ROI: a partir da quantidade de colaboradores e das horas
   recuperadas por dia, calcula o retorno mensal/anual em Guarani e Real, usando o
   salário de referência (Gs. 2.600.000 PY · R$ 3.000 BR) sobre uma jornada de 220h/mês. */
(() => {
  'use strict';
  const root = document.querySelector('.slide[data-title^="Retorno de la inversión"]');
  if (!root) return;

  const SAL_PY = 2600000;  // Gs. / mes — salario de referencia (Paraguay)
  const SAL_BR = 3000;     // R$ / mes — salario de referencia (Brasil)
  const HORAS_MES = 220;   // jornada mensal de referencia
  const DIAS_UTEIS = 22;

  const costoHoraPY = SAL_PY / HORAS_MES;
  const costoHoraBR = SAL_BR / HORAS_MES;

  const qtyInput = document.getElementById('roi-qty');
  const chips = [...root.querySelectorAll('.lt-roi-chip')];
  const card = document.getElementById('roi-card');
  const msg = document.getElementById('roi-msg');
  const $ = id => document.getElementById(id);

  let qty = null;
  let horasDia = Number((chips.find(c => c.classList.contains('on')) || {}).dataset?.horas) || 2;

  const fmtPY = n => new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(Math.round(n));
  const fmtBR = n => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  function render() {
    const ok = qty != null && qty > 0;
    card.dataset.state = ok ? 'ok' : 'empty';
    msg.hidden = ok;

    if (!ok) {
      $('roi-hours').textContent = '—';
      $('roi-calc').textContent = '';
      ['roi-py-mes', 'roi-py-ano', 'roi-br-mes', 'roi-br-ano'].forEach(id => { $(id).textContent = '—'; });
      return;
    }

    const horasMes = qty * horasDia * DIAS_UTEIS;
    const roiMesPY = horasMes * costoHoraPY;
    const roiMesBR = horasMes * costoHoraBR;

    $('roi-hours').textContent = fmtPY(horasMes);
    $('roi-calc').textContent = qty + ' × ' + horasDia + 'h × ' + DIAS_UTEIS;

    $('roi-py-mes').textContent = 'Gs. ' + fmtPY(roiMesPY);
    $('roi-py-ano').textContent = 'Gs. ' + fmtPY(roiMesPY * 12);
    $('roi-br-mes').textContent = 'R$ ' + fmtBR(roiMesBR);
    $('roi-br-ano').textContent = 'R$ ' + fmtBR(roiMesBR * 12);
  }

  qtyInput.addEventListener('input', () => {
    qtyInput.value = qtyInput.value.replace(/\D/g, '').slice(0, 5);
    qty = qtyInput.value === '' ? null : parseInt(qtyInput.value, 10);
    render();
  });
  qtyInput.addEventListener('focus', () => qtyInput.select());

  chips.forEach(c => c.addEventListener('click', () => {
    horasDia = Number(c.dataset.horas);
    chips.forEach(x => x.classList.toggle('on', x === c));
    render();
  }));

  // Digitar no ROI nunca navega os slides (setas, espaço, M, F, O...).
  document.addEventListener('keydown', e => {
    const t = e.target;
    if (!(t instanceof Element) || !root.contains(t) || !t.matches('input')) return;
    if (e.key === 'Enter') { e.preventDefault(); t.blur(); }
    if (e.key !== 'Escape') e.stopPropagation();
  }, true);

  render();
})();
