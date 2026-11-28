/* 调式与音阶 · 第五课：其他常用音阶（V2，2026-11-23）
   依据 docs/scales/lesson05-script.md。比较用 C 主音与临时记号；对称音阶、半音阶用空调号加临时记号。
   只讲结构、来源与旋律特征，不讲和弦配用。 */
(() => {
  'use strict';
  const {notes, scale, toggle, cards, table, lesson, C, DEGREES, steps} = ScaleKit;
  const {section, say, q, TF, run} = lesson();
  const S = (tonic, type, opts) => scale(tonic, type, opts);
  const MPENTA = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5'], mPENTA = ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5'];
  const BLUES = ['C4', 'Eb4', 'F4', 'Gb4', 'G4', 'Bb4', 'C5'];
  const WT = ['C4', 'D4', 'E4', 'F#4', 'G#4', 'Bb4', 'C5'];
  const WH = ['C4', 'D4', 'Eb4', 'F4', 'Gb4', 'Ab4', 'A4', 'B4', 'C5'];
  const HW = ['C4', 'Db4', 'Eb4', 'E4', 'F#4', 'G4', 'A4', 'Bb4', 'C5'];

  section('intro', '导论', '其他常用音阶');
  say('音阶不一定有七个音，本课继续认识不同音数与不同结构的常用音阶。', cards([['五声', '5 个音'], ['布鲁斯', '6 个音'], ['七声', '7 个音'], ['全音', '6 个音'], ['减音阶', '8 个音']], {cols: 2}));
  say('比较音阶时，可以同时观察音的个数、相邻音程与相对主音的音级。', cards(['音的个数', '相邻音程', '相对主音的音级']));

  section('pentatonic', '一', '大调五声与小调五声');
  say('一个八度内有五个不同音的音阶，称为**五声音阶（Pentatonic Scale）**。', notes(MPENTA, {caption: '五个不同的音；上方八度的 C 不另计'}));
  say('**大调五声音阶（Major Pentatonic）**由大调的【1、2、3、5、6】组成。', notes(MPENTA, {labels: DEGREES.majorPenta}));
  say('大调五声音阶省去大调的第四级与第七级，因此不再有原来的两个半音。', toggle([
    ['C 大调', notes(C.major, {faint: [3, 6]})], ['去掉 F、B', notes(MPENTA, {labels: DEGREES.majorPenta})]
  ]));
  say('大调五声音阶的相邻音程，依次为全音、全音、小三度、全音、小三度。', notes(MPENTA, {intervals: steps(MPENTA)}));
  q(S('G4', 'majorPenta', {key: 'G', plain: true}), '大调五声音阶省去大调的哪两个音级？', [['第四级与第七级', true], ['第二级与第六级'], ['第三级与第七级']],
    '正确。G 大调中的 C、F♯ 未出现在这条五声音阶中。', '先列完整大调，再找缺少的两个位置。');
  say('**小调五声音阶（Minor Pentatonic）**由自然小调中的【1、♭3、4、5、♭7】组成。', notes(mPENTA, {labels: DEGREES.minorPenta}));
  say('小调五声音阶省去自然小调的第二级与第六级，同样没有半音。', toggle([
    ['C 自然小调', notes(C.natural, {faint: [1, 5]})], ['去掉 D、A♭', notes(mPENTA, {labels: DEGREES.minorPenta})]
  ]));
  say('本课介绍的这两种五声音阶，都只由全音与小三度连接而成。', toggle([
    ['大调五声', notes(MPENTA, {intervals: steps(MPENTA)})], ['小调五声', notes(mPENTA, {intervals: steps(mPENTA)})]
  ]));
  say('大调五声与它的关系小调五声共用五个音，但各自的主音不同。', toggle([
    ['C 大调五声', notes(MPENTA, {caption: 'C D E G A，主音 C'})], ['A 小调五声', S('A3', 'minorPenta', {caption: 'A C D E G，主音 A'})]
  ]));
  q(S('A3', 'minorPenta', {plain: true, caption: '主音 A'}), '已知主音 A，谱例是哪种五声音阶？', [['小调五声音阶', true], ['大调五声音阶']],
    '正确。相对 A 的音级为 1 ♭3 4 5 ♭7。', '看主音上方是大三度还是小三度，再检查完整音列。');
  q(cards(['G 大调五声音阶']), '与 G 大调五声共用完整五音音列的小调五声是哪条？', [['E 小调五声', true], ['G 小调五声'], ['B 小调五声']],
    '正确。两者都使用 G、A、B、D、E，以不同音为主音。', '从关系大小调的主音关系出发，再核对五个音是否全部相同。');

  section('blues', '二', '布鲁斯音阶');
  say('小调五声音阶加入 ♭5，形成本课简称的**布鲁斯音阶（Blues Scale）**。', notes(BLUES, {mark: [3]}));
  say('这条布鲁斯音阶有六个音，写成【1、♭3、4、♭5、5、♭7】。', notes(BLUES, {labels: DEGREES.blues, mark: [3]}));
  say('第四级、降五级、第五级之间，形成两个连续半音。', notes(BLUES, {mark: [2, 3, 4], intervals: [[2, 3, '半'], [3, 4, '半']]}));
  say('布鲁斯音乐中常见的降三级、降五级、降七级色彩，常与**蓝调音（Blue Note）**联系起来。', notes(BLUES, {mark: [1, 3, 5], labels: DEGREES.blues}));
  say('蓝调演奏还可能使用固定音高之间的滑动，本课先用固定音高的音阶认识这些位置。', cards(['实际演奏中，蓝调音的音准可以在两个固定音高之间滑动', '本课只用固定音高的音阶认识这些位置']));
  q(S('D4', 'blues', {key: 'Dm', plain: true}), '小调五声音阶加入哪个音级，形成本课的布鲁斯音阶？', [['♭5', true], ['♭6'], ['2']],
    '正确。A♭ 是 D 的 ♭5，使 G–A♭–A 形成连续半音。', '比较新增的音与主音之间的关系。');
  const MBLUES = ['C4', 'D4', 'Eb4', 'E4', 'G4', 'A4', 'C5'];
  say('大调五声音阶加入 ♭3，可以形成**大调布鲁斯音阶（Major Blues Scale）**。', notes(MBLUES, {mark: [2]}));
  say('大调布鲁斯音阶写成【1、2、♭3、3、5、6】。', notes(MBLUES, {labels: DEGREES.majorBlues, mark: [2, 3]}));
  q(S('A3', 'blues', {plain: true, caption: '主音 A'}), '主音 A，A C D E♭ E G 这组音符合哪种候选？', [['布鲁斯音阶', true], ['小调五声音阶'], ['大调布鲁斯音阶']],
    '正确。它有六个不同音，音级为 1 ♭3 4 ♭5 5 ♭7。', '先检查第三音级与第五音级附近的半音，不只看有几个音。');

  section('derived', '三', '小调音阶衍生的调式');
  say('和声小调与现代旋律小调，也可以从不同音级出发排列成其他调式。', toggle([
    ['从 C', notes(C.melodic, {caption: 'C 旋律小调'})],
    ['从 F', notes(['F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'Eb5', 'F5'], {caption: '同一组音，从第四级排列'})],
    ['从 B', notes(['B3', 'C4', 'D4', 'Eb4', 'F4', 'G4', 'A4', 'B4'], {caption: '同一组音，从第七级排列'})]
  ]));
  say('这些调式常见于爵士、影视配乐及其他音乐语境，本课选择三种认识结构。', cards(['和声小调第五级起', '旋律小调第四级起', '旋律小调第七级起']));
  say('把和声小调第五级作为新主音，得到**弗里吉亚属音阶（Phrygian Dominant）**。', toggle([
    ['F 和声小调', S('F4', 'harmonic', {key: 'Fm', mark: [4]})], ['从 C 排列', S('C4', 'phrygianDominant', {labels: true})]
  ], {pressed: 1}));
  say('Phrygian Dominant 比 Phrygian 的第三级高半音。', toggle([['Phrygian', notes(C.phrygian, {mark: [2]})], ['Phrygian Dominant', S('C4', 'phrygianDominant', {mark: [2]})]], {pressed: 1}));
  say('Phrygian Dominant 写成【1、♭2、3、4、5、♭6、♭7】。', S('C4', 'phrygianDominant', {labels: true, mark: [1, 2]}));
  say('Phrygian Dominant 的 ♭2 到 3 之间，有一个增二度。', notes(['Db4', 'E4'], {noTonic: true, mark: [0, 1], intervals: [[0, 1, 'A2']]}));
  q(S('E4', 'phrygianDominant', {key: 'E', plain: true}), '与 Phrygian 相比，Phrygian Dominant 改变了哪个音级？', [['第三级升高半音', true], ['第二级升高半音'], ['第七级升高半音']],
    '正确。E Phrygian 的 G 升高为 G♯，第二级 F 保持不变。', '先看主音到第三级的音程，再比较第二级。');
  say('把现代旋律小调第四级作为新主音，得到**利底亚属音阶（Lydian Dominant）**。', toggle([
    ['G 旋律小调', S('G4', 'melodic', {key: 'Gm', mark: [3]})], ['从 C 排列', S('C4', 'lydianDominant', {labels: true})]
  ], {pressed: 1}));
  say('Lydian Dominant 同时具有 Lydian 的 ♯4 与 Mixolydian 的 ♭7。', toggle([
    ['Lydian', notes(C.lydian, {mark: [3, 6]})], ['Lydian Dominant', S('C4', 'lydianDominant', {mark: [3, 6]})], ['Mixolydian', notes(C.mixolydian, {mark: [3, 6]})]
  ], {pressed: 1}));
  say('Lydian Dominant 写成【1、2、3、♯4、5、6、♭7】。', S('C4', 'lydianDominant', {labels: true, mark: [3, 6]}));
  q(S('G4', 'lydianDominant', {key: 'G', plain: true}), '主音 G，谱例在本题候选中是哪种音阶？', [['Lydian Dominant', true], ['Lydian'], ['Mixolydian']],
    '正确。C♯ 是 ♯4，F 是 ♭7，两者同时出现。', '分别检查第四级与第七级，不能只看其中一个。');
  say('把现代旋律小调第七级作为新主音，得到**变化音阶（Altered Scale）**。', toggle([
    ['D♭ 旋律小调', S('Db4', 'melodic', {mark: [6]})], ['从 C 排列', S('C4', 'altered', {labels: true})]
  ], {pressed: 1}));
  say('按七个字母逐级排列的写法，变化音阶写成【1、♭2、♭3、♭4、♭5、♭6、♭7】。', S('C4', 'altered', {labels: true, caption: '保留 F♭ 的拼写：C D E F G A B 七个字母各一次'}));
  say('变化音阶比 Locrian 的第四级再低半音。', toggle([['Locrian', notes(C.locrian, {mark: [3]})], ['变化音阶', S('C4', 'altered', {mark: [3]})]], {pressed: 1}));
  say('在十二平均律中，♭4 与 3 等音，但这两种拼写说明的音级位置不同。', toggle([
    ['F♭：♭4', notes(['C4', 'Fb4'], {mark: [1], labels: ['1', '♭4'], intervals: [[0, 1, 'd4']]})],
    ['E：3', notes(['C4', 'E4'], {labels: ['1', '3'], intervals: [[0, 1, 'M3']], caption: '同一个琴键，两种拼写'})]
  ]));
  say('变化音阶这个名称，提醒我们观察它与参照音阶之间较多的音级变化。', toggle([
    ['C 大调', notes(C.major, {labels: DEGREES.major})], ['变化音阶', S('C4', 'altered', {labels: true, mark: [1, 2, 3, 4, 5, 6]})]
  ], {pressed: 1}));
  q(toggle([['D Locrian', S('D4', 'locrian', {plain: true})], ['D 变化音阶', S('D4', 'altered', {plain: true})]]), '按本课七字母写法，变化音阶与 Locrian 相比，哪个音级更低半音？',
    [['第四级', true], ['第三级'], ['第七级']], '正确。D Locrian 的第四级 G 降为 G♭，形成 ♭4。', '两个音阶都已经有 ♭2、♭3、♭5、♭6、♭7，再找唯一不同处。');
  q(cards(['变化音阶']), '本课变化音阶来自哪一种音阶的第七级？', [['现代旋律小调', true], ['和声小调'], ['大调']],
    '正确。它来自上下行相同的现代旋律小调。', '回想来源音列中，第六级与第七级采用哪种小调形式。');

  section('whole', '四', '全音音阶');
  say('相邻各音都相距两个半音（全音）的音阶，称为**全音音阶（Whole-Tone Scale）**。', notes(WT, {intervals: steps(WT), caption: 'G♯–B♭ 按字母是减三度，按半音数仍是两个半音'}));
  say('全音音阶一个八度内有【六个】不同音。', notes(WT, {caption: '六个不同的音；上方八度的 C 不另计'}));
  say('本课以起始音为比较位置时，可把这条全音音阶写成 1、2、3、♯4、♯5、♭7。', notes(WT, {labels: DEGREES.wholeTone, caption: '编号只用于比较，不证明 C 是主音'}));
  say('均匀的全音结构本身不突出某个起点，听感描述因作品而异。', toggle([
    ['从 C', notes(WT)], ['从 E', notes(['E4', 'F#4', 'G#4', 'Bb4', 'C5', 'D5', 'E5'], {caption: '同一组音，换一个起点'})]
  ]));
  say('十二平均律中，全音音阶只有【两组不同的音高集合】。', toggle([
    ['第一组', notes(WT, {caption: 'C D E F♯ G♯ B♭'})], ['第二组', notes(['Db4', 'Eb4', 'F4', 'G4', 'A4', 'B4', 'Db5'], {caption: 'D♭ E♭ F G A B'})]
  ]));
  q(notes(WT, {plain: true, mark: [0, 1], tags: ['C', 'D']}), '从 D 开始的全音音阶，与从 C 开始的全音音阶有什么关系？', [['使用同一组音', true], ['使用完全不同的音'], ['只相差一个音']],
    '正确。D 本来就在这组音内，改变排列起点不会改变音高集合。', '先检查 D 是否属于原来的全音音阶。');

  section('diminished', '五', '减音阶与对称结构');
  say('全音、半音交替排列的音阶，称为**减音阶（Diminished Scale）**。', notes(WH, {intervals: steps(WH)}));
  say('减音阶一个八度内有八个不同音，也常称为**八声音阶（Octatonic Scale）**。', notes(WH, {caption: '八个不同的音；这里的八声音阶特指全半交替的常见类型'}));
  say('从全音开始交替的排列，称为**全半减音阶（Whole-Half Diminished）**。', notes(WH, {intervals: steps(WH)}));
  say('从半音开始交替的排列，称为**半全减音阶（Half-Whole Diminished）**。', notes(HW, {intervals: steps(HW)}));
  say('八音结构可能需要同一字母的不同变音形式，不能套用大调七个字母各一次的规则。', toggle([
    ['全半', notes(WH, {mark: [5, 6], caption: 'A♭ 与 A'})], ['半全', notes(HW, {mark: [2, 3], caption: 'E♭ 与 E'})]
  ]));
  q(notes(['D4', 'Eb4', 'F4', 'F#4', 'G#4', 'A4', 'B4', 'C5', 'D5'], {plain: true}), '谱例是哪种减音阶？', [['半全减音阶', true], ['全半减音阶']],
    '正确。D–E♭ 是半音，E♭–F 是全音，后续继续交替。', '从第一个间隔开始读，再检查是否持续交替。');
  say('减音阶每移高小三度，就回到同一组音高集合。', toggle([
    ['从 C', notes(WH)], ['从 E♭', notes(['Eb4', 'F4', 'Gb4', 'Ab4', 'A4', 'B4', 'C5', 'D5', 'Eb5'])],
    ['从 F♯', notes(['F#4', 'G#4', 'A4', 'B4', 'C5', 'D5', 'Eb5', 'F5', 'F#5'])], ['从 A', notes(['A3', 'B3', 'C4', 'D4', 'Eb4', 'F4', 'Gb4', 'Ab4', 'A4'])]
  ]), {hint: '四个版本的音高相同，拼写按读谱方便选择。'});
  say('十二平均律中，减音阶共有【三组不同的音高集合】。', toggle([
    ['从 C', notes(WH)], ['从 D♭', notes(['Db4', 'Eb4', 'E4', 'F#4', 'G4', 'A4', 'Bb4', 'C5', 'Db5'])], ['从 D', notes(['D4', 'E4', 'F4', 'G4', 'Ab4', 'Bb4', 'B4', 'C#5', 'D5'])]
  ]), {hint: '同一起点的全半与半全是不同排列，两类的集合不能相加算成六组。'});
  q(notes(WH, {plain: true}), '把一条全半减音阶整体移高小三度，得到的音高集合会怎样？', [['仍是同一组音', true], ['必定换成完全不同的一组音'], ['变成全音音阶']],
    '正确。全半结构每隔小三度重复，整体移高小三度后回到原集合。', '比较原集合与移高后的实际音高，不只看音名拼写。');
  say('音高集合在小于八度的某个移调距离后与自身重合，是本课所说的**对称音阶（Symmetric Scale）**的特点。', toggle([
    ['全音：移高全音', notes(['D4', 'E4', 'F#4', 'G#4', 'Bb4', 'C5', 'D5'], {caption: '仍是 C D E F♯ G♯ B♭ 这一组'})],
    ['减音阶：移高小三度', notes(['Eb4', 'F4', 'Gb4', 'Ab4', 'A4', 'B4', 'C5', 'D5', 'Eb5'], {caption: '仍是从 C 开始的那一组'})]
  ]));
  say('对称音阶的不同起点和不同移调，并不总会产生全新的音高集合。', cards([['全音音阶', '两组音高集合'], ['减音阶', '三组音高集合']]));
  q(cards(['全音音阶', '和声小调', '小调五声音阶']), '哪种已学音阶，整体移高全音后仍使用原来的音高集合？', [['全音音阶', true], ['和声小调'], ['小调五声音阶']],
    '正确。全音音阶每个位置都按全音间隔重复。', '把这三种音阶的间隔结构分别移高全音比较。');

  section('chromatic', '六', '半音阶');
  const UP = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5'];
  const DOWN = ['C5', 'B4', 'Bb4', 'A4', 'Ab4', 'G4', 'Gb4', 'F4', 'E4', 'Eb4', 'D4', 'Db4', 'C4'];
  say('一个八度内十二个音都按半音依次排列，称为**半音阶（Chromatic Scale）**。', toggle([
    ['上行', notes(UP, {wide: 2})], ['下行', notes(DOWN, {wide: 2, caption: '下行用降号拼写，便于阅读'})]
  ]));
  say('不计八度与等音拼写，半音阶覆盖的是同一组十二个音高。', toggle([
    ['从 C', notes(UP, {wide: 2})], ['从 E', notes(['E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5', 'C#5', 'D5', 'D#5', 'E5'], {wide: 2, caption: '换起点后仍是十二个音高'})]
  ]));
  q(cards(['一条旋律经过了全部十二种音高']), '一条旋律经过十二种音高，就一定能仅凭音数确定它没有主音。', TF(false),
    '正确，这句话是错的。音数说明用了哪些音，主音仍要看旋律怎样组织，不能只数音。', '回想前几课，主音与音高集合是否是同一个概念？');

  section('summary', '小结', '其他常用音阶');
  say('比较这些音阶时，既要核对音数与音程结构，也要区分主音、排列起点和音高集合。', table(['类别', '音阶', '音级 / 结构'],
    [['五声', '大调五声 / 小调五声', '1 2 3 5 6 / 1 ♭3 4 5 ♭7'], ['布鲁斯', '布鲁斯 / 大调布鲁斯', '1 ♭3 4 ♭5 5 ♭7 / 1 2 ♭3 3 5 6'],
      ['小调衍生', 'Phrygian Dominant', '1 ♭2 3 4 5 ♭6 ♭7'], ['', 'Lydian Dominant', '1 2 3 ♯4 5 6 ♭7'], ['', '变化音阶', '1 ♭2 ♭3 ♭4 ♭5 ♭6 ♭7'],
      ['对称', '全音 / 全半、半全减音阶', '全音 / 全半交替'], ['半音阶', '十二个音', '全部半音']]));

  run(['A3', 'B3', 'C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'F#4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5', 'D5', 'Eb5', 'E5', 'F5', 'F#5', 'G5']);
})();
