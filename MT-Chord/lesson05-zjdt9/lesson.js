/* 和弦记号 · 第五课：非三度关系的和弦（初稿，2026-11-03）
   文字依据老师的 PDF 课件「05和弦标记_非三度_课件」，按第一课的节奏一步一句改写；待老师逐节审核。
   讲解区：<strong> = 音乐术语；accent() = 重点词；warn() = 「注意」。
   演示区：所有谱例共用一个舞台，步骤之间用“神奇移动”过渡。规则见 docs/interactive-theory-lesson-standard.md。 */
(() => {
  'use strict';
  const {COLOR, chordSymbol: cs, CENTER, PAIR} = ChordStage;

  /* ---------- 谱例资料 ---------- */
  const tone = (id, key, color = COLOR.ink, label = '', slot = CENTER) => ({id, key, color, label, slot});
  const sym = (root, suffix = '', slot = CENTER, extra = {}) => ({slot, root, suffix, ...extra});
  const mark = (id, key, label) => tone(id, key, COLOR.ext, label);  // 替代、附加的音
  const C = [tone('root', 'C4'), tone('third', 'E4'), tone('fifth', 'G4')];
  const PANEL = {
    kinds: {key: 'kinds', html: `<p class="symbol-row">${[['C', 'sus4'], ['C', 'add9'], ['C', '(omit5)'], ['C', '5']].map(([r, x]) => cs(r, x)).join('　')}</p>`},
    symbol: (root, suffix, bass = '') => ({key: `symbol-${root}${suffix}${bass}`, html: `<p class="symbol-row big">${cs(root, suffix, bass)}</p>`}),
    symbols: list => ({key: 'symbols-' + list.map(x => x.join('')).join(), html: `<p class="symbol-row">${list.map(([r, x, b]) => cs(r, x, b || '')).join('　')}</p>`}),
    // 完整和弦记号的结构
    order: {key: 'order', html:
      '<div class="symbol-split compact" role="img" aria-label="完整和弦记号的结构：根音、性质、数字、特殊结构、斜线、低音">' +
      [['B♭', '根音'], ['m', '性质'], ['7', '7 / 9 / 11 / 13'], ['(♭5, ♯11)', '特殊结构'], ['/', '斜线'], ['A♭', '低音']]
        .map(([g, r]) => `<div class="symbol-part"><span class="symbol-glyph">${g}</span><span class="symbol-role">${r}</span></div>`).join('') + '</div>'}
  };
  const SCENE = {
    triad: {tones: C, staffSymbols: [sym('C')], play: true},
    sus4: {tones: [tone('root','C4'), mark('third','F4','4'), tone('fifth','G4')], staffSymbols: [sym('C', 'sus4')], caption: '三音 E → <b class="c-ext">F</b>（纯四度）', play: true},
    sus2: {tones: [tone('root','C4'), mark('third','D4','2'), tone('fifth','G4')], staffSymbols: [sym('C', 'sus2')], caption: '三音 E → <b class="c-ext">D</b>（大二度）', play: true},
    sus7: {tones: [tone('root','C4'), mark('third','F4','4'), tone('fifth','G4'), tone('seventh','Bb4')], staffSymbols: [sym('C', '7sus4')], caption: '七和弦也可以挂留：C7sus4', play: true},
    m7sus4: {tones: [tone('root','C4'), mark('third','F4','4'), tone('fifth','G4'), tone('seventh','Bb4')], staffSymbols: [{slot: CENTER, stack: [['C', 'm7sus4'], ['C', '7sus4']]}], caption: '没有三音，m 没有意义：写 C7sus4'},
    add2: {tones: [tone('root','C4'), mark('add','D4','2'), tone('third','E4'), tone('fifth','G4')], staffSymbols: [sym('C', 'add2')], caption: '加上大二度 D', play: true},
    add9: {tones: [...C, mark('add','D5','9')], staffSymbols: [sym('C', 'add9')], caption: '加上大九度 D', play: true},
    six: {tones: [...C, mark('add','A4','6')], staffSymbols: [sym('C', '6')], caption: '加上大六度 A', play: true},
    sixNine: {tones: [...C, mark('add','A4','6'), mark('add9','D5','9')], staffSymbols: [sym('C', '6/9')], caption: '加上大六度 A 与大九度 D', play: true},
    c9VsAdd9: {tones: [...['C4','E4','G4','Bb4','D5'].map((k, i) => tone('a' + i, k, COLOR.ink, '', PAIR[0])), ...['C4','E4','G4','D5'].map((k, i) => tone(['root','third','fifth','add'][i], k, COLOR.ink, '', PAIR[1]))],
      staffSymbols: [sym('C', '9', PAIR[0]), sym('C', 'add9', PAIR[1])], caption: '左：有七音 B♭（属九和弦）　右：没有七音'},
    omit: {tones: [tone('root','C4'), tone('fifth','G4'), tone('seventh','B4')], staffSymbols: [sym('C', 'maj7(omit3)')], caption: '省略三音：C–G–B', play: true},
    noFifth: {tones: [tone('root','C4'), tone('third','E4')], staffSymbols: [sym('C')], caption: '只有 C 与 E，也可以记作 C', play: true},
    power: {tones: [tone('root','C4'), tone('fifth','G4')], staffSymbols: [sym('C', '5')], caption: '纯五度双音：C5', play: true},
    ninthVsSus2: {tones: [...['C4','E4','G4','Bb4','D5'].map((k, i) => tone('n' + i, k, COLOR.ink, '', PAIR[0])),
      tone('root', 'C4', COLOR.ink, '', PAIR[1]), tone('third', 'D4', COLOR.ext, '2', PAIR[1]), tone('fifth', 'G4', COLOR.ink, '', PAIR[1])],
      staffSymbols: [sym('C', '9', PAIR[0]), sym('C', 'sus2', PAIR[1])], caption: '左：有 3、7　右：没有 3、7'},
    plain: notes => ({tones: notes.map((k, i) => tone('q' + i, k))})
  };

  const {steps, sections, section, group, quiz, accent, p, warn, TF} = ChordLesson.builder();

  // 一、什么是非三度关系的和弦
  section('what', '一', '什么是非三度关系的和弦');
  group('what', [
    [p(`在三度叠置的和弦上，${accent('替代、添加或省略')}部分和弦音，得到的和弦统称为<strong>非三度关系的和弦（Modified Chords）</strong>。`), SCENE.triad],
    [p(`常见的有四种：挂留和弦（sus）、附加音和弦（add）、省略音和弦（omit）与强力和弦（5）。`), {panel: PANEL.kinds}]
  ]);

  // 二、挂留和弦
  section('sus', '二', '挂留和弦（sus）');
  group('sus', [
    [p(`把和弦的${accent('三音')}换成相邻的 2 或 4，称为<strong>挂留和弦（Suspended Chord）</strong>，用 sus 标记。`), SCENE.sus4],
    [p(`<strong>sus4</strong>：用纯四度代替三音，例如 Csus4、C7sus4。sus4 的 4 常省略，直接写 sus。`), SCENE.sus7],
    [p(`<strong>sus2</strong>：用大二度代替三音，例如 Csus2。`), SCENE.sus2],
    [p(`三音不在了，所以 sus 和弦${accent('不分大小')}。`), SCENE.sus4]
  ]);
  group('sus-misuse', [
    [warn(`m7sus4 是常见的误用：没有三音，m7sus4 和 7sus4 结构相同，写${accent('更简单的 7sus4')}。`), SCENE.m7sus4],
    [p(`带变化音时，sus 要和变化音一起写在括号里，例如 C7(♭9, sus4)。`), {panel: PANEL.symbol('C', '7(♭9, sus4)')}]
  ]);
  quiz('sus4', SCENE.plain(['D4', 'G4', 'A4']), {
    question: '谱例中的和弦（D–G–A）是：',
    options: [['dsus4','Dsus4'], ['dsus2','Dsus2'], ['g','G']], answer: 'dsus4',
    right: '正确。D 上方纯四度 G 代替了三音：Dsus4。',
    wrong: '以 D 为根音：G 和 D 是几度？',
    reveal: [sym('D', 'sus4')]
  });
  quiz('msus', {panel: PANEL.symbol('C', 'm7sus4')}, {
    question: 'Cm7sus4 和 C7sus4 是同一个和弦。',
    options: TF, answer: 'true',
    right: '正确。sus4 代替了三音，m 已经没有意义；写 C7sus4 就好。',
    wrong: 'sus4 代替的是哪个音？那 m 还剩下什么意义？'
  });

  // 三、附加音和弦
  section('add', '三', '附加音和弦（add）');
  group('add', [
    [p(`在三和弦上，额外加上根音上方指定度数的音，称为<strong>附加音和弦（Added-note Chord）</strong>，用 add 标记。`), SCENE.add9],
    [p(`常见的四种：${accent('add2')}（加大二度）、${accent('add9')}（加大九度）……`), SCENE.add2],
    [p(`……${accent('6')}（加大六度）、${accent('6/9')}（加大六度与大九度）。`), SCENE.sixNine],
    [p(`只要${accent('没有七音')}，加了什么音都归为附加音和弦，用同一套写法。`), SCENE.six]
  ]);
  group('add-omit', [
    [p(`没有歧义时，add 可以不写：Cadd2 可写作 C2，6 和 6/9 前面也不写 add。`), {panel: PANEL.symbols([['C', '2'], ['C', '6'], ['C', '6/9']])}],
    [warn(`C9 已经表示属九和弦（有七音），所以 ${accent('Cadd9 不能简写成 C9')}。`), SCENE.c9VsAdd9]
  ]);
  quiz('add9', SCENE.c9VsAdd9, {
    question: 'C–E–G–D（没有七音）应该写作：',
    options: [['add9','Cadd9'], ['c9','C9'], ['sus2','Csus2']], answer: 'add9',
    right: '正确。没有七音，是附加音和弦：Cadd9。C9 有七音 B♭。',
    wrong: 'C9 和 Cadd9 的区别在哪个音？'
  });
  quiz('six', SCENE.plain(['F4', 'A4', 'C5', 'D5']), {
    question: '谱例中的和弦（F–A–C–D）是：',
    options: [['f6','F6'], ['dm7','Dm7/F'], ['f13','F13']], answer: 'f6',
    right: '正确。按原位优先，F 大三和弦加上大六度 D：F6。',
    wrong: '先把低音 F 当作根音：D 是它的几度？有没有七音？',
    reveal: [sym('F', '6')]
  });

  // 四、省略音和弦
  section('omit', '四', '省略音和弦（omit）');
  group('omit', [
    [p(`省略原有和弦里的某个结构音，用 <strong>omit</strong> 标记，例如 Cmaj7(omit3) = C–G–B。`), SCENE.omit],
    [p(`有些教材或软件用 no 代替 omit：C(no5) 与 C(omit5) 意思一样。`), {panel: PANEL.symbols([['C', '(no5)'], ['C', '(omit5)']])}],
    [p(`纯五度会从低音的泛音里自然产生，所以${accent('省略五音一般不写出来')}：只有 C 和 E，也可以记作 C。`), SCENE.noFifth],
    [p(`延伸音和弦里省略的 9、11，非必要也不用 omit 标出（第三课）。`), {panel: PANEL.symbol('C', '13')}]
  ]);
  group('slash-simplify', [
    [p(`带省略音的属和弦，为了演奏方便，常简写成斜线和弦：例如 G9(sus4, omit5) 写作 ${accent('F/G')}。`), {panel: PANEL.symbols([['G', '9(sus4, omit5)'], ['F', '', 'G']])}],
    [p(`同样，G13(sus4, omit5) 写作 Fmaj7/G；G9(omit3) 写作 D−/G。`), {panel: PANEL.symbols([['F', 'maj7', 'G'], ['D', '−', 'G']])}]
  ]);
  quiz('omit5', SCENE.noFifth, {
    question: '谱例中只有 C 和 E，最常见的标记是：',
    options: [['c','C'], ['omit','C(omit5)'], ['c5','C5']], answer: 'c',
    right: '正确。五音的省略一般不写出来。C5 是强力和弦（C 与 G），不一样。',
    wrong: '五音省略需要特别写出来吗？'
  });

  // 五、强力和弦
  section('power', '五', '强力和弦（5）');
  group('power', [
    [p(`只由一对${accent('纯五度')}双音组成的和弦，称为<strong>强力和弦（Power Chord）</strong>，标记为 5，例如 C5 = C–G。`), SCENE.power],
    [p(`没有三音，所以强力和弦${accent('不分大小')}：没有 Cmaj5、Cm5 这样的写法。`), SCENE.power]
  ]);
  quiz('power', {panel: PANEL.symbol('A♭', '5')}, {
    question: 'A♭5 的组成音是：',
    options: [['right','A♭–E♭'], ['triad','A♭–C–E♭'], ['dim','A♭–D']], answer: 'right',
    right: '正确。强力和弦只有根音与纯五度。',
    wrong: '强力和弦有三音吗？'
  });

  // 六、容易混淆的写法
  section('compare', '六', '容易混淆的写法');
  group('compare', [
    [warn(`九和弦与 sus2、十一和弦与 sus4 是不同的和弦：区别在于${accent('三音、七音')}在不在。`), SCENE.ninthVsSus2],
    [p(`sus 和弦与延伸音和弦的区别是有没有三音，所以 m7(sus2) 里的 m 是多余的。`), {panel: PANEL.symbol('C', 'm7(sus2)')}],
    [p(`add 和弦与延伸音和弦的区别是有没有七音，所以 7(add6) 可以直接写 ${accent('13')}。`), {panel: PANEL.symbols([['C', '7(add6)'], ['C', '13']])}],
    [p(`没有和声环境时，非三度关系的和弦都${accent('优先看作原位')}；有几种写法时，选最能体现和声功能的那一种。`), SCENE.six]
  ]);
  quiz('add6', {panel: PANEL.symbol('C', '7(add6)')}, {
    question: 'C7(add6) 更简洁的写法是：',
    options: [['c13','C13'], ['c6','C6'], ['c69','C6/9']], answer: 'c13',
    right: '正确。有七音再加 6（13），就是十三和弦：C13。',
    wrong: '有七音的和弦，加上的 6 其实是延伸音几？'
  });

  // 七、完整和弦记号的结构
  section('order', '七', '完整和弦记号的结构');
  group('order', [
    [p(`学完五课，一个完整的和弦记号按这个顺序书写：${accent('根音 → 性质 → 7 / 9 / 11 / 13 → 特殊结构 → 斜线 → 低音')}。`), {panel: PANEL.order}],
    [p(`例如 ${accent('B♭m7(♭5, ♯11)/A♭')}：根音 B♭，小七和弦降五音，加 ♯11，低音 A♭。`), {panel: PANEL.symbol('B♭', 'm7(♭5, ♯11)', 'A♭')}]
  ]);
  quiz('order', {panel: PANEL.symbols([['C', '7(♭9)', 'E'], ['C', '(♭9)7', 'E']])}, {
    question: '下面哪一个书写顺序是规范的？',
    options: [['a','C7(♭9)/E'], ['b','C(♭9)7/E']], answer: 'a',
    right: '正确。数字 7 在前，括号里的特殊结构在后，最后是斜线与低音。',
    wrong: '回想顺序：根音 → 性质 → 数字 → 特殊结构 → 斜线 → 低音。'
  });

  ChordLesson.run({
    steps, sections,
    preload: ['C4','D4','E4','F4','G4','A4','Bb4','B4','C5','D5','Ab4','Eb4']
  });
})();
