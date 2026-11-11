/* 和弦记号课程 · 键盘输入（课件 Quiz 与课后练习共用）
   学生像发消息一样用普通键盘打出和弦记号（乐手通用的文字写法），系统识别后排版成规范的印刷体。
   - 根音：A–G，提示与示范一律用大写（乐手的习惯）；小写也能识别，自动转大写。升降号写在字母之后：b = ♭，bb = 𝄫，# = ♯，x 或 ## = 𝄪。
   - 后缀：三和弦 不写 / M / maj / ^（△）= 大；m / min / -（−）= 小；aug / + = 增；dim / o（°）= 减；
     七和弦及以上、变化音、sus / add / omit 等见下方 readSuffix 的说明（第 2–5 课）。
     后缀区分大小写（M 是大，m 是小），不自动改写。
   - 斜线低音：/ 后面写音名，规则同根音。
   - 写错的地方（升降号写在字母前面、无法识别的后缀）给出提示，不猜学生的意思。
   ChordInput.parse(text) → {ok, root, rootAcc, suffix, quality（只有三和弦才有）, chord（结构）, key（结构比较用）, bass, bassAcc, parts} 或 {ok: false, error}
   ChordInput.spell(parsed) → 和弦音拼写（从根音按度数往上）
   ChordInput.field({value, onInput, onEnter, onSpace}) → 输入框 + 实时排版预览 + 符号快捷键 + 输入说明
   依赖：ChordStage.chordSymbol。 */
