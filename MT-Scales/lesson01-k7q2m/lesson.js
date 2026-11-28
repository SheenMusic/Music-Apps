/* 调式与音阶 · 第一课：大调（V2，2026-11-23）
   依据 docs/scales/lesson01-script.md：一个编号一页；讲解区只讲规律，具体音放演示区（规范 L32）。 */
(() => {
  'use strict';
  const {notes, melody, scale, toggle, cards, table, circle, lesson} = ScaleKit;
  const {section, say, note, q, TF, run} = lesson();
  const MAJOR = ScaleKit.C.major;
  const motive = (opts = {}) => melody('C4 E4 G4 E4 | D4 F4 B4 C5', opts);
  const home = (opts = {}) => melody('C4 E4 G4 E4 | D4 B3 C4:h', {tonic: [0, 6], ...opts});
  // 主音上下纯五度的关系图（高音谱表，F4–G5）
  const center = (tags, opts = {}) => notes(['F4', 'A4', 'C5', 'E5', 'G5'], {tonic: [2], tags, ...opts});
  const keyOnly = (key, caption = '') => notes([], {key, caption});

  section('intro', '导论', '音阶与旋律');
  say('旋律的用音，通常可以整理成一组有规律排列的音。', motive(), {hint: '点击音符可以单独试听；点击空白处播放整段。'});
  say('按音高顺序排列的一组音，称为**音阶（Scale）**。', toggle([
    ['旋律用到的音', notes(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], {hide: [5], caption: '旋律没有用到 A'})],
    ['补入 A', notes(MAJOR, {caption: '旋律没有用到音阶中的全部音'})]
  ]));
  say('旋律可以只用音阶的一部分，也可以在进行中改变用音。', toggle([
    ['完整音阶', notes(MAJOR, {faint: [5], caption: '灰色的 A：旋律没有用到'})],
    ['旋律', motive()]
  ]));
  say('本课程从音阶的结构出发，认识不同调式在旋律中的特征。', cards([['第一课', '大调'], ['第二课', '小调'], ['第三课', '教会调式'], ['第四课', '调式与旋律的变化'], ['第五课', '其他常用音阶'], ['第六课', '综合']], {cols: 2}));
  q(motive({plain: true}), '一段旋律没有用全七个音，就一定不属于大调音阶。', TF(false),
    '正确，这句话是错的。大调旋律可以只使用音阶中的部分音。', '完整音阶和旋律实际使用的音，需要完全一样多吗？');

  section('structure', '一', '大调音阶的结构');
  say('音乐中作为中心的音，称为**主音（Tonic）**。', home());
  say('旋律的反复、重音和停顿位置，都可以帮助我们感受主音。', home({tags: ['首拍', '', '', '', '', '', '长音']}));
  say('本课把音阶从主音排列到上方八度的同名音。', notes(MAJOR));
  say('**大调音阶（Major Scale）**的相邻音程排列是【全、全、半、全、全、全、半】。', notes(MAJOR, {intervals: ScaleKit.steps(MAJOR)}));
  say('大调音阶的两个半音，分别在第三与第四、第七与上方主音之间。', notes(MAJOR, {mark: [2, 3, 6, 7], tonic: [], intervals: [[2, 3, '半'], [6, 7, '半']]}));
  q(scale('G4', 'major', {key: 'G', plain: true}), '大调音阶中，半音在哪两组相邻音之间？',
    [['第三与第四、第七与上方主音', true], ['第二与第三、第六与第七'], ['第一与第二、第四与第五']],
    '正确。B–C 与 F♯–G 都是半音，位置与其他大调相同。', '逐个比较相邻两个音，找出两个半音。');
  say('保持相同的音程排列，就可以从不同的主音构建大调音阶。', toggle([
    ['C 大调', scale('C4', 'major')], ['G 大调', scale('G4', 'major', {key: 'G'})], ['F 大调', scale('F4', 'major', {key: 'F'})]
  ]));
  say('改变主音后，通常需要调整升降号来保持大调的结构。', toggle([
    ['G 大调', scale('G4', 'major', {mark: [6], caption: 'F♯：保持第七级到主音的半音'})],
    ['F 大调', scale('F4', 'major', {mark: [3], caption: 'B♭：保持第三与第四级之间的半音'})]
  ]));
  note('大调音阶的七个音，七个音名字母【各用一次】。', toggle([
    ['写成 A♯', notes(['F4', 'G4', 'A4', 'A#4', 'C5', 'D5', 'E5', 'F5'], {mark: [2, 3], caption: '字母 A 用了两次，缺少 B'})],
    ['写成 B♭', notes(['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5'], {mark: [3], caption: 'F G A B C D E：七个字母各一次'})]
  ]));
  q(scale('D4', 'major', {key: 'D', plain: true}), 'D 大调需要升高哪些基本音？',
    [['F 与 C', true], ['只有 F'], ['F、C 与 G']],
    '正确。F♯ 与 C♯ 使音程排列保持全、全、半、全、全、全、半。', '按大调的相邻音程排列逐个检查。');
  q(notes(['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5'], {key: 'F', hide: [3], plain: true}), 'F 大调的第四个音应怎样拼写？',
    [['B♭', true], ['A♯']], '正确。第四个音需要用字母 B，写 B♭；A 已经出现在第三个音。', '先检查音名字母的顺序，而不只是琴键是否相同。');

  section('degrees', '二', '音级的数字与名称');
  const NUM = ScaleKit.DEGREES.major;
  say('音阶中各音相对于主音的位置，称为**音级（Scale Degree）**。', notes(MAJOR, {labels: NUM}));
  say('大调的七个音级从主音起写成 1、2、3、4、5、6、7。', scale('G4', 'major', {key: 'G', labels: true}));
  say('本课程所有音阶的主音都写成【1】，其他音级以同主音大调为比较标准。', toggle([
    ['C 大调', scale('C4', 'major', {labels: true})], ['G 大调', scale('G4', 'major', {key: 'G', labels: true})], ['F 大调', scale('F4', 'major', {key: 'F', labels: true})]
  ]));
  say('音级名称说明各音与主音的关系，不随具体音名改变。', toggle([
    ['C 大调', scale('C4', 'major', {tags: ['主音']})], ['G 大调', scale('G4', 'major', {key: 'G', tags: ['主音']})]
  ]));
  say('5 级叫**属音（Dominant）**，位于主音上方纯五度。', center(['', '', '主音', '', '属音'], {faint: [0, 1, 3], caption: 'C 到上方的 G：纯五度（P5）'}));
  say('4 级叫**下属音（Subdominant）**，可以放在主音下方纯五度的位置来理解。', center(['下属音', '', '主音', '', '属音'], {faint: [1, 3], caption: '下方的 F 到 C：纯五度（P5）'}));
  say('「下属」指主音下方的五度关系，不是属音下面的一级。', center(['下属音', '', '主音', '', '属音'], {faint: [1, 3], caption: '下属音 ← 纯五度 ← 主音 → 纯五度 → 属音'}));
  q(notes(['G4', 'D5', 'A5'], {tonic: [1], plain: true, caption: 'D 的下方纯五度与上方纯五度'}), '下属音名称中的「下」，指什么关系？',
    [['主音下方纯五度', true], ['属音下方一级'], ['主音下方半音']],
    '正确。G 在 D 下方纯五度，对应 D 大调的下属音。', '先找主音，再看名称所描述的是哪一组五度。');
  say('3 级叫**中音（Mediant）**，处在主音与上方属音之间。', center(['', '', '主音', '中音', '属音'], {faint: [0, 1]}));
  say('6 级叫**下中音（Submediant）**，可以放在主音与下方下属音之间来理解。', center(['下属音', '下中音', '主音', '中音', '属音'], {caption: '下中音与中音，分别在主音的下方与上方'}));
  say('2 级叫**上主音（Supertonic）**，位于主音上方一级。', notes(MAJOR, {mark: [1], tags: ['主音', '上主音']}));
  say('大调的 7 级叫**导音（Leading Tone）**，位于主音下方半音。', notes(['B4', 'C5'], {tonic: [1], mark: [0], tags: ['导音', '主音'], intervals: [[0, 1, '半']]}));
  say('导音通常有向上进行到主音的倾向。', toggle([
    ['停在 B', melody('E4 F4 G4 A4 | B4:w', {mark: [4]})],
    ['接到 C', melody('E4 F4 G4 A4 | B4:h C5:h', {mark: [4], tonic: [5]})]
  ]));
  q(scale('G4', 'major', {key: 'G', plain: true}), 'G 大调的导音是哪个音？',
    [['F♯', true], ['F'], ['A']], '正确。F♯ 在主音 G 下方半音，是 G 大调的导音。', '找主音下方半音，而不只是看相邻字母。');
  say('七个音级名称依次是主音、上主音、中音、下属音、属音、下中音、导音。', table(['音级', '名称'],
    [['1', '主音'], ['2', '上主音'], ['3', '中音'], ['4', '下属音'], ['5', '属音'], ['6', '下中音'], ['7', '导音']]));
  q(scale('A4', 'major', {key: 'A', plain: true}), 'A 大调的下中音是哪个音？',
    [['F♯', true], ['E'], ['D']], '正确。下中音是第六级，A 大调的第六级是 F♯。', '先回想名称对应第几级，再从主音开始数。');

  section('keys', '三', '调与调号');
  const gTune = (key, opts = {}) => melody('G4 B4 D5 B4 | A4 F#4 G4:h', {key, tonic: [0, 6], ...opts});
  say('在本课讨论的大小调音乐中，主音与围绕它组织用音的方式共同确定一个**调（Key）**。', toggle([
    ['音阶', scale('G4', 'major', {key: 'G', caption: 'G 大调'})], ['旋律', gTune('G', {caption: 'G 大调'})]
  ]));
  say('大调的名称由主音的音名加上「大调」组成。', toggle([
    ['G 大调', scale('G4', 'major', {key: 'G'})], ['F 大调', scale('F4', 'major', {key: 'F'})], ['D 大调', scale('D4', 'major', {key: 'D'})]
  ]));
  say('写在每行谱表开头、规定默认升降音的记号，称为**调号（Key Signature）**。', toggle([
    ['临时升号', gTune('C', {mark: [5]})], ['改用调号', gTune('G')]
  ]));
  say('调号对所有八度的同名音都有效，直到新的调号改变这一规定。', notes(['F#4', 'F#5'], {key: 'G', noTonic: true, tags: ['F♯', 'F♯'], caption: '一个升号的调号：两个八度的 F 都按 F♯ 演奏'}));
  say('写在具体音符前、改变默认音高的记号，称为**临时记号（Accidental）**。', melody('G4 B4 C#5 D5 | E5 F5 E5 D5', {key: 'G', mark: [2, 5], tags: ['', '', '升号', '', '', '还原号']}));
  say('临时记号通常从出现处起，对本小节内同一八度的同名音有效。', melody('C#4 C#4 C5 C#4 | C4:w', {mark: [0, 1, 3], cautionary: [2, 4],
    labels: ['C♯', 'C♯', 'C', 'C♯', 'C'], caption: '同小节的 C♯₄ 不再写升号；C₅ 与下一小节的 C₄ 是本位音，括号里的还原号只作提示'}));
  q(notes(['F#4', 'F#5'], {key: 'G', noTonic: true, plain: true}), '调号中的升号会影响哪些音？',
    [['所有八度的 F', true], ['只有第五线上的 F'], ['只有第一小节的 F']],
    '正确。两个八度都按 F♯ 演奏。', '调号规定的是这个音名的默认音高，还是单独一个符头的位置？');
  q(melody('C#4 C#4 C5 C#4 | C4:w', {plain: true, cautionary: [2, 4]}), '临时记号和调号的作用范围完全相同。', TF(false),
    '正确，这句话是错的。临时记号通常作用于本小节后续同一八度的同名音，调号则规定各个八度的默认音高。', '比较它们是否跨八度、跨小节生效。');

  section('circle', '四', '读调号与五度循环');
  say('常用大调中，有的调号用升号，有的用降号，也有不带升降号的调号。', toggle([
    ['C 大调', keyOnly('C', 'C 大调：没有升降号')], ['G 大调', keyOnly('G', 'G 大调：一个升号')], ['F 大调', keyOnly('F', 'F 大调：一个降号')]
  ]));
  const SHARPS = ['G', 'D', 'A', 'E', 'B', 'F#', 'C#'], FLATS = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
  say('升号按照固定的音名顺序加入调号。', toggle(SHARPS.map((k, i) => [String(i + 1), keyOnly(k, 'F C G D A E B'.split(' ').slice(0, i + 1).join(' '))]), {pressed: 6}));
  say('降号加入调号的音名顺序，正好与升号顺序相反。', toggle(FLATS.map((k, i) => [String(i + 1), keyOnly(k, 'B E A D G C F'.split(' ').slice(0, i + 1).join(' '))]), {pressed: 6}));
  say('本课采用的高音谱表调号，每个升降号都有惯用的书写位置。', toggle([
    ['七个升号', keyOnly('C#', '升号依次写在 F₅ C₅ G₅ D₅ A₄ E₅ B₄')], ['七个降号', keyOnly('Cb', '降号依次写在 B₄ E₅ A₄ D₅ G₄ C₅ F₄')]
  ]));
  q(notes(['F5', 'F4'], {noTonic: true, plain: true, tags: ['第五线', '第一间']}), '高音谱表的常用调号写法中，第一个升号写在哪里？',
    [['第五线的 F', true], ['第一间的 F']], '正确。第一个升号惯常写在第五线 F 的位置，但作用于各个八度的 F。', '书写位置和作用范围是两件不同的事。');
  q(keyOnly('A'), '升号调号中，第三个加入的音是哪个？', [['G♯', true], ['D♯'], ['C♯']],
    '正确。加入顺序的前三个是 F♯、C♯、G♯。', '按调号从左到右读出前三个升号。');
  say('升号调号最后一个升号的上方小二度，是它对应的大调主音。', notes(['C#5', 'D5'], {key: 'D', tonic: [1], mark: [0], tags: ['最后的升号', '主音'], caption: 'C♯ 上方小二度是 D：D 大调'}));
  say('降号调号的倒数第二个降号，是它对应的大调主音。', notes(['Eb4', 'Eb5'], {key: 'Eb', caption: 'B♭ E♭ A♭：倒数第二个是 E♭，E♭ 大调'}));
  say('只有一个降号的调号，需要单独记住对应的大调。', keyOnly('F', '一个降号（B♭）：F 大调'));
  q(keyOnly('A'), '三个升号的调号对应哪个大调？', [['A 大调', true], ['G♯ 大调'], ['E 大调']],
    '正确。最后一个升号是 G♯，上方小二度是 A。', '先找到最右边的升号，再向上找小二度。');
  q(keyOnly('Ab'), '四个降号的调号对应哪个大调？', [['A♭ 大调', true], ['D♭ 大调'], ['E♭ 大调']],
    '正确。B♭、E♭、A♭、D♭ 中，倒数第二个是 A♭。', '找倒数第二个降号，不是最后一个。');
  say('把常用调的主音按纯五度关系排列，可以整理成**五度循环（Circle of Fifths）**。', circle({caption: '顺时针：向上纯五度；数字为调号中的升降号个数'}));
  say('向上纯五度时，调号增加一个升号或减少一个降号。', circle({hi: ['F', 'C', 'G', 'D'], caption: 'F → C → G → D：一个降号、无、一个升号、两个升号'}));
  say('向下纯五度时，调号增加一个降号或减少一个升号。', circle({hi: ['G', 'C', 'F', 'B♭'], caption: 'G → C → F → B♭'}));
  say('本课学习的常用标准大调调号，从七个降号到七个升号共有【15 种】。', circle({caption: '七个升号调、C 大调、七个降号调：15 种调号拼写，不是 15 种不同的音高集合'}));
  say('主音互为等音、音阶各音也等音对应的两个同类调，称为**等音调（Enharmonic Keys）**。', toggle([
    ['B', scale('B3', 'major', {key: 'B'})], ['C♭', scale('Cb4', 'major', {key: 'Cb'})],
    ['F♯', scale('F#4', 'major', {key: 'F#'})], ['G♭', scale('Gb4', 'major', {key: 'Gb'})],
    ['C♯', scale('C#4', 'major', {key: 'C#'})], ['D♭', scale('Db4', 'major', {key: 'Db'})]
  ]));
  say('等音调通常可以按读写便利选择拼写，也可能受到上下文的影响。', toggle([
    ['B 大调', scale('B3', 'major', {key: 'B', caption: '五个升号'})], ['C♭ 大调', scale('Cb4', 'major', {key: 'Cb', caption: '七个降号，声音相同'})]
  ]));
  q(scale('Db4', 'major', {key: 'Db', plain: true}), '与 D♭ 大调互为等音调的是哪个？', [['C♯ 大调', true], ['D 大调'], ['B 大调']],
    '正确。C♯ 大调与 D♭ 大调逐音等音对应，调号与音名拼写不同。', '先找与 D♭ 等音的主音，再核对音阶种类。');
  q(toggle([['B♭ 大调', keyOnly('Bb')], ['F 大调', keyOnly('F')]]), '从 B♭ 大调向上纯五度到 F 大调，调号怎样变化？',
    [['减少一个降号', true], ['增加一个升号'], ['增加一个降号']], '正确。B♭ 大调两个降号，F 大调一个降号。', '向升号方向移动时，原有的降号可能先减少。');

  section('summary', '小结', '大调');
  say('大调的音程排列、音级关系与调号，可以在不同主音上保持同一套规律。', cards([
    ['音程排列', '全、全、半、全、全、全、半'], ['音级', '1–7；主音、上主音、中音、下属音、属音、下中音、导音'],
    ['调号', '升号 F C G D A E B；降号顺序相反'], ['读调号', '最后一个升号上方小二度；倒数第二个降号'], ['五度循环', '15 种常用大调调号与等音调']]));

  run(['B3', 'C4', 'C#4', 'D4', 'E4', 'F4', 'F#4', 'G4', 'A4', 'Bb4', 'B4', 'C5', 'C#5', 'D5', 'E5', 'F5', 'F#5', 'G5', 'A5']);
})();
