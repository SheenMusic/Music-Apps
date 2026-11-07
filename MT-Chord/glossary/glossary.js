/* 课程术语表：按课分组列出术语，可搜索。数据见 terms.js。 */
(() => {
  'use strict';
  const cs = ChordStage.chordSymbol;
  const list = document.getElementById('glossaryList');
  const empty = document.getElementById('glossaryEmpty');
  const escape = text => text.replace(/[&<>"]/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[ch]));
  function render(query = '') {
    const q = query.trim().toLowerCase();
    let shown = 0;
    list.innerHTML = window.CHORD_GLOSSARY.map(lesson => {
      const terms = lesson.terms.filter(t => !q || [t.term, t.en, t.definition].join(' ').toLowerCase().includes(q));
      shown += terms.length;
      if (!terms.length) return '';
      return `<section class="glossary-lesson" aria-label="第 ${lesson.lesson} 课 ${escape(lesson.title)}">` +
        `<h2><span class="glossary-lesson-number">第 ${lesson.lesson} 课</span>${escape(lesson.title)}</h2><dl>` +
        terms.map(t => `<div class="glossary-term"><dt><strong>${escape(t.term)}</strong>${t.en ? `<span class="glossary-en">${escape(t.en)}</span>` : ''}</dt>` +
          `<dd>${escape(t.definition)}${t.example ? `<span class="glossary-example">${t.example.map(([r, s, b]) => cs(r, s, b)).join('')}</span>` : ''}</dd></div>`).join('') +
        '</dl></section>';
    }).join('');
    empty.hidden = shown > 0;
  }
  document.getElementById('glossarySearch').addEventListener('input', event => render(event.target.value));
  render();
})();
