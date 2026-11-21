/* 和弦记号 · 第三课：延伸音和弦（V2，2026-11-18）
   文字依据 docs/chord-theory/lesson03-v2-draft.md（老师两轮批注后的定稿方向）。
   讲解区：<strong> = 术语第一次定义（附英文，规范 L28）；accent() = 重点词；instruction() = 操作提示。
   演示区：音程标记一律用英文字母加数字（m3、M9、P11…）。scene.tap：点击谱面上的音（'note'）或和弦（'chord'）单独发声，
   不自动播放、不按顺序播放。大谱表用 scene.grand。规则见 docs/interactive-theory-lesson-standard.md。 */
(() => {
  'use strict';
  const {COLOR, chordSymbol: cs, CENTER, PAIR} = ChordStage;
  const FAINT = COLOR.faint;

  /* ---------- 谱例资料 ---------- */
  // 和弦音的颜色按度数：1 根音、3 三音、5 五音、7 七音、9 / 11 / 13 延伸音
  const DEGREE_COLOR = {1: COLOR.root, 3: COLOR.third, 5: COLOR.fifth, 7: COLOR.seventh, 9: COLOR.ext, 11: COLOR.ext, 13: COLOR.ext};
  const tone = (id, key, extra = {}) => ({id, key, color: COLOR.ink, slot: CENTER, ...extra});
  const sym = (root, suffix = '', slot = CENTER, extra = {}) => ({slot, root, suffix, ...extra});
  // 一个柱式和弦：notes = [[id, 音, 标签?, 颜色?], …]
  const block = (notes, slot = CENTER, prefix = '') =>
    notes.map(([id, key, label = '', color = COLOR.ink, extra = {}]) => tone(prefix + id, key, {slot, label, color, ...extra}));
  const ghost = extra => ({color: FAINT, mute: true, ...extra});  // 省略的音：灰色、不发声

  // C 属七和弦一路叠到十三音（id 固定，方便神奇移动）
  const C13 = [['c', 'C4', 1], ['e', 'E4', 3], ['g', 'G4', 5], ['bb', 'Bb4', 7], ['d', 'D5', 9], ['f', 'F5', 11], ['a', 'A5', 13]];
  // 横排（分解和弦）的位置：8 个位置，留出第 8 个给「15」
  const ROW = i => -0.3 + i * 0.48;
  const NAMES = {C4: 'C', E4: 'E', G4: 'G', Bb4: 'B♭', D5: 'D', F5: 'F', A5: 'A', C6: 'C'};
  // 横排的 C13：labels = 每个音下方的文字（null = 不写）
  const row = (count, {labels = null, colors = null, extra = []} = {}) => ({
    tones: C13.slice(0, count).map(([id, key], i) => tone(id, key, {slot: ROW(i), color: colors ? colors[i] : COLOR.ink})).concat(extra),
    staffLabels: labels ? labels.slice(0, count).flatMap((text, i) => text === null ? [] : [{slot: ROW(i), text: String(text), color: colors ? colors[i] : '#334155'}]) : [],
    tap: 'note'
  });
  const DEG = [1, 3, 5, 7, 9, 11, 13];
  const degreeColors = DEG.map(d => DEGREE_COLOR[d]);

  // 八种七和弦（第二课第 7 页的汇总，按钮切换）
  const SEVENTH = {
    dom7:  {name: '大小七和弦（属七）', abbr: '7', keys: ['C4', 'E4', 'G4', 'Bb4']},
    maj7:  {name: '大七和弦', abbr: 'maj7', keys: ['C4', 'E4', 'G4', 'B4']},
    m7:    {name: '小七和弦', abbr: 'm7', keys: ['C4', 'Eb4', 'G4', 'Bb4']},
    dim7:  {name: '减七和弦', abbr: '°7', keys: ['C4', 'Eb4', 'Gb4', 'Bbb4']},
    half:  {name: '半减七和弦', abbr: 'ø7', keys: ['C4', 'Eb4', 'Gb4', 'Bb4']},
    mM7:   {name: '小大七和弦', abbr: 'm(maj7)', keys: ['C4', 'Eb4', 'G4', 'B4']},
    aug7:  {name: '增七和弦', abbr: '+7', keys: ['C4', 'E4', 'G#4', 'Bb4']},
    augM7: {name: '增大七和弦', abbr: 'maj7(♯5)', keys: ['C4', 'E4', 'G#4', 'B4']}
  };
  const EIGHT = [['dom7', '大小七'], ['maj7', '大大七'], ['m7', '小小七'], ['dim7', '减减七'], ['half', '减小七'], ['mM7', '小大七'], ['aug7', '增小七'], ['augM7', '增大七']];
  const ROLE = ['root', 'third', 'fifth', 'seventh'];

  /* ---------- 面板（不需要谱表的步骤） ---------- */
  const playIcon = '<svg class="play-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12z"/></svg>';
  const PANEL = {
    // 长的记号（如 Cmaj13(♯5)）缩小一号，免得超出演示区
    symbol: (root, suffix, bass = '') => ({key: `symbol-${root}${suffix}${bass}`, html: `<p class="symbol-row big${(suffix + bass).length > 5 ? ' long' : ''}">${cs(root, suffix, bass)}</p>`}),
    // 每一行是一个播放按钮
    degrees: {key: 'degrees', html: '<div class="play-rows">' + [
      ['9', '1 3 5 7 <b>9</b>', 'C4 E4 G4 Bb4 D5'],
      ['11', '1 3 5 7 <b>9 11</b>', 'C4 E4 G4 Bb4 D5 F5'],
      ['13', '1 3 5 7 <b>9 11 13</b>', 'C4 E4 G4 Bb4 D5 F5 A5']
    ].map(([n, degrees, keys]) => `<button class="play-row" type="button" data-play="${keys}" aria-label="播放 C${n}">${cs('C', n)}<span class="play-degrees">${degrees}</span>${playIcon}</button>`).join('') + '</div>'},
    // 记号拆成三块：根音、七和弦的性质、叠到哪里
    split: {key: 'split', html: '<div class="symbol-split" role="img" aria-label="Cm13：C 是根音，m 是小七和弦，13 是叠到十三音">' +
      '<div class="symbol-part part-root"><span class="symbol-glyph">C</span><span class="symbol-role">根音</span></div>' +
      '<div class="symbol-part part-quality"><span class="symbol-glyph">m</span><span class="symbol-role">小七和弦</span></div>' +
      '<div class="symbol-part part-num"><span class="symbol-glyph">13</span><span class="symbol-role">叠到十三音</span></div></div>'},
    // 八种七和弦 → 九和弦
    eight: {key: 'eight', html: '<div class="compare-table dense" role="table" aria-label="八种七和弦与九和弦的记号" style="--cols: 1fr 1fr">' +
      '<div class="compare-row compare-head" role="row"><span role="columnheader">七和弦</span><span role="columnheader">九和弦</span></div>' +
      [['maj7', 'maj9'], ['m7', 'm9'], ['7', '9'], ['m(maj7)', 'm(maj9)'], ['ø7', 'ø9', 'm9(♭5)'], ['°7', '°9'], ['+7', '+9', '9(♯5)'], ['maj7(♯5)', 'maj9(♯5)']]
        .map(([a, b, other]) => `<div class="compare-row" role="row"><span role="cell">${cs('C', a)}</span><span role="cell">${cs('C', b)}${other ? `<span class="c-faint">　${cs('C', other)}</span>` : ''}</span></div>`).join('') + '</div>'},
    omitSummary: {key: 'omit-summary', html: '<div class="summary-card">' +
      '<div><h4>不能省略</h4>决定和弦性质的音：根音、三音、七音、记号上写出的延伸音；减五度或增五度的五音</div>' +
      '<div><h4>常常省略</h4>纯五度的五音；十一和弦、十三和弦里的九音</div>' +
      '<div><h4>常见的处理</h4>含有大三度的十一和弦省略三音，十三和弦省略十一音</div>' +
      '<div><h4>其他情况</h4>根据风格、编制和演奏条件来决定</div></div>'},
    method: {key: 'method', html: '<div class="summary-card"><div><ol>' +
      ['先假设低音是根音，把每个音相对于它的音程标出来', '看结构：有没有三音、七音；延伸音是不是 M9、P11、M13；缺的音符不符合省略的规律',
       '低音上方一个八度以内有二度、四度、六度时，换一个音当根音再标一遍', '延伸音尽量是根音上方的复音程']
        .map(text => `<li>${text}</li>`).join('') + '</ol></div></div>'}
  };

  /* ---------- 场景 ---------- */
  const SCENE = {
    /* 一、构成 */
    seventhRow: {tones: C13.slice(0, 4).map(([id, key], i) => tone(id, key, {slot: i})), tap: 'note',
      brackets: [{from: 0, to: 2, text: 'C', drop: -4, id: 'br-c'}, {from: 0, to: 3, text: 'C7', drop: 18, id: 'br-c7'}]},
    thirdsRow: {...row(7), intervals: [['c', 'e', 'M3'], ['e', 'g', 'm3'], ['g', 'bb', 'm3'], ['bb', 'd', 'M3'], ['d', 'f', 'm3'], ['f', 'a', 'M3']]},
    degreeRow: row(7, {labels: DEG, colors: degreeColors}),
    extRow: row(7, {labels: DEG, colors: DEG.map(d => d > 7 ? COLOR.ext : FAINT)}),
    // 九、十一、十三和弦并排；C13 用横排同样的 id，从横排收拢成柱式
    three: {tones: [
      ...block(C13.slice(0, 5).map(([id, key]) => [id, key]), 0.2, 'n9-'),
      ...block(C13.slice(0, 6).map(([id, key]) => [id, key]), 1.5, 'n11-'),
      ...block(C13.map(([id, key]) => [id, key]), 2.8)
    ], staffLabels: [{slot: 0.2, text: '九和弦'}, {slot: 1.5, text: '十一和弦'}, {slot: 2.8, text: '十三和弦'}], tap: 'chord'},
    names: row(7, {labels: C13.map(([, key]) => NAMES[key])}),
    fifteenth: {...row(7, {labels: C13.map(([, key]) => NAMES[key]), extra: [tone('c15', 'C6', {slot: ROW(7), color: FAINT, mute: false})]}),
      staffLabels: [...C13.map(([, key], i) => ({slot: ROW(i), text: NAMES[key], color: '#334155'})), {slot: ROW(7), text: '15', color: FAINT}],
      caption: '15 度音 ＝ 高两个八度的根音 C'},
    quizC: {tones: [tone('c', 'C4', {color: COLOR.root, label: '1'})], tap: 'note'},

    /* 二、音程性质 */
    compound: row(7, {labels: DEG, colors: degreeColors}),
    simple: {...row(7, {labels: DEG, colors: degreeColors}), staffLabels: [
      ...DEG.map((d, i) => ({slot: ROW(i), text: String(d), color: DEGREE_COLOR[d]})),
      ...[['2', 4], ['4', 5], ['6', 6]].map(([text, i]) => ({slot: ROW(i), text, color: FAINT, drop: -16}))]},
    quality: {...row(7, {labels: ['1', '3', '5', '7', 'M9', 'P11', 'M13'], colors: degreeColors})},
    scale: {tones: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'].map((key, i) => tone('s' + i, key, {slot: ROW(i) + 0.2, color: [1, 3, 5].includes(i) ? COLOR.ink : FAINT})),
      staffLabels: [[1, '2'], [3, '4'], [5, '6']].map(([i, text]) => ({slot: ROW(i) + 0.2, text, color: COLOR.ext})), caption: 'C 大调音阶', tap: 'note',
      offsets: [0, 1, 2, 3, 4, 5, 6].map(i => i * 0.35)},  // 点空白处：按顺序弹音阶
    minor: {tones: block([['c', 'C4', '1', COLOR.root], ['eb', 'Eb4', 'm3', COLOR.third], ['g', 'G4', 'P5', COLOR.fifth], ['bb', 'Bb4', 'm7', COLOR.seventh],
      ['d', 'D5', 'M9', COLOR.ext], ['f', 'F5', 'P11', COLOR.ext], ['a', 'A5', 'M13', COLOR.ext]]), caption: 'Cm7 ＋ D、F、A', tap: 'note'},
    bNinth: {tones: block([['b', 'B3', '1', COLOR.root], ['ds', 'D#4', 'M3', COLOR.third], ['fs', 'F#4', 'P5', COLOR.fifth], ['a', 'A4', 'm7', COLOR.seventh], ['cs', 'C#5', 'M9', COLOR.ext]]),
      caption: 'B → C♯：M9', tap: 'note'},
    ninthVoicing: {grand: true, tones: block([['c', 'C3', '1', COLOR.root], ['g', 'G3', 'P5', COLOR.fifth], ['e', 'E4', 'M3', COLOR.third], ['bb', 'Bb4', 'm7', COLOR.seventh], ['d', 'D5', 'M9', COLOR.ext]]),
      octaves: [{id: 'c'}], caption: '虚线框：C3 往上一个八度', tap: 'note'},
    d7: {tones: block([['d', 'D4'], ['fs', 'F#4'], ['a', 'A4'], ['c', 'C5']]), staffSymbols: [sym('D', '7')], tap: 'chord'},
    e7: {tones: block([['e', 'E4'], ['gs', 'G#4'], ['b', 'B4'], ['d', 'D5']]), staffSymbols: [sym('E', '7')], tap: 'chord'},

    /* 三、标记 */
    pick: id => ({tones: block(SEVENTH[id].keys.map((key, i) => [ROLE[i], key])), staffSymbols: [sym('C', SEVENTH[id].abbr)],
      caption: SEVENTH[id].name, controls: EIGHT, pressed: id, play: true}),
    // 带三度台阶的和弦：notes = [[id, 音], …]
    laddered: (notes, symbol, {slot = CENTER, box = false, size, prefix = ''} = {}) => ({
      tones: block(notes, slot, prefix), ladders: [{ids: notes.map(([id]) => prefix + id), box, id: `ladder-${prefix}`}],
      staffSymbols: [sym('C', symbol, slot, size ? {size} : {})], tap: 'chord'}),
    pair: (left, right, symbols) => {
      const a = SCENE.laddered(left, symbols[0], {slot: PAIR[0], size: 16, prefix: 'l-'}), b = SCENE.laddered(right, symbols[1], {slot: PAIR[1], size: 16, prefix: 'r-'});
      return {tones: [...a.tones, ...b.tones], ladders: [...a.ladders, ...b.ladders], staffSymbols: [...a.staffSymbols, ...b.staffSymbols], tap: 'chord'};
    },
    m7Cm11: {tones: block([['c', 'C4'], ['eb', 'Eb4'], ['g', 'G4'], ['bb', 'Bb4'], ['d', 'D5'], ['f', 'F5']]),  // 九音保留：省略到第五节才讲
      staffSymbols: [{slot: CENTER, stack: [['C', 'm11'], ['C', 'm7(11)']]}], caption: '两种写法，推荐上面的 Cm11', tap: 'chord'},

    /* 四、构建 */
    ebMaj7: {tones: block([['eb', 'Eb4', '', COLOR.root], ['g', 'G4'], ['bb', 'Bb4'], ['d', 'D5']]), staffSymbols: [sym('E♭', 'maj7')], tap: 'chord'},
    ebMaj9: {tones: block([['eb', 'Eb4', '', COLOR.root], ['g', 'G4'], ['bb', 'Bb4'], ['d', 'D5'], ['f', 'F5', 'M9', COLOR.ext]]),
      staffSymbols: [sym('E♭', 'maj9')], tap: 'chord'},
    am7: {tones: block([['a', 'A3', '', COLOR.root], ['c', 'C4'], ['e', 'E4'], ['g', 'G4']]), staffSymbols: [sym('A', 'm7')], tap: 'chord'},
    am11: {tones: block([['a', 'A3', '', COLOR.root], ['c', 'C4'], ['e', 'E4'], ['g', 'G4'], ['b', 'B4', 'M9', COLOR.ext], ['d', 'D5', 'P11', COLOR.ext]]),
      staffSymbols: [sym('A', 'm11')], tap: 'chord'},
    d7Build: {tones: block([['d', 'D4', '', COLOR.root], ['fs', 'F#4'], ['a', 'A4'], ['c', 'C5']]), staffSymbols: [sym('D', '7')], tap: 'chord'},
    d13: {tones: block([['d', 'D4', '', COLOR.root], ['fs', 'F#4'], ['a', 'A4'], ['c', 'C5'], ['e', 'E5', 'M9', COLOR.ext], ['g', 'G5', 'P11', COLOR.ext], ['b', 'B5', 'M13', COLOR.ext]]),
      staffSymbols: [sym('D', '13')], tap: 'chord'},

    /* 五、省略（大谱表） */
    dense13: {tones: block(C13.map(([id, key]) => [id, key])), staffSymbols: [sym('C', '13')], tap: 'chord'},
    fullVsCore: {grand: true, tones: [
      ...block([['c', 'C3'], ['e', 'E4'], ['g', 'G4'], ['bb', 'Bb4'], ['d', 'D5'], ['f', 'F5'], ['a', 'A5']], PAIR[0], 'l-'),
      ...block([['c', 'C3'], ['e', 'E4'], ['bb', 'Bb4'], ['a', 'A5']], PAIR[1], 'r-')],
      staffLabels: [{slot: PAIR[0], text: '完整七个音'}, {slot: PAIR[1], text: '1、3、7、13'}], tap: 'chord'},
    core13: {grand: true, tones: [
      ...block([['c', 'C3'], ['e', 'E4'], ['bb', 'Bb4'], ['a', 'A5']], CENTER, 'r-'),
      ...block([['g', 'G4', '', FAINT, {mute: true}], ['d', 'D5', '', FAINT, {mute: true}], ['f', 'F5', '', FAINT, {mute: true}]], CENTER, 'r-')],
      staffSymbols: [sym('C', '13')], caption: '灰色：省略的五音、九音、十一音', tap: 'chord'},
    keep13: {grand: true, tones: block([['c', 'C3', '', COLOR.root], ['e', 'E4', '', COLOR.third], ['g', 'G4', '', FAINT], ['bb', 'Bb4', '', COLOR.seventh],
      ['d', 'D5', '', FAINT], ['f', 'F5', '', FAINT], ['a', 'A5', '', COLOR.ext]], CENTER, 'r-'), staffSymbols: [sym('C', '13')],
      caption: '彩色：决定和弦性质的音', tap: 'chord'},
    fifth: {grand: true, tones: [
      ...block([['c', 'C3'], ['e', 'E4'], ['g', 'G4', 'P5', COLOR.fifth], ['b', 'B4'], ['d', 'D5']], PAIR[0], 'l-'),
      ...block([['c', 'C3'], ['e', 'E4'], ['g', 'G4', '', FAINT, {mute: true}], ['b', 'B4'], ['d', 'D5']], PAIR[1], 'r-')],
      staffSymbols: [sym('C', 'maj9', PAIR[0], {size: 16}), sym('C', 'maj9', PAIR[1], {size: 16})],
      staffLabels: [{slot: PAIR[0], text: '有五音'}, {slot: PAIR[1], text: '省略五音'}], tap: 'chord'},
    sharpFifth: {grand: true, tones: [
      ...block([['c', 'C3'], ['e', 'E4'], ['gs', 'G#4', 'A5', COLOR.fifth], ['b', 'B4'], ['d', 'D5']], PAIR[0], 'l-'),
      ...block([['c', 'C3'], ['e', 'E4'], ['b', 'B4'], ['d', 'D5']], PAIR[1], 'r-')],
      staffSymbols: [sym('C', 'maj9(♯5)', PAIR[0], {size: 15}), sym('C', 'maj9', PAIR[1], {size: 15})],
      staffLabels: [{slot: PAIR[0], text: '有增五度'}, {slot: PAIR[1], text: '没有五音'}], caption: '去掉 G♯，记号也变了', tap: 'chord'},
    ninthOmit: {grand: true, tones: [
      ...block([['c', 'C3'], ['g', 'G3'], ['eb', 'Eb4'], ['bb', 'Bb4'], ['d', 'D5', '9', COLOR.ext]], PAIR[0], 'l-'),
      ...block([['c', 'C3'], ['g', 'G3'], ['eb', 'Eb4'], ['bb', 'Bb4'], ['d', 'D5', '', FAINT, {mute: true}], ['f', 'F5', '11', COLOR.ext]], PAIR[1], 'r-')],
      staffSymbols: [sym('C', 'm9', PAIR[0], {size: 16}), sym('C', 'm11', PAIR[1], {size: 16})],
      staffLabels: [{slot: PAIR[0], text: '九音不能省'}, {slot: PAIR[1], text: '九音省略'}], tap: 'chord'},
    clash: {grand: true, tones: block([['c', 'C3', '', FAINT, {mute: true}], ['e', 'E4'], ['g', 'G4', '', FAINT, {mute: true}], ['b', 'B4', '', FAINT, {mute: true}],
      ['d', 'D5', '', FAINT, {mute: true}], ['f', 'F5']]), arcs: [{from: 'e', to: 'f', text: 'm9', color: COLOR.bass}],
      staffSymbols: [sym('C', 'maj11', CENTER, {color: FAINT})], caption: '只听 E 和 F', tap: 'chord'},
    avoid: {grand: true, tones: [
      ...block([['c', 'C3'], ['e', 'E4'], ['g', 'G4'], ['bb', 'Bb4'], ['d', 'D5'], ['f', 'F5', '', COLOR.bass], ['a', 'A5']], 0.15, 'a-'),
      ...block([['c', 'C3'], ['e', 'E4'], ['g', 'G4'], ['bb', 'Bb4'], ['d', 'D5'], ['f', 'F5', '', FAINT, {mute: true}], ['a', 'A5']], 1.05, 'b-'),
      ...block([['c', 'C3'], ['e', 'E4', '', COLOR.bass], ['g', 'G4'], ['bb', 'Bb4'], ['d', 'D5'], ['f', 'F5']], 2.1, 'c-'),
      ...block([['c', 'C3'], ['e', 'E4', '', FAINT, {mute: true}], ['g', 'G4'], ['bb', 'Bb4'], ['d', 'D5'], ['f', 'F5']], 3.0, 'd-')],
      staffSymbols: [sym('C', '13', 0.15, {size: 14}), sym('C', '13', 1.05, {size: 14}), sym('C', '11', 2.1, {size: 14}), sym('C', '11', 3.0, {size: 14})],
      staffLabels: [{slot: 0.15, text: '有 11'}, {slot: 1.05, text: '省 11'}, {slot: 2.1, text: '有 3'}, {slot: 3.0, text: '省 3'}], tap: 'chord'},
    minor11: {grand: true, tones: block([['c', 'C3'], ['g', 'G3'], ['eb', 'Eb4', '', COLOR.third], ['bb', 'Bb4'], ['d', 'D5'], ['f', 'F5', '', COLOR.ext]]),
      arcs: [{from: 'eb', to: 'f', text: 'M9'}], staffSymbols: [sym('C', 'm11')], tap: 'chord'},
    color: {grand: true, tones: block([['c', 'C3'], ['e', 'E4', '', COLOR.bass], ['f', 'F4', '', COLOR.bass], ['g', 'G4'], ['bb', 'Bb4']]),
      staffSymbols: [sym('C', '11')], caption: '三音和十一音一起：特殊色彩', tap: 'chord'},
    satb: {grand: true, tones: block([['c', 'C3', 'B'], ['bb', 'Bb3', 'T'], ['e', 'E4', 'A'], ['a', 'A4', 'S']]),
      staffSymbols: [sym('C', '13')], caption: '四个声部：C、E、B♭、A', tap: 'chord'},
    band: {grand: true, tones: block([['c', 'C2', '贝斯', COLOR.ink, {instrument: 'bass'}], ['e', 'E4', '钢琴'], ['a', 'A4'], ['bb', 'Bb4']]),
      staffSymbols: [sym('C', '13')], caption: '钢琴：E、A、B♭　贝斯：C', tap: 'chord'},
    cmaj13s5: {grand: true, tones: block([['c', 'C3'], ['e', 'E4'], ['gs', 'G#4'], ['b', 'B4'], ['d', 'D5'], ['f', 'F5'], ['a', 'A5']]), staffSymbols: [sym('C', 'maj13(♯5)', CENTER, {size: 17})], tap: 'chord'},

    /* 六、匹配记号（大谱表） */
    dm9: (labels = {}, symbol = false, caption = '') => ({grand: true,
      tones: [['d', 'D3'], ['c1', 'C4', {staff: 'bass'}], ['f', 'F4'], ['a', 'A4'], ['c2', 'C5'], ['e', 'E5']].map(([id, key, extra = {}]) => tone(id, key, {...extra, ...(labels[id] || {})})),
      staffSymbols: symbol ? [sym('D', 'm9')] : [], caption, tap: 'note'}),
    aug11: (labels = {}, symbol = false, caption = '', third = false) => ({grand: true,
      tones: [['c', 'C3'], ['gs', 'G#3'], ['b', 'B4'], ['d', 'D5'], ['f', 'F5']].map(([id, key]) => tone(id, key, labels[id] || {}))
        .concat(third ? [tone('e', 'E4', {color: FAINT, mute: true, label: 'M3'})] : []),
      staffSymbols: symbol ? [sym('C', 'maj11(♯5)', CENTER, {size: 18})] : [], caption, tap: 'note'}),
    fmaj9: (labels = {}, {symbol = false, caption = '', octave = false, arc = false} = {}) => ({grand: true,
      tones: [['c', 'C3'], ['f', 'F3'], ['a', 'A3'], ['e', 'E4'], ['g', 'G4']].map(([id, key]) => tone(id, key, labels[id] || {})),
      octaves: octave ? [{id: 'c'}] : [], arcs: arc ? [{from: 'f', to: 'g', text: 'M9', side: 'right'}] : [],
      staffSymbols: symbol ? [sym('F', 'maj9', CENTER, {bass: 'C'})] : [], caption, tap: 'note'}),
    // 例四：左 F3 | A♭3 C4 E4 D5，右 F3 | D4 A♭4 C5 E5
    fLeft: (labels = {}, {slot = CENTER, symbol = false, arc = false} = {}) => ({
      tones: [['f', 'F3'], ['ab', 'Ab3'], ['c', 'C4'], ['e', 'E4'], ['d', 'D5']].map(([id, key]) => tone('l-' + id, key, {slot, ...(labels[id] || {})})),
      arcs: arc ? [{from: 'l-f', to: 'l-d', text: 'M13', side: slot === CENTER ? 'left' : 'right'}] : [] /* 靠左的和弦：弧线画在右边，免得压到谱号 */, staffSymbols: symbol ? [sym('F', 'm(maj13)', slot, {size: 16})] : []}),
    fRight: (labels = {}, {symbol = false, arc = null} = {}) => ({
      tones: [['f', 'F3'], ['d', 'D4'], ['ab', 'Ab4'], ['c', 'C5'], ['e', 'E5']].map(([id, key]) => tone('r-' + id, key, {slot: PAIR[1], ...(labels[id] || {})})),
      arcs: arc === 'm6' ? [{from: 'r-f', to: 'r-d', text: 'M6', side: 'right'}] : arc === 'm9' ? [{from: 'r-d', to: 'r-e', text: 'M9', side: 'right'}] : [],
      staffSymbols: symbol ? [sym('D', 'ø9', PAIR[1], {size: 16, bass: 'F'})] : []}),
    g13Quiz: {grand: true, tones: block([['g', 'G2'], ['f', 'F3'], ['b', 'B3'], ['e', 'E4'], ['a', 'A4']]), tap: 'chord'},
    cmaj9gQuiz: {grand: true, tones: block([['g', 'G2'], ['c', 'C3'], ['e', 'E3'], ['b', 'B3'], ['d', 'D4']]), tap: 'chord'}
  };
  const both = (left, right, extra = {}) => ({grand: true, tap: 'note', tones: [...left.tones, ...right.tones], arcs: [...left.arcs, ...right.arcs],
    staffSymbols: [...left.staffSymbols, ...right.staffSymbols], ...extra});
  const L = (text, color) => ({label: text, color});

  const {steps, sections, section, group, quiz, accent, p, instruction, TF} = ChordLesson.builder();
  const tapNote = '点击谱例中的音，可以单独听。', tapChord = '点击谱例中的和弦，可以单独听。';

  // 一、延伸音和弦的构成
  section('build', '一', '延伸音和弦的构成');
  group('build', [
    [p(`第二课学过：在三和弦上再叠一个三度，就得到七和弦。`), SCENE.seventhRow, {hint: tapNote}],
    [p(`在七和弦上继续往上叠三度，还能得到${accent('新的和弦音')}。`), SCENE.thirdsRow],
    [p(`从根音数起，这三个新音是第九、第十一、第十三度音，分别叫九音、十一音、十三音。`), SCENE.degreeRow],
    [p(`这三个音叫<strong>延伸音（Extension）</strong>，含有延伸音的和弦叫<strong>延伸音和弦（Extension Chord）</strong>。`), SCENE.extRow],
    [p(`叠到九音的叫<strong>九和弦（Ninth Chord）</strong>，叠到十一音的叫<strong>十一和弦（Eleventh Chord）</strong>，叠到十三音的叫<strong>十三和弦（Thirteenth Chord）</strong>。`), SCENE.three, {hint: tapChord}],
    [p(`叠到十三音，七个和弦音刚好用完${accent('七个不同的音名')}。`), SCENE.names],
    [p(`再往上叠一个三度，得到的是高两个八度的根音，不会再有新的音，因此不会再有十五和它以上的延伸音和弦。`), SCENE.fifteenth]
  ]);
  quiz('eleventh', SCENE.quizC, {
    question: 'C 和弦从根音数起的第十一度音是：',
    options: [['D', 'D'], ['F', 'F'], ['A', 'A']], answer: 'F',
    right: '正确。从 C 往上数到第十一度：C D E F G A B C D E F。',
    wrong: '从 C 往上数到第十一度：C D E F G A B C D E F。'
  });

  // 二、延伸音的音程性质
  section('quality', '二', '延伸音的音程性质');
  group('quality', [
    [p(`九度、十一度、十三度，就是二度、四度、六度对应的${accent('复音程')}度数。`), SCENE.simple],
    [p(`和弦里延伸音的音程性质默认是固定的：九音是大九度，十一音是纯十一度，十三音是大十三度。`), SCENE.quality],
    [p(`也可以理解为：在以根音开头的大调音阶里，它们正好是第二、四、六个音。`), SCENE.scale],
    [p(`不管是哪一种七和弦，延伸音的音程性质都一样。例如 Cm7 的九音也是 D。`), SCENE.minor],
    [p(`B 上方的大二度是 C♯，所以 B7 的九音是 C♯。`), SCENE.bNinth],
    [p(`注意：为了突出“从七音延伸出去”的概念，延伸音通常需要放在根音上方${accent('一个八度以外')}，以复音程的形式出现。“二代九”的排列相对少见。`), SCENE.ninthVoicing]
  ]);
  quiz('d13', SCENE.d7, {
    question: 'D7 的十三音是：',
    options: [['B', 'B'], ['Bb', 'B♭'], ['C', 'C']], answer: 'B',
    right: '正确。D 上方的大六度是 B，所以 D 的大十三度也是 B。',
    wrong: '十三音是大十三度：先找 D 上方的大六度。'
  });
  quiz('e13', SCENE.e7, {
    question: 'E7 的十三音是：',
    options: [['C', 'C'], ['C#', 'C♯'], ['D', 'D']], answer: 'C#',
    right: '正确。E 上方的大六度是 C♯，所以 E 的大十三度也是 C♯。',
    wrong: 'E 到 C 是小六度。十三音要的是大六度（加八度）。'
  });

  // 三、延伸音和弦的标记
  section('symbols', '三', '延伸音和弦的标记');
  const maj7 = [['c', 'C4'], ['e', 'E4'], ['g', 'G4'], ['b', 'B4']], maj9 = [...maj7, ['d', 'D5']];
  const m7 = [['c', 'C4'], ['e', 'Eb4'], ['g', 'G4'], ['bb', 'Bb4']], dom7 = [['c', 'C4'], ['e', 'E4'], ['g', 'G4'], ['bb', 'Bb4']];
  const upTo = n => C13.slice(0, [7, 9, 11, 13].indexOf(n) + 4).map(([id, key]) => [id, key]);
  group('symbols', [
    [p(`延伸音和弦都是在七和弦的基础上产生的。`), SCENE.pick('dom7'), {hint: '点击演示区的按钮，回忆八种七和弦。'}],
    [p(`延伸音和弦的记号，就是把七和弦记号里的 7 换成${accent('延伸音的数字')}。例如Cmaj7 → Cmaj9。`),
      [SCENE.laddered(maj7, 'maj7'), SCENE.laddered(maj9, 'maj9')], {sequence: 1200}],
    [p(`再例如 Cm7 → Cm9，C7 → C9。`),
      [SCENE.pair(m7, dom7, ['m7', '7']), SCENE.pair([...m7, ['d', 'D5']], [...dom7, ['d', 'D5']], ['m9', '9'])], {sequence: 1200}],
    [p(`换成 11、13 也一样。`), [7, 9, 11, 13].map(n => SCENE.laddered(upTo(n), String(n))), {sequence: 1100}],
    [p(`记号里的数字，说明这个和弦从根音往上叠三度，${accent('一直叠到了哪个音')}。`), SCENE.laddered(upTo(13), '13', {box: true})],
    [p(`叠到 13，中间经过的 9 和 11 也都在和弦里，只是记号上不写出来。`), {panel: PANEL.degrees}, {hint: '点击每一行，可以听这个和弦。'}],
    [p(`记号可以分成三部分看：根音、七和弦的性质、叠到哪里。`), {panel: PANEL.split}],
    [p(`直接替换八种七和弦里的 7，就可以得到对应的延伸音和弦。`) + instruction('例外：减七和弦的十三音和七音是等音（C°7 的 B𝄫 与 A），所以原则上没有减十三和弦。'), {panel: PANEL.eight}],
    [p(`有时也会看到 Cm7(11) 这样的写法，表示在小七和弦上加十一音。它不如 Cm11 简洁，所以一般${accent('更推荐用 Cm11')}表示延伸音和弦。`), SCENE.m7Cm11]
  ]);
  quiz('c9-seventh', {panel: PANEL.symbol('C', '9')}, {
    question: 'C9 的七音是：',
    options: [['B', 'B'], ['Bb', 'B♭'], ['D', 'D']], answer: 'Bb',
    right: '正确。C9 是在 C7 上叠出九音，七音还是 C7 的 B♭。',
    wrong: 'C9 的 9 换掉的是 C7 的 7。C7 的七音是什么？'
  });
  quiz('from-seventh', {panel: PANEL.symbol('C', 'maj13(♯5)')}, {
    question: 'Cmaj13(♯5) 是从哪一种七和弦延伸出来的？',
    options: [['maj7', '大七和弦'], ['aug7', '增七和弦'], ['augM7', '增大七和弦']], answer: 'augM7',
    right: '正确。把 13 换回 7：Cmaj7(♯5)，是增大七和弦。',
    wrong: '把 13 换回 7，看看得到的是哪一种七和弦的记号。'
  });

  // 四、根据记号构建和弦
  section('construct', '四', '根据记号构建和弦');
  group('construct', [
    [p(`看到延伸音和弦的记号，可以分两步写出和弦音。`), {panel: PANEL.symbol('E♭', 'maj9')}],
    [p(`第一步：把数字换回 7，先写出七和弦。E♭maj9 → E♭maj7：E♭、G、B♭、D。`), SCENE.ebMaj7],
    [p(`第二步：${accent('从根音直接找')}延伸音。九音是根音上方的大九度：E♭ 的大九度是 F。`), SCENE.ebMaj9, {hint: tapChord}],
    [p(`再看一个：Am11。先写出 Am7：A、C、E、G，再从 A 找出大九度 B 和纯十一度 D。`), [SCENE.am7, SCENE.am11], {sequence: 1200}],
    [p(`D13：先写出 D7（D、F♯、A、C），再从 D 找出大九度 E、纯十一度 G、大十三度 B。`), [SCENE.d7Build, SCENE.d13], {sequence: 1200}]
  ]);
  quiz('bbm9', {panel: PANEL.symbol('B♭', 'm9')}, {
    question: 'B♭m9 的和弦音是：',
    options: [['right', 'B♭–D♭–F–A♭–C'], ['maj7', 'B♭–D♭–F–A–C'], ['flat9', 'B♭–D♭–F–A♭–C♭']], answer: 'right',
    right: '正确。先写出 B♭m7：B♭、D♭、F、A♭；B♭ 的大九度是 C。',
    wrong: '先写出 B♭m7，再找 B♭ 上方的大九度。'
  });

  // 五、省略
  section('omit', '五', '省略');
  group('why', [
    [p(`十三和弦有七个音，实际应用时一般不会让它们全部同时出声。`), SCENE.dense13, {hint: tapChord}],
    [p(`听一听：完整的 C13，和只有根音、三音、七音、十三音的 C13。`), SCENE.fullVsCore],
    [p(`省略之后，仍然标记为 C13。数字只说明延伸音叠到了哪里，${accent('不要求每个音都出现')}。`), SCENE.core13],
    [p(`决定和弦性质的音不能省略。它们一般是和弦的根音、三音、七音，以及记号上写出来的延伸音。`), SCENE.keep13]
  ]);
  group('fifth', [
    [p(`五音：大七、属七、小七、小大七这四种和弦的五音是纯五度。根音的泛音里本来就含有它，省略后听感变化不大，所以${accent('经常被省略')}。`), SCENE.fifth],
    [p(`注意：减七、半减七、增七、增大七的五音是减五度或增五度，是这些和弦的特征，${accent('通常不能省略')}。`), SCENE.sharpFifth],
    [p(`九音和十一音：九和弦里，九音是记号上写出来的延伸音，不能省略；到了十一和弦、十三和弦，九音不再写在记号上，常常被省略。十三和弦里的十一音也是这样。`), SCENE.ninthOmit]
  ]);
  group('eleventh', [
    [p(`十一音和大三度同时发声时，会形成尖锐的${accent('小九度')}。`), SCENE.clash],
    [p(`所以在含有大三度的和弦（大七、属七、增七、增大七）里，十一音被称为<strong>避免音（Avoid Note）</strong>，通常会避开它和三音的直接碰撞：十三和弦常省略十一音；十一和弦的十一音写在记号上，不能省，所以常省略三音。`), SCENE.avoid],
    [p(`含有小三度的和弦（小七、小大七、半减七、减七）里，十一音和三音相距大九度，不冲突，十一音可以保留。这时三音是区分大小的关键，${accent('不能省略')}。`), SCENE.minor11],
    [p(`这些是流行和爵士和声里的常见做法，但${accent('并不绝对')}。有的作品会特意保留三音和十一音的碰撞，作为一种特殊色彩。`), SCENE.color]
  ]);
  group('context', [
    [p(`真正「必须省略」的情况，来自演奏条件的限制：例如四部合唱只有四个声部，钢琴、吉他受手指和琴弦的限制，某些风格要求声音简洁。`), SCENE.satb],
    [p(`编曲时，每件乐器不一定弹完整的和弦。例如爵士钢琴有时不弹根音，因为贝斯在弹；从整体音乐来看，和弦仍然是完整的。`), SCENE.band],
    [p(`总结一下省略的规律。`), {panel: PANEL.omitSummary}]
  ]);
  quiz('keep', SCENE.cmaj13s5, {
    question: 'Cmaj13(♯5) 中，哪些音不能省略？',
    options: [['C', 'C'], ['E', 'E'], ['G#', 'G♯'], ['B', 'B'], ['D', 'D'], ['F', 'F'], ['A', 'A']], answer: ['C', 'E', 'G#', 'B', 'A'],
    right: '正确。根音、三音、七音、增五度的五音，以及记号上写出的十三音都不能省；九音 D、十一音 F 可以省略。',
    wrong: '想一想：哪些音决定和弦的性质？记号上写出的延伸音是哪一个？增五度能不能省？'
  });
  quiz('seventh', {panel: PANEL.symbol('C', '13')}, {
    question: '延伸音和弦的七音一定不能省略。',
    options: TF, answer: 'true',
    right: '正确。延伸音和弦都是在七和弦上叠出来的；没有七音，就不是延伸音和弦了。',
    wrong: '回想第一节：延伸音和弦是在什么和弦上叠出来的？'
  });

  // 六、给和弦匹配记号
  section('match', '六', '给和弦匹配记号');
  const R = COLOR.root, T3 = COLOR.third, F5 = COLOR.fifth, S7 = COLOR.seventh, X = COLOR.ext;
  const dmLabels = {d: L('1', R), c1: L('m7', S7), f: L('m3', T3), a: L('P5', F5), c2: L('m7', S7)};
  group('example1', [
    [p(`反过来，看到一组音，怎样写出记号？`), SCENE.dm9(), {hint: tapNote}],
    [p(`先假设低音 D 是根音，在草稿上把每个音相对于 D 的音程标出来。`), SCENE.dm9({d: L('1', R)})],
    [p(`和弦音按${accent('八度以内')}的音程标，不管它高了几个八度：C 标 m7，F 标 m3，A 标 P5，高八度的 C 也标 m7。`), SCENE.dm9(dmLabels)],
    [p(`给延伸音标上 9、11、13。`), SCENE.dm9({...dmLabels, e: L('M9', X)})],
    [p(`整理一下：m3、P5、m7 组成小七和弦，再加一个 M9，七音 C 重复了一次。`), SCENE.dm9({...dmLabels, e: L('M9', X)}, false, '1　m3　P5　m7　M9（m7 重复）')],
    [p(`所以这是 ${accent('Dm9')}。`), SCENE.dm9({...dmLabels, e: L('M9', X)}, true)]
  ]);
  const augLabels = {c: L('1', R), gs: L('A5', F5), b: L('M7', S7), d: L('M9', X), f: L('P11', X)};
  group('example2', [
    [p(`再看一个和弦。`), SCENE.aug11()],
    [p(`一样先从低音 C 开始标：G♯ 标 A5，B 标 M7，D 标 M9，F 标 P11。`), SCENE.aug11(augLabels)],
    [p(`整理后是 1、A5、M7、M9、P11，${accent('少了三音')}。`), SCENE.aug11(augLabels, false, '1　？　A5　M7　M9　P11')],
    [p(`增五度只出现在增三和弦里，增三和弦的三音是大三度。上一节也学过：十一和弦里的大三度常被省略，小三度不能省略。`), SCENE.aug11(augLabels, false, '省略的三音：E（M3）', true)],
    [p(`所以这是增大七和弦叠到十一音，省略了三音：${accent('Cmaj11(♯5)')}。`), SCENE.aug11(augLabels, true, '', true)]
  ]);
  const fromC = {c: L('1', R), f: L('P4'), a: L('M6'), e: L('M3', T3), g: L('P5', F5)};
  const fromCred = {...fromC, f: L('P4', COLOR.bass), a: L('M6', COLOR.bass)};
  const fromF = {f: L('1', R), a: L('M3', T3), c: L('P5', F5), e: L('M7', S7), g: L('M9', X)};
  group('example3', [
    [p(`有些和弦，低音不是根音。`), SCENE.fmaj9()],
    [p(`如果按前面的逻辑强行以 C 为 1：F 标 P4，A 标 M6，E 标 M3，G 标 P5。`), SCENE.fmaj9(fromC)],
    [p(`标出来的结构里${accent('没有七音')}，组成不了延伸音和弦；而且 F、A 是低音上方一个八度以内的四度、六度，它们看起来并不像是合理的“延伸”音。`), SCENE.fmaj9(fromCred, {octave: true})],
    [p(`参考经验：低音上方一个八度以内出现二度、四度或六度时，大多数情况下低音不是根音，这时候建议换其它音做根音。`), SCENE.fmaj9(fromCred, {octave: true, caption: '延伸音以单音程的形式出现在了低音上方'})],
    [p(`换作 F 为根音的话：A 标 M3，C 标 P5，E 标 M7，G 标 M9。`), SCENE.fmaj9(fromF)],
    [p(`结构完整：大七和弦加九音，没有省略；G 在 F 上方一个八度以外，是${accent('复音程')}的九音。`), SCENE.fmaj9(fromF, {arc: true})],
    [p(`低音 C 是五音，所以需要用斜线标出，最终写作 ${accent('Fmaj9/C')}。`), SCENE.fmaj9(fromF, {arc: true, symbol: true})]
  ]);
  const leftF = {f: L('1', R), ab: L('m3', T3), c: L('P5', F5), e: L('M7', S7), d: L('M13', X)};
  const rightD = {d: L('1', R), f: L('m3', T3), ab: L('d5', F5), c: L('m7', S7), e: L('M9', X)};
  const leftAt = slot => SCENE.fLeft({}, {slot, symbol: true});
  group('example4', [
    [p(`有时，同一组音可能有两种甚至多种解释。例如 F、A♭、C、E、D。`), both(SCENE.fLeft(), {tones: [], arcs: [], staffSymbols: []})],
    [p(`以 F 为根音：A♭ 标 m3，C 标 P5，E 标 M7，D 标 M13。小大七和弦叠到十三音，省略九音和十一音：Fm(maj13)。`), both(SCENE.fLeft(leftF, {symbol: true, arc: true}), {tones: [], arcs: [], staffSymbols: []})],
    [p(`同样的一组音如果换一种排列。`), both(leftAt(PAIR[0]), SCENE.fRight())],
    [p(`D 出现在了 F 上方六度的位置。这时候可能需要尝试其他的根音方案。`), both(leftAt(PAIR[0]), SCENE.fRight({f: L('', COLOR.bass), d: L('', R)}, {arc: 'm6'}))],
    [p(`以 D 为根音试试看：F 标 m3，A♭ 标 d5，C 标 m7，E 标 M9。半减七和弦叠到九音，低音 F 是三音：Dø9/F。`), both(leftAt(PAIR[0]), SCENE.fRight(rightD, {symbol: true, arc: 'm9'}))],
    [p(`同一组音，两种分析都成立`),
      both(SCENE.fLeft({f: L('', R), d: L('', X)}, {slot: PAIR[0], symbol: true, arc: true}), SCENE.fRight({f: L('', COLOR.bass), d: L('', R)}, {symbol: true, arc: 'm6'}))],
    [p(`像这样的和弦是${accent('没有唯一标准答案的')}，两种写法都可以被接受。`),
      both(leftAt(PAIR[0]), SCENE.fRight({}, {symbol: true}), {staffLabels: [{slot: PAIR[0], text: '✓'}, {slot: PAIR[1], text: '✓'}]})]
  ]);
  group('summary', [
    [p(`总结分析的方法。`), {panel: PANEL.method}],
    [p(`每一个音都可以试着当根音。只要根音找对了，再复杂的和弦也能分析出来；但通常会有一两个${accent('最简洁的记号')}，作为分析结果。`),
      [SCENE.fmaj9({c: L('1?', R)}), SCENE.fmaj9({f: L('1', R)}, {symbol: true})], {sequence: 1400}]
  ]);
  quiz('g13', SCENE.g13Quiz, {
    question: '写出谱例中和弦的记号。',
    input: 'G13',
    right: '正确。以 G 为根音：B 是 M3，F 是 m7，A 是 M9，E 是 M13；五音 D 和十一音 C 省略：G13。',
    wrong: '从低音 G 开始，把每个音的音程标出来：有没有三音、七音？最高叠到了几？'
  });
  quiz('cmaj9g', SCENE.cmaj9gQuiz, {
    question: '写出谱例中和弦的记号。',
    input: 'Cmaj9/G',
    right: '正确。低音 G 上方一个八度以内有 C（P4）和 E（M6）；以 C 为根音：E 是 M3，G 是 P5，B 是 M7，D 是 M9，低音 G 是五音：Cmaj9/G。',
    wrong: '低音 G 上方一个八度以内有四度、六度：换一个音当根音试试。'
  });

  ChordLesson.run({
    steps, sections, quizLockHint: true,
    quizExtras: true, tapParts: true,  // Quiz 答对前不显示演示区说明、反馈滚进可见范围、完成页的一次答对小结
    onControl: id => SCENE.pick(id),
    inputLevel: 3,
    preload: ['bass:C2', 'C4', 'E4', 'G4', 'Bb4', 'D5', 'F5', 'A5', 'C6', 'C3', 'G3', 'Eb4', 'B4', 'D4', 'F4', 'A4', 'G#3', 'G#4', 'F3', 'A3', 'Ab3', 'Ab4', 'C5', 'E5', 'D3', 'G2', 'B3', 'E3', 'C2', 'Bb3']
  });
})();
