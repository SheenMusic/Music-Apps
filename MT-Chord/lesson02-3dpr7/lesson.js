/* 和弦记号 · 第二课：七和弦（初稿，2026-11-03）
   文字依据老师的 PDF 课件「02和弦标记_七和弦_课件」，按第一课的节奏一步一句改写；待老师逐节审核。
   讲解区：<strong> = 音乐术语；accent() = 重点词；warn() = 「注意」。
   Quiz 的 reveal：答对后在谱例上方用黑色印刷体写出答案的和弦记号。
   演示区：所有谱例共用一个舞台，步骤之间用“神奇移动”过渡。规则见 docs/interactive-theory-lesson-standard.md。 */
(() => {
  'use strict';
  const {COLOR, chordSymbol: cs, CENTER, PAIR} = ChordStage;

  /* ---------- 谱例资料 ---------- */
  const ROLE = ['root', 'third', 'fifth', 'seventh'];
  const ROLE_COLOR = [COLOR.root, COLOR.third, COLOR.fifth, COLOR.seventh];
  const ROLE_LABEL = ['1', '3', '5', '7'];
  // 八种七和弦（根音 C）：[中文名, 英文名, 常用缩写, 专属符号, 和弦音, 三和弦性质, 七度]
  const SEVENTH = {
    maj7:  {name: '大七和弦', en: 'Major 7th', abbr: 'maj7', sign: '△7', keys: ['C4','E4','G4','B4'], triad: '大三和弦', seventh: '大七度（M7）'},
    m7:    {name: '小七和弦', en: 'Minor 7th', abbr: 'm7', sign: '−7', keys: ['C4','Eb4','G4','Bb4'], triad: '小三和弦', seventh: '小七度（m7）'},
    dom7:  {name: '大小七和弦（属七和弦）', en: 'Dominant 7th', abbr: '7', sign: '7', keys: ['C4','E4','G4','Bb4'], triad: '大三和弦', seventh: '小七度（m7）'},
    dim7:  {name: '减七和弦', en: 'Diminished 7th', abbr: 'dim7', sign: '°7', keys: ['C4','Eb4','Gb4','Bbb4'], triad: '减三和弦', seventh: '减七度（d7）'},
    half:  {name: '减小七和弦（半减七和弦）', en: 'Half-diminished 7th', abbr: 'm7(♭5)', sign: 'ø7', keys: ['C4','Eb4','Gb4','Bb4'], triad: '减三和弦', seventh: '小七度（m7）'},
    mM7:   {name: '小大七和弦', en: 'Minor major 7th', abbr: 'm(maj7)', sign: '−△7', keys: ['C4','Eb4','G4','B4'], triad: '小三和弦', seventh: '大七度（M7）'},
    aug7:  {name: '增小七和弦（增七和弦）', en: 'Augmented 7th', abbr: '7(♯5)', sign: '+7', keys: ['C4','E4','G#4','Bb4'], triad: '增三和弦', seventh: '小七度（m7）'},
    augM7: {name: '增大七和弦', en: 'Augmented major 7th', abbr: 'maj7(♯5)', sign: '△7(♯5)', keys: ['C4','E4','G#4','B4'], triad: '增三和弦', seventh: '大七度（M7）'}
  };
  const tone = (id, key, color = COLOR.ink, label = '', slot = CENTER) => ({id, key, color, label, slot});
  // 一个七和弦：和弦音 id 固定为 root / third / fifth / seventh（加前缀区分同一谱面上的几个和弦）
  const chord = (keys, slot = CENTER, prefix = '', colored = false) =>
    keys.map((k, i) => tone(prefix + ROLE[i], k, colored ? ROLE_COLOR[i] : COLOR.ink, colored ? ROLE_LABEL[i] : '', slot));
  const sym = (root, suffix = '', slot = CENTER, extra = {}) => ({slot, root, suffix, ...extra});
  const stack = (...list) => ({slot: CENTER, stack: list});
  const CORE = ['maj7', 'm7', 'dom7', 'dim7'], OTHER = ['half', 'mM7', 'aug7', 'augM7'];
  const QUAD = [0.5, 1.45, 2.4, 3.3];  // 四个和弦并列（第一个离谱号远一些，留出变音记号的位置）

  /* ---------- 面板（不需要谱表的步骤） ---------- */
  const PANEL = {
    stackLine: {key: 'stack-line', html: '<p class="symbol-row">1 → 3 → 5 → <b class="c-seventh">7</b></p>'},
    formula: {key: 'formula', html: '<p class="symbol-row">三和弦性质 ＋ <b class="c-seventh">七度性质</b></p>'},
    // 七和弦对照表（演示区一次放得下四行）：rows = 哪几种；highlight = 要突出的几行
    table: (rows, highlight = []) => ({key: 'table-' + rows.join() + '-' + highlight.join(), html:
      '<div class="compare-table" role="table" aria-label="七和弦的常见记号">' +
      '<div class="compare-row compare-head" role="row"><span role="columnheader">名称</span><span role="columnheader">英文缩写</span><span role="columnheader">专属符号</span></div>' +
      rows.map(id => [id, SEVENTH[id]]).map(([id, q]) => `<div class="compare-row${highlight.length && !highlight.includes(id) ? ' is-dim' : ''}" role="row"><span role="cell">${q.name.replace(/（.*）/, '')}</span><span role="cell">${cs('C', q.abbr)}</span><span role="cell">${cs('C', q.sign)}</span></div>`).join('') +
      '</div>'}),
    symbol: (root, suffix, bass = '') => ({key: `symbol-${root}${suffix}${bass}`, html: `<p class="symbol-row big">${cs(root, suffix, bass)}</p>`})
  };

  /* ---------- 场景 ---------- */
  const SCENE = {
    build: [
      {tones: chord(SEVENTH.maj7.keys.slice(0, 3)), caption: 'C–E–G　三和弦'},
      {tones: chord(SEVENTH.maj7.keys, CENTER, '', true), caption: '再叠一个三度：<b class="c-seventh">B</b>', play: true}
    ],
    seventhInterval: {tones: [tone('root','C4',COLOR.root,'1'), tone('third','E4',COLOR.faint), tone('fifth','G4',COLOR.faint), tone('seventh','B4',COLOR.seventh,'7')], caption: 'C → B：<b class="c-seventh">七度</b>'},
    quality: id => ({tones: chord(SEVENTH[id].keys, CENTER, '', true), staffSymbols: [sym('C', SEVENTH[id].abbr)], caption: `${SEVENTH[id].triad} ＋ <b class="c-seventh">${SEVENTH[id].seventh}</b>`, play: true}),
    core: {tones: ['maj7','m7','dom7','dim7'].flatMap((id, i) => chord(SEVENTH[id].keys, QUAD[i], i ? id + '-' : '')), staffSymbols: ['maj7','m7','dom7','dim7'].map((id, i) => sym('C', SEVENTH[id].abbr, QUAD[i], {size: 14}))},
    rare: {tones: ['half','mM7','aug7','augM7'].flatMap((id, i) => chord(SEVENTH[id].keys, QUAD[i], id + '-')), staffSymbols: ['half','mM7','aug7','augM7'].map((id, i) => sym('C', SEVENTH[id].sign, QUAD[i], {size: 14}))},
    plain: id => ({tones: chord(SEVENTH[id].keys)}),
    // C7 与 Cmaj7：七音不同
    sevenVsMaj: {tones: [...chord(SEVENTH.dom7.keys, PAIR[0], 'a-'), ...chord(SEVENTH.maj7.keys, PAIR[1])].map(t => /seventh$/.test(t.id) ? {...t, color: COLOR.seventh} : t),
      staffSymbols: [sym('C', '7', PAIR[0]), sym('C', 'maj7', PAIR[1])], caption: '<b class="c-seventh">B♭</b> 与 <b class="c-seventh">B</b>：七音不同'},
    minusVsDim: {tones: [...chord(SEVENTH.m7.keys, PAIR[0], 'a-'), ...chord(SEVENTH.dim7.keys, PAIR[1])],
      staffSymbols: [sym('C', '−7', PAIR[0]), sym('C', '°7', PAIR[1])], caption: '−7 是小七和弦；°7 才是减七和弦'},
    halfSpellings: {tones: chord(SEVENTH.half.keys), staffSymbols: [stack(['C','ø7'], ['C','m7(♭5)'])], caption: '两种写法 · 同一组音'},
    augSpellings: {tones: chord(SEVENTH.aug7.keys), staffSymbols: [stack(['C','+7'], ['C','7(♯5)'])], caption: '两种写法 · 同一组音'},
    derive: count => ({
      tones: [tone('root','D4',COLOR.root,'1'), tone('third','F4',COLOR.third,'m3'), tone('fifth','A4',COLOR.fifth,'P5'), tone('seventh','C5',COLOR.seventh,'m7')].slice(0, count),
      staffSymbols: [sym('D', 'm7')],
      caption: ['根音、后缀、七度', '<b class="c-root">根音 D</b>', '<b class="c-third">m</b>：小三和弦 → D–F–A', '<b class="c-seventh">7</b>：小七度 → C', 'D–F–A–C'][count],
      play: count > 0
    }),
    // 转位：低音为三音、五音、七音
    // 原位与三种转位并列；每个和弦最低的音（低音）标红
    inversions: {tones: [
      [['C4','E4','G4','Bb4'], ['root','third','fifth','seventh']],
      [['E4','G4','Bb4','C5'], ['third','fifth','seventh','root']],
      [['G4','Bb4','C5','E5'], ['fifth','seventh','root','third']],
      [['Bb3','C4','E4','G4'], ['seventh','root','third','fifth']]
    ].flatMap(([keys, roles], n) => keys.map((k, i) => tone((n ? 'inv' + n + '-' : '') + roles[i], k, i === 0 ? COLOR.bass : COLOR.ink, '', QUAD[n]))),
      staffSymbols: ['', 'E', 'G', 'B♭'].map((bass, n) => sym('C', '7', QUAD[n], {bass, size: 13}))},
    slashTriad: {tones: [tone('seventh','F3',COLOR.bass), tone('root','G3'), tone('third','B3'), tone('fifth','D4')], staffSymbols: [stack(['G','','F'], ['G','7','F'])], caption: 'G/F ＝ G7/F：低音 F 就是 G7 的七音'},
    enharmonic: {tones: [tone('root','E4'), tone('third','G#4'), tone('fifth','C5',COLOR.fifth), tone('seventh','D5')], staffSymbols: [sym('E', '+7')], caption: '五音本来是 <b>B♯</b>，常写成同音的 <b class="c-fifth">C</b>'}
  };

  /* ---------- 讲解与 Quiz ---------- */
  const {steps, sections, section, group, quiz, accent, p, warn, TF} = ChordLesson.builder();

  // 一、七和弦的构成
  section('build', '一', '七和弦的构成');
  group('build', [
    [p(`<strong>七和弦（Seventh Chord）</strong>是由${accent('四个音')}按照三度关系叠置而成的和弦。`), SCENE.build, {sequence: 900}],
    [p(`也可以理解为：在三和弦上方，再叠一个与根音成${accent('七度')}的音，称为<strong>七音（7th）</strong>。`), SCENE.seventhInterval]
  ]);
  quiz('count', SCENE.plain('dom7'), {
    question: '七和弦由几个音组成？',
    options: [['3','三个'], ['4','四个'], ['7','七个']], answer: '4',
    right: '正确。七和弦是根音、三音、五音、七音四个音；「七」说的是七音与根音的音程。',
    wrong: '「七」不是音的个数。数一数谱例里的音。'
  });

  // 二、七和弦的性质
  section('quality', '二', '七和弦的性质');
  group('formula', [
    [p(`七和弦的性质，可以用「${accent('三和弦性质 ＋ 七度性质')}」来描述。`), {panel: PANEL.formula}],
    [p(`例如<strong>大小七和弦</strong>：大三和弦，加上与根音成${accent('小七度')}的七音。`), SCENE.quality('dom7')]
  ]);
  group('qualities', [
    [p(`<strong>大七和弦</strong>：大三和弦 ＋ 大七度。三和弦与七度的性质相同时，名称${accent('合并成一个字')}。`), SCENE.quality('maj7')],
    [p(`<strong>小七和弦</strong>：小三和弦 ＋ 小七度。`), SCENE.quality('m7')],
    [p(`<strong>减七和弦</strong>：减三和弦 ＋ 减七度。`), SCENE.quality('dim7')],
    [p(`<strong>减小七和弦</strong>：减三和弦 ＋ 小七度，也叫<strong>半减七和弦</strong>。`), SCENE.quality('half')],
    [p(`<strong>小大七和弦</strong>：小三和弦 ＋ 大七度。`), SCENE.quality('mM7')],
    [p(`<strong>增小七和弦</strong>：增三和弦 ＋ 小七度，简称${accent('增七和弦')}（理论上不存在「增增七和弦」）。`), SCENE.quality('aug7')],
    [p(`<strong>增大七和弦</strong>：增三和弦 ＋ 大七度。`), SCENE.quality('augM7')]
  ]);
  group('core', [
    [p(`实用的七和弦一共${accent('八种')}。最核心的是大七、小七、大小七、减七与半减七。`), SCENE.core],
    [p(`小大七、增七和增大七${accent('比较少见')}，是现代音乐里慢慢多起来的「新角色」。`), SCENE.rare]
  ]);
  quiz('dom-formula', SCENE.plain('dom7'), {
    question: '谱例中的七和弦是：',
    options: [['maj7','大七和弦'], ['dom7','大小七和弦'], ['m7','小七和弦']], answer: 'dom7',
    right: '正确。C–E–G 是大三和弦，C 到 B♭ 是小七度：大小七和弦。',
    wrong: '先判断三和弦，再算根音到七音的音程。',
    reveal: [sym('C', '7')]
  });
  quiz('half-formula', SCENE.plain('half'), {
    question: '谱例中的七和弦是：',
    options: [['dim7','减七和弦'], ['half','半减七和弦'], ['m7','小七和弦']], answer: 'half',
    right: '正确。C–E♭–G♭ 是减三和弦，C 到 B♭ 是小七度：减小七和弦，也就是半减七和弦。',
    wrong: '三和弦是减三和弦。七度是减七度还是小七度？',
    reveal: [sym('C', 'ø7')]
  });

  // 三、七和弦的标记
  section('symbols', '三', '七和弦的标记');
  group('number', [
    [p(`七和弦的标记和三和弦类似：在性质后面加上数字 ${accent('7')}。`), {panel: PANEL.table(CORE)}],
    [p(`<strong>大七和弦</strong>写作 ${accent('maj7')}、M7 或 △7。`), {panel: PANEL.table(CORE, ['maj7'])}],
    [p(`<strong>小七和弦</strong>写作 ${accent('m7')}、min7 或 −7。`), {panel: PANEL.table(CORE, ['m7'])}],
    [p(`<strong>大小七和弦</strong>常被称为<strong>属七和弦</strong>，直接用一个 ${accent('7')} 表示。`), {panel: PANEL.table(CORE, ['dom7'])}],
    [p(`<strong>减七和弦</strong>写作 ${accent('°7')} 或 dim7。`), {panel: PANEL.table(CORE, ['dim7'])}]
  ]);
  group('seven-alone', [
    [warn(`单独的 7 表示${accent('小七度')}：C7 的七音是 B♭，不是 B。`), SCENE.sevenVsMaj],
    [warn(`「−」仍然表示${accent('小')}：−7 是小七和弦，不是减七和弦。`), SCENE.minusVsDim]
  ]);
  quiz('c7', {panel: PANEL.symbol('C', '7')}, {
    question: 'C7 的七音是：',
    options: [['B','B'], ['Bb','B♭'], ['Bbb','B𝄫']], answer: 'Bb',
    right: '正确。单独的 7 是小七度：C7 = C–E–G–B♭。',
    wrong: '单独的 7 是大七度还是小七度？'
  });
  group('altered-names', [
    [p(`半减七和弦常写作 ${accent('ø7')}（从 ° 变化而来）；它也等于降低五音的小七和弦，写作 ${accent('m7(♭5)')}。`), SCENE.halfSpellings],
    [p(`增七和弦写作 +7 或 aug7，更常见的写法是突出变化音的 ${accent('7(♯5)')}。`), SCENE.augSpellings],
    [p(`小大七和弦写作 m(maj7) 或 −△7；增大七和弦写作 maj7(♯5) 或 △7(♯5)。`), {panel: PANEL.table(OTHER, ['mM7','augM7'])}],
    [p(`这几个和弦的标记，${accent('更常用能突出变化音')}的写法；括号里的变化音，第四课还会详细学习。`), {panel: PANEL.table(OTHER)}]
  ]);
  quiz('dash7', {panel: PANEL.symbol('C', '−7')}, {
    question: 'C−7 是：',
    options: [['m7','C 小七和弦'], ['dim7','C 减七和弦'], ['half','C 半减七和弦']], answer: 'm7',
    right: '正确。「−」表示小：C−7 = Cm7 = C–E♭–G–B♭。',
    wrong: '「−」在和弦记号里表示什么性质？'
  });
  quiz('half-same', SCENE.halfSpellings, {
    question: 'Cø7 和 Cm7(♭5) 表示的是同一个和弦。',
    options: TF, answer: 'true',
    right: '正确。都是 C–E♭–G♭–B♭：小七和弦降低五音，就是半减七和弦。',
    wrong: '把 Cm7 的五音 G 降半音，会得到哪个和弦？'
  });

  // 四、根据记号推导和弦音
  section('derive', '四', '根据记号推导和弦音');
  group('derive', [
    [p(`推导七和弦，比三和弦多${accent('一步')}：识别根音、识别三和弦性质，再确定七度。`), SCENE.derive(0)],
    [p(`第一步：识别<strong>根音</strong>。`), SCENE.derive(1)],
    [p(`第二步：识别三和弦性质，构建三音与五音。`), SCENE.derive(3)],
    [p(`第三步：看 7 前面有没有 maj，在根音上方构建${accent('七音')}。`), SCENE.derive(4)]
  ]);
  quiz('ebmaj7', {panel: PANEL.symbol('E♭', 'maj7')}, {
    question: 'E♭maj7 的和弦音是：',
    options: [['right','E♭–G–B♭–D'], ['dom','E♭–G–B♭–D♭'], ['minor','E♭–G♭–B♭–D']], answer: 'right',
    right: '正确。大三和弦 E♭–G–B♭，加大七度 D。',
    wrong: 'maj7：大三和弦 ＋ 大七度。'
  });
  quiz('bdim7', {panel: PANEL.symbol('B', '°7')}, {
    question: 'B°7 的和弦音是：',
    options: [['right','B–D–F–A♭'], ['half','B–D–F–A'], ['minor','B–D–F♯–A']], answer: 'right',
    right: '正确。减三和弦 B–D–F，加减七度 A♭。',
    wrong: '°7：减三和弦 ＋ 减七度（比小七度再低半音）。'
  });

  // 五、七和弦的转位与斜线记号
  section('inversion', '五', '七和弦的转位');
  group('inversion', [
    [p(`七和弦有四个音，所以除了原位，还有${accent('三种转位')}：低音分别是三音、五音、七音。`), SCENE.inversions],
    [p(`转位的写法和三和弦一样：斜线左边写和弦，右边写${accent('低音')}。`), SCENE.inversions]
  ]);
  group('slash-triad', [
    [p(`偶尔也会看到用「三和弦/低音」写七和弦：G/F 与 G7/F 都表示${accent('低音为 F 的 G7')}。`), SCENE.slashTriad],
    [p(`C/A 则是 Am7：低音 A 是根音，上方的 C–E–G 是它的三音、五音、七音。`), {panel: PANEL.symbol('C', '', 'A')}]
  ]);
  quiz('inv-bass', {panel: PANEL.symbol('C', '7', 'B♭')}, {
    question: 'C7/B♭ 的低音是和弦的：',
    options: [['third','三音'], ['fifth','五音'], ['seventh','七音']], answer: 'seventh',
    right: '正确。B♭ 是 C7 的七音，这是第三转位。',
    wrong: 'C7 的四个音是 C–E–G–B♭。B♭ 是第几个？'
  });

  // 六、等音记谱
  section('enharmonic', '六', '等音记谱');
  group('enharmonic', [
    [p(`和弦记号对应到五线谱时，为了少写变音记号或顺应和声倾向，有时会用${accent('等音')}代替。`), SCENE.enharmonic],
    [p(`例如 E 增七和弦的五音本来是 B♯，谱面上常写成 C。读谱时要按${accent('和弦结构')}理解，不被拼写带偏。`), SCENE.enharmonic]
  ]);
  quiz('enharmonic', SCENE.enharmonic, {
    question: '谱例中的 C，在 E+7 里实际担任的是：',
    options: [['fifth','五音（B♯ 的等音）'], ['sixth','六音'], ['root','根音']], answer: 'fifth',
    right: '正确。E+7 = E–G♯–B♯–D，C 是 B♯ 的等音写法。',
    wrong: 'E 增三和弦的五音是增五度。E 往上增五度是哪个音？'
  });

  ChordLesson.run({
    steps, sections,
    preload: ['C4','E4','G4','B4','Eb4','Gb4','Bb4','G#4','A4','D4','F4','C5','E5','Bb3','F3','G3','B3','D5','Ab4']
  });
})();
