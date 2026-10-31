/* 音程 · 第五课：原位音程与转位音程 / 单音程的转位 / 复音程的转位
   文字依据 assets/lesson-05.pdf，并补入「为什么和为 9」「自然 / 变化音程转位后不变」「单音程也可以转位成复音程」，按「一步一句」。步数整课连续计算。
   第四节「转位的应用」是 PDF 之外的内容：用单音程的转位，把六度、七度当成三度、二度来认。
   讲解区：<strong> = 音乐术语；accent() = 重点词；warn() = 「注意」。
   演示区与流程用和弦记号课程的共享实现（MT-Chord/shared），步骤之间用“神奇移动”过渡：移动的那个音保持同一个 id，并标成红色。
   规则见 docs/interactive-theory-lesson-standard.md。 */
(() => {
  'use strict';
  const {COLOR, CENTER, PAIR} = ChordStage;

  /* ---------- 谱例资料 ---------- */
  const tone = (id, key, slot, extra = {}) => ({id, key, slot, ...extra});
  const below = (id, slot, text, color = '#334155', drop = 0) => ({id, slot, text, color, drop});
  const above = (id, slot, text, extra = {}) => ({id, slot, text, anchor: 'middle', font: 'label', size: 16, color: '#4f46e5', ...extra});
  const moved = {color: COLOR.bass};

  // 和声音程（上下叠放）：notes 从低到高 [id, 音, extra]；上方标名称，下方可加说明。先低后高依次发声
  const stack = (notes, name, under = null) => ({
    tones: notes.map(([id, key, extra = {}]) => tone(id, key, CENTER, extra)),
    staffSymbols: name ? [above('name', CENTER, name)] : [],
    staffLabels: under ? [below('under', CENTER, under)] : [],
    offsets: [0, .5], play: true
  });
  // 两个音左右排开（先后发声），下方各标一个字，如「根音」「冠音」或「低」「高」
  const pair = ([a, ka, ea = {}], [b, kb, eb = {}], [la, lb], name = null) => ({
    tones: [tone(a, ka, PAIR[0], ea), tone(b, kb, PAIR[1], eb)],
    staffSymbols: name ? [above('name', CENTER, name)] : [],
    staffLabels: [below('label-' + a, PAIR[0], la), below('label-' + b, PAIR[1], lb)], play: true
  });

  // 用转位认六度、七度：先标「?」；再在上方加一个浅红色的参考音（根音高八度），下方标出转位后的二度或三度；最后标出答案
  const reference = {color: '#f87171'};
  // 名称统一抬高，避开 F5 等高音
  const lifted = (scene, name) => ({...scene, staffSymbols: [above('name', CENTER, name, {lift: 30})]});
  const guess = (lo, hi) => lifted(stack([['lo', lo], ['hi', hi]]), '?');
  const lookUp = (lo, hi, ref, under) => ({...lifted(stack([['lo', lo], ['hi', hi], ['ref', ref, reference]], null, under), '?'), offsets: [0, .5, 1]});
  const answer = (lo, hi, ref, name, under) => ({...lifted(stack([['lo', lo], ['hi', hi], ['ref', ref, reference]], null, under), name), play: false});

  // C4 到 C5 的八个音：先从 C4 数到 E4（1–3），再从 E4 数到 C5（1–6）；E4 标红
  const RUN = ['C4','D4','E4','F4','G4','A4','B4','C5'];
  const runSlot = i => .2 + i * .42;
  const counting = second => ({
    tones: RUN.map((k, i) => tone('r' + i, k, runSlot(i),
      i === 2 && second ? moved : (second ? i < 2 : i > 2) ? {color: COLOR.faint} : {})),
    staffLabels: [
      ...RUN.slice(0, 3).map((k, i) => below('a' + i, runSlot(i), String(i + 1), second ? COLOR.faint : '#334155', 4)),
      ...(second ? RUN.slice(2).map((k, i) => below('b' + i, runSlot(i + 2), String(i + 1), COLOR.bass, 18)) : [])]
  });

  // 度数对照（面板）：上一行原位 from–to，下一行转位，同一列相加等于 total；marks 'cN' 高亮原位为 N 的那一列
  const sums = (from, to, total, marks = []) => {
    const degrees = Array.from({length: to - from + 1}, (_, i) => from + i);
    return {panel: {key: 'sums-' + total, marks, html:
      `<div class="sums" style="--columns:${degrees.length}"><span class="sm-tag">原位</span><span class="sm-tag">转位</span>` +
      degrees.map((n, i) => `<span class="sm-cell" data-mark="c${n}" style="grid-column:${i + 2};grid-row:1">${n}</span>` +
        `<span class="sm-cell" data-mark="c${n}" style="grid-column:${i + 2};grid-row:2">${total - n}</span>`).join('') +
      `<span class="sm-total">同一列相加 = ${total}</span></div>`}};
  };

  const SCENE = {
    roles: pair(['c', 'C4'], ['e', 'E4'], ['根音', '冠音']),
    m3: stack([['c', 'C4'], ['e', 'E4']], 'M3', '原位音程'),
    rootUp: stack([['e', 'E4'], ['c', 'C5', moved]], null, '根音移高一个八度'),
    m6: stack([['e', 'E4'], ['c', 'C5', moved]], 'm6', '转位音程'),
    p4: stack([['a', 'A4'], ['d', 'D5']], 'P4'),
    p5: stack([['d', 'D4', moved], ['a', 'A4']], 'P5'),
    m2: stack([['c', 'C4'], ['d', 'D4']], 'M2'),
    m7: stack([['d', 'D4'], ['c', 'C5', moved]], 'm7'),
    a4: stack([['c', 'C4'], ['f', 'F#4']], 'A4'),
    d5: stack([['f', 'F#4'], ['c', 'C5', moved]], 'd5'),
    p1: stack([['a', 'D4'], ['b', 'D4']], 'P1'),
    p8: stack([['a', 'D4'], ['b', 'D5', moved]], 'P8'),
    a5: stack([['c', 'C4'], ['g', 'G#4']], 'A5', '变化音程'),
    d4: stack([['g', 'G#4'], ['c', 'C5', moved]], 'd4', '变化音程'),
    m10: stack([['c', 'C4'], ['e', 'E5']], 'M10'),
    stillBelow: stack([['c', 'C5', moved], ['e', 'E5']], null, 'C5 仍在 E5 下方'),
    // C6 在上加二线，名称抬高避开符头
    upTwo: {...stack([['e', 'E5'], ['c', 'C6', moved]], null, '根音移高两个八度'), staffSymbols: [above('name', CENTER, 'm6', {lift: 36})]},
    bothMove: stack([['e', 'E4', moved], ['c', 'C5', moved]], 'm6'),
    // C6 在上加二线，名称抬高避开符头
    m13: {...stack([['e', 'E4'], ['c', 'C6', moved]], null, '单音程转位成复音程'), staffSymbols: [above('name', CENTER, 'm13', {lift: 36})]},
    a8: pair(['c', 'C4'], ['cs', 'C#5'], ['低', '高'], 'A8'),
    a8once: pair(['c', 'C5', moved], ['cs', 'C#5'], ['低', '高']),
    d8: pair(['c', 'C5', moved], ['cs', 'C#4', moved], ['高', '低'], 'd8')
  };

  /* ---------- 课程内容 ---------- */
  const {steps, sections, section, group, quiz, accent, p, warn, TF} = ChordLesson.builder();

  // 一、原位音程与转位音程
  section('inversion', '一', '原位音程与转位音程');
  group('inversion', [
    [p('第一课里曾讲过两个概念：音程中下面的音叫<strong>根音</strong>，上面的音叫<strong>冠音</strong>。'), SCENE.roles],
    [p(`${accent('没有')}移动过位置的音程，叫<strong>原位音程</strong>。`), SCENE.m3],
    [p(`把根音${accent('移高一个八度')}，移到冠音上方，两个音的上下位置就颠倒了。`), SCENE.rootUp],
    [p('像这样颠倒高低位置后的音程，叫做<strong>转位音程</strong>（inversion）。'), SCENE.m6],
    [p(`要让音程转位，也可以把冠音${accent('移低一个八度')}到根音下方。`), [SCENE.p4, SCENE.p5], {sequence: 1400}],
    [p(`所以，音程转位的本质是${accent('高低互换')}。`), [SCENE.m3, SCENE.m6], {sequence: 1400}]
  ]);
  quiz('which-note', stack([['c', 'C4'], ['a', 'A4']], 'M6'), {
    question: 'C4–A4 转位，可以：', options: [['up', '把 C4 移到 C5'], ['down', '把 A4 移到 A3'], ['both', '两种都可以']], answer: 'both',
    right: '正确。两种做法都把两个音的高低位置颠倒了，得到的都是 A–C。',
    wrong: '转位的关键是什么？移根音和移冠音，结果有什么不同？'
  });

  // 二、单音程的转位
  section('simple', '二', '单音程的转位');
  group('simple', [
    [p(`原位和转位的单音程，前后的<strong>度数</strong>相加等于 9。例如三度可以和六度互相转位。`), sums(1, 8, 9, ['c3'])],
    [p(`如果疑惑“相加为什么是 9，而不是 8”，可以看到演示区：C4 到 E4 是三度，E4 到 C5 是六度，中间的 E4 被数了${accent('两次')}：3 + 6 − 1 = 8，所以 3 + 6 = 9。`), [counting(false), counting(true)], {sequence: 1600}],
    [p(`音程转位后，性质会${accent('互相反转')}：大变小，小变大。`), [SCENE.m2, SCENE.m7, SCENE.m3, SCENE.m6], {sequence: 1400}],
    [p(`或是增变减，减变增；倍增和倍减也一样${accent('互换')}。`), [SCENE.a4, SCENE.d5], {sequence: 1400}],
    [p(`增四度转位后是减五度，它们都是三全音，所以三全音转位后${accent('还是')}三全音。`), {...SCENE.d5, staffLabels: [below('under', CENTER, '三全音 TT')], play: false}],
    [p(`<strong>纯音程</strong>转位后，${accent('依然')}是纯音程。`), [SCENE.p4, SCENE.p5, SCENE.p1, SCENE.p8], {sequence: 1400}],
    [p(`音程转位还可以顺势推出一个规律：自然音程转位后还是自然音程，变化音程转位后${accent('还是')}变化音程。`), [SCENE.a5, SCENE.d4], {sequence: 1400}]
  ]);
  quiz('m7', stack([['c', 'C4'], ['b', 'B4']], 'M7'), {
    question: '大七度转位后是：', options: [['m2', '小二度'], ['M2', '大二度'], ['m7', '小七度']], answer: 'm2',
    right: '正确。7 + 2 = 9，大变小，所以是小二度。',
    wrong: '度数相加等于几？大音程转位后变成什么性质？'
  });
  quiz('d4', stack([['c', 'C4'], ['f', 'Fb4']], 'd4'), {
    question: '减四度转位后是：', options: [['A5', '增五度'], ['d5', '减五度'], ['P5', '纯五度']], answer: 'A5',
    right: '正确。4 + 5 = 9；减四度不是纯音程，减变增，所以是增五度。',
    wrong: '这个四度是纯四度吗？减音程转位后变成什么性质？'
  });
  quiz('tritone', {...SCENE.a4, staffLabels: [below('under', CENTER, '三全音 TT')]}, {
    question: '增四度转位后是减五度，所以三全音转位后仍然是三全音。', options: TF, answer: 'true',
    right: '正确。增四度和减五度都是三全音，转位后互相变换，仍然是三全音。',
    wrong: '增四度转位后是什么？它也是三全音吗？'
  });
  quiz('reverse', sums(1, 8, 9), {
    question: '一个音程转位后是增六度，原位音程是：', options: [['d3', '减三度'], ['m3', '小三度'], ['A3', '增三度']], answer: 'd3',
    right: '正确。9 − 6 = 3；转位后是增，原位就是减，所以是减三度。',
    wrong: '规律反过来也一样：度数相加等于几？增是从什么性质反转来的？'
  });

  // 三、复音程的转位
  section('compound', '三', '复音程的转位');
  group('compound', [
    [p(`复音程转位时，性质的变化和单音程${accent('完全相同')}。`), SCENE.m10],
    [p(`但是，复音程的跨度超过八度，只把其中一个音移动${accent('一个八度')}，高低位置颠倒不了。`), SCENE.stillBelow],
    [p(`一种做法是，把其中一个音${accent('移动两个八度')}。`), [SCENE.m10, SCENE.upTwo], {sequence: 1400}],
    [p(`也可以让根音和冠音${accent('反向')}各移一个八度。`), [SCENE.m10, SCENE.bothMove], {sequence: 1400}],
    [p(`度数方面，复音程转位成单音程，前后的度数相加等于${accent('16')}。`), sums(9, 15, 16, ['c10'])],
    [warn(`如果把音多移几个八度，复音程还可以转位成复音程，单音程也可以转位成复音程。`), [SCENE.m3, SCENE.m13], {sequence: 1400}],
    [p(`注意：<strong>增八度</strong>在理论上是单音程，但它比纯八度宽，只移一个八度，并不能让高低音互换。所以增八度要像复音程那样，比单音程多移动至少一个八度才能形成转位：转位后至少是减八度，继续移动还可以转位成减十五度。`), [SCENE.a8, SCENE.a8once], {sequence: 1400}],
    [p(`这样，增八度的转位就不符合单音程“转位前后度数相加等于 9”的规律，而是适用于复音程的转位度数规律（8 + 8 = 16）。`), [SCENE.a8once, SCENE.d8], {sequence: 1400}]
  ]);
  quiz('p12', {...stack([['c', 'C4'], ['g', 'G5']]), staffSymbols: [above('name', CENTER, 'P12', {lift: 28})]}, {
    question: '纯十二度转位成单音程是：', options: [['P4', '纯四度'], ['P5', '纯五度'], ['d4', '减四度']], answer: 'P4',
    right: '正确。16 − 12 = 4；纯音程转位后仍然是纯音程，所以是纯四度。',
    wrong: '复音程转位成单音程，度数相加等于几？纯音程转位后是什么性质？'
  });
  quiz('a8-sum', {...SCENE.a8, play: false}, {
    question: '增八度转位前后，度数相加是：', options: [['9', '9'], ['16', '16']], answer: '16',
    right: '正确。增八度转位后是减八度，8 + 8 = 16，和复音程一样。',
    wrong: '增八度转位后是几度？'
  });

  // 四、转位的应用
  section('apply', '四', '转位的应用');
  group('apply', [
    [p(`熟悉这些音程转位的规律，其中的一个作用就是：它能帮我们快速判断六、七度的远距离音程性质。`), sums(1, 8, 9, ['c6', 'c7'])],
    [p(`六度、七度在谱上跨度大，通过音数确定性质通常会比较慢；而二、三度的性质一般可以通过一两个全音、半音就能迅速确定。`), guess('C4', 'A4')],
    [p(`所以，当我们需要确定六、七度音程的性质时，把它转位为窄音程来分析会比直接数音数更快。`), lookUp('C4', 'A4', 'C5', 'A–C　m3')],
    [p(`例如：A–C 是小三度，所以 C–A 是大六度。`), answer('C4', 'A4', 'C5', 'M6', 'm3 → M6')],
    [p(`C–D 是大二度，所以 D–C 是${accent('小七度')}。`),
      [guess('D4', 'C5'), lookUp('D4', 'C5', 'D5', 'C–D　M2'), answer('D4', 'C5', 'D5', 'm7', 'M2 → m7')], {sequence: 1600}],
    [p(`通过转位音程的特征应用，就能更${accent('快速')}地认出远距离的六度和七度。`), sums(1, 8, 9, ['c2', 'c3', 'c6', 'c7'])]
  ]);
  const HINT = '把根音移高一个八度，看看是几度？';
  quiz('six-major', guess('E4', 'C#5'), {
    question: '这个音程是：', options: [['M6', '大六度'], ['m6', '小六度'], ['m3', '小三度']], answer: 'M6',
    right: '正确。转位成 C♯–E 是小三度，反转回来是大六度。', wrong: HINT
  });
  quiz('seven-major', guess('F4', 'E5'), {
    question: '这个音程是：', options: [['m7', '小七度'], ['M7', '大七度'], ['m2', '小二度']], answer: 'M7',
    right: '正确。转位成 E–F 是小二度，反转回来是大七度。', wrong: HINT
  });
  quiz('six-minor', guess('A4', 'F5'), {
    question: '这个音程是：', options: [['M6', '大六度'], ['m6', '小六度'], ['M3', '大三度']], answer: 'm6',
    right: '正确。转位成 F–A 是大三度，反转回来是小六度。', wrong: HINT
  });
  quiz('seven-minor', guess('G4', 'F5'), {
    question: '这个音程是：', options: [['m7', '小七度'], ['M7', '大七度'], ['M2', '大二度']], answer: 'm7',
    right: '正确。转位成 F–G 是大二度，反转回来是小七度。', wrong: HINT
  });

  ChordLesson.run({
    steps, sections, countBy: 'lesson', noteLength: 1,
    // 进度用固定名字保存；旧网址的进度第一次打开时搬过来
    storageId: 'interval-05', formerPaths: ['/MT-Intervals/lesson05/', '/MT-Intervals/lesson05/index.html'],
    preload: ['C4','D4','E4','F4','Fb4','F#4','G4','G#4','A4','B4','C5','C#4','C#5','D5','E5','F5','G5','C6']
  });
})();