(() => {
  'use strict';
  const ACC = {'': '', b: 'b', bb: 'bb', '#': '#', '##': 'x', x: 'x', '♭': 'b', '♯': '#', '𝄫': 'bb', '𝄪': 'x'};
  const ACC_SHOW = {'': '', b: '♭', bb: '𝄫', '#': '♯', x: '𝄪'};
  const showNote = (letter, acc) => letter + ACC_SHOW[acc];

  // 读一个音名：字母 + 升降号。返回 {letter, acc, rest} 或错误
  function readNote(text, where) {
    const m = text.match(/^([A-Ga-g])(bb|b|##|#|x|♭|♯|𝄫|𝄪)?/u);
    if (!m) {
      if (/^(b|#|x|♭|♯)[A-Ga-g]/u.test(text)) return {error: `升降号要写在字母之后，例如 ${text[1].toUpperCase()}${text[0]}。`};
      return {error: where === 'bass' ? '斜线后面要写低音的音名（A–G）。' : '先写根音的音名（A–G）。'};
    }
    return {letter: m[1].toUpperCase(), acc: ACC[m[2] || ''], rest: text.slice(m[0].length)};
  }

  /* ---------- 后缀：和弦结构 ----------
     结构 = 各「度数」相对根音的半音数：{1: 0, 3: 4, 5: 7, 7: 10, 9: 14 …}。
     两个记号的结构相同，就是同一个和弦（例如 Cø7 = Cm7(♭5)，Caug7 = C7(♯5)）。
     规则（第 1–5 课）：
       三和弦性质 m / min / -（−）、aug / +、dim / o（°）、ø（半减，默认带 7）；大三和弦不写，或写 M / maj / ^（△）。
       数字 7 / 9 / 11 / 13：叠到七音及以上（9 含 9；11 含 9、11；13 含 9、11、13）。
         七音默认小七度；前面有 M / maj / ^（△）是大七度；° 的七音是减七度。m 后面再写 M / maj / ^，或写 m(maj7)，是小大七。
       6 = 加大六度；6/9（或 69）= 加大六度和大九度；2 = add2；5 = 强力和弦（只有根音与五音）。
       变化音 ♭5 ♯5 ♭9 ♯9 ♯11 ♭13（可放在括号里，用逗号分开）：替换同一度数的音，没有这个度数就加上。
       sus2 / sus4 / sus（= sus4）：替代三音；add2 / add4 / add9 / add11 / add13：加音；omit3 / omit5（或 no3 / no5）：去掉音；alt：属变和弦。 */
  const DEGREES = [1, 2, 3, 4, 5, 6, 7, 9, 11, 13];
  const NATURAL = {1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11, 9: 14, 11: 17, 13: 21};
  // 显示：输入的 ASCII 写法 → 印刷体
  function prettySuffix(text) {
    return text
      .replace(/\^/g, '△')
      .replace(/(^|[^a-z])o(?!mit)/g, '$1°')
      .replace(/-/g, '−')
      .replace(/b(?=\d)/g, '♭')
      .replace(/#/g, '♯');
  }
  function readSuffix(raw) {
    let text = raw.replace(/♭/g, 'b').replace(/♯/g, '#').replace(/△/g, '^').replace(/−/g, '-').replace(/°/g, 'o').replace(/6\/9/g, '69');
    const chord = new Map([[1, 0], [3, 4], [5, 7]]);
    let triad = 'major', majSeventh = false, number = '', alt = false;
    const take = re => { const m = text.match(re); if (m) text = text.slice(m[0].length); return m; };
    // 性质：先认 maj，避免把 maj 的 m 当成小三和弦
    if (take(/^(maj|M|\^)/)) majSeventh = true;
    else {
      const q = take(/^(min|m|-|aug|\+|dim|o|ø)/);
      if (q) triad = {min: 'minor', m: 'minor', '-': 'minor', aug: 'aug', '+': 'aug', dim: 'dim', o: 'dim', 'ø': 'half'}[q[1]];
      if (q && take(/^(maj|M|\^)/)) majSeventh = true;
    }
    const n = take(/^(69|13|11|9|7|6|5|2)/);
    if (n) number = n[1];
    if (triad === 'half' && !number) number = '7';
    if (triad === 'minor' || triad === 'dim' || triad === 'half') chord.set(3, 3);
    if (triad === 'aug') chord.set(5, 8);
    if (triad === 'dim' || triad === 'half') chord.set(5, 6);
    if (['7', '9', '11', '13'].includes(number)) {
      chord.set(7, majSeventh ? 11 : triad === 'dim' ? 9 : 10);
      if (number !== '7') chord.set(9, 14);
      if (number === '11' || number === '13') chord.set(11, 17);
      if (number === '13') chord.set(13, 21);
    } else if (majSeventh && number) return {error: `「maj」后面要写 7、9、11 或 13。`};
    if (number === '6') chord.set(6, 9);
    if (number === '69') { chord.set(6, 9); chord.set(9, 14); }
    if (number === '2') chord.set(2, 2);
    if (number === '5') { if (triad !== 'major' || majSeventh) return {error: '强力和弦（5）没有三音，前面不写性质。'}; chord.delete(3); }
    // 括号与逗号只是分隔
    while (text) {
      if (take(/^[\s,()]+/)) continue;
      let m;
      // 变化音替换同一度数的自然音；同一度数可以有两个变化音（如 ♭9 与 ♯9 同时出现），所以键写成「9b」「9#」
      // 数字前的 - / + 也当作 ♭ / ♯（乐手常把半减七写成 m7-5）
      if ((m = take(/^(b|#|-|\+)(5|9|11|13)/))) { const d = Number(m[2]), flat = m[1] === 'b' || m[1] === '-'; chord.delete(d); chord.set(d + (flat ? 'b' : '#'), NATURAL[d] + (flat ? -1 : 1)); continue; }
      if ((m = take(/^add(2|4|6|9|11|13)/))) { const d = Number(m[1]); chord.set(d, NATURAL[d]); continue; }
      if ((m = take(/^sus(2|4)?/))) { chord.delete(3); chord.set(m[1] === '2' ? 2 : 4, m[1] === '2' ? 2 : 5); continue; }
      if ((m = take(/^(omit|no)(3|5)/))) { chord.delete(Number(m[2])); continue; }
      // m(maj7)、m(maj9)、m(maj13)：小三和弦 ＋ 大七度（及延伸音）
      if ((m = take(/^maj(13|11|9|7)/))) {
        chord.set(7, 11);
        if (m[1] !== '7') chord.set(9, 14);
        if (m[1] === '11' || m[1] === '13') chord.set(11, 17);
        if (m[1] === '13') chord.set(13, 21);
        continue;
      }
      if (take(/^alt/)) { alt = true; continue; }
      return {error: `无法识别「${text}」。`};
    }
    const triadOnly = [...chord.keys()].join() === '1,3,5' && !alt;
    const quality = triadOnly ? {'4,7': 'major', '3,7': 'minor', '4,8': 'aug', '3,6': 'dim'}[chord.get(3) + ',' + chord.get(5)] || null : null;
    return {chord, alt, quality};
  }
  const byDegree = (a, b) => parseInt(a[0]) - parseInt(b[0]) || a[1] - b[1];
  const structureKey = p => [...p.chord.entries()].sort(byDegree).map(([d, s]) => parseInt(d) + ':' + s).join(' ') + (p.alt ? ' alt' : '');

  function parse(raw) {
    const text = String(raw).replace(/\s+/g, '');
    if (!text) return {ok: false, empty: true, error: ''};
    const root = readNote(text, 'root');
    if (root.error) return {ok: false, error: root.error};
    // 斜线：6/9 里的斜线不是低音
    const body = root.rest.replace(/6\/9/g, '69');
    const slash = body.lastIndexOf('/');
    const suffixText = slash < 0 ? body : body.slice(0, slash);
    const structure = readSuffix(suffixText);
    if (structure.error) return {ok: false, error: structure.error + '后缀可以写 m、maj7、7、°7、ø7、9、sus4、add9、6/9、(♭9) 等。'};
    let bass = null;
    if (slash >= 0) {
      bass = readNote(body.slice(slash + 1), 'bass');
      if (bass.error) return {ok: false, error: bass.error};
      if (bass.rest) return {ok: false, error: `低音后面不能再写「${bass.rest}」。`};
    }
    const suffix = prettySuffix(suffixText.replace(/69/g, '6/9'));
    return {
      ok: true,
      root: root.letter, rootAcc: root.acc, suffix, quality: structure.quality,
      chord: structure.chord, alt: structure.alt, key: structureKey(structure),
      bass: bass ? bass.letter : '', bassAcc: bass ? bass.acc : '',
      // 排版用：[根音, 后缀, 低音]
      parts: [showNote(root.letter, root.acc), suffix, bass ? showNote(bass.letter, bass.acc) : '']
    };
  }

  // 按结构拼出和弦音（内部写法 C、Ab、F#、Bbb、Fx），从根音往上按度数排列
  const LETTERS = 'CDEFGAB', STEP = {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11};
  const ACC_OF = {'-2': 'bb', '-1': 'b', 0: '', 1: '#', 2: 'x'};
  const ACC_NUM = {'': 0, b: -1, bb: -2, '#': 1, x: 2};
  function spell(parsed) {
    const rootPc = STEP[parsed.root] + ACC_NUM[parsed.rootAcc], rootIdx = LETTERS.indexOf(parsed.root);
    return [...parsed.chord.entries()].sort(byDegree).map(([degree, semis]) => {
      const letter = LETTERS[(rootIdx + parseInt(degree) - 1) % 7];
      let diff = ((rootPc + semis - STEP[letter]) % 12 + 12) % 12;
      if (diff > 6) diff -= 12;
      return letter + ACC_OF[diff];
    });
  }

  // 输入说明（对照表）
  // 升降号用记谱字形显示（与排版后的记号一致）
  const glyph = sign => `<span class="cs"><span class="cs-music">${{'♭': '\ued60', '𝄫': '\ued64', '♯': '\ued62', '𝄪': '\ued63'}[sign]}</span></span>`;
  const GUIDE = [
    ['b', glyph('♭')], ['bb', glyph('𝄫')], ['#', glyph('♯')], ['x 或 ##', glyph('𝄪')],
    ['m / min / -', '小三和弦，- 排成 −'], ['M / maj / ^', '大三和弦，^ 排成 △；大三和弦也可以不写'],
    ['aug / +', '增三和弦'], ['dim / o', '减三和弦，o 排成 °'], ['ø', '半减七和弦（ø7）'],
    ['7 9 11 13', '七和弦与延伸音和弦，例如 maj7、m7、7、o7、m9'], ['(b9, #11)', '变化音写在括号里，逗号分开'],
    ['sus4 / add9 / 6/9', '挂留、附加音'], ['/', '斜线，后面写低音']
  ];
  // 符号快捷键：手机上打这些符号要切换键盘，这里一键输入（只插入字符，不是模板）。
  // 只在触屏设备上显示（chord-input.css）；电脑直接用键盘。
  // [输入的字符, 按钮上显示的字]；♭ ♯ △ 用 Bravura Text 字形（与排版一致）
  const MUSIC = text => `<span class="cs-music">${text}</span>`;
  const KEYS = [['b', MUSIC('\ued60')], ['#', MUSIC('\ued62')], ['o', '°'], ['ø', MUSIC('\ue871')], ['+', '+'], ['-', '−'], ['^', MUSIC('\ue873')], ['(', '('], [')', ')'], ['/', '/']];

  let fieldCount = 0;
  // guide：这一课额外的输入说明 [[写法, 说明], …]，加在通用说明后面（各课 questions.js 的 inputGuide）
  function field({value = '', onInput = () => {}, onEnter = null, onSpace = null, label = '和弦记号', guide = []} = {}) {
    const id = `chordInput${++fieldCount}`;
    const wrap = document.createElement('div');
    wrap.className = 'chord-input';
    wrap.innerHTML = `<label class="chord-input-label" for="${id}">${label}</label>
      <input class="chord-input-box" id="${id}" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="用键盘输入，例如 F#m 或 Bb/D">
      <p class="chord-input-preview" aria-live="polite"></p>
      <div class="chord-input-keys" aria-label="符号快捷键"></div>
      <details class="chord-input-guide"><summary>输入说明</summary>
        <p>像发消息一样打出和弦记号，系统会自动排成规范写法。音名用大写字母。</p>
        <table>${[...GUIDE, ...guide].map(([k, v]) => `<tr><td><kbd>${k}</kbd></td><td>${v}</td></tr>`).join('')}</table>
        <p>例：<kbd>Ebo/Bbb</kbd> → ${ChordStage.chordSymbol('E♭', '°', 'B𝄫')}</p>
      </details>`;
    const input = wrap.querySelector('input'), preview = wrap.querySelector('.chord-input-preview'), keys = wrap.querySelector('.chord-input-keys');
    input.value = value;
    function update() {
      const result = parse(input.value);
      preview.classList.toggle('is-error', !result.ok && !result.empty);
      preview.innerHTML = result.ok ? ChordStage.chordSymbol(...result.parts) : result.empty ? '<span class="chord-input-hint">排版后的记号会显示在这里</span>' : result.error;
      onInput(input.value, result);
    }
    input.addEventListener('input', update);
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter' && onEnter) { event.preventDefault(); onEnter(parse(input.value)); }
      if (event.key === ' ' && onSpace) { event.preventDefault(); onSpace(parse(input.value)); }
    });
    KEYS.forEach(([typed, shown]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chord-input-key';
      button.innerHTML = `<span class="cs">${shown}</span>`;
      button.setAttribute('aria-label', `输入 ${typed}`);
      // 按下时不让输入框失去焦点（手机键盘保持打开）
      button.addEventListener('pointerdown', event => event.preventDefault());
      button.addEventListener('click', () => {
        const start = input.selectionStart ?? input.value.length, end = input.selectionEnd ?? start;
        input.value = input.value.slice(0, start) + typed + input.value.slice(end);
        input.setSelectionRange(start + typed.length, start + typed.length);
        input.focus();
        update();
      });
      keys.append(button);
    });
    update();
    return {element: wrap, input, focus: () => input.focus(), value: () => input.value, parse: () => parse(input.value)};
  }

  window.ChordInput = Object.freeze({parse, spell, field, showNote});
})();
