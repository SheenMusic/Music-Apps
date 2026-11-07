/* 和弦记号 · 第六课：综合分析（初稿，2026-11-03）
   老师的 PDF「06和弦标记_综合分析」是一首作品分析（《Do You Want to Build a Snowman》，放在课后练习）。
   本课初稿把前五课的方法整理成一套分析步骤，配原创的短谱例示范；待老师决定讲法。
   讲解区：<strong> = 音乐术语；accent() = 重点词；warn() = 「注意」。 */
(() => {
  'use strict';
  const {COLOR, chordSymbol: cs, CENTER, PAIR} = ChordStage;

  const tone = (id, key, color = COLOR.ink, label = '', slot = CENTER) => ({id, key, color, label, slot});
  const sym = (root, suffix = '', slot = CENTER, extra = {}) => ({slot, root, suffix, ...extra});
  const STEPS = ['划分和弦：按低声部与和声节奏，找出每个和弦从哪里开始', '排除和弦外音', '叠三度找根音（原位优先，再看是否转位）', '确定性质、七音、延伸音与变化音', '选择最简洁、规范的写法', '检查低音：不是根音就写斜线'];
  const PANEL = {
    steps: n => ({key: 'steps', state: String(n), html: '<ol class="method-list">' + STEPS.map((t, i) => `<li${i === n ? ' class="is-current"' : ''}>${t}</li>`).join('') + '</ol>'}),
    symbols: list => ({key: 'symbols-' + list.map(x => x.join('')).join(), html: `<p class="symbol-row">${list.map(([r, x, b]) => cs(r, x, b || '')).join('　')}</p>`}),
    symbol: (root, suffix, bass = '') => ({key: `symbol-${root}${suffix}${bass}`, html: `<p class="symbol-row big">${cs(root, suffix, bass)}</p>`})
  };
  // 示范：两个和弦一组（左右并排）
  const pair = (left, right, symbols, caption) => ({
    tones: [...left.map((k, i) => tone('l' + i, k, COLOR.ink, '', PAIR[0])), ...right.map((k, i) => tone('r' + i, k, COLOR.ink, '', PAIR[1]))],
    staffSymbols: symbols.map(([root, suffix, bass = ''], i) => sym(root, suffix, PAIR[i], {bass, size: 15})),
    caption, play: true
  });
  const SCENE = {
    // 和弦外音：分解的 C 和弦中，D 是经过音
    passing: {tones: ['C4','D4','E4','G4'].map((k, i) => tone('p' + i, k, k === 'D4' ? COLOR.faint : COLOR.ink, '', CENTER - .75 + i * .5)),
      offsets: [0, .45, .9, 1.35], staffSymbols: [sym('C', '', CENTER - .75)], caption: '<b>D</b> 是经过音：不算进和弦', play: true},
    demo1: pair(['F4','A4','C5','E5'], ['D4','F4','C5','E5'], [['F', 'maj7'], ['D', 'm9']], '低音 F：F–A–C–E　低音 D：D–F–(A)–C–E'),
    demo2: pair(['G3','F4','Bb4','D5'], ['C4','F4','G4','Bb4'], [['G', 'm7'], ['C', '7sus4']], '右边没有三音，F 代替了 E：sus4'),
    demo3: pair(['A3','G4','C5','E5'], ['D4','F#4','C5','Eb5'], [['A', 'm7'], ['D', '7(♭9)']], 'E♭ 是 D 的小九度：♭9'),
    demo4: pair(['D4','F4','A4','Bb4'], ['Bb3','D4','F4','A4'], [['B♭', 'maj7', 'D'], ['B♭', 'maj7']], '左：低音 D 上方有六度音 B♭ → 转位'),
    plain: notes => ({tones: notes.map((k, i) => tone('q' + i, k))})
  };

  const {steps, sections, section, group, quiz, accent, p, warn, TF} = ChordLesson.builder();

  // 一、分析的步骤
  section('steps', '一', '分析的步骤');
  group('steps', [
    [p(`这一课把前五课的规则连起来，为${accent('一段完整的音乐')}写出和弦记号。`), {panel: PANEL.steps(-1)}],
    [p(`① ${accent('划分和弦')}：先看低声部和节奏，找出每个和弦从哪里开始。`), {panel: PANEL.steps(0)}],
    [p(`② ${accent('排除和弦外音')}：旋律里的经过音、辅助音等，不算进和弦。`), SCENE.passing],
    [p(`③ ${accent('找根音')}：把剩下的音按三度叠置；没有调性环境时，原位优先，再按第三课的标准判断是否转位。`), {panel: PANEL.steps(2)}],
    [p(`④ 确定${accent('性质、七音、延伸音与变化音')}：可以用第三课的「和弦音标注分析法」。`), {panel: PANEL.steps(3)}],
    [p(`⑤ 选择${accent('最简洁、规范')}的写法：例如 7sus4 而不是 m7sus4；有七音加 6 写 13。`), {panel: PANEL.steps(4)}],
    [p(`⑥ 最后检查${accent('低音')}：低音不是根音，就用斜线写出来。`), {panel: PANEL.steps(5)}]
  ]);
  quiz('order', {panel: PANEL.steps(-1)}, {
    question: '分析一段音乐时，第一步应该做的是：',
    options: [['split','划分和弦：找出每个和弦从哪里开始'], ['name','直接给每个音写记号'], ['top','先看最高音']], answer: 'split',
    right: '正确。先确定和弦的范围，才能知道哪些音属于同一个和弦。',
    wrong: '还不知道哪些音属于同一个和弦时，能写记号吗？'
  });

  // 二、示范
  section('demo', '二', '示范：一段和弦进行');
  group('demo', [
    [p(`看一段原创的示范进行。每个低音换了，就是一个新的和弦。`), SCENE.demo1],
    [p(`第一个和弦：F–A–C–E，大七和弦 ${accent('Fmaj7')}。第二个：D–F–C–E，省略五音的 ${accent('Dm9')}。`), SCENE.demo1],
    [p(`接着：G–B♭–D–F 是 Gm7；C–F–G–B♭ 没有三音，F 代替了 E：${accent('C7sus4')}。`), SCENE.demo2],
    [p(`再接着：A–C–E–G 是 Am7；D–F♯–C–E♭ 是属七和弦加上小九度：${accent('D7(♭9)')}。`), SCENE.demo3],
    [p(`最后，低音 D 上方一个八度内有它的六度音 B♭，按标准看作${accent('转位')}：B♭maj7/D。`), SCENE.demo4]
  ]);
  quiz('demo', SCENE.plain(['C4', 'Bb4', 'E5', 'A5']), {
    question: '谱例中的和弦（C–B♭–E–A）是：',
    options: [['c13','C13'], ['c6','C6'], ['am','Am/C']], answer: 'c13',
    right: '正确。C ＋ M3（E）＋ m7（B♭）＝ C7；还有 13（A），写作 C13。',
    wrong: '以低音 C 为根音，标出每个音的音程。有没有七音？',
    reveal: [sym('C', '13')]
  });

  // 三、常见错误
  section('mistakes', '三', '常见错误回顾');
  group('mistakes', [
    [warn(`单独的 7 是${accent('小七度')}：C7 ≠ Cmaj7。`), {panel: PANEL.symbols([['C', '7'], ['C', 'maj7']])}],
    [warn(`「−」表示${accent('小')}，「°」才表示减：C−7 ≠ C°7。`), {panel: PANEL.symbols([['C', '−7'], ['C', '°7']])}],
    [warn(`没有七音写 add：${accent('Cadd9 ≠ C9')}。`), {panel: PANEL.symbols([['C', 'add9'], ['C', '9']])}],
    [warn(`被变化的延伸音不能做最高延伸音：写 C7(♯9)，不写 C9(♯9)。`), {panel: PANEL.symbols([['C', '7(♯9)'], ['C', '9(♯9)']])}],
    [warn(`9、11、13 几乎不放在斜线后面当低音，优先原位分析。`), {panel: PANEL.symbols([['C', 'maj7', 'D']])}]
  ]);
  quiz('mistake', {panel: PANEL.symbols([['C', 'm7sus4'], ['C', '7sus4']])}, {
    question: 'Cm7sus4 与 C7sus4，规范的写法是：',
    options: [['a','Cm7sus4'], ['b','C7sus4']], answer: 'b',
    right: '正确。sus4 代替了三音，m 没有意义。',
    wrong: 'sus4 代替了哪个音？'
  });

  ChordLesson.run({
    steps, sections,
    preload: ['C4','D4','E4','G4','F3','A4','C5','E5','D3','F4','G3','Bb4','D5','A3','G4','F#4','Eb5','Bb3','A5']
  });
})();
