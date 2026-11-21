/* 调式与音阶 · 第六课：其他常用音阶（初稿，2026-11-21）
   依据 docs/scales/course-proposal.md：五声音阶、布鲁斯音阶、和声小调、旋律小调，及旋律小调的两个常用调式。待老师逐页审核。 */
(() => {
  'use strict';
  const {scale} = ScaleKit;

  const {steps, sections, section, group, quiz, p, accent} = ChordLesson.builder();
  let n = 0;
  const say = (text, scene, extra = {}) => group('p' + (++n), [[p(text), scene, extra]]);

  const MAJ_PENTA = scale(['C4', 'D4', 'E4', 'G4', 'A4', 'C5'], {labels: ['1', '2', '3', '5', '6', '1']});
  const MIN_PENTA = scale(['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5'], {labels: ['1', '♭3', '4', '5', '♭7', '1']});
  const BLUES = scale(['C4', 'Eb4', 'F4', 'Gb4', 'G4', 'Bb4', 'C5'], {labels: ['1', '♭3', '4', '♭5', '5', '♭7', '1'], mark: [3]});
  const HARMONIC = scale(['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'B4', 'C5'], {labels: ['1', '2', '♭3', '4', '5', '♭6', '7', '1'], mark: [6]});
  const MELODIC = scale(['C4', 'D4', 'Eb4', 'F4', 'G4', 'A4', 'B4', 'C5'], {labels: ['1', '2', '♭3', '4', '5', '6', '7', '1'], mark: [5, 6]});
  const LYD_DOM = scale(['C4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'Bb4', 'C5'], {labels: ['1', '2', '3', '♯4', '5', '6', '♭7', '1'], mark: [3, 6]});
  const ALTERED = scale(['C4', 'Db4', 'D#4', 'E4', 'F#4', 'Ab4', 'Bb4', 'C5'], {labels: ['1', '♭9', '♯9', '3', '♯11', '♭13', '♭7', '1'], mark: [1, 2, 4, 5]});

  section('pentatonic', '一', '五声音阶');
  say('<strong>大调五声音阶（Major Pentatonic）</strong>由大调的 1、2、3、5、6 级组成，去掉了 4 级与 7 级。', MAJ_PENTA, {hint: '点击音符可以试听；点击空白处按顺序播放。'});
  say('去掉的两个音，正是大调里构成半音的音；所以五声音阶中没有半音，任意几个音同时出现都不刺耳。', {...MAJ_PENTA, intervals: [['s0', 's1', '全'], ['s1', 's2', '全'], ['s2', 's3', '小三'], ['s3', 's4', '全'], ['s4', 's5', '小三']]});
  say('<strong>小调五声音阶（Minor Pentatonic）</strong>由自然小调的 1、♭3、4、5、♭7 级组成，同样没有半音。', MIN_PENTA);
  say('<strong>布鲁斯音阶（Blues Scale）</strong>是在小调五声音阶中加入 ♭5，这个音常被称作「蓝调音」。', BLUES);
  quiz('penta', MAJ_PENTA, {
    question: '大调五声音阶去掉了大调的哪两个音级？',
    options: [['47', '4 级与 7 级'], ['26', '2 级与 6 级'], ['37', '3 级与 7 级']], answer: '47',
    right: '大调五声音阶是 1、2、3、5、6：去掉的 4 级和 7 级，正是大调中构成半音的音。',
    wrong: '数一数谱例中出现了哪几个音级。'
  });

  section('minors', '二', '和声小调与旋律小调');
  say(`<strong>和声小调（Harmonic Minor）</strong>是把自然小调的 7 级升高半音，${accent('恢复导音')}，使旋律与和声都能强烈地回到主音。`, HARMONIC);
  say('♭6 与 7 之间形成增二度，这个音程是和声小调最明显的声音特点。', {...HARMONIC, intervals: [['s5', 's6', '增二度']]});
  say(`<strong>旋律小调（Melodic Minor）</strong>是把自然小调的 ${accent('6 级和 7 级')}都升高半音：前半像小调，后半像大调。`, MELODIC);
  say('古典音乐里，旋律小调下行时还原为自然小调；现代音乐中，上行与下行都使用同一种排列。', MELODIC);
  quiz('harmonic', HARMONIC, {
    question: '和声小调与自然小调的区别是：',
    options: [['7', '7 级升高半音'], ['67', '6 级和 7 级都升高半音'], ['6', '6 级升高半音']], answer: '7',
    right: '和声小调只升高 7 级，恢复导音；6、7 级都升高的是旋律小调。',
    wrong: '和声小调要解决的是哪个问题？哪一个音级与此有关？'
  });

  section('melodic-modes', '三', '旋律小调的两个常用调式');
  say('旋律小调也能从不同的音级开始形成调式，现代音乐中最常用的有两种。', MELODIC);
  say('从 4 级开始，得到<strong>利底亚属音阶（Lydian Dominant）</strong>：混合利底亚再升高 4 级，常配不解决的属七和弦 7(♯11)。', {...LYD_DOM, staffSymbols: [{slot: 2.55, root: 'C', suffix: '7(♯11)', size: 15}]});
  say('从 7 级开始，得到<strong>变化音阶（Altered Scale）</strong>：它包含属和弦的全部四个变化音 ♭9、♯9、♯11、♭13，常配 7alt 和弦。', {...ALTERED, staffSymbols: [{slot: 2.55, root: 'C', suffix: '7alt', size: 15}]});
  quiz('altered', ALTERED, {
    question: '变化音阶包含属和弦的哪些变化音？（多选）',
    options: [['b9', '♭9'], ['s9', '♯9'], ['s11', '♯11'], ['b13', '♭13'], ['b5', '♭5 与 5 都有']], answer: ['b9', 's9', 's11', 'b13'],
    right: '变化音阶 = 1、♭9、♯9、3、♯11、♭13、♭7：包含全部四个变化音，所以配 7alt 和弦。',
    wrong: '逐个看谱例里红色的音，各是属和弦的第几音？'
  });

  ChordLesson.run({
    steps, sections, quizExtras: true, tapParts: true,
    preload: ['C4', 'Db4', 'D4', 'D#4', 'Eb4', 'E4', 'F4', 'F#4', 'Gb4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5']
  });
})();
