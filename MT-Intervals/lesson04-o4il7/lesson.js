/* 音程 · 第四课：单音程与复音程 / 复音程的性质 / 命名与换算
   文字依据 assets/lesson-04.pdf，并补入「增八度与小九度是等音程」「减 14 化成单音程」「构建复音程」，按「一步一句」。步数整课连续计算。
   讲解区：<strong> = 音乐术语；accent() = 重点词；warn() = 「注意」。
   演示区与流程用和弦记号课程的共享实现（MT-Chord/shared），步骤之间用“神奇移动”过渡。
   规则见 docs/interactive-theory-lesson-standard.md。 */
(() => {
  'use strict';
  const {COLOR, PAIR} = ChordStage;

  /* ---------- 谱例资料 ---------- */
  const tone = (id, key, slot, extra = {}) => ({id, key, slot, ...extra});
  const below = (id, slot, text, color = '#334155', drop = 0) => ({id, slot, text, color, drop});
  const above = (id, slot, text, extra = {}) => ({id, slot, text, anchor: 'middle', font: 'label', size: 16, color: '#4f46e5', ...extra});
  const CENTER = (PAIR[0] + PAIR[1]) / 2;

  // 旋律音程：两个全音符先后发声，上方标名称；under 为下方的说明文字
  const melodic = (a, b, name, under = null) => ({
    tones: [tone('lo', a, PAIR[0]), tone('hi', b, PAIR[1])],
    staffSymbols: name ? [above('name', CENTER, name)] : [],
    staffLabels: under ? [below('under', CENTER, under)] : [], play: true
  });

  // 两个小节并排：每小节两个二分音符（先后发声）；上方标名称，下方标音数，中间可标「等音程」
  const M1 = [.1, .9], M2 = [1.9, 2.7], BAR = 1.4;
  const MID = [(M1[0] + M1[1]) / 2, (M2[0] + M2[1]) / 2];
  const measures = ([a1, a2], [b1, b2], names, counts, middle = null) => ({
    bars: [BAR], barlines: true,
    tones: [tone('a1', a1, M1[0], {duration: 'h'}), tone('a2', a2, M1[1], {duration: 'h'}), tone('b1', b1, M2[0], {duration: 'h'}), tone('b2', b2, M2[1], {duration: 'h'})],
    staffSymbols: [above('name1', MID[0], names[0]), above('name2', MID[1], names[1])],
    staffLabels: [below('count1', MID[0], counts[0]), below('count2', MID[1], counts[1]), below('count', -.9, '音数', '#64748b'),
      ...(middle ? [below('middle', BAR, middle, '#4f46e5')] : [])]
  });

  // C4 到 E5 的十个音：先从 C4 数到 C5（1–8），再从 C5 数到 E5（1–3）；连接处的 C5 标红
  const RUN = ['C4','D4','E4','F4','G4','A4','B4','C5','D5','E5'];
  const runSlot = i => -.1 + i * .37;
  const counting = second => ({
    tones: RUN.map((k, i) => tone('r' + i, k, runSlot(i),
      i === 7 && second ? {color: COLOR.bass} : i > 7 && !second ? {color: COLOR.faint} : {})),
    staffLabels: [
      ...RUN.slice(0, 8).map((k, i) => below('a' + i, runSlot(i), String(i + 1), '#334155', 4)),
      ...(second ? RUN.slice(7).map((k, i) => below('b' + i, runSlot(i + 7), String(i + 1), COLOR.bass, 18)) : [])]
  });

  // 度数线（面板）：1–15，八度与九度之间有分界线；marks 'single' / 'compound' 高亮一侧
  const cells = (from, to) => Array.from({length: to - from + 1}, (_, i) => `<span>${from + i}</span>`).join('');
  const degreeLine = marks => ({panel: {key: 'degree-line', marks, html:
    '<div class="degree-line">' +
    `<div class="dl-side" data-mark="single"><div class="dl-cells">${cells(1, 8)}</div><div class="dl-name">单音程</div></div>` +
    '<div class="dl-divider"></div>' +
    `<div class="dl-side" data-mark="compound"><div class="dl-cells">${cells(9, 15)}</div><div class="dl-name">复音程</div></div>` +
    '</div>'}});

  // 单复对照（面板）：上行二到八度，下行九到十五度，上下对齐；marks 'mm' / 'p' 高亮对应的列与性质
  const MM = [2, 3, 6, 7];
  const pairing = marks => ({panel: {key: 'pairing', marks, html:
    '<div class="pairing"><span class="pr-tag">单音程</span><span class="pr-tag">复音程</span><span class="pr-tag">性质</span>' +
    [2, 3, 4, 5, 6, 7, 8].map((n, i) => {
      const group = MM.includes(n) ? 'mm' : 'p', col = `grid-column:${i + 2}`;
      return `<span class="pr-cell" data-mark="${group}" style="${col};grid-row:1">${n}</span>` +
        `<span class="pr-cell" data-mark="${group}" style="${col};grid-row:2">${n + 7}</span>` +
        `<span class="pr-quality" data-mark="${group}" style="${col};grid-row:3">${group === 'mm' ? '大小' : '纯'}</span>`;
    }).join('') + '</div>'}});

  // 化简（面板）：十八度 → 十一度 → 四度，每步减 7；mark 'direct' 显示一次减 14
  const simplify = marks => ({panel: {key: 'simplify', marks, html:
    '<div class="simplify"><div class="sp-row">' +
    '<span class="sp-num">十八度</span><span class="sp-step">− 7 →</span><span class="sp-num">十一度</span><span class="sp-step">− 7 →</span><span class="sp-num sp-end">四度</span>' +
    '</div><div class="sp-direct" data-mark="direct">十八度 − 14 = 四度</div><div class="sp-note">隔两个八度的四度</div></div>'}});

  const SCENE = {
    p8: melodic('C4', 'C5', 'P8'),
    m3: melodic('C4', 'E4', 'M3'),
    m10: melodic('C4', 'E5', 'M10'),
    m10names: {...melodic('C4', 'E5', 'M10', '大十度 · 复大三度'), play: false},
    perfectAug: measures(['C4', 'C5'], ['C4', 'C#5'], ['P8', 'A8'], ['6', '6.5']),
    augMinor: measures(['C4', 'C#5'], ['C4', 'Db5'], ['A8', 'm9'], ['6.5', '6.5'], '← 等音程 →')
  };

  /* ---------- 课程内容 ---------- */
  const {steps, sections, section, group, quiz, accent, p, warn, TF} = ChordLesson.builder();
  const ALL = [['d', '减'], ['m', '小'], ['P', '纯'], ['M', '大'], ['A', '增']];

  // 一、单音程与复音程
  section('single', '一', '单音程与复音程');
  group('single', [
    [p(`音程的度数以${accent('八度')}为界，分为<strong>单音程</strong>和<strong>复音程</strong>。`), degreeLine([])],
    [p(`八度和八度${accent('以内')}的音程，叫<strong>单音程</strong>。`), degreeLine(['single'])],
    [p(`${accent('超过')}八度的音程，叫<strong>复音程</strong>。`), degreeLine(['compound'])],
    [p('例如 C4–C5 是纯八度，属于单音程。'), SCENE.p8],
    [p('把 C5 换成 D5，就超过了八度，C4–D5 是大九度，属于复音程。'), melodic('C4', 'D5', 'M9')],
    [warn(`「单 / 复」只看${accent('度数')}，不看性质。增八度的音数超过了 6，仍然是单音程。`), SCENE.perfectAug],
    [p(`反过来，小九度的音数也是 6.5，却是复音程。它和增八度是<strong>等音程</strong>。`), SCENE.augMinor]
  ]);
  quiz('a8', SCENE.perfectAug, {
    question: '增八度的音数超过 6，所以是复音程。', options: TF, answer: 'false',
    right: '正确，这句话是错的。单 / 复只看度数：增八度仍然是八度，属于单音程。',
    wrong: '单 / 复看的是度数还是音数？增八度是几度？'
  });
  quiz('which-compound', SCENE.augMinor, {
    question: '下面哪些是复音程：', options: [['P8', '纯八度'], ['A8', '增八度'], ['m9', '小九度'], ['M9', '大九度']], answer: ['m9', 'M9'],
    right: '正确。九度超过了八度，是复音程；纯八度、增八度都是八度，属于单音程。',
    wrong: '只看度数：哪些超过了八度？'
  });

  // 二、复音程的性质
  section('quality', '二', '复音程的性质');
  group('quality', [
    [p(`复音程是单音程${accent('延伸一个八度')}得到的。例如大三度的高音移高一个八度，就是大十度。`), [SCENE.m3, SCENE.m10], {sequence: 1400}],
    [p(`所以九度到十五度，和二度到八度${accent('共用同一套')}性质。`), pairing([])],
    [p(`九、十、十三、十四度对应二、三、六、七度，属于${accent('大小')}音程，没有纯。`), pairing(['mm'])],
    [p(`十一、十二、十五度对应四、五、八度，属于${accent('纯')}音程，没有大小。`), pairing(['p'])],
    [p(`增、减也一样：复音程的性质和它对应的单音程${accent('完全相同')}。例如增二度延伸一个八度，就是增九度。`), [melodic('C4', 'D#4', 'A2'), melodic('C4', 'D#5', 'A9')], {sequence: 1400}]
  ]);
  quiz('twelfth', pairing([]), {
    question: '十二度有哪些性质？', options: ALL, answer: ['d', 'P', 'A'],
    right: '正确。十二度对应五度，是纯音程，可以变窄成减十二度，也可以变宽成增十二度。',
    wrong: '十二度对应几度？那个度数属于纯音程还是大小音程？'
  });
  quiz('tenth', pairing([]), {
    question: '十度有哪些性质？', options: ALL, answer: ['d', 'm', 'M', 'A'],
    right: '正确。十度对应三度，是大小音程，还可以变成减十度和增十度；十度没有纯。',
    wrong: '十度对应几度？那个度数有哪些性质？'
  });

  // 三、命名与换算
  section('naming', '三', '命名与换算');
  group('naming', [
    [p(`复音程有两种叫法。第一种：在${accent('实际度数')}前加性质，例如<strong>大十度</strong>、<strong>纯十一度</strong>。`), SCENE.m10],
    [p(`第二种：在对应的${accent('单音程')}名称前加「复」字，例如<strong>复大三度</strong>、<strong>复纯四度</strong>。`), SCENE.m10names],
    [warn(`「复」字后面接的是${accent('单音程')}的名称，所以可以说复大三度，${accent('不能')}说「复大十度」。`), SCENE.m10names]
  ]);
  group('plus-seven', [
    [p(`<strong>单音程度数 + 7 = 复音程度数</strong>。例如三度 + 7 = 十度。`), [melodic('C4', 'E4', '3rd'), melodic('C4', 'E5', '10th')], {sequence: 1400}],
    [p(`为什么是加 7，不是加 8？C4 到 C5 是八度，C5 到 E5 是三度，连接处的 C5 被${accent('算了两次')}：8 + 3 − 1 = 10。`), [counting(false), counting(true)], {sequence: 1600}],
    [p(`反过来，<strong>复音程度数 − 7 = 单音程度数</strong>。例如十一度 − 7 = 四度。`), [melodic('C4', 'F5', '11th'), melodic('C4', 'F4', '4th')], {sequence: 1400}],
    [p(`十六度以上的音程，实际音乐中一般${accent('不')}按实际度数命名，而是简化成九到十五度，或者化成单音程，前面加上「隔两个八度的」。`), simplify([])],
    [p(`化成单音程时，也可以直接${accent('减 14')}。`), simplify(['direct'])],
    [p(`<strong>构建复音程</strong>：先找到对应单音程的那个音，再把它移高（或移低）一个八度。例如比 C 高大九度：先找大二度 D，再移高一个八度。`), [melodic('C4', 'D4', 'M2'), melodic('C4', 'D5', 'M9')], {sequence: 1400}]
  ]);
  quiz('twelfth-name', {...melodic('C4', 'G5', '12th'), play: false}, {
    question: '十二度也可以叫复几度？', options: [['4', '复四度'], ['5', '复五度'], ['6', '复六度']], answer: '5',
    right: '正确。12 − 7 = 5，十二度对应五度，所以叫复五度。',
    wrong: '复音程度数减几，就是对应的单音程度数？'
  });
  quiz('m10', {tones: [tone('lo', 'D4', PAIR[0])], staffSymbols: [above('q', PAIR[1], '?')]}, {
    question: '比 D4 高小十度的音是：', options: [['F5', 'F5'], ['F#5', 'F♯5'], ['E5', 'E5']], answer: 'F5',
    right: '正确。十度对应三度：D–F 是小三度，再把 F 移高一个八度，就是 F5。',
    wrong: '十度对应几度？先找 D 往上的小三度。'
  });
  quiz('seventeenth', simplify([]), {
    question: '十七度化成单音程是几度？', options: [['2', '二度'], ['3', '三度'], ['10', '十度']], answer: '3',
    right: '正确。17 − 14 = 3，是隔两个八度的三度。',
    wrong: '十度还不是单音程。化成单音程，要减几？'
  });

  ChordLesson.run({
    steps, sections, countBy: 'lesson', noteLength: 1,
    // 进度用固定名字保存；旧网址的进度第一次打开时搬过来
    storageId: 'interval-04', formerPaths: ['/MT-Intervals/lesson04/', '/MT-Intervals/lesson04/index.html'],
    preload: ['C4','C#4','D4','D#4','E4','F4','G4','C5','C#5','Db5','D5','D#5','E5','F5','G5']
  });
})();
