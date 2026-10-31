/* 音程课程 · 演示区键盘（一个八度，默认 C4–C5）
   IntervalKeyboard.html：C4–C5 的琴键，带 data-mark；场景的 panel.marks 列出要标出的琴键（ChordStage 只改样式，不重画）。
   IntervalKeyboard.scene(marks, {from, names, shown, tap})：
     from：最左边的白键（如 'D4'），键盘画到高八度的同名音；
     names：{琴键: 名称}，名称显示在琴键上方（白键一行、黑键高一行）；shown 列出此刻显示的名称（由 CSS 渐入）；
     tap：琴键可以点，点击时交给课程的 onControl('key:最左边的白键:琴键')，如 'key:D4:A4'。
   样式见 shared/styles/interval-keyboard.css。 */
(() => {
  'use strict';
  const LETTERS = 'CDEFGAB', HAS_BLACK = 'CDFGA';
  // 从 from 开始的 8 个白键
  function whites(from) {
    let letter = LETTERS.indexOf(from[0]), octave = Number(from.slice(1));
    return Array.from({length: 8}, () => {
      const key = LETTERS[letter] + octave;
      if (++letter === 7) { letter = 0; octave++; }
      return key;
    });
  }
  function build(from = 'C4', names = {}, tap = false) {
    const white = whites(from), percent = n => `left:${n / white.length * 100}%`;
    const control = key => tap ? ` data-control="key:${from}:${key}"` : '';
    const black = white.slice(0, -1).map((k, i) => HAS_BLACK.includes(k[0]) ? [k[0] + '#' + k.slice(1), i + 1] : null).filter(Boolean);
    const name = (key, at, row) => names[key] ? `<span class="kb-name kb-name-${row}" data-mark="name:${key}" style="${percent(at)}">${names[key]}</span>` : '';
    return '<div class="interval-keyboard">' +
      white.map(k => `<span class="kb-white" data-mark="${k}"${control(k)}><span class="kb-label">${k[0]}</span></span>`).join('') +
      black.map(([k, at]) => `<span class="kb-black" data-mark="${k}"${control(k)} style="${percent(at)}"></span>`).join('') +
      white.map((k, i) => name(k, i + .5, 'white')).join('') + black.map(([k, at]) => name(k, at, 'black')).join('') +
      '</div>';
  }
  const html = build();
  // 键盘场景：marks 为标出的琴键；tones 只用于发声（先后发声）
  const scene = (marks = [], {from = 'C4', names = null, shown = [], tap = false, ...extra} = {}) => ({
    panel: {key: `keyboard:${from}${names ? ':' + JSON.stringify(names) : ''}${tap ? ':tap' : ''}`, html: names || tap || from !== 'C4' ? build(from, names || {}, tap) : html,
      marks: [...marks, ...shown.map(k => 'name:' + k)]},
    tones: marks.map((key, i) => ({id: 'k' + i, key, slot: i})), ...extra});
  window.IntervalKeyboard = Object.freeze({html, scene});
})();
