/* 调式与音阶 · 第二课：小调（V2，2026-11-23）
   依据 docs/scales/lesson02-script.md。同主音比较用 C、空调号加临时记号；单独谱例用小调调号。 */
(() => {
  'use strict';
  const {notes, melody, scale, toggle, cards, table, circle, lesson, C, DEGREES} = ScaleKit;
  const {section, say, q, TF, run} = lesson();
  const keyOnly = (key, caption = '') => notes([], {key, caption});
  const NAT = DEGREES.natural;

  section('intro', '导论', '小调的几种形式');
  say('大调也称**伊奥尼亚（Ionian）**，本课程继续使用「大调」这个名称。', notes(C.major, {caption: '大调 ＝ 伊奥尼亚（Ionian）'}));
  say('**自然小调（Natural Minor）**也称**爱奥利亚（Aeolian）**，本课程继续使用「自然小调」这个名称。', notes(C.natural, {caption: '自然小调 ＝ 爱奥利亚（Aeolian）'}));
  say('小调的几种常见形式，可以从第六级与第七级的变化来比较。', notes(C.natural, {hide: [5, 6], caption: '三种 C 小调的前五个音相同'}));

  section('natural', '一', '自然小调');
  say('自然小调的相邻音程排列是【全、半、全、全、半、全、全】。', notes(C.natural, {intervals: ScaleKit.steps(C.natural)}));
  say('自然小调与同主音大调相比，第三级、第六级、第七级都低半音。', toggle([
    ['C 大调', notes(C.major, {mark: [2, 5, 6]})], ['C 自然小调', notes(C.natural, {mark: [2, 5, 6]})]
  ], {pressed: 1}));
  say('音级数字前的降号，表示比【同主音大调】的相应音级低半音。', notes(C.natural, {labels: NAT, mark: [2, 5, 6]}));
  say('自然小调的音级写成【1、2、♭3、4、5、♭6、♭7】。', notes(C.natural, {labels: NAT}));
  say('音级数字前的降号，不一定对应谱面上的降号。', scale('A3', 'natural', {labels: true, mark: [2, 5, 6], caption: 'A 自然小调：C、F、G 是 ♭3、♭6、♭7，谱面上没有降号'}));
  q(notes(C.natural, {plain: true}), '自然小调与同主音大调相比，哪些音级低半音？',
    [['第三级', true], ['第二级'], ['第六级', true], ['第四级'], ['第七级', true]],
    '正确。三个不同音级写成 ♭3、♭6、♭7。', '把两条同主音音阶逐个位置对应起来。');
  q(scale('A3', 'natural', {plain: true}), 'A 自然小调的 ♭6 是哪个音？', [['F', true], ['F♯'], ['G']],
    '正确。A 大调的第六级是 F♯，低半音得到 F，所以 F 是 A 的 ♭6。', '音级的降号是与同主音大调比较的结果。');
  say('主音上方的小三度，是自然小调与大调之间的重要区别。', toggle([
    ['小三度', notes(['C4', 'Eb4'], {mark: [1], intervals: [[0, 1, 'm3']]})], ['大三度', notes(['C4', 'E4'], {intervals: [[0, 1, 'M3']]})]
  ]));
  say('自然小调的音级名称沿用大调的关系名称，但第七级另有名称。', table(['音级', '名称'],
    [['1', '主音'], ['2', '上主音'], ['♭3', '中音'], ['4', '下属音'], ['5', '属音'], ['♭6', '下中音'], ['♭7', '？']], {hi: [6]}));
  say('主音下方全音的第七级，称为**下主音（Subtonic）**。', notes(['Bb4', 'C5'], {tonic: [1], mark: [0], tags: ['下主音', '主音'], intervals: [[0, 1, '全']]}));
  say('下主音没有导音与主音之间的半音关系。', toggle([
    ['下主音', notes(['Bb4', 'C5'], {tonic: [1], mark: [0], intervals: [[0, 1, '全']]})], ['导音', notes(['B4', 'C5'], {tonic: [1], intervals: [[0, 1, '半']]})]
  ]));
  q(scale('D4', 'natural', {key: 'Dm', plain: true}), 'D 自然小调的第七级叫什么？', [['下主音', true], ['导音'], ['上主音']],
    '正确。C 在 D 下方全音，是下主音。', '先看第七级与上方主音之间是全音还是半音。');

  section('relative', '二', '关系大小调与调号');
  say('把大调的第六级作为新的主音，可以排列出与它使用同一组音的自然小调。', toggle([
    ['C 大调', scale('C4', 'major', {mark: [5]})], ['从 A 开始', scale('A3', 'natural', {labels: true})]
  ], {pressed: 1}));
  say('调号相同的大调与小调，称为**关系大小调（Relative Keys）**。', toggle([
    ['C 大调', scale('C4', 'major', {caption: '没有升降号'})], ['A 小调', scale('A3', 'natural', {caption: '没有升降号；这里比较的是大调与自然小调'})]
  ]));
  say('关系小调主音位于关系大调主音的下方小三度。', notes(['C4', 'A3'], {tonic: [], tags: ['C 大调', 'A 小调'], intervals: [[0, 1, '下方小三度']]}));
  say('小调的调号与它的关系大调相同。', toggle([
    ['E♭ 大调', scale('Eb4', 'major', {key: 'Eb'})], ['C 小调', scale('C4', 'natural', {key: 'Cm'})]
  ]));
  say('看调号找小调主音，可以先找对应的大调，再向下找小三度。', keyOnly('D', '两个升号 → D 大调 → 向下小三度 → B 小调'));
  q(scale('Eb4', 'major', {key: 'Eb', plain: true}), 'E♭ 大调的关系小调是哪个？', [['C 小调', true], ['G 小调'], ['E♭ 小调']],
    '正确。E♭ 下方小三度是 C，两者调号都是三个降号。', '要找新的主音，而不是保留原主音。');
  q(keyOnly('G'), '一个升号的调号若用于小调，对应哪个小调？', [['E 小调', true], ['G 小调'], ['F♯ 小调']],
    '正确。一个升号对应 G 大调，关系小调是 E 小调。', '先用第一课的方法找大调主音，再向下找小三度。');
  say('简谱中也有把关系小调主音记为 6 的写法，本课程始终把当前主音记为【1】。', cards([['本课程', '当前主音始终写 1'], ['另一种编号习惯', '关系小调的主音写 6']]));
  say('关系小调也可以加入五度循环，与对应的大调并排整理。', circle({showMinor: true, hi: ['C', 'a', 'G', 'e', 'D', 'b', 'F', 'd'], caption: '外圈大调，内圈关系小调'}));
  q(keyOnly('F'), 'D 小调与哪个大调共用调号？', [['F 大调', true], ['D 大调'], ['B♭ 大调']],
    '正确。F 大调与 D 小调互为关系大小调。', '找主音上方小三度的大调，再核对调号。');

  section('harmonic', '三', '和声小调');
  say('把自然小调的第七级升高半音，得到**和声小调（Harmonic Minor）**。', toggle([
    ['自然小调', notes(C.natural, {mark: [6]})], ['和声小调', notes(C.harmonic, {mark: [6]})]
  ], {pressed: 1}));
  say('和声小调写成【1、2、♭3、4、5、♭6、7】。', notes(C.harmonic, {labels: DEGREES.harmonic}));
  say('升高后的第七级位于主音下方半音，因此成为导音。', toggle([
    ['和声小调', notes(['B4', 'C5'], {tonic: [1], mark: [0], intervals: [[0, 1, '半']]})], ['自然小调', notes(['Bb4', 'C5'], {tonic: [1], intervals: [[0, 1, '全']]})]
  ]));
  say('小调中升高的第七级用临时记号写出，调号仍保留原来的小调调号。', scale('C4', 'harmonic', {key: 'Cm', mark: [6], caption: 'C 小调的三个降号保留；B 前写还原号'}));
  say('和声小调的 ♭6 与 7 之间形成【增二度】。', notes(['Ab4', 'B4'], {key: 'Cm', noTonic: true, mark: [0, 1], intervals: [[0, 1, 'A2']]}));
  q(toggle([['自然小调', notes(C.natural, {plain: true})], ['和声小调', notes(C.harmonic, {plain: true})]]), '和声小调与自然小调相比，改变哪个音级？',
    [['第七级升高半音', true], ['第六、七级都升高半音'], ['第六级升高半音']], '正确。第七级升高后，与主音形成半音关系。', '比较两条音阶的第六级和第七级。');
  q(scale('E4', 'harmonic', {key: 'Em', hide: [6], plain: true}), 'E 和声小调空缺的第七级应写什么？', [['D♯', true], ['D'], ['C♯']],
    '正确。E 自然小调的 D 升高半音得到 D♯，在调号之外加临时升号。', '找主音 E 下方半音，注意音名字母。');
  q(notes(['C5', 'D#5'], {key: 'Em', noTonic: true, plain: true}), 'E 和声小调的 C–D♯ 是什么音程？', [['增二度', true], ['小三度'], ['大二度']],
    '正确。两个音的字母相邻，按二度拼写，距离为三个半音，所以是增二度。', '音程度数先看字母关系，不能只按半音数改写名称。');

  section('melodic', '四', '旋律小调');
  say('在和声小调的基础上，把第六级也升高半音，得到本课采用的**旋律小调（Melodic Minor）**。', toggle([
    ['和声小调', notes(C.harmonic, {mark: [5]})], ['旋律小调', notes(C.melodic, {mark: [5]})]
  ], {pressed: 1}));
  say('旋律小调写成【1、2、♭3、4、5、6、7】。', notes(C.melodic, {labels: DEGREES.melodic}));
  say('旋律小调升高第六级后，原先的增二度变成全音。', toggle([
    ['和声小调', notes(['Ab4', 'B4'], {noTonic: true, mark: [0, 1], intervals: [[0, 1, 'A2']]})], ['旋律小调', notes(['A4', 'B4'], {noTonic: true, intervals: [[0, 1, 'M2']]})]
  ], {pressed: 1}));
  say('旋律小调与同主音大调相比，只有第三级低半音。', toggle([
    ['C 大调', notes(C.major, {mark: [2]})], ['C 旋律小调', notes(C.melodic, {mark: [2]})]
  ], {pressed: 1}));
  // 上下行写在同一行时较小，另设「上行」「下行」按钮放大看
  const updown = (down, opts = {}) => toggle([
    ['上行', melody('C4 D4 Eb4 F4 G4 A4 B4 C5', {key: 'Cm', time: '', tonic: [0, 7], mark: opts.plain ? [] : [5, 6], plain: opts.plain})],
    ['下行', melody(down + ' C4:h', {key: 'Cm', time: '', tonic: [0, 7], mark: opts.plain ? [] : [1, 2], plain: opts.plain})],
    ['上下行', melody('C4 D4 Eb4 F4 G4 A4 B4 C5 | ' + down.split(' ').slice(1).join(' ') + ' C4:h', {key: 'Cm', time: '', wide: 2.1, tonic: [0, 7, 14], mark: opts.plain ? [] : [5, 6, 8, 9], plain: opts.plain, cautionary: opts.cautionary ? [8, 9] : [], caption: opts.caption})]
  ], {pressed: 2});
  say('传统的旋律小调音阶练习，通常采用上行升高第六、七级、下行还原为自然小调的形式。',
    updown('C5 Bb4 Ab4 G4 F4 Eb4 D4', {cautionary: true, caption: '上行写还原号；下行回到调号的 B♭、A♭（括号为提示记号）'}));
  say('现代音乐中也常把上行的形式同时用于下行，本课程用「旋律小调」指这种上下行相同的形式。',
    updown('C5 B4 A4 G4 F4 Eb4 D4', {caption: '上下行的第六、七级都是 A、B'}));
  q(notes(C.melodic, {plain: true}), '本课程采用的旋律小调，与同主音大调相比，哪个音级不同？', [['第三级', true], ['第六级'], ['第七级']],
    '正确。第三级为 ♭3，其余音级与大调相同。', '按公式逐个与大调对应。');
  q(updown('C5 Bb4 Ab4 G4 F4 Eb4 D4', {plain: true, cautionary: true}),
    '按本课演示的传统音阶练习形式，旋律小调下行采用什么音列？', [['自然小调', true], ['与上行完全相同'], ['和声小调']],
    '正确。这种练习形式下行把第六、七级还原为自然小调，但不意味着古典作品的所有下行旋律都必须如此。', '题目限定的是刚演示的传统音阶练习形式。');
  say('三种小调的前五个音相同，差别集中在第六级与第七级。', toggle([
    ['自然', notes(C.natural, {faint: [1, 2, 3, 4], mark: [5, 6], labels: DEGREES.natural})],
    ['和声', notes(C.harmonic, {faint: [1, 2, 3, 4], mark: [5, 6], labels: DEGREES.harmonic})],
    ['旋律', notes(C.melodic, {faint: [1, 2, 3, 4], mark: [5, 6], labels: DEGREES.melodic})]
  ]));
  q(scale('D4', 'melodic', {key: 'Dm', plain: true}), '谱例符合哪一种小调？', [['旋律小调', true], ['和声小调'], ['自然小调']],
    '正确。相对 D 自然小调，第六级 B 与第七级 C♯ 都升高了。', '同时检查第六级与第七级，不能只看导音。');
  q(scale('G4', 'harmonic', {key: 'Gm', plain: true}), '谱例符合哪一种小调？', [['和声小调', true], ['旋律小调'], ['自然小调']],
    '正确。第六级仍为 E♭，只有第七级 F♯ 升高。', '第六级是否也升高了？');

  section('melody', '五', '把小调放回旋律');
  const up = (opts = {}) => melody('C4 D4 Eb4 F4 | G4 Ab4 B4 C5', {key: 'Cm', tonic: [0, 7], ...opts});
  const down = (opts = {}) => melody('C5 Bb4 Ab4 G4 | F4 Eb4 D4 C4', {key: 'Cm', tonic: [0, 7], ...opts});
  say('小调旋律中的第六级、第七级可以随旋律需要变化，不必整首固定为一种音列。', toggle([['上行句', up({mark: [5, 6]})], ['下行句', down({mark: [1, 2]})]]));
  say('分析小调片段时，可以先找主音，再观察第六级与第七级的实际写法。', toggle([
    ['上行句', up({mark: [5, 6], caption: '♭6 与 7：和声小调的用音'})], ['下行句', down({mark: [1, 2], caption: '♭7 与 ♭6：自然小调的用音'})]
  ]));
  q(melody('A3 C4 E4 D4 | B3 G#3 A3:h', {plain: true}), '已知旋律保持 A 小调主音，G♯ 向 A 进行时，G♯ 是什么音级？',
    [['升高后的第七级，也就是导音', true], ['降低的第六级'], ['第二级']], '正确。G♯ 在 A 下方半音，主音仍按题目给定为 A。', '先以题目给定的主音 A 为 1，再判断 G♯ 的位置。');
  say('同一个调号只能提供候选，主音仍需要结合旋律的组织来判断。', toggle([
    ['以 C 为中心', melody('C4 E4 G4 E4 | D4 B3 C4:h', {tonic: [0, 6], caption: 'C 大调'})],
    ['以 A 为中心', melody('A3 C4 E4 C4 | B3 D4 A3:h', {tonic: [0, 6], caption: 'A 自然小调：同样没有升降号'})]
  ]));

  section('summary', '小结', '小调');
  say('认识小调的三种常见形式，要同时比较音级变化、调号与旋律中的实际用音。', cards([
    ['自然小调', '1 2 ♭3 4 5 ♭6 ♭7'], ['和声小调', '1 2 ♭3 4 5 ♭6 7'], ['旋律小调（本课程）', '1 2 ♭3 4 5 6 7，上下行相同'],
    ['关系大小调', '共用调号；小调主音在大调主音下方小三度']]));

  run(['G#3', 'A3', 'B3', 'C4', 'D4', 'Eb4', 'E4', 'F4', 'F#4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5', 'C#5', 'D5', 'D#5', 'Eb5', 'E5', 'F#5', 'G5']);
})();
