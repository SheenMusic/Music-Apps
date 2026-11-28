/* 和弦记号 · 第五课：add、sus、omit 和弦（V2，2026-11-20）
   文字依据 docs/chord-theory/lesson05-v2-draft.md（老师逐页批注后的定稿）。
   讲解区：<strong> = 术语第一次定义（附英文，规范 L28）；accent() = 重点词。文字只讲规律，例子放在演示区（规范 L32）。
   演示区：基础和弦的音用黑色；加进来、换进来的音用红色（ADD）；去掉的音用灰色；变化音用紫色（ALT）。 */
(() => {
  'use strict';
  const {COLOR, chordSymbol: cs, CENTER, PAIR} = ChordStage;
  const FAINT = COLOR.faint, ALT = '#7c3aed', ADD = COLOR.bass, X = COLOR.ext;

  /* ---------- 谱例资料 ---------- */
  const tone = (id, key, extra = {}) => ({id, key, color: COLOR.ink, slot: CENTER, ...extra});
  const sym = (root, suffix = '', slot = CENTER, extra = {}) => ({slot, root, suffix, ...extra});
  const word = (text, slot = CENTER, extra = {}) => ({slot, text, anchor: 'middle', size: 15, ...extra});
  // 一个柱式和弦：notes = [[id, 音, 标签?, 颜色?, 其他?], …]
  const block = (notes, slot = CENTER, prefix = '') =>
    notes.map(([id, key, label = '', color = COLOR.ink, extra = {}]) => tone(prefix + id, key, {slot, label, color, ...extra}));
  const ghost = {mute: true};
  const TRIO = [0.3, 1.55, 2.8];
  const WIDE4 = [0.7, 2.05, 3.4, 4.75];  // scene.wide = 1.45 时的四个位置
  const ROW = i => -0.3 + i * 0.6;
  const C = [['c', 'C4'], ['e', 'E4'], ['g', 'G4']];
  const gone = (id, key) => [id, key, '', FAINT, ghost];  // 去掉的音：灰色、不发声
  const L = (label, color = COLOR.ink) => ({label, color});

  /* ---------- 面板 ---------- */
  const PANEL = {
    symbol: (root, suffix, bass = '') => ({key: `symbol-${root}${suffix}${bass}`, html: `<p class="symbol-row big${(suffix + bass).length > 5 ? ' long' : ''}">${cs(root, suffix, bass)}</p>`}),
    // 对错对照：[[根音, 后缀, ✓/✗/null, 说明?], …]
    judge: list => ({key: 'judge-' + list.map(x => x.join('')).join(), html: '<div class="symbol-judge">' +
      list.map(([r, x, ok, note = '']) => `<p class="${ok === true ? 'is-right' : ok === false ? 'is-wrong' : ''}">${cs(r, x)}` +
        (ok === null ? '' : `<span class="judge-mark">${ok ? '✓' : '✗'}</span>`) + (note ? `<span class="judge-note">${note}</span>` : '') + '</p>').join('') + '</div>'}),
    // 一行一组：[[[根音, 后缀], …], 说明]
    rows: (key, list) => ({key, html: '<div class="symbol-judge">' +
      list.map(([items, note = '']) => `<p>${items.map(([r, x, b = '']) => cs(r, x, b)).join('<span class="judge-sep">　</span>')}${note ? `<span class="judge-note">${note}</span>` : ''}</p>`).join('') + '</div>'}),
    // 同一组音的几种记号（点击播放同一组音）
    readings: {key: 'readings', html: '<div class="symbol-judge">' +
      [['C', '6', ''], ['A', 'm', 'C'], ['E', 'sus4(♯5)', 'C']].map(([r, x, b]) => `<p data-play="C4 E4 A4">${cs(r, x, b)}</p>`).join('') + '</div>'},
    // 番外：尤克里里和弦图（自己画的示意图）
    uke: {key: 'uke', html: '<div class="uke-row">' + [['C', [0, 0, 0, 3]], ['F', [2, 0, 1, 0]], ['G7', [0, 2, 1, 2]]].map(([name, frets]) =>
      `<figure class="uke-box"><figcaption>${name}</figcaption><svg viewBox="0 0 60 74" aria-label="尤克里里 ${name} 和弦图">` +
      '<line x1="10" y1="12" x2="50" y2="12" stroke="#334155" stroke-width="3"/>' +
      [1, 2, 3, 4].map(f => `<line x1="10" y1="${12 + f * 14}" x2="50" y2="${12 + f * 14}" stroke="#94a3b8"/>`).join('') +
      [0, 1, 2, 3].map(k => `<line x1="${10 + k * 13.3}" y1="12" x2="${10 + k * 13.3}" y2="68" stroke="#334155"/>`).join('') +
      frets.map((f, k) => f ? `<circle cx="${10 + k * 13.3}" cy="${12 + f * 14 - 7}" r="4.5" fill="#1e293b"/>` : '').join('') +
      '</svg></figure>').join('') + '</div>'},
    printed: {key: 'printed', html: '<div class="old-chart"><p class="old-symbols">' + ['C', 'Am', 'F', 'G7'].map(x => `<span>${x}</span>`).join('') + '</p><p class="old-staff" aria-hidden="true"></p></div>'},
    fake: {key: 'fake', html: '<div class="old-chart hand"><p class="old-symbols">' + ['C', 'A7', 'Dm', 'B°'].map(x => `<span>${x}</span>`).join('') +
      '</p><p class="old-staff" aria-hidden="true"></p><p class="old-note">B° 实际可能是省略根音的 G7</p></div>'},
    real: {key: 'real', html: '<div class="old-chart hand"><p class="old-symbols">' + ['Dm9', 'G13(♭9)', 'Cmaj9'].map(x => `<span>${x}</span>`).join('') + '</p><p class="old-staff" aria-hidden="true"></p></div>'},
    standard: {key: 'standard', html: '<div class="symbol-judge">' +
      `<p>${['M7', 'Δ7', 'ma7'].map(x => cs('C', x)).join('　')}<span class="judge-note">→</span>${cs('C', 'maj7')}</p>` +
      `<p>${['−', 'mi'].map(x => cs('C', x)).join('　')}<span class="judge-note">→</span>${cs('C', 'm')}</p></div>`},
    timeline: {key: 'timeline', html: '<ol class="timeline">' +
      [['1920s', '尤克里里和弦图'], ['1930s', '乐谱上印出和弦记号'], ['1970s', 'Real Book'], ['1976', '标准化的提案'], ['今天', '几种写法并存']]
        .map(([y, t]) => `<li><b>${y}</b><span>${t}</span></li>`).join('') + '</ol>'}
  };

  /* ---------- 场景 ---------- */
  const SCENE = {
    /* 一、什么是 add、sus、omit 和弦 */
    stacked: {tones: [...block(C, TRIO[0], 'a-'), ...block([...C, ['b', 'Bb4']], TRIO[1], 'b-'), ...block([...C, ['b', 'Bb4'], ['d', 'D5']], TRIO[2], 'c-')],
      staffSymbols: [sym('C', '', TRIO[0], {size: 16}), sym('C', '7', TRIO[1], {size: 16}), sym('C', '9', TRIO[2], {size: 16})], tap: 'chord'},
    kinds: (top = [], bottom = []) => ({tones: [
      ...block([['c', 'C4'], ['d', 'D4', '', ADD], ['e', 'E4'], ['g', 'G4']], TRIO[0], 'a-'),
      ...block([['c', 'C4'], ['f', 'F4', '', ADD], ['g', 'G4']], TRIO[1], 'b-'),
      ...block([['c', 'C4'], gone('e', 'E4'), ['g', 'G4']], TRIO[2], 'c-')],
      staffSymbols: top.map((text, i) => word(text, TRIO[i])),
      staffLabels: bottom.length ? bottom.map((text, i) => ({slot: TRIO[i], text})) : [{slot: TRIO[2], text: '没有三音'}], tap: 'chord'}),
    quartal: {tones: [...block([['c', 'C4'], ['f', 'F4'], ['b', 'Bb4']], PAIR[0], 'l-'), ...block([['c', 'C4'], ['g', 'G4'], ['d', 'D5']], PAIR[1], 'r-')],
      staffSymbols: [sym('C', '7sus4(omit5)', PAIR[0], {size: 14}), sym('C', 'sus2', PAIR[1], {size: 14})],
      staffLabels: [{slot: PAIR[0], text: '四度叠置'}, {slot: PAIR[1], text: '五度叠置'}], tap: 'chord'},
    quizKinds: {tones: [...block([...C, ['d', 'D5']], TRIO[0], 'a-'), ...block([['c', 'C4'], ['f', 'F4'], ['g', 'G4']], TRIO[1], 'b-'), ...block([['c', 'C4'], ['g', 'G4']], TRIO[2], 'c-')],
      staffLabels: ['①', '②', '③'].map((text, i) => ({slot: TRIO[i], text})), tap: 'chord'},

    /* 二、附加音和弦 */
    addVs9: {tones: [...block([...C, ['b', 'Bb4', '7', COLOR.seventh], ['d', 'D5', '9', X]], PAIR[0], 'l-'), ...block([...C, ['d', 'D5', 'add', ADD]], PAIR[1], 'r-')],
      ladders: [{ids: ['l-c', 'l-e', 'l-g', 'l-b', 'l-d']}],
      staffSymbols: [sym('C', '9', PAIR[0], {size: 16}), sym('C', 'add9', PAIR[1], {size: 16})], tap: 'chord'},
    qualities: {wide: 1.45, tones: [
      ...block([['c', 'C4'], ['d', 'D4', '', ADD], ['e', 'E4'], ['g', 'G4']], WIDE4[0], 'a-'),
      ...block([['c', 'C4'], ['e', 'Eb4'], ['g', 'G4'], ['a', 'A4', 'M6', ADD]], WIDE4[1], 'b-'),
      ...block([...C, ['d', 'Db5', '', ALT]], WIDE4[2], 'c-'),
      ...block([...C, ['a', 'Ab4', '', ALT]], WIDE4[3], 'd-')],
      staffSymbols: [['add2'], ['m6'], ['(add♭9)'], ['(♭6)']].map(([x], i) => sym('C', x, WIDE4[i], {size: 14})), tap: 'chord'},
    common: {tones: [
      ...block([['c', 'C4'], ['d', 'D4', '', ADD], ['e', 'E4'], ['g', 'G4']], TRIO[0], 'a-'),
      ...block([...C, ['a', 'A4', '', ADD]], TRIO[1], 'b-'),
      ...block([['c', 'C4', '', FAINT], ['e', 'E4', '', FAINT], ['f', 'F4', '', FAINT], ['g', 'G4', '', FAINT]], TRIO[2], 'c-')],
      staffSymbols: [sym('C', 'add2', TRIO[0], {size: 15}), sym('C', '6', TRIO[1], {size: 15}), sym('C', 'add4', TRIO[2], {size: 15, color: '#94a3b8'})], tap: 'chord'},
    twoNine: {tones: [...block([['c', 'C4'], ['d', 'D4', 'M2', ADD], ['e', 'E4'], ['g', 'G4']], PAIR[0], 'l-'), ...block([...C, ['d', 'D5', 'M9', ADD]], PAIR[1], 'r-')],
      staffSymbols: [sym('C', 'add2', PAIR[0], {size: 16}), sym('C', 'add9', PAIR[1], {size: 16})],
      staffLabels: [{slot: PAIR[0], text: '单音程'}, {slot: PAIR[1], text: '复音程'}], tap: 'chord'},
    addOrNine: {tones: [...block([...C, ['d', 'D5', '', ADD]], PAIR[0], 'l-'), ...block([...C, ['b', 'Bb4', '', COLOR.bass], ['d', 'D5']], PAIR[1], 'r-')],
      staffSymbols: [sym('C', 'add9', PAIR[0], {size: 15}), sym('C', '9', PAIR[1], {size: 15})],
      staffLabels: [{slot: PAIR[0], text: '没有七音'}, {slot: PAIR[1], text: '有七音'}], tap: 'chord'},
    sixVs13: {tones: [...block([...C, ['a', 'A4', '6', ADD]], PAIR[0], 'l-'), ...block([...C, ['b', 'Bb4', '7', COLOR.bass], ['a', 'A5', '13', X]], PAIR[1], 'r-')],
      staffSymbols: [sym('C', '6', PAIR[0], {size: 16}), sym('C', '13', PAIR[1], {size: 16})], tap: 'chord'},
    sixNine: {tones: block([...C, ['a', 'A4', '6', ADD], ['d', 'D5', '9', ADD]]), staffSymbols: [sym('C', '6/9')], tap: 'chord'},
    sixTwo: {tones: block([['c', 'C4'], ['d', 'D4', '9', ADD], ['e', 'E4'], ['g', 'G4'], ['a', 'A4', '6', ADD]]), staffSymbols: [sym('C', '6/9')], tap: 'chord'},
    quizAdd9: {tones: block([...C, ['d', 'D5']]), tap: 'chord'},
    quizE6: {grand: true, wide: 1.45, tones: [
      ['E2', 'G#3', 'E4', 'C#5'], ['E2', 'G#3', 'E4', 'Cn5'], ['E2', 'G#3', 'D4', 'C#5'], ['E2', 'G#3', 'D4', 'Cn5']]
      .flatMap((keys, i) => block(keys.map((key, j) => ['n' + j, key]), WIDE4[i], `q${i}-`)),
      staffLabels: ['A', 'B', 'C', 'D'].map((text, i) => ({slot: WIDE4[i], text})), tap: 'chord'},

    /* 三、挂留音和弦 */
    neighbors: labels => ({tones: [['c', 'C4'], ['d', 'D4', ADD], ['e', 'E4', FAINT], ['f', 'F4', ADD], ['g', 'G4']]
      .map(([id, key, color = COLOR.ink], i) => tone(id, key, {slot: ROW(i), color})),
      staffLabels: labels.flatMap((text, i) => text ? [{slot: ROW(i), text, color: ADD}] : []), tap: 'note'}),
    sus: {tones: block([['c', 'C4'], ['f', 'F4', '', ADD], ['g', 'G4']]), staffSymbols: [sym('C', 'sus')], tap: 'chord'},
    susAlt: {tones: [...block([['c', 'C4'], ['f', 'F4', '', ADD], ['g', 'G4'], ['b', 'Bb4'], ['d', 'Db5', '♭9', ALT]], PAIR[0], 'l-'),
      ...block([['c', 'C4'], ['d', 'D4', '', ADD], ['g', 'G4'], ['f', 'F#5', '♯11', ALT]], PAIR[1], 'r-')],
      staffSymbols: [sym('C', '7sus4(♭9)', PAIR[0], {size: 14}), sym('C', 'sus2(♯11)', PAIR[1], {size: 14})], tap: 'chord'},
    majSus: {tones: block([['c', 'C4'], ['f', 'F4', '', ADD], ['g', 'G4'], ['b', 'B4', 'M7', COLOR.seventh], ['d', 'D5']]), staffSymbols: [sym('C', 'maj9sus4')], tap: 'chord'},
    sus24: {tones: block([['c', 'C4'], ['d', 'D4', '', ADD], ['f', 'F4', '', ADD], ['g', 'G4']]), staffSymbols: [sym('C', 'sus24')], tap: 'chord'},
    quizDsus2: {wide: 1.45, tones: [['D4', 'F#4', 'A4', 'E5'], ['D4', 'G4', 'A4'], ['D4', 'E4', 'A4'], ['D4', 'E4', 'F#4', 'A4']]
      .flatMap((keys, i) => block(keys.map((key, j) => ['n' + j, key]), WIDE4[i], `d${i}-`)),
      staffLabels: ['A', 'B', 'C', 'D'].map((text, i) => ({slot: WIDE4[i], text})), tap: 'chord'},
    quizSus: {tones: block([['c', 'C4'], ['f', 'F4'], ['g', 'G4'], ['b', 'Bb4']]), tap: 'chord'},

    /* 四、根音的选择 */
    cea: (labels = {}, symbol = null, extra = {}) => ({tones: [['c', 'C4'], ['e', 'E4'], ['a', 'A4']].map(([id, key]) => tone(id, key, labels[id] || {})),
      staffSymbols: symbol ? [symbol] : [], tap: 'chord', ...extra}),
    readings: {wide: 1.1, tones: [0, 1, 2].flatMap(i => block([['c', 'C4'], ['e', 'E4'], ['a', 'A4']], TRIO[i], `r${i}-`)),
      staffSymbols: [sym('C', '6', TRIO[0], {size: 14}), sym('A', 'm', TRIO[1], {size: 14, bass: 'C'}), sym('E', 'sus4(♯5)', TRIO[2], {size: 12, bass: 'C'})], tap: 'chord'},
    cMajor: {tones: [...block([['d', 'D4'], ['f', 'F4'], ['g', 'G4'], ['b', 'B4']], PAIR[0], 'l-'), ...block([['c', 'C4'], ['e', 'E4'], ['g', 'G4'], ['a', 'A4']], PAIR[1], 'r-')],
      staffSymbols: [sym('G', '7', PAIR[0], {size: 15, bass: 'D'}), sym('C', '6', PAIR[1], {size: 15})], tap: 'chord'},
    aMinor: {grand: true, tones: [...block([['d', 'D3'], ['b', 'B3'], ['e', 'E4'], ['gs', 'G#4']], PAIR[0], 'l-'), ...block([['c', 'C3'], ['a', 'A3'], ['e', 'E4'], ['a2', 'A4']], PAIR[1], 'r-')],
      staffSymbols: [sym('E', '7', PAIR[0], {size: 15, bass: 'D'}), sym('A', 'm', PAIR[1], {size: 15, bass: 'C'})], tap: 'chord'},
    sus9: {tones: [...block([['c', 'C4'], ['g', 'G4'], ['d', 'D5', '9', ADD]], PAIR[0], 'l-'), ...block([['c', 'C4'], ['f', 'F4', '4', ADD], ['g', 'G4'], ['b', 'Bb4'], ['d', 'D5', '9', X]], PAIR[1], 'r-')],
      staffSymbols: [sym('C', 'sus2', PAIR[0], {size: 15}), sym('C', '9sus4', PAIR[1], {size: 15})], tap: 'chord'},
    quizRoot: {tones: block([['a', 'A4'], ['b', 'B4'], ['e', 'Eb5'], ['g', 'G5']]), tap: 'chord'},

    /* 五、省略音和弦与强力和弦 */
    c13: {tones: [...block([['c', 'C4'], ['e', 'E4'], ['g', 'G4'], ['b', 'Bb4'], ['d', 'D5'], ['f', 'F5'], ['a', 'A5']], PAIR[0], 'l-'),
      ...block([['c', 'C4'], ['e', 'E4'], gone('g', 'G4'), ['b', 'Bb4'], gone('d', 'D5'), gone('f', 'F5'), ['a', 'A5']], PAIR[1], 'r-')],
      staffSymbols: [sym('C', '13', PAIR[0], {size: 15}), sym('C', '13', PAIR[1], {size: 15})],
      staffLabels: [{slot: PAIR[0], text: '完整结构'}, {slot: PAIR[1], text: '最简结构'}], tap: 'chord'},
    dyad: {tones: block([['c', 'C4'], ['e', 'E4'], gone('g', 'G4')]), staffSymbols: [sym('C')], tap: 'chord'},
    m11: {tones: block([['c', 'C4'], ['e', 'Eb4'], ['b', 'Bb4'], gone('d', 'D5'), ['f', 'F5']]), staffSymbols: [sym('C', 'm11')], tap: 'chord'},
    c13min: {tones: block([['c', 'C4'], ['e', 'E4'], ['b', 'Bb4'], gone('d', 'D5'), gone('f', 'F5'), ['a', 'A5']]), staffSymbols: [sym('C', '13')], tap: 'chord'},
    c11: {tones: block([['c', 'C4'], gone('e', 'E4'), ['g', 'G4'], ['b', 'Bb4'], ['d', 'D5'], ['f', 'F5']]), staffSymbols: [sym('C', '11')], tap: 'chord'},
    omitPair: {tones: [...block([['c', 'C4'], ['e', 'E4'], gone('g', 'G4')], PAIR[0], 'l-'), ...block([['c', 'C4'], gone('e', 'E4'), ['g', 'G4'], ['b', 'Bb4']], PAIR[1], 'r-')],
      staffSymbols: [sym('C', '(omit5)', PAIR[0], {size: 15}), sym('C', '7(omit3)', PAIR[1], {size: 15})], tap: 'chord'},
    // 分数和弦：左手 G，右手其余的音；记号从 omit 写法换成分数和弦
    slash: (keys, symbol) => ({grand: true, tones: block([['g', 'G2', '', COLOR.root], ...keys.map((key, i) => ['n' + i, key])]), staffSymbols: symbol ? [symbol] : [], tap: 'chord'}),
    power: {tones: block([['c', 'C4'], ['g', 'G4']]), staffSymbols: [sym('C', '5')], tap: 'chord'},

  };
  const slashPair = (keys, from, to) => SCENE.slash(keys, {slot: CENTER, size: 14, stack: [['G', from, ''], [to[0], to[1], 'G']]});

  const {steps, sections, section, group, quiz, accent, p, TF} = ChordLesson.builder();
  const tapHint = '点击谱例中的音、和弦或标注，可以单独听。';
  const add = t => `<span class="term-add">${t}</span>`;

  // 一、什么是 add、sus、omit 和弦（文字为老师逐句修改的版本）
  section('kinds', '一', '什么是 add、sus、omit 和弦');
  group('kinds', [
    [p(`前几课的和弦，都是从根音开始一个三度一个三度往上叠出来的。`), SCENE.stacked, {hint: tapHint}],
    [p(`还有一些和弦，里面总有音不是按三度叠出来的，而是在基础和弦上直接添加、替换或去掉的。`), SCENE.kinds()],
    [p(`${add('加')}音的和弦叫<strong>附加音和弦（added-note chord，add）</strong>，${add('替换')}音的和弦叫<strong>挂留音和弦（suspended chord，sus）</strong>，${add('删减')}音的和弦叫<strong>省略音和弦（omitted-note chord，omit）</strong>。`),
      SCENE.kinds(['add', 'sus', 'omit'], ['附加音和弦', '挂留音和弦', '省略音和弦'])],
    [p(`现代音乐中用四度、五度叠置出来的和弦，通常也可以用这三类记号写出来。`), SCENE.quartal]
  ]);
  const kindOptions = [['add', 'add 和弦'], ['sus', 'sus 和弦'], ['omit', 'omit 和弦']];
  quiz('kinds', SCENE.quizKinds, {
    question: '谱例中的三个和弦，分别是哪一类和弦？',
    parts: [{label: '①', options: kindOptions, answer: 'add'}, {label: '②', options: kindOptions, answer: 'sus'}, {label: '③', options: kindOptions, answer: 'omit'}],
    right: '正确。① 在 C 上加了 D；② 用 F 替换了三音 E；③ 去掉了三音 E。',
    wrong: '和 C 三和弦（C、E、G）比一比：多了音、换了音，还是少了音？'
  });

  // 二、附加音和弦
  section('add', '二', '附加音和弦（add、6、6/9）');
  group('add', [
    [p(`附加音和弦是在三和弦上直接添加二音、四音或六音形成的；它和延伸音和弦的根本区别在于有没有${accent('七音')}。`), SCENE.addVs9],
    [p(`和延伸音一样，附加的二、四、六音默认是 M2、P4、M6；不是这个性质时，按变化音的写法加上升降号。`), SCENE.qualities],
    [p(`最常见的是附加二音和附加六音；附加四音很少见，遇到时按同样的方法处理。`), SCENE.common],
    [p(`附加二音有 add2、add9 两种写法：add2 强调这个音和根音是${accent('单音程')}，add9 强调是${accent('复音程')}。`), SCENE.twoNine],
    [p(`为了避免和延伸音和弦混淆，附加二音、四音一般都要在标记中写上 add。`), SCENE.addOrNine],
    [p(`附加六音一般不写 add，直接写 6；即使是遇到复音程的排列也不能写成 13，因为 13 表示的是有七音的十三和弦。`), SCENE.sixVs13],
    [p(`二音和六音一起出现时写作 6/9，叫<strong>六九和弦</strong>。`), SCENE.sixNine],
    [p(`通常没有「六二和弦」这种说法和写法，即使二音和根音是单音程，也叫「六九和弦」。`), SCENE.sixTwo]
  ]);
  quiz('add9', SCENE.quizAdd9, {
    question: '谱例中和弦最佳的和弦记号是：',
    options: [['nine', cs('C', '9')], ['add2', cs('C', 'add2')], ['add9', cs('C', 'add9')], ['maj9', cs('C', 'maj9')]], answer: 'add9',
    right: '正确。没有七音，是附加音和弦；D 在根音上方一个八度以外，写 add9。',
    wrong: '和弦里有没有七音？D 和根音是单音程还是复音程？'
  });
  quiz('e6', SCENE.quizE6, {
    question: '谱例中哪一个是 E6 和弦？',
    options: [['a', 'A'], ['b', 'B'], ['c', 'C'], ['d', 'D']], answer: 'a',
    right: '正确。A 是 E、G♯ 加上大六度 C♯，没有七音。B 的六音是小六度；C、D 都有七音 D，是 E13 和 E7(♭13)。',
    wrong: '有没有七音 D？六音是 C♯ 还是 C？'
  });
  quiz('em69', {panel: PANEL.symbol('E', 'm6/9')}, {
    question: 'Em6/9 必须包含哪些音？',
    options: [['c', 'E、G、C、F'], ['b', 'E、G、B、C♯、F♯'], ['d', 'E、G、D、C♯、F♯'], ['a', 'E、G、C♯、F♯']], answer: 'a',
    right: '正确。Em6/9 是小三和弦加 M6、M9；五音按惯例可以省略，没有七音。',
    wrong: '五音是必须的吗？六音、九音默认是什么性质？有七音的话又是什么和弦？'
  });

  // 三、挂留音和弦
  section('sus', '三', '挂留音和弦（sus）');
  group('sus', [
    [p(`挂留音和弦是用三音相邻的二音或四音${accent('替换')}三音形成的，用 sus 标记。`), SCENE.neighbors(['', 'sus2', '', 'sus4', ''])],
    [p(`二音和四音的默认性质也和延伸音一样，为大二度和纯四度。`), SCENE.neighbors(['', 'M2', '', 'P4', ''])],
    [p(`sus4 常常省略标记为 sus。`), SCENE.sus],
    [p(`小二度、增四度不写成 sus；需要这两个音时，按变化音写在括号里。`), SCENE.susAlt],
    [p(`因为三音被替换，所以 sus 和弦${accent('不分大小')}，记号里不写 m。`), {panel: PANEL.judge([['C', 'm7sus4', false], ['C', '7sus4', true]])}],
    [p(`七和弦上的 maj 指的是大七度，和三和弦的大小无关。`), SCENE.majSus],
    [p(`sus 紧跟在 7、9、13 后面，变化音写在后面的括号里。`), {panel: PANEL.rows('sus-order', [[[['C', '7sus4'], ['C', '9sus4'], ['C', '13sus4']]], [[['C', '7sus4(♭9)']]]])}],
    [p(`在极少的情况下，也会遇到同时出现二音和四音的 sus 和弦。`), SCENE.sus24]
  ]);
  quiz('c7sus4', SCENE.quizSus, {
    question: '谱例中和弦最佳的和弦记号是：',
    options: [['c', cs('C', '11')], ['b', cs('C', 'm7sus4')], ['d', cs('C', 'sus4(add7)')], ['a', cs('C', '7sus4')]], answer: 'a',
    right: '正确。F 替换了三音，再加上小七度 B♭：C7sus4。',
    wrong: '三音还在吗？有七音的话，sus 写在哪里？'
  });
  quiz('dsus2', SCENE.quizDsus2, {
    question: '谱例中哪一个是 D 挂二和弦？',
    options: [['a', 'A'], ['b', 'B'], ['c', 'C'], ['d', 'D']], answer: 'c',
    right: '正确。C 用大二度 E 替换了三音 F♯：D、E、A。A 是 Dadd9，B 是 Dsus4，D 是 Dadd2（三音还在）。',
    wrong: 'sus2 是加音，还是换掉三音？三音 F♯ 还在吗？'
  });

  // 四、根音的选择
  section('root', '四', '根音的选择');
  const R = COLOR.root, T3 = COLOR.third;
  group('root', [
    [p(`这个看似简单的和弦，其实可以有好几种合理的标记。`), SCENE.cea()],
    [p(`如果把它看作三度叠置的和弦，它就是 A 小三和弦的第一转位。`), SCENE.cea({a: L('1', R), c: L('3', T3), e: L('5')}, sym('A', 'm', CENTER, {bass: 'C'}))],
    [p(`如果把 C 看作根音，它就是省略了五音的 C6。`), SCENE.cea({c: L('1', R), e: L('3', T3), a: L('6', ADD)}, sym('C', '6'))],
    [p(`如果把 E 看作根音，它还可以是 Esus4(♯5)/C。`), SCENE.cea({e: L('1', R), a: L('4', ADD), c: L('♯5', ALT)}, sym('E', 'sus4(♯5)', CENTER, {bass: 'C', size: 16}))],
    [p(`只看音名的话，大多数和弦都不止一种解释，有的和弦甚至每一个音都可以当作根音。`), SCENE.readings],
    [p(`在实际的音乐中，调会影响和弦音的重心。C 大调会优先把 C 看作根音。`), SCENE.cMajor],
    [p(`A 小调会优先把 A 考虑为根音。`), SCENE.aMinor],
    [p(`如果把 E 看作根音，这个和弦的三音、七音这些关键信息都丢掉了，还多出一个尴尬的变化音：到底写作 ♯5 还是 ♭13？`), SCENE.cea({e: L('1', R), a: L('4', ADD), c: L('♯5 / ♭13？', ALT)}, sym('E', 'sus4(♯5)', CENTER, {bass: 'C', size: 16, color: '#94a3b8'}))],
    [p(`执意把 E 看作根音，是一种成本很高、却没什么收益的分析方案。`), SCENE.cea({e: L('1', R), a: L('4', ADD), c: L('♯5 / ♭13？', ALT)}, sym('E', 'sus4(♯5)', CENTER, {bass: 'C', size: 16, color: '#94a3b8'}))],
    [p(`不管一个和弦有多少种方案，我们总能从中选出最合适的一个记号。`), SCENE.readings],
    [p(`遇到孤立的、没有上下文的和弦，我们会优先让${accent('低音')}承担根音的作用；这个方法在大多数和弦分析中都有效。`), SCENE.cea({c: L('1', R)}, sym('C', '6'))]
  ]);
  quiz('root', SCENE.quizRoot, {
    question: '谱例中的和弦，在没有上下文的时候，应当优先标记为？',
    input: 'A7sus2(b5)',
    checkNotation: ({suffix}) => /^(?:min|m(?!aj)|−)/.test(suffix)
      ? 'sus2 已经用二音替换了三音，请去掉表示小三和弦的 m、min 或减号。'
      : null,
    right: '正确。以低音 A 为根音：B 是 sus2，E♭ 是降五音，G 是小七度：A7sus2(♭5)。',
    wrong: '先让低音 A 当根音，再把每个音的音程标出来。'
  });

  // 五、省略音和弦与强力和弦
  section('omit', '五', '省略音和弦与强力和弦（omit、5）');
  group('omit-rules', [
    [p(`演奏时，和弦里的音常常不会全部弹出来。`), SCENE.c13],
    [p(`哪些音可以省略，乐手之间有一套${accent('约定俗成')}的规则。`), SCENE.c13],
    [p(`纯五度的五音可以省略。`), SCENE.dyad],
    [p(`十一和弦的九音可以省略。`), SCENE.m11],
    [p(`十三和弦的九音和十一音可以省略。`), SCENE.c13min],
    [p(`三音是大三度的十一和弦，三音可以省略。`), SCENE.c11],
    [p(`除此之外的省略，通常会被看作不符合和声规范。`), SCENE.c11],
    [p(`所以，省略音的和弦虽然很常用，但大多都在这些「潜规则」之内；对有经验的乐手来说，记号里不需要专门写出来。`), SCENE.c13]
  ]);
  group('omit', [
    [p(`不过，省略音和弦也有自己的记号 omit，有时也写作 no。`), {panel: PANEL.rows('omit-no', [[[['C', '(omit3)'], ['C', '(no3)']], '意思相同']])}],
    [p(`它主要出现在两种场合。`), SCENE.omitPair],
    [p(`一是提醒演奏者：这个音${accent('一定不要弹')}。`), SCENE.omitPair],
    [p(`二是扒谱或分析时：如实记下规则以外的省略，告诉读谱的人这是有意为之。`), SCENE.omitPair],
    [p(`但 omit 写多了，和弦记号就失去了它的灵活性：精确度比不上五线谱，灵活度又比不上随手写的记号。`), SCENE.omitPair],
    [p(`所以实际分析时，不建议多用 omit，除非真的需要特别提醒。`), SCENE.omitPair]
  ]);
  group('slash', [
    [p(`就连需要明确省略某些音的属七和弦，乐谱上通常也不写 omit，而是换成更好读的${accent('分数和弦')}。`), slashPair(['F4', 'A4', 'C5'], '9sus4(omit5)', ['F', ''])],
    [p(`上方是一个大七和弦时，也是同样的写法。`), slashPair(['F4', 'A4', 'C5', 'E5'], '13sus4(omit5)', ['F', 'maj7'])],
    [p(`省略三音时，上方常常是一个小三和弦。`), slashPair(['D4', 'F4', 'A4'], '9(omit3)', ['D', 'm'])],
    [p(`上方也可以是一个小九和弦。`), slashPair(['D4', 'F4', 'A4', 'C5', 'E5'], '13(omit3)', ['D', 'm9'])],
    [p(`带变化音的属七和弦，也可以这样写。`), slashPair(['F4', 'Ab4', 'C5'], '7sus4(♭9, omit5)', ['F', 'm'])]
  ]);
  group('power', [
    [p(`只有根音和纯五度的和弦，叫<strong>强力和弦（power chord）</strong>，写作 5；它可以看作 omit3 的专用写法。`), SCENE.power],
    [p(`强力和弦没有三音，所以也${accent('不分大小')}。`), {panel: PANEL.judge([['C', '5', true], ['C', 'm5', false]])}]
  ]);
  quiz('slash', SCENE.slash(['F4', 'A4', 'C5'], null), {
    question: '谱例中的和弦：',
    parts: [
      {label: '① 可以用斜线和弦写作', options: [['b', cs('F', 'maj7', 'G')], ['a', cs('F', '', 'G')], ['d', cs('G', '7sus4')], ['c', cs('D', 'm', 'G')]], answer: 'a'},
      {label: '② 用 omit 记号可以写作', options: [['b', cs('G', '9(omit5)')], ['c', cs('G', '7sus4(omit5)')], ['a', cs('G', '9sus4(omit5)')], ['d', cs('G', '9sus2(omit5)')], ['e', cs('G', '11sus2(omit5)')]], answer: ['a', 'e']}],
    right: '正确。G 上方是 F、A、C：可以看作 G9sus4(omit5)（C 是挂留四音），也可以看作 G11sus2(omit5)（A 是挂留二音、C 是十一音）；更好读的写法是 F/G。',
    wrong: '先看左手的 G 是根音，再把右手每个音和 G 的音程标出来。'
  });
  quiz('c5', {panel: PANEL.symbol('C', '(omit3)')}, {
    question: 'C(omit3) 也可以写作：',
    options: [['sus2', cs('C', 'sus2')], ['no3', cs('C', '(no3)')], ['m', cs('C', 'm')], ['five', cs('C', '5')]], answer: ['no3', 'five'],
    right: '正确。no 和 omit 意思相同；只剩根音和五音，也就是强力和弦 C5。',
    wrong: '去掉三音之后，还剩哪几个音？omit 还可以写成什么？'
  });

  // 六、有歧义的标记
  section('ambiguous', '六', '有歧义的标记');
  group('ambiguous', [
    [p(`和弦记号不像五线谱那样严格限定音的具体排列，这给了音乐更多自由发挥的空间。`), {panel: PANEL.rows('amb-intro', [[[['C', '2'], ['C', '4'], ['C', '△'], ['C', '−7(−9)']]]])}],
    [p(`但这种自由的代价是，很多写法至今没有形成统一的规范，有些记号是多余的，有些甚至会引起歧义，所以我们在写和弦记号时，最好避开这些写法。`), {panel: PANEL.rows('amb-intro', [[[['C', '2'], ['C', '4'], ['C', '△'], ['C', '−7(−9)']]]])}],
    [p(`最常见的一种歧义写法是过于${accent('简略')}：在音名后面只写一个数字。`), {panel: PANEL.rows('amb-number', [[[['C', '2']], '？'], [[['C', '4']], '？']])}],
    [p(`二音和四音都是三音的邻音，既可能是附加上去的，也可能是替换三音的，所以要写清楚是 add 还是 sus。`), {panel: PANEL.rows('amb-24', [[[['C', '2']], '→ Cadd2（有三音）或 Csus2（没有三音）'], [[['C', '4']], '→ Cadd4 或 Csus4']])}],
    [p(`与之相反的是写得${accent('多余')}：比如十一和弦里的九音本来就可以省略，就不必再写 add。`), {panel: PANEL.judge([['C', 'm7(add11)', null, '→'], ['C', 'm11', true]])}],
    [p(`另一类歧义来自符号本身：同一个 − 或 +，写在根音后面表示小三和弦或增三和弦，写在数字前面却表示降低或升高。`), {panel: PANEL.rows('amb-sign', [[[['C', '−'], ['C', '7(−9)']]], [[['C', '+'], ['C', '7(+9)']]]])}],
    [p(`△ 单独写时，有人读成大三和弦，有人读成大七和弦；手写的 m 和 M、ø 和 °，也很容易看混。`), {panel: PANEL.rows('amb-look', [[[['C', '△'], ['C', '△7']]], [[['C', 'M7'], ['C', 'm7']]], [[['C', 'ø7'], ['C', '°7']]]])}],
    [p(`所以更建议尽量用 m、maj7、♭、♯ 这些不容易看错的写法。`), {panel: PANEL.rows('amb-ours', [[[['C', 'm7'], ['C', 'maj7'], ['C', '7(♭9)'], ['C', '7(♯9)']]]])}],
    [p(`sus9 这种写法，不管怎么解释都有歧义：它可以理解成强调复音程排列的 sus2，也可以理解成属九和弦挂四；实际应用时，建议用更规范的写法。`), SCENE.sus9],
  ]);
  quiz('c2', {panel: PANEL.symbol('C', '2')}, {
    question: 'C2 可能是什么和弦？',
    options: [['add2', cs('C', 'add2')], ['sus2', cs('C', 'sus2')], ['nine', cs('C', '9')]], answer: ['add2', 'sus2'],
    right: '正确。2 可能是附加的二音（有三音），也可能替换了三音（没有三音）；9 和弦有七音，不会写成 C2。',
    wrong: '二音是三音的邻音：它可能是加上去的，也可能是换掉三音的。'
  });
  quiz('minus', {panel: PANEL.symbol('C', '−7(−9)')}, {
    question: 'C−7(−9) 里的两个「−」分别表示：',
    options: [['a', '小三度、降低'], ['b', '降低、降低'], ['c', '小三度、小三度']], answer: 'a',
    right: '正确。写在根音后面的「−」表示小三和弦，写在 9 前面的「−」表示降低：Cm7(♭9)。',
    wrong: '同一个符号，写在根音后面和写在数字前面，意思一样吗？'
  });
  quiz('sus9', {panel: PANEL.symbol('C', 'sus9')}, {
    question: 'Csus9 可能表示：',
    options: [['sus2', 'Csus2（九音在高八度）'], ['9sus4', cs('C', '9sus4')], ['nine', cs('C', '9')], ['add9', cs('C', 'add9')]], answer: ['sus2', '9sus4'],
    right: '正确。sus9 有两种理解：强调九度排列的 sus2，或 9sus4 的简写；按上下文判断。',
    wrong: 'sus 表示三音被替换了，所以带三音的和弦都不对。'
  });

  ChordLesson.run({
    steps, sections, quizLockHint: true,
    quizExtras: true, tapParts: true,  // Quiz 答对前不显示演示区说明、反馈滚进可见范围、完成页的一次答对小结；点击发声（N23）
    inputLevel: 5,
    preload: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'B4', 'D5', 'Db5', 'F5', 'A5', 'Eb4', 'Ab4', 'F#5', 'Eb5', 'G5', 'G2', 'C5', 'E5', 'E2', 'E3', 'G#3', 'C#4', 'C#5', 'D3', 'B3', 'G#4', 'C3', 'A3']
  });
})();
