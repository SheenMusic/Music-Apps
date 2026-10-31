/* 音程 · 第二课：音程的性质 / 自然音程
   文字依据原课件与 assets/lesson-02.pdf（两页，对应两个小节），按「一步一句」。步数整课连续计算。
   讲解区：<strong> = 音乐术语；accent() = 重点词；warn() = 「注意」。
   演示区与流程用和弦记号课程的共享实现（MT-Chord/shared），步骤之间用“神奇移动”过渡。
   规则见 docs/interactive-theory-lesson-standard.md。 */
(() => {
  'use strict';
  const {COLOR, PAIR} = ChordStage;
  const keyboard = IntervalKeyboard.scene;

  /* ---------- 谱例资料 ---------- */
  const tone = (id, key, slot, extra = {}) => ({id, key, slot, ...extra});
  const below = (id, slot, text, color = '#334155') => ({id, slot, text, color});
  // 音级标注（三行）：第 row 行（从 0 起），行距 13；第一行比单行标注略高，避开谱表下方的音
  const COLOR_KEY = '#64748b';
  const degree = (id, slot, text, row, color = '#334155') => ({id, slot, text: String(text), color, drop: row * 13 - 8});
  const above = (id, slot, text, extra = {}) => ({id, slot, text, anchor: 'middle', font: 'label', size: 16, color: '#4f46e5', ...extra});

  // 两个小节并排：每小节两个二分音符（先后发声），中间与结尾都有小节线；上方标度数 / 性质，下方标音数
  const M1 = [.1, .9], M2 = [1.9, 2.7], BAR = 1.4;
  const MID = [(M1[0] + M1[1]) / 2, (M2[0] + M2[1]) / 2];
  const measures = ([a1, a2], [b1, b2], [name1, name2], [count1, count2]) => ({
    bars: [BAR], barlines: true,
    tones: [tone('a1', a1, M1[0], {duration: 'h'}), tone('a2', a2, M1[1], {duration: 'h'}), tone('b1', b1, M2[0], {duration: 'h'}), tone('b2', b2, M2[1], {duration: 'h'})],
    staffSymbols: [above('name1', MID[0], name1), above('name2', MID[1], name2)],
    staffLabels: [below('count1', MID[0], count1), below('count2', MID[1], count2), below('count', -.9, '音数', '#64748b')]
  });
  // Quiz 谱例：一个小节里先后两个二分音符，不标名称
  const quizStaff = (a, b) => ({tones: [tone('a1', a, PAIR[0], {duration: 'h'}), tone('a2', b, PAIR[1], {duration: 'h'})]});

  // 五种性质的关系图（面板）：state 0 只有「减 · 增」，1 显示纯音程的度数，2 再显示大小音程的度数
  const qualityMap = state => ({panel: {key: 'quality-map', state: String(state), html:
    '<div class="quality-map"><div class="qm-side">减</div><div class="qm-center">' +
    '<div class="qm-pure-wrap"><div class="qm-degree">1 · 4 · 5 · 8</div><div class="qm-line"></div><div class="qm-pure">纯</div></div>' +
    '<div class="qm-mm-wrap"><div class="qm-mm"><span>小</span><span>大</span></div><div class="qm-line"></div><div class="qm-degree">2 · 3 · 6 · 7</div></div>' +
    '</div><div class="qm-side">增</div></div>'}});

  // 自然音：C 大调音阶 C4–C5
  const SCALE = ['C4','D4','E4','F4','G4','A4','B4','C5'], slotOf = i => i * 3 / 7;
  const scale = ({names = false, focus = null} = {}) => ({
    tones: SCALE.map((k, i) => tone('s' + i, k, slotOf(i), focus && !focus.includes(i) ? {color: COLOR.faint} : {})),
    staffLabels: names ? SCALE.map((k, i) => below('nm' + i, slotOf(i), k[0], focus && !focus.includes(i) ? COLOR.faint : '#334155')) : []
  });
  const SCENE = {
    scale: scale(),
    scaleNames: scale({names: true}),
    // 由自然音组成的音程：D–F（小三度）
    naturalPair: {...scale({names: true, focus: [1, 3]}), staffSymbols: [above('nat', (slotOf(1) + slotOf(3)) / 2, 'm3')]},
    // 有变化音的自然音程：D–F♯（大三度）。下方标它们在哪些调里是第几级（调号少的在上）
    alteredPair: {tones: [tone('s1', 'D4', slotOf(1)), tone('s3', 'F#4', slotOf(3))],
      staffSymbols: [above('nat', (slotOf(1) + slotOf(3)) / 2, 'M3 ✓')],
      staffLabels: [['G', 5, 7], ['D', 1, 3], ['A', 4, 6]].flatMap(([key, d, f], row) => [
        degree('k' + key, slotOf(1) - .9, key, row, COLOR_KEY), degree('d' + key, slotOf(1), d, row), degree('f' + key, slotOf(3), f, row)])},
    // 三全音：C–F♯（增四度）与 C–G♭（减五度）
    tritone: {tones: [tone('l1', 'C4', PAIR[0]), tone('u1', 'F#4', PAIR[0]), tone('l2', 'C4', PAIR[1]), tone('u2', 'Gb4', PAIR[1])],
      staffSymbols: [above('t1', PAIR[0], 'A4'), above('t2', PAIR[1], 'd5')],
      staffLabels: [below('n1', PAIR[0], '音数 3'), below('n2', PAIR[1], '音数 3')]},
    // 三全音在调里的位置：C–F♯ 是 G 调的 4、7 级，C–G♭ 是 D♭ 调的 7、4 级。
    // 和声音程，级数上下排列，与音符对应（上方音的级数在上）；调名在两行中间
    tritoneKeys: {tones: [tone('l1', 'C4', PAIR[0]), tone('u1', 'F#4', PAIR[0]), tone('l2', 'C4', PAIR[1]), tone('u2', 'Gb4', PAIR[1])],
      staffSymbols: [above('t1', PAIR[0], 'A4'), above('t2', PAIR[1], 'd5')],
      staffLabels: [['G', 4, 7, 0], ['D♭', 7, 4, 1]].flatMap(([key, low, high, i]) => [
        {...below('k' + i, PAIR[i] - .55, key, COLOR_KEY), drop: 3},
        {...below('hi' + i, PAIR[i], String(high)), drop: -3}, {...below('lo' + i, PAIR[i], String(low)), drop: 10}])}
  };

  // 以 C 为低音的一个八度的自然音程：学员点演示区的按钮，自己选要看、要听的音程（不再自动连播）
  const NATURAL = [['C4','0','P1'], ['Db4','0.5','m2'], ['D4','1','M2'], ['Eb4','1.5','m3'], ['E4','2','M3'], ['F4','2.5','P4'], ['F#4','3','A4'],
    ['Gb4','3','d5'], ['G4','3.5','P5'], ['Ab4','4','m6'], ['A4','4.5','M6'], ['Bb4','5','m7'], ['B4','5.5','M7'], ['C5','6','P8']];
  const naturalControls = NATURAL.map(([, , name]) => ['nat:' + name, name]);
  const natural = name => {
    const [key, count] = NATURAL.find(n => n[2] === name);
    return {tones: [tone('lo', 'C4', PAIR[0]), tone('hi', key, PAIR[1])], offsets: [0, .4], play: true,
      staffSymbols: [above('nm', (PAIR[0] + PAIR[1]) / 2, name)], staffLabels: [below('cnt', (PAIR[0] + PAIR[1]) / 2, `音数 ${count}`)],
      controls: naturalControls, pressed: 'nat:' + name};
  };

  /* ---------- 课程内容 ---------- */
  const {steps, sections, section, group, quiz, accent, p, warn, TF} = ChordLesson.builder();
  const SECOND = [['M', '大（M）'], ['m', '小（m）']];
  const PERFECT = [['P', '纯'], ['A', '增'], ['d', '减']];
  const ALL = [['d', '减'], ['m', '小'], ['P', '纯'], ['M', '大'], ['A', '增']];

  // 一、音程的性质
  section('quality', '一', '音程的性质');
  group('seconds', [
    [p(`为了区分${accent('度数相同')}但${accent('音数不同')}的音程，需要在度数前加上<strong>音程的性质</strong>。`), measures(['C4', 'Db4'], ['C4', 'D4'], ['2nd', '2nd'], ['0.5', '1'])],
    [p(`谱例中 ${accent('M')} 和 ${accent('m')} 表示的就是二度的${accent('“大”')}和${accent('“小”')}两种性质。它们分别来自英文术语 ${accent('M')}ajor 和 ${accent('m')}inor 的首字母，通过大小写来区分大小。`), measures(['C4', 'Db4'], ['C4', 'D4'], ['m2', 'M2'], ['0.5', '1'])],
    [p(`<strong>小二度</strong>（m2）表示相距一个${accent('半音')}的二度，<strong>大二度</strong>（M2）表示相距一个${accent('全音')}的二度。`), measures(['C4', 'Db4'], ['C4', 'D4'], ['m2', 'M2'], ['0.5', '1'])]
  ]);
  quiz('fg', keyboard(['F4', 'G4'], {play: true}), {
    question: 'F 和 G 这个二度的性质是：', options: SECOND, answer: 'M',
    right: '正确。F 和 G 之间隔着黑键 F♯，相距一个全音，是大二度。',
    wrong: '看键盘：F 和 G 之间有没有黑键？相距半音还是全音？'
  });
  quiz('bc', keyboard(['B4', 'C5'], {play: true}), {
    question: 'B 和 C 这个二度的性质是：', options: SECOND, answer: 'm',
    right: '正确。B 和 C 之间没有黑键，相距一个半音，是小二度。',
    wrong: '看键盘：B 和 C 之间有没有黑键？'
  });
  group('thirds', [
    [p(`三度也有${accent('小')}${accent('大')}两个性质。`), measures(['C4', 'Eb4'], ['C4', 'E4'], ['3rd', '3rd'], ['1.5', '2'])],
    [p(`<strong>小三度</strong>（m3）表示音数为 ${accent('1.5')} 的三度，<strong>大三度</strong>（M3）表示音数为 ${accent('2')} 的三度。`), measures(['C4', 'Eb4'], ['C4', 'E4'], ['m3', 'M3'], ['1.5', '2'])]
  ]);
  quiz('df', keyboard(['D4', 'F4'], {play: true}), {
    question: 'D 和 F 这个三度的性质是：', options: SECOND, answer: 'm',
    right: '正确。D–E 全音，E–F 半音，音数 1.5，是小三度。',
    wrong: '在键盘上数一数 D 到 F 的音数：是 1.5 还是 2？'
  });
  quiz('ac', keyboard(['G#4', 'C5'], {play: true}), {
    question: 'A♭ 和 C 这个三度的性质是：', options: SECOND, answer: 'M',
    right: '正确。A♭ 到 C 相隔 4 个半音，音数为 2，是大三度。',
    wrong: '在键盘上数一数 A♭（G♯ 那个黑键）到 C 的音数。'
  });
  group('perfect', [
    [p(`四度和五度${accent('不')}区分大小，它们的基本性质用<strong>纯</strong>来表示。`), measures(['C4', 'F4'], ['C4', 'G4'], ['4th', '5th'], ['2.5', '3.5'])],
    [p(`谱例中的 ${accent('P')} 表示的就是${accent('纯')}这一种音程性质。它来自英文术语 ${accent('P')}erfect 的首字母，一般大写。`), measures(['C4', 'F4'], ['C4', 'G4'], ['P4', 'P5'], ['2.5', '3.5'])],
    [p(`也${accent('不')}是所有的四度和五度性质都是纯。`), measures(['C4', 'F#4'], ['C4', 'Gb4'], ['4th', '5th'], ['3', '3'])],
    [p(`音数为 ${accent('3')} 的四度，性质为<strong>增</strong>。用 ${accent('A')}ugmented 的首字母大写 ${accent('A')} 表示。它比纯四度${accent('宽')}一个半音。`), measures(['C4', 'F#4'], ['C4', 'Gb4'], ['A4', '5th'], ['3', '3'])],
    [p(`音数为 ${accent('3')} 的五度，性质为<strong>减</strong>。用 ${accent('d')}iminished 的首字母小写 ${accent('d')} 表示。它比纯五度${accent('窄')}一个半音。`), measures(['C4', 'F#4'], ['C4', 'Gb4'], ['A4', 'd5'], ['3', '3'])]
  ]);
  quiz('dg', quizStaff('D4', 'G#4'), {
    question: 'D4 和 G♯4，这个四度的性质是：', options: PERFECT, answer: 'A',
    right: '正确。D 到 G♯ 的音数为 3，比纯四度宽一个半音，是增四度。',
    wrong: '纯四度的音数是 2.5。数一数 D 到 G♯ 的音数。'
  });
  quiz('fc', quizStaff('F#4', 'C5'), {
    question: 'F♯4 和 C5，这个五度的性质是：', options: PERFECT, answer: 'd',
    right: '正确。F♯ 到 C 的音数为 3，比纯五度窄一个半音，是减五度。',
    wrong: '纯五度的音数是 3.5。数一数 F♯ 到 C 的音数。'
  });
  group('aug-dim', [
    [p(`增（A），除了表示变宽的纯音程（P），也可以表示变宽的${accent('大')}音程（M）。`), measures(['C4', 'D4'], ['C4', 'D#4'], ['M2', 'A2'], ['1', '1.5'])],
    [p(`减（d），除了表示变窄的纯音程（P），也可以表示变窄的${accent('小')}音程（m）。`), measures(['C4', 'Eb4'], ['C#4', 'Eb4'], ['m3', 'd3'], ['1.5', '1'])],
    [p(`相同度数下，${accent('减音程')}的音数最少，${accent('增音程')}的音数最多。`), measures(['C4', 'Eb4'], ['C#4', 'Eb4'], ['m3', 'd3'], ['1.5', '1'])],
    [p('音程有五种基本性质：大（Major）、小（minor）、增（Augmented）、减（diminished）、纯（Perfect）。'), qualityMap(0)],
    [p(`<strong>纯音程</strong>由于协和度高，专用于${accent('一')}度、${accent('四')}度、${accent('五')}度和${accent('八')}度。`), qualityMap(1)],
    [p(`<strong>大/小音程</strong>：专用于${accent('二')}度、${accent('三')}度、${accent('六')}度和${accent('七')}度。大音程比小音程宽半音。`), qualityMap(2)],
    [p(`助记口诀：${accent('一四五八没大小，二三六七没有纯')}。`), qualityMap(2)],
    [p(`<strong>增/减音程</strong>：理论上，${accent('所有')}度数都可以通过增减音数变成“增/减”的性质。`), qualityMap(2)],
    [warn(`因为纯一度的音数为 0，没有比它更窄的音程，所以减一度是${accent('不')}存在的音程。`), qualityMap(2)]
  ]);
  quiz('unison', qualityMap(2), {
    question: '一度有哪些性质？', options: ALL, answer: ['P', 'A'],
    right: '正确。一度是纯音程，可以变宽成增一度；减一度不存在。',
    wrong: '一度属于哪一类？再想想：一度能变窄吗？'
  });
  quiz('fifth', qualityMap(2), {
    question: '五度有哪些性质？', options: ALL, answer: ['d', 'P', 'A'],
    right: '正确。五度是纯音程，可以变窄成减五度，也可以变宽成增五度。',
    wrong: '五度属于纯音程还是大小音程？它能变宽、变窄吗？'
  });
  quiz('sixth', qualityMap(2), {
    question: '六度有哪些性质？', options: ALL, answer: ['d', 'm', 'M', 'A'],
    right: '正确。六度是大小音程，小六度变窄成减六度，大六度变宽成增六度；六度没有纯。',
    wrong: '「二三六七没有纯」。六度有大小，还能怎样变宽、变窄？'
  });

  // 二、自然音程
  section('natural', '二', '自然音程');
  group('natural', [
    [p('所有的大音程、小音程、纯音程和增四度、减五度，都属于<strong>自然音程</strong>。'), SCENE.scale],
    [p(`自然音程的性质由${accent('自然大调音阶')}中的音组合产生，所以叫自然音程。`), SCENE.scale],
    [p(`不带升降记号的七个基本音级（C、D、E、F、G、A、B）叫<strong>自然音</strong>。`), SCENE.scaleNames],
    [p(`这些音刚好是 C 自然大调音阶的组成音，所以由自然音组成的音程，${accent('一定')}属于自然音程。`), SCENE.naturalPair],
    [warn(`C 以外的自然大调音阶都会出现变化音，所以不能说自然音程只能由自然音构成，也不能说有变化音的音程就${accent('一定不是')}自然音程。`), SCENE.alteredPair],
    [p(`自然音程的具体性质可以通过${accent('音数')}来决定。`), natural('P1'), {hint: '点击演示区的按钮，看一看、听一听每个音程。'}],
    [p('增四度和减五度的音数都是 3，所以又叫<strong>三全音</strong>（Tritone）。'), SCENE.tritone],
    [p(`它们是自然音程中${accent('唯一')}的一对增减音程。`), SCENE.tritoneKeys],
    [warn(`虽然它们音数相同，但度数不同，性质仍然不同；「三全音」这个名称只能用于${accent('不需要明确度数')}的场合。`), SCENE.tritoneKeys]
  ]);
  quiz('altered', {...SCENE.alteredPair, staffLabels: []}, {
    question: '有变化音的音程，一定不是自然音程。', options: TF, answer: 'false',
    right: '正确，这句话是错的。比如 D–F♯ 是大三度，属于自然音程（D 大调中的音）。',
    wrong: '回想上一页的谱例：D–F♯ 有升号，它的性质是什么？'
  });
  quiz('tritone-fourth', {...SCENE.tritone, staffSymbols: [], staffLabels: []}, {
    question: '音数为 3 的四度是：', options: [['P4', '纯四度（P4）'], ['A4', '增四度（A4）'], ['d5', '减五度（d5）']], answer: 'A4',
    right: '正确。纯四度的音数是 2.5，音数为 3 的四度比它宽一个半音，是增四度。',
    wrong: '题目说的是「四度」。纯四度的音数是多少？'
  });
  quiz('tritone-name', SCENE.tritone, {
    question: '「三全音」这个名称能明确说明音程的度数。', options: TF, answer: 'false',
    right: '正确，这句话是错的。三全音可以是增四度，也可以是减五度，只说明音数为 3。',
    wrong: '三全音包括哪两个音程？它们的度数一样吗？'
  });

  // 只看琴键（课后辅助练习的方法）：没有度数信息时，一般按自然音程称呼；增四度 / 减五度统称三全音（TT）
  const KEYS = ['C4','C#4','D4','D#4','E4','F4','F#4','G4','G#4','A4','A#4','B4','C5','C#5','D5'];
  const NAMES = ['P1','m2','M2','m3','M3','P4','TT','P5','m6','M6','m7','M7','P8'];
  // 从 root 开始的一个八度，名称全部显示；学员点琴键，听这个键和 root 组成的音程
  const tapKeys = (root, marks = []) => {
    const start = KEYS.indexOf(root), names = Object.fromEntries(NAMES.map((name, i) => [KEYS[start + i], name]));
    return keyboard(marks, {from: root, names, shown: Object.keys(names), tap: true, offsets: [0, .4], play: marks.length > 0});
  };
  const tritoneKeyboard = extra => keyboard(['C4', 'F#4'], {names: {'F#4': 'Tritone'}, shown: ['F#4'], ...extra});
  group('keys', [
    [p(`只看琴键或只听音高时，${accent('无法确定')}两个音之间的度数。这时大多数人会优先按<strong>自然音程</strong>来称呼，不去考虑复杂的增减关系。`), tritoneKeyboard()],
    [p('八度以内的音程，一般按这个顺序称呼：纯一、小二、大二、小三、大三、纯四、三全音、纯五、小六、大六、小七、大七、纯八。'), tapKeys('C4'), {hint: '点击琴键，听一听每个音程。'}],
    [warn(`没有明确度数时，也${accent('无法区分')}增四度和减五度，所以统一称为<strong>三全音</strong>（Tritone，TT）。`), tritoneKeyboard({offsets: [0, .4], play: true})],
    [p(`课后的辅助练习里，以${accent('第一个音')}为起点，按上面的顺序数琴键的距离，就能说出音程名称。`), tapKeys('D4'), {hint: '从 D 开始逐个点击琴键，数一数距离、听一听每个音程。'}]
  ]);
  quiz('keys-m6', keyboard(['E4', 'C5'], {offsets: [0, .4], play: true}), {
    question: '只看琴键，这个音程一般称为：', options: [['A5', '增五度'], ['m6', '小六度']], answer: 'm6',
    right: '正确。没有度数信息时，按自然音程称呼：E 到 C 相距 8 个半音（音数 4），是小六度。',
    wrong: '只看琴键时，优先按自然音程称呼，不考虑增减关系。'
  });

  ChordLesson.run({
    steps, sections, countBy: 'lesson', noteLength: 1,
    // 进度用固定名字保存；旧网址的进度第一次打开时搬过来
    storageId: 'interval-02', formerPaths: ['/MT-Intervals/lesson02/', '/MT-Intervals/lesson02/index.html'],
    // 演示区的按钮与琴键：nat:音程名 = 自然音程谱例；key:起点:琴键 = 键盘上起点到这个键
    onControl: id => {
      if (id.startsWith('nat:')) return natural(id.slice(4));
      const [, root, key] = id.split(':');
      return tapKeys(root, [root, key]);
    },
    preload: ['C4','C#4','Db4','D4','D#4','Eb4','E4','F4','F#4','Gb4','G4','G#4','Ab4','A4','A#4','Bb4','B4','C5','C#5','D5']
  });
})();
