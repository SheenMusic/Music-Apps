/* 音程 · 第三课：变化音程 / 等音程 / 记谱的选择
   文字依据 assets/lesson-03.pdf（变化音程、等音程），并补入「构建变化音程」「听感」与「记谱的选择」，按「一步一句」。步数整课连续计算。
   讲解区：<strong> = 音乐术语；accent() = 重点词；warn() = 「注意」。
   演示区与流程用和弦记号课程的共享实现（MT-Chord/shared），步骤之间用“神奇移动”过渡。
   规则见 docs/interactive-theory-lesson-standard.md。 */
(() => {
  'use strict';
  const {COLOR, PAIR} = ChordStage;

  /* ---------- 谱例资料 ---------- */
  const tone = (id, key, slot, extra = {}) => ({id, key, slot, ...extra});
  const below = (id, slot, text, color = '#334155') => ({id, slot, text, color});
  const above = (id, slot, text, extra = {}) => ({id, slot, text, anchor: 'middle', font: 'label', size: 16, color: '#4f46e5', ...extra});
  const CENTER = (PAIR[0] + PAIR[1]) / 2;

  // 旋律音程：两个全音符先后发声，上方标名称
  const melodic = (a, b, name) => ({
    tones: [tone('lo', a, PAIR[0]), tone('hi', b, PAIR[1])],
    staffSymbols: name ? [above('name', CENTER, name)] : [], play: true
  });
  // 两个和声音程并排（如 A2 与 m3），上方标名称
  const harmonic = ([a1, a2], [b1, b2], [name1, name2]) => ({
    tones: [tone('l1', a1, PAIR[0]), tone('u1', a2, PAIR[0]), tone('l2', b1, PAIR[1]), tone('u2', b2, PAIR[1])],
    staffSymbols: [above('n1', PAIR[0], name1), above('n2', PAIR[1], name2)]
  });

  // 两个小节并排：每小节两个二分音符（先后发声），中间与结尾都有小节线；下方标音数，中间可标「等音程」
  const M1 = [.1, .9], M2 = [1.9, 2.7], BAR = 1.4;
  const MID = [(M1[0] + M1[1]) / 2, (M2[0] + M2[1]) / 2];
  const measures = ([a1, a2], [b1, b2], {names = null, counts = null, middle = null, play = false} = {}) => ({
    bars: [BAR], barlines: true, play,
    tones: [tone('a1', a1, M1[0], {duration: 'h'}), tone('a2', a2, M1[1], {duration: 'h'}), tone('b1', b1, M2[0], {duration: 'h'}), tone('b2', b2, M2[1], {duration: 'h'})],
    staffSymbols: names ? [above('name1', MID[0], names[0]), above('name2', MID[1], names[1])] : [],
    staffLabels: [
      ...(counts ? [below('count1', MID[0], counts[0]), below('count2', MID[1], counts[1]), below('count', -.9, '音数', '#64748b')] : []),
      ...(middle ? [below('middle', BAR, middle, '#4f46e5')] : [])]
  });

  // 半音化的旋律：每组三个全音符，第一、二个音之间标 A1
  const G1 = [-.1, .6, 1.2], G2 = [2.0, 2.65, 3.25], BAR3 = 1.6;
  const chromatic = (down = false, extra = {}) => ({
    bars: down ? [BAR3] : [], barlines: down,
    tones: [tone('u1', 'C4', G1[0]), tone('u2', 'C#4', G1[1]), tone('u3', 'D4', G1[2]),
      ...(down ? [tone('d1', 'D4', G2[0]), tone('d2', 'Db4', G2[1]), tone('d3', 'C4', G2[2])] : [])],
    staffSymbols: [above('a1u', (G1[0] + G1[1]) / 2, 'A1'), ...(down ? [above('a1d', (G2[0] + G2[1]) / 2, 'A1')] : [])],
    ...extra
  });

  // A 和声小调：A4–A5，第七级 G♯（可换成别的写法）；focus 列出不变淡的音。
  // 第七级前留出升降号的位置，免得碰到 F 的符头
  const MINOR = ['A4','B4','C5','D5','E5','F5','G#5','A5'], SCALE_SLOTS = [0, .43, .86, 1.29, 1.72, 2.15, 2.8, 3.25];
  const scaleSlot = i => SCALE_SLOTS[i];
  const minor = ({seventh = 'G#5', focus = null, color = {}} = {}) => ({
    tones: MINOR.map((k, i) => tone('m' + i, i === 6 ? seventh : k, scaleSlot(i),
      color[i] ? {color: color[i]} : focus && !focus.includes(i) ? {color: COLOR.faint} : {}))
  });

  // 性质关系图（与第二课相同）。state 'altered'：度数都显示，「减」「增」两侧高亮
  const qualityMap = state => ({panel: {key: 'quality-map', state, html:
    '<div class="quality-map"><div class="qm-side">减</div><div class="qm-center">' +
    '<div class="qm-pure-wrap"><div class="qm-degree">1 · 4 · 5 · 8</div><div class="qm-line"></div><div class="qm-pure">纯</div></div>' +
    '<div class="qm-mm-wrap"><div class="qm-mm"><span>小</span><span>大</span></div><div class="qm-line"></div><div class="qm-degree">2 · 3 · 6 · 7</div></div>' +
    '</div><div class="qm-side">增</div></div>'}});

  // 音数尺（面板）：中间一行是自然音程；增音程从左边一格滑到上方，减音程从右边一格滑到下方。
  // marks 列出显示的增 / 减音程（由 CSS 依次渐入）；窄屏可横向拖动，演示时自动滚到正在出现的那一格。
  const NATURAL = ['P1','m2','M2','m3','M3','P4','A4<br>d5','P5','m6','M6','m7','M7','P8'];
  const COUNTS = ['0','0.5','1','1.5','2','2.5','3','3.5','4','4.5','5','5.5','6'];
  const AUG = {1: 'A1', 3: 'A2', 5: 'A3', 8: 'A5', 10: 'A6', 12: 'A7'};
  const DIM = {0: 'd2', 2: 'd3', 4: 'd4', 7: 'd6', 9: 'd7', 11: 'd8'};
  const rulerHTML = '<div class="ruler-scroll"><div class="ruler">' +
    '<div class="ruler-tag" style="grid-row:1">增</div><div class="ruler-tag" style="grid-row:2">自然</div>' +
    '<div class="ruler-tag" style="grid-row:3">减</div><div class="ruler-tag ruler-tag-count" style="grid-row:4">音数</div>' +
    NATURAL.map((name, i) => {
      const col = `grid-column:${i + 2}`;
      return `<div class="ruler-natural" style="${col}">${name}</div><div class="ruler-count" style="${col}">${COUNTS[i]}</div>` +
        (AUG[i] ? `<div class="ruler-name ruler-aug" data-mark="${AUG[i]}" style="${col};--i:${Object.keys(AUG).indexOf(String(i))}">${AUG[i]}</div>` : '') +
        (DIM[i] ? `<div class="ruler-name ruler-dim" data-mark="${DIM[i]}" style="${col};--i:${Object.keys(DIM).indexOf(String(i))}">${DIM[i]}</div>` : '');
    }).join('') + '</div></div>';
  const ruler = marks => ({panel: {key: 'ruler', html: rulerHTML, marks}});
  const AUG_ALL = Object.values(AUG), DIM_ALL = Object.values(DIM);
  // 增 / 减音程开始渐入时，把那一格滚到画面中间（只在需要滚动的窄屏上有效）
  document.addEventListener('transitionstart', event => {
    const name = event.target;
    if (!name.classList?.contains('ruler-name') || !name.classList.contains('active') || event.propertyName !== 'opacity') return;
    const scroller = name.closest('.ruler-scroll');
    if (scroller.scrollWidth <= scroller.clientWidth) return;
    scroller.scrollTo({left: name.offsetLeft - (scroller.clientWidth - name.offsetWidth) / 2, behavior: 'smooth'});
  });

  // 结构概念图（面板）：实线圈里是自然音程；圈外的虚线区域随后渐入，是变化音程
  const intervalMap = {panel: {key: 'interval-map', html:
    '<div class="interval-map"><div class="im-frame"></div>' +
    '<div class="im-natural"><span class="im-title">自然音程</span><span>大 · 小 · 纯</span><span class="im-exception">增四 · 减五</span></div>' +
    '<div class="im-outside"><span>增 · 减　　倍增 · 倍减</span><span class="im-title">变化音程</span></div></div>'}};

  const SCENE = {
    m2: melodic('C4', 'D4', 'M2'),
    a2: melodic('C4', 'D#4', 'A2'),
    a2red: {...melodic('C4', 'D#4', 'A2'), tones: [tone('lo', 'C4', PAIR[0]), tone('hi', 'D#4', PAIR[1], {color: COLOR.bass})]},
    // C–E♭ 在降 E 大调里是 6 级和 1 级：下方一行写调名和两个音的级数
    m3inEb: {...melodic('C4', 'Eb4', 'm3'),
      staffLabels: [below('key', PAIR[0] - .9, 'E♭', '#64748b'), below('deg1', PAIR[0], '6'), below('deg2', PAIR[1], '1')]},
    compare: harmonic(['C4', 'D#4'], ['C4', 'Eb4'], ['A2', 'm3']),
    compareOK: harmonic(['C4', 'D#4'], ['C4', 'Eb4'], ['A2', 'm3 ✓']),
    enharmonic: {tones: [tone('lo', 'G#4', PAIR[0]), tone('hi', 'Ab4', PAIR[1])], staffSymbols: [above('name', CENTER, '等音')], play: true},
    pairs: options => measures(['E4', 'F4'], ['E4', 'E#4'], {counts: ['0.5', '0.5'], ...options}),
    tritone: {...harmonic(['C4', 'F#4'], ['C4', 'Gb4'], ['A4', 'd5']),
      staffLabels: [below('c1', PAIR[0], '音数 3'), below('c2', PAIR[1], '音数 3')]}
  };
  const ENHARMONIC_PAIRS = SCENE.pairs({names: ['m2', 'A1'], middle: '← 等音程 →'});

  /* ---------- 课程内容 ---------- */
  const {steps, sections, section, group, quiz, accent, p, warn, TF} = ChordLesson.builder();
  const aside = text => `<p class="lesson-aside">${text}</p>`;

  // 一、变化音程
  section('altered', '一', '变化音程');
  group('altered', [
    [p('自然音程以外的音程叫<strong>变化音程</strong>。'), intervalMap],
    [p(`例如把 D 升高为 D♯，大二度就变成了<strong>增二度</strong>，它${accent('不属于')}自然音程。`), [SCENE.m2, SCENE.a2], {sequence: 1400}],
    [p(`变化音程包含除${accent('增四度、减五度')}以外的所有增音程和减音程，以及倍增、倍减音程。`) +
      aside('倍增、倍减：比增音程再宽一个半音、比减音程再窄一个半音。使用较少，这里不展开。'), qualityMap('altered')]
  ]);
  group('feature', [
    [p(`<strong>变化音程的特点</strong>：因为变化音程都是基于自然音程变来的，所以变化音程里${accent('至少有一个音')}是变化音。`), SCENE.a2red],
    [p(`但不是说只要有变化音的音程都是变化音程。例如 C–E♭ 也有变化音，但它可能是降 E 大调的 6 级和 1 级，是小三度，属于${accent('自然音程')}。`), SCENE.m3inEb],
    [p(`所以，变化音程的“变化”不能直接理解为变化音，而是相对于${accent('自然音程性质')}的变化。`), {...SCENE.m3inEb, play: false}],
    [p(`变化音程都由自然音程变来：${accent('度数不变')}，把其中一个音升高或降低。`), [melodic('C4', 'A4', 'M6'), melodic('C4', 'A#4', 'A6')], {sequence: 1400}]
  ]);
  quiz('a5', {tones: [tone('lo', 'C4', PAIR[0])], staffSymbols: [above('q', PAIR[1], '?')]}, {
    question: '比 C 高增五度的音是：', options: [['G#', 'G♯'], ['Ab', 'A♭'], ['G', 'G']], answer: 'G#',
    right: '正确。C 往上五度是 G，C–G 是纯五度，增五度再宽一个半音：G♯。',
    wrong: '先按度数确定音名：C 往上五度是什么音？'
  });
  quiz('d3', {tones: [tone('lo', 'E4', PAIR[0])], staffSymbols: [above('q', PAIR[1], '?')]}, {
    question: '比 E 高减三度的音是：', options: [['Gb', 'G♭'], ['F#', 'F♯'], ['G', 'G']], answer: 'Gb',
    right: '正确。E 往上三度是 G，E–G 是小三度，减三度再窄一个半音：G♭。',
    wrong: '三度的音名要从 E 数三个音名。F♯ 是几度？'
  });
  quiz('which-altered', qualityMap('altered'), {
    question: '下面哪些是变化音程：', options: [['A2', '增二度'], ['d5', '减五度'], ['m3', '小三度'], ['A1', '增一度']], answer: ['A2', 'A1'],
    right: '正确。增二度和增一度是变化音程；减五度属于自然音程，小三度也是自然音程。',
    wrong: '增四度和减五度是例外，属于自然音程。'
  });

  // 二、等音程
  section('enharmonic', '二', '等音程');
  group('enharmonic', [
    [p('音乐中存在<strong>同音异名</strong>（也叫<strong>等音</strong>）：音高相同，但音名不同的音，例如 G♯ 和 A♭。'), SCENE.enharmonic],
    [p(`所以任何一个变化音程，都有一个和它${accent('音高、音数相同')}的自然音程。`), SCENE.pairs({play: true})],
    [p(`像这样音高、音数相同，但${accent('度数不同')}的音程叫<strong>等音程</strong>。`), ENHARMONIC_PAIRS],
    [p(`等音程单独弹奏时听起来${accent('完全相同')}，区别只在记写方式和它在调里的作用。`), {...ENHARMONIC_PAIRS, play: true}],
    [p(`在自然音程之间，增四度和减五度是${accent('唯一')}的一对等音程。`), SCENE.tritone]
  ]);
  group('ruler', [
    [p('把等音程按音数排开：中间一行是熟悉的自然音程。'), ruler([])],
    [p(`大音程或纯音程增大一个半音变成增音程，就落到${accent('右边一格')}的自然音程上，例如 M2 增大成 A2，和 m3 同一个位置。`), ruler(AUG_ALL)],
    [p(`小音程或纯音程减小一个半音变成减音程，就落到${accent('左边一格')}的自然音程上，例如 m3 减小成 d3，和 M2 同一个位置。`), ruler([...AUG_ALL, ...DIM_ALL])]
  ]);
  quiz('same-m3', {tones: [tone('lo', 'C4', CENTER), tone('hi', 'Eb4', CENTER)], staffSymbols: [above('name', CENTER, 'm3')]}, {
    question: '和 C–E♭（m3）是等音程的是：', options: [['CDs', 'C–D♯'], ['CE', 'C–E'], ['DF', 'D–F']], answer: 'CDs',
    right: '正确。C–D♯ 是增二度，和 C–E♭ 音高、音数相同，度数不同。',
    wrong: '等音程的两个音要和 C–E♭ 音高相同。'
  });
  quiz('same-degree', SCENE.pairs({}), {
    question: '等音程的度数一定相同。', options: TF, answer: 'false',
    right: '正确，这句话是错的。等音程音高、音数相同，但度数不同，例如 m2 与 A1。',
    wrong: '回想 E–F 与 E–E♯：它们分别是几度？'
  });
  quiz('count-4', ruler([]), {
    question: '音数为 4 的变化音程是：', options: [['A5', 'A5'], ['d6', 'd6'], ['m6', 'm6']], answer: 'A5',
    right: '正确。P5 增大一个半音成为 A5，和 m6 一样是音数 4。',
    wrong: 'm6 是自然音程；d6 和 P5 音数相同（3.5）。'
  });

  // 三、记谱的选择
  section('spelling', '三', '记谱的选择');
  group('prefer', [
    [p('变化音程常出现在和声小调、离调或半音化较多的音乐中，在一般的旋律与和声里比自然音程少见。'), SCENE.compare],
    [p(`因此，在遇到没有上下文且度数不明的孤立双音时，优先使用变音记号最少、甚至不需要变音记号的${accent('自然音程')}来记录和命名。`), SCENE.compareOK],
    [p(`那什么时候要写成变化音程呢？其中一种情况是：需要强调音的${accent('运动方向')}的时候。`), SCENE.compareOK]
  ]);
  group('chromatic', [
    [p(`例如旋律从 C 半音进行到 D，中间的变化音要强调 ${accent('上行')}的运动方向，所以写成 C♯（C–C♯ 是增一度），这里的增一度会有额外的倾向性暗示功能，而且无法避免。`), chromatic(false, {play: true})],
    [p(`下行逻辑需要反过来：从 D 半音下行到 C，中间的音写成 ${accent('D♭')}。`), chromatic(true, {play: true})],
    [p(`这就是一类典型的，需要强调音的${accent('运动方向')}的情况。`), chromatic(true)]
  ]);
  group('minor', [
    [p('另一种情况是，遇到特殊的调式音阶结构的时候。例如：会把第七级升高的和声小调。'), {...minor(), play: true}],
    [p('A 和声小调中的 F–G♯ 是<strong>增二度</strong>。'), {...minor({focus: [5, 6]}), staffSymbols: [above('a2', (scaleSlot(5) + scaleSlot(6)) / 2, 'A2')]}],
    [warn(`如果把 G♯ 写成 A♭，音阶里就${accent('少了 G')}、多出一个 A，从而失去应有的结构特征。`),
      {...minor({seventh: 'Ab5', color: {0: COLOR.bass, 6: COLOR.bass, 7: COLOR.bass}}), staffSymbols: [above('miss', scaleSlot(6), 'no7th', {color: COLOR.bass, size: 11})]}],
    [p(`总的来说，只有遇到类似以上两种${accent('特殊情况')}的时候，才会需要使用变化音程。`), minor()]
  ]);
  quiz('passing', {tones: [tone('u1', 'C4', G1[0]), tone('u3', 'D4', G1[2])], staffSymbols: [above('q', G1[1], '?')]}, {
    question: '旋律从 C 半音上行到 D，中间的音应该写成：', options: [['C#', 'C♯'], ['Db', 'D♭']], answer: 'C#',
    right: '正确。上行时中间的音是 C 升高得到的，写成 C♯。',
    wrong: '旋律在上行，中间的音是由哪个音升高或降低得到的？'
  });
  quiz('seventh', {tones: MINOR.map((k, i) => i === 6 ? null : tone('m' + i, k, scaleSlot(i))).filter(Boolean), staffSymbols: [above('q', scaleSlot(6), '?')]}, {
    question: 'A 和声小调的第七级应该写成：', options: [['G#', 'G♯'], ['Ab', 'A♭']], answer: 'G#',
    right: '正确。音阶里每个音名各出现一次，第七级是 G 升高得到的 G♯。',
    wrong: '写成 A♭ 的话，音阶里会缺哪个音名？'
  });

  ChordLesson.run({
    steps, sections, countBy: 'lesson', noteLength: 1,
    // 进度用固定名字保存；旧网址的进度第一次打开时搬过来
    storageId: 'interval-03', formerPaths: ['/MT-Intervals/lesson03/', '/MT-Intervals/lesson03/index.html'],
    preload: ['C4','C#4','D4','D#4','Db4','Eb4','E4','E#4','F4','F#4','Gb4','G#4','Ab4','A4','A#4','B4','C5','D5','E5','F5','G#5','Ab5','A5']
  });
})();
