/* 和弦记号 · 第四课：变化音和弦（V2，2026-11-18；第一节 2026-11-19 重写并拆成四节，全课 9 节）
   文字依据 docs/chord-theory/lesson04-v2-draft.md（老师批注后定稿的方向）。
   讲解区：<strong> = 术语第一次定义（附英文，规范 L28）；accent() = 重点词；instruction() = 操作提示。
   演示区：音程标记用英文字母加数字（m9、A9、A11、m13、d5、A5）；点击发声按规范 N23（tapParts）；大谱表用 scene.grand。
   变化音用紫色（ALT），自然的延伸音用蓝色（COLOR.ext）。 */
(() => {
  'use strict';
  const {COLOR, chordSymbol: cs, CENTER, PAIR} = ChordStage;
  const FAINT = COLOR.faint, ALT = '#7c3aed', X = COLOR.ext, RED = COLOR.bass;

  /* ---------- 谱例资料 ---------- */
  const tone = (id, key, extra = {}) => ({id, key, color: COLOR.ink, slot: CENTER, ...extra});
  const sym = (root, suffix = '', slot = CENTER, extra = {}) => ({slot, root, suffix, ...extra});
  // 一个柱式和弦：notes = [[id, 音, 标签?, 颜色?, 其他?], …]
  const block = (notes, slot = CENTER, prefix = '') =>
    notes.map(([id, key, label = '', color = COLOR.ink, extra = {}]) => tone(prefix + id, key, {slot, label, color, ...extra}));
  const ghost = {mute: true};
  // 横排（分解）的位置：最多 8 个
  const ROW = i => -0.3 + i * 0.48;
  const row = (notes, labels = []) => ({
    tones: notes.map(([id, key, color = COLOR.ink], i) => tone(id, key, {slot: ROW(i), color})),
    staffLabels: labels.flatMap((text, i) => text ? [{slot: ROW(i), text, color: notes[i]?.[2] && notes[i][2] !== COLOR.ink ? notes[i][2] : '#334155'}] : []),
    tap: 'note'
  });
  const C7 = [['c', 'C4'], ['e', 'E4'], ['g', 'G4'], ['bb', 'Bb4']];
  const QUAD = [0.4, 1.35, 2.3, 3.2];
  const SIX = [0.2, 0.8, 1.4, 2.0, 2.6, 3.2];
  const WIDE4 = [0.7, 2.05, 3.4, 4.75];  // scene.wide = 1.45 时的四个位置
  // 每列「根音 C + 一个变化音」，标记写在谱表下方：[[音, 标记], …]
  const columns = (list, slots) => ({
    tones: list.flatMap(([key], i) => block([['r', 'C4'], ['x', key, '', ALT]], slots[i], `k${i}-`)),
    staffLabels: list.map(([, text], i) => ({slot: slots[i], text, color: ALT})), tap: 'chord'
  });
  const TRIO = [0.3, 1.55, 2.8];

  /* ---------- 面板 ---------- */
  const PANEL = {
    // 长的记号缩小一号
    symbol: (root, suffix, bass = '') => ({key: `symbol-${root}${suffix}${bass}`, html: `<p class="symbol-row big${(suffix + bass).length > 5 ? ' long' : ''}">${cs(root, suffix, bass)}</p>`}),
    // 对错对照：[[根音, 后缀, ✓/✗], …]
    judge: list => ({key: 'judge-' + list.map(x => x.join('')).join(), html: '<div class="symbol-judge">' +
      list.map(([r, x, ok]) => `<p class="${ok ? 'is-right' : 'is-wrong'}">${cs(r, x)}<span class="judge-mark">${ok ? '✓' : '✗'}</span></p>`).join('') + '</div>'}),
    // 变化音上下叠写（部分乐谱的排法）与排成一行
    stacked: {key: 'stacked', html: '<div class="symbol-judge">' +
      `<p>${cs('C', '7')}<span class="alt-stack-group" aria-label="升十一、降九上下叠写"><span class="alt-paren">(</span><span class="alt-stack"><span>${cs('', '♯11')}</span><span>${cs('', '♭9')}</span></span><span class="alt-paren">)</span></span><span class="judge-note">上下叠写</span></p>` +
      `<p>${cs('C', '7(♭9, ♯11)')}<span class="judge-note">排成一行，从小到大</span></p></div>`},
    // 9 与 ♯9 同时写：九音到底是哪个音，互相矛盾
    conflict: {key: 'conflict', html: '<div class="symbol-judge">' +
      `<p class="is-wrong">${cs('C', '9(♯9)')}<span class="judge-mark">✗</span><span class="judge-note">9 是 D，♯9 又是 D♯，九音到底是哪个音？</span></p>` +
      `<p class="is-right">${cs('C', '7(♯9)')}<span class="judge-mark">✓</span><span class="judge-note">九音只有一个：D♯</span></p></div>`},
    plusMinus: {key: 'plus-minus', html: '<div class="symbol-judge">' +
      `<p>${cs('C', '7(+5)')}<span class="judge-note">加减号</span></p><p>${cs('C', '7(♯5)')}<span class="judge-note">升降号（建议）</span></p></div>`},
    alt: {key: 'alt', html: `<div class="symbol-judge"><p class="symbol-row big">${cs('G', '7alt')}</p><p class="judge-note">可以选择：♭5、♯5、♭9、♯9、♯11、♭13（至少一个）</p></div>`},
    // 从根音出发的十二个半音（每格可点击：根音和这个音一起发声）；marks 突出有两种标记方法的四格
    map: marks => ({key: 'semitone-map', marks, html: '<div class="semitone-map" role="table" aria-label="从根音 C 出发的十二个半音">' +
      [['0', 'C', '根音', 'C4'], ['1', 'D♭', '♭9', 'Db5'], ['2', 'D', '9', 'D5'], ['3', 'D♯ / E♭', '♯9 · 小三度', 'Eb4', 'two'],
       ['4', 'E', '大三度', 'E4'], ['5', 'F', '11', 'F5'], ['6', 'F♯ / G♭', '♯11 · ♭5', 'Gb4', 'two'], ['7', 'G', '纯五度', 'G4'],
       ['8', 'G♯ / A♭', '♯5 · ♭13', 'Ab4', 'two'], ['9', 'A / B𝄫', '13 · 减七度', 'A5', 'two'], ['10', 'B♭', '小七度', 'Bb4'], ['11', 'B', '大七度', 'B4']]
        .map(([n, note, name, key, two]) => `<button type="button" class="semitone-cell" data-play="C4${key === 'C4' ? '' : ' ' + key}"${two ? ' data-mark="two"' : ''}>` +
          `<span class="semitone-n">${n}</span><span class="semitone-note">${note}</span><span class="semitone-name">${name}</span></button>`).join('') + '</div>'})
  };

  /* ---------- 场景 ---------- */
  const SCENE = {
    /* 一、什么是变化音和弦（2026-11-19 重写：文字只讲规律，例子在演示区，规范 L32） */
    natural: row([['c', 'C4'], ['e', 'E4'], ['g', 'G4'], ['bb', 'Bb4'], ['d', 'D5', X], ['f', 'F5', X], ['a', 'A5', X]], ['1', '3', '5', '7', 'M9', 'P11', 'M13']),
    colors: {tones: [...block([...C7, ['n', 'D5', '9', X]], TRIO[0], 'a-'), ...block([...C7, ['n', 'Db5', '♭9', ALT]], TRIO[1], 'b-'), ...block([...C7, ['n', 'D#5', '♯9', ALT]], TRIO[2], 'c-')], tap: 'chord'},
    define: {tones: [...block([...C7, ['n', 'D5', '9', X]], PAIR[0], 'l-'), ...block([...C7, ['n', 'Db5', '♭9', ALT]], PAIR[1], 'r-')],
      staffLabels: [{slot: PAIR[0], text: '自然的九音'}, {slot: PAIR[1], text: '变化音'}], tap: 'chord'},
    flat9: {tones: block([...C7, ['n', 'Db5', '♭9', ALT]]), tap: 'chord'},
    sharp9: {tones: block([...C7, ['n', 'D#5', '♯9', ALT]]), tap: 'chord'},
    ninthsPair: {tones: [...block([...C7, ['n', 'Db5', '♭9', ALT]], PAIR[0], 'l-'), ...block([...C7, ['n', 'D#5', '♯9', ALT]], PAIR[1], 'r-')], tap: 'chord'},
    sharp9Major: {tones: block([['c', 'C4'], ['e', 'E4', 'M3', COLOR.third], ['g', 'G4'], ['bb', 'Bb4'], ['n', 'D#5', '♯9', ALT]]), staffLabels: [{slot: CENTER, text: '三音为大三度'}], tap: 'chord'},
    sharp9Minor: {tones: block([['c', 'C4'], ['e', 'Eb4', 'm3', RED], ['g', 'G4'], ['bb', 'Bb4'], ['n', 'D#5', '＝ 三音', RED]]), caption: '不同八度的等音', tap: 'chord'},
    // 三音为小三度的四种七和弦：画布加宽（scene.wide），整体缩小，四个和弦才放得下
    minorFour: {wide: 1.45, tones: [['C4', 'Eb4', 'G4', 'Bb4'], ['C4', 'Eb4', 'G4', 'B4'], ['C4', 'Eb4', 'Gb4', 'Bb4'], ['C4', 'Eb4', 'Gb4', 'Bbb4']]
      .flatMap((keys, i) => block(keys.map((key, j) => j === 1 ? ['n' + j, key, '', RED] : ['n' + j, key]), WIDE4[i], `m${i}-`)),
      staffLabels: ['小七', '小大七', '半减七', '减七'].map((text, i) => ({slot: WIDE4[i], text})), tap: 'chord'},
    withThird: {tones: block([['c', 'C4'], ['e', 'E4', '3', COLOR.third], ['g', 'G4'], ['bb', 'Bb4'], ['n', 'D#5', '♯9', ALT]]), staffLabels: [{slot: CENTER, text: '同时出现'}], tap: 'chord'},
    sharp11: {tones: block([...C7, ['f', 'F#5', '♯11', ALT]]), tap: 'chord'},
    clash: {tones: block([['c', 'C4', '', COLOR.ink, ghost], ['e', 'E4', 'M3'], ['g', 'G4', '', FAINT, ghost], ['bb', 'Bb4', '', FAINT, ghost], ['f', 'F5', 'P11', RED]]),
      arcs: [{from: 'e', to: 'f', text: 'm9', color: RED, side: 'right'}], caption: '只发三音和十一音', tap: 'chord'},
    noClash: {tones: [
      ...block([['c', 'C4', '', COLOR.ink, ghost], ['e', 'E4'], ['g', 'G4', '', FAINT, ghost], ['bb', 'Bb4', '', FAINT, ghost], ['f', 'F5', 'P11', RED]], PAIR[0], 'l-'),
      ...block([['c', 'C4', '', COLOR.ink, ghost], ['e', 'E4'], ['g', 'G4', '', FAINT, ghost], ['bb', 'Bb4', '', FAINT, ghost], ['f', 'F#5', '♯11', ALT]], PAIR[1], 'r-')],
      arcs: [{from: 'l-e', to: 'l-f', text: 'm9', color: RED, side: 'right'}, {from: 'r-e', to: 'r-f', text: 'M9', color: ALT, side: 'right'}],
      staffLabels: [{slot: PAIR[0], text: '碰撞'}, {slot: PAIR[1], text: '不碰撞'}], caption: '只发三音和十一音', tap: 'chord'},
    common11: {tones: [...block([['c', 'C4'], ['e', 'E4'], ['g', 'G4'], ['b', 'B4'], ['f', 'F#5', '♯11', ALT]], PAIR[0], 'l-'), ...block([...C7, ['f', 'F#5', '♯11', ALT]], PAIR[1], 'r-')],
      staffLabels: [{slot: PAIR[0], text: '大七'}, {slot: PAIR[1], text: '属七'}], tap: 'chord'},
    flat11Pitch: {tones: [tone('e', 'E4', {slot: PAIR[0], label: 'M3', color: RED}), tone('f', 'Fb5', {slot: PAIR[1], label: '♭11', color: RED})], caption: '不同八度的等音', tap: 'note'},
    flat11Major: {tones: block([['c', 'C4'], ['e', 'E4', '3', RED], ['g', 'G4'], ['bb', 'Bb4'], ['f', 'Fb5', '＝ 三音', RED]]), tap: 'chord'},
    flat11Minor: {tones: block([['c', 'C4'], ['e', 'Eb4', 'm3', COLOR.third], ['g', 'G4'], ['bb', 'Bb4'], ['f', 'Fb5', 'd4 ＝ M3', RED]]), tap: 'chord'},
    flat11Relabel: {tones: [...block([['c', 'C4'], ['e', 'Eb4', '♯9', ALT], ['g', 'G4'], ['bb', 'Bb4'], ['f', 'Fb5', '3', COLOR.third]], PAIR[0], 'l-'),
      ...block([['c', 'C4'], ['e', 'Eb4', '♯9', ALT], ['g', 'G4'], ['bb', 'Bb4'], ['f', 'En5', '3', COLOR.third]], PAIR[1], 'r-')],
      staffLabels: [{slot: PAIR[0], text: '写成 F♭'}, {slot: PAIR[1], text: '写成 E'}], caption: '两个和弦的声音相同', tap: 'chord'},
    // 加音前后并排：Cm7 加上 F♭ 之后，E♭ 改作升九音、F♭ 改作三音，成为 C7(♯9)
    flat11Result: {tones: [...block([['c', 'C4'], ['e', 'Eb4', 'm3', COLOR.third], ['g', 'G4'], ['bb', 'Bb4']], PAIR[0], 'l-'),
      ...block([['c', 'C4'], ['e', 'Eb4', '♯9', ALT], ['g', 'G4'], ['bb', 'Bb4'], ['f', 'Fb5', '3', COLOR.third]], PAIR[1], 'r-')],
      staffSymbols: [sym('C', 'm7', PAIR[0], {size: 16}), sym('C', '7(♯9)', PAIR[1], {size: 16})],
      staffLabels: [{slot: PAIR[0], text: '加音前'}, {slot: PAIR[1], text: '加上降十一音'}], tap: 'chord'},
    only11: {tones: [...block([...C7, ['f', 'F#5', '♯11', ALT]], PAIR[0], 'l-'), ...block([['c', 'C4'], ['e', 'E4', '3', RED], ['g', 'G4'], ['bb', 'Bb4'], ['f', 'Fb5', '＝ 三音', RED]], PAIR[1], 'r-')],
      staffLabels: [{slot: PAIR[0], text: '变化音'}, {slot: PAIR[1], text: '三音'}], tap: 'chord'},
    flat13: {tones: block([...C7, ['a', 'Ab5', '♭13', ALT]]), tap: 'chord'},
    sharp13Pitch: {tones: [tone('bb', 'Bb4', {slot: PAIR[0], label: 'm7', color: RED}), tone('a', 'A#5', {slot: PAIR[1], label: '♯13', color: RED})], caption: '不同八度的等音', tap: 'note'},
    sharp13Minor7: {tones: block([['c', 'C4'], ['e', 'E4'], ['g', 'G4'], ['bb', 'Bb4', '7', RED], ['a', 'A#5', '＝ 七音', RED]]), tap: 'chord'},
    sharp13Major7: {tones: block([['c', 'C4'], ['e', 'E4'], ['g', 'G4'], ['b', 'B4', 'M7', COLOR.seventh], ['a', 'A#5', '？', RED]]), staffLabels: [{slot: CENTER, text: '两个七音'}], tap: 'chord'},
    dim13: {tones: block([['c', 'C4'], ['e', 'Eb4'], ['g', 'Gb4'], ['bb', 'Bbb4', 'd7', RED], ['a', 'A5', '13', RED]]), caption: '减七度和十三音是等音', tap: 'chord'},
    only13: {tones: [...block([...C7, ['a', 'Ab5', '♭13', ALT]], PAIR[0], 'l-'), ...block([['c', 'C4'], ['e', 'E4'], ['g', 'G4'], ['bb', 'Bb4', '7', RED], ['a', 'A#5', '＝ 七音', RED]], PAIR[1], 'r-')],
      staffLabels: [{slot: PAIR[0], text: '变化音'}, {slot: PAIR[1], text: '七音'}], tap: 'chord'},
    rule: {tones: [
      ...block([['c', 'C4'], ['e', 'Eb4', '3', RED], ['g', 'G4'], ['bb', 'Bb4'], ['n', 'D#5', '♯9', RED]], TRIO[0], 'a-'),
      ...block([['c', 'C4'], ['e', 'E4', '3', RED], ['g', 'G4'], ['bb', 'Bb4'], ['f', 'Fb5', '♭11', RED]], TRIO[1], 'b-'),
      ...block([['c', 'C4'], ['e', 'E4'], ['g', 'G4'], ['bb', 'Bb4', '7', RED], ['a', 'A#5', '♯13', RED]], TRIO[2], 'c-')],
      staffLabels: [{slot: TRIO[0], text: '＝ 三音'}, {slot: TRIO[1], text: '＝ 三音'}, {slot: TRIO[2], text: '＝ 七音'}], tap: 'chord'},
    fourExt: columns([['Db5', '♭9'], ['D#5', '♯9'], ['F#5', '♯11'], ['Ab5', '♭13']], QUAD),
    fifths: {tones: [...block([['c', 'C4'], ['e', 'E4'], ['g', 'Gb4', '♭5', ALT], ['bb', 'Bb4']], PAIR[0], 'l-'), ...block([['c', 'C4'], ['e', 'E4'], ['g', 'G#4', '♯5', ALT], ['bb', 'Bb4']], PAIR[1], 'r-')], tap: 'chord'},
    lesson2: {tones: [...block([['c', 'C4'], ['e', 'Eb4'], ['g', 'Gb4', '♭5', ALT], ['bb', 'Bb4']], PAIR[0], 'l-'), ...block([['c', 'C4'], ['e', 'E4'], ['g', 'G#4', '♯5', ALT], ['bb', 'Bb4']], PAIR[1], 'r-')],
      staffSymbols: [sym('C', 'm7(♭5)', PAIR[0], {size: 16}), sym('C', '7(♯5)', PAIR[1], {size: 16})],
      staffLabels: [{slot: PAIR[0], text: '＝ Cø7'}, {slot: PAIR[1], text: '＝ C+7'}], tap: 'chord'},
    triads: {tones: [...block([['c', 'C4'], ['e', 'E4'], ['g', 'G#4', '♯5', ALT]], PAIR[0], 'l-'), ...block([['c', 'C4'], ['e', 'Eb4'], ['g', 'Gb4', '♭5', ALT]], PAIR[1], 'r-')],
      staffSymbols: [sym('C', '(♯5)', PAIR[0], {size: 16}), sym('C', 'm(♭5)', PAIR[1], {size: 16})],
      staffLabels: [{slot: PAIR[0], text: '＝ C+'}, {slot: PAIR[1], text: '＝ C°'}], tap: 'chord'},
    // 第二课的半减七、增七与增三、减三和弦：四个一行，画布加宽
    fifthFour: {wide: 1.45, tones: [['C4', 'Eb4', 'Gb4', 'Bb4'], ['C4', 'E4', 'G#4', 'Bb4'], ['C4', 'E4', 'G#4'], ['C4', 'Eb4', 'Gb4']]
      .flatMap((keys, i) => block(keys.map((key, j) => j === 2 ? ['n' + j, key, '', ALT] : ['n' + j, key]), WIDE4[i], `f${i}-`)),
      staffSymbols: [['m7(♭5)'], ['7(♯5)'], ['(♯5)'], ['m(♭5)']].map(([x], i) => sym('C', x, WIDE4[i], {size: 15})),
      staffLabels: ['＝ Cø7', '＝ C+7', '＝ C+', '＝ C°'].map((text, i) => ({slot: WIDE4[i], text})), tap: 'chord'},
    flat5vs11: {tones: [...block([['c', 'C4'], ['e', 'E4'], ['g', 'Gb4', '♭5', ALT], ['bb', 'Bb4']], PAIR[0], 'l-'), ...block([['c', 'C4'], ['e', 'E4'], ['g', 'G4', 'P5', COLOR.fifth], ['bb', 'Bb4'], ['f', 'F#5', '♯11', ALT]], PAIR[1], 'r-')],
      staffLabels: [{slot: PAIR[0], text: '没有纯五度'}, {slot: PAIR[1], text: '纯五度可有可无'}], tap: 'chord'},
    enharmonic: {wide: 1.1, tones: [['Gb4', '♭5'], ['F#5', '♯11'], ['G#4', '♯5'], ['Ab5', '♭13']].flatMap(([key, label], i) => block([['r', 'C4'], ['x', key, label, ALT]], QUAD[i], `q${i}-`)),
      staffLabels: [{slot: (QUAD[0] + QUAD[1]) / 2, text: '等音'}, {slot: (QUAD[2] + QUAD[3]) / 2, text: '等音'}], tap: 'chord'},
    flat5: {tones: block([['c', 'C4'], ['e', 'E4'], ['g', 'Gb4', '♭5', ALT], ['bb', 'Bb4']]), caption: '没有纯五度', tap: 'chord'},
    sharp11Fifth: {tones: [...block([['c', 'C4'], ['e', 'E4'], ['g', 'G4', 'P5', COLOR.fifth], ['bb', 'Bb4'], ['f', 'F#5', '♯11', ALT]], PAIR[0], 'l-'), ...block([['c', 'C4'], ['e', 'E4'], ['bb', 'Bb4'], ['f', 'F#5', '♯11', ALT]], PAIR[1], 'r-')],
      staffLabels: [{slot: PAIR[0], text: '有纯五度'}, {slot: PAIR[1], text: '省略纯五度'}], tap: 'chord'},
    withFifth: {tones: [...block([['c', 'C4'], ['e', 'E4'], ['g', 'G4', 'P5', COLOR.fifth], ['bb', 'Bb4'], ['f', 'F#5', '♯11', ALT]], PAIR[0], 'l-'), ...block([['c', 'C4'], ['e', 'E4'], ['g', 'G4', 'P5', COLOR.fifth], ['bb', 'Bb4'], ['a', 'Ab5', '♭13', ALT]], PAIR[1], 'r-')], tap: 'chord'},
    spelling: {tones: [...block([['c', 'C4'], ['e', 'E4'], ['bb', 'Bb4'], ['g', 'Gb5', '♭5', ALT]], PAIR[0], 'l-'), ...block([['c', 'C4'], ['f', 'F#4', '♯11', ALT], ['bb', 'Bb4'], ['e', 'E5']], PAIR[1], 'r-')],
      staffLabels: [{slot: PAIR[0], text: '五音的音名'}, {slot: PAIR[1], text: '十一音的音名'}], tap: 'chord'},
    six: columns([['Gb4', '♭5'], ['G#4', '♯5'], ['Db5', '♭9'], ['D#5', '♯9'], ['F#5', '♯11'], ['Ab5', '♭13']], SIX),
    multi: {tones: block([['c', 'C4'], ['e', 'E4'], ['g', 'G#4', '♯5', ALT], ['bb', 'Bb4'], ['n', 'Db5', '♭9', ALT]]), tap: 'chord'},
    // 不自动切换（规范 L39）：学生点按钮在两张图之间切换
    sixOrMulti: id => ({...(id === 'multi' ? SCENE.multi : SCENE.six), controls: [['alt:six', '六个变化音'], ['alt:multi', '一个和弦里的几个变化音']], pressed: `alt:${id}`}),

    quizFifth: {tones: block([['c', 'C4'], ['e', 'E4'], ['g', 'G4'], ['bb', 'Bb4'], ['ab', 'Ab5']]), tap: 'chord'},
    quizMinorMaj: {tones: block([['c', 'C4'], ['e', 'Eb4'], ['g', 'G4'], ['b', 'B4']]), staffSymbols: [sym('C', 'm(maj7)')], tap: 'chord'},

    /* 二、音程性质：同一个音的三种形态 */
    two: (keys, labels, colors) => ({tones: keys.flatMap((key, i) => block([['r', 'C4'], ['x', key, labels[i], colors[i]]], PAIR[i], `w${i}-`)), tap: 'chord'}),
    three: (keys, labels, colors) => ({tones: keys.flatMap((key, i) => block([['r', 'C4'], ['x', key, labels[i], colors[i]]], TRIO[i], `t${i}-`)), tap: 'chord'}),
    four: {tones: [['F5', 'P11', X], ['F#5', 'A11', ALT], ['A5', 'M13', X], ['Ab5', 'm13', ALT]].flatMap(([key, label, color], i) => block([['r', 'C4'], ['x', key, label, color]], QUAD[i], `q${i}-`)),
      staffLabels: [{slot: (QUAD[0] + QUAD[1]) / 2, text: '十一音'}, {slot: (QUAD[2] + QUAD[3]) / 2, text: '十三音'}], tap: 'chord'},
    letters: {tones: [...block([['r', 'C4'], ['x', 'D#5', 'A9', ALT]], PAIR[0], 'l-'), ...block([['r', 'C4'], ['x', 'Ab5', 'm13', ALT]], PAIR[1], 'r-')],
      staffLabels: [{slot: PAIR[0], text: '♯9：D♯'}, {slot: PAIR[1], text: '♭13：A♭'}], tap: 'chord'},

    /* 三、标记 */
    c7: {tones: block(C7), staffSymbols: [sym('C', '7')], tap: 'chord'},
    c7b9: {tones: block([...C7, ['n', 'Db5', '♭9', ALT]]), staffSymbols: [sym('C', '7(♭9)')], tap: 'chord'},
    slash: {grand: true, tones: block([['e', 'E3', '3', RED], ['c', 'C4'], ['g', 'G4'], ['bb', 'Bb4'], ['n', 'Db5', '♭9', ALT]]), staffSymbols: [sym('C', '7(♭9)', CENTER, {bass: 'E'})], tap: 'chord'},
    // 自然的延伸音：没有升降变化的九音、十一音、十三音（蓝色）
    naturalExt: {tones: block([...C7, ['d', 'D5', 'M9', X], ['f', 'F5', 'P11', X], ['a', 'A5', 'M13', X]]), caption: '自然的延伸音：没有升高或降低的 9、11、13', tap: 'chord'},
    c13b9: {tones: block([['c', 'C4'], ['e', 'E4'], ['g', 'G4', '', FAINT, ghost], ['bb', 'Bb4'], ['n', 'Db5', '♭9', ALT], ['f', 'F5', '', FAINT, ghost], ['a', 'A5', '13', X]]),
      staffSymbols: [sym('C', '13(♭9)')], caption: '灰色：按第三课的规律省略的音', tap: 'chord'},
    twoAlt: {tones: block([['c', 'C4'], ['e', 'E4'], ['bb', 'Bb4'], ['n', 'Db5', '♭9', ALT], ['f', 'F#5', '♯11', ALT]]), staffSymbols: [sym('C', '7(♭9, ♯11)')], tap: 'chord'},

    /* 四、构建 */
    g7: {grand: true, tones: block([['g', 'G3', '', COLOR.root], ['b', 'B3'], ['d', 'D4'], ['f', 'F4']]), staffSymbols: [sym('G', '7')], tap: 'chord'},
    g7alt2: {grand: true, tones: block([['g', 'G3', '', COLOR.root], ['b', 'B3'], ['d', 'D4'], ['f', 'F4'], ['ab', 'Ab4', 'm9', ALT], ['eb', 'Eb5', 'm13', ALT]]),
      staffSymbols: [sym('G', '7(♭9, ♭13)')], tap: 'chord'},
    fmaj9: {grand: true, tones: block([['f', 'F3', '', COLOR.root], ['a', 'A3'], ['c', 'C4'], ['e', 'E4'], ['g', 'G4']]), staffSymbols: [sym('F', 'maj9')], tap: 'chord'},
    fmaj9s11: {grand: true, tones: block([['f', 'F3', '', COLOR.root], ['a', 'A3'], ['c', 'C4'], ['e', 'E4'], ['g', 'G4'], ['b', 'B4', 'A11', ALT]]), staffSymbols: [sym('F', 'maj9(♯11)')], tap: 'chord'},
    am7b5: {tones: [...block([['a', 'A3'], ['c', 'C4'], ['e', 'E4', 'P5', COLOR.fifth], ['g', 'G4']], PAIR[0], 'l-'), ...block([['a', 'A3'], ['c', 'C4'], ['e', 'Eb4', 'd5', ALT], ['g', 'G4']], PAIR[1], 'r-')],
      staffSymbols: [sym('A', 'm7', PAIR[0], {size: 16}), sym('A', 'm7(♭5)', PAIR[1], {size: 16})], tap: 'chord'},
    g13b9: {grand: true, tones: [
      ...block([['g', 'G3', '1', COLOR.root], ['b', 'B3', '3', COLOR.third], ['d', 'D4'], ['f', 'F4', '7', COLOR.seventh], ['ab', 'Ab4', '', ALT], ['c', 'C5'], ['e', 'E5']], PAIR[0], 'l-'),
      ...block([['g', 'G3', '1', COLOR.root], ['b', 'B3', '3', COLOR.third], ['d', 'D4', '', FAINT, ghost], ['f', 'F4', '7', COLOR.seventh], ['ab', 'Ab4', '♭9', ALT], ['c', 'C5', '', FAINT, ghost], ['e', 'E5', '13', X]], PAIR[1], 'r-')],
      staffSymbols: [sym('G', '13(♭9)', PAIR[0], {size: 15}), sym('G', '13(♭9)', PAIR[1], {size: 15})],
      staffLabels: [{slot: PAIR[0], text: '完整结构'}, {slot: PAIR[1], text: '最简结构'}], tap: 'chord'},
    c9s11: {grand: true, tones: block([['c', 'C3'], ['e', 'E4', 'M3', COLOR.third], ['g', 'G4', '', FAINT, ghost], ['bb', 'Bb4'], ['d', 'D5', '9', X], ['f', 'F#5', 'A11', ALT]]),
      staffSymbols: [sym('C', '9(♯11)')], caption: '三音保留：♯11 不和三音冲突', tap: 'chord'},

    /* 二（续）：♯9 的拼写 */
    spelledE: {grand: true, tones: [...block([['e', 'E2'], ['gs', 'G#3', 'M3', COLOR.third], ['d', 'D4'], ['g', 'F##4', 'A9', ALT]], PAIR[0], 'l-'), ...block([['e', 'E2'], ['gs', 'G#3', 'M3', COLOR.third], ['d', 'D4'], ['g', 'Gn4', '♯9 ＝ m3', ALT]], PAIR[1], 'r-')],
      staffSymbols: [sym('E', '7(♯9)', PAIR[0], {size: 16}), sym('E', '7(♯9)', PAIR[1], {size: 16})],
      staffLabels: [{slot: PAIR[0], text: '按音程：F𝄪'}, {slot: PAIR[1], text: '为了好读：G'}], tap: 'chord'},
    c7s9: {tones: block([...C7, ['n', 'D#5', '♯9', ALT]]), staffSymbols: [sym('C', '7(♯9)')], tap: 'chord'},
    quizNinth: {grand: true, tones: block([['c', 'C3'], ['e', 'E4'], ['bb', 'Bb4'], ['n', 'Eb5']]), tap: 'chord'},

    /* 五、alt */
    // 肖邦《第二钢琴奏鸣曲》第一乐章开头的和弦：左手 F1、F2，右手 D♭3、E♭3、A3、D♭4（老师核对原版，2026-11-19）
    chopin: {grand: true, tones: block([['f1', 'F1', '1', COLOR.root], ['f2', 'F2', '1', COLOR.root], ['db', 'Db3', '♭13', ALT], ['eb', 'Eb3', '7', COLOR.seventh], ['a', 'A3', '3', COLOR.third], ['db2', 'Db4', '♭13', ALT]]),
      staffSymbols: [sym('F', '7(♭13)')], caption: '肖邦《第二钢琴奏鸣曲》第一乐章开头的和弦', tap: 'chord'},
    // 陶喆《普通朋友》吉他前奏（老师提供的谱例）
    taoZhe: ChordStage.scoreScene({symbol: {root: 'F', suffix: '7alt'}, treble: [
      {keys: ['C5'], d: 'q'}, {keys: ['G#4', 'D4', 'A3'], d: '8', arp: true, labels: ['♯9', '13', '3']}, {keys: ['Gb4'], d: '8', labels: ['♭9']},
      {keys: ['F4'], d: '8'}, {keys: ['Eb4'], d: '8'}], bass: [{keys: ['F2'], d: 'h', dot: true}]}, {caption: '陶喆《普通朋友》吉他前奏'}),
    altScale: suffix => ChordStage.scoreScene({symbol: {root: 'G', suffix}, beat: .42,
      treble: ['G5', 'F5', 'Eb5', 'Db5', 'B4', 'A#4', 'Ab4', 'G4'].map(key => ({keys: [key], d: 'q', small: true})),
      bass: [{keys: ['G3', 'B3', 'F4'], d: 'w', ring: 8}]}),

    /* 六、匹配记号 */
    ex1: (labels = {}, symbol = false) => ({grand: true, tones: [['g', 'G3'], ['f', 'F4'], ['ab', 'Ab4'], ['b', 'B4'], ['eb', 'Eb5']].map(([id, key]) => tone(id, key, labels[id] || {})),
      staffSymbols: symbol ? [sym('G', '7(♭9, ♭13)')] : [], tap: 'note'}),
    ex2: (labels = {}, symbol = false) => ({grand: true, tones: [['f', 'F3'], ['e', 'E4'], ['a', 'A4'], ['b', 'B4']].map(([id, key]) => tone(id, key, labels[id] || {})),
      staffSymbols: symbol ? [sym('F', 'maj7(♯11)')] : [], tap: 'note'}),
    ex3: (labels = {}, symbol = false) => ({grand: true, tones: [['e1', 'E2'], ['e2', 'E3'], ['gs', 'G#3', {staff: 'treble'}], ['d', 'D4'], ['g', 'G4'], ['cs', 'C#5']].map(([id, key, extra = {}]) => tone(id, key, {...extra, ...(labels[id] || {})})),
      staffSymbols: symbol ? [sym('E', '13(♯9)')] : [], tap: 'note'}),
    quizMatch: {grand: true, tones: block([['c', 'C3'], ['e', 'E4'], ['bb', 'Bb4'], ['db', 'Db5'], ['ab', 'Ab5']]), tap: 'chord'}
  };
  const L = (label, color = COLOR.ink) => ({label, color});

  const {steps, sections, section, group, quiz, accent, p, instruction, TF} = ChordLesson.builder();
  const tapHint = '点击谱例中的音、和弦或标注，可以单独听。';

  // 一、什么是变化音和弦（2026-11-19 重写，文字稿见 docs/chord-theory/lesson04-v2-draft.md 第三轮）
  section('altered', '一', '什么是变化音和弦');
  group('altered', [
    [p(`第三课学过，延伸音的音程是固定的，九音是 M9，十一音是 P11，十三音是 M13。`), SCENE.natural, {hint: tapHint}],
    [p(`每个延伸音只有一种音程，把它们升高或降低半音，和弦就会多出${accent('不同的色彩')}。`), SCENE.colors],
    [p(`以根音为参照，把五音或延伸音升高、降低半音，得到的音叫<strong>变化音（Alteration）</strong>；含有变化音的和弦，叫<strong>变化音和弦（Altered Chord）</strong>。`), SCENE.define]
  ]);
  // 二、♯9 和 ♭9
  section('ninth', '二', '♯9 和 ♭9');
  group('ninth', [
    [p(`降低半音的九音，叫${accent('降九音（♭9）')}；升高半音的九音，叫${accent('升九音（♯9）')}。`), SCENE.ninthsPair],
    [p(`升九音只能用在${accent('三音为大三度')}的和弦上。`), SCENE.sharp9Major],
    [p(`在三音为小三度的和弦里，升九音和三音是不同八度的等音，它就是三音本身。`), SCENE.sharp9Minor],
    [p(`所以升九音不会出现在三音为小三度的和弦（小七、小大七、半减七、减七）里。`), SCENE.minorFour],
    [p(`在三音为大三度的和弦里，升九音是三音之外多出来的音，可以和大三度${accent('同时出现')}。`), SCENE.withThird]
  ]);
  quiz('sharp9-types', SCENE.sharp9, {
    question: '升九音可能出现在下面哪些和弦里？',
    options: [['dom', '属七'], ['min', '小七'], ['maj', '大七'], ['half', '半减七'], ['aug', '增七'], ['dim', '减七'], ['augmaj', '增大七']],
    answer: ['dom', 'maj', 'aug', 'augmaj'],
    right: '正确。属七、大七、增七、增大七的三音都是大三度；小七、半减七、减七的三音是小三度，升九音和它们的三音是等音。',
    wrong: '先看每种和弦的三音：是大三度还是小三度？'
  });
  quiz('minor-maj9', SCENE.quizMinorMaj, {
    question: 'Cm(maj7) 上方可能出现的九音有：',
    options: [['d', 'D'], ['ds', 'D♯'], ['db', 'D♭']], answer: ['d', 'db'],
    right: '正确。Cm(maj7) 的三音是小三度 E♭，D♯ 和它是等音，按三音来标记；自然的九音 D 和降九音 D♭ 都可以出现。',
    wrong: 'Cm(maj7) 的三音是大三度还是小三度？升九音会和哪个音成为等音？'
  });

  // 三、♯11 和 ♭13
  section('extensions', '三', '♯11 和 ♭13');
  group('eleventh', [
    [p(`升高半音的十一音，叫${accent('升十一音（♯11）')}。`), SCENE.sharp11],
    [p(`第三课学过，在三音为大三度的和弦里，十一音和三音会形成尖锐的小九度。`), SCENE.clash],
    [p(`升高成升十一音之后，它和三音相差大九度，${accent('不再碰撞')}。`), SCENE.noClash],
    [p(`所以在大七和属七和弦里，升十一音${accent('很常见')}。`), SCENE.common11],
    [p(`降低半音的十一音和大三度是等音，在三音为大三度的和弦里，它就是三音本身。`), SCENE.flat11Major],
    [p(`在三音为小三度的和弦里，降低的十一音成了和弦里新的大三度。`), SCENE.flat11Minor],
    [p(`和弦里同时有大三度和小三度时，大三度是三音，小三度那个音看作升九音。`), SCENE.flat11Relabel],
    [p(`这样，小三度和弦加上降十一音，实际得到的是带升九音的大三度和弦。`), SCENE.flat11Result],
    [p(`所以和弦中的十一音只有${accent('升高')}这一种变化形式，而降十一音通常被认为是一种无效的变化音。`), SCENE.only11]
  ]);
  group('thirteenth', [
    [p(`降低半音的十三音，叫${accent('降十三音（♭13）')}。`), SCENE.flat13],
    [p(`升高半音的十三音，和小七度是等音。和降十一音类似，它也是一种无效的变化音。`), SCENE.sharp13Pitch],
    [p(`在七音为小七度的和弦（属七、小七、增七、半减七）里，升高的十三音就是七音本身。`), SCENE.sharp13Minor7],
    [p(`七音为大七度的和弦（大七、小大七、增大七）再加上这个音，目前的和弦记号里还没有约定俗成的写法。`), SCENE.sharp13Major7],
    [p(`这不是说这个音不能用，只是在现有的作品里，还没有形成可以统一标记的规律。`), SCENE.sharp13Major7],
    [p(`减七和弦的七音是减七度，和十三音是等音，所以减七和弦的记号里既不写十三音，也不写十三音的变化。`), SCENE.dim13],
    [p(`所以和弦中的十三音，暂时只有${accent('降低')}这一种变化形式。`), SCENE.only13]
  ]);
  group('rule', [
    [p(`注意：变化后的音如果和三音或七音是等音，就按三音或七音来标记，不再标记为变化音。`), SCENE.rule],
    [p(`延伸音的变化一共${accent('四个')}，其中升九音只出现在三音为大三度的和弦里。`), SCENE.fourExt]
  ]);
  quiz('not-altered', SCENE.fourExt, {
    question: '下面哪一个不是变化音？',
    options: [['b9', '♭9'], ['s11', '♯11'], ['b11', '♭11'], ['b13', '♭13']], answer: 'b11',
    right: '正确。♭11 和大三度是等音，按三音来标记，不作为变化音。',
    wrong: '回想一下：哪一个和三音或七音是等音？'
  });

  // 四、♯5 和 ♭5
  section('fifth', '四', '♯5 和 ♭5');
  group('fifth', [
    [p(`五音也可以升高或降低半音，叫${accent('升五音（♯5）')}、${accent('降五音（♭5）')}。`), SCENE.fifths],
    [p(`第二课学过的半减七和弦、增七和弦，以及增三和弦、减三和弦，都可以用降五音、升五音来标记。`), SCENE.fifthFour],
    [p(`降五音和升十一音是不同八度的等音，升五音和降十三音也是。`), SCENE.enharmonic],
    [p(`降五音表示五音本身被降低，和弦里${accent('没有纯五度')}；升十一音是另外加上的延伸音，纯五度可以有，也可以省略。`), SCENE.flat5vs11],
    [p(`和弦里有纯五度时，这个音标记为升十一音或降十三音。`), SCENE.withFifth],
    [p(`没有纯五度时，按乐谱上的${accent('拼写')}来标记，写成五音的音名就是降五音或升五音，写成十一音、十三音的音名就是升十一音或降十三音。`), SCENE.spelling],
    [p(`因为纯五度可以省略，只有音高、没有拼写的时候，两种标记方法都可以。`), {panel: PANEL.judge([['C', '7(♭5)', true], ['C', '7(♯11)', true]])}]
  ]);
  group('summary', [
    [p(`变化音一共${accent('六个')}，一个和弦里可以有一个，也可以有好几个。`), SCENE.sixOrMulti('six'), {hint: '点击下方的按钮切换两张谱例。'}],
    [p(`从根音往上的${accent('十二个半音')}，现在每一个都有了标记方法。`), {panel: PANEL.map([])}, {hint: '点击每一格，可以听它和根音一起发声。'}],
    [p(`有的半音有两种标记方法，标记方法不同，在和弦里的角色也不同。`), {panel: PANEL.map(['two'])}]
  ]);

  quiz('flat13', SCENE.quizFifth, {
    question: '谱例中最高的音 A♭ 应该标记为：',
    options: [['s5', '♯5'], ['b13', '♭13']], answer: 'b13',
    right: '正确。和弦里有纯五度时，这个音标记为降十三音：C7(♭13)。',
    wrong: '和弦里已经有纯五度了吗？有纯五度时，这个音标记为什么？'
  });

  // 五、变化音的音程性质与拼写（2026-11-19：文字只讲规律，例子在演示区，规范 L32）
  section('intervals', '五', '变化音的音程性质与拼写');
  group('intervals', [
    [p(`九音本来是大九度，降低半音是小九度（m9），升高半音是增九度（A9）。`), SCENE.three(['Db5', 'D5', 'D#5'], ['m9', 'M9', 'A9'], [ALT, X, ALT])],
    [p(`五音本来是纯五度，降低半音是减五度（d5），升高半音是增五度（A5）。`), SCENE.three(['Gb4', 'G4', 'G#4'], ['d5', 'P5', 'A5'], [ALT, COLOR.fifth, ALT])],
    [p(`十一音本来是纯十一度，升高半音是增十一度（A11）。`), SCENE.two(['F5', 'F#5'], ['P11', 'A11'], [X, ALT])],
    [p(`十三音本来是大十三度，降低半音是小十三度（m13）。`), SCENE.two(['A5', 'Ab5'], ['M13', 'm13'], [X, ALT])],
    [p(`变化音只改变音程的${accent('性质')}，不改变${accent('度数')}，所以拼写时要注意，尽量用它正确的音位拼写。`), SCENE.letters],
    [p(`变化音一般沿用原来那个音的${accent('音名')}，只加升号或降号。`), SCENE.letters]
  ]);
  quiz('d-sharp9', {panel: PANEL.symbol('D', '7(♯9)')}, {
    question: 'D7(♯9) 的 ♯9 是：',
    options: [['Es', 'E♯'], ['F', 'F'], ['Eb', 'E♭']], answer: 'Es',
    right: '正确。♯9 是增九度，度数不变，音名还是九音的 E：E♯。',
    wrong: '♯9 是几度？九度是哪个音名？'
  });
  quiz('bb-flat13', {panel: PANEL.symbol('B♭', '7(♭13)')}, {
    question: 'B♭7(♭13) 的 ♭13 是：',
    options: [['Gb', 'G♭'], ['Fs', 'F♯'], ['G', 'G']], answer: 'Gb',
    right: '正确。♭13 是小十三度，音名是十三音的 G：G♭。',
    wrong: '♭13 是几度？十三度是哪个音名？'
  });
  group('spelling', [
    [p(`实际乐谱为了读谱便利，升九音也有可能写成小三度的${accent('音名')}，因为多出来一个“三音”，原本的大三度三音通常需要加上提示的变音记号。`), SCENE.spelledE],
    [p(`但大多数情况下，还是要按它${accent('本身的音')}来记谱。`), SCENE.c7s9]
  ]);
  quiz('sharp9', SCENE.quizNinth, {
    question: '写出谱例中和弦的记号。',
    input: 'C7(#9)',
    right: '正确。和弦里已经有大三度 E，E♭ 是 ♯9（谱面写成小三度的音名）：C7(♯9)。',
    wrong: '和弦里已经有大三度了吗？和它只差半音的那个音是什么？'
  });
  quiz('sharp9-spelling', {panel: PANEL.symbol('C', '7(♯9)')}, {
    question: 'C7(♯9) 的变化音应当优先写作：',
    options: [['ds', 'D♯'], ['eb', 'E♭']], answer: 'ds',
    right: '正确。♯9 是增九度，按它本身的音名写作 D♯；写成 E♭ 是为了读谱便利的写法。',
    wrong: '♯9 是几度？九度用哪个音名？'
  });

  // 六、变化音和弦的标记
  section('symbols', '六', '变化音和弦的标记');
  group('symbols', [
    [p(`变化音通常需要写在括号里，放在和弦记号的最后。`), [SCENE.c7, SCENE.c7b9], {sequence: 1200}],
    [p(`转位和弦的括号写在斜线前面。`), SCENE.slash],
    [p(`替换七和弦里那个 7 的数字，只能是${accent('自然的延伸音')}。`), SCENE.naturalExt],
    [p(`被变化的延伸音只写在括号里，不替换 7。`), {panel: PANEL.conflict}],
    [p(`括号外的数字，写到最高的自然延伸音。`), SCENE.c13b9],
    [p(`有几个变化音时，写在同一个括号里，用逗号分开。`), SCENE.twoAlt],
    [p(`括号里按数字${accent('从小到大')}排列。`), SCENE.twoAlt],
    [p(`有的乐谱会把变化音上下叠写，这时一般把数字大的写在上面，也就是按音高从高到低排列。`), {panel: PANEL.stacked}],
    [p(`升号、降号也可以写成加号、减号。`), {panel: PANEL.plusMinus}],
    [p(`但加号、减号容易和增和弦、小和弦的记号混淆，手写时最好用升降号。`), {panel: PANEL.plusMinus}]
  ]);
  quiz('order', {panel: PANEL.symbol('C', '7')}, {
    question: '同时有 ♯5 和 ♭9 的属七和弦，规范的写法是：',
    options: [['wrong-order', 'C7(♭9, ♯5)'], ['right', 'C7(♯5, ♭9)'], ['nine', 'C9(♯5)']], answer: 'right',
    right: '正确。变化音按数字从小到大排列，5 在 9 前面；9 被变化了，数字只写到 7。',
    wrong: '变化音按什么顺序排列？被变化的九音能替换 7 吗？'
  });
  quiz('c9s9', {panel: PANEL.symbol('C', '7')}, {
    question: 'C7 加上 ♯9，按惯例写作：',
    options: [['nine', 'C9(♯9)'], ['right', 'C7(♯9)'], ['add', 'C7(add♯9)']], answer: 'right',
    right: '正确。9 被升高了，就不是自然的九音，不能替换 7；变化音写在括号里：C7(♯9)。',
    wrong: '被变化的延伸音，能不能替换 7？变化音写在哪里？'
  });

  // 七、根据记号构建和弦
  section('construct', '七', '根据记号构建和弦');
  group('construct', [
    [p(`先写出括号外的和弦，再加上括号里的变化音。`), {panel: PANEL.symbol('G', '7(♭9, ♭13)')}],
    [p(`括号外的和弦，按第三课的方法写。`), SCENE.g7],
    [p(`变化音从根音出发，按音程找出来。`), SCENE.g7alt2],
    [p(`变化的五音直接${accent('替换')}原来的五音。`), SCENE.am7b5]
  ]);
  group('minimal', [
    [p(`写最简结构时，省略规律和第三课一样。`), SCENE.g13b9],
    [p(`升十一音不再和大三度剧烈碰撞，所以带升十一音的和弦，三音${accent('不')}能省略。`), SCENE.c9s11]
  ]);
  quiz('eb7b9', {panel: PANEL.symbol('E♭', '7(♭9)')}, {
    question: 'E♭7(♭9) 的和弦音是：',
    options: [['right', 'E♭–G–B♭–D♭–F♭'], ['spell', 'E♭–G–B♭–D♭–E'], ['seventh', 'E♭–G–B♭–D–F♭']], answer: 'right',
    right: '正确。先写出 E♭7：E♭、G、B♭、D♭；E♭ 上方的小九度，音名是 F：F♭。',
    wrong: '♭9 是小九度，音名用九音的音名。'
  });
  quiz('a13b9', {panel: PANEL.symbol('A', '13(♭9)')}, {
    question: 'A13(♭9) 的最简结构是：',
    options: [['right', 'A–C♯–G–B♭–F♯'], ['full', 'A–C♯–E–G–B♭–D–F♯'], ['drop9', 'A–C♯–G–F♯']], answer: 'right',
    right: '正确。纯五度 E 和十一音 D 省略；♭9（B♭）写在记号上，不能省；十三音 F♯ 也不能省。',
    wrong: '哪些音可以省略？记号上写出的变化音能不能省？'
  });

  // 八、属变和弦（alt）
  section('alt', '八', '属变和弦（alt）');
  group('alt', [
    [p(`属七和弦加上变化音，在浪漫主义时期的作品里就已经很常见。`), SCENE.chopin],
    [p(`发展到现代，属七和弦中的变音应用是最常见且丰富的。`), SCENE.taoZhe],
    [p(`属七和弦上的变化音由演奏者自由选择时，可以写成 alt，这样的和弦叫<strong>属变和弦（Altered Dominant）</strong>。`), {panel: PANEL.alt}],
    [p(`alt 不规定用哪几个变化音，但${accent('至少要用一个')}。`), SCENE.altScale('7alt')],
    [p(`alt 最常用在${accent('即兴')}的场合。`), SCENE.altScale('7alt')],
    [p(`扒谱时遇到即兴性很强、背景是属七和弦的段落，也可以记作 alt。`), SCENE.altScale('7alt')],
    [p(`想准确记下具体的音时，就把变化音写出来。`), SCENE.altScale('7(♭5, ♭9, ♯9, ♭13)')]
  ]);
  quiz('alt', {panel: PANEL.alt}, {
    question: 'G7alt 规定了具体要用哪几个变化音。',
    options: TF, answer: 'false',
    right: '正确，这句话是错的。alt 只说明这是带变化音的属七和弦，具体用哪几个由演奏者决定，至少用一个。',
    wrong: 'alt 和 G7(♯5, ♯9) 这样的写法有什么不同？'
  });

  // 九、给和弦匹配记号（例题讲解需要对着具体的音，保留音名：规范 L32 的例外）
  section('match', '九', '给和弦匹配记号');
  const R = COLOR.root, T3 = COLOR.third, S7 = COLOR.seventh;
  const g1 = {g: L('1', R), b: L('M3', T3), f: L('m7', S7), ab: L('m9', ALT), eb: L('m13', ALT)};
  const f2 = {f: L('1', R), a: L('M3', T3), e: L('M7', S7), b: L('A11', ALT)};
  const e3 = {e1: L('1', R), gs: L('M3', T3), d: L('m7', S7), cs: L('M13', X), g: L('♯9', ALT)};
  group('match', [
    [p(`先把每个音相对于根音的音程标出来。`), SCENE.ex1(), {hint: tapHint}],
    [p(`例一，从 G 标起，B 是 M3，F 是 m7，A♭ 是 m9，E♭ 是 m13。`), SCENE.ex1(g1)],
    [p(`这是省略了五音的属七和弦，加上 ♭9 和 ♭13，记作 ${accent('G7(♭9, ♭13)')}。`), SCENE.ex1(g1, true)],
    [p(`例二，从 F 标起，A 是 M3，E 是 M7，B 是 A11。`), SCENE.ex2(f2)],
    [p(`没有纯五度，B 写成十一音的音名，记作 ${accent('Fmaj7(♯11)')}。`), SCENE.ex2(f2, true)],
    [p(`例三，从 E 标起，G♯ 是 M3，D 是 m7，C♯ 是 M13。`), SCENE.ex3({...e3, g: {}})],
    [p(`G 和三音 G♯ 只差半音，是写成小三度音名的升九音。`), SCENE.ex3(e3)],
    [p(`数字写到最高的自然延伸音 13，九音被升高写在括号里，记作 ${accent('E13(♯9)')}。`), SCENE.ex3(e3, true)]
  ]);
  quiz('match', SCENE.quizMatch, {
    question: '写出谱例中和弦的记号。',
    input: 'C7(b9,b13)',
    right: '正确。C 上方：E 是 M3，B♭ 是 m7，D♭ 是 m9，A♭ 是 m13（写成十三音的音名）：C7(♭9, ♭13)。',
    wrong: '从 C 开始，把每个音的音程标出来：哪些是变化音？'
  });

  ChordLesson.run({
    steps, sections, quizLockHint: true,
    onControl: id => SCENE.sixOrMulti(id.slice(4)),
    quizExtras: true, tapParts: true,  // Quiz 答对前不显示演示区说明、反馈滚进可见范围、完成页的一次答对小结；点击发声（N23）
    inputLevel: 4,
    preload: ['C4', 'E4', 'G4', 'Bb4', 'Db5', 'D5', 'D#5', 'Gb4', 'G#4', 'F5', 'F#5', 'A5', 'Ab5', 'Eb4', 'Eb5', 'C3', 'E3', 'G3', 'B3', 'D4', 'F4', 'Ab4', 'F3', 'A3', 'C5', 'E5', 'B4', 'E2', 'G#3', 'G4', 'C#5', 'Fb5', 'A#5', 'Bbb4', 'Gb5', 'F#4', 'F1', 'F2', 'Db3', 'Eb3', 'Db4', 'G5', 'A#4', 'D#4']
  });
})();
