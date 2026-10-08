/* PDF requests begin only after an explicit preview action. No autoplay. */
(() => {
  'use strict';
  for (const button of document.querySelectorAll('[data-score-src]')) {
    button.addEventListener('click', () => {
      const frame = document.getElementById(button.getAttribute('aria-controls'));
      const open = button.getAttribute('aria-expanded') !== 'true';
      if (open && !frame.querySelector('iframe')) {
        const viewer = document.createElement('iframe');
        viewer.title = button.dataset.scoreTitle;
        viewer.src = `${button.dataset.scoreSrc}#toolbar=0&navpanes=0&view=FitH`;
        frame.append(viewer);
      }
      frame.hidden = !open;
      button.setAttribute('aria-expanded', String(open));
    });
  }
})();

/* Native disclosure semantics, with stable category URLs and history support. */
(() => {
  const categories = [...document.querySelectorAll('.works-category')];
  if (!categories.length) return;
  const target = () => {
    const id = location.hash.slice(1);
    return categories.find(item => item.id === (id === 'transcription' ? 'transcriptions' : id));
  };
  const sync = item => item.querySelector('summary').setAttribute('aria-expanded', String(item.open));
  function restore() {
    const active = target();
    for (const item of categories) { item.open = item === active; sync(item); }
    if (active) requestAnimationFrame(() => active.scrollIntoView({block:'start',behavior:'instant'}));
  }
  for (const item of categories) {
    item.addEventListener('toggle', () => sync(item));
    item.querySelector('summary').addEventListener('click', event => {
      event.preventDefault();
      item.open = !item.open; sync(item);
      const hash = item.open ? '#' + item.id : target() === item ? '' : location.hash;
      if (hash !== location.hash) history.pushState(null, '', location.pathname + location.search + hash);
    });
  }
  window.addEventListener('hashchange', restore);
  window.addEventListener('popstate', restore);
  window.addEventListener('pageshow', restore);
  restore();
})();
