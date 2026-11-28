/* 调式与音阶 · 第三课：教会调式（V2，2026-11-23）
   依据 docs/scales/lesson03-script.md：同主音比较 → 特征音 → 偏大偏小与亮度阶梯 → 母大调与调号 → 短旋律。
   色彩比较统一用 C、空调号加临时记号；调式名第一次附中文，之后用英文（大调、自然小调除外）。 */
(() => {
  'use strict';
  const {notes, melody, scale, toggle, cards, table, lesson, C, DEGREES} = ScaleKit;
  const {section, say, note, q, TF, run} = lesson();
  const pair = (a, b, labelA, labelB, mark, pressed = 1) => toggle([[labelA, notes(C[a], {mark})], [labelB, notes(C[b], {mark})]], {pressed});

  section('intro', '导论', '从同一个主音出发');
  say('围绕主音组织起来的音级关系，可以用**调式（Mode）**来描述。', toggle([
    ['大调', notes(C.major, {labels: DEGREES.major})], ['自然小调', notes(C.natural, {labels: DEGREES.natural})]
  ]));
  say('大调、自然小调与本课另外五种调式，组成现代教学中常见的七种**教会调式（Church Modes）**。', cards(['大调', '自然小调', '另外五种：本课逐个认识'], {cols: 1}));
  say('比较调式色彩时，可以保持主音不变，再观察其他音级怎样变化。', pair('major', 'natural', 'C 大调', 'C 自然小调', [2, 5, 6], 0));
  say('主音相同的比较，可以避免把主音高低的变化与音阶结构的变化混在一起。', cards([['主音相同', '不换主音，不换音区'], ['结构不同', '只看哪些音级发生了变化']]));

  section('characteristic', '一', '五种调式的特征音');
  say('**利底亚（Lydian）**比同主音大调的第四级高半音。', pair('major', 'lydian', 'C 大调', 'C Lydian', [3]));
  say('Lydian 写成【1、2、3、♯4、5、6、7】。', notes(C.lydian, {labels: DEGREES.lydian, mark: [3]}));
  say('与参照音阶相比、帮助辨认调式色彩的音级，称为**特征音（Characteristic Note）**。', notes(C.lydian, {labels: DEGREES.lydian, mark: [3], caption: '与同主音大调相比：♯4 是 Lydian 的特征音'}));
  q(scale('G4', 'lydian', {key: 'G', plain: true}), '主音为 G，谱例在本题候选中是哪种调式？', [['Lydian', true], ['大调'], ['自然小调']],
    '正确。主音上方是大三度，第四级为 C♯，比 G 大调的 C 高半音，是 Lydian。', '先和 G 大调比较第四级，其他音级是否保持相同？');
  say('**混合利底亚（Mixolydian）**比同主音大调的第七级低半音。', pair('major', 'mixolydian', 'C 大调', 'C Mixolydian', [6]));
  say('Mixolydian 写成【1、2、3、4、5、6、♭7】。', notes(C.mixolydian, {labels: DEGREES.mixolydian, mark: [6]}));
  say('Mixolydian 的下主音与主音相距全音，没有大调导音的半音关系。', toggle([
    ['Mixolydian', notes(['Bb4', 'C5'], {tonic: [1], mark: [0], intervals: [[0, 1, '全']]})], ['大调', notes(['B4', 'C5'], {tonic: [1], intervals: [[0, 1, '半']]})]
  ]));
  q(scale('D4', 'mixolydian', {key: 'D', plain: true}), '主音为 D，谱例是哪种调式？', [['Mixolydian', true], ['大调'], ['Lydian']],
    '正确。第七级 C 比 D 大调的 C♯ 低半音，其余音与 D 大调相同。', '看第七级与上方主音相距全音还是半音。');
  say('**多利亚（Dorian）**比同主音自然小调的第六级高半音。', pair('natural', 'dorian', 'C 自然小调', 'C Dorian', [5]));
  say('Dorian 写成【1、2、♭3、4、5、6、♭7】。', notes(C.dorian, {labels: DEGREES.dorian, mark: [5]}));
  say('Dorian 的特征音写作 6，因为它与同主音大调的第六级相同。', toggle([
    ['C 大调', notes(C.major, {mark: [5], labels: DEGREES.major})], ['C Dorian', notes(C.dorian, {mark: [5], labels: DEGREES.dorian})], ['C 自然小调', notes(C.natural, {mark: [5], labels: DEGREES.natural})]
  ], {pressed: 1}));
  q(scale('E4', 'dorian', {key: 'Em', plain: true}), '主音为 E，谱例是哪种调式？', [['Dorian', true], ['自然小调'], ['旋律小调']],
    '正确。第六级 C♯ 与下主音 D 同时出现；旋律小调的第七级还要升为 D♯。', '同时检查第六级与第七级，不要只看升高的第六级。');
  say('**弗里吉亚（Phrygian）**比同主音自然小调的第二级低半音。', pair('natural', 'phrygian', 'C 自然小调', 'C Phrygian', [1]));
  say('Phrygian 写成【1、♭2、♭3、4、5、♭6、♭7】。', notes(C.phrygian, {labels: DEGREES.phrygian, mark: [1]}));
  say('Phrygian 的 ♭2 位于主音上方半音，与下方导音是不同的音级关系。', toggle([
    ['上方 ♭2', notes(['C4', 'Db4'], {mark: [1], labels: ['1', '♭2'], intervals: [[0, 1, '半']]})], ['下方 7', notes(['B3', 'C4'], {tonic: [1], labels: ['7', '1'], intervals: [[0, 1, '半']]})]
  ]));
  q(scale('E4', 'phrygian', {key: 'Em', plain: true}), '主音为 E，谱例是哪种调式？', [['Phrygian', true], ['自然小调'], ['Dorian']],
    '正确。第二级 F 在 E 上方半音，其余音与 E 自然小调相同。', '先比较第二级，不能把主音上方半音叫作导音。');
  say('**洛克里亚（Locrian）**比同主音自然小调的第二级、第五级都低半音。', pair('natural', 'locrian', 'C 自然小调', 'C Locrian', [1, 4]));
  say('Locrian 写成【1、♭2、♭3、4、♭5、♭6、♭7】。', notes(C.locrian, {labels: DEGREES.locrian, mark: [1, 4]}));
  say('Locrian 的主音到第五级是减五度，与其他六种调式的纯五度不同。', toggle([
    ['Locrian', notes(['C4', 'Gb4'], {mark: [1], intervals: [[0, 1, 'd5']]})], ['其他六种', notes(['C4', 'G4'], {intervals: [[0, 1, 'P5']]})]
  ]));
  q(scale('B3', 'locrian', {key: 'Bm', plain: true}), 'B Locrian 与 B Phrygian 相比，哪个音级不同？', [['第五级', true], ['第二级'], ['第六级']],
    '正确。两者都有 ♭2，Locrian 还把第五级降为 F。', '先排除两种调式共有的 ♭2，再找另一个不同的音级。');

  section('ladder', '二', '偏大、偏小与亮度阶梯');
  say('按主音上方的三度，七种教会调式可以分成偏大与偏小两组。', toggle([
    ['大三度', notes(['C4', 'E4'], {intervals: [[0, 1, 'M3']]})], ['小三度', notes(['C4', 'Eb4'], {intervals: [[0, 1, 'm3']]})]
  ]));
  say('Lydian、大调、Mixolydian 的第三级在主音上方大三度，归为偏大的一组。', toggle([
    ['Lydian', notes(C.lydian, {mark: [2]})], ['大调', notes(C.major, {mark: [2]})], ['Mixolydian', notes(C.mixolydian, {mark: [2]})]
  ]));
  say('Dorian、自然小调、Phrygian、Locrian 的第三级在主音上方小三度，归为偏小的一组。', toggle([
    ['Dorian', notes(C.dorian, {mark: [2]})], ['自然小调', notes(C.natural, {mark: [2]})], ['Phrygian', notes(C.phrygian, {mark: [2]})], ['Locrian', notes(C.locrian, {mark: [2]})]
  ]));
  q(scale('A4', 'mixolydian', {key: 'A', plain: true, caption: '主音 A'}), '哪种调式属于偏大的一组？', [['Mixolydian', true], ['Dorian'], ['Phrygian']],
    '正确。C♯ 在 A 上方大三度，Mixolydian 属于偏大的一组。', '看主音到第三级的音程，而不是升降号数量。');
  const LADDER = [['Lydian', 'lydian'], ['大调', 'major'], ['Mixolydian', 'mixolydian'], ['Dorian', 'dorian'], ['自然小调', 'natural'], ['Phrygian', 'phrygian'], ['Locrian', 'locrian']];
  say('七种调式可以按常用的明暗参照，整理成一条**亮度阶梯（Brightness Ladder）**。', table(['', '调式', '音级'],
    LADDER.map(([name, id], i) => [i === 0 ? '较亮' : i === 6 ? '较暗' : '', name, DEGREES[id].slice(0, 7).join(' ')])));
  say('在同主音比较中，阶梯上相邻的两种调式只相差一个音级。', pair('lydian', 'major', 'C Lydian', 'C 大调', [3], 0));
  const CHANGED = [[], [3], [6], [2], [5], [1], [4]];
  say('从 Lydian 向较暗的一端移动，每一步都有一个音级降低半音。', toggle(LADDER.map(([name, id], i) => [name, notes(C[id], {labels: DEGREES[id], mark: CHANGED[i]})])));
  say('六次变化依次发生在第四、第七、第三、第六、第二、第五级。', table(['一步', '变化'],
    [['Lydian → 大调', '♯4 → 4'], ['大调 → Mixolydian', '7 → ♭7'], ['Mixolydian → Dorian', '3 → ♭3'], ['Dorian → 自然小调', '6 → ♭6'], ['自然小调 → Phrygian', '2 → ♭2'], ['Phrygian → Locrian', '5 → ♭5']]));
  say('发生变化的音，依次相隔下行纯五度。', table(['一步', '以 C 为主音'],
    [['1', 'F♯ → F（还原）'], ['2', 'B → B♭'], ['3', 'E → E♭'], ['4', 'A → A♭'], ['5', 'D → D♭'], ['6', 'G → G♭']], {title: '变化前 F♯ B E A D G、变化后 F B♭ E♭ A♭ D♭ G♭：都相隔下行纯五度'}));
  q(scale('D4', 'dorian', {key: 'Dm', plain: true}), '比 Dorian 在阶梯上暗一级的是哪种调式？', [['自然小调', true], ['Mixolydian'], ['Phrygian']],
    '正确。Dorian 的第六级降低半音，得到自然小调。', '沿阶梯只走一步，不要跳过中间的调式。');
  q(cards(['Mixolydian：1 2 3 4 5 6 ♭7']), 'Mixolydian 的第三级再降低半音，会得到哪种调式？', [['Dorian', true], ['自然小调'], ['Lydian']],
    '正确。得到 1 2 ♭3 4 5 6 ♭7，正是 Dorian。', '只改变第三级，第六级和第七级保持原样。');
  say('明暗是比较这些音阶的一种参照，旋律的节奏、音区与演奏方式也会影响实际听感。', toggle([
    ['均匀节奏', melody('C4 Eb4 G4 A4 | G4 F4 Bb4 C5', {tonic: [0, 7], mark: [3]})],
    ['另一种节奏', melody('C4:h Eb4 G4 | A4:h G4 F4 | Bb4:h C5:h', {tonic: [0, 7], mark: [3]})]
  ], {pressed: 0}), {hint: '两段用的是相同的音级；听感不只由调式决定。'});

  section('parent', '三', '母大调与调号');
  say('把大调音阶中的不同音级作为新的主音，可以重新排列出这七种调式。', toggle([
    ['C 大调', scale('C4', 'major', {labels: true})], ['从 D 排列', notes(['D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5'], {labels: DEGREES.dorian, caption: '以 D 为 1 重新编号'})]
  ], {pressed: 1}));
  const startE = (opts = {}) => melody('E4 F4 G4 E4 | D4 B3 C4:h', {tonic: [6], ...opts});
  note('旋律从哪个音开始，不等于它就以那个音为主音。', startE({tags: ['开头', '', '', '', '', '', '主音'], caption: '已知主音 C：开头的 E 不是主音'}));
  q(startE({plain: true, caption: '已知主音 C'}), '题目已给定主音 C，一条旋律从 D 开始，就应把主音改标为 D。', TF(false),
    '正确，这句话是错的。开头音可以是其他音级，主音要看音乐的中心。', '先区分旋律的第一个音与题目给定的主音。');
  say('与某调式共用完整音列的大调，可以称为它的**母大调（Parent Major Scale）**。', toggle([
    ['D Dorian', notes(['D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5'], {caption: '主音 D'})], ['C 大调', scale('C4', 'major', {caption: '主音 C：同一组音'})]
  ]));
  say('Dorian 的主音对应母大调第二级，Phrygian、Lydian、Mixolydian、Locrian 则依次对应第三、四、五、七级。', table(['母大调的第几级', '作为主音得到'],
    [['1', '大调'], ['2', 'Dorian'], ['3', 'Phrygian'], ['4', 'Lydian'], ['5', 'Mixolydian'], ['6', '自然小调'], ['7', 'Locrian']]));
  say('母大调关系可以帮助找音，但调式自己的主音仍写成【1】。', notes(['D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5'], {labels: DEGREES.dorian, mark: [5], caption: 'D 写 1；另注：它是母大调 C 的第二级'}));
  q(notes(['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5'], {plain: true, caption: '主音 G'}), '只用白键、以 G 为主音排列到上方八度，得到哪种调式？',
    [['Mixolydian', true], ['Lydian'], ['Dorian']], '正确。这个音列以 G 为中心，包含大三度与 ♭7。', '以 G 为 1 标音级，不要仍把 C 当作主音。');
  say('本课程主要用同主音大调或小调的调号，再用临时记号写出调式的差异。', scale('D4', 'dorian', {key: 'Dm', mark: [5], caption: 'D Dorian：D 小调调号，B 写还原号'}));
  say('偏大的调式以同主音大调调号为参照，偏小的以同主音小调调号为参照。', scale('G4', 'mixolydian', {key: 'G', mark: [6], caption: 'G Mixolydian：G 大调调号，F 写还原号'}));
  say('另一种常见写法，是直接采用母大调的调号。', toggle([
    ['主要写法', scale('D4', 'dorian', {key: 'Dm', mark: [5]})], ['母大调调号', scale('D4', 'dorian', {key: 'C', caption: '声音与音高相同'})]
  ], {pressed: 1}));
  q(cards(['G Mixolydian：1 2 3 4 5 6 ♭7']), '按本课程主要写法，G Mixolydian 用什么调号并怎样处理第七级？',
    [['G 大调调号，F 写还原号', true], ['G 大调调号，F 保持升高'], ['G 小调调号，E 保持降号']],
    '正确。以同主音大调为参照，把第七级 F♯ 还原为 F。', '本题限定主要写法，不是询问所有可能的记谱方式。');
  q(cards(['E Phrygian：1 ♭2 ♭3 4 5 ♭6 ♭7']), 'E Phrygian 也可以采用哪个母大调的调号？', [['C 大调', true], ['E 大调'], ['G 大调']],
    '正确。E 是 C 大调第三级，E Phrygian 与 C 大调共用完整音列。', '在母大调中，Phrygian 主音对应第几级？');

  section('melody', '四', '把特征音放进旋律');
  const dorianTune = (opts = {}) => melody('C4 Eb4 G4 A4 | G4 F4 Bb4 C5', {tonic: [0, 7], ...opts});
  say('调式的特征音可以出现在反复、长音或重要位置，让旋律的用音差异更容易察觉。', toggle([
    ['A', dorianTune({mark: [3]})], ['A♭', melody('C4 Eb4 G4 Ab4 | G4 F4 Bb4 C5', {tonic: [0, 7], mark: [3]})]
  ]));
  say('判断 Dorian 旋律时，要同时留意第六级与下主音，避免与旋律小调混淆。', dorianTune({mark: [3, 6], labels: ['1', '♭3', '5', '6', '5', '4', '♭7', '1']}));
  say('判断 Phrygian 与 Locrian 时，除了 ♭2，还需要检查第五级。', toggle([
    ['G', melody('C4 Db4 Eb4 G4 | F4 Ab4 Bb4 C5', {tonic: [0, 7], mark: [1, 3], caption: '♭2 与纯五度：Phrygian'})],
    ['G♭', melody('C4 Db4 Eb4 Gb4 | F4 Ab4 Bb4 C5', {tonic: [0, 7], mark: [1, 3], caption: '♭2 与 ♭5：Locrian'})]
  ]));
  q(melody('D4 F4 A4 B4 | A4 G4 C5 E4 | D4:w', {key: 'Dm', plain: true}), '已知主音 D，旋律在本题候选中最符合哪种调式？', [['Dorian', true], ['自然小调'], ['旋律小调']],
    '正确。F 是 ♭3，B 是 6，C 是 ♭7；旋律七个音级都已出现，Dorian 符合全部用音。', '第六级是 B 还是 B♭，第七级是 C 还是 C♯？');
  q(melody('E4 F4 G4 B4 | A4 C5 D5 E5', {key: 'Em', plain: true}), '已知主音 E，旋律的第二级为 F，第五级为 B，最符合哪个候选？', [['Phrygian', true], ['Locrian'], ['自然小调']],
    '正确。F 是 ♭2，而 B 仍是纯五度；Locrian 的第五级应为 B♭。', '不能只靠 ♭2 排除或确定 Locrian，还要检查第五级。');
  const noSixth = (opts = {}) => melody('D4 F4 A4 G4 | C5 E4 D4:h', {key: 'Dm', ...opts});
  say('缺少区分候选所需的音级时，旋律可能暂时符合不止一种调式。', noSixth({tonic: [0, 6], caption: '主音 D；没有第六级：Dorian 与自然小调都符合这些音'}));
  q(noSixth({plain: true, caption: '主音 D'}), '已知主音 D，旋律未出现第六级，仅凭其余自然小调用音能唯一排除 Dorian。', TF(false),
    '正确，这句话是错的。两种调式的差别正是第六级，没有这个信息就应保留两种候选。', '找出两种调式唯一不同的音级，再检查旋律是否出现它。');

  section('summary', '小结', '教会调式');
  say('认识教会调式时，同主音比较帮助理解差异，母大调关系帮助找音，旋律中的特征音帮助判断候选。', table(['调式', '公式', '特征'],
    [['Lydian', '1 2 3 ♯4 5 6 7', '♯4'], ['大调', '1 2 3 4 5 6 7', ''], ['Mixolydian', '1 2 3 4 5 6 ♭7', '♭7'], ['Dorian', '1 2 ♭3 4 5 6 ♭7', '6'],
      ['自然小调', '1 2 ♭3 4 5 ♭6 ♭7', ''], ['Phrygian', '1 ♭2 ♭3 4 5 ♭6 ♭7', '♭2'], ['Locrian', '1 ♭2 ♭3 4 ♭5 ♭6 ♭7', '♭2 ♭5']]));

  run(['B3', 'C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'F#4', 'G4', 'Gb4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5', 'C#5', 'D5', 'E5', 'F5', 'F#5', 'G5', 'A5']);
})();
