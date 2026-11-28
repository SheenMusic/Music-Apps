/* 和弦记号 · 第六课：综合应用（2026-11-21）
   文字与演示依据 docs/chord-theory/lesson06-v1.md（老师定稿）。讲解 19 页（含一页「注意」），课内 Quiz 6 道（2026-11-21 老师确认）。
   演示区只用两个例子（同一组音的两种排列），不使用课后练习 Snowman 的内容：
     例一 E3–C4 | D4–G4–B4　　例二 E3–B3 | D4–G4–C5（竖线左边写在低音谱表）
   音的标注：根音标 1；三音、五音、七音标音程性质（m3、M3、P5、m7、M7）；延伸音标 9、11、13 及升降号。
   颜色按和弦音身份：根音、三音、五音、七音各用固定颜色，延伸音与变化音用延伸音色。 */
(() => {
  'use strict';
  const {COLOR, CENTER, PAIR, chordSymbol: cs} = ChordStage;
  const FAINT = COLOR.faint;

  /* ---------- 谱例资料 ---------- */
  // [id, 音, 写在低音谱表]
  const EX1 = [['e', 'E3', true], ['c', 'C4', true], ['d', 'D4'], ['g', 'G4'], ['b', 'B4']];
  const EX2 = [['e', 'E3', true], ['b', 'B3', true], ['d', 'D4'], ['g', 'G4'], ['c', 'C5']];
  // 例一：以各音为根音时，每个音的标注与谱例上方的记号
  const ROOTS = ['E', 'C', 'D', 'G', 'B'];
  const TABLE = {
    E: {labels: {e: '1', c: '♭13', d: 'm7', g: 'm3', b: 'P5'}, symbol: ['E', 'm7(♭13)']},
    C: {labels: {e: 'M3', c: '1', d: '9', g: 'P5', b: 'M7'}, symbol: ['C', 'maj9', 'E']},
    D: {labels: {e: '9', c: 'm7', d: '1', g: '11', b: '13'}, symbol: ['D', '13sus4', 'E']},
    G: {labels: {e: '13', c: '11', d: 'P5', g: '1', b: 'M3'}, symbol: ['G', '6(add4)', 'E']},
    B: {labels: {e: '11', c: '♭9', d: 'm3', g: '♭13', b: '1'}, symbol: ['B', 'm(♭9,11,♭13)', 'E']}
  };
  const EX2_LABELS = {e: '1', b: 'P5', d: 'm7', g: 'm3', c: '♭13'};
  // 标注的颜色：按和弦音身份
  const colorOf = label => label === '1' ? COLOR.root : /^[mM]3$/.test(label) ? COLOR.third : label === 'P5' ? COLOR.fifth : /^[mM]7$/.test(label) ? COLOR.seventh : COLOR.ext;

  // 一个例子的谱面。labels：要标注的音；faint：变浅的音；slot、prefix：两个例子并排时用
  function example(notes, {labels = {}, faint = [], slot = CENTER, prefix = ''} = {}) {
    return notes.map(([id, key, bass]) => {
      const label = labels[id] || '';
      return {id: prefix + id, key, slot, label, staff: bass ? 'bass' : 'treble',
        color: faint.includes(id) ? FAINT : label ? colorOf(label) : COLOR.ink};
    });
  }
  const sym = (root, suffix = '', bass = '', slot = CENTER, extra = {}) => ({slot, root, suffix, bass, ...extra});
  const rootButtons = (roots, group) => roots.map(r => [group + ':' + r, r]);
  const controls = rootButtons(ROOTS, 'intro');
  const remaining = ['D', 'G', 'B'];
  const reviewButtons = ROOTS.map(r => ['review:' + r, remaining.includes(r) ? r : r + ' ✓']);
  const compareButtons = rootButtons(remaining, 'compare');
  // 例一，以 root 为根音（root 为空：不标注）
  function picked(root = '', extra = {}) {
    const row = TABLE[root];
    return {grand: true, tap: 'chord', quiet: true, controls, pressed: root ? `intro:${root}` : '',
      tones: example(EX1, {labels: row ? row.labels : {}}),
      staffSymbols: row ? [sym(...row.symbol)] : [], ...extra};
  }
  // 例二，逐步补全
  const ex2 = (labels, faint, symbol, extra = {}) => ({grand: true, tap: 'chord',
    tones: example(EX2, {labels, faint}), staffSymbols: symbol ? [sym(...symbol)] : [], ...extra});
  // 依次标出：每一步多标一个音
  const growing = (notes, labels, make) => notes.map((_, i) => make(Object.fromEntries(notes.slice(0, i + 1).map(([id]) => [id, labels[id]]))));
  const ONLY = (labels, ids) => Object.fromEntries(ids.map(id => [id, labels[id]]));
  const BOTH = (left, right) => ({grand: true, tap: 'chord',
    tones: [...example(EX1, {...left, slot: PAIR[0], prefix: 'l-'}), ...example(EX2, {...right, slot: PAIR[1], prefix: 'r-'})],
    staffSymbols: [sym('C', 'maj9', 'E', PAIR[0], {size: 15}), sym('E', 'm7(♭13)', '', PAIR[1], {size: 15})],
    staffLabels: [{slot: PAIR[0], text: '例一'}, {slot: PAIR[1], text: '例二'}]});

  // 翻页时课件复用场景对象，首页保留首次进入时的空白状态。
  const introFirst = picked();
  const introFollowing = picked('E');
  function chooseRoot(id) {
    const [group, root] = id.split(':');
    if (group === 'intro') {
      const scene = picked(root);
      Object.assign(introFirst, scene);
      Object.assign(introFollowing, scene);
      return scene;
    }
    return picked(root, {controls: group === 'review' ? reviewButtons : compareButtons, pressed: id});
  }
  const SCENE = {
    // 规则二：E3 与 C4，C5 为小十三度的位置（灰色、不发声）
    thirteenth: {grand: true, tap: 'chord', tones: [...example(EX1, {labels: {e: '1', c: '♭13'}, faint: ['d', 'g', 'b']}),
      {id: 'ghost', key: 'C5', slot: CENTER + .9, color: FAINT, label: 'm13', mute: true}],
      staffSymbols: [sym('E', 'm7(♭13)')]},
    octave: {grand: true, tap: 'chord', tones: example(EX1, {labels: {e: '1', c: '♭13'}, faint: ['d', 'g', 'b']}),
      octaves: [{id: 'e'}], staffLabels: [{slot: CENTER, text: 'E₃–C₄：小六度'}], staffSymbols: [sym('E', 'm7(♭13)')]},
    doubled: {grand: true, tap: 'chord', tones: [{id: 'e2', key: 'E2', slot: CENTER, staff: 'bass', color: COLOR.root, label: ''},
      ...example(EX1, {labels: {e: '1', c: '♭13'}, faint: ['d', 'g', 'b']})],
      arcs: [{from: 'e2', to: 'e', text: '', color: COLOR.root, side: 'left', shape: 'bracket'}], octaves: [{id: 'e'}],
      staffLabels: [{slot: CENTER, text: '从上方的 E₃ 起算'}]}
  };

  // 课内 Quiz 的谱例：[音, …]，C4 以下写在低音谱表
  const quizChord = keys => ({grand: true, tap: 'chord', tones: keys.map((key, i) => ({id: 'q' + i, key, slot: CENTER, color: COLOR.ink, label: ''}))});

  /* ---------- 讲解与 Quiz ---------- */
  const {steps, sections, section, group, quiz, p, warn} = ChordLesson.builder();
  let page = 0;
  function say(number, text, scene, extra = {}) {
    if (++page !== number) throw new Error('第六课页码不连续：' + number);
    group('p' + number, [[p(text), scene, extra]]);
  }

  section('readings', '一', '从音组到和弦记号');
  say(1, '前五课，我们学习了和弦记号的读法和写法。', introFirst, {hint: '点击谱表下方的音名，看看这些和弦记号你是不是都认识。'});
  say(2, '同一组音，选取不同的根音，可以写出不同的和弦记号。', introFollowing);
  say(3, '这些记号方案都可能在结构上成立，但并不是每一个方案对应到具体音乐中都能被接受。', introFollowing);
  say(4, '本课用三条规则，通过判断最合理的根音，帮助我们做出这个能被接受的决定。', introFollowing);

  section('rule1', '二', '规则一：优先以低音为根音');
  say(5, '首先，以低音为根音，标出其余各音相对于根音的位置。',
    ex2(EX2_LABELS, []), {animateEntry: false});
  say(6, '然后看三音和五音，确定三和弦的性质。（纯五度的五音可能省略，但不影响和弦大小的判断）', ex2(EX2_LABELS, ['d', 'c'], ['E', 'm']));
  say(7, '再通过七音确定七和弦的性质。', ex2(EX2_LABELS, ['c'], ['E', 'm7']));
  say(8, '最后把延伸音写入记号，就得到了整个完整的记号。', ex2(EX2_LABELS, [], ['E', 'm7(♭13)']));
  quiz('rule1-dm9', quizChord(['D3', 'A3', 'C4', 'F4', 'E5']), {
    question: '以低音为根音，谱例中和弦的记号是：',
    options: [['dm9', cs('D', 'm9')], ['f6', cs('F', '6', 'D')], ['am', cs('A', 'm', 'D')]], answer: 'dm9',
    right: '以 D 为根音：A 是纯五度，C 是小七度，F 是小三度，E₅ 是九音，在一个八度以外，所以写 Dm9。',
    wrong: '先以低音 D 为根音，依次看三音、五音、七音，最后看延伸音。'
  });

  section('rule2', '三', '规则二：检查低音上方八度内的二、四、六度');
  say(9, '虽然原位是大多数和弦的首选排列，但仍然不能排除有些和弦是按转位来排列的。',
    [{...picked(), controls: [], play: true}, ...growing(EX1, TABLE.E.labels, labels => ({...picked(), controls: [], tones: example(EX1, {labels})})),
      {...picked('E'), controls: []}], {sequence: 800});
  say(10, '可以参考的一个重要规律是：真正的延伸音在常见的和弦里，很少跟低音用单音程排列。', SCENE.thirteenth);
  say(11, '如果低音上方一个八度的范围内出现二度、四度或六度的单音程延伸音，这种做法通常并不符合一般的<strong>和弦排列（Voicing）</strong>规范。这意味着当前低音很有可能不是真的根音。', SCENE.octave);
  quiz('rule2-signal', {...SCENE.octave, staffLabels: [], staffSymbols: []}, {
    question: '以低音为根音分析时，出现哪种情况，说明低音很可能不是根音？',
    options: [['near', '低音上方一个八度以内，出现二度、四度或六度的延伸音'], ['far', '延伸音在低音上方一个八度以外'], ['no5', '五音被省略']], answer: 'near',
    right: '真正的延伸音很少和低音构成单音程；在一个八度以内出现二度、四度、六度时，要换一个音作为根音。',
    wrong: '回想前两页：延伸音和低音之间通常是复音程。'
  });
  say(12, '如果低音以八度重复，可以把这两个音视为同一个低音，建议以上方的音为起点做一次同样的检查。', SCENE.doubled);
  say(13, '接下来，试着以低音上方的不同音名的音为根音，重新判断各音的音程性质。',
    {...picked('C'), controls: []}, {animateEntry: false});
  quiz('rule2-dm9f', quizChord(['F2', 'D3', 'A3', 'C4', 'E4']), {
    question: '谱例中和弦最合适的记号是：',
    options: [['fmaj13', cs('F', 'maj13')], ['dm9f', cs('D', 'm9', 'F')], ['am7f', cs('A', 'm7', 'F')]], answer: 'dm9f',
    right: 'F₂ 上方一个八度以内的 D₃ 与低音构成六度，所以 F 很可能不是根音。以 D 为根音，D、F、A、C、E 是 Dm9，低音 F 是三音：Dm9/F。',
    wrong: '先检查低音 F 上方一个八度以内，有没有二度、四度或六度。'
  });

  section('rule3', '四', '规则三：优先让根、三、五、七做低音');
  say(14, '如果把其余三个音也依次当作根音，低音会变成什么和弦音？', {...picked(), controls: reviewButtons, tones: example(EX1, {labels: {e: '?'}, faint: []}).map(t => t.id === 'e' ? {...t, color: COLOR.root} : t)}, {hint: '✓ 表示已完成检验的根音。'});
  say(15, '一般的 voicing 规则里，会把根、三、五、七音看做基本和弦音，延伸音和它们的变化音看作色彩装饰。',
    {...picked('C'), controls: [], tones: example(EX1, {labels: ONLY(TABLE.C.labels, ['e', 'c', 'g', 'b']), faint: ['d']})});
  say(16, '和弦的低音声部作为声音的根基，通常优先考虑这些基本和弦音。', {...picked('C'), controls: [], staffLabels: [{slot: CENTER, text: '低音 E：三音'}]});
  say(17, '如果发现延伸音或它们的变化音做了和弦的低音，这种方案一般是不被接受的。', picked('D', {controls: compareButtons, pressed: 'compare:D'}), {hint: '点击 D、G、B，看低音 E 变成什么。'});
  group('p18-note', [[warn('如果上方的音本身构成一个完整、常见的和弦，低音作为独立的一层，也可以写成「上方和弦/低音」；这时斜线表示和弦与低音的组合，而不是转位。'),
    {grand: true, tap: 'chord', tones: [['g', 'G2'], ['f', 'F3'], ['a', 'A3'], ['c', 'C4']].map(([id, key]) => ({id, key, slot: CENTER, color: id === 'g' ? COLOR.root : COLOR.ink, label: '', staff: id === 'c' ? 'treble' : undefined})),
      staffSymbols: [sym('F', '', 'G')], staffLabels: [{slot: CENTER, text: '上方：F 大三和弦　低音：G'}]}]]);
  page++;
  quiz('rule3-bass', quizChord(['C3', 'E4', 'G4', 'B4', 'D5']), {
    question: '如果以 E 为根音，低音 C 是 E 的什么音？',
    options: [['m3', 'm3'], ['b13', '♭13'], ['p5', 'P5']], answer: 'b13',
    right: 'C 是 E 上方的小十三度，是变化的延伸音。延伸音做低音一般不被接受，所以这个和弦写 Cmaj9。',
    wrong: '从 E 往上数到 C 是几度？这个度数属于基本和弦音，还是延伸音？'
  });
  say(19, '把低音的作用和各音的实际排列放在一起比较，就能为这两个音组选出各自最合适的记号。',
    BOTH({labels: TABLE.C.labels}, {labels: EX2_LABELS}));
  quiz('rule3-tones', quizChord(['C3', 'E4', 'G4', 'B4', 'D5']), {
    question: '在转位和弦中，通常适合作为低音的是：',
    options: [['1', '根音'], ['3', '三音'], ['5', '五音'], ['7', '七音'], ['9', '九音'], ['13', '十三音']], answer: ['1', '3', '5', '7'],
    right: '根音、三音、五音和七音是基本和弦音，适合作低音；延伸音是色彩装饰，一般不作低音。',
    wrong: '想一想：哪些音是基本和弦音，哪些是色彩装饰？'
  });
  quiz('final-g', quizChord(['G3', 'F4', 'Ab4', 'D5']), {
    question: '谱例中的和弦，可以写成下面哪些记号？（多选）',
    options: [['g7b9', cs('G', '7(♭9)')], ['g7b9o3', cs('G', '7(♭9,omit3)')], ['fm6', cs('F', 'm6', 'G')], ['ddim', cs('D', '°', 'G')], ['bhalf', cs('B', 'ø7', 'G')]],
    answer: ['g7b9o3', 'fm6', 'ddim'],
    right: '以 G 为根音：D 是纯五度，F 是小七度，A♭ 是小九度；没有三音，又没有 11 音，所以要写 omit3：G7(♭9,omit3)。上方的 F、A♭、D 也可以看作省略五音的 Fm6，或 D 减三和弦，低音 G 作为独立的一层：Fm6/G、D°/G。',
    wrong: 'G7(♭9) 不对：三音只有在大三和弦带 11 音时才能省略。Bø7/G 缺少 B 和 A。再看看上方的音能组成什么完整的和弦。'
  });

  if (steps.length !== 25 || steps.filter(step => step.quiz).length !== 6) throw new Error('第六课页数或 Quiz 数量不正确');
  ChordLesson.run({
    steps, sections, quizExtras: true, tapParts: true,
    onControl: chooseRoot,
    preload: ['E2', 'E3', 'B3', 'C4', 'D4', 'G4', 'B4', 'C5']
  });
})();
