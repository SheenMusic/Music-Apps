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
   ChordInput.field({value, onInput, onEnter, onSpace, onSubmit, anchor, …}) → 输入框（＋提交按钮）+ 实时排版预览 + 符号快捷键 + 输入说明（底部弹出）
   手机上：输入框获得焦点时进入「打字模式」（html.is-typing），符号快捷键固定在键盘正上方，键盘弹出后自动调整滚动位置（见下方「手机键盘」）。
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
      const q = take(/^(min|m|-|aug|\+|dim|o(?!mit)|ø)/);  // o 后面跟 mit 时是 omit，不是减和弦
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
      // sus7：部分乐谱（尤其流行乐谱）对 7sus4 的写法，按 7sus4 理解；练习里算对，但提示规范写法（第五课，2026-11-20）
      if (take(/^sus7/)) { chord.delete(3); chord.set(4, 5); chord.set(7, 10); continue; }
      // sus24 / sus42：同时有二音和四音（第五课）
      if (take(/^sus(24|42)/)) { chord.delete(3); chord.set(2, 2); chord.set(4, 5); continue; }
      if ((m = take(/^sus(2|4)?/))) { chord.delete(3); chord.set(m[1] === '2' ? 2 : 4, m[1] === '2' ? 2 : 5); continue; }
      if ((m = take(/^(omit|no)(3|5)/))) { chord.delete(Number(m[2])); continue; }
      // m(maj7)、m(maj9)、m(maj13)：小三和弦 ＋ 大七度（及延伸音）
      if ((m = take(/^maj(13|11|9|7)/))) {
        // 前面已经写过 maj / M（如 CM(maj9)）：没有这种写法
        if (majSeventh) return {error: '「maj」只写一次：大七和弦写 maj9，小大七和弦写 m(maj9)。'};
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
    // 只写「/低音」：和前一个和弦相同，只换低音（第一课第七节的简写）。和弦本身由谱例分析按前一个和弦补全
    if (text[0] === '/') {
      const only = readNote(text.slice(1), 'bass');
      if (only.error) return {ok: false, error: only.error};
      if (only.rest) return {ok: false, error: `低音后面不能再写「${only.rest}」。`};
      return {ok: true, bassOnly: true, root: '', rootAcc: '', suffix: '', quality: null, chord: new Map(), alt: false, key: '',
        bass: only.letter, bassAcc: only.acc, parts: ['', '', showNote(only.letter, only.acc)]};
    }
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
  // 第三项 = 从第几课起用到（field 的 level：这一课之后才学的写法收进「后面课程的写法」）
  const GUIDE = [
    ['b', glyph('♭'), 1], ['bb', glyph('𝄫'), 1], ['#', glyph('♯'), 1], ['x 或 ##', glyph('𝄪'), 1],
    ['m / min / -', '小三和弦，- 排成 −', 1], ['M / maj / ^', '大三和弦，^ 排成 △；大三和弦也可以不写', 1],
    ['aug / +', '增三和弦', 1], ['dim / o', '减三和弦，o 排成 °', 1], ['/', '斜线，后面写低音', 1],
    ['ø', '半减七和弦（ø7）。Mac：Option + O；iPhone / iPad：长按 o；Windows：Alt + 0248（数字小键盘）。也可以写 m7b5 或 m7-5', 2],
    ['7 9 11 13', '七和弦与延伸音和弦，例如 maj7、m7、7、o7、m9', 3], ['(b9, #11)', '变化音写在括号里，逗号分开', 3],
    ['sus4 / add9 / 6/9', '挂留、附加音', 3]
  ];
  // 符号快捷键：手机上打这些符号要切换键盘，这里一键输入（只插入字符，不是模板）。
  // 只在触屏设备上显示（chord-input.css）；电脑直接用键盘。
  // [输入的字符, 按钮上显示的字]；♭ ♯ △ 用 Bravura Text 字形（与排版一致）
  const MUSIC = text => `<span class="cs-music">${text}</span>`;
  const KEYS = [['b', MUSIC('\ued60')], ['#', MUSIC('\ued62')], ['o', '°'], ['ø', MUSIC('\ue871')], ['+', '+'], ['-', '−'], ['^', MUSIC('\ue873')], ['(', '('], [')', ')'], ['/', '/']];

  /* ---------- 手机键盘（iPhone 等触屏设备） ----------
     iOS Safari 弹出键盘时不缩小页面，只缩小「可见区域」（visualViewport），键盘会盖住页面下半部分。
     - --chord-kb：键盘（连同键盘上方的系统工具条）盖住的高度，position: fixed 的元素用它停在键盘正上方；--chord-vh：可见区域的高度。
     - html.is-typing：触屏设备上输入框获得焦点时加上（打字模式），各页面据此收起次要内容（紧凑模式）。
     - 获得焦点、键盘弹出后，把 anchor（例如谱例）滚到可见区域顶端，同时保证输入框不被挡住。
     - 不和 iOS 抢滚动（2026-11-14 iPhone 实测：页面上下跳个不停）：只在获得焦点后、键盘弹出或收起（可见区域高度明显变化）时对齐，
       每次获得焦点最多对齐两次，偏差小于 16px 不动；可见区域的 scroll 事件只更新快捷键条的位置，不再滚动页面。 */
  const TOUCH = matchMedia('(hover: none) and (pointer: coarse)');
  const root = document.documentElement;
  const view = window.visualViewport;
  let active = null;  // 正在打字的输入框：{wrap, input, anchor}
  const keyboardHeight = () => view ? Math.max(0, Math.round(window.innerHeight - view.height - view.offsetTop)) : 0;
  const MAX_ALIGNS = 2;
  function align() {
    if (!active || !view || active.aligns >= MAX_ALIGNS) return;
    active.aligns++;
    const visibleTop = view.offsetTop, visibleBottom = view.offsetTop + view.height;
    // 键盘上方固定的工具条（符号快捷键、谱例分析的输入栏）也会挡住一部分
    const docked = [...document.querySelectorAll('.is-docked')].reduce((h, el) => Math.max(h, el.getBoundingClientRect().height), 0);
    // 没有 anchor（课件的 Quiz）：只把输入框滚进它所在滚动区的可见范围
    if (!active.anchor) { active.wrap.querySelector('.chord-input-row').scrollIntoView({block: 'nearest'}); return; }
    const anchor = active.anchor();
    let shift = anchor.getBoundingClientRect().top - visibleTop - 8;
    // 输入框不在固定栏里时必须完整可见：放不下时以输入框为准（谱例顶端可以略微超出）
    if (!active.wrap.closest('.is-docked')) {
      const bottom = active.wrap.querySelector('.chord-input-row').getBoundingClientRect().bottom - shift;
      if (bottom > visibleBottom - docked - 8) shift += bottom - (visibleBottom - docked - 8);
    }
    if (Math.abs(shift) > 16) window.scrollBy({top: shift, behavior: 'auto'});
  }
  let alignTimer = 0;
  const alignSoon = (delay = 120) => { clearTimeout(alignTimer); alignTimer = setTimeout(align, delay); };
  // 结束打字模式（输入框被移除时 blur 不一定触发，所以键盘收起、页面重画时也调用）
  function endTyping() {
    document.querySelectorAll('.is-docked').forEach(el => el.classList.remove('is-docked'));
    document.querySelectorAll('.chord-input.is-active').forEach(w => w.classList.remove('is-active'));
    active = null;
    root.classList.remove('is-typing');
  }
  // 可见区域变化：更新 --chord-kb（快捷键条跟着键盘走）。只有高度明显变化（键盘弹出 / 收起）才重新对齐，页面滚动时不对齐
  let lastHeight = view ? view.height : 0;
  function updateKeyboard(event) {
    if (active && (!active.input.isConnected || document.activeElement !== active.input)) endTyping();
    root.style.setProperty('--chord-kb', keyboardHeight() + 'px');
    if (!view) return;
    const resized = Math.abs(view.height - lastHeight) > 60;
    lastHeight = view.height;
    if (event?.type === 'scroll') return;
    root.style.setProperty('--chord-vh', Math.round(view.height) + 'px');  // 可见区域的高度（固定高度的课件页用）
    if (active && resized) alignSoon(200);
  }
  if (view) { view.addEventListener('resize', updateKeyboard); view.addEventListener('scroll', updateKeyboard); }
  function startTyping(state) {
    if (!TOUCH.matches) return;
    active = state;
    state.aligns = 0;
    root.classList.add('is-typing');
    document.querySelectorAll('.chord-input.is-active').forEach(w => w.classList.remove('is-active'));
    state.wrap.classList.add('is-active');
    // 固定在键盘上方的部分：默认是符号快捷键；放在 [data-dock] 里的输入框（谱例分析的输入栏）整栏固定
    state.dock = state.wrap.closest('[data-dock]') || state.wrap.querySelector('.chord-input-keys');
    state.dock.classList.add('is-docked');
    updateKeyboard();
    alignSoon(350);  // 键盘弹出的动画约 300ms
  }
  function stopTyping(state) {
    // 点快捷键、提交按钮时焦点会短暂离开：稍等一下，焦点没有回到任何输入框才退出打字模式
    setTimeout(() => {
      if (document.activeElement?.classList?.contains('chord-input-box')) return;
      if (active === state) active = null;
      state.wrap.classList.remove('is-active');
      state.dock?.classList.remove('is-docked');
      if (!active) root.classList.remove('is-typing');
      updateKeyboard();
    }, 150);
  }

  /* 输入说明：点按钮从底部弹出（不在页面里展开，免得打字时把内容往下推）。关掉后回到输入框。
     reference（本课记号速查 [{title, html}]）：在同一个弹窗里切换显示，不离开页面——
     以前是链接到课件页，学生在练习中途好奇点开，练习就被退出、记录全部丢失（2026-11-14 用户反馈）。 */
  function openGuide(html, input, reference) {
    const sheet = document.createElement('div');
    sheet.className = 'chord-guide-sheet';
    const guideBody = html + (reference ? '<p class="chord-input-reference"><button class="chord-reference-open" type="button">本课记号速查</button></p>' : '');
    const referenceBody = reference ? '<p class="chord-reference-back-row"><button class="chord-reference-back" type="button">← 返回输入说明</button></p>' +
      reference.map(({title, html}) => `<section class="reference-block"><h3>${title}</h3>${html}</section>`).join('') : '';
    sheet.innerHTML = `<div class="chord-guide-panel" role="dialog" aria-modal="true" aria-labelledby="chordGuideTitle">
      <div class="chord-guide-head"><h2 id="chordGuideTitle">输入说明</h2><button class="chord-guide-close" type="button" aria-label="关闭">✕</button></div><div class="chord-guide-body">${guideBody}</div></div>`;
    const body = sheet.querySelector('.chord-guide-body'), title = sheet.querySelector('h2'), panel = sheet.querySelector('.chord-guide-panel');
    const show = which => {
      body.innerHTML = which === 'reference' ? referenceBody : guideBody;
      title.textContent = which === 'reference' ? '记号速查' : '输入说明';
      panel.classList.toggle('is-reference', which === 'reference');
      panel.scrollTop = 0;
    };
    body.addEventListener('click', event => {
      if (event.target.closest('.chord-reference-open')) show('reference');
      if (event.target.closest('.chord-reference-back')) show('guide');
    });
    const close = refocus => {
      sheet.remove();
      document.removeEventListener('keydown', onKey, true);
      if (refocus && !input.disabled) input.focus({preventScroll: true});
    };
    const onKey = event => { if (event.key === 'Escape') { event.stopPropagation(); close(true); } };
    sheet.addEventListener('click', event => {
      if (event.target === sheet || event.target.closest('.chord-guide-close')) close(true);
    });
    document.addEventListener('keydown', onKey, true);
    document.body.append(sheet);
    sheet.querySelector('.chord-guide-close').focus({preventScroll: true});
  }

  let fieldCount = 0;
  // guide：这一课额外的输入说明 [[写法, 说明], …]，加在通用说明后面（各课 questions.js 的 inputGuide）
  // level：第几课。之后才学的通用写法折叠起来；不写则全部显示。
  // reference：本课「记号速查」[{title, html}]（各课 reference.js 的 window.chordReference），在输入说明弹窗里切换显示，不离开页面
  // onSubmit：输入框右边加一个「提交」按钮（手机打字时用；电脑上隐藏，用页面原来的提交按钮或回车）。
  //           有 onSubmit 时键盘上的确认键显示「前往」（enterkeyhint="go"），按下等于提交。
  // anchor：手机键盘弹出后要滚到可见区域顶端的元素（例如谱例），返回元素的函数
  function field({value = '', onInput = () => {}, onEnter = null, onSpace = null, onSubmit = null, anchor = null, label = '和弦记号', guide = [], level = Infinity, reference = null} = {}) {
    const id = `chordInput${++fieldCount}`;
    const row = ([k, v]) => `<tr><td><kbd>${k}</kbd></td><td>${v}</td></tr>`;
    const now = GUIDE.filter(r => r[2] <= level), later = GUIDE.filter(r => r[2] > level);
    const guideHTML = `<div class="chord-input-guide">
        <p>像发消息一样打出和弦记号，系统会自动排成规范写法。音名用大写字母。</p>
        <table>${[...now, ...guide].map(row).join('')}</table>
        <p>例：<kbd>Ebo/Bbb</kbd> → ${ChordStage.chordSymbol('E♭', '°', 'B𝄫')}</p>
        ${later.length ? `<details class="chord-input-later"><summary>后面课程的写法</summary><table>${later.map(row).join('')}</table></details>` : ''}
      </div>`;
    const wrap = document.createElement('div');
    wrap.className = 'chord-input';
    wrap.innerHTML = `<label class="chord-input-label" for="${id}">${label}</label>
      <div class="chord-input-row">
        <input class="chord-input-box" id="${id}" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="${onSubmit ? 'go' : 'done'}" placeholder="用键盘输入，例如 F#m 或 Bb/D">
        ${onSubmit ? '<button class="chord-input-submit" type="button" disabled>提交</button>' : ''}
      </div>
      <p class="chord-input-preview" aria-live="polite"></p>
      <div class="chord-input-keys" aria-label="符号快捷键"></div>
      <button class="chord-input-guide-btn" type="button">输入说明</button>`;
    const input = wrap.querySelector('input'), preview = wrap.querySelector('.chord-input-preview'), keys = wrap.querySelector('.chord-input-keys');
    const submit = wrap.querySelector('.chord-input-submit');
    input.value = value;
    function update() {
      const result = parse(input.value);
      preview.classList.toggle('is-error', !result.ok && !result.empty);
      preview.innerHTML = result.ok ? ChordStage.chordSymbol(...result.parts) : result.empty ? '<span class="chord-input-hint">排版后的记号会显示在这里</span>' : result.error;
      if (submit) submit.disabled = !result.ok;
      onInput(input.value, result);
    }
    input.addEventListener('input', update);
    input.addEventListener('keydown', event => {
      // 中文等输入法正在拼写时按回车，是在确认输入法里的字，不是提交（阿润反馈：打 F 再按回车就被提交了）
      if (event.isComposing || event.keyCode === 229) return;
      if (event.key === 'Enter' && (onEnter || onSubmit)) { event.preventDefault(); (onEnter || onSubmit)(parse(input.value)); }
      if (event.key === ' ' && onSpace) { event.preventDefault(); onSpace(parse(input.value)); }
    });
    const state = {wrap, input, anchor};
    input.addEventListener('focus', () => startTyping(state));
    input.addEventListener('blur', () => stopTyping(state));
    if (submit) {
      // 按下时不让输入框失去焦点：答错时键盘保持打开，可以直接改
      submit.addEventListener('pointerdown', event => event.preventDefault());
      submit.addEventListener('click', () => { if (!submit.disabled) onSubmit(parse(input.value)); });
    }
    wrap.querySelector('.chord-input-guide-btn').addEventListener('click', () => openGuide(guideHTML, input, reference));
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
    // 打字时快捷键工具条末尾的「说明」（页面里的「输入说明」按钮此时隐藏）
    const guideKey = document.createElement('button');
    guideKey.type = 'button';
    guideKey.className = 'chord-input-key chord-input-key-guide';
    guideKey.textContent = '说明';
    guideKey.addEventListener('click', () => openGuide(guideHTML, input, reference));
    keys.append(guideKey);
    update();
    return {element: wrap, input, focus: () => input.focus(), value: () => input.value, parse: () => parse(input.value)};
  }

  window.ChordInput = Object.freeze({parse, spell, field, showNote, endTyping});
})();
