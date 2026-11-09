/* Thundera IA Lite — captação de leads.
   Um único formulário. Os leads ficam só em cache local (localStorage) e saem por
   planilha (.xlsx / .csv) pronta para importar no CRM. NÃO há envio a nenhum servidor/agente. */
(() => {
  'use strict';

  // ---------- Configuração do CRM (colunas da planilha exportada) ----------
  const CRM_FUNIL = '[ThunderaLite] - Qualificação';
  const CRM_ORIGEM = 'Feiras e Eventos';

  const LEADS_KEY = 'thundera_lite_leads';
  const EXPORT_KEY = 'thundera_lite_leads_export';
  const PAIS_KEY = 'thundera_lite_pais';

  // ---------- Países / telefones / divisões ----------
  const DEPARTAMENTOS_PY = ['Asunción (Capital)', 'Alto Paraguay', 'Alto Paraná', 'Amambay', 'Boquerón', 'Caaguazú',
    'Caazapá', 'Canindeyú', 'Central', 'Concepción', 'Cordillera', 'Guairá', 'Itapúa', 'Misiones', 'Ñeembucú',
    'Paraguarí', 'Presidente Hayes', 'San Pedro'];
  const UF_BR = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE',
    'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

  // min/max = dígitos do número nacional (sem o código do país e sem zero inicial)
  const PAISES = [
    { code: 'PY', nome: 'Paraguay', pt: 'Paraguai', dial: '595', min: 8, max: 9, ph: '981 123 456', divisoes: DEPARTAMENTOS_PY,
      estadoEs: 'Departamento', estadoPt: 'Departamento' },
    { code: 'BR', nome: 'Brasil', pt: 'Brasil', dial: '55', min: 10, max: 11, ph: '(11) 91234-5678', divisoes: UF_BR,
      estadoEs: 'Estado (UF)', estadoPt: 'Estado (UF)' },
    { code: 'AR', nome: 'Argentina', pt: 'Argentina', dial: '54', min: 10, max: 11, ph: '11 2345 6789' },
    { code: 'UY', nome: 'Uruguay', pt: 'Uruguai', dial: '598', min: 8, max: 9, ph: '94 123 456' },
    { code: 'BO', nome: 'Bolivia', pt: 'Bolívia', dial: '591', min: 8, max: 8, ph: '7123 4567' },
    { code: 'CL', nome: 'Chile', pt: 'Chile', dial: '56', min: 9, max: 9, ph: '9 1234 5678' },
    { code: 'XX', nome: 'Otro país', pt: 'Outro país', dial: '', min: 7, max: 15, ph: '+1 555 123 4567' }
  ];
  const porCodigo = c => PAISES.find(p => p.code === c) || PAISES[0];

  // ---------- DOM ----------
  const $ = id => document.getElementById(id);
  const overlay = $('lead-overlay');
  if (!overlay) return;
  const form = $('lead-form');
  const selPais = $('lead-pais');
  const inPaisOutro = $('lead-pais-outro');
  const inTel = $('lead-telefone');
  const dialEl = $('lead-dial');
  const selEstado = $('lead-estado');
  const inEstadoTxt = $('lead-estado-txt');
  const countEl = $('lead-count');
  const toastEl = $('lead-toast');

  $('lead-funil-label').textContent = CRM_FUNIL;

  // ---------- Armazenamento (cache local) ----------
  let memoria = [];  // plano B se o navegador bloquear o localStorage: não perde a sessão
  let storageOk = true;

  function testarStorage() {
    try {
      const k = '__teste_thundera_lite__';
      localStorage.setItem(k, '1');
      const ok = localStorage.getItem(k) === '1';
      localStorage.removeItem(k);
      return ok;
    } catch (e) { return false; }
  }

  function loadLeads() {
    if (!storageOk) return memoria;
    try {
      const raw = localStorage.getItem(LEADS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function persistLeads(leads) {
    memoria = leads;
    if (!storageOk) return false;
    try { localStorage.setItem(LEADS_KEY, JSON.stringify(leads)); return true; }
    catch (e) { return false; }
  }

  function loadExportInfo() {
    try { return JSON.parse(localStorage.getItem(EXPORT_KEY)) || null; } catch (e) { return null; }
  }

  // ---------- Toast bilíngue ----------
  function toast(es, pt, kind) {
    $('lead-toast-es').textContent = es;
    $('lead-toast-pt').textContent = pt || '';
    toastEl.classList.toggle('warn', kind === 'warn');
    toastEl.querySelector('i').className = kind === 'warn' ? 'ph ph-warning-circle' : 'ph ph-check-circle';
    toastEl.classList.add('visible');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove('visible'), 3600);
  }

  // ---------- Contador ----------
  function refreshCount() {
    const leads = loadLeads();
    const exp = loadExportInfo();
    const pendentes = leads.length - (exp ? Math.min(exp.count, leads.length) : 0);

    countEl.textContent = leads.length;
    countEl.classList.toggle('visible', leads.length > 0);
    countEl.classList.toggle('unsaved', pendentes > 0);
    countEl.title = pendentes > 0
      ? pendentes + ' lead(s) sin exportar · ainda não exportado(s)'
      : 'Todo exportado · Tudo exportado';
    $('tab-list-count').textContent = leads.length;

    const st = $('lead-export-status');
    if (!leads.length) st.textContent = '';
    else if (!exp) st.innerHTML = 'Aún sin exportar · Ainda sem exportar.<br>' + leads.length + ' lead(s) solo en este navegador.';
    else if (pendentes > 0) st.innerHTML = 'Última exportación · Última exportação: ' + exp.at + '<br>' + pendentes + ' lead(s) nuevo(s) desde entonces.';
    else st.innerHTML = 'Última exportación · Última exportação: ' + exp.at + '<br>Todo exportado · Tudo exportado.';
  }

  // ---------- Abrir / fechar ----------
  let ultimoFoco = null;

  function openLeads(painel) {
    ultimoFoco = document.activeElement;
    overlay.classList.add('active');
    switchPanel(painel || 'panel-form');
    if (!painel || painel === 'panel-form') setTimeout(() => $('lead-nome').focus(), 60);
  }

  function closeLeads() {
    overlay.classList.remove('active');
    if (ultimoFoco && ultimoFoco.focus) { try { ultimoFoco.focus(); } catch (e) { /* ok */ } }
    if (document.activeElement && document.activeElement !== document.body) {
      // devolve o teclado à apresentação (setas voltam a navegar)
      if (document.activeElement.matches('input,select,textarea')) document.activeElement.blur();
    }
  }

  function switchPanel(id) {
    document.querySelectorAll('.lead-panel').forEach(p => p.classList.toggle('active', p.id === id));
    document.querySelectorAll('.lead-tab').forEach(t => t.classList.toggle('active', t.dataset.panel === id));
    if (id === 'panel-list') renderList();
  }

  $('btn-leads').addEventListener('click', () => openLeads());
  $('btn-close-leads').addEventListener('click', closeLeads);
  document.querySelectorAll('.lead-tab').forEach(t => t.addEventListener('click', () => switchPanel(t.dataset.panel)));
  document.querySelectorAll('[data-open-leads]').forEach(el => {
    el.addEventListener('click', () => openLeads());
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); openLeads(); } });
  });

  // Teclado: com o formulário aberto a apresentação NÃO pode navegar (setas, espaço, M, F...).
  // Fase de captura: roda antes do presentation.js e corta a propagação.
  document.addEventListener('keydown', e => {
    const aberto = overlay.classList.contains('active');
    const t = e.target;
    const digitando = !!(t && t.matches && (t.matches('input,textarea,select') || t.isContentEditable));

    if (aberto) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeLeads(); return; }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && t instanceof Node && form.contains(t)) {
        e.preventDefault(); e.stopPropagation(); form.requestSubmit(); return;
      }
      e.stopPropagation();  // o resto do teclado pertence ao formulário
      return;
    }
    if (digitando || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.toLowerCase() === 'l') { e.preventDefault(); e.stopPropagation(); openLeads(); }
  }, true);

  // ---------- País → prefixo, máscara, estado ----------
  PAISES.forEach(p => {
    const o = document.createElement('option');
    o.value = p.code;
    o.textContent = p.code === 'XX' ? 'Otro país · Outro país' : (p.nome + (p.pt !== p.nome ? ' · ' + p.pt : ''));
    selPais.appendChild(o);
  });

  function paisAtual() { return porCodigo(selPais.value); }

  function paisSalvo() {
    try { return localStorage.getItem(PAIS_KEY) || 'PY'; } catch (e) { return 'PY'; }
  }

  function aplicarPais(manterTelefone) {
    const p = paisAtual();
    try { localStorage.setItem(PAIS_KEY, p.code); } catch (e) { /* só não lembra */ }

    dialEl.textContent = p.dial ? '+' + p.dial : '+';
    inTel.placeholder = p.ph;
    inPaisOutro.style.display = p.code === 'XX' ? '' : 'none';
    if (p.code !== 'XX') inPaisOutro.value = '';

    // Estado/Departamento: lista para PY e BR, texto livre nos demais países
    if (p.divisoes) {
      selEstado.innerHTML = '<option value="">—</option>' + p.divisoes.map(d => '<option>' + d + '</option>').join('');
      selEstado.style.display = '';
      inEstadoTxt.style.display = 'none';
      inEstadoTxt.value = '';
      $('lead-estado-es').textContent = p.estadoEs;
      $('lead-estado-pt').textContent = p.estadoPt;
    } else {
      selEstado.style.display = 'none';
      selEstado.innerHTML = '';
      inEstadoTxt.style.display = '';
      $('lead-estado-es').textContent = 'Estado / Provincia';
      $('lead-estado-pt').textContent = 'Estado / Província';
    }

    if (manterTelefone) formatarTelefone(); else inTel.value = '';
  }

  selPais.addEventListener('change', () => aplicarPais(true));

  // Máscara por país. Aceita colar "+595 981 123 456" / "0981123456" e troca o país sozinha.
  function agrupar(d, p) {
    if (p.code === 'BR') {
      if (d.length <= 2) return d.length ? '(' + d : '';
      const corte = d.length > 10 ? 7 : 6;
      return '(' + d.slice(0, 2) + ') ' + d.slice(2, corte) + (d.length > corte ? '-' + d.slice(corte) : '');
    }
    if (p.code === 'XX') return d;
    return d.replace(/(\d{3})(?=\d)/g, '$1 ').trim();  // 981 123 456
  }

  function detectarPaisPorDial(digitos) {
    return PAISES.filter(p => p.dial).sort((a, b) => b.dial.length - a.dial.length)
      .find(p => digitos.startsWith(p.dial));
  }

  function formatarTelefone() {
    let raw = inTel.value;
    const internacional = raw.trim().startsWith('+');
    let d = raw.replace(/\D/g, '');

    if (internacional) {
      const achado = detectarPaisPorDial(d);
      if (achado) {
        if (selPais.value !== achado.code) { selPais.value = achado.code; aplicarPais(false); }
        d = d.slice(achado.dial.length);
      } else if (paisAtual().code !== 'XX' && d.length < 3) {
        inTel.value = raw.trim().slice(0, 4);  // ainda digitando o código: não mexe
        return;
      }
    }

    const p = paisAtual();
    if (p.code === 'XX') {
      // país livre: o próprio número internacional completo, sem máscara
      inTel.value = d ? '+' + d.slice(0, p.max) : (internacional ? '+' : '');
      return;
    }

    // "595981123456" colado sem "+": tira o código do país se sobrar dígito
    if (!internacional && p.dial && d.startsWith(p.dial) && d.length > p.max) d = d.slice(p.dial.length);
    d = d.replace(/^0+/, '').slice(0, p.max);  // zero de tronco (0981...) não faz parte do número
    inTel.value = agrupar(d, p);
  }

  inTel.addEventListener('input', formatarTelefone);

  function digitosNacionais() {
    const p = paisAtual();
    const d = inTel.value.replace(/\D/g, '');
    return p.code === 'XX' ? d : d.replace(/^0+/, '');
  }

  function telefoneValido() {
    const p = paisAtual();
    const n = digitosNacionais().length;
    return n >= p.min && n <= p.max;
  }

  function telefoneFinal() {
    const p = paisAtual();
    return p.code === 'XX' ? '+' + digitosNacionais() : '+' + p.dial + ' ' + inTel.value.trim();
  }

  function emailValido(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

  // ---------- Validação + salvar ----------
  const val = id => ($(id).value || '').trim();

  function marcar(id, ok) {
    $(id).closest('[data-field]').classList.toggle('invalid', !ok);
  }

  form.querySelectorAll('[data-field] input, [data-field] select').forEach(el => {
    const limpar = () => el.closest('[data-field]').classList.remove('invalid');
    el.addEventListener('input', limpar);
    el.addEventListener('change', limpar);
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const p = paisAtual();

    const okNome = !!val('lead-nome');
    const okEmpresa = !!val('lead-empresa');
    const okPais = p.code !== 'XX' || !!val('lead-pais-outro');
    const okTel = telefoneValido();
    const email = val('lead-email');
    const okEmail = !email || emailValido(email);

    marcar('lead-nome', okNome);
    marcar('lead-empresa', okEmpresa);
    marcar('lead-pais', okPais);
    marcar('lead-telefone', okTel);
    marcar('lead-email', okEmail);

    if (!(okNome && okEmpresa && okPais && okTel && okEmail)) {
      if (!okNome || !okEmpresa || !okPais) toast('Complete nombre, empresa y país.', 'Preencha nome, empresa e país.', 'warn');
      else if (!okTel) toast('Revise el teléfono (' + (p.min === p.max ? p.min : p.min + '–' + p.max) + ' dígitos).', 'Confira o telefone.', 'warn');
      else toast('Revise el e-mail.', 'Confira o e-mail.', 'warn');
      const primeiro = [['lead-nome', okNome], ['lead-empresa', okEmpresa], ['lead-pais-outro', okPais],
        ['lead-telefone', okTel], ['lead-email', okEmail]].find(x => !x[1]);
      if (primeiro) $(primeiro[0]).focus();
      return;
    }

    const telefone = telefoneFinal();
    const leads = loadLeads();
    const soDig = s => String(s || '').replace(/\D/g, '');
    const duplicado = leads.find(l => soDig(l.telefone) === soDig(telefone) || (email && l.email && l.email.toLowerCase() === email.toLowerCase()));
    if (duplicado && !confirm('Ya existe un lead con este teléfono o e-mail (' + duplicado.nome + ').\nJá existe um lead com este telefone ou e-mail (' + duplicado.nome + ').\n\n¿Guardar de todos modos? · Salvar mesmo assim?')) return;

    const agora = new Date();
    const lead = {
      id: 'lead_' + agora.getTime() + '_' + Math.random().toString(36).slice(2, 6),
      capturadoEm: formatarData(agora),
      capturadoEmISO: agora.toISOString(),
      nome: val('lead-nome'),
      email: email,
      empresa: val('lead-empresa'),
      telefone: telefone,
      pais: p.code === 'XX' ? val('lead-pais-outro') : p.nome,
      estado: p.divisoes ? selEstado.value : val('lead-estado-txt'),
      cidade: val('lead-cidade'),
      funil: CRM_FUNIL
    };

    leads.push(lead);
    const salvouNoDisco = persistLeads(leads);
    refreshCount();

    if (!salvouNoDisco) toast('Guardado solo en memoria: exporte la planilla ahora.', 'Salvo só em memória: exporte a planilha agora.', 'warn');
    else toast('Lead de ' + lead.nome.split(/\s+/)[0] + ' guardado. Total: ' + leads.length + '.', 'Lead salvo.');

    // Pronto para o próximo: limpa tudo e mantém o país.
    const paisMantido = selPais.value;
    form.reset();
    selPais.value = paisMantido;
    aplicarPais(false);
    form.querySelectorAll('[data-field]').forEach(f => f.classList.remove('invalid'));
    $('lead-nome').focus();
  });

  function formatarData(d) {
    const z = n => String(n).padStart(2, '0');
    return z(d.getDate()) + '/' + z(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + z(d.getHours()) + ':' + z(d.getMinutes());
  }

  function selo() {
    const d = new Date(), z = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + '_' + z(d.getHours()) + z(d.getMinutes());
  }

  // ---------- Lista ----------
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  function renderList() {
    const wrap = $('lead-table-wrap');
    const leads = loadLeads();
    if (!leads.length) {
      wrap.innerHTML = '<div class="lead-empty"><i class="ph ph-user-plus"></i>Ningún lead capturado todavía.<small>Nenhum lead capturado ainda.</small></div>';
      return;
    }
    const rows = leads.map((l, i) => {
      const local = [l.cidade, l.estado, l.pais].filter(Boolean).join(' · ');
      return '<tr>' +
        '<td class="td-num">' + String(i + 1).padStart(2, '0') + '</td>' +
        '<td><span class="td-name">' + esc(l.nome) + '</span>' + (l.email ? '<span class="td-sub">' + esc(l.email) + '</span>' : '') + '</td>' +
        '<td>' + esc(l.empresa) + '</td>' +
        '<td>' + esc(l.telefone) + '</td>' +
        '<td>' + esc(local) + '</td>' +
        '<td class="td-num">' + esc(l.capturadoEm) + '</td>' +
        '<td><button class="lead-row-del" type="button" data-id="' + esc(l.id) + '" title="Quitar · Remover"><i class="ph ph-trash"></i></button></td>' +
        '</tr>';
    }).join('');
    wrap.innerHTML = '<table class="lead-table"><thead><tr><th>#</th><th>Contacto · Contato</th><th>Empresa</th>' +
      '<th>Teléfono · Telefone</th><th>Ubicación · Localização</th><th>Fecha · Data</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>';

    wrap.querySelectorAll('.lead-row-del').forEach(b => b.addEventListener('click', () => {
      const lead = loadLeads().find(l => l.id === b.dataset.id);
      if (!lead) return;
      if (!confirm('¿Quitar el lead de ' + lead.nome + '? · Remover o lead de ' + lead.nome + '?')) return;
      persistLeads(loadLeads().filter(l => l.id !== b.dataset.id));
      renderList();
      refreshCount();
      toast('Lead quitado.', 'Lead removido.');
    }));
  }

  // ---------- Exportação (colunas pensadas para a importação no CRM) ----------
  const COLUNAS = [
    ['funil', 'Funil'],
    ['origem', 'Origem'],
    ['nome', 'Nome'],
    ['empresa', 'Empresa'],
    ['email', 'E-mail'],
    ['telefone', 'Telefone'],
    ['pais', 'País'],
    ['estado', 'Estado / Departamento'],
    ['cidade', 'Cidade'],
    ['capturadoEm', 'Data/Hora']
  ];

  const linha = l => Object.assign({}, l, { funil: l.funil || CRM_FUNIL, origem: CRM_ORIGEM });

  function marcarExportado(n) {
    try { localStorage.setItem(EXPORT_KEY, JSON.stringify({ at: formatarData(new Date()), count: n })); } catch (e) { /* ok */ }
    refreshCount();
  }

  $('btn-export-xlsx').addEventListener('click', () => {
    const leads = loadLeads();
    if (!leads.length) { toast('No hay leads para exportar.', 'Nenhum lead para exportar.', 'warn'); return; }
    if (typeof XLSX === 'undefined') { toast('No cargó la biblioteca de Excel. Use CSV.', 'A biblioteca de Excel não carregou. Use o CSV.', 'warn'); return; }

    const dados = leads.map(l => {
      const d = linha(l), r = {};
      COLUNAS.forEach(([k, h]) => { r[h] = d[k] ?? ''; });
      return r;
    });
    const ws = XLSX.utils.json_to_sheet(dados, { header: COLUNAS.map(c => c[1]) });
    ws['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 26 }, { wch: 28 }, { wch: 30 }, { wch: 20 }, { wch: 14 }, { wch: 22 }, { wch: 20 }, { wch: 17 }];
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: COLUNAS.length - 1, r: dados.length } }) };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, 'leads-thundera-lite_' + selo() + '.xlsx');
    marcarExportado(leads.length);
    toast(leads.length + ' lead(s) exportado(s) a Excel.', 'Exportado para Excel.');
  });

  $('btn-export-csv').addEventListener('click', () => {
    const leads = loadLeads();
    if (!leads.length) { toast('No hay leads para exportar.', 'Nenhum lead para exportar.', 'warn'); return; }
    const cel = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const linhas = [COLUNAS.map(c => cel(c[1])).join(';')];
    leads.forEach(l => { const d = linha(l); linhas.push(COLUNAS.map(c => cel(d[c[0]])).join(';')); });
    const blob = new Blob(['﻿' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads-thundera-lite_' + selo() + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    marcarExportado(leads.length);
    toast(leads.length + ' lead(s) exportado(s) en CSV.', 'Exportado em CSV.');
  });

  $('btn-clear-leads').addEventListener('click', () => {
    const leads = loadLeads();
    if (!leads.length) { toast('No hay leads para borrar.', 'Não há leads para apagar.', 'warn'); return; }
    const exp = loadExportInfo();
    const pend = leads.length - (exp ? Math.min(exp.count, leads.length) : 0);
    const aviso = pend > 0 ? '\n\nATENCIÓN / ATENÇÃO: ' + pend + ' lead(s) NO exportado(s) / NÃO exportado(s).' : '';
    if (!confirm('¿Borrar los ' + leads.length + ' lead(s) de este equipo? · Apagar os ' + leads.length + ' lead(s) deste computador?' + aviso + '\n\nNo se puede deshacer. · Não dá para desfazer.')) return;
    if (pend > 0 && !confirm('¿Seguro? Se perderán ' + pend + ' lead(s) sin exportar. · Tem certeza? ' + pend + ' lead(s) sem exportar serão perdidos.')) return;
    persistLeads([]);
    try { localStorage.removeItem(LEADS_KEY); localStorage.removeItem(EXPORT_KEY); } catch (e) { /* ok */ }
    renderList();
    refreshCount();
    toast('Lista borrada.', 'Lista apagada.');
  });

  // Avisa antes de fechar a aba com leads ainda não exportados
  window.addEventListener('beforeunload', e => {
    const leads = loadLeads();
    const exp = loadExportInfo();
    if (leads.length - (exp ? Math.min(exp.count, leads.length) : 0) > 0) { e.preventDefault(); e.returnValue = ''; return ''; }
  });

  // ---------- Partida ----------
  storageOk = testarStorage();
  selPais.value = paisSalvo();
  if (!selPais.value) selPais.value = 'PY';
  aplicarPais(false);
  refreshCount();

  if (!storageOk) {
    const av = $('lead-aviso');
    av.innerHTML = '<b>Atención · Atenção:</b> este navegador no está guardando datos aquí. Los leads solo quedan en memoria hasta cerrar la pestaña; exporte la planilla. ' +
      '<br>Este navegador não está salvando dados aqui. Abra por <code>http://localhost</code> e exporte a planilha.';
    av.classList.add('visible');
    $('btn-leads').style.boxShadow = '0 0 0 2px #FFCA28';
    setTimeout(() => toast('Este navegador no guarda datos: exporte la planilla.', 'Este navegador não salva dados: exporte a planilha.', 'warn'), 1200);
  }
})();
