/* 和弦记号 · 第二课：七和弦（2026-11-21 定稿，由 docs/demos/chord-lesson02-v2 Demo 审核后上线）
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
  // 全称：每种都是三个字（简称要到后面才讲）
  const FULL = {maj7: '大大七和弦', m7: '小小七和弦', dom7: '大小七和弦', dim7: '减减七和弦', half: '减小七和弦', mM7: '小大七和弦', aug7: '增小七和弦', augM7: '增大七和弦'};
  const tone = (id, key, color = COLOR.ink, label = '', slot = CENTER) => ({id, key, color, label, slot});
  // 一个七和弦：和弦音 id 固定为 root / third / fifth / seventh（加前缀区分同一谱面上的几个和弦）
  const chord = (keys, slot = CENTER, prefix = '', colored = false) =>
    keys.map((k, i) => tone(prefix + ROLE[i], k, colored ? ROLE_COLOR[i] : COLOR.ink, colored ? ROLE_LABEL[i] : '', slot));
  const sym = (root, suffix = '', slot = CENTER, extra = {}) => ({slot, root, suffix, ...extra});
  const stack = (...list) => ({slot: CENTER, stack: list});
  // 标记方法的两张卡片：第一张是有简写的四种，第二张是没有简写的四种。[常见写法, 其他写法]
  const CARD1 = {maj7: ['maj7', ['△7']], m7: ['m7', ['−7']], dim7: ['dim7', ['°7']], aug7: ['aug7', ['+7']]};
  const CARD2 = {half: ['m7(♭5)', ['ø7', '−7(♭5)', 'm7(−5)']], mM7: ['m(maj7)', ['mM7', '−△7']], dom7: ['7', []], augM7: ['maj7(♯5)', ['△7(♯5)']]};
  const QUAD = [0.5, 1.45, 2.4, 3.3];  // 四个和弦并列（第一个离谱号远一些，留出变音记号的位置）
  const EIGHT = ['dom7', 'maj7', 'm7', 'mM7', 'half', 'dim7', 'aug7', 'augM7'].map(id => [id, FULL[id].replace('和弦', '')]);
  const formulaOf = id => `${FULL[id]} ＝ ${SEVENTH[id].triad} ＋ <b class="c-seventh">${SEVENTH[id].seventh.replace(/（.*）/, '')}</b>`;
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
    // 七和弦标记卡片（演示区一次放得下四行）：card = CARD1 / CARD2；highlight = 要突出的几行（['none'] = 全部变暗，还没开始讲）
    // 同一张卡片只换高亮（marks），画面不重新淡入
    table: (card, highlight = []) => ({key: 'table-' + Object.keys(card).join(), marks: highlight, html:
      `<div class="compare-table markable${card === CARD2 ? ' wide-other' : ''}" role="table" aria-label="七和弦的常见记号">` +
      '<div class="compare-row compare-head" role="row"><span role="columnheader">名称</span><span role="columnheader">常见写法</span><span role="columnheader">其他写法</span></div>' +
      Object.entries(card).map(([id, [main, other]]) => `<div class="compare-row" role="row" data-mark="${id}"><span role="cell">${{aug7: '增七和弦', half: '半减七和弦'}[id] || SEVENTH[id].name.replace(/（.*）/, '')}</span><span role="cell">${cs('C', main)}</span><span role="cell">${other.length ? other.map(x => cs('C', x)).join('') : '<span class="c-faint">—</span>'}</span></div>`).join('') +
      '</div>'}),
    // 一个和弦、几种叫法（第二节小结）
    aliases: {key: 'aliases', html: '<div class="compare-table dense" role="table" aria-label="七和弦的常用名称" style="--cols: 1fr 1.6fr">' +
      '<div class="compare-row compare-head" role="row"><span role="columnheader">正式名称</span><span role="columnheader">通用名称</span></div>' +
      [['大大七和弦', '大七和弦'], ['小小七和弦', '小七和弦'], ['减减七和弦', '减七和弦'], ['减小七和弦', '半减七和弦'], ['大小七和弦', '属七和弦'], ['增小七和弦', '增七和弦、增属七和弦']]
        .map(([a, b]) => `<div class="compare-row" role="row"><span role="cell">${a}</span><span role="cell">${b}</span></div>`).join('') + '</div>'},
    // 用变化音标记的三种和弦；state 'signs' 时显示右边一列（用加减号代替升降号）
    altered: signs => ({key: 'altered', state: signs ? 'signs' : '', html: '<div class="compare-table" role="table" aria-label="用变化音标记的七和弦">' +
      '<div class="compare-row compare-head" role="row"><span role="columnheader">名称</span><span role="columnheader">升降号</span><span role="columnheader" class="compare-cell" data-col="signs">加减号</span></div>' +
      [['增七和弦', '7(♯5)', '7(+5)'], ['增大七和弦', 'maj7(♯5)', 'maj7(+5)'], ['半减七和弦', 'm7(♭5)', 'm7(−5)']]
        .map(([name, x, y]) => `<div class="compare-row" role="row"><span role="cell">${name}</span><span role="cell">${cs('C', x)}</span><span role="cell" class="compare-cell" data-col="signs">${cs('C', y)}</span></div>`).join('') + '</div>'}),
    // 常见的错误标记
    mistakes: highlight => ({key: 'mistakes', marks: [String(highlight)], html: '<div class="compare-table markable" role="table" aria-label="常见的错误标记" style="--cols: 1fr 1fr">' +
      '<div class="compare-row compare-head" role="row"><span role="columnheader">✗ 错误</span><span role="columnheader">✓ 正确</span></div>' +
      [[cs('C', 'Mm') + '　<span class="c-faint">大小七</span>', cs('C', '7')],
       [cs('C', '7') + '　<span class="c-faint">大七</span>', cs('C', 'maj7')],
       [cs('C', '−7') + '　<span class="c-faint">减七</span>', cs('C', '°7')]]
        .map((row, i) => `<div class="compare-row" role="row" data-mark="${i + 1}">${row.map(x => `<span role="cell">${x}</span>`).join('')}</div>`).join('') + '</div>'}),
    symbol: (root, suffix, bass = '') => ({key: `symbol-${root}${suffix}${bass}`, html: `<p class="symbol-row big">${cs(root, suffix, bass)}</p>`}),
    // 同一个记号面板，只让后缀（如 7）淡出、收起：从上一步神奇移动过来
    dropSuffix: (root, suffix, bass = '') => ({...PANEL.symbol(root, suffix, bass), state: 'drop-suffix'})
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
    // 减七与半减七：三和弦相同，差别在七度（减七度 / 小七度）
    dimVsHalfSeventh: {tones: [
      ...SEVENTH.dim7.keys.map((k, i) => i === 3 ? tone('a-seventh', k, COLOR.seventh, 'd7', PAIR[0]) : tone('a-' + ROLE[i], k, COLOR.faint, '', PAIR[0])),
      ...SEVENTH.half.keys.map((k, i) => i === 3 ? tone('seventh', k, COLOR.seventh, 'm7', PAIR[1]) : tone(ROLE[i], k, COLOR.faint, '', PAIR[1]))],
      staffSymbols: [{slot: PAIR[0], text: '减减七', font: 'label', size: 12}, {slot: PAIR[1], text: '减小七', font: 'label', size: 12}],
      caption: '三和弦都是减三和弦；七度：<b class="c-seventh">减七度</b> 与 <b class="c-seventh">小七度</b>', play: true},
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
    plain: id => ({tones: chord(SEVENTH[id].keys)}),
    // ° 加一道斜线 → ø
    dimVsHalfSymbols: {tones: [...chord(SEVENTH.dim7.keys, PAIR[0], 'a-'), ...chord(SEVENTH.half.keys, PAIR[1])].map(t => /seventh$/.test(t.id) ? {...t, color: COLOR.seventh} : t),
      staffSymbols: [sym('C', '°7', PAIR[0], {size: 16}), sym('C', 'ø7', PAIR[1], {size: 16})], caption: '° 加一道斜线 → <b>ø</b>：只「减」了一半'},
    // 小七和弦降低五音 → 半减七和弦
    m7VsHalf: {tones: [...chord(SEVENTH.m7.keys, PAIR[0], 'a-'), ...chord(SEVENTH.half.keys, PAIR[1])].map(t => /fifth$/.test(t.id) ? {...t, color: COLOR.fifth} : t),
      staffSymbols: [sym('C', 'm7', PAIR[0], {size: 15}), sym('C', 'm7(♭5)', PAIR[1], {size: 15})], caption: '五音 <b class="c-fifth">G → G♭</b>：降低半音'},
    halfSpellings: {tones: chord(SEVENTH.half.keys), staffSymbols: [stack(['C','ø7'], ['C','m7(♭5)'])], caption: '两种写法 · 同一组音'},
    derive: count => ({
      tones: [tone('root','D4',COLOR.root,'1'), tone('third','F4',COLOR.third,'m3'), tone('fifth','A4',COLOR.fifth,'P5'), tone('seventh','C5',COLOR.seventh,'m7')].slice(0, count),
      staffSymbols: [sym('D', 'm7')],
      caption: ['根音、后缀、七度', '<b class="c-root">根音 D</b>', '<b class="c-third">m</b>：小三和弦 → D–F–A', '<b class="c-seventh">7</b>：小七度 → C', 'D–F–A–C'][count],
      play: count > 0
    }),
    // 点按钮：单独看、听一个转位
    inversion: n => ({tones: INVERSIONS[n][0].map((k, i) => tone((n ? 'inv' + n + '-' : '') + INVERSIONS[n][1][i], k, i === 0 ? COLOR.bass : COLOR.ink, i === 0 ? ROLE_LABEL[ROLE.indexOf(INVERSIONS[n][1][0])] : '')),
      staffSymbols: [sym('C', '7', CENTER, {bass: INV_BASS[n]})], caption: `${INV_NAMES[n]}：低音是${['根音', '三音', '五音', '七音'][n]}`,
      // 按钮用短名（原位、第一 …），四个排成一行；完整名称在演示区说明里
      controls: ['原位', '第一', '第二', '第三'].map((name, i) => ['inv' + i, name]), pressed: 'inv' + n, play: true}),
    // A°7 的第三转位：低音是七音 G♭（不是 F♯）。G♭ 与 A 的符头左右错开，标签「7」往右挪
    dimSlash: {tones: [{...tone('seventh','Gb3',COLOR.bass,'7'), labelShift: 12}, tone('root','A3'), tone('third','C4'), tone('fifth','Eb4')], staffSymbols: [sym('A', '°7', CENTER, {bass: 'G♭'})], caption: 'A 往上七度是 <b class="c-bass">G♭</b>：写 A°7/G♭', play: true},
    // 第 48 页：G♭ 与 F♯ 并排，对比按结构拼写的低音（音高相同）
    dimSlashPair: {tones: [['Gb3', 'G♭'], ['F#3', 'F♯']].flatMap(([low], k) => [
        {...tone((k ? 'r-' : 'l-') + 'seventh', low, COLOR.bass, k ? '' : '7', PAIR[k]), labelShift: 12},
        tone((k ? 'r-' : 'l-') + 'root', 'A3', COLOR.ink, '', PAIR[k]), tone((k ? 'r-' : 'l-') + 'third', 'C4', COLOR.ink, '', PAIR[k]), tone((k ? 'r-' : 'l-') + 'fifth', 'Eb4', COLOR.ink, '', PAIR[k])]),
      staffSymbols: [sym('A', '°7', PAIR[0], {bass: 'G♭', size: 15}), sym('A', '°7', PAIR[1], {bass: 'F♯', size: 15})],
      staffLabels: [{slot: PAIR[0], text: '✓', drop: 9}, {slot: PAIR[1], text: '✗', drop: 9}],
      caption: 'A 往上七度是 <b class="c-bass">G♭</b>；写成 F♯ 音高相同，但音名不对', play: true},
    // 七和弦 = 根音 ＋ 上方的三和弦（拆开来标记）
    splitAm7: {tones: [tone('root','A3',COLOR.bass), tone('third','C4',COLOR.root), tone('fifth','E4',COLOR.root), tone('seventh','G4',COLOR.root)],
      staffSymbols: [stack(['A','m7'], ['C','','A'])], caption: '低音 <b class="c-bass">A</b> ＋ 上方的 <b class="c-root">C 大三和弦</b>', play: true},
    // 第 53 页：两个和弦并排，不再先后出现
    splitPair: {tones: [['A3','C4','E4','G4'], ['G3','B3','D4','F4']].flatMap((keys, k) => keys.map((key, i) => tone((k ? 'g-' : 'a-') + ['root','third','fifth','seventh'][i], key, i ? COLOR.root : COLOR.bass, '', PAIR[k]))),
      staffSymbols: [{...stack(['A','m7'], ['C','','A']), slot: PAIR[0], size: 15}, {...stack(['G','7'], ['B','°','G']), slot: PAIR[1], size: 15}],
      caption: '低音 <b class="c-bass">A</b> ＋ <b class="c-root">C 大三和弦</b>　·　低音 <b class="c-bass">G</b> ＋ <b class="c-root">B 减三和弦</b>', play: true},
    splitG7: {tones: [tone('root','G3',COLOR.bass), tone('third','B3',COLOR.root), tone('fifth','D4',COLOR.root), tone('seventh','F4',COLOR.root)],
      staffSymbols: [stack(['G','7'], ['B','°','G'])], caption: '低音 <b class="c-bass">G</b> ＋ 上方的 <b class="c-root">B 减三和弦</b>', play: true},
    slashTriad: {tones: [tone('seventh','F3',COLOR.bass), tone('root','G3'), tone('third','B3'), tone('fifth','D4')], staffSymbols: [stack(['G','','F'], ['G','7','F'])], caption: 'G/F ＝ G7/F：低音 F 就是 G7 的七音'},
    enharmonic: {tones: [tone('root','E4'), tone('third','G#4'), tone('fifth','C5',COLOR.fifth), tone('seventh','D5')], staffSymbols: [sym('E', '+7')], caption: '五音本来是 <b>B♯</b>，常写成同音的 <b class="c-fifth">C</b>'},
    // E+7 解决到 Am：五音向下走到 A。写成 C 是小三度；写成 B♯ 是增二度，而且升号的音看起来应该往上走
    // 不用等音：按和弦结构拼写，五音是 B♯
    enharmonicStrict: {tones: [tone('root','E4'), tone('third','G#4'), tone('fifth','B#4',COLOR.fifth), tone('seventh','D5')], staffSymbols: [sym('E', '+7')], caption: '按和弦结构拼写：五音是 <b class="c-fifth">B♯</b>'},
    // arrows：画出每个声部的倾向（E → E、G♯ → A、五音 → A、D → C）
    resolve: (spelled, arrows = false) => ({
      tones: [tone('root','E4',COLOR.ink,'',PAIR[0]), tone('third','G#4',COLOR.ink,'',PAIR[0]), tone('fifth', spelled,COLOR.fifth,'',PAIR[0]), tone('seventh','D5',COLOR.ink,'',PAIR[0]),
        tone('a-e','E4',COLOR.ink,'',PAIR[1]), tone('a-a','A4',COLOR.fifth,'',PAIR[1]), tone('a-c','C5',COLOR.ink,'',PAIR[1])],
      staffSymbols: [sym('E', '+7', PAIR[0], {size: 15}), sym('A', 'm', PAIR[1], {size: 15})],
      offsets: [0, 0, 0, 0, 1.1, 1.1, 1.1],
      arrows: arrows ? [['root', 'a-e'], ['third', 'a-a'], ['fifth', 'a-a', COLOR.fifth], ['seventh', 'a-c']] : [],
      caption: spelled === 'C5' ? '<b class="c-fifth">C → A</b>：向下小三度，一眼看出是往下走' : '<b class="c-fifth">B♯ → A</b>：增二度；升号的音看起来应该往上走',
      play: true
    })
  };

  /* ---------- 新版文案的演示与记号速查 ---------- */
  const structure = id => {
    const scene = SCENE.quality(id);
    return {...scene, staffSymbols: [], play: false};
  };
  // names：按钮显示的名称组（'' = 全称；'same' = 两个字相同的简称；'alias' = 别称），点按钮时保持同一组名称
  const NAMES = {same: {maj7: '大七', m7: '小七', dim7: '减七'}, alias: {dom7: '属七', half: '半减七', aug7: '增七'}};
  const pickStructure = (id, names = '') => ({...structure(id), pressed: `quality:${names}:${id}`,
    controls: EIGHT.map(([key, label]) => [`quality:${names}:${key}`, NAMES[names]?.[key] ? `<b class="name-short">${NAMES[names][key]}</b>` : label])});
  const namedChord = (id, suffix = SEVENTH[id].abbr) => ({...SCENE.quality(id), staffSymbols: [sym('C', suffix)], play: false});
  const panel = (key, html) => ({panel: {key: 'demo-' + key, html}});
  const symbols = (key, items, caption = '') => panel(key, '<div class="symbol-row cs-plain">' + items.map(([root, suffix, bass]) => cs(root, suffix, bass || '')).join('　') + '</div>' + (caption ? '<p class="reference-caption">' + caption + '</p>' : ''));
  // 第 18、24 页：四个记号排成一行，各自下方写和弦名称
  const named = (key, items) => panel(key, '<div class="named-symbols">' + items.map(([root, suffix, name]) => `<div><span class="named-glyph">${cs(root, suffix)}</span><span class="named-label">${name}</span></div>`).join('') + '</div>');
  const compare = (left, right, leftSuffix, rightSuffix, caption) => ({
    tones: [...chord(SEVENTH[left].keys, PAIR[0], 'left-', true), ...chord(SEVENTH[right].keys, PAIR[1], 'right-', true)],
    staffSymbols: [sym('C', leftSuffix, PAIR[0], {size: 16}), sym('C', rightSuffix, PAIR[1], {size: 16})], caption
  });
  const TABLE_ROWS = [
    ['大小七／属七', '7', []], ['大七', 'maj7', ['M7', '△7']],
    ['小七', 'm7', ['min7', '−7']], ['小大七', 'm(maj7)', ['mM7', '−△7']],
    ['减小七／半减七', 'ø7', ['m7(♭5)', '−7(♭5)', 'm7(−5)']], ['减七', '°7', ['dim7']],
    ['增小七／增七', '+7', ['aug7', '7(♯5)']], ['增大七', 'maj7(♯5)', ['△7(♯5)']]
  ];
  const allSymbols = '<div class="compare-table demo-table" role="table" aria-label="八种七和弦的名称与记号">' +
    '<div class="compare-row compare-head" role="row"><span>名称</span><span>常见写法</span><span>其他写法</span></div>' +
    TABLE_ROWS.map(([name, main, others]) => '<div class="compare-row" role="row"><span>' + name + '</span><span>' + cs('C', main) + '</span><span>' + (others.length ? others.map(x => cs('C', x)).join('') : '—') + '</span></div>').join('') + '</div>';
  window.chordReference = [
    {title: '八种七和弦', html: allSymbols},
    {title: '读记号的要点', html: '<ul class="reference-rules"><li>未另作说明时，三和弦采用大三和弦，7 采用小七度。</li><li>m 说明小三和弦；maj7、M7、△7 说明大七度；°7、dim7 同时说明减三和弦与减七度。</li><li>♯5、♭5 替换原来的五音。</li><li>斜线左边写和弦，右边写实际低音。</li></ul>'},
    {title: '属音', html: '<p>大调音阶的第五个音叫属音。在它上方叠出的七和弦是大小七和弦；“属七”在和弦记号中用作这种结构的名称，实际作用要结合前后文判断。</p>'}
  ];
  const DEMO = {
    qualityFormula: {
      tones: SEVENTH.dom7.keys.map((key, i) => tone(ROLE[i], key, i === 3 ? COLOR.seventh : COLOR.root, ROLE_LABEL[i])),
      arcs: [
        {from: 'root', to: 'fifth', text: '大三和弦', color: COLOR.root, shape: 'bracket', ids: ['root', 'third', 'fifth']},
        {from: 'root', to: 'seventh', text: '小七度', color: COLOR.seventh, side: 'right'}
      ]
    },
    scale: {tones: ['C4','D4','E4','F4','G4','A4','B4'].map((key, i) => tone('scale-' + i, key, i === 4 ? COLOR.root : COLOR.faint, String(i + 1), i / 2)), caption: 'C 大调音阶 · 第五个音 G 是属音'},
    // 第 10 页：C 大调一个八度的音阶，五级 G 上叠出 G7（大小七和弦）
    domScale: {wide: 1.45, tones: ['C4','D4','E4','F4','G4','A4','B4','C5'].flatMap((key, i) => i === 4
        ? ['G4','B4','D5','F5'].map((k, j) => tone('g7-' + j, k, COLOR.root, j === 0 ? '5' : '', 0.1 + i * 0.66))
        : [tone('scale-' + i, key, COLOR.faint, String(i % 7 + 1), 0.1 + i * 0.66)]),
      staffLabels: [{slot: 0.1 + 4 * 0.66, text: '属音', color: COLOR.root}], staffSymbols: [sym('G', '7', 0.1 + 4 * 0.66, {size: 15})],
      caption: '大调五级上的七和弦正好是大小七和弦，所以叫属七和弦', tap: 'note'},
    g7: {tones: chord(['G3','B3','D4','F4'], CENTER, '', true), staffLabels: [{slot: CENTER, text: '大小七和弦（属七）'}], caption: 'G–B–D–F：大三和弦 ＋ 小七度'},
    minorMajor: compare('m7', 'mM7', 'm7', 'm(maj7)', '三和弦相同：小三和弦；七音：小七度／大七度'),
    defaultTriad: {tones: chord(['C4','E4','G4'], CENTER, '', true), staffSymbols: [sym('C')], caption: '没有另作说明：大三和弦'},
    changedFifth: {tones: [...chord(SEVENTH.dom7.keys, PAIR[0], 'left-', true), ...chord(SEVENTH.aug7.keys, PAIR[1], 'right-', true)], staffSymbols: [sym('C','7',PAIR[0],{size:16}),sym('C','7(♯5)',PAIR[1],{size:16})], caption: 'G 被 G♯ 替换 · 原来的纯五度不再保留'},
    enharmonic: {...SCENE.enharmonic, caption: 'B♯ 与 C：相同音高，不同拼写'},
    strictResolution: {...SCENE.resolve('B#4', true), caption: 'B♯ → A：下行增二度'},
    // 第 62 页：B♯ 与 C 并排，同一个音高
    sameSound: {tones: [...chord(['E4','G#4','B#4','D5'], PAIR[0], 'l-', true), ...chord(['E4','G#4','C5','D5'], PAIR[1], 'r-', true)],
      staffLabels: [{slot: PAIR[0], text: 'B♯（按结构）'}, {slot: PAIR[1], text: 'C（常见写法）'}], caption: '同一个音高'},
    readableResolution: {...SCENE.resolve('C5', true), caption: 'C → A：下行小三度 · 实际音高不变'}
  };

  /* ---------- 64 页正文与 Quiz：页码与本次聊天中的建议稿一致 ---------- */
  const {steps, sections, section, group, quiz, accent, p, warn, TF} = ChordLesson.builder();
  function say(page, text, scene, extra = {}) {
    if (steps.length + 1 !== page) throw new Error('Demo 页码不连续：' + page);
    group('demo-' + page, [[p(text), scene, extra]]);
  }
  // 「注意」页：沿用 warn() 的格式（加粗、着色）
  function sayWarn(page, text, scene, extra = {}) {
    if (steps.length + 1 !== page) throw new Error('Demo 页码不连续：' + page);
    group('demo-' + page, [[warn(text), scene, extra]]);
  }
  function check(page, id, scene, question) {
    if (steps.length + 1 !== page) throw new Error('Demo Quiz 页码不连续：' + page);
    quiz(id, scene, question);
  }

  section('build', '一', '七和弦的构成');
  say(1, `<strong>七和弦（Seventh Chord）</strong>是由根音、三音、五音和七音构成，按三度关系叠置的${accent('四音和弦')}。`, SCENE.build, {sequence: 900});
  say(2, '也可以把它理解为：在三和弦上方，再加一个与根音相距七度的音。', SCENE.seventhInterval);
  say(3, '这个新加入的音，称为和弦的<strong>七音（Seventh）</strong>。', SCENE.seventhNamed);
  check(4, 'count', SCENE.plain('dom7'), {
    question: '七和弦的基本结构包含几个音？', options: [['3','三个'],['4','四个'],['7','七个']], answer: '4',
    right: '七和弦包含根音、三音、五音、七音。“七”说的是七音与根音之间的度数。',
    wrong: '名称里的“七”说的是音程，数一数谱例中不同的和弦音。'
  });

  section('quality', '二', '七和弦的性质与名称');
  say(5, `<strong>七和弦的性质（Seventh Chord Quality）</strong>，由${accent('三和弦的性质')}与${accent('根音到七音的音程')}共同决定。`, DEMO.qualityFormula);
  say(6, '在“大小七和弦”这样的名称中，前一个字说明三和弦的性质，后一个字说明七度的性质。', structure('dom7'));
  say(7, '实际音乐中常用、并有固定名称的七和弦有八种：大小七、大大七、小小七、小大七、减小七、减减七、增小七、增大七和弦。', pickStructure('dom7'), {hint: '点击演示区的按钮，比较它们的三和弦与七音。'});
  say(8, '其他组合很少见，也没有通用的名称；遇到时，从根音逐个确认三音、五音和七音即可。', pickStructure('dom7'));
  say(9, '名称里两个字相同时，可以简称为一个字：大大七和弦简称<strong>大七和弦（Major Seventh）</strong>，小小七和弦简称<strong>小七和弦（Minor Seventh）</strong>，减减七和弦简称<strong>减七和弦（Diminished Seventh）</strong>。', pickStructure('maj7', 'same'));
  say(10, '大小七和弦又叫<strong>属七和弦（Dominant Seventh）</strong>。', DEMO.domScale);
  say(11, '减小七和弦又叫<strong>半减七和弦（Half-diminished Seventh）</strong>：减七和弦的三和弦和七度都是「减」，半减七和弦只有三和弦是减的，所以叫「半」减。', SCENE.dimVsHalfSeventh);
  say(12, '增小七和弦常简称为<strong>增七和弦（Augmented Seventh）</strong>；它在结构上相当于把属七和弦的五音升高半音，所以也叫<strong>增属七和弦</strong>。', SCENE.augFromDom, {sequence: 1400});
  sayWarn(13, `增七和弦是个例外，它并不是指增增七和弦，而是${accent('增小七')}和弦，也就是增属七和弦的简称。`, pickStructure('aug7', 'alias'));
  check(14, 'dom-formula', SCENE.plain('dom7'), {
    question: '谱例中的七和弦是：', options: [['maj7','大七和弦'],['dom7','大小七和弦'],['m7','小七和弦']], answer: 'dom7',
    right: 'C–E–G 是大三和弦，C 到 B♭ 是小七度，所以是大小七和弦，也叫属七和弦。',
    wrong: '先判断下面的三和弦，再看根音到七音的音程。'
  });
  check(15, 'half-formula', SCENE.plain('half'), {
    question: '谱例中的七和弦是：', options: [['dim7','减七和弦'],['half','半减七和弦'],['m7','小七和弦']], answer: 'half',
    right: '下面是减三和弦，根音到七音是小七度，所以是半减七和弦。',
    wrong: '三和弦已经是减三和弦，再判断七度是减七度还是小七度。'
  });
  check(16, 'aug-names', SCENE.plain('aug7'), {
    question: '增七和弦还可以叫作：', options: [['augM7','增大七和弦'],['aug7','增小七和弦'],['augaug','增增七和弦'],['augdom','增属七和弦']], answer: ['aug7','augdom'],
    right: '增七和弦是增小七和弦的简称，也可以看作属七和弦升高五音，因此又叫增属七和弦。',
    wrong: '增七和弦的七音与根音是小七度；再想一想，它与属七和弦有什么关系。'
  });

  section('symbols', '三', '七和弦的标记方法');
  // 先讲直接从三和弦迁移的四种，再讲需要新规则的四种（2026-11-21 老师确认：综合原版与 Demo，多用谱例）
  say(17, '七和弦的记号由根音、表示性质的后缀和数字 7 组成。', panel('parts-arrows', '<div class="symbol-arrows" role="img" aria-label="Dm7：根音 D，后缀 m，数字 7">' +
    [['D', 'arrow-root', '根音'], ['m', 'arrow-suffix', '后缀'], ['7', 'arrow-number', '数字']]
      .map(([glyph, cls, role]) => `<div class="${cls}"><span class="arrow-glyph">${glyph}</span><span class="arrow-mark" aria-hidden="true">↑</span><span class="arrow-role">${role}</span></div>`).join('') + '</div>'));
  say(18, `其中四种七和弦，可以${accent('直接在三和弦的记号后面加 7')}。`, named('direct', [['C','maj7','大七'],['C','m7','小七'],['C','°7','减七'],['C','+7','增七']]));
  say(19, '大七和弦写作 maj7，也可以写作 M7 或 △7。', {tones: chord(SEVENTH.maj7.keys), staffSymbols: [stack(['C','maj7'],['C','M7'],['C','△7'])]});
  say(20, '小七和弦写作 m7，也可以写作 min7 或 −7。', {tones: chord(SEVENTH.m7.keys), staffSymbols: [stack(['C','m7'],['C','min7'],['C','−7'])]});
  say(21, '减七和弦写作 °7 或 dim7。', {tones: chord(SEVENTH.dim7.keys, CENTER, '', true), staffSymbols: [stack(['C','°7'],['C','dim7'])]});
  say(22, '增七和弦写作 +7 或 aug7。', {tones: chord(SEVENTH.aug7.keys, CENTER, '', true), staffSymbols: [stack(['C','+7'],['C','aug7'])]}, {hint: '提示：这里的 7 是小七度。'});
  check(23, 'dash7', {panel: PANEL.symbol('C','−7')}, {
    question: 'C−7 表示：', options: [['dim7','C 减七和弦'],['m7','C 小七和弦'],['aug7','C 增七和弦']], answer: 'm7',
    right: '紧跟在根音后面的“−”表示小三和弦，C−7 与 Cm7 表示相同的结构。',
    wrong: '第一课里，“−”与“°”分别表示什么性质？'
  });
  say(24, `另外四种七和弦，需要用${accent('新的规则')}来标记。`, named('new', [['C','7','大小七'],['C','m(maj7)','小大七'],['C','ø7','半减七'],['C','maj7(♯5)','增大七']]));
  say(25, '大小七和弦只在根音后面标记 7，这几乎是它唯一的写法；不要把「大」「小」拼进记号里，写成 CMm7 之类的形式。', namedChord('dom7'));
  check(26, 'c7', {panel: PANEL.symbol('C','7')}, {
    question: 'C7 的七音是：', options: [['B','B'],['Bbb','B𝄫'],['Bb','B♭']], answer: 'Bb',
    right: 'C7 的 7 默认表示小七度，所以七音是 B♭。',
    wrong: '大七度与减七度都有另外的标记；单独的 7 默认表示什么？'
  });
  say(27, '小大七和弦的三和弦与七度都要写出来：m(maj7)，也可以写作 mM7 或 −△7。', {tones: chord(SEVENTH.mM7.keys, CENTER, '', true), staffSymbols: [stack(['C','m(maj7)'],['C','mM7'],['C','−△7'])]});
  check(28, 'minor-major-difference', DEMO.minorMajor, {
    question: 'Cm7 与 Cm(maj7) 的差别在：', options: [['seventh','七音的性质'],['root','根音'],['triad','三和弦的性质']], answer: 'seventh',
    right: '两者都是 C 小三和弦，区别在七音：Cm7 是小七度，Cm(maj7) 是大七度。',
    wrong: '两种记号都带 m；发生变化的是哪个部分？'
  });
  say(29, '半减七和弦写作 ø7，这个符号由减三和弦的 ° 变化而来。', namedChord('half','ø7'));
  say(30, '半减七和弦也可以看作小七和弦降低五音，写作 m7(♭5) 或 m7−5。', {...SCENE.m7VsHalf, staffSymbols: [sym('C', 'm7', PAIR[0], {size: 15}), {...stack(['C', 'm7(♭5)'], ['C', 'm7−5']), slot: PAIR[1], size: 15}]});
  check(31, 'half-symbols', SCENE.plain('half'), {
    question: '下面哪些记号都表示 C 半减七和弦？', options: [['o7',cs('C','°7')],['half',cs('C','ø7')],['m7',cs('C','m7')],['b5',cs('C','m7(♭5)')]], answer: ['half','b5'],
    right: 'Cø7 与 Cm7(♭5) 都表示 C–E♭–G♭–B♭；C°7 的七音是 B𝄫，Cm7 的五音是 G。',
    wrong: '半减七需要同时满足减三和弦与小七度这两个条件。'
  });
  if (steps.length + 1 !== 32) throw new Error('Demo 页码不连续：32');
  group('demo-32', [[p('增大七和弦写作 maj7(♯5) 或 △7(♯5)，也可以写作 +△7 或 +maj7。') + warn(`这里的 + 写在 △7、maj7 前面，和增七和弦 C+7 的 7 不一样：C+7 是${accent('小七度')}，C+△7 是${accent('大七度')}。`), {tones: chord(SEVENTH.augM7.keys, CENTER, '', true), staffSymbols: [stack(['C','maj7(♯5)'],['C','△7(♯5)'],['C','+△7'],['C','+maj7'])]}]]);
  say(33, '前面 m7(♭5)、maj7(♯5) 里的 ♭5、♯5，表示把原来的五音降低或升高半音；也可以写成 −5、+5。', DEMO.changedFifth);
  say(34, '现在，把八种七和弦的名称与记号整理在一起，分别核对三和弦与七音。', panel('all-symbols', allSymbols));

  section('mistakes', '四', '常见的错误写法');
  say(35, `CmM7 表示 C 小大七和弦，但大小七和弦不写 CMm，就写 C7。`, {panel: PANEL.mistakes(1)});
  say(36, `C 表示 C 大三和弦，但 C7 不是大七和弦：大七度必须用 maj、M 或 △ 标出来。`, {panel: PANEL.mistakes(2)});
  say(37, `−7 表示小七和弦，不是减七和弦：紧跟在音名后面的 − 表示小，5 前面的 − 表示降低。`, {panel: PANEL.mistakes(3)});

  section('derive', '五', '根据记号推导和弦音');
  say(38, '根据记号构建七和弦，可以分成三步：确定根音、构建三和弦、确定七音。', {panel: PANEL.symbol('D','m7')});
  say(39, '第一步，从记号开头的音名确定根音。', SCENE.derive(1));
  say(40, '第二步，根据后缀判断三和弦的性质，再构建三音与五音。', {...SCENE.derive(3), caption: 'm：小三和弦 → D–F–A'});
  say(41, '第三步，确定七音：带 maj7、M7 或 △7 的写法采用大七度，°7、dim7 采用减七度，本课其余写法采用小七度。', SCENE.derive(4));
  check(42, 'ebmaj7', {panel: PANEL.symbol('E♭','maj7')}, {
    question: 'E♭maj7 的和弦音是：', options: [['right','E♭–G–B♭–D'],['dom','E♭–G–B♭–D♭'],['minor','E♭–G♭–B♭–D']], answer: 'right',
    right: '先构建 E♭ 大三和弦 E♭–G–B♭，再加入根音上方的大七度 D。',
    wrong: '分别检查两件事：三和弦是不是大三和弦，七音是不是大七度。'
  });
  check(43, 'bdim7', {panel: PANEL.symbol('B','°7')}, {
    question: 'B°7 的和弦音是：', options: [['right','B–D–F–A♭'],['half','B–D–F–A'],['minor','B–D–F♯–A']], answer: 'right',
    right: 'B°7 是减三和弦 B–D–F，加上根音上方的减七度 A♭。',
    wrong: '°7 要同时满足减三和弦与减七度，两个条件都要检查。'
  });
  check(44, 'write-f7', {tones: chord(['F4','A4','C5','Eb5'])}, {
    question: '写出谱例的和弦记号。', input: 'F7',
    right: 'F–A–C 是大三和弦，F 到 E♭ 是小七度，所以写作 F7。',
    wrong: '先判断三和弦，再判断根音到七音的音程。', reveal: [sym('F','7')]
  });

  section('inversion', '六', '七和弦的转位与斜线记号');
  say(45, '和三和弦一样，七和弦的根音在低音时，称为原位。', SCENE.inversion(0));
  say(46, '七和弦的三音、五音、七音在低音时，分别称为第一转位、第二转位和<strong>第三转位（Third Inversion）</strong>。', [1,2,3].map(SCENE.inversion), {sequence: 1800, hint: '点击按钮，比较原位与三种转位。'});
  say(47, '转位的标记方法与第一课相同：斜线左边写和弦，右边写实际的低音。', SCENE.inversion(1));
  say(48, '按和弦结构拼写时，斜线后的低音，要保留它作为三音、五音或七音的音名。', SCENE.dimSlashPair);
  say(49, '为了减少复杂的变音记号、方便读谱，实际演奏谱中有时会用等音名来写低音。', {panel: PANEL.readable});
  say(50, '斜线记号除了表示转位，还能把上方的和弦与低音分开标记。', SCENE.slashTriad);
  say(51, '当低音正好提供七和弦的七音时，可以只在斜线前写三和弦，数字 7 写不写都不改变整体结构。', SCENE.slashTriad);
  say(52, '这种写法虽然省去了记号中的 7，但七音仍然在低音中，和弦并没有少一个音。', {...SCENE.slashTriad, tones: SCENE.slashTriad.tones.map(t => t.id === 'seventh' ? {...t,color:COLOR.bass,label:'7'} : t)});
  say(53, '有些七和弦还可以把根音分离出来，用“上方三和弦／根音”的形式标记。', SCENE.splitPair);
  say(54, '所以，斜线和弦并不一定表示转位和弦。判断整个七和弦是否转位，仍要看低音和整体根音的关系。', {...SCENE.splitAm7,caption:'C/A：整体是原位 Am7，低音 A 是整个七和弦的根音'});
  check(55, 'inv-bass', {panel: PANEL.symbol('C','7','B♭')}, {
    question: 'C7/B♭ 的低音是和弦的：', options: [['third','三音'],['fifth','五音'],['seventh','七音']], answer: 'seventh',
    right: 'C7 的七音是 B♭，七音在低音，所以是第三转位。',
    wrong: '先列出 C7 的四个和弦音，再看 B♭ 承担什么角色。'
  });
  check(56, 'drop-seven', {panel: PANEL.dropSuffix('C','7','B♭')}, {
    question: 'C7/B♭ 可以写成 C/B♭，两种记号表示相同的和弦音。', options: TF, answer: 'true',
    right: '上方的 C 大三和弦提供 C、E、G，低音 B♭ 提供七音，因此两种写法包含相同的四个音。',
    wrong: '把斜线前的三和弦与斜线后的低音合在一起，看看有没有少音。'
  });
  check(57, 'dim-slash', {tones: [tone('seventh','Bbb3'),tone('root','C4'),tone('third','Eb4'),tone('fifth','Gb4')]}, {
    question: '谱例是 C°7 的第三转位。按和弦结构拼写，斜线后面应该写：', options: [['bbb','B𝄫'],['a','A'],['bb','B♭']], answer: 'bbb',
    right: 'C°7 的七音按减七度拼写为 B𝄫，因此写 C°7/B𝄫；实际演奏谱中也可能用等音 A 来方便读谱。',
    wrong: '题目要求按和弦结构拼写；从根音 C 数到七度，需要使用哪个字母？', reveal: [sym('C','°7',CENTER,{bass:'B𝄫'})]
  });
  check(58, 'write-g7-b', {tones: [tone('third','B3'),tone('fifth','D4'),tone('seventh','F4'),tone('root','G4')]}, {
    question: '写出谱例的和弦记号，转位用斜线记号表示。', input: 'G7/B',
    right: '按三度还原为 G–B–D–F，是 G7；低音 B 是三音，所以写 G7/B。',
    wrong: '先找整个和弦的根音，再把实际低音写在斜线后面。', reveal: [sym('G','7',CENTER,{bass:'B'})]
  });

  section('enharmonic', '七', '等音记谱');
  say(59, '为了方便读谱，有时会把一个音改写成音高相同、音名不同的等音，这种做法称为<strong>等音记谱（Enharmonic Spelling）</strong>。', DEMO.enharmonic);
  say(60, '按和弦结构拼写，E 增七和弦的五音是 B♯。', SCENE.enharmonicStrict);
  say(61, '实际乐谱里，B♯ 常写成同音的 C，因为 C 更常见、更好认，实际音高不变。', DEMO.sameSound);
  say(62, `看谱时要按和弦结构还原：E、G♯、C、D 仍然是 E 增七和弦，记作 ${accent('E+7')} 或 E7(♯5)。`, {...SCENE.enharmonic, caption: ''});
  say(63, '本课的练习，以及以后的实际乐谱里，都会经常遇到这样的写法。', {...SCENE.enharmonic, caption: ''});
  check(64, 'enharmonic-read', {...SCENE.enharmonic, staffSymbols: [], caption: ''}, {
    question: '谱例中和弦的记号是：',
    options: [['e7', 'E7'], ['aug', 'E+7'], ['maj', 'Emaj7']], answer: 'aug',
    right: 'C 是 B♯ 的等音写法：E 上方的增五度。E、G♯、B♯（写成 C）、D 是 E 增七和弦：E+7。',
    wrong: '谱面上的 C，和根音 E 按结构应该是什么音程？'
  });

  if (steps.length !== 64 || steps.filter(step => step.quiz).length !== 16) throw new Error('Demo 页数或 Quiz 数量不正确');
  ChordLesson.run({
    steps, sections, quizLockHint: true, quizExtras: true, tapParts: true,
    inputLevel: 2,
    reference: window.chordReference,
    onControl: id => id.startsWith('quality:') ? pickStructure(id.split(':')[2], id.split(':')[1]) : SCENE.inversion(Number(id.slice(3))),
    preload: ['C4','D4','E4','F4','G4','A4','B4','Eb4','Gb4','Bb4','G#4','Bbb4','G3','B3','D5','C5','E5','Bb3','F3','Gb3','A3','Ab4','F#4']
  });
})();
