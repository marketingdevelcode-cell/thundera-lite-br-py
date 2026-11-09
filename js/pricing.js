/* Thundera IA Lite — tabela de valores por faixa de colaboradores.
   Preenchida à mão pelo responsável; fica salva neste navegador (localStorage). */
(() => {
  'use strict';
  const root = document.getElementById('slide-6');
  if (!root) return;

  const KEY = 'thundera_lite_precios';
  const MOEDAS = { PYG: { sym: 'Gs.', dec: 0 }, USD: { sym: 'US$', dec: 2 }, BRL: { sym: 'R$', dec: 2 } };
  const COBRANCA = {
    user: ['por colaborador / mes', 'por colaborador / mês'],
    total: ['total mensual del rango', 'total mensal da faixa']
  };

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
    { min: 0, max: 100, label: '0 – 100' },
    { min: 101, max: 500, label: '101 – 500' },
    { min: 501, max: 1000, label: '501 – 1.000' },
    { min: 1001, max: 2000, label: '1.001 – 2.000' },
    { min: 2001, max: 5000, label: '2.001 – 5.000' }
  ];

  function avisar() { document.dispatchEvent(new CustomEvent('lite:pricing')); }

  function salvar() {
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* ok */ }
    avisar();
  }

  function formatar(n) {
    if (n == null) return '';
    return new Intl.NumberFormat('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: MOEDAS[st.currency].dec }).format(n);
  }

  // "1.250.000" | "49,90" | "49.90" -> número
  function ler(txt) {
    let s = String(txt).replace(/[^\d.,]/g, '');
    if (!s) return null;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if (MOEDAS[st.currency].dec > 0 && /^\d+\.\d{1,2}$/.test(s)) { /* decimal com ponto */ }
    else s = s.replace(/\./g, '');
    const n = parseFloat(s);
    if (!isFinite(n) || n < 0) return null;
    const f = Math.pow(10, MOEDAS[st.currency].dec);
    return Math.round(n * f) / f;
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
    st.currency = selMoeda.value;
    // moedas sem centavos arredondam os valores já digitados
    st.values = st.values.map(v => (v == null ? null : Math.round(v * Math.pow(10, MOEDAS[st.currency].dec)) / Math.pow(10, MOEDAS[st.currency].dec)));
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
