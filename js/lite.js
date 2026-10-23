/* Standalone presentation engine: no network or shared-deck dependency. */
(() => {
  'use strict';
  const slides = [...document.querySelectorAll('.slide')];
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');
  const dialog = document.getElementById('map-dialog');
  const dots = document.getElementById('slide-dots');
  const map = document.getElementById('map-grid');
  let current = 0;
  function fit() {
    const availableHeight = window.innerHeight - 60;
    document.documentElement.style.setProperty('--scale', Math.min(window.innerWidth / 1600, availableHeight / 900));
  }
  function show(index, updateHash = true) {
    current = Math.max(0, Math.min(slides.length - 1, index));
    slides.forEach((slide, i) => {
      const active = i === current;
      slide.classList.toggle('active', active);
      slide.setAttribute('aria-hidden', String(!active));
      slide.inert = !active;
      dots.children[i].setAttribute('aria-current', String(active));
      map.children[i].setAttribute('aria-current', String(active));
    });
    prev.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    document.getElementById('counter').textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    if (updateHash) history.replaceState(null, '', `#slide-${current + 1}`);
  }
  slides.forEach((slide, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `${i + 1}. ${slide.dataset.title} / ${slide.dataset.titlePt}`);
    dot.addEventListener('click', () => show(i));
    dots.append(dot);
    const entry = document.createElement('button');
    entry.type = 'button';
    const num = document.createElement('b');
    num.textContent = String(i + 1).padStart(2, '0');
    const es = document.createElement('span');
    es.lang = 'es-PY';
    es.textContent = slide.dataset.title;
    const pt = document.createElement('span');
    pt.lang = 'pt-BR';
    pt.className = 'pt';
    pt.textContent = slide.dataset.titlePt;
    entry.append(num, es, pt);
    entry.addEventListener('click', () => { show(i); dialog.close(); });
    map.append(entry);
  });
  const mapButton = document.getElementById('map-button');
  const fullscreenButton = document.getElementById('fullscreen');
  function toggleMap() { if (dialog.open) dialog.close(); else dialog.showModal(); }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch (_) {
      fullscreenButton.title = 'Use F11 en su navegador / Use F11 no navegador';
    }
  }
  prev.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  mapButton.addEventListener('click', toggleMap);
  document.getElementById('map-close').addEventListener('click', () => dialog.close());
  fullscreenButton.addEventListener('click', toggleFullscreen);
  document.addEventListener('keydown', event => {
    if (event.target.matches('input,select,textarea') || event.target.isContentEditable || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target.closest('button') && event.key === ' ') return;
    if (dialog.open) return;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); show(current + 1); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key)) { event.preventDefault(); show(current - 1); }
    else if (event.key === 'Home') { event.preventDefault(); show(0); }
    else if (event.key === 'End') { event.preventDefault(); show(slides.length - 1); }
    else if (event.key.toLowerCase() === 'm') toggleMap();
    else if (event.key.toLowerCase() === 'f') toggleFullscreen();
  });
  let touchStart = null;
  document.getElementById('viewport').addEventListener('touchstart', event => {
    if (event.target.closest('input,select,button')) return;
    touchStart = event.touches[0].clientX;
  }, { passive: true });
  document.getElementById('viewport').addEventListener('touchend', event => {
    if (touchStart === null) return;
    const distance = event.changedTouches[0].clientX - touchStart;
    if (Math.abs(distance) > 55) show(current + (distance < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });
  function indexFromHash() {
    const match = location.hash.match(/^#slide-(\d+)$/);
    return match ? Number(match[1]) - 1 : 0;
  }
  window.addEventListener('resize', fit);
  window.addEventListener('hashchange', () => show(indexFromHash(), false));
  document.addEventListener('fullscreenchange', fit);

  show(indexFromHash(), false);
  fit();
})();
