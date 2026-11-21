/* 调式与音阶 · 第三课：偏大的调式——利底亚、混合利底亚（初稿，2026-11-21）
   依据 docs/scales/course-proposal.md：和大调比较，找特征音与特征和弦进行。待老师逐页审核。 */
(() => {
  'use strict';
  const {scale, modeScale, chords} = ScaleKit;
  const MAJOR = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
  const MAJOR_LABELS = ['1', '2', '3', '4', '5', '6', '7', '1'];

  const {steps, sections, section, group, quiz, p, accent} = ChordLesson.builder();
  let n = 0;
  const say = (text, scene, extra = {}) => group('p' + (++n), [[p(text), scene, extra]]);

  section('lydian', '一', '利底亚');
  say('偏大的调式，都与同一个主音上的大调比较。', scale(MAJOR, {labels: MAJOR_LABELS}), {hint: '点击音符可以试听；点击空白处按顺序播放。'});
  say(`<strong>利底亚（Lydian）</strong>＝大调升高 4 级，特征音是 ${accent('♯4')}。`, modeScale('lydian'));
  say('♯4 与主音构成增四度，取代了大调中与主音构成纯四度的 4 级，使音阶听起来更明亮、更有悬浮感。', scale(['C4', 'F#4'], {labels: ['1', '♯4'], mark: [1], intervals: [[0, 1, '增四度']]}));
  say('利底亚最常见的和弦进行，是主和弦 I 与大三和弦 II 之间的往复；II 和弦中正好包含特征音 ♯4。',
    chords([[['C4', 'E4', 'G4'], 'C'], [['D4', 'F#4', 'A4'], 'D']], {labels: ['I', 'II']}));
  quiz('lydian-mark', modeScale('lydian', {labels: [], mark: []}), {
    question: '谱例中的调式是：',
    options: [['lydian', '利底亚'], ['mixolydian', '混合利底亚'], ['major', '大调']], answer: 'lydian',
    right: '主音上方是大三度，与大调相比只有 F♯ 不同：♯4，是利底亚。',
    wrong: '先看三度判断偏大还是偏小，再和大调逐个比较。'
  });

  section('mixolydian', '二', '混合利底亚');
  say(`<strong>混合利底亚（Mixolydian）</strong>＝大调降低 7 级，特征音是 ${accent('♭7')}。`, modeScale('mixolydian'));
  say('♭7 与主音相距全音，音阶失去了导音，结尾不再有半音的强烈解决，听起来更放松。', scale(['Bb4', 'C5'], {tonic: [1], labels: ['♭7', '1'], mark: [0], intervals: [[0, 1, '全']]}));
  say('混合利底亚最常见的和弦进行，是主和弦 I 与大三和弦 ♭VII 之间的往复；♭VII 的根音就是特征音 ♭7。',
    chords([[['C4', 'E4', 'G4'], 'C'], [['Bb3', 'D4', 'F4'], 'B♭']], {labels: ['I', '♭VII']}));
  say('在混合利底亚的主和弦上加入 ♭7，得到的是属七和弦；这一点会在第五课继续讲。', scale(['C4', 'E4', 'G4', 'Bb4'], {labels: ['1', '3', '5', '♭7'], mark: [3], extra: {staffSymbols: [{slot: 2.55, root: 'C', suffix: '7', size: 15}]}}));
  quiz('mixo-chords', chords([[['C4', 'E4', 'G4'], 'C'], [['Bb3', 'D4', 'F4'], 'B♭']]), {
    question: '主和弦 C 与 B♭ 来回进行，带出的调式色彩是：',
    options: [['mixolydian', '混合利底亚'], ['lydian', '利底亚'], ['dorian', '多利亚']], answer: 'mixolydian',
    right: 'B♭ 是 C 的 ♭7，I–♭VII 是混合利底亚的特征和弦进行。',
    wrong: 'B♭ 和弦的根音，是主音 C 的第几级？'
  });

  section('listen', '三', '怎样听出来');
  say('听辨偏大的调式时，先让主音持续，再听 4 级与 7 级：4 级升高是利底亚，7 级降低是混合利底亚。', scale(['C4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'Bb4', 'C5'], {labels: ['1', '2', '3', '4?', '5', '6', '7?', '1'], mark: [3, 6]}));
  say('两个音都与大调相同，就是大调本身。', scale(MAJOR, {labels: MAJOR_LABELS}));
  quiz('which-note', modeScale('mixolydian', {labels: []}), {
    question: '区分利底亚、混合利底亚和大调，要重点听哪两个音级？',
    options: [['47', '4 级与 7 级'], ['36', '3 级与 6 级'], ['25', '2 级与 5 级']], answer: '47',
    right: '利底亚升高 4 级，混合利底亚降低 7 级；其余音级都和大调相同。',
    wrong: '回想两种调式的特征音。'
  });

  ChordLesson.run({
    steps, sections, quizExtras: true, tapParts: true,
    preload: ['Bb3', 'C4', 'D4', 'E4', 'F4', 'F#4', 'G4', 'A4', 'Bb4', 'B4', 'C5']
  });
})();
