/* 调式与音阶 · 第一课：音阶与音级（初稿，2026-11-21）
   依据 docs/scales/course-proposal.md。讲解区只陈述规律，例子放在演示区（规范 L32）；待老师逐页审核。 */
(() => {
  'use strict';
  const {COLOR} = ChordStage;
  const {scale, MARK} = ScaleKit;
  const MAJOR = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
  const MINOR = ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5'];
  const STEPS_MAJOR = [[0, 1, '全'], [1, 2, '全'], [2, 3, '半'], [3, 4, '全'], [4, 5, '全'], [5, 6, '全'], [6, 7, '半']];
  const STEPS_MINOR = [[0, 1, '全'], [1, 2, '半'], [2, 3, '全'], [3, 4, '全'], [4, 5, '半'], [5, 6, '全'], [6, 7, '全']];
  const NUMBERS = ['1', '2', '3', '4', '5', '6', '7', '1'];
  const NAMES = ['主', '上主', '中', '下属', '属', '下中', '导', '主'];

  // 以主音为中心的对称图：下属音、下中音在主音下方，中音、属音在主音上方
  const center = (labels, extra = {}) => scale(['F3', 'A3', 'C4', 'E4', 'G4'], {tonic: [2], captions: labels, extra: {grand: true, ...extra}});

  const {steps, sections, section, group, quiz, p, accent} = ChordLesson.builder();
  let n = 0;
  const say = (text, scene, extra = {}) => group('p' + (++n), [[p(text), scene, extra]]);

  section('scale', '一', '什么是音阶');
  say('<strong>音阶（Scale）</strong>是按音高顺序排列的一组音，从一个音开始，到它高八度的同名音结束。', scale(MAJOR), {hint: '点击音符可以试听；点击空白处按顺序播放整条音阶。'});
  say('音阶的第一个音叫<strong>主音（Tonic）</strong>，它是整条音阶的中心，旋律最后通常回到这个音。', scale(MAJOR, {captions: ['主音', '', '', '', '', '', '', '主音']}));
  say('相邻两个音之间相距全音或半音；全音与半音的排列顺序，决定了音阶的种类。', scale(MAJOR, {intervals: STEPS_MAJOR}));
  say(`大调音阶的排列是${accent('全、全、半、全、全、全、半')}。`, scale(MAJOR, {intervals: STEPS_MAJOR, mark: [2, 3, 6, 7]}));
  say(`自然小调音阶的排列是${accent('全、半、全、全、半、全、全')}。`, scale(MINOR, {intervals: STEPS_MINOR, mark: [1, 2, 4, 5]}));
  quiz('half-steps', scale(MAJOR), {
    question: '大调音阶中，半音出现在哪两组相邻的音之间？',
    options: [['34', '3–4 与 7–1'], ['23', '2–3 与 6–7'], ['12', '1–2 与 4–5']], answer: '34',
    right: '大调音阶是全、全、半、全、全、全、半：半音在 3–4 与 7–1 之间。',
    wrong: '数一数谱例中相邻两个音的距离，找出两个半音。'
  });

  section('numbers', '二', '音级的数字');
  say('音阶里的每一个音叫一个<strong>音级（Scale Degree）</strong>，从主音开始依次编号为 1 到 7。', scale(MAJOR, {labels: NUMBERS}));
  say('本课程以大调音阶为标准：其他音阶里与大调不同的音级，在数字前加升号或降号标记。', scale(MINOR, {labels: ['1', '2', '♭3', '4', '5', '♭6', '♭7', '1'], mark: [2, 5, 6]}));
  say('这样，不论什么音阶，都可以用同一套数字直接比较。', {...scale(MINOR, {labels: ['1', '2', '♭3', '4', '5', '♭6', '♭7', '1'], mark: [2, 5, 6]}), caption: '自然小调：1　2　♭3　4　5　♭6　♭7'});
  quiz('minor-degrees', scale(MINOR, {labels: ['1', '2', '', '4', '5', '', '', '1']}), {
    question: '自然小调中，哪几个音级与大调不同？（多选）',
    options: [['b3', '♭3'], ['2', '2'], ['b6', '♭6'], ['4', '4'], ['b7', '♭7']], answer: ['b3', 'b6', 'b7'],
    right: '自然小调的 3、6、7 级都比大调低半音：♭3、♭6、♭7。',
    wrong: '把谱例和大调音阶逐个比较，看哪些音低了半音。'
  });

  section('names', '三', '音级的名称');
  say('音级除了数字，还有各自的名称；每个名称说明的都是这个音与主音的关系。', scale(MAJOR, {labels: NUMBERS}));
  say('1 级叫<strong>主音（Tonic）</strong>，是音阶的中心。', center(['', '', '主音', '', '']));
  say(`5 级叫<strong>属音（Dominant）</strong>：它在主音${accent('上方纯五度')}，是仅次于主音、最有力量的音；英文 dominant 的意思是「支配」，它最强烈地把音乐引回主音。`, center(['', '', '主音', '', '属音']));
  say(`4 级叫<strong>下属音（Subdominant）</strong>：「下」指它在主音${accent('下方纯五度')}，与属音隔着主音对称，并不是「属音下面的音」。`, {...center(['下属音', '', '主音', '', '属音']), arcs: [{from: 's0', to: 's2', text: 'P5', color: COLOR.ext, side: 'left'}, {from: 's2', to: 's4', text: 'P5', color: COLOR.ext, side: 'right'}]});
  say('3 级叫<strong>中音（Mediant）</strong>：它位于主音与属音的中间。', center(['下属音', '', '主音', '中音', '属音']));
  say('6 级叫<strong>下中音（Submediant）</strong>：它位于主音与下方的下属音中间，与中音对称。', center(['下属音', '下中音', '主音', '中音', '属音']));
  say('2 级叫<strong>上主音（Supertonic）</strong>：它是主音上方的一级。', scale(MAJOR, {captions: NAMES.map((t, i) => i === 1 ? '上主' : i === 0 || i === 7 ? '主' : '')}));
  say(`7 级与主音相距${accent('半音')}时，叫<strong>导音（Leading Tone）</strong>，它强烈地倾向于向上进行到主音。`, scale(['B3', 'C4'], {tonic: [1], mark: [0], captions: ['导音', '主音'], intervals: [[0, 1, '半']]}));
  say(`7 级与主音相距${accent('全音')}时，叫<strong>下主音（Subtonic）</strong>；自然小调的 ♭7 就是下主音。`, scale(['Bb3', 'C4'], {tonic: [1], mark: [0], captions: ['下主音', '主音'], intervals: [[0, 1, '全']]}));
  say('把七个名称放回音阶，就得到完整的音级名称。', scale(MAJOR, {labels: NUMBERS, captions: NAMES}));
  quiz('subdominant', center(['', '', '主音', '', '']), {
    question: '「下属音」的「下」指的是：',
    options: [['below-tonic', '在主音下方纯五度'], ['below-dominant', '在属音下方'], ['lower', '比属音低一级']], answer: 'below-tonic',
    right: '下属音在主音下方纯五度，和主音上方纯五度的属音对称。',
    wrong: '回想对称图：属音和下属音分别在主音的哪一边？'
  });
  quiz('dominant-c', scale(MAJOR), {
    question: 'C 大调的属音是：',
    options: [['g', 'G'], ['f', 'F'], ['d', 'D']], answer: 'g',
    right: '属音在主音上方纯五度：C 上方纯五度是 G。F 是下属音，D 是上主音。',
    wrong: '属音在主音上方纯五度。'
  });
  quiz('subtonic', scale(MINOR, {labels: ['1', '2', '♭3', '4', '5', '♭6', '♭7', '1']}), {
    question: '自然小调的 7 级（♭7）叫：',
    options: [['subtonic', '下主音'], ['leading', '导音'], ['supertonic', '上主音']], answer: 'subtonic',
    right: '♭7 与主音相距全音，叫下主音；只有相距半音时才叫导音。',
    wrong: '看 7 级和主音之间是全音还是半音。'
  });

  ChordLesson.run({
    steps, sections, quizExtras: true, tapParts: true,
    preload: ['F3', 'A3', 'B3', 'Bb3', 'C4', 'D4', 'E4', 'Eb4', 'F4', 'G4', 'A4', 'Ab4', 'B4', 'Bb4', 'C5']
  });
})();
