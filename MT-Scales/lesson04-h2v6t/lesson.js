/* 调式与音阶 · 第四课：偏小的调式——多利亚、弗里吉亚、洛克里亚（初稿，2026-11-21）
   依据 docs/scales/course-proposal.md：和自然小调比较，找特征音与特征和弦进行。待老师逐页审核。 */
(() => {
  'use strict';
  const {scale, modeScale, chords} = ScaleKit;
  const MINOR = ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5'];
  const MINOR_LABELS = ['1', '2', '♭3', '4', '5', '♭6', '♭7', '1'];

  const {steps, sections, section, group, quiz, p, accent} = ChordLesson.builder();
  let n = 0;
  const say = (text, scene, extra = {}) => group('p' + (++n), [[p(text), scene, extra]]);

  section('dorian', '一', '多利亚');
  say('偏小的调式，都与同一个主音上的自然小调比较。', scale(MINOR, {labels: MINOR_LABELS}), {hint: '点击音符可以试听；点击空白处按顺序播放。'});
  say(`<strong>多利亚（Dorian）</strong>＝自然小调升高 6 级，特征音是还原的 ${accent('6')}（大六度）。`, modeScale('dorian'));
  say('大六度让小调的色彩变得明亮一些，是流行、爵士、放克中最常用的小调式之一。', scale(['C4', 'A4'], {labels: ['1', '6'], mark: [1], intervals: [[0, 1, '大六度']]}));
  say('多利亚最常见的和弦进行，是小三和弦 i 与大三和弦 IV 之间的往复；IV 和弦的三音正好是特征音 6。',
    chords([[['C4', 'Eb4', 'G4'], 'C', 'm'], [['C4', 'F4', 'A4'], 'F']], {labels: ['i', 'IV']}));
  quiz('dorian-chords', chords([[['C4', 'Eb4', 'G4'], 'C', 'm'], [['C4', 'F4', 'A4'], 'F']]), {
    question: '主和弦 Cm 与 F 来回进行，带出的调式色彩是：',
    options: [['dorian', '多利亚'], ['aeolian', '自然小调'], ['phrygian', '弗里吉亚']], answer: 'dorian',
    right: 'F 大三和弦里有 A，是 C 的大六度：i–IV 是多利亚的特征和弦进行。自然小调的 iv 是 Fm。',
    wrong: 'F 和弦里有 A 还是 A♭？它是主音 C 的几度？'
  });

  section('phrygian', '二', '弗里吉亚');
  say(`<strong>弗里吉亚（Phrygian）</strong>＝自然小调降低 2 级，特征音是 ${accent('♭2')}。`, modeScale('phrygian'));
  say('♭2 与主音只相距半音，从上方紧贴着主音，带来紧张、带有异国色彩的声音，常见于弗拉门戈与金属音乐。', scale(['C4', 'Db4'], {labels: ['1', '♭2'], mark: [1], intervals: [[0, 1, '半']]}));
  say('弗里吉亚最常见的和弦进行，是小三和弦 i 与大三和弦 ♭II 之间的往复；♭II 的根音就是特征音 ♭2。',
    chords([[['C4', 'Eb4', 'G4'], 'C', 'm'], [['Db4', 'F4', 'Ab4'], 'D♭']], {labels: ['i', '♭II']}));

  section('locrian', '三', '洛克里亚');
  say(`<strong>洛克里亚（Locrian）</strong>＝弗里吉亚再降低 5 级，特征音是 ${accent('♭2 与 ♭5')}。`, modeScale('locrian'));
  say('♭5 使主和弦成为减三和弦，主音无法稳定下来，所以洛克里亚很少作为整首乐曲的调式。', scale(['C4', 'Eb4', 'Gb4'], {labels: ['1', '♭3', '♭5'], mark: [2], extra: {staffSymbols: [{slot: 2.55, root: 'C', suffix: '°', size: 15}]}}));
  say('洛克里亚更常出现在半减七和弦上：在和弦进行中短暂经过，而不作为中心。', scale(['C4', 'Eb4', 'Gb4', 'Bb4'], {labels: ['1', '♭3', '♭5', '♭7'], mark: [2], extra: {staffSymbols: [{slot: 2.55, root: 'C', suffix: 'm7(♭5)', size: 15}]}}));

  section('listen', '四', '怎样听出来');
  say('听辨偏小的调式时，先让主音持续，再听 2 级与 6 级：6 级还原是多利亚，2 级降低是弗里吉亚，两者都与自然小调相同就是自然小调本身。', scale(MINOR, {labels: ['1', '2?', '♭3', '4', '5', '6?', '♭7', '1'], mark: [1, 5]}));
  quiz('phrygian-id', modeScale('phrygian', {labels: [], mark: []}), {
    question: '谱例中的调式是：',
    options: [['phrygian', '弗里吉亚'], ['dorian', '多利亚'], ['locrian', '洛克里亚']], answer: 'phrygian',
    right: '主音上方是小三度；和自然小调相比，只有 D♭ 不同（♭2），5 级仍是 G：弗里吉亚。',
    wrong: '先和自然小调比较 2 级、6 级，再看 5 级有没有降低。'
  });
  quiz('marks', modeScale('aeolian', {labels: [], mark: []}), {
    question: '多利亚、弗里吉亚、洛克里亚的特征音分别是：',
    options: [['a', '6；♭2；♭2 与 ♭5'], ['b', '♭6；♭2；♭5'], ['c', '6；♭3；♭5']], answer: 'a',
    right: '多利亚升高 6 级；弗里吉亚降低 2 级；洛克里亚在弗里吉亚的基础上再降低 5 级。',
    wrong: '三种调式都和自然小调比较。'
  });

  ChordLesson.run({
    steps, sections, quizExtras: true, tapParts: true,
    preload: ['C4', 'Db4', 'D4', 'Eb4', 'F4', 'Gb4', 'G4', 'Ab4', 'A4', 'Bb4', 'C5']
  });
})();
