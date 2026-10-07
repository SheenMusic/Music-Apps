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
