/* Thundera IA Lite — slide de cotação: o comercial informa a quantidade de colaboradores
   (ou escolhe a faixa) e o valor cadastrado na tabela (slide anterior) aparece sozinho. */
(() => {
  'use strict';
  const root = document.getElementById('slide-7');
  const P = () => window.LitePricing;
  if (!root) return;

  const $ = id => document.getElementById(id);
  const qty = $('q-qty'), chips = [...root.querySelectorAll('.lt-q-chip')], card = $('q-card');
  let q = null;       // quantidade digitada (ou null)
  let faixa = null;   // índice da faixa (ou null)

  function set(el, txt) { if (el.textContent !== txt) { el.textContent = txt; return true; } return false; }

  function render() {
    const api = P();
    if (!api) return;
    const est = api.estado();
    const maxFaixa = api.faixas[api.faixas.length - 1].max;
    const acima = q != null && q > maxFaixa;
    const preco = (faixa != null && !acima) ? est.values[faixa] : null;
    const [bEs, bPt] = api.cobranca();

    chips.forEach((c, i) => c.classList.toggle('on', i === faixa && !acima));
    $('q-cur').textContent = api.simbolo();
    $('q-basis-es').textContent = bEs;
    $('q-basis-pt').textContent = bPt;
    const rotulo = acima ? '5.000+' : (faixa != null ? api.faixas[faixa].label : '—');
    $('q-range').innerHTML = rotulo.replace('–', '<span class="d">–</span>');  // a fonte de títulos não tem o travessão

    const mudou = set($('q-price'), preco != null ? api.formatar(preco) : '—');
    if (mudou && preco != null) { const el = $('q-price'); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }

    // total estimado: só quando o valor é por colaborador e a quantidade foi informada
    const total = $('q-total');
    const mostraTotal = preco != null && q != null && est.basis === 'user';
    total.hidden = !mostraTotal;
    if (mostraTotal) {
      set($('q-total-calc'), q.toLocaleString('es-PY') + ' × ' + api.simbolo() + ' ' + api.formatar(preco));
      set($('q-total-val'), api.simbolo() + ' ' + api.formatar(preco * q));
    }

    // mensagens de estado
    let st = 'ok', es = '', pt = '';
    if (acima) {
      st = 'over';
      es = 'Más de ' + maxFaixa.toLocaleString('es-PY') + ' colaboradores: cotización a medida.';
      pt = 'Mais de ' + maxFaixa.toLocaleString('pt-BR') + ' colaboradores: cotação sob medida.';
    } else if (faixa == null) {
      st = 'empty';
      es = 'Ingrese la cantidad de colaboradores o elija un rango.';
      pt = 'Informe a quantidade de colaboradores ou escolha uma faixa.';
    } else if (preco == null) {
      st = 'noprice';
      es = 'Todavía no hay un valor cargado para este rango.';
      pt = 'Ainda não há valor cadastrado para esta faixa.';
    }
    card.dataset.state = st;
    $('q-msg').hidden = st === 'ok';
    set($('q-msg-es'), es);
    set($('q-msg-pt'), pt);
    $('q-go').hidden = st !== 'noprice';
  }

  qty.addEventListener('input', () => {
    qty.value = qty.value.replace(/\D/g, '').slice(0, 5);
    if (qty.value === '') { q = null; faixa = null; }
    else {
      q = parseInt(qty.value, 10);
      faixa = P() ? P().faixaDe(q) : null;
      if (faixa < 0) faixa = null;
    }
    render();
  });
  qty.addEventListener('focus', () => qty.select());

  chips.forEach((c, i) => c.addEventListener('click', () => {
    faixa = i; q = null; qty.value = '';
    render();
  }));

  $('q-go').addEventListener('click', () => {
    // a tabela de valores é o slide imediatamente anterior
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
  });

  document.addEventListener('lite:pricing', render);

  // Digitar na cotação nunca navega os slides.
  document.addEventListener('keydown', e => {
    const t = e.target;
    if (!(t instanceof Element) || !root.contains(t) || !t.matches('input')) return;
    if (e.key === 'Enter') { e.preventDefault(); t.blur(); }
    if (e.key !== 'Escape') e.stopPropagation();
  }, true);

  render();
})();
