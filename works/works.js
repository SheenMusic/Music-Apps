/* PDF requests begin only after an explicit preview action. No autoplay.
   Score views here (「在线预览乐谱」 and 「新窗口查看」) are counted in the teacher's Google
   Sheet, sheet 「免费乐谱」, as 「查看」. Same rules as the download / view buttons in
   /scores/consent.js (recordFree): once per score per browser every 24 hours, no personal
   data, never on the teacher's device. Downloads on works pages go through consent.js. */
(() => {
  'use strict';
  const RECORD_URL = 'https://script.google.com/macros/s/AKfycbynv1g7WXCzMMku8leJOx6k_xFoEbOtAXJh_oHU2pW2Vgt4kJv0W20fmUTfMg12q4vw/exec';
  const DAY = 24 * 60 * 60 * 1000;
  // The work's slug, e.g. /works/shinunoga-ii-wa/ → shinunoga-ii-wa (the same ID consent.js uses).
  const slug = location.pathname.split('/').filter(Boolean)[1] || '';

  function recordView(title){
    if (!slug) return;
    try {
      if (localStorage.getItem('sheen.teacherDevice')) return;
      const key = `sheen.free.${slug}.view`, last = Number(localStorage.getItem(key));
      if (last && Date.now() - last < DAY) return;
      localStorage.setItem(key, String(Date.now()));
    } catch { /* Without storage every view is counted. */ }
    const row = {kind:'free', score:title, scoreId:slug, action:'view', page:location.pathname,
      language:document.documentElement.dataset.siteLanguage || 'zh'};
    try { fetch(RECORD_URL, {method:'POST', mode:'no-cors', keepalive:true, body:JSON.stringify(row)}).catch(() => {}); }
    catch { /* Recording must never block the preview. */ }
  }

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
      if (open) recordView(button.dataset.scoreTitle);
      frame.hidden = !open;
      button.setAttribute('aria-expanded', String(open));
    });
  }
  // 「新窗口查看」: the PDF opens in a new tab.
  const previewTitle = document.querySelector('[data-score-src]')?.dataset.scoreTitle || slug;
  for (const link of document.querySelectorAll('a.score-window-link')) {
    link.addEventListener('click', () => recordView(previewTitle));
  }
})();
