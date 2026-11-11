/* 和弦记号 · 第四课：和弦变音（初稿，2026-11-03）
   文字依据老师的 PDF 课件「04和弦标记_和弦变音_课件」，按第一课的节奏一步一句改写；待老师逐节审核。
   讲解区：<strong> = 音乐术语；accent() = 重点词；warn() = 「注意」。
   演示区：所有谱例共用一个舞台，步骤之间用“神奇移动”过渡。规则见 docs/interactive-theory-lesson-standard.md。 */
(() => {
  'use strict';
  const {COLOR, chordSymbol: cs, CENTER, PAIR} = ChordStage;

  /* ---------- 谱例资料 ---------- */
  const tone = (id, key, color = COLOR.ink, label = '', slot = CENTER) => ({id, key, color, label, slot});
  const sym = (root, suffix = '', slot = CENTER, extra = {}) => ({slot, root, suffix, ...extra});
  // C7 的四个音（id 固定，变化音单独加）
  const C7 = (slot = CENTER, prefix = '') => [tone(prefix + 'root', 'C4', COLOR.ink, '', slot), tone(prefix + 'third', 'E4', COLOR.ink, '', slot), tone(prefix + 'fifth', 'G4', COLOR.ink, '', slot), tone(prefix + 'seventh', 'Bb4', COLOR.ink, '', slot)];
  const altered = (id, key, label) => tone(id, key, COLOR.ext, label);
  const PANEL = {
    // 变化音的种类：结构音变音与延伸音变音
    kinds: state => ({key: 'kinds', state, html:
      '<div class="compare-table" role="table" aria-label="和弦变音的种类" style="--cols: 1.4fr repeat(2, 1fr)">' +
      '<div class="compare-row compare-head" role="row"><span role="columnheader">种类</span><span role="columnheader">记号</span><span role="columnheader">音程</span></div>' +
      [['结构音（五音）', '♭5', 'd5'], ['', '♯5', 'A5'], ['延伸音', '♭9', 'm9'], ['', '♯9', 'A9'], ['', '♯11', 'A11'], ['', '♭13', 'm13']]
        .map(cells => `<div class="compare-row" role="row">${cells.map(c => `<span role="cell">${/[♭♯]/.test(c) ? cs('', c) : c}</span>`).join('')}</div>`).join('') + '</div>'}),
    symbol: (root, suffix, bass = '') => ({key: `symbol-${root}${suffix}${bass}`, html: `<p class="symbol-row big">${cs(root, suffix, bass)}</p>`}),
    symbols: list => ({key: 'symbols-' + list.join(), html: `<p class="symbol-row">${list.map(([r, x]) => cs(r, x)).join('　')}</p>`})
  };
  const SCENE = {
    c7: {tones: C7(), staffSymbols: [sym('C', '7')], play: true},
    flat9: {tones: [...C7(), altered('ninth', 'Db5', '♭9')], staffSymbols: [sym('C', '7(♭9)')], caption: '九音 D 降半音：<b class="c-ext">♭9</b>', play: true},
    sharp5: {tones: [tone('root','C4'), tone('third','E4'), altered('fifth','G#4','♯5'), tone('seventh','Bb4')], staffSymbols: [sym('C', '7(♯5)')], caption: '五音 G 升半音：<b class="c-ext">♯5</b>', play: true},
    multi: {tones: [tone('root','C4'), tone('third','E4'), altered('fifth','G#4','♯5'), tone('seventh','Bb4'), altered('ninth','Db5','♭9')], staffSymbols: [sym('C', '7(♯5, ♭9)')], caption: '从小到大，用逗号分开', play: true},
    alt: {tones: [tone('root','G3'), tone('third','B3'), tone('seventh','F4'), altered('ninth','Ab4','♭9'), altered('thirteenth','Eb5','♭13')], staffSymbols: [sym('G', '7alt')], caption: '变化音不具体限定：alt', play: true},
    // ♯5 与 ♭13：同一个琴键，不同的写法
    sharp5VsFlat13: {tones: [...[['C4','root'], ['E4','third'], ['G#4','fifth'], ['Bb4','seventh']].map(([k, r]) => tone('a-' + r, k, r === 'fifth' ? COLOR.ext : COLOR.ink, r === 'fifth' ? '♯5' : '', PAIR[0])),
      ...[['C4','root'], ['E4','third'], ['G4','fifth'], ['Bb4','seventh'], ['Ab5','thirteenth']].map(([k, r]) => tone(r, k, r === 'thirteenth' ? COLOR.ext : COLOR.ink, r === 'thirteenth' ? '♭13' : '', PAIR[1]))],
      staffSymbols: [sym('C', '7(♯5)', PAIR[0], {size: 15}), sym('C', '7(♭13)', PAIR[1], {size: 15})], caption: '左：没有五音，写在五音位置 → ♯5　右：已有五音 → ♭13'},
    e7: {tones: [tone('root','E4'), tone('third','G#4'), tone('seventh','D5'), altered('thirteenth','C6','♭13')], staffSymbols: [sym('E', '7(♭13)')], caption: 'C 是 E 的小十三度：E7(♭13)'},
    plain: notes => ({tones: notes.map((k, i) => tone('q' + i, k))})
  };

  const {steps, sections, section, group, quiz, accent, p, warn, TF} = ChordLesson.builder();

  // 一、什么是和弦变音
  section('what', '一', '什么是和弦变音');
  group('what', [
    [p(`为了配合更多音阶、得到更多色彩和张力，和弦里的${accent('五音与延伸音')}可以升高或降低半音。`), SCENE.c7],
    [p(`这种升降变化，称为<strong>和弦变音（Alterations）</strong>。`), SCENE.flat9]
  ]);
  group('kinds', [
    [p(`变化音分两类：${accent('结构音变音')}（♭5、♯5）与${accent('延伸音变音')}（♭9、♯9、♯11、♭13）。`), {panel: PANEL.kinds('')}],
    [p(`对照第三课的默认音程：9 是 M9，♭9、♯9 就是 m9、A9；11 是 P11，♯11 是 A11；13 是 M13，♭13 是 m13。`), {panel: PANEL.kinds('')}]
  ]);
  quiz('kinds', {panel: PANEL.kinds('')}, {
    question: '下面哪一个不是常见的和弦变音？',
    options: [['b9','♭9'], ['b11','♭11'], ['s11','♯11']], answer: 'b11',
    right: '正确。11 只会升高（♯11）；降低的 11 和三音同音，不作为变化音。',
    wrong: '对照变化音的表：11 是升还是降？'
  });

  // 二、变音的标记
  section('symbols', '二', '变音的标记');
  group('symbols', [
    [p(`变音记号写在对应数字的${accent('左边')}，并用${accent('括号')}括起来，避免和后缀混淆：C7(♭9)。`), SCENE.flat9],
    [p(`五音的变化也一样：C7(♯5)。`), SCENE.sharp5],
    [p(`一个和弦同时有几个变化音时，${accent('从小到大')}排列，用逗号分开：C7(♯5, ♭9)、C7(♯5, ♭9, ♯9)。也可以上下对齐叠写。`), SCENE.multi],
    [p(`也可以用 +、− 代替 ♯、♭，但容易和增三和弦、小三和弦混淆，${accent('现在已经少见')}。`), {panel: PANEL.symbols([['C', '7(+5)'], ['C', '7(−9)']])}]
  ]);
  quiz('order', {panel: PANEL.symbols([['C', '7(♭9, ♯5)'], ['C', '7(♯5, ♭9)']])}, {
    question: '同时有 ♯5 和 ♭9 时，规范的写法是：',
    options: [['a','C7(♭9, ♯5)'], ['b','C7(♯5, ♭9)']], answer: 'b',
    right: '正确。变化音从小到大排列：5 在 9 前面。',
    wrong: '变化音按数字从小到大排列。'
  });
  quiz('c7b9', {panel: PANEL.symbol('C', '7(♭9)')}, {
    question: 'C7(♭9) 的组成音是：',
    options: [['right','C–E–G–B♭–D♭'], ['m9','C–E–G–B–D♭'], ['nat','C–E–G–B♭–D']], answer: 'right',
    right: '正确。C7（C–E–G–B♭）加上降低的九音 D♭。',
    wrong: '先写出 C7，再把九音 D 降半音。'
  });

  // 三、Altered Chord
  section('alt', '三', '属变和弦（alt）');
  group('alt', [
    [p(`变化音和弦里有一种特殊形式：<strong>属变和弦（Altered Chord）</strong>，用 ${accent('alt')} 标记。`), SCENE.alt],
    [p(`它的变化音${accent('不具体限定')}，演奏者可以自由选择 ♭9、♯9、♯11、♭13 等，常出现在即兴性强的片段。`), SCENE.alt]
  ]);
  quiz('alt', {panel: PANEL.symbol('G', '7alt')}, {
    question: 'G7alt 规定了具体要用哪几个变化音。',
    options: TF, answer: 'false',
    right: '正确，这句话是错的。alt 只说明这是带变化音的属七和弦，具体用哪些变化音由演奏者决定。',
    wrong: 'alt 和 G7(♭9) 这样的写法有什么不同？'
  });

  // 四、等音与写法的选择
  section('enharmonic', '四', '等音与写法的选择');
  group('pairs', [
    [p(`「♯5 与 ♭13」「♭5 与 ♯11」是变化音中的${accent('两对等音')}：可能弹同一个琴键，但写法不同。`), SCENE.sharp5VsFlat13],
    [p(`没有纯五度、变化音又写在${accent('五音的位置')}时，记作 ♯5 或 ♭5。`), SCENE.sharp5VsFlat13],
    [p(`和弦里${accent('已经有五音')}、变化音属于延伸音位置时，记作 ♭13 或 ♯11。`), SCENE.sharp5VsFlat13],
    [p(`所以 C7(♯5) 与 C7(♭13)、C7(♭5) 与 C7(♯11)，${accent('不一定')}表示同一个和弦结构。`), SCENE.sharp5VsFlat13]
  ]);
  group('spelling', [
    [p(`实际乐谱为了好读，常做等音替代；但写记号时，应优先根据${accent('音级')}（拼写）判断，而不是只看音高。`), SCENE.e7],
    [warn(`被变化的延伸音${accent('不能做最高延伸音')}：C13(♭13)、C9(♯9) 都是不合逻辑的写法。`), {panel: PANEL.symbols([['C', '13(♭13)'], ['C', '9(♯9)']])}]
  ]);
  quiz('b13', SCENE.plain(['C4', 'E4', 'G4', 'Bb4', 'Ab5']), {
    question: '谱例中已经有五音 G，上方的 A♭ 应该记作：',
    options: [['s5','♯5'], ['b13','♭13'], ['b6','♭6']], answer: 'b13',
    right: '正确。已经有纯五度，A♭ 属于延伸音位置：C7(♭13)。',
    wrong: '和弦里已经有五音了吗？',
    reveal: [sym('C', '7(♭13)')]
  });
  quiz('c9s9', {panel: PANEL.symbol('C', '9(♯9)')}, {
    question: 'C9(♯9) 是一个合理的和弦记号。',
    options: TF, answer: 'false',
    right: '正确，这句话是错的。9 写在主体里表示自然的九音，括号里又把它升高，自相矛盾；应写作 C7(♯9)。',
    wrong: '被变化的延伸音能不能同时做最高延伸音？'
  });

  ChordLesson.run({
    steps, sections,
    preload: ['C4','E4','G4','Bb4','Db5','G#4','D#5','G3','B3','F4','Ab4','Eb5','Ab5','D5','C6','G#4']
  });
})();
