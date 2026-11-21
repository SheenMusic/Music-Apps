/* 音程 · 第一课：度数、旋律 / 和声音程、音数
   文字依据原课件与 assets/lesson-01.pdf，按「一步一句」。四个小节只在页眉目录中标出起点，步数整课连续计算。
   讲解区：<strong> = 音乐术语；accent() = 重点词；warn() = 「注意」。
   演示区与流程用和弦记号课程的共享实现（MT-Chord/shared），步骤之间用“神奇移动”过渡。
   规则见 docs/interactive-theory-lesson-standard.md。 */
(() => {
  'use strict';
  const {COLOR, CENTER, PAIR} = ChordStage;

  /* ---------- 谱例资料 ---------- */
  // id 固定，场景切换时据此追踪同一个音（或标签）。
  const tone = (id, key, slot, extra = {}) => ({id, key, slot, ...extra});
  const faint = {color: COLOR.faint};
  const below = (id, slot, text, color) => ({id, slot, text, color});
  const above = (id, slot, text, extra = {}) => ({id, slot, text, anchor: 'middle', font: 'label', size: 13, color: '#4f46e5', ...extra});
  const DEG = [0, .75, 1.5, 2.25, 3];   // 五个音 C D E F G 的位置
  // 旋律 / 和声音程：原课件的 4/4 二声部谱例。位置按拍子排开；声音按四分音符 = 0.5 秒
  const BEAT = .5;
  const HALVES = [.6, 2.1];             // 两个二分音符：C5 D5
  const RHYTHM = [.5, 1.3, 2.2];        // 四分 · 四分 · 二分：C5 D5 G4
  const BAR = [RHYTHM[0], RHYTHM[2]];   // 第一拍、第三拍
  const voice = (id, key, slot, duration, stem) => tone(id, key, slot, {duration, stem});
  const TICK = {font: 'label', size: 16, color: '#047857'};
  const LETTERS = ['C', 'D', 'E', 'F', 'G'];

  const keyboard = IntervalKeyboard.scene;

  const SCENE = {
    pair: {tones: [tone('lo', 'C4', PAIR[0]), tone('hi', 'G4', PAIR[1])]},
    roles: {tones: [tone('lo', 'C4', PAIR[0]), tone('hi', 'G4', PAIR[1])],
      staffLabels: [below('role-lo', PAIR[0], '根音（低音）'), below('role-hi', PAIR[1], '冠音（高音）')]},
    // 谱表位置：C 与 G 滑开，中间的 D E F 渐入，下方标出 1–5
    degreeStaff: {tones: LETTERS.map((l, i) => tone(i === 0 ? 'lo' : i === 4 ? 'hi' : 'mid' + i, l + '4', DEG[i], i % 4 ? faint : {})),
      staffLabels: LETTERS.map((l, i) => below('n' + i, DEG[i], String(i + 1), i % 4 ? COLOR.faint : '#334155'))},
    // 音名：数字移到谱表上方，音名出现在各自的符头下方
    degreeNames: {tones: LETTERS.map((l, i) => tone(i === 0 ? 'lo' : i === 4 ? 'hi' : 'mid' + i, l + '4', DEG[i], i % 4 ? faint : {})),
      staffSymbols: LETTERS.map((l, i) => above('n' + i, DEG[i], String(i + 1), {color: '#94a3b8', size: 12})),
      staffLabels: LETTERS.map((l, i) => below('name' + i, DEG[i], l, i % 4 ? COLOR.faint : '#334155'))},
    unison: {tones: [tone('lo', 'F4', PAIR[0]), tone('hi', 'F4', PAIR[1])], caption: 'F–F　一度'},
    unisonSharp: {tones: [tone('lo', 'F4', PAIR[0]), tone('hi', 'F#4', PAIR[1])], caption: 'F–F♯　仍是一度'},
    second: {tones: [tone('lo', 'F4', PAIR[0]), tone('hi', 'G4', PAIR[1])], caption: 'F–G　二度'},
    // 一度到八度：上方的音一级一级往上走（依次播放）
    overview: [['A4','三度','3rd'], ['B4','四度','4th'], ['C5','五度','5th'], ['D5','六度','6th'], ['E5','七度','7th'], ['F5','八度','octave']]
      .map(([key, cn, en]) => ({tones: [tone('lo', 'F4', PAIR[0]), tone('hi', key, PAIR[1])], caption: `F–${key[0]}　${cn}（${en}）`, offsets: [0, .45], play: true})),
    melodic: {time: '4/4', tones: [voice('a', 'C5', HALVES[0], 'h', 'down'), voice('b', 'D5', HALVES[1], 'h', 'down')],
      offsets: [0, 2 * BEAT], durations: [2 * BEAT, 2 * BEAT]},
    ascending: {time: '4/4', tones: [voice('a', 'C5', HALVES[0], 'h', 'down'), voice('b', 'D5', HALVES[1], 'h', 'down')],
      staffSymbols: [above('up', (HALVES[0] + HALVES[1]) / 2, '上行')], offsets: [0, 2 * BEAT], durations: [2 * BEAT, 2 * BEAT]},
    directions: {time: '4/4', tones: [voice('a', 'C5', RHYTHM[0], 'q', 'down'), voice('b', 'D5', RHYTHM[1], 'q', 'down'), voice('c', 'G4', RHYTHM[2], 'h', 'up')],
      staffSymbols: [above('up', (RHYTHM[0] + RHYTHM[1]) / 2, '上行'), above('down', (RHYTHM[1] + RHYTHM[2]) / 2, '下行')],
      offsets: [0, BEAT, 2 * BEAT], durations: [BEAT, BEAT, 2 * BEAT]},
    // 和声音程：上声部 C5 D5 G4 原地不动、符干朝上；下声部 E4 F4（符干朝下）渐入。
    // 「上行」「下行」保留，随符干翻转略微上移，避开朝上的符干。第三拍的二度：G4 在左、F4 在右。
    harmonic: {time: '4/4', tones: [voice('a', 'C5', RHYTHM[0], 'q', 'up'), voice('b', 'D5', RHYTHM[1], 'q', 'up'), {...voice('c', 'G4', RHYTHM[2], 'h', 'up'), shift: false},
      voice('e', 'E4', RHYTHM[0], 'h', 'down'), {...voice('f', 'F4', RHYTHM[2], 'h', 'down'), shift: true}],
      staffSymbols: [above('up', (RHYTHM[0] + RHYTHM[1]) / 2, '上行', {lift: 30}), above('down', (RHYTHM[1] + RHYTHM[2]) / 2, '下行', {lift: 30})],
      offsets: [0, BEAT, 2 * BEAT, 0, 2 * BEAT], durations: [BEAT, BEAT, 2 * BEAT, 2 * BEAT, 2 * BEAT]},
    // 二度和声音程的两种写法（都打勾）：第一拍 G4 在左、F4 在右（由第三拍滑过来）；第三拍 F4 在左、G4 在右
    seconds: {time: '4/4', tones: [
      {...voice('c', 'G4', BAR[0], 'h', 'up'), shift: false}, {...voice('f', 'F4', BAR[0], 'h', 'down'), shift: true},
      voice('f2', 'F4', BAR[1], 'h', 'down'), voice('c2', 'G4', BAR[1], 'h', 'up')],
      staffSymbols: [above('ok1', BAR[0] + .13, '✓', TICK), above('ok2', BAR[1] + .13, '✓', TICK)],
      offsets: [0, 0, 2 * BEAT, 2 * BEAT], durations: [2 * BEAT, 2 * BEAT, 2 * BEAT, 2 * BEAT]},
    secondStack: {tones: [tone('a', 'C5', CENTER), tone('b', 'D5', CENTER)]},
    // 音数相同、度数不同：C–F♯（四度）与 C–G♭（五度）
    enharmonic: {tones: [tone('l1', 'C4', PAIR[0]), tone('u1', 'F#4', PAIR[0]), tone('l2', 'C4', PAIR[1]), tone('u2', 'Gb4', PAIR[1])],
      staffSymbols: [above('d1', PAIR[0], '4th', {size: 16}), above('d2', PAIR[1], '5th', {size: 16})],
      staffLabels: [below('t1', PAIR[0], '音数 3', '#334155'), below('t2', PAIR[1], '音数 3', '#334155')]}
  };

  // 共用符干：第一拍不变；第三拍符头不动，两个独立的符干换成中间一根共用的符干（朝上）
  SCENE.shared = {...SCENE.seconds,
    tones: SCENE.seconds.tones.map(t => ['f2', 'c2'].includes(t.id) ? {...t, stem: 'none'} : t),
    stems: [{id: 'shared-stem', tones: ['f2', 'c2'], dir: 'up'}]};

  /* ---------- 课程内容 ---------- */
  const {steps, sections, section, group, quiz, accent, p, warn, TF} = ChordLesson.builder();

  // 一、音程
  section('interval', '一', '音程');
  group('interval', [
    [p(`<strong>音程</strong>是${accent('两')}个音高之间的距离关系，用来描述它们在音高上的${accent('相对')}位置。`), SCENE.pair],
    [p('音程中相对高的音叫<strong>冠音（或高音）</strong>，<br>相对低的音叫<strong>根音（或低音）</strong>。'), SCENE.roles]
  ]);

  // 二、度
  section('degree', '二', '度');
  group('degree', [
    [p(`表示音程距离的${accent('单位')}叫<strong>度</strong>。`), SCENE.pair],
    [p(`度数可以通过音符在${accent('谱表上的位置')}来确定。<br>谱例中的两个音符分别位于${accent('下加一线')}和${accent('第二线')}，它们之间相距 5 个音符的位置，度数为<strong>五度</strong>。`), SCENE.degreeStaff],
    [p(`音程的度数也可以通过${accent('音名')}来确定。<br>从 C4 到 G4，一共有 C、D、E、F、G 五个音，所以度数是<strong>五度</strong>。`), SCENE.degreeNames]
  ]);
  group('sequence', [
    [p(`两个处于谱表中${accent('相同位置')}的音，音名相同，叫做<strong>一度（unison）</strong>。`), SCENE.unison],
    [warn(`变音记号${accent('不')}影响音程的度数。即使其中一个音发生变化，一度仍然是一度。`), SCENE.unisonSharp],
    [p(`两个处于谱表中${accent('相邻位置')}的音，叫做<strong>二度</strong>（2nd）。`), SCENE.second],
    [p('两个音的相对位置进一步扩大，就会得到<strong>三度</strong>（3rd）、<strong>四度</strong>（4th）、<strong>五度</strong>（5th）、<strong>六度</strong>（6th）、<strong>七度</strong>（7th）、<strong>八度</strong>（octave）。'), SCENE.overview, {sequence: 1100}]
  ]);
  quiz('accidental', {...SCENE.unisonSharp, caption: ''}, {
    question: '度数和音符的变音记号无关。',
    options: TF, answer: 'true',
    right: '正确。F 和 F♯ 在谱表上的位置相同，所以仍然是一度。',
    wrong: '再看演示区：F 和 F♯ 在谱表上是不是同一个位置？'
  });

  // 三、旋律音程与和声音程
  section('mode', '三', '旋律音程与和声音程');
  group('mode', [
    [p(`两个${accent('先后出现')}的音，叫做<strong>旋律音程</strong>（melodic interval）。`), SCENE.melodic],
    [p(`第二个音比第一个音${accent('高')}的旋律音程，叫${accent('上行旋律音程')}。`), SCENE.ascending],
    [p(`第二个音比第一个音${accent('低')}的旋律音程，叫${accent('下行旋律音程')}。`), SCENE.directions],
    [p(`下行音程从上方的音${accent('往下数')}度数，例如 C 下行到 F 是五度。`), SCENE.directions],
    [p(`两个${accent('同时出现')}的音，叫做<strong>和声音程</strong>（harmonic interval）。`), SCENE.harmonic]
  ]);
  group('notation', [
    [warn(`同一谱表上的二度和声音程，两个符头需要${accent('左右错开')}记写，以免重叠；但没有「左高右低」或「左低右高」这样的统一规定。`), SCENE.seconds],
    [p(`另外，多声部记谱时，两个音可以有${accent('各自独立')}的符干，不一定要共用。`), SCENE.shared],
    [p(`和声音程可以由${accent('一件乐器')}（比如钢琴）弹出，也可以由${accent('两件乐器')}或两个人同时演奏。人声通常一次只唱出一个音，但呼麦等特殊唱法可以同时唱出两个或多个音高。`), SCENE.shared]
  ]);
  quiz('second', SCENE.secondStack, {
    question: '同一谱表上的二度和声音程，两个符头需要左右错开记写。',
    options: TF, answer: 'true',
    right: '正确。二度的两个音在谱表上紧挨着，符头左右错开才不会重叠。',
    wrong: '再看演示区：C5 和 D5 的符头是怎样排列的？'
  });
  quiz('instrument', SCENE.harmonic, {
    question: '和声音程必须由同一件乐器发出。',
    options: TF, answer: 'false',
    right: '正确，这句话是错的。和声音程只要求两个音同时出现，可以由一件乐器，也可以由两件乐器或两个人演奏。',
    wrong: '回想上一步：和声音程可以由哪些方式演奏出来？'
  });

  // 四、音数
  section('tone', '四', '音数');
  group('tone', [
    [p('音程中所包含的<strong>全音</strong>和<strong>半音</strong>的数量叫<strong>音数</strong>。'), keyboard()],
    [p('一个全音的音数为 1，比如 C–D。'), keyboard(['C4', 'D4'], {play: true})],
    [p('一个半音的音数为 0.5，比如 E–F。'), keyboard(['E4', 'F4'], {play: true})],
    [p('C 到 F 的音数就是 2.5（C–D 第一个全音，D–E 第二个全音，E–F 半音）。'), keyboard(['C4', 'F4'], {play: true})],
    [p('C 到 F♯ 的音数就是 3。'), keyboard(['C4', 'F#4'], {play: true})],
    [p(`音数反映的是两个音之间实际相隔多少个半音，而${accent('不是')}音程的度数。`), keyboard(['C4', 'F#4'])],
    [p('所以音数相同的音程，度数不一定相同。'), SCENE.enharmonic]
  ]);
  const NUMBERS = ['4', '4.5', '5', '5.5', '6'].map(n => [n, n]);
  quiz('tone-count', keyboard(['E4', 'C5'], {play: true}), {
    question: 'E4 到 C5 的音数为：',
    options: NUMBERS, answer: '4',
    right: '正确。E–F 半音，F–G、G–A、A–B 全音，B–C 半音：0.5 + 1 + 1 + 1 + 0.5 = 4。',
    wrong: '在键盘上数一数：相邻两个琴键（包括黑键）之间是半音，两个半音是一个全音。'
  });
  quiz('tone-degree', keyboard(['E4', 'C5']), {
    question: 'E4 到 C5 的度数为：',
    options: NUMBERS, answer: '6',
    right: '正确。从 E 到 C 一共有 E、F、G、A、B、C 六个音名，所以是六度。',
    wrong: '度数看音名，不看半音：从 E 数到 C，一共有几个音名？'
  });

  ChordLesson.run({
    steps, sections, countBy: 'lesson', noteLength: 1,
    // 进度用固定名字保存；旧网址的进度第一次打开时搬过来
    storageId: 'interval-01', formerPaths: ['/MT-Intervals/lesson01/', '/MT-Intervals/lesson01/index.html'],
    preload: ['C4','D4','E4','F4','F#4','G4','Gb4','A4','B4','C5','D5','E5','F5']
  });
})();
