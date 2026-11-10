/* Thundera IA Lite — tabela de valores por faixa de colaboradores.
   Preenchida à mão pelo responsável; fica salva neste navegador (localStorage). */
(() => {
  'use strict';
  const root = document.querySelector('.slide[data-title^="Inversión"]');
  if (!root) return;

  const KEY = 'thundera_lite_precios';
  const MOEDAS = { PYG: { sym: 'Gs.', dec: 0 }, USD: { sym: 'US$', dec: 2 }, BRL: { sym: 'R$', dec: 2 } };
  const COBRANCA = {
    user: ['por colaborador / mes', 'por colaborador / mês'],
    total: ['total mensual del rango', 'total mensal da faixa']
  };

  // Cotação fixa (Google, 10/11/2026 ~21h UTC) -- quanto vale 1 unidade de cada
  // moeda EM REAIS. É a base de conversão: todo valor é guardado em BRL por
  // baixo dos panos, e convertido na hora de exibir/ler, qualquer que seja a
  // moeda escolhida no seletor. Não é cotação ao vivo -- atualizar aqui se a
  // taxa mudar muito antes de uma apresentação.
  const BRL_POR_UNIDADE = { BRL: 1, PYG: 0.00090, USD: 5.58 };

  const inputs = [...root.querySelectorAll('input[data-tier]')];
  const selMoeda = document.getElementById('pr-currency');
  const selCobranca = document.getElementById('pr-basis');
  let st = { currency: 'PYG', basis: 'user', values: inputs.map(() => null) };

  try {
    const salvo = JSON.parse(localStorage.getItem(KEY));
    if (salvo && MOEDAS[salvo.currency] && COBRANCA[salvo.basis] && Array.isArray(salvo.values)) {
      st = { currency: salvo.currency, basis: salvo.basis, values: inputs.map((_, i) => salvo.values[i] ?? null) };
    }
  } catch (e) { /* sem armazenamento: funciona só nesta sessão */ }

  // Faixas de colaboradores (a mesma lista alimenta a tabela e o slide de cotação)
  const FAIXAS = [
    { min: 0, max: 20, label: '0 – 20' },
    { min: 21, max: 50, label: '21 – 50' },
    { min: 51, max: 75, label: '51 – 75' },
    { min: 76, max: 100, label: '76 – 100' },
    { min: 101, max: 999999, label: '101+' }
  ];

  function avisar() { document.dispatchEvent(new CustomEvent('lite:pricing')); }

  function salvar() {
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* ok */ }
    avisar();
  }

  // `n` é sempre o valor em BRL (como é guardado). Converte pra moeda exibida
  // antes de formatar -- é isso que faz trocar de moeda refletir o valor certo
  // em vez de só reformatar o mesmo número.
  function formatar(n) {
    if (n == null) return '';
    const convertido = n / BRL_POR_UNIDADE[st.currency];
    return new Intl.NumberFormat('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: MOEDAS[st.currency].dec }).format(convertido);
  }

  // "1.250.000" | "49,90" | "49.90" -> número NA MOEDA EXIBIDA, depois convertido
  // pra BRL (a unidade que fica guardada em `st.values`).
  function ler(txt) {
    let s = String(txt).replace(/[^\d.,]/g, '');
    if (!s) return null;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if (MOEDAS[st.currency].dec > 0 && /^\d+\.\d{1,2}$/.test(s)) { /* decimal com ponto */ }
    else s = s.replace(/\./g, '');
    const n = parseFloat(s);
    if (!isFinite(n) || n < 0) return null;
    const emBrl = n * BRL_POR_UNIDADE[st.currency];
    // 2 casas decimais de BRL bastam de sobra pra qualquer moeda suportada.
    return Math.round(emBrl * 100) / 100;
  }

  function pintar() {
    selMoeda.value = st.currency;
    selCobranca.value = st.basis;
    root.querySelectorAll('[data-cur]').forEach(el => { el.textContent = MOEDAS[st.currency].sym; });
    root.querySelectorAll('[data-basis-es]').forEach(el => { el.textContent = COBRANCA[st.basis][0]; });
    root.querySelectorAll('[data-basis-pt]').forEach(el => { el.textContent = COBRANCA[st.basis][1]; });
    inputs.forEach((inp, i) => { if (document.activeElement !== inp) inp.value = formatar(st.values[i]); });
  }

  inputs.forEach((inp, i) => {
    inp.addEventListener('input', () => {
      inp.value = inp.value.replace(/[^\d.,]/g, '');
      st.values[i] = ler(inp.value);
      salvar();
    });
    inp.addEventListener('blur', () => { inp.value = formatar(st.values[i]); });
    inp.addEventListener('focus', () => inp.select());
  });

  selMoeda.addEventListener('change', () => {
    // st.values fica sempre em BRL -- trocar a moeda só muda a conversão exibida,
    // nunca o valor guardado (ver formatar/ler).
    st.currency = selMoeda.value;
    salvar(); pintar();
  });
  selCobranca.addEventListener('change', () => { st.basis = selCobranca.value; salvar(); pintar(); });

  document.getElementById('pr-clear').addEventListener('click', () => {
    if (!st.values.some(v => v != null)) return;
    if (!confirm('¿Limpiar todos los valores? · Limpar todos os valores?')) return;
    st.values = inputs.map(() => null);
    salvar(); pintar();
  });

  // Digitar/escolher na tabela nunca navega os slides (setas, espaço, M, F, O...).
  document.addEventListener('keydown', e => {
    const t = e.target;
    if (!(t instanceof Element) || !root.contains(t) || !t.matches('input,select')) return;
    if (e.key === 'Enter' && t.matches('input')) { e.preventDefault(); t.blur(); }
    if (e.key !== 'Escape') e.stopPropagation();
  }, true);

  window.LitePricing = {
    faixas: FAIXAS,
    estado: () => ({ currency: st.currency, basis: st.basis, values: st.values.slice() }),
    simbolo: () => MOEDAS[st.currency].sym,
    cobranca: () => COBRANCA[st.basis],
    formatar: n => formatar(n),
    faixaDe: qtd => FAIXAS.findIndex(f => qtd >= f.min && qtd <= f.max)
  };

  pintar();
  avisar();
})();
