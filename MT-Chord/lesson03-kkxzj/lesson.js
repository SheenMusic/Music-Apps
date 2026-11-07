/* 和弦记号 · 第三课：延伸音和弦（初稿，2026-11-03）
   文字依据老师的 PDF 课件「03和弦标记_延伸音和弦_课件」，按第一课的节奏一步一句改写；待老师逐节审核。
   讲解区：<strong> = 音乐术语；accent() = 重点词；warn() = 「注意」。
   演示区：所有谱例共用一个舞台，步骤之间用“神奇移动”过渡。规则见 docs/interactive-theory-lesson-standard.md。 */
(() => {
  'use strict';
  const {COLOR, chordSymbol: cs, CENTER, PAIR} = ChordStage;

  /* ---------- 谱例资料 ---------- */
  const ROLE = {1: 'root', 3: 'third', 5: 'fifth', 7: 'seventh', 9: 'ninth', 11: 'eleventh', 13: 'thirteenth'};
  const ROLE_COLOR = {1: COLOR.root, 3: COLOR.third, 5: COLOR.fifth, 7: COLOR.seventh, 9: COLOR.ext, 11: COLOR.ext, 13: COLOR.ext};
  const tone = (id, key, color = COLOR.ink, label = '', slot = CENTER) => ({id, key, color, label, slot});
  // notes：[[度数, 音], …]；colored = 按度数上色并标出度数
  const chord = (notes, slot = CENTER, prefix = '', colored = false) =>
    notes.map(([d, k]) => tone(prefix + ROLE[d], k, colored ? ROLE_COLOR[d] : COLOR.ink, colored ? String(d) : '', slot));
  const sym = (root, suffix = '', slot = CENTER, extra = {}) => ({slot, root, suffix, ...extra});
  // C 属七和弦一路叠到十三音
  const C13 = [[1,'C4'], [3,'E4'], [5,'G4'], [7,'Bb4'], [9,'D5'], [11,'F5'], [13,'A5']];
  const upTo = n => C13.filter(([d]) => d <= n);
  const PANEL = {
    stackLine: {key: 'stack-line', html: '<p class="symbol-row">1 → 3 → 5 → <b class="c-seventh">7</b> → <b class="c-ext">9</b> → <b class="c-ext">11</b> → <b class="c-ext">13</b></p>'},
    degrees: state => ({key: 'degrees', state, html:
      '<div class="compare-table" role="table" aria-label="延伸音的默认音程">' +
      '<div class="compare-row compare-head" role="row"><span role="columnheader">数字</span><span role="columnheader">对应音级</span><span role="columnheader">默认音程</span></div>' +
      [['9', '2 的高八度', '大九度（M9）'], ['11', '4 的高八度', '纯十一度（P11）'], ['13', '6 的高八度', '大十三度（M13）']]
        .map(cells => `<div class="compare-row" role="row">${cells.map(c => `<span role="cell">${c}</span>`).join('')}</div>`).join('') + '</div>'}),
    // 七和弦 → 九、十一、十三和弦：只把 7 换成最高的延伸音
    replace: rows => ({key: 'replace-' + rows, html:
      '<div class="compare-table" role="table" aria-label="延伸音和弦的标记">' +
      '<div class="compare-row compare-head" role="row" style="--cols: repeat(4, 1fr)"><span role="columnheader">七和弦</span><span role="columnheader">九和弦</span><span role="columnheader">十一和弦</span><span role="columnheader">十三和弦</span></div>' +
      [['maj', 'maj'], ['m', 'm'], ['', ''], ['°', '°'], ['ø', 'ø']].slice(0, rows)
        .map(([a]) => `<div class="compare-row" role="row" style="--cols: repeat(4, 1fr)">${['7', '9', '11', '13'].map(n => `<span role="cell">${cs('C', a + n)}</span>`).join('')}</div>`).join('') + '</div>'}),
    steps: n => ({key: 'steps', state: String(n), html: '<ol class="method-list">' +
      ['去掉低音之外的八度重复音', '排除转位：低音上方一个八度内有 2、4、6 度音，优先考虑转位', '确定根音，标为 1', '标出其他音与根音的音程，汇总成记号']
        .map((t, i) => `<li${i === n ? ' class="is-current"' : ''}>${t}</li>`).join('') + '</ol>'}),
    symbol: (root, suffix, bass = '') => ({key: `symbol-${root}${suffix}${bass}`, html: `<p class="symbol-row big">${cs(root, suffix, bass)}</p>`})
  };
  const SCENE = {
    stack: n => ({tones: chord(upTo(n), CENTER, '', true), staffSymbols: [sym('C', n === 7 ? '7' : String(n))], play: true}),
    ninth: {tones: chord([[1,'C4'], [9,'D5']], CENTER, '', true), caption: 'C → D：<b class="c-ext">大九度（M9）</b>＝ 大二度 ＋ 八度'},
    fifteenth: {tones: [...chord(upTo(13), CENTER, '', true), tone('fifteenth', 'C6', COLOR.faint, '15')], caption: '再往上叠：15 就是根音的高八度'},
    bNinth: {tones: [tone('root', 'B3', COLOR.root, '1'), tone('ninth', 'C#5', COLOR.ext, '9')], staffSymbols: [sym('B', '9')], caption: 'B 的九音是 <b class="c-ext">C♯</b>（M9），不是 C'},
    maj9: {tones: chord([[1,'C4'], [3,'E4'], [5,'G4'], [7,'B4'], [9,'D5']], CENTER, '', true), staffSymbols: [sym('C', 'maj9')], caption: 'maj7 ＋ 9 → <b>maj9</b>', play: true},
    m9: {tones: chord([[1,'C4'], [3,'Eb4'], [5,'G4'], [7,'Bb4'], [9,'D5']], CENTER, '', true), staffSymbols: [sym('C', 'm9')], caption: 'm 说的是七和弦：Cm7 ＋ 9', play: true},
    // 省略：只留根、3、7 与最高的延伸音
    omitted: {tones: chord([[1,'C4'], [3,'E4'], [7,'Bb4'], [13,'A5']], CENTER, '', true), staffSymbols: [sym('C', '13')], caption: '根、3、7、13：仍然是 C13', play: true},
    full13: {tones: chord(upTo(13), CENTER, '', true), staffSymbols: [sym('C', '13')], play: true},
    // 原位优先：同一组音的两种解释
    rootFirst: {tones: ['C4', 'E4', 'G4', 'B4', 'D5', 'A5'].map((k, i) => tone('rf' + i, k, i ? COLOR.ink : COLOR.bass)),
      staffSymbols: [{slot: CENTER, stack: [['C', 'maj13'], ['A', 'm11', 'C']]}], caption: '优先把低音看作根音：Cmaj13'},
    inversion: {tones: [tone('g', 'G3', COLOR.bass), tone('c', 'C4', COLOR.root), tone('e', 'E4'), tone('b', 'B4'), tone('d', 'D5')], staffSymbols: [sym('C', 'maj9', CENTER, {bass: 'G'})], caption: '低音 G 上方有它的四度音 C → 转位：Cmaj9/G'},
    g13: {tones: [tone('g', 'G3', COLOR.root, '1'), tone('b', 'B3', COLOR.third, 'M3'), tone('f', 'F4', COLOR.seventh, 'm7'), tone('a', 'A4', COLOR.ext, '9'), tone('e', 'E5', COLOR.ext, '13')], staffSymbols: [sym('G', '13')], caption: 'G ＋ M3 ＋ m7 ＝ G7；最高延伸音 13 替代 7 → <b>G13</b>', play: true},
    plain: notes => ({tones: notes.map((k, i) => tone('q' + i, k))})
  };

  const {steps, sections, section, group, quiz, accent, p, warn, TF} = ChordLesson.builder();

  // 一、什么是延伸音和弦
  section('stack', '一', '什么是延伸音和弦');
  group('stack', [
    [p(`<strong>延伸音和弦（Extension Chord）</strong>是在七和弦上方，继续按${accent('三度')}向上叠置而成的和弦。`), SCENE.stack(7)],
    [p(`七音上方再叠三度，是<strong>九音</strong>；再叠，是<strong>十一音</strong>；再叠，是<strong>十三音</strong>。`), {panel: PANEL.stackLine}],
    [p(`所以延伸音和弦有三种：${accent('九和弦、十一和弦、十三和弦')}。`), SCENE.stack(13)],
    [p(`理论上还能叠出十五音、十七音，但它们和根音、三音成${accent('八度')}关系，通常不再单独标记。`), SCENE.fifteenth]
  ]);
  quiz('count', SCENE.stack(9), {
    question: '九和弦是在什么和弦上方继续叠三度得到的？',
    options: [['triad','三和弦'], ['seventh','七和弦'], ['sixth','六和弦']], answer: 'seventh',
    right: '正确。延伸音和弦都以七和弦为基础：七音上方再叠三度，就是九音。',
    wrong: '回想叠置的顺序：1 → 3 → 5 → 7 → 9。'
  });

  // 二、延伸音的默认音程
  section('degrees', '二', '延伸音的默认音程');
  group('degrees', [
    [p(`9、11、13 分别是 2、4、6 的${accent('高八度')}。`), {panel: PANEL.degrees('')}],
    [p(`作为延伸音，它们有${accent('固定的音程性质')}：9 是大九度，11 是纯十一度，13 是大十三度。`), SCENE.ninth],
    [p(`不符合这个性质的 9、11、13，${accent('不属于')}一般的延伸音——第四课会学到它们（变化音）。`), {panel: PANEL.degrees('')}]
  ]);
  group('b-ninth', [
    [warn(`九音按${accent('音程')}计算，不按调内音计算：B 的九音是 C♯（大九度），不是 C。`), SCENE.bNinth]
  ]);
  quiz('b9', SCENE.bNinth, {
    question: 'E 的九音（作为延伸音）是：',
    options: [['F','F'], ['F#','F♯'], ['G','G']], answer: 'F#',
    right: '正确。9 是大九度：E 往上大九度是 F♯。',
    wrong: '9 = 大二度的高八度。E 往上大二度是哪个音？'
  });

  // 三、延伸音和弦的标记
  section('symbols', '三', '延伸音和弦的标记');
  group('replace', [
    [p(`延伸音和弦的标记，只要用${accent('最高的延伸音')}替换七和弦记号里的 7。`), {panel: PANEL.replace(1)}],
    [p(`例如 Cmaj7 加上 9，就写作 ${accent('Cmaj9')}；再加上 11、13，写作 Cmaj11、Cmaj13。`), SCENE.maj9],
    [p(`其他七和弦也一样：Cm7 → Cm9，C7 → C9，C°7 → C°9，Cø7 → Cø9 ……`), {panel: PANEL.replace(3)}]
  ]);
  group('m9', [
    [warn(`m9、mM9 里的 m 或 mM，说的是${accent('七和弦的性质')}，不是九度的性质。`), SCENE.m9]
  ]);
  quiz('c9', {panel: PANEL.symbol('C', '9')}, {
    question: 'C9 的七音是：',
    options: [['B','B（大七度）'], ['Bb','B♭（小七度）'], ['none','没有七音']], answer: 'Bb',
    right: '正确。C9 由 C7 延伸而来，七音是小七度 B♭；九音是 D。',
    wrong: 'C9 是哪一种七和弦加上九音？'
  });
  quiz('m11', {panel: PANEL.symbol('D', 'm11')}, {
    question: 'Dm11 的组成音（完整写出）是：',
    options: [['right','D–F–A–C–E–G'], ['major','D–F♯–A–C–E–G'], ['maj7','D–F–A–C♯–E–G']], answer: 'right',
    right: '正确。Dm7（D–F–A–C）上方叠 9（E）和 11（G）。',
    wrong: '先写出 Dm7，再往上叠三度。'
  });

  // 四、省略与简化
  section('omit', '四', '省略与简化');
  group('omit', [
    [p(`实际演奏时，${accent('5、9、11')} 经常被全部或部分省略。`), SCENE.full13],
    [p(`但根音、3、7 和${accent('最高的延伸音')}通常不省略：这四个音就能构成一个延伸音和弦。`), SCENE.omitted],
    [p(`其中${accent('七音')}最关键：没有七音，就不是延伸音和弦。`), SCENE.omitted]
  ]);
  group('simplify', [
    [p(`反过来，在不要求写出全部延伸音的场合，乐谱也常把延伸音和弦${accent('简写成七和弦')}，由演奏者自己加 9、11、13。`), SCENE.stack(7)]
  ]);
  quiz('omitted', SCENE.omitted, {
    question: '谱例中只有 C、E、B♭、A 四个音，它仍然可以标记为 C13。',
    options: TF, answer: 'true',
    right: '正确。根音、3、7 与最高的延伸音 13 都在，省略的 5、9、11 不影响记号。',
    wrong: '延伸音和弦最少需要哪几个音？'
  });

  // 五、原位优先与转位
  section('position', '五', '原位优先与转位');
  group('root-first', [
    [p(`一组音常常可以有${accent('好几种')}解释。例如这组音，可以是 Cmaj13，也可以是 Am11/C。`), SCENE.rootFirst],
    [p(`没有清楚的调性环境时，${accent('优先把低音看作根音')}，标成原位和弦，最有效率。`), SCENE.rootFirst]
  ]);
  group('inversion', [
    [p(`那什么时候算转位？本课采用一个实用的标准：最低音上方${accent('一个八度内')}，出现它的二度、四度或六度音。`), SCENE.inversion],
    [p(`也就是说：默认低音是根音；只有满足这个条件，才看作转位和弦。`), SCENE.inversion],
    [warn(`9、11、13 几乎不放在斜线后面当低音；原位和弦里的 9、11、13 也不要随意写成 2、4、6。`), SCENE.inversion]
  ]);
  quiz('inversion', SCENE.plain(['E3', 'G4', 'B4', 'C5']), {
    question: '低音 E 上方一个八度内有 C（它的六度音）。按本课的标准，这个和弦应该看作：',
    options: [['inv','转位和弦：Cmaj7/E'], ['root','原位和弦：Em(♭6)'], ['none','无法判断']], answer: 'inv',
    right: '正确。低音上方一个八度内有六度音，优先考虑转位：C–E–G–B，低音 E。',
    wrong: '回想转位的判断标准：低音上方一个八度内，有没有 2、4、6 度音？',
    reveal: [sym('C', 'maj7', CENTER, {bass: 'E'})]
  });

  // 六、和弦音标注分析法
  section('method', '六', '和弦音标注分析法');
  group('method', [
    [p(`遇到复杂的和弦，可以把每个音和根音的${accent('音程')}都标出来，再汇总成记号。`), {panel: PANEL.steps(-1)}],
    [p(`① 去掉低音之外的${accent('八度重复音')}。`), {panel: PANEL.steps(0)}],
    [p(`② ${accent('排除转位')}：低音上方一个八度内有 2、4、6 度音，优先考虑转位。`), {panel: PANEL.steps(1)}],
    [p(`③ 确定根音，标为 ${accent('1')}。`), {panel: PANEL.steps(2)}],
    [p(`④ 标出其他音与根音的音程，依次确定三和弦、七度与延伸音，${accent('汇总成一个记号')}。`), {panel: PANEL.steps(3)}],
    [p(`例如：G ＋ M3 ＋ m7 ＝ G7；记号只写最高的延伸音，所以舍去 9，用 13 替代 7，写作 ${accent('G13')}。`), SCENE.g13]
  ]);
  quiz('g13', SCENE.plain(['F3', 'A3', 'Eb4', 'G4', 'D5']), {
    question: '按标注分析法，谱例中的和弦是：',
    options: [['f13','F13'], ['f9','F9'], ['fm9','Fm9']], answer: 'f13',
    right: '正确。F ＋ M3（A）＋ m7（E♭）＝ F7；还有 9（G）和 13（D），只写最高的 13：F13。',
    wrong: '从 F 出发，标出每个音的音程。最高的延伸音是几？',
    reveal: [sym('F', '13')]
  });

  ChordLesson.run({
    steps, sections,
    preload: ['C4','E4','G4','Bb4','D5','F5','A5','C6','B3','C#5','Eb4','B4','G3','F3','A3','E3','G4','C5','Eb4','D5']
  });
})();
