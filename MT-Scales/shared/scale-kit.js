/* 调式与音阶课程 · 演示区与课件写法（V2，2026-11-23）
   依据 docs/scales/lesson01–06-script.md。在共享舞台（MT-Chord/shared/chord-stage.js、chord-lesson.js）上提供：
   - notes(keys, opts)：一排全音符（音阶、音列），点单个音发声，点空白处依次播放
   - melody(text, opts)：带节奏、小节线的单旋律，如 'C4 E4 G4 E4 | D4 B3 C4:h'（:h 二分、:w 全音符，默认四分）
   - toggle([[按钮文字, 场景], …])：演示区按钮切换的几个版本（学生手动切换，不自动闪切）
   - cards / table / circle：不需要谱表的面板
   - lesson()：一页一句的写法：section、say、note（注意）、q（课内 Quiz）、run
   记谱：opts.key 为调号（大调名或小调名，如 'G'、'Dm'；默认空调号）；每个音写实际音高（'C5' 即本位 C），
   临时记号按调号与小节规则自动写出（同小节同八度不重复）。只用高音谱表，没有伴奏。
   颜色：主音 = 根音色，特征音 / 变化音 = 红，暂不讨论的音 = 灰；Quiz 谱例不着色。 */
(() => {
  'use strict';
  const {COLOR} = ChordStage;
  const MARK = '#dc2626', FAINT = COLOR.faint || '#cbd5e1', TONIC = COLOR.root;

  // 调号：小调换成关系大调；升降号个数（用于让开谱号后面的空间）
  const RELATIVE = {Am: 'C', Em: 'G', Bm: 'D', 'F#m': 'A', 'C#m': 'E', 'G#m': 'B', 'D#m': 'F#', 'A#m': 'C#',
    Dm: 'F', Gm: 'Bb', Cm: 'Eb', Fm: 'Ab', Bbm: 'Db', Ebm: 'Gb', Abm: 'Cb'};
  const COUNT = {C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7, F: 1, Bb: 2, Eb: 3, Ab: 4, Db: 5, Gb: 6, Cb: 7};
  const majorOf = key => RELATIVE[key] || key || 'C';

  // 横向位置：从谱号、调号、拍号之后排到谱表右端。gaps：在第几个音之前加一段空白（小节线）
  const GEO = {slot0: 80, slotWidth: 50, width: 258};
  function slots(n, {wide = 1.45, key = 'C', time = '', gaps = []} = {}) {
    const left = 58 + COUNT[majorOf(key)] * 10 + (time ? 22 : 0) + 10, right = GEO.width * wide - 16;
    const units = [];
    let at = 0;
    for (let i = 0; i < n; i++) { if (gaps.includes(i)) at += 0.7; units.push(at); at += 1; }
    const span = Math.max(at - 1, 1), step = Math.min((right - left) / span, 52);
    const start = n === 1 ? (left + right) / 2 : left + ((right - left) - step * span) / 2;
    return units.map(u => (start + u * step - GEO.slot0) / GEO.slotWidth);
  }

  // 音级、文字标注：labels 写在每个音的正下方；tags 写在音的上方（说明文字）
  function decorate(slotList, {labels = [], tags = [], colorAt}) {
    const below = labels.map((text, i) => text ? {slot: slotList[i], text, color: colorAt(i) === COLOR.ink ? '#334155' : colorAt(i)} : null).filter(Boolean);
    const above = tags.map((text, i) => text ? {slot: slotList[i], text, anchor: 'middle', font: 'label', size: 11, color: colorAt(i) === COLOR.ink ? '#334155' : colorAt(i), lift: 26} : null).filter(Boolean);
    return {staffLabels: below, staffSymbols: above};
  }
  // 着色：tonic = 主音位置（数组），mark = 红色，faint = 灰色；plain 时全部黑色（Quiz）
  const painter = ({mark = [], faint = [], tonic = [], plain = false}) => i =>
    plain ? COLOR.ink : faint.includes(i) ? FAINT : mark.includes(i) ? MARK : tonic.includes(i) ? TONIC : COLOR.ink;

  /* 一排全音符。keys：['C4', 'D4', …]；opts：key（调号）、labels、tags、mark、faint、tonic（默认首尾与首音同名的音）、
     intervals：[[a, b, 文字]]（相邻两音之间，写在谱表下方）、caption（演示区下方说明）、gap（秒）、wide */
  function notes(keys, opts = {}) {
    const {key = 'C', wide = 1.45, intervals = [], caption = '', gap = 0.45, plain = false, extra = {}} = opts;
    const first = keys[0] ? keys[0].replace(/\d/, '') : '';
    const tonic = opts.tonic || (opts.noTonic ? [] : keys.map((k, i) => k.replace(/\d/, '') === first ? i : -1).filter(i => i >= 0));
    const slotList = slots(keys.length, {wide, key});
    const colorAt = painter({...opts, tonic, plain});
    // hide：保留位置、不画这个音（填空题的空位），在空位上方写「?」
    const hide = opts.hide || [];
    const tones = keys.map((k, i) => ({id: 'n' + i, key: k, slot: slotList[i], color: colorAt(i), ...(opts.cautionary?.includes(i) ? {cautionary: true} : {})}))
      .filter((_, i) => !hide.includes(i));
    const tags = hide.length ? keys.map((_, i) => hide.includes(i) ? '?' : (opts.tags || [])[i] || '') : opts.tags;
    const {staffLabels, staffSymbols} = decorate(slotList, {...opts, tags, colorAt: plain ? () => COLOR.ink : colorAt});
    return {wide, key: majorOf(key), tap: 'note', tones, offsets: tones.map((_, i) => i * gap),
      staffLabels, staffSymbols, intervals: intervals.map(([a, b, text]) => ['n' + a, 'n' + b, text]), caption, ...extra};
  }

  /* 单旋律：'C4 E4 G4 E4 | D4 B3 C4:h'。时值 :q（默认）:h :w；'|' 为小节线；opts 同 notes，另有 time（默认 4/4，'' 不写拍号）、beat（每拍秒数） */
  function melody(text, opts = {}) {
    const {key = 'C', wide = 1.45, time = '4/4', beat = 0.55, caption = '', plain = false, extra = {}} = opts;
    const items = [], gaps = [];
    text.trim().split(/\s+/).forEach(word => {
      if (word === '|') { gaps.push(items.length); return; }
      const [k, d = 'q'] = word.split(':');
      items.push({key: k, d});
    });
    const slotList = slots(items.length, {wide, key, time, gaps});
    const colorAt = painter({...opts, tonic: opts.tonic || [], plain});
    const BEATS = {q: 1, h: 2, w: 4};
    let at = 0;
    const offsets = [], durations = [];
    const tones = items.map((item, i) => {
      offsets.push(at * beat);
      durations.push(BEATS[item.d] * beat * 0.95);
      at += BEATS[item.d];
      return {id: 'm' + i, key: item.key, slot: slotList[i], duration: item.d, color: colorAt(i), ...(opts.cautionary?.includes(i) ? {cautionary: true} : {})};
    });
    const bars = gaps.map(i => (slotList[i - 1] + slotList[i]) / 2);
    const {staffLabels, staffSymbols} = decorate(slotList, {...opts, colorAt: plain ? () => COLOR.ink : colorAt});
    return {wide, key: majorOf(key), time, bars, tap: 'note', tones, offsets, durations, staffLabels, staffSymbols, caption, ...extra};
  }

  // 按钮切换的几个版本：返回第一个（或 pressed 指定的）版本；按钮在每个版本里保持不变
  const registry = new Map();
  let toggles = 0;
  function toggle(variants, {pressed = 0} = {}) {
    const id = 't' + (++toggles);
    const controls = variants.map(([label], j) => [`${id}:${j}`, label]);
    const scenes = variants.map(([, scene], j) => ({...scene, controls, pressed: `${id}:${j}`}));
    scenes.forEach((scene, j) => registry.set(`${id}:${j}`, scene));
    return scenes[pressed];
  }
  const onControl = id => registry.get(id);

  /* ---------- 面板 ---------- */
  let panels = 0;
  const panel = (html, caption = '') => ({panel: {key: 'p' + (++panels), html}, caption});
  // 卡片：items = ['文字', …] 或 [['标题', '内容'], …]
  const cards = (items, {cols = 1, title = ''} = {}) => panel(`<div class="sk-cards" style="--cols:${cols}">${title ? `<p class="sk-title">${title}</p>` : ''}${items.map(item =>
    Array.isArray(item) ? `<div class="sk-card"><b>${item[0]}</b><span>${item[1]}</span></div>` : `<div class="sk-card"><span>${item}</span></div>`).join('')}</div>`);
  // 表格：head = ['', …]；rows = [[…], …]；hi = 着色的行号
  const table = (head, rows, {hi = [], title = ''} = {}) => panel(`<div class="sk-table-wrap">${title ? `<p class="sk-title">${title}</p>` : ''}<table class="sk-table">` +
    (head ? `<thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead>` : '') +
    `<tbody>${rows.map((row, i) => `<tr${hi.includes(i) ? ' class="hi"' : ''}>${row.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);

  /* 五度循环：outer = 大调（含调号个数），inner = 关系小调（showMinor）；hi = 着色的调；only = 只显示这些（其余留空位） */
  const CIRCLE = [['C', 'a', '0'], ['G', 'e', '1♯'], ['D', 'b', '2♯'], ['A', 'f♯', '3♯'], ['E', 'c♯', '4♯'], ['B / C♭', 'g♯', '5♯ / 7♭'],
    ['F♯ / G♭', 'd♯ / e♭', '6♯ / 6♭'], ['D♭ / C♯', 'b♭', '5♭ / 7♯'], ['A♭', 'f', '4♭'], ['E♭', 'c', '3♭'], ['B♭', 'g', '2♭'], ['F', 'd', '1♭']];
  function circle({hi = [], only = null, showMinor = false, showCount = true, caption = ''} = {}) {
    const R = 104, r = 66, c = 130;
    const parts = CIRCLE.map(([major, minor, count], i) => {
      const a = (i * 30 - 90) * Math.PI / 180, x = c + R * Math.cos(a), y = c + R * Math.sin(a);
      const xi = c + r * Math.cos(a), yi = c + r * Math.sin(a);
      const show = !only || only.includes(major), on = hi.includes(major) || hi.includes(minor);
      if (!show) return `<circle cx="${x}" cy="${y}" r="3" class="sk-dot"/>`;
      return `<g class="${on ? 'on' : ''}"><text x="${x}" y="${y}" class="sk-major">${major}</text>` +
        (showCount ? `<text x="${x}" y="${y + 13}" class="sk-count">${count}</text>` : '') +
        (showMinor ? `<text x="${xi}" y="${yi + 4}" class="sk-minor">${minor}</text>` : '') + '</g>';
    }).join('');
    return panel(`<svg class="sk-circle" viewBox="0 0 260 260" role="img" aria-label="五度循环"><circle cx="${c}" cy="${c}" r="${R + 18}" class="sk-ring"/>` +
      (showMinor ? `<circle cx="${c}" cy="${c}" r="${r + 14}" class="sk-ring"/>` : '') + parts + '</svg>', caption);
  }

  /* ---------- 课件写法 ---------- */
  // **术语** → 加粗（术语首次定义）；【重点】→ 着色
  const md = text => text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/【(.+?)】/g, '<span class="key-accent">$1</span>');
  function lesson() {
    const b = ChordLesson.builder();
    let pages = 0, quizzes = 0;
    const say = (text, scene, extra = {}) => b.group('p' + (++pages), [[b.p(md(text)), scene, extra]]);
    const note = (text, scene, extra = {}) => b.group('p' + (++pages), [[b.warn(md(text)), scene, extra]]);
    /* 课内 Quiz：options = [['文字', true], ['文字'], …]，一个 true 为单选，多个为多选；
       判断题写 TF(true / false)。选项按写法顺序显示（讲稿里正确答案常写在第一个，这里按题号轮换位置） */
    function q(scene, question, options, right, wrong, {keepOrder = false} = {}) {
      const id = 'q' + (++quizzes);
      let list = options.map(([label, ok], i) => ({value: 'o' + i, label, ok: !!ok}));
      if (!keepOrder && list.filter(o => o.ok).length === 1 && list.length > 2) {
        const turn = quizzes % list.length;
        list = [...list.slice(turn), ...list.slice(0, turn)];
      } else if (!keepOrder && list.length === 2 && quizzes % 2 && list[0].label !== '正确') list.reverse();
      const correct = list.filter(o => o.ok).map(o => o.value);
      b.quiz(id, scene || cards(['请根据题目作答']), {question: md(question), options: list.map(o => [o.value, o.label]),
        answer: correct.length > 1 ? correct : correct[0], right, wrong});
    }
    const TF = answer => [['正确', answer === true], ['错误', answer === false]];
    function run(preload = []) {
      ChordLesson.run({steps: b.steps, sections: b.sections, onControl, quizExtras: true, tapParts: true, preload});
    }
    return {section: b.section, say, note, q, TF, run, md};
  }

  // 常用音阶（C 为主音，C4–C5）
  const C = {
    major: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
    natural: ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5'],
    harmonic: ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'B4', 'C5'],
    melodic: ['C4', 'D4', 'Eb4', 'F4', 'G4', 'A4', 'B4', 'C5'],
    lydian: ['C4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C5'],
    mixolydian: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'C5'],
    dorian: ['C4', 'D4', 'Eb4', 'F4', 'G4', 'A4', 'Bb4', 'C5'],
    phrygian: ['C4', 'Db4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5'],
    locrian: ['C4', 'Db4', 'Eb4', 'F4', 'Gb4', 'Ab4', 'Bb4', 'C5']
  };
  const DEGREES = {
    major: ['1', '2', '3', '4', '5', '6', '7', '1'],
    natural: ['1', '2', '♭3', '4', '5', '♭6', '♭7', '1'],
    harmonic: ['1', '2', '♭3', '4', '5', '♭6', '7', '1'],
    melodic: ['1', '2', '♭3', '4', '5', '6', '7', '1'],
    lydian: ['1', '2', '3', '♯4', '5', '6', '7', '1'],
    mixolydian: ['1', '2', '3', '4', '5', '6', '♭7', '1'],
    dorian: ['1', '2', '♭3', '4', '5', '6', '♭7', '1'],
    phrygian: ['1', '♭2', '♭3', '4', '5', '♭6', '♭7', '1'],
    locrian: ['1', '♭2', '♭3', '4', '♭5', '♭6', '♭7', '1']
  };
  // 其他音阶的音级公式（以同主音大调为标准）
  Object.assign(DEGREES, {
    majorPenta: ['1', '2', '3', '5', '6', '1'],
    minorPenta: ['1', '♭3', '4', '5', '♭7', '1'],
    blues: ['1', '♭3', '4', '♭5', '5', '♭7', '1'],
    majorBlues: ['1', '2', '♭3', '3', '5', '6', '1'],
    phrygianDominant: ['1', '♭2', '3', '4', '5', '♭6', '♭7', '1'],
    lydianDominant: ['1', '2', '3', '♯4', '5', '6', '♭7', '1'],
    altered: ['1', '♭2', '♭3', '♭4', '♭5', '♭6', '♭7', '1'],
    wholeTone: ['1', '2', '3', '♯4', '♯5', '♭7', '1'],
    wholeHalf: ['1', '2', '♭3', '4', '♭5', '♭6', '6', '7', '1'],
    halfWhole: ['1', '♭2', '♭3', '3', '♯4', '5', '6', '♭7', '1']
  });
  /* 按音级公式拼写：spell('Eb4', ['1', '2', '♭3', …]) → ['Eb4', 'F4', 'Gb4', …]。
     数字决定字母（7 个字母依次排），♭ ♯ 相对同主音大调；最后的 1 为上方八度 */
  const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11], LETTERS = 'CDEFGAB', ACC = {'-2': 'bb', '-1': 'b', 0: '', 1: '#', 2: '##'};
  function spell(tonic, degrees) {
    const t = ChordStage.parse(tonic), base = ChordStage.midiOf(tonic), start = LETTERS.indexOf(t.letter);
    return degrees.map((d, i) => {
      const m = d.match(/^([♭♯]*)(\d)$/), n = Number(m[2]);
      const up = i > 0 && n === 1 ? 1 : 0;
      const index = start + n - 1, letter = LETTERS[index % 7], octave = t.octave + Math.floor(index / 7) + up;
      const target = base + MAJOR_STEPS[n - 1] + 12 * up + [...m[1]].reduce((a, c) => a + (c === '♯' ? 1 : -1), 0);
      return letter + ACC[target - ChordStage.midiOf(letter + octave)] + octave;
    });
  }
  // 一条音阶：scale('D4', 'dorian', {key: 'Dm', labels: true})；labels: true = 写音级公式
  const scale = (tonic, type, opts = {}) => notes(spell(tonic, DEGREES[type]), {...opts, labels: opts.labels === true ? DEGREES[type] : opts.labels || []});

  // 相邻音程（全 / 半）：从一排音的半音数算出
  const STEP_NAME = {1: '半', 2: '全', 3: '小三度'};
  const steps = keys => keys.slice(1).map((k, i) => [i, i + 1, STEP_NAME[ChordStage.midiOf(k) - ChordStage.midiOf(keys[i])] || '']);

  window.ScaleKit = Object.freeze({spell, scale, notes, melody, toggle, onControl, panel, cards, table, circle, lesson, md, C, DEGREES, steps, MARK, FAINT, TONIC});
})();
