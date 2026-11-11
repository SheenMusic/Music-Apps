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
  const ROW4 = [0.25, 1.2, 2.15, 3.05];  // 四个转位并列：整体在谱表上居中（记号不写在谱面上，点按钮时才写，免得挤出画面）
  const EIGHT = ['dom7', 'maj7', 'm7', 'dim7', 'half', 'mM7', 'aug7', 'augM7'].map(id => [id, SEVENTH[id].name.replace(/（.*）/, '').replace('和弦', '')]);
  const formulaOf = id => `${SEVENTH[id].name.replace(/（.*）/, '')} ＝ ${SEVENTH[id].triad} ＋ <b class="c-seventh">${SEVENTH[id].seventh.replace(/（.*）/, '')}</b>`;
  const INVERSIONS = [
    [['C4','E4','G4','Bb4'], ['root','third','fifth','seventh']],
    [['E4','G4','Bb4','C5'], ['third','fifth','seventh','root']],
    [['G4','Bb4','C5','E5'], ['fifth','seventh','root','third']],
    [['Bb3','C4','E4','G4'], ['seventh','root','third','fifth']]
  ];
  const INV_BASS = ['', 'E', 'G', 'B♭'], INV_NAMES = ['原位', '第一转位', '第二转位', '第三转位'];

  /* ---------- 面板（不需要谱表的步骤） ---------- */
  const PANEL = {
    stackLine: {key: 'stack-line', html: '<p class="symbol-row">1 → 3 → 5 → <b class="c-seventh">7</b></p>'},
    formula: {key: 'formula', html: '<p class="formula-row">三和弦的性质 ＋ <b class="c-seventh">根音到七音的音程</b></p>'},
    // 名称合并：大＋大七 → 大七（rows = 显示到第几行）
    merge: rows => ({key: 'merge-' + rows, html: '<div class="merge-list">' +
      [['大', '大', '大'], ['小', '小', '小'], ['减', '减', '减']].slice(0, rows)
        .map(([t, s7, name]) => `<p><span>${t}三和弦 ＋ ${s7}七度</span><span class="arrow">→</span><span class="merge-from">${t}${s7}七</span><span class="arrow">→</span><b>${name}七和弦</b></p>`).join('') + '</div>'}),
    // 八种七和弦的记号：核心五种一行，少见三种一行
    groups: {key: 'groups', html: '<div class="symbol-groups">' +
      `<p><span class="group-name">核心</span>${['maj7', 'm7', '7', '°7', 'ø7'].map(x => cs('C', x)).join('　')}</p>` +
      `<p class="is-rare"><span class="group-name">少见</span>${['m(maj7)', '+7', 'maj7(♯5)'].map(x => cs('C', x)).join('　')}</p></div>`},
    // 规范写法与好读的写法（实际演奏谱）
    readable: {key: 'readable', html: '<div class="compare-table" role="table" aria-label="斜线后的低音：规范写法与好读的写法" style="--cols: 1fr 1fr">' +
      '<div class="compare-row compare-head" role="row"><span role="columnheader">规范写法</span><span role="columnheader">好读的写法</span></div>' +
      [['E♭', '°7', 'D𝄫', 'C'], ['B♭', '°7', 'A𝄫', 'G'], ['G♭', '7', 'F♭', 'E']]
        .map(([r, x, strict, easy]) => `<div class="compare-row" role="row"><span role="cell">${cs(r, x, strict)}</span><span role="cell">${cs(r, x, easy)}</span></div>`).join('') + '</div>'},
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
    // 「这个音称为七音」：七音的标签放大
    seventhNamed: {tones: [tone('root','C4',COLOR.root,'1'), tone('third','E4',COLOR.faint), tone('fifth','G4',COLOR.faint), {...tone('seventh','B4',COLOR.seventh,'7'), labelScale: 1.9}], caption: '<b class="c-seventh">七音（Seventh）</b>'},
    // 演示区下方写成「大小七和弦 ＝ 大三和弦 ＋ 小七度」
    quality: id => ({tones: chord(SEVENTH[id].keys, CENTER, '', true), staffSymbols: [sym('C', SEVENTH[id].abbr)], caption: formulaOf(id), play: true}),
    // 八种七和弦：点按钮比较
    pick: id => ({...SCENE.quality(id), controls: EIGHT, pressed: id}),
    // 减七与半减七：相邻两个音之间的三度（半减七最上面是大三度）
    dimVsHalf: {tones: [
      ...[['C4', ''], ['Eb4', 'm3'], ['Gb4', 'm3'], ['Bbb4', 'm3']].map(([k, l], i) => ({...tone('a-' + ROLE[i], k, COLOR.ink, l, PAIR[0]), labelColor: COLOR.faint})),
      ...[['C4', ''], ['Eb4', 'm3'], ['Gb4', 'm3'], ['Bb4', 'M3']].map(([k, l], i) => ({...tone(ROLE[i], k, i === 3 ? COLOR.seventh : COLOR.ink, l, PAIR[1]), labelColor: i === 3 ? COLOR.seventh : COLOR.faint}))],
      staffSymbols: [sym('C', '°7', PAIR[0], {size: 15}), sym('C', 'ø7', PAIR[1], {size: 15})],
      caption: '左：全是小三度　右：最上面一个是<b class="c-seventh">大三度</b>', play: true},
    // 增七和弦从属七和弦来：五音 G 升高半音
    augFromDom: [
      {tones: chord(SEVENTH.dom7.keys, CENTER, '', true), staffSymbols: [sym('C', '7')], caption: '大小七和弦（属七和弦）'},
      {tones: chord(SEVENTH.aug7.keys, CENTER, '', true), staffSymbols: [sym('C', '7(♯5)')], caption: '五音 G 升高半音 → <b class="c-fifth">G♯</b>', play: true}
    ],
    augVsAugMaj: {tones: [...chord(SEVENTH.aug7.keys, PAIR[0], 'a-'), ...chord(SEVENTH.augM7.keys, PAIR[1])].map(t => /seventh$/.test(t.id) ? {...t, color: COLOR.seventh} : t),
      staffSymbols: [sym('C', '+7', PAIR[0], {size: 15}), sym('C', '+maj7', PAIR[1], {size: 15})], caption: '单独的 7 = <b class="c-seventh">B♭</b>；大七度要写 maj：<b class="c-seventh">B</b>'},
    augAug: {tones: [...chord(SEVENTH.aug7.keys, PAIR[0], 'a-'), tone('root','C4',COLOR.ink,'',PAIR[1]), tone('third','E4',COLOR.ink,'',PAIR[1]), tone('fifth','G#4',COLOR.ink,'',PAIR[1]), tone('seventh','B#4',COLOR.faint,'',PAIR[1])],
      staffSymbols: [sym('C', '+7', PAIR[0], {size: 15}), {slot: PAIR[1], text: '增增七？', color: COLOR.faint, font: 'label', size: 12}],
      caption: '<span class="c-faint">增七度（B♯）在十二平均律里与八度（C）同音，所以不算一个通用的七和弦</span>'},
    dominant: {tones: chord(SEVENTH.dom7.keys, CENTER, '', true), staffSymbols: [sym('C', '7')], caption: '大小七和弦 ＝ <b>属七和弦</b>', play: true},
    core: {tones: ['maj7','m7','dom7','dim7'].flatMap((id, i) => chord(SEVENTH[id].keys, QUAD[i], i ? id + '-' : '')), staffSymbols: ['maj7','m7','dom7','dim7'].map((id, i) => sym('C', SEVENTH[id].abbr, QUAD[i], {size: 14}))},
    rare: {tones: ['half','mM7','aug7','augM7'].flatMap((id, i) => chord(SEVENTH[id].keys, QUAD[i], id + '-')), staffSymbols: ['half','mM7','aug7','augM7'].map((id, i) => sym('C', SEVENTH[id].sign, QUAD[i], {size: 14}))},
    plain: id => ({tones: chord(SEVENTH[id].keys)}),
    // C7 与 Cmaj7：七音不同
    sevenVsMaj: {tones: [...chord(SEVENTH.dom7.keys, PAIR[0], 'a-'), ...chord(SEVENTH.maj7.keys, PAIR[1])].map(t => /seventh$/.test(t.id) ? {...t, color: COLOR.seventh} : t),
      staffSymbols: [sym('C', '7', PAIR[0]), sym('C', 'maj7', PAIR[1])], caption: '<b class="c-seventh">B♭</b> 与 <b class="c-seventh">B</b>：七音不同'},
    minusVsDim: {tones: [...chord(SEVENTH.m7.keys, PAIR[0], 'a-'), ...chord(SEVENTH.dim7.keys, PAIR[1])],
      staffSymbols: [sym('C', '−7', PAIR[0]), sym('C', '°7', PAIR[1])], caption: '−7 是小七和弦；°7 才是减七和弦'},
    // ° 加一道斜线 → ø
    dimVsHalfSymbols: {tones: [...chord(SEVENTH.dim7.keys, PAIR[0], 'a-'), ...chord(SEVENTH.half.keys, PAIR[1])].map(t => /seventh$/.test(t.id) ? {...t, color: COLOR.seventh} : t),
      staffSymbols: [sym('C', '°7', PAIR[0], {size: 16}), sym('C', 'ø7', PAIR[1], {size: 16})], caption: '° 加一道斜线 → <b>ø</b>：只「减」了一半'},
    // 小七和弦降低五音 → 半减七和弦
    m7VsHalf: {tones: [...chord(SEVENTH.m7.keys, PAIR[0], 'a-'), ...chord(SEVENTH.half.keys, PAIR[1])].map(t => /fifth$/.test(t.id) ? {...t, color: COLOR.fifth} : t),
      staffSymbols: [sym('C', 'm7', PAIR[0], {size: 15}), sym('C', 'm7(♭5)', PAIR[1], {size: 15})], caption: '五音 <b class="c-fifth">G → G♭</b>：降低半音'},
    halfSpellings: {tones: chord(SEVENTH.half.keys), staffSymbols: [stack(['C','ø7'], ['C','m7(♭5)'])], caption: '两种写法 · 同一组音'},
    augSpellings: {tones: chord(SEVENTH.aug7.keys), staffSymbols: [stack(['C','+7'], ['C','7(♯5)'])], caption: '两种写法 · 同一组音'},
    derive: count => ({
      tones: [tone('root','D4',COLOR.root,'1'), tone('third','F4',COLOR.third,'m3'), tone('fifth','A4',COLOR.fifth,'P5'), tone('seventh','C5',COLOR.seventh,'m7')].slice(0, count),
      staffSymbols: [sym('D', 'm7')],
      caption: ['根音、后缀、七度', '<b class="c-root">根音 D</b>', '<b class="c-third">m</b>：小三和弦 → D–F–A', '<b class="c-seventh">7</b>：小七度 → C', 'D–F–A–C'][count],
      play: count > 0
    }),
    // 转位：原位与三种转位并列（整体在谱表上居中）；每个和弦最低的音（低音）标红。labels = 下方写「原位、第一转位……」
    inversions: (labels = false) => ({tones: INVERSIONS.flatMap(([keys, roles], n) => keys.map((k, i) => tone((n ? 'inv' + n + '-' : '') + roles[i], k, i === 0 ? COLOR.bass : COLOR.ink, '', ROW4[n]))),
      staffLabels: labels ? ['原位', '第一', '第二', '第三'].map((text, n) => ({slot: ROW4[n], text})) : [],
      caption: labels ? '原位，第一、第二、第三转位' : '',
      controls: INV_NAMES.map((name, n) => ['inv' + n, name])}),
    // 点按钮：单独看、听一个转位
    inversion: n => ({tones: INVERSIONS[n][0].map((k, i) => tone((n ? 'inv' + n + '-' : '') + INVERSIONS[n][1][i], k, i === 0 ? COLOR.bass : COLOR.ink, i === 0 ? ROLE_LABEL[ROLE.indexOf(INVERSIONS[n][1][0])] : '')),
      staffSymbols: [sym('C', '7', CENTER, {bass: INV_BASS[n]})], caption: `${INV_NAMES[n]}：低音是${['根音', '三音', '五音', '七音'][n]}`,
      controls: INV_NAMES.map((name, i) => ['inv' + i, name]), pressed: 'inv' + n, play: true}),
    // A°7 的第三转位：低音是七音 G♭（不是 F♯）。G♭ 与 A 的符头左右错开，标签「7」往右挪
    dimSlash: {tones: [{...tone('seventh','Gb3',COLOR.bass,'7'), labelShift: 12}, tone('root','A3'), tone('third','C4'), tone('fifth','Eb4')], staffSymbols: [sym('A', '°7', CENTER, {bass: 'G♭'})], caption: 'A 往上七度是 <b class="c-bass">G♭</b>：写 A°7/G♭', play: true},
    // 七和弦 = 根音 ＋ 上方的三和弦（拆开来标记）
    splitAm7: {tones: [tone('root','A3',COLOR.bass), tone('third','C4',COLOR.root), tone('fifth','E4',COLOR.root), tone('seventh','G4',COLOR.root)],
      staffSymbols: [stack(['A','m7'], ['C','','A'])], caption: '低音 <b class="c-bass">A</b> ＋ 上方的 <b class="c-root">C 大三和弦</b>', play: true},
    splitG7: {tones: [tone('root','G3',COLOR.bass), tone('third','B3',COLOR.root), tone('fifth','D4',COLOR.root), tone('seventh','F4',COLOR.root)],
      staffSymbols: [stack(['G','7'], ['B','°','G'])], caption: '低音 <b class="c-bass">G</b> ＋ 上方的 <b class="c-root">B 减三和弦</b>', play: true},
    slashTriad: {tones: [tone('seventh','F3',COLOR.bass), tone('root','G3'), tone('third','B3'), tone('fifth','D4')], staffSymbols: [stack(['G','','F'], ['G','7','F'])], caption: 'G/F ＝ G7/F：低音 F 就是 G7 的七音'},
    enharmonic: {tones: [tone('root','E4'), tone('third','G#4'), tone('fifth','C5',COLOR.fifth), tone('seventh','D5')], staffSymbols: [sym('E', '+7')], caption: '五音本来是 <b>B♯</b>，常写成同音的 <b class="c-fifth">C</b>'},
    // E+7 解决到 Am：五音向下走到 A。写成 C 是小三度；写成 B♯ 是增二度，而且升号的音看起来应该往上走
    resolve: spelled => ({
      tones: [tone('root','E4',COLOR.ink,'',PAIR[0]), tone('third','G#4',COLOR.ink,'',PAIR[0]), tone('fifth', spelled,COLOR.fifth,'',PAIR[0]), tone('seventh','D5',COLOR.ink,'',PAIR[0]),
        tone('a-e','E4',COLOR.ink,'',PAIR[1]), tone('a-a','A4',COLOR.fifth,'',PAIR[1]), tone('a-c','C5',COLOR.ink,'',PAIR[1])],
      staffSymbols: [sym('E', '+7', PAIR[0], {size: 15}), sym('A', 'm', PAIR[1], {size: 15})],
      offsets: [0, 0, 0, 0, 1.1, 1.1, 1.1],
      caption: spelled === 'C5' ? '<b class="c-fifth">C → A</b>：向下小三度，一眼看出是往下走' : '<b class="c-fifth">B♯ → A</b>：增二度；升号的音看起来应该往上走',
      play: true
    })
  };

  /* ---------- 讲解与 Quiz ---------- */
  const {steps, sections, section, group, quiz, accent, p, warn, instruction, TF} = ChordLesson.builder();

  // 一、七和弦的构成
  section('build', '一', '七和弦的构成');
  group('build', [
    [p(`<strong>七和弦（Seventh Chord）</strong>是由${accent('四个音')}按照三度关系叠置而成的和弦。`), SCENE.build, {sequence: 900}],
    [p(`七和弦也可以理解为：在三和弦上方，再叠一个与根音成${accent('七度')}的音所构成的和弦。`), SCENE.seventhInterval],
    [p(`这个音称为和弦的<strong>七音（Seventh）</strong>。`), SCENE.seventhNamed]
  ]);
  quiz('count', SCENE.plain('dom7'), {
    question: '七和弦由几个音组成？',
    options: [['3','三个'], ['4','四个'], ['7','七个']], answer: '4',
    right: '正确。七和弦有根音、三音、五音、七音四个音。名称里的「七」，指七音与根音相距七度，不是音的个数。',
    wrong: '「七」不是音的个数。数一数谱例里的音。'
  });

  // 二、七和弦的性质
  section('quality', '二', '七和弦的性质');
  group('formula', [
    [p(`七和弦的性质，由${accent('三和弦的性质')}与${accent('根音到七音的音程')}共同决定。`), {panel: PANEL.formula}],
    [p(`名称里前一个字描述三和弦，后一个字描述七度：<strong>大小七和弦</strong> ＝ 大三和弦 ＋ ${accent('小七度')}。`), SCENE.quality('dom7')]
  ]);
  group('eight', [
    [p(`按三度叠置、实际常用的七和弦，一共有${accent('八种')}：大小七、大七、小七、减七、减小七、小大七、增小七、增大七和弦。`) + instruction('点击演示区的按钮，比较八种七和弦。'), SCENE.pick('dom7')]
  ]);
  group('merge', [
    [p(`三和弦与七度的性质相同时，名称${accent('合并成一个字')}。`), {panel: PANEL.merge(1)}, {sequence: 900}],
    [p(`所以大大七、小小七、减减七，分别叫作大七、小七、减七和弦。`), [{panel: PANEL.merge(1)}, {panel: PANEL.merge(2)}, {panel: PANEL.merge(3)}], {sequence: 900}]
  ]);
  group('half', [
    [p(`<strong>减小七和弦</strong>也叫<strong>半减七和弦</strong>：减七和弦的三和弦与七度都是「减」，减小七和弦只有三和弦是减的，七度是小七度——只「减」了${accent('一半')}。`), SCENE.dimVsHalf],
    [p(`所以减七和弦全部由小三度叠成；半减七和弦最上面的一个三度是${accent('大三度')}，比减七和弦宽了半音。`), SCENE.dimVsHalf]
  ]);
  group('aug', [
    [p(`<strong>增小七和弦</strong>常简称为<strong>增七和弦</strong>。它从属七和弦来：把大小七和弦的五音升高半音，古典和声里叫${accent('增属七和弦')}。`), SCENE.augFromDom, {sequence: 1100}],
    [p(`单独的 7 永远表示小七度，所以「增七」只能是增三和弦 ＋ 小七度；要表示大七度，必须写 ${accent('maj')}。`), SCENE.augVsAugMaj],
    [p(`按合并规则，「增七和弦」本应是增三和弦 ＋ 增七度；但增七度与根音的高八度同音，这种和弦并不存在，所以${accent('「增七和弦」这个名称就留给了增小七和弦')}。`), SCENE.augAug]
  ]);
  group('dominant', [
    [p(`大小七和弦常被称为<strong>属七和弦</strong>：它是传统和声里最能代表${accent('属功能')}的七和弦。`), SCENE.dominant]
  ]);
  group('core', [
    [p(`其中最核心的是大七、小七、大小七、减七与半减七。`), {panel: PANEL.groups}],
    [p(`小大七、增七和增大七${accent('比较少见')}，是现代音乐里慢慢多起来的「新角色」。`), {panel: PANEL.groups}]
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

  // 三、七和弦的标记方法
  section('symbols', '三', '七和弦的标记方法');
  group('number', [
    [p(`七和弦的标记：根音，加上表示性质的后缀和数字 ${accent('7')}。`), {panel: PANEL.table(CORE)}],
    [p(`<strong>大七和弦</strong>写作 ${accent('maj7')}、M7 或 △7。`), {panel: PANEL.table(CORE, ['maj7'])}],
    [p(`<strong>小七和弦</strong>写作 ${accent('m7')}、min7 或 −7。`), {panel: PANEL.table(CORE, ['m7'])}],
    [warn(`maj7 的 maj 说的是${accent('七度')}（大七度）；m7 的 m 说的是${accent('三和弦')}（小三和弦）。`), {panel: PANEL.table(CORE, ['maj7', 'm7'])}],
    [warn(`所以 Cm7 不是「C 大三和弦 ＋ 小七度」，而是${accent('小三和弦 ＋ 小七度')}。`), {panel: PANEL.table(CORE, ['m7'])}],
    [p(`大小七和弦有一个比较特殊的标记方式：它是古典和声里最常用、最重要的七和弦，所以标记也最简洁，直接只写一个 ${accent('7')}。`), {panel: PANEL.table(CORE, ['dom7'])}],
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
    [p(`半减七和弦常写作 ${accent('ø7')}，这个符号由减三和弦的 ° 变化而来。`), SCENE.dimVsHalfSymbols],
    [p(`半减七和弦也等于把小七和弦的五音降低半音，所以也写作 ${accent('m7(♭5)')}。`), SCENE.m7VsHalf],
    [p(`增七和弦写作 +7 或 aug7，更常见的写法是 ${accent('7(♯5)')}：把大小七和弦的五音升高半音。`), SCENE.augSpellings],
    [p(`小大七和弦写作 m(maj7) 或 −△7。`), {panel: PANEL.table(OTHER, ['mM7'])}],
    [p(`增大七和弦写作 maj7(♯5) 或 △7(♯5)。`), {panel: PANEL.table(OTHER, ['augM7'])}],
    [p(`增七、增大七、半减七三种和弦，${accent('更常用能看出变化音的写法')}来标记。`), {panel: PANEL.table(OTHER, ['half', 'aug7', 'augM7'])}]
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
    [p(`推导七和弦，在三和弦的步骤之后，${accent('多了一步')}：确定七音。`), SCENE.derive(0)],
    [p(`第一步：识别<strong>根音</strong>。`), SCENE.derive(1)],
    [p(`第二步：从后缀判断三和弦——7 与 maj7 是大三和弦，m7 与 m(maj7) 是小三和弦，°7 与 ø7 是减三和弦，+7 是增三和弦。`), SCENE.derive(3)],
    [p(`第三步：确定七度——maj 是${accent('大七度')}，°7 是${accent('减七度')}，其余单独的 7 都是${accent('小七度')}。`), SCENE.derive(4)]
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

  // 五、七和弦的转位
  section('inversion', '五', '七和弦的转位');
  group('inversion', [
    [p(`七和弦有四个音，所以除了原位，还有${accent('三种转位')}。`) + instruction('点击演示区的按钮，单独试听每一个转位。'), SCENE.inversions()],
    [p(`低音是三音、五音、七音时，分别称为<strong>第一转位</strong>、<strong>第二转位</strong>、<strong>第三转位</strong>。`), SCENE.inversions(true)],
    [p(`转位的写法和三和弦一样：斜线左边写和弦，右边写${accent('低音')}。`), SCENE.inversions(true)],
    [p(`规范写法里，斜线后的低音按它在和弦里的${accent('音级')}拼写：三音、五音、七音分别写成根音上方三度、五度、七度的音名。例如 A°7 的七音是 G♭，写 A°7/G♭，不写 A°7/F♯。`), SCENE.dimSlash],
    [p(`在实际的演奏谱里，严格按乐理拼出来的低音有时是重升、重降，或 E♯、F♭ 这类不好读的音。为了读谱方便，可以换成同音、${accent('更好读')}的音名来写。这是有益的灵活写法，但要和规范写法区分开。`), {panel: PANEL.readable}]
  ]);
  group('slash-triad', [
    [p(`当斜线后的低音正好是这个和弦的${accent('七音')}时，也会看到用「三和弦/低音」写七和弦：G/F 与 G7/F 都表示低音为 F 的 G7。`), SCENE.slashTriad],
    [p(`这种情况下，数字 7 写不写，都${accent('不影响和弦的结构')}。`), SCENE.slashTriad],
    [p(`一般的标准写法是 Am7；但在某些场合，也会写成 C/A：表示 C 大三和弦加上低音 A 的组合。这时它${accent('不是转位和弦')}。`), SCENE.splitAm7],
    [p(`任何七和弦都可以把根音分离出来，剩下的三个音仍是一个完整的三和弦（性质不一定相同）。所以斜线记号不只用来标转位，也可以用来把七和弦${accent('拆开')}标记。`), SCENE.splitG7]
  ]);
  quiz('inv-bass', {panel: PANEL.symbol('C', '7', 'B♭')}, {
    question: 'C7/B♭ 的低音是和弦的：',
    options: [['third','三音'], ['fifth','五音'], ['seventh','七音']], answer: 'seventh',
    right: '正确。B♭ 是 C7 的七音，这是第三转位。',
    wrong: 'C7 的四个音是 C–E–G–B♭。B♭ 是第几个？'
  });
  quiz('dim-slash', {tones: [tone('seventh','Bbb3'), tone('root','C4'), tone('third','Eb4'), tone('fifth','Gb4')]}, {
    question: '谱例是 C°7（C–E♭–G♭–B𝄫）的第三转位。按规范写法，斜线后面应该写：',
    options: [['bbb','B𝄫'], ['a','A'], ['bb','B♭']], answer: 'bbb',
    right: '正确。C°7 的七音是 B𝄫，规范写法是 C°7/B𝄫。实际演奏谱里为了好读，也可能写成同音的 A。',
    wrong: '规范写法里，低音按它在和弦里的音级拼写。C°7 的七音是哪个音？',
    reveal: [sym('C', '°7', CENTER, {bass: 'B𝄫'})]
  });

  // 六、等音记谱
  section('enharmonic', '六', '等音记谱');
  group('enharmonic', [
    [p(`把和弦写成五线谱时，为了少写变音记号，或让声部进行更顺，有些音会改用${accent('等音')}记谱。`), SCENE.enharmonic],
    [p(`例如 E 增七和弦（E+7）的五音本来是 B♯，谱面上常写成同音的 C。`), SCENE.enharmonic],
    [p(`E+7 常常解决到 Am：这个音向下走到 A。写成 C，C → A 是${accent('向下的小三度')}，一眼就能看出是往下走。`), SCENE.resolve('C5')],
    [p(`写成 B♯，B♯ → A 就成了增二度；而且带升号的音，看起来应该${accent('往上')}走，读起来反而别扭。`), SCENE.resolve('B#4')],
    [p(`第四课还会讲到：严格按拼写，E 上方的 C 是小十三度，那个和弦记作 E7(♯5, ♭13) 更准确。现在先知道谱面上会有这样的${accent('等音写法')}就好。`), SCENE.enharmonic]
  ]);
  quiz('enharmonic', SCENE.resolve('C5'), {
    question: 'E+7 解决到 Am 时，谱面上把五音写成 C 而不是 B♯，主要是因为：',
    options: [['down','它要向下走到 A，写成 C 更好读'], ['different','C 和 B♯ 是两个不同的音'], ['none','E+7 没有五音']], answer: 'down',
    right: '正确。C → A 是向下的小三度；写成 B♯ 就成了增二度，升号的音看起来又像要往上走。',
    wrong: 'C 和 B♯ 在键盘上是同一个键。想一想这个音接下来往哪里走。'
  });

  ChordLesson.run({
    steps, sections,
    // 演示区按钮：八种七和弦（第二节）、四个转位（第五节）
    onControl: id => id in SEVENTH ? SCENE.pick(id) : SCENE.inversion(Number(id.slice(3))),
    preload: ['C4','E4','G4','B4','Eb4','Gb4','Bb4','G#4','A4','D4','F4','C5','E5','Bb3','F3','G3','B3','D5','Ab4']
  });
})();
