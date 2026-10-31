/* 和弦记号 · 第一课：三和弦
   文字依据 docs/chord-theory/lesson01-v2.md，按 MT01/02 的节奏一步一句。
   首页按小节列出目录（导论、一 … 九），点击进入对应小节；未完成的小节显示「建设中」。
   讲解区：<strong> = 音乐术语；accent() = 重点词；warn() = 「注意」。
   演示区：所有谱例共用一个舞台，步骤之间用“神奇移动”过渡。规则见 docs/interactive-theory-lesson-standard.md。 */
(() => {
  'use strict';
  const {COLOR, chordSymbol: cs, CENTER, PAIR} = ChordStage;

  /* ---------- 谱例资料 ---------- */
  const QUALITY = {
    major: {name: '大三和弦', short: '大三', suffix: '', keys: ['C4','E4','G4'], third: ['M3','大三度'], fifth: ['P5','纯五度']},
    minor: {name: '小三和弦', short: '小三', suffix: 'm', keys: ['C4','Eb4','G4'], third: ['m3','小三度'], fifth: ['P5','纯五度']},
    aug:   {name: '增三和弦', short: '增三', suffix: 'aug', keys: ['C4','E4','G#4'], third: ['M3','大三度'], fifth: ['A5','增五度']},
    dim:   {name: '减三和弦', short: '减三', suffix: 'dim', keys: ['C4','Eb4','Gb4'], third: ['m3','小三度'], fifth: ['d5','减五度']}
  };
  const tone = (id, key, color = COLOR.ink, label = '', labelColor = '') => ({id, key, color, label, labelColor});
  // 三个和弦音的 id 固定为 root / third / fifth，场景切换时据此追踪同一个音。
  const plain = q => QUALITY[q].keys.map((k, i) => tone(['root','third','fifth'][i], k));
  const withIntervals = q => {
    const [r, t, f] = QUALITY[q].keys;
    return [tone('root', r, COLOR.root, '1'), tone('third', t, COLOR.third, QUALITY[q].third[0]), tone('fifth', f, COLOR.fifth, QUALITY[q].fifth[0])];
  };
  const STACK = {major: ['m3','小三度'], minor: ['M3','大三度'], aug: ['M3','大三度'], dim: ['m3','小三度']}; // 三音到五音
  const relationCaption = q => `根→三 <b class="c-third">${QUALITY[q].third[0]}</b>　三→五 <b>${STACK[q][0]}</b>　根→五 <b class="c-fifth">${QUALITY[q].fifth[0]}</b>`;
  const intervalCaption = q => `<b class="c-third">${QUALITY[q].third[0]}</b> ${QUALITY[q].third[1]} ＋ <b class="c-fifth">${QUALITY[q].fifth[0]}</b> ${QUALITY[q].fifth[1]}`;
  const names = keys => keys.map(ChordStage.pretty).join('–');
  const sym = (root, suffix = '', slot = ChordStage.CENTER) => ({slot, root, suffix});
  // 第 1 页的记号：故意打乱，含数字、七和弦、挂留和弦、变化音和弦
  const CLOUD = [['G','7'], ['C',''], ['F','maj7'], ['D','m9'], ['E','7(♭9)'], ['A','m'], ['C','13'], ['G','sus4'], ['B♭','6'], ['F♯','m7(♭5)']];
  // 第 2 页的四个例子：[根音, 后缀, 组成音]
  const EXAMPLES = [['C', '', ['C4','E4','G4']], ['E', '7(♭9)', ['E4','G#4','B4','D5','F5']], ['G', 'sus4', ['G4','C5','D5']], ['A', 'm7', ['A4','C5','E5','G5']]];
  const overview = () => Object.keys(QUALITY).flatMap((q, slot) => plain(q).map(t => ({...t, id: q === 'major' ? t.id : `${q}-${t.id}`, slot})));

  /* ---------- 场景 ---------- */
  const SCENE = {
    // 四种三和弦并列（slot 0–3）。大三和弦沿用 root / third / fifth，之后可以直接滑回正中。
    // 第 1 页：只有记号，不出现谱表
    introCloud: {panel: {key: 'cloud', html: `<div class="symbol-cloud">${CLOUD.map(([r, x]) => cs(r, x)).join('')}</div>`}},
    // 第 2 页起：每个记号都对应一组和弦音（记号对齐各自和弦的符头）
    introExamples: {tones: EXAMPLES.flatMap(([, , keys], slot) => keys.map((key, j) => ({...tone(slot ? `ex${slot}-${j}` : ['root','third','fifth'][j], key), slot}))),
      staffSymbols: EXAMPLES.map(([root, suffix], slot) => ({slot, root, suffix, size: 15}))},
    introSingle: {staffSymbols: [sym('C')], tones: plain('major')},
    // 同一个 C 的各种排列：低音都是 C。四个和弦共用一个记号，标在第一个和弦上方。
    introVoicings: {staffSymbols: [sym('C', '', 0)], caption: '同一个 C · 各种八度与排列', tones: [
      ...plain('major').map(t => ({...t, slot: 0})),
      ...[['C4','G4','E5'], ['C4','E4','G4','C5'], ['C4','G4','C5','E5']].flatMap((keys, i) => keys.map((key, j) => ({...tone(`v${i + 1}-${j}`, key), slot: i + 1})))
    ]},
    // 同一和弦的几种写法：上下叠放在和弦上方
    spellings: {staffSymbols: [{slot: CENTER, stack: [['C','m'], ['C','min'], ['C','−']]}], tones: plain('minor'), caption: '三种写法 · 同一组音 C–E♭–G'},
    build: [
      {tones: [], caption: ''},
      {tones: [tone('root','C4')], caption: 'C', play: true},
      {tones: [tone('root','C4'), tone('third','E4')], caption: 'C → E　向上叠一个三度', play: true},
      {tones: plain('major'), caption: 'C → E → G　再叠一个三度', play: true}
    ],
    roleRoot: {tones: [tone('root','C4',COLOR.root,'Root'), tone('third','E4',COLOR.faint), tone('fifth','G4',COLOR.faint)], caption: '<span class="c-root">根音 Root</span>'},
    roleThird: {tones: [tone('root','C4',COLOR.root,'Root'), tone('third','E4',COLOR.third,'3rd'), tone('fifth','G4',COLOR.faint)], caption: '<span class="c-third">三音 3rd</span>：根音上方三度'},
    roleFifth: {tones: [tone('root','C4',COLOR.root,'Root'), tone('third','E4',COLOR.third,'3rd'), tone('fifth','G4',COLOR.fifth,'5th')], caption: '<span class="c-fifth">五音 5th</span>：根音上方五度'},
    roleDegrees: {tones: [tone('root','C4',COLOR.root,'Root'), tone('third','E5',COLOR.third,'3rd'), tone('fifth','G4',COLOR.fifth,'5th')], caption: 'C → E：<b>三度</b>　C → G：<b>五度</b>'},
    rootOnly: {tones: [tone('root','C4',COLOR.root,'Root'), tone('third','E4',COLOR.third,'3rd'), tone('fifth','G4',COLOR.fifth,'5th')], caption: '<span class="c-root">根音 C</span>'},
    bassIsRoot: {tones: [tone('root','C4',COLOR.bass,'Root',COLOR.root), tone('third','E4',COLOR.third,'3rd'), tone('fifth','G4',COLOR.fifth,'5th')], caption: '<span class="c-root">根音 C</span>　<span class="c-bass">低音 C</span>'},
    rootMovedUp: {tones: [tone('third','E4',COLOR.bass,'3rd',COLOR.third), tone('fifth','G4',COLOR.fifth,'5th'), tone('root','C5',COLOR.root,'Root')], caption: '<span class="c-root">根音 C</span>　<span class="c-bass">低音 E</span>', play: true},
    quizInverted: {tones: [tone('third','E4'), tone('fifth','G4'), tone('root','C5')]},
    quality: q => ({staffSymbols: [sym('C', QUALITY[q].suffix)], tones: withIntervals(q), caption: intervalCaption(q), play: true}),
    qualityOverview: {tones: overview(), caption: 'C 的四种三和弦'},
    qualityOverviewNamed: {tones: overview(), staffLabels: ['大','小','增','减'].map((text, slot) => ({slot, text})), caption: 'C 的四种三和弦'},
    // 三组音程关系：根→三、三→五、根→五
    relations: q => ({staffSymbols: [sym('C', QUALITY[q].suffix)], tones: withIntervals(q), caption: relationCaption(q)}),
    quizPlain: q => ({tones: plain(q)})
  };
  // 第 26 步的四个按钮
  const qualityControls = Object.entries(QUALITY).map(([id, q]) => [id, q.short]);

  /* ---------- 讲解与 Quiz ---------- */
  const {steps, sections, section, plannedSection, group, quiz, accent, p, warn, instruction, TF} = ChordLesson.builder();

  // 导论 · 认识和弦记号
  section('intro', '导论', '认识和弦记号');
  group('intro-a', [
    [p(`在现代音乐中，我们经常会看到由${accent('英文字母、数字和特殊符号')}组成的标记。`), SCENE.introCloud],
    [p(`这些标记称为<strong>和弦记号（Chord Symbol）</strong>，是一种用简洁符号描述${accent('和弦结构')}的记谱语言。`), SCENE.introExamples],
    [p(`和弦记号广泛应用于${accent('现代音乐')}的演奏、创作与编配，也常见于音乐理论课堂。`), SCENE.introExamples]
  ]);
  group('intro-b', [
    [p(`与五线谱不同，和弦记号通常${accent('不规定')}每个音的具体八度与排列。`), SCENE.introSingle],
    [p(`它只告诉我们：这是${accent('什么和弦')}，以及演奏时必须满足的${accent('基本条件')}。`), SCENE.introVoicings]
  ]);
  group('intro-c', [
    [p(`不同地区、出版社和音乐人，可能用${accent('不同的写法')}表示同一个和弦。`), SCENE.spellings],
    [p(`本课程主要介绍现代音乐中${accent('较常见')}的写法。`), SCENE.spellings]
  ]);
  group('intro-d', [
    [p(`学习和弦记号，重点不是背符号，而是理解它们${accent('怎样描述和弦结构')}。`), SCENE.spellings],
    [p(`掌握规律后，即使遇到${accent('没学过')}的记号，也能推导出它的含义。`), SCENE.spellings]
  ]);
  quiz('intro', SCENE.introVoicings, {
    question: '和弦记号通常会规定每个音的具体八度与排列。',
    options: TF, answer: 'false',
    right: '正确，这句话是错的。和弦记号说明这是什么和弦；具体的八度与排列，通常由演奏者自己决定。',
    wrong: '回想演示区：记号一直是 C，谱例里的音却换了不同的八度与排列。'
  });

  // 一、三和弦的基本构成
  section('triad', '一', '三和弦的基本构成');
  group('triad', [
    [p(`<strong>三和弦（Triad）</strong>是由${accent('三个音')}按照${accent('三度关系')}叠置而成的和弦。`), SCENE.build, {sequence: 800}],
    [p(`最下面作为基础的音，称为<strong>根音（Root）</strong>。`), SCENE.roleRoot],
    [p(`根音上方三度的音，称为<strong>三音（Third）</strong>。`), SCENE.roleThird],
    [p(`根音上方五度的音，称为<strong>五音（Fifth）</strong>。`), SCENE.roleFifth],
    [p(`三音与五音的名称，来自它们${accent('相对于根音的音程度数')}，而不是实际演奏时的排列顺序。`), SCENE.roleDegrees]
  ]);
  quiz('fifth', SCENE.roleDegrees, {
    question: '三和弦中的「五音」，指的是：',
    options: [['position','排在第五个位置的音'], ['degree','根音上方五度的音'], ['top','和弦里最高的音']], answer: 'degree',
    right: '正确。五音的名称来自它与根音之间的音程度数：C 到 G 是五度。',
    wrong: '三和弦只有三个音，「五」说的不是位置。再看看演示区下方的提示。'
  });
  group('root-bass', [
    [p(`<strong>根音</strong>是和弦三度叠置的${accent('起点')}，与它在哪个八度无关。`), SCENE.rootOnly],
    [p(`<strong>低音</strong>则是实际排列中${accent('音高最低')}的音。`), SCENE.bassIsRoot],
    [p(`低音并${accent('不永远')}都是根音。`), SCENE.rootMovedUp],
    [p(`和弦的排列变化可能会改变${accent('低音')}，但不会改变${accent('根音')}。`), SCENE.rootMovedUp]
  ]);
  quiz('root', SCENE.quizInverted, {
    question: '谱例中和弦的根音是：',
    options: [['C','C'], ['E','E'], ['G','G']], answer: 'C',
    right: '正确。把这三个音三度叠置，是 C–E–G，所以根音是 C；E 只是低音。',
    wrong: '低音不一定是根音。试着把这三个音重新三度叠置。'
  });

  // 二、三和弦的四种基本性质
  section('quality', '二', '三和弦的四种基本性质');
  group('quality', [
    [p(`三和弦的<strong>性质（Chord Quality）</strong>，由根音到三音、五音的${accent('音程性质')}决定。`), SCENE.qualityOverview],
    [p(`三和弦有四种基本性质：${accent('大、小、增、减')}。`), SCENE.qualityOverviewNamed],
    [p(`<strong>大三和弦（Major Triad）</strong>：根音到三音为${accent('大三度（M3）')}，到五音为${accent('纯五度（P5）')}。`), SCENE.quality('major')],
    [p(`<strong>小三和弦（Minor Triad）</strong>：根音到三音为${accent('小三度（m3）')}，到五音为纯五度（P5）。`), SCENE.quality('minor')],
    [p(`<strong>增三和弦（Augmented Triad）</strong>：根音到三音为大三度（M3），到五音为${accent('增五度（A5）')}。`), SCENE.quality('aug')],
    [p(`<strong>减三和弦（Diminished Triad）</strong>：根音到三音为${accent('小三度（m3）')}，到五音为${accent('减五度（d5）')}。`), SCENE.quality('dim')]
  ]);
  group('relations', [
    [p(`一个三和弦里，其实有${accent('三组')}音程关系：根音到三音、三音到五音、根音到五音。`), SCENE.relations('dim')],
    [p(`任意${accent('两组')}确定后，第三组也随之确定；所以掌握两组就能判断性质。`), SCENE.relations('dim')],
    [p(`本课用「根→三」「根→五」描述性质；也可以用「根→三」「三→五」来记，例如大三和弦＝${accent('大三度叠小三度')}。`), SCENE.relations('major')],
    [p(`用其中一种方法，就能从根音和性质${accent('推导')}出三音与五音——第四节会详细练习。`) + instruction('点击演示区的按钮，比较四种三和弦。'), {...SCENE.relations('major'), controls: qualityControls, pressed: 'major'}]
  ]);
  quiz('minor', SCENE.quizPlain('minor'), {
    question: '谱例中的和弦是：',
    options: Object.entries(QUALITY).map(([id, q]) => [id, q.name]), answer: 'minor',
    right: '正确。C 到 E♭ 是小三度（m3），C 到 G 是纯五度（P5），所以是小三和弦。',
    wrong: '分别从根音 C 出发，看到三音、到五音各是什么音程。'
  });
  quiz('aug', SCENE.quizPlain('aug'), {
    question: '谱例中，根音到五音的音程是：',
    options: [['P5','纯五度（P5）'], ['A5','增五度（A5）'], ['d5','减五度（d5）']], answer: 'A5',
    right: '正确。C 到 G♯ 比纯五度多一个半音，是增五度，所以这是增三和弦。',
    wrong: '注意五音上的升降记号：G♯ 比 G 高半音。'
  });
  quiz('dim', SCENE.quizPlain('dim'), {
    question: '减三和弦由小三度（m3）和纯五度（P5）构成。',
    options: TF, answer: 'false',
    right: '正确，这句话是错的。小三度＋纯五度是小三和弦；减三和弦是小三度（m3）＋减五度（d5），也可以记作两个小三度叠置。',
    wrong: '回想四种三和弦的音程结构，或者看看谱例：C 到 G♭ 还是纯五度吗？'
  });
  quiz('rule', SCENE.relations('major'), {
    question: '只知道「根音到三音」和「三音到五音」的音程，也能判断三和弦的性质。',
    options: TF, answer: 'true',
    right: '正确。三组音程关系中，任意两组确定了，第三组也就确定了。',
    wrong: '回想本节内容：一个三和弦有几组音程关系？需要掌握几组？'
  });

  /* ---------- 三、四节：谱例资料 ---------- */
  const MARK = {
    major: {name: '大三和弦', en: 'Major', abbr: 'maj', sign: '△', keys: ['C4','E4','G4']},
    minor: {name: '小三和弦', en: 'Minor', abbr: 'min', sign: '−', keys: ['C4','Eb4','G4']},
    aug:   {name: '增三和弦', en: 'Augmented', abbr: 'aug', sign: '+', keys: ['C4','E4','G#4']},
    dim:   {name: '减三和弦', en: 'Diminished', abbr: 'dim', sign: '°', keys: ['C4','Eb4','Gb4']}
  };
  const tone2 = (id, key, color = COLOR.ink, label = '', slot = CENTER) => ({id, key, color, label, slot});
  // 和弦音 id：同一位置的根音、三音、五音分别为 root / third / fifth（slot 2 的加前缀 b-）
  const chord2 = (q, slot = CENTER, prefix = '') => MARK[q].keys.map((k, i) => tone2(prefix + ['root','third','fifth'][i], k, COLOR.ink, '', slot));
  const sym2 = (root, suffix = '', slot = CENTER, extra = {}) => ({slot, root, suffix, ...extra});
  const WIDE = [0.6, 2.4]; // 带多个变音记号的两个和弦
  // 同一和弦的几种写法：上下叠放（第一种在最上面）
  const stack2 = (...list) => ({slot: CENTER, stack: list});

  /* ---------- 三、四节：面板（不需要谱表的步骤） ---------- */
  const PANEL2 = {
    split: state => ({key: 'split', state, html:
      '<div class="symbol-split" role="img" aria-label="Cm：C 为根音，m 为后缀">' +
      '<div class="symbol-part part-root"><span class="symbol-glyph">C</span><span class="symbol-role">根音</span></div>' +
      '<div class="symbol-part" aria-hidden="true"><span class="symbol-plus">+</span><span class="symbol-role">&nbsp;</span></div>' +
      '<div class="symbol-part part-suffix"><span class="symbol-glyph">m</span><span class="symbol-role">后缀（和弦性质）</span></div></div>'}),
    letters: {key: 'letters', html: '<p class="symbol-row" aria-label="七个基本音名">C D E F G A B</p>'},
    rootAccidentals: {key: 'root-acc', html: `<p class="symbol-row">${cs('F♯')}${cs('B♭')}${cs('E♭')}</p>`},
    words: {key: 'words', html: '<div class="word-list">' +
      Object.values(MARK).map(q => `<p><b>${q.en.slice(0, 3)}</b>${q.en.slice(3)}<span class="arrow">→</span><b>${q.abbr}</b></p>`).join('') + '</div>'},
    // 对照表；state = 'minor' 时只突出小三和弦一行，其余变暗
    fullTable: state => ({key: 'full', state, html:
      '<div class="compare-table" role="table" aria-label="四种三和弦的常见记号">' +
      '<div class="compare-row compare-head" role="row"><span role="columnheader">和弦性质</span><span role="columnheader">英文缩写</span><span role="columnheader">专属符号</span></div>' +
      [['major', '大三和弦', cs('C','M') + ' ' + cs('C','maj'), cs('C','△')],
       ['minor', '小三和弦', cs('C','m') + ' ' + cs('C','min'), cs('C','−')],
       ['aug', '增三和弦', cs('C','aug'), cs('C','+')],
       ['dim', '减三和弦', cs('C','dim'), cs('C','°')]]
        .map(([q, ...cells]) => `<div class="compare-row" data-row="${q}" role="row">${cells.map(c => `<span role="cell">${c}</span>`).join('')}</div>`).join('') + '</div>'}),
    symbol: (root, suffix) => ({key: `symbol-${root}${suffix}`, html: `<p class="symbol-row big">${cs(root, suffix)}</p>`})
  };

  /* ---------- 三、四节：场景 ---------- */
  const SCENE2 = {
    // 英文缩写：和弦居中，记号在上方变化
    majorNames: {tones: chord2('major'), staffSymbols: [stack2(['C','M'], ['C','maj'])], play: true},
    majorPlain: {tones: chord2('major'), staffSymbols: [sym2('C')], caption: '单独的 <b class="c-root">C</b> = C 大三和弦'},
    minorNames: {tones: chord2('minor'), staffSymbols: [stack2(['C','m'], ['C','min'])], play: true},
    aug: {tones: chord2('aug'), staffSymbols: [sym2('C','aug')], play: true},
    dim: {tones: chord2('dim'), staffSymbols: [sym2('C','dim')], play: true},
    caseMatters: {tones: [...chord2('major', PAIR[0]), ...chord2('minor', PAIR[1], 'b-')], staffSymbols: [sym2('C','M', PAIR[0]), sym2('C','m', PAIR[1])], caption: '<b>M</b> = Major　<b>m</b> = Minor'},
    // 专属符号
    signs: {tones: Object.keys(MARK).flatMap((q, slot) => chord2(q, slot, slot ? `${q}-` : '')),
      staffSymbols: Object.values(MARK).map((q, slot) => sym2('C', q.sign, slot, {size: 17}))},
    signsNamed: {tones: Object.keys(MARK).flatMap((q, slot) => chord2(q, slot, slot ? `${q}-` : '')),
      staffSymbols: Object.values(MARK).map((q, slot) => sym2('C', q.sign, slot, {size: 17})),
      staffLabels: ['大','小','增','减'].map((text, slot) => ({slot, text}))},
    sign: q => ({tones: chord2(q), staffSymbols: [sym2('C', MARK[q].sign)], play: true}),
    // 左：C△7（C–E–G–B），右：普通的 C。上一步居中的 C 和弦滑到右边。
    triangleRare: {tones: [...chord2('major', PAIR[0], 'b-'), tone2('b-seventh','B4',COLOR.ink,'',PAIR[0]), ...chord2('major', PAIR[1])],
      staffSymbols: [sym2('C','△7', PAIR[0]), sym2('C','', PAIR[1])]},
    minusVsDim: highlight => ({
      tones: [...chord2('minor', PAIR[0]), ...chord2('dim', PAIR[1], 'b-')].map(t => highlight && /fifth$/.test(t.id) ? {...t, color: COLOR.fifth} : t),
      staffSymbols: [sym2('C','−', PAIR[0]), sym2('C','°', PAIR[1])],
      caption: highlight ? '<b class="c-fifth">G</b> 与 <b class="c-fifth">G♭</b>：五音不同' : ''
    }),
    spellings: {tones: chord2('minor'), staffSymbols: [stack2(['C','m'], ['C','min'], ['C','−'])], caption: '三种写法 · 同一组音 C–E♭–G'},
    quizDim: {tones: chord2('dim')},
    // 推导 F♯m
    derive: count => ({
      tones: [tone2('root','F#4',COLOR.root,'1'), tone2('third','A4',COLOR.third,'m3'), tone2('fifth','C#5',COLOR.fifth,'P5')].slice(0, count === 2 ? 1 : count), // 第二步只解释后缀，三音还不出现
      staffSymbols: [sym2('F♯','m', CENTER)],
      caption: ['识别根音、后缀，再构建三音与五音', '<b class="c-root">根音 F♯</b>', '<b class="c-third">m</b>：小三和弦 → m3 ＋ P5', 'F♯–A–C♯'][count],
      play: count > 0
    }),
    // 规范拼写
    fSharpMajor: {tones: [tone2('root','F#4'), tone2('third','A#4'), tone2('fifth','C#5')], staffSymbols: [sym2('F♯')], play: true},
    spellingCompare: {
      // 三个变音记号要占三列：两个和弦分开放，左边的离谱号远一些
      tones: [tone2('root','F#4',COLOR.ink,'',WIDE[0]), tone2('third','A#4',COLOR.ink,'',WIDE[0]), tone2('fifth','C#5',COLOR.ink,'',WIDE[0]),
        tone2('b-root','F#4',COLOR.faint,'',WIDE[1]), tone2('b-third','Bb4',COLOR.faint,'',WIDE[1]), tone2('b-fifth','Db5',COLOR.faint,'',WIDE[1])],
      staffSymbols: [sym2('F♯','',WIDE[0]), {slot: WIDE[1], text: '✗', color: '#b91c1c'}],
      caption: '左：F♯–A♯–C♯ ✓　右：F♯–B♭–D♭ ✗'
    }
  };


  // 三、三和弦的标记规则
  section('symbols', '三', '三和弦的标记规则');
  group('structure', [
    [p(`三和弦的基本标记结构是：<strong>根音</strong>＋<strong>后缀</strong>。`), {panel: PANEL2.split('')}],
    [p(`后缀用于说明和弦的${accent('性质')}。`), {panel: PANEL2.split('suffix')}]
  ]);
  group('root', [
    [p(`根音使用${accent('大写英文字母')}表示，对应七个基本音名。`), {panel: PANEL2.letters}],
    [p(`如果根音带有升降记号，应将升降记号写在字母${accent('之后')}。`), {panel: PANEL2.rootAccidentals}]
  ]);
  quiz('root-spelling', {panel: PANEL2.rootAccidentals}, {
    question: '下面哪一个是规范的根音写法？',
    options: [['before','♯F'], ['after','F♯'], ['lower','f♯']], answer: 'after',
    right: '正确。根音用大写字母，升降记号写在字母之后：F♯。',
    wrong: '回想两条规则：字母要大写；升降记号写在字母的哪一边？'
  });
  group('abbr', [
    [p(`<strong>大三和弦（Major）</strong>用 ${accent('M')} 或 ${accent('maj')} 表示，例如 CM、Cmaj。`), SCENE2.majorNames],
    [p(`但实际上，大三和弦更常见的是${accent('完全省略后缀')}，只用一个根音的音名表示。`), SCENE2.majorPlain],
    [p(`<strong>小三和弦（Minor）</strong>用 ${accent('m')} 或 ${accent('min')} 表示，例如 Cm、Cmin。`), SCENE2.minorNames],
    [p(`<strong>增三和弦（Augmented）</strong>用 ${accent('aug')} 表示，例如 Caug。`), SCENE2.aug],
    [p(`<strong>减三和弦（Diminished）</strong>用 ${accent('dim')} 表示，例如 Cdim。`), SCENE2.dim]
  ]);
  group('abbr-origin', [
    [p(`这些缩写取自英文名称的${accent('前三个字母')}。`), {panel: PANEL2.words}],
    [warn(`大写 M 与小写 m 分别表示 Major 与 Minor，大小写${accent('不能混淆')}。`), SCENE2.caseMatters]
  ]);
  quiz('cm', {panel: PANEL2.symbol('C', 'm')}, {
    question: 'Cm 表示的是：',
    options: [['major','C 大三和弦'], ['minor','C 小三和弦'], ['dim','C 减三和弦']], answer: 'minor',
    right: '正确。小写 m 是 Minor 的缩写，Cm 是 C 小三和弦。',
    wrong: '注意 m 是小写。小写 m 对应哪个英语单词？'
  });
  quiz('plain', {panel: PANEL2.symbol('G', '')}, {
    question: '单独写一个 G，表示的是：',
    options: [['major','G 大三和弦'], ['note','只弹 G 一个音'], ['minor','G 小三和弦']], answer: 'major',
    right: '正确。大三和弦通常省略后缀，单独写一个 G，就是 G 大三和弦。',
    wrong: '回想大三和弦的写法：后缀常常被省略。'
  });
  group('signs', [
    [p(`除了英文缩写，四种三和弦的性质还有一套<strong>专属符号</strong>可以表示。`), SCENE2.signsNamed],
    [p(`大三和弦用三角形 ${accent('△')} 表示，例如 C△。`), SCENE2.sign('major')],
    [p(`实际上，△ 在三和弦标记里${accent('用得不多')}，更多是用来标记七和弦或更复杂的「大和弦」。`), SCENE2.triangleRare],
    [p(`小三和弦用减号 ${accent('−')} 表示，例如 C−。`), SCENE2.sign('minor')],
    [p(`增三和弦用加号 ${accent('+')} 表示，例如 C+。`), SCENE2.sign('aug')],
    [p(`减三和弦用小圆圈 ${accent('°')} 表示，例如 C°。`), SCENE2.sign('dim')]
  ]);
  group('sign-caution', [
    [p(`这些符号是约定俗成的，${accent('不要')}按数学符号去理解。`), SCENE2.minusVsDim(false)],
    [warn(`「−」表示${accent('小')}三和弦，而不是减三和弦；减三和弦用「°」。`), SCENE2.minusVsDim(true)]
  ]);
  quiz('minus', {panel: PANEL2.symbol('C', '−')}, {
    question: 'C− 的和弦音是：',
    options: [['minor','C–E♭–G'], ['dim','C–E♭–G♭'], ['major','C–E–G']], answer: 'minor',
    right: '正确。「−」表示小三和弦，C− 就是 Cm：C–E♭–G。',
    wrong: '「−」看起来像减号，但它表示的不是减三和弦。'
  });
  quiz('circle', SCENE2.quizDim, {
    question: '谱例中的和弦，可以用哪个专属符号表示？',
    options: [['minus','C−'], ['circle','C°'], ['plus','C+']], answer: 'circle',
    right: '正确。C–E♭–G♭ 是减三和弦，专属符号是小圆圈：C°。',
    wrong: '先判断谱例的性质：C 到 G♭ 是什么五度？'
  });
  group('compare', [
    [p(`现在，我们把四种三和弦的常见记号${accent('整理在一起')}。`), {panel: PANEL2.fullTable('')}],
    [p(`同一个和弦可以有${accent('多种写法')}：Cm、Cmin、C− 都是 C 小三和弦。`), {panel: PANEL2.fullTable('minor')}]
  ]);
  quiz('same', SCENE2.spellings, {
    question: 'Cmin 和 C− 表示的是同一个和弦。',
    options: TF, answer: 'true',
    right: '正确。两种写法都表示 C 小三和弦：C–E♭–G。',
    wrong: '一个是英文缩写，一个是专属符号，它们表示的是哪种性质？'
  });

  // 四、根据和弦记号推导和弦音
  section('derive', '四', '根据和弦记号推导和弦音');
  group('derive', [
    [p(`根据和弦记号，可以分${accent('三步')}推导出和弦音。`), SCENE2.derive(0)],
    [p(`第一步：识别<strong>根音</strong>。`), SCENE2.derive(1)],
    [p(`第二步：识别<strong>后缀</strong>，确定和弦性质。`), SCENE2.derive(2)],
    [p(`第三步：按性质，在根音上方构建${accent('三音')}与${accent('五音')}。`), [SCENE2.derive(2), {...SCENE2.derive(3), tones: SCENE2.derive(3).tones.slice(0, 2), caption: 'F♯ → A　小三度（m3）'}, SCENE2.derive(3)], {sequence: 900}]
  ]);
  group('spelling', [
    [p(`记谱时，和弦的音要严格按照${accent('三度')}来拼写。`), SCENE2.fSharpMajor],
    [p(`例如 F♯ 大三和弦是 F♯–A♯–C♯；F♯–B♭–D♭ 听起来一样，却${accent('不是')}三度叠置。`), SCENE2.spellingCompare]
  ]);
  quiz('dm', {panel: PANEL2.symbol('D', 'm')}, {
    question: 'Dm 的和弦音是：',
    options: [['right','D–F–A'], ['major','D–F♯–A'], ['dim','D–F–A♭']], answer: 'right',
    right: '正确。D 到 F 是小三度，D 到 A 是纯五度：D–F–A。',
    wrong: '按三个步骤来：根音 D，m 表示小三和弦，再构建 m3 与 P5。'
  });
  quiz('e-spelling', {panel: PANEL2.symbol('E', '')}, {
    question: 'E 大三和弦的规范拼写是：',
    options: [['right','E–G♯–B'], ['enharmonic','E–A♭–B'], ['minor','E–G–B']], answer: 'right',
    right: '正确。E 上方的三度必须是某个 G，大三度是 G♯；A♭ 虽然同音，却是四度。',
    wrong: '三音必须在根音上方三度：E 往上数三个音名，是哪个字母？'
  });
  quiz('bbm', {panel: PANEL2.symbol('B♭', 'm')}, {
    question: 'B♭m 的和弦音是：',
    options: [['right','B♭–D♭–F'], ['enharmonic','B♭–C♯–F'], ['major','B♭–D–F']], answer: 'right',
    right: '正确。B♭ 上方小三度是 D♭（不是 C♯），纯五度是 F：B♭–D♭–F。',
    wrong: '先确定三音的字母（B 往上三度是 D），再看需要什么升降记号。'
  });


  /* ---------- 五至八节：谱例资料与场景 ---------- */
  const tone3 = (id, key, color = COLOR.ink, label = '', slot = CENTER, labelColor = '') => ({id, key, color, label, slot, labelColor});
  const ROW3 = [CENTER - 1.25, CENTER, CENTER + 1.25]; // 三个和弦并列，中间一个在中轴上（间距足够放下 Dm/F 这类记号）
  const INV = {
    root:   {name: '原位', keys: ['C4','E4','G4'], roles: ['root','third','fifth'], bass: ''},
    first:  {name: '第一转位', keys: ['E4','G4','C5'], roles: ['third','fifth','root'], bass: 'E'},
    second: {name: '第二转位', keys: ['G4','C5','E5'], roles: ['fifth','root','third'], bass: 'G'}
  };
  const DEGREE = {root: '1', third: '3', fifth: '5'};
  // 转位：低音用低音色，根音用根音色；标签写 1 / 3 / 5
  const inversion = (kind, slot = CENTER, prefix = '', labels = true) => INV[kind].keys.map((key, i) => {
    const role = INV[kind].roles[i];
    const color = i === 0 ? COLOR.bass : role === 'root' ? COLOR.root : COLOR.ink;
    return tone3(prefix + role, key, labels ? color : COLOR.ink, labels ? DEGREE[role] : '', slot);
  });
  const slashSym = (kind, slot = CENTER) => sym2('C', '', slot, {bass: INV[kind].bass});
  const invCaption = kind => `${INV[kind].name}　<span class="c-root">根音 C</span>　<span class="c-bass">低音 ${INV[kind].keys[0][0]}</span>`;
  const threeInversions = (withSymbols, labels = true) => ({
    tones: [...inversion('root', ROW3[0], 'a-', labels), ...inversion('first', ROW3[1], 'b-', labels), ...inversion('second', ROW3[2], '', labels)],
    staffSymbols: withSymbols ? ['root','first','second'].map((k, i) => slashSym(k, ROW3[i])) : [sym2('C', '', ROW3[0])]
  });
  const dm = [['D4','F4','A4'], ['F4','A4','D5'], ['A4','D5','F5']];
  const DM_TONES = dm.flatMap((keys, i) => keys.map((key, j) => tone3(`dm${i}-${j}`, key, j === 0 ? COLOR.bass : COLOR.ink, '', ROW3[i])));
  const voicingRow = (tag = '') => ({tones: [
    ...[['C4','E4','G4'], ['C4','G4','E5'], ['C4','E4','G4','C5'], ['C4','G4','C5','E5']].flatMap((keys, i) => keys.map((key, j) => tone3(`${tag}v${i}-${j}`, key, j === 0 ? COLOR.bass : COLOR.ink, '', i)))
  ], staffSymbols: [sym2('C', '', 0)]});
  const blockBroken = (nonChord = false) => {
    const broken = nonChord ? ['C4','D4','E4','G4'] : ['C4','E4','G4'];
    const start = PAIR[1] - (broken.length - 1) * .25;
    return {
      tones: [...['C4','E4','G4'].map((key, i) => tone3(`blk${i}`, key, COLOR.ink, '', PAIR[0])),
        ...broken.map((key, i) => tone3(`brk-${key}`, key, key === 'D4' ? COLOR.faint : COLOR.ink, '', start + i * .5))],
      staffSymbols: [sym2('C', '', PAIR[0]), sym2('C', '', start)],
      offsets: [0, 0, 0, ...broken.map((_, i) => 1.2 + i * .45)],
      caption: nonChord ? '<b>D</b> 不属于 C 和弦：和弦外音' : '左：柱式　右：分解',
      play: true
    };
  };
  const PANEL3 = {
    slash: state => ({key: 'slash', state, html:
      '<div class="symbol-split slash-split" role="img" aria-label="C/E：C 为和弦，斜线后的 E 为低音">' +
      '<div class="symbol-part part-root"><span class="symbol-glyph">C</span><span class="symbol-role">和弦</span></div>' +
      '<div class="symbol-part part-slash"><span class="symbol-glyph">/</span><span class="symbol-role">斜线</span></div>' +
      '<div class="symbol-part part-bass"><span class="symbol-glyph">E</span><span class="symbol-role">低音</span></div></div>'}),
    slashSymbol: (root, suffix, bass) => ({key: `slash-${root}${suffix}${bass}`, html: `<p class="symbol-row big">${cs(root, suffix, bass)}</p>`}),
    simplified: {key: 'simplified', html: `<p class="symbol-row big">${cs('G')}<span class="bar">｜</span>${cs('', '', 'B')}</p>`},
  };
  const SCENE3 = {
    rootPosition: {tones: inversion('root'), caption: '原位　<span class="c-root">根音</span>＝<span class="c-bass">低音</span>', play: true},
    rootAndInversions: {tones: threeInversions(false).tones, staffLabels: ['原位', '转位', '转位'].map((text, i) => ({slot: ROW3[i], text}))},
    slashRow: {...threeInversions(true), staffLabels: ['原位', '第一转位', '第二转位'].map((text, i) => ({slot: ROW3[i], text}))},
    rootPlain: {tones: inversion('root'), staffSymbols: [sym2('C')], caption: '原位直接写 <b class="c-root">C</b>，不写 C/C'},
    slashFirst: {tones: inversion('first'), staffSymbols: [slashSym('first')], caption: invCaption('first'), play: true},
    quizFirst: {tones: inversion('first', CENTER, '', false)},
    dmFull: {tones: DM_TONES, staffSymbols: [sym2('D','m',ROW3[0]), sym2('D','m',ROW3[1],{bass: 'F'}), sym2('D','m',ROW3[2],{bass: 'A'})], play: true, offsets: [0,0,0, .9,.9,.9, 1.8,1.8,1.8]},
    dmShort: {tones: DM_TONES, staffSymbols: [sym2('D','m',ROW3[0]), sym2('','',ROW3[1],{bass: 'F'}), sym2('','',ROW3[2],{bass: 'A'})], caption: 'Dm → /F → /A'},
    voicings: {...voicingRow(), caption: '低音都是 C · 记号都是 C'},
    voicingsPlain: voicingRow(),
    doubling: {tones: [tone3('r','C4',COLOR.root,'1'), tone3('t','E4',COLOR.third,'3'), tone3('f','G4',COLOR.fifth,'5'), tone3('r2','C5',COLOR.root,'1')], staffSymbols: [sym2('C')], caption: '根音 C 出现了两次：重复音', play: true},
    omission: {tones: [tone3('r','C4',COLOR.root,'1'), tone3('t','E4',COLOR.third,'3'), tone3('r2','C5',COLOR.root,'1')], staffSymbols: [sym2('C')], caption: '省略五音 G：仍然是 C', play: true},
    block: blockBroken(false),
    nonChord: blockBroken(true),
    bassChanges: {...threeInversions(true), caption: '低音改变 → 记号随之改写'},
    quizVoicing: {tones: [tone3('q0','C4'), tone3('q1','G4'), tone3('q2','E5')]},
    quizBass: {tones: [tone3('q0','E4'), tone3('q1','C5'), tone3('q2','G5')]},
  };
  const slashControls = [['root','C'], ['first','C/E'], ['second','C/G']];

  // 五、三和弦转位与斜线记号（原第五、六节合并）
  section('inversion', '五', '转位与斜线记号');
  group('inversion', [
    [p(`和弦的根音在低音时，称为<strong>原位</strong>。`), SCENE3.rootPosition],
    [p(`和弦的低音变成三音或五音时，称为<strong>转位</strong>。`), SCENE3.rootAndInversions]
  ]);
  group('slash', [
    [p(`转位和弦的低音${accent('不再是根音')}，所以需要用到<strong>斜线和弦记号</strong>。`), {panel: PANEL3.slash('')}],
    [p(`斜线左边写和弦${accent('根音')}，右边写和弦的${accent('低音')}。`), {panel: PANEL3.slash('bass')}],
    [p(`所以，C 和弦的原位和两种转位，可以分别像这样标记。`), SCENE3.slashRow],
    [p(`原位和弦的低音就是根音，所以${accent('不需要')}用斜线区别标记。`), SCENE3.rootPlain],
    [p(`斜线和弦可以读作「根音 on 低音」，比如「C on E」，表示了和弦中两个音的${accent('高低关系')}。`), SCENE3.slashFirst],
    [instruction('点击演示区的记号，比较谱例与低音的变化。'), {...SCENE3.slashFirst, play: false, controls: slashControls, pressed: 'first'}]
  ]);
  quiz('slash-write', SCENE3.quizFirst, {
    question: '谱例中的和弦，用斜线记号写作：',
    options: [['C','C'], ['C/E','C/E'], ['E/C','E/C']], answer: 'C/E',
    right: '正确。根音是 C，低音是 E：C/E。',
    wrong: '斜线前面写和弦（看根音），斜线后面写低音。'
  });
  quiz('slash-bass', {panel: PANEL3.slashSymbol('C', '', 'G')}, {
    question: 'C/G 的低音是：',
    options: [['C','C'], ['E','E'], ['G','G']], answer: 'G',
    right: '正确。斜线后面的音就是低音：G。这是 C 和弦的第二转位。',
    wrong: '斜线后面写的是什么？'
  });
  quiz('slash-root', {panel: PANEL3.slashSymbol('A', 'm', 'C')}, {
    question: 'Am/C 这个和弦的根音是 C。',
    options: TF, answer: 'false',
    right: '正确，这句话是错的。根音是 A（Am：A–C–E），C 是低音。',
    wrong: '斜线后面的 C 是根音还是低音？'
  });

  // 六、连续和弦中的简化标记
  section('simplify', '六', '连续和弦中的简化标记');
  group('simplify', [
    [p(`同一个和弦连续出现，只换低音时，可以省掉和弦的根音标记，只保留${accent('斜线和右边新的低音')}。`), SCENE3.dmFull],
    [p(`例如 Dm → Dm/F → Dm/A，可以简写为 Dm → /F → /A。`), SCENE3.dmShort]
  ]);
  quiz('simplify', {panel: PANEL3.simplified}, {
    question: '在 G ｜ /B 中，「/B」表示的是：',
    options: [['G/B','G/B：G 和弦，低音 B'], ['B','B 大三和弦'], ['note','只弹一个 B']], answer: 'G/B',
    right: '正确。「/B」沿用前面的 G 和弦，只把低音换成 B：G/B。',
    wrong: '简化记号省略的是什么？它要依靠前面的哪个和弦？'
  });

  // 七、三和弦的不同排列方式
  section('voicing', '七', '三和弦的不同排列方式');
  group('voicing', [
    [p(`同一个三和弦，可以有不同的${accent('八度与排列')}。`), SCENE3.voicingsPlain],
    [p(`改变排列，不会改变和弦的根音与性质。`), SCENE3.voicingsPlain]
  ]);
  group('doubling', [
    [p(`同一个和弦音在不同八度再次出现，称为<strong>重复音（Doubling）</strong>。`), SCENE3.doubling],
    [p(`和弦也可以省去某个音，称为<strong>省略音（Omission）</strong>；三和弦中最常省略的是${accent('五音')}。`), SCENE3.omission],
    [warn(`能省略的通常只是纯五度；增、减三和弦的五音决定性质，不能省。三音决定大小，一般也要保留。`), SCENE3.omission]
  ]);
  group('block', [
    [p(`和弦音同时发声，称为<strong>柱式和弦（Block Chord）</strong>；依次发声，称为<strong>分解和弦（Broken Chord）</strong>。`), SCENE3.block],
    [p(`只要和弦音相同，柱式与分解使用${accent('同一个和弦记号')}。`), SCENE3.block],
    [warn(`分解和弦中可能出现不属于和弦的音，称为<strong>和弦外音（Non-chord Tone）</strong>；判断和弦性质时，可以排除和弦外音。`), SCENE3.nonChord]
  ]);
  group('bass-rule', [
    [warn(accent('和弦的排列改变了低音的话，记号也要改写。')), SCENE3.bassChanges],
    [p(`所以，和弦记号不规定上方的八度与排列，但${accent('低音')}必须照记号来——这就是导论里说的「基本条件」。`), SCENE3.voicings]
  ]);
  quiz('voicing', SCENE3.quizVoicing, {
    question: '谱例中的排列（C–G–E），可以记作 C。',
    options: TF, answer: 'true',
    right: '正确。低音是 C，和弦音是 C、E、G，八度与排列不影响记号。',
    wrong: '看低音：是根音 C 吗？上方的排列会改变记号吗？'
  });
  quiz('voicing-bass', SCENE3.quizBass, {
    question: '谱例中的排列，应该记作：',
    options: [['C','C'], ['C/E','C/E'], ['Em','Em']], answer: 'C/E',
    right: '正确。和弦音是 C、E、G，低音是 E：C/E。',
    wrong: '上方怎么排都可以，关键是低音。'
  });
  quiz('omission', SCENE3.omission, {
    question: '三和弦中最常被省略的是：',
    options: [['root','根音'], ['third','三音'], ['fifth','五音']], answer: 'fifth',
    right: '正确。最常省略的是五音（纯五度）；三音决定大小，通常保留。',
    wrong: '哪个音省略后，和弦的性质最不容易被误解？'
  });

  ChordLesson.run({
    steps, sections,
    // 两处按钮：二节的四种性质（major…），五节的斜线记号（root / first / second）
    onControl: id => id in INV
      ? {tones: inversion(id), staffSymbols: [id === 'root' ? sym2('C') : slashSym(id)], caption: invCaption(id), controls: slashControls, pressed: id}
      : {...SCENE.relations(id), controls: qualityControls, pressed: id},
    preload: ['C4','D4','E4','F4','G4','A4','B4','Eb4','G#4','Gb4','Bb4','C5','D5','E5','F5','G5','F#4','A#4','C#5']
  });
})();
