/* 调式与音阶 · 第七课：综合——听辨与分析（初稿，2026-11-21）
   依据 docs/scales/course-proposal.md：判断调式的四个步骤。演示的旋律为课程自编短例；
   课后的全曲分析作品待老师决定（自编或版权开放的爵士标准曲）。待老师逐页审核。 */
(() => {
  'use strict';
  const {scale, chords} = ScaleKit;
  // 自编短旋律：D 多利亚（结束在 D，出现 B 还原）、G 混合利底亚（结束在 G，出现 F 还原）
  const DORIAN = ['D4', 'F4', 'A4', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4'];
  const MIXO = ['G4', 'B4', 'D5', 'F5', 'E5', 'D5', 'C5', 'A4', 'G4'];
  const melody = (keys, opts = {}) => scale(keys, {tonic: keys.map((k, i) => k === keys[0] ? i : -1).filter(i => i >= 0), ...opts});

  const {steps, sections, section, group, quiz, p, accent} = ChordLesson.builder();
  let n = 0;
  const say = (text, scene, extra = {}) => group('p' + (++n), [[p(text), scene, extra]]);

  section('steps', '一', '判断调式的四个步骤');
  say(`判断一段音乐的调式，按四个步骤进行：${accent('找主音、和大调比较、找特征音、确定调式')}。`, melody(DORIAN), {hint: '点击空白处播放旋律。'});
  say('第一步，找主音：旋律最后停下、低音反复回到的那个音，就是主音。', melody(DORIAN, {captions: ['主音', '', '', '', '', '', '', '', '主音']}));
  say('第二步，和同主音的大调比较：把出现的每一个音标成音级，与大调不同的加上升降号。', melody(DORIAN, {labels: ['1', '♭3', '5', '6', '5', '4', '♭3', '2', '1']}));
  say('第三步，找特征音：先看 3 级判断偏大还是偏小，再看与大调或自然小调不同的那个音。', melody(DORIAN, {labels: ['1', '♭3', '5', '6', '5', '4', '♭3', '2', '1'], mark: [3]}));
  say('第四步，确定调式：偏小、6 级还原，这段旋律是 D 多利亚。', {...melody(DORIAN, {labels: ['1', '♭3', '5', '6', '5', '4', '♭3', '2', '1'], mark: [3]}), caption: 'D 多利亚：特征音 B（6）'});

  section('chords', '二', '从和弦进行判断');
  say('有和弦伴奏时，特征和弦往往比旋律更快地透露调式。', chords([[['G3', 'B3', 'D4'], 'G'], [['F3', 'A3', 'C4'], 'F']], {labels: ['I', '♭VII']}));
  say('主和弦 G 与 F 来回进行，F 是 G 的 ♭VII，说明这是 G 混合利底亚。', melody(MIXO, {labels: ['1', '3', '5', '♭7', '6', '5', '4', '2', '1'], mark: [3]}));
  say('很多乐曲只在一段里借用某种调式的色彩，并不是整首都处在同一个调式中；分析时按段落判断即可。', chords([[['C4', 'E4', 'G4'], 'C'], [['Bb3', 'D4', 'F4'], 'B♭'], [['F3', 'A3', 'C4'], 'F'], [['C4', 'E4', 'G4'], 'C']], {labels: ['I', '♭VII', 'IV', 'I']}));

  section('practice', '三', '练一练');
  quiz('id-mixo', melody(MIXO), {
    question: '谱例中旋律的调式是（主音为 G）：',
    options: [['mixolydian', 'G 混合利底亚'], ['major', 'G 大调'], ['dorian', 'G 多利亚']], answer: 'mixolydian',
    right: '主音 G 上方是大三度 B，偏大；F 是 G 的 ♭7，与 G 大调的 F♯ 不同：G 混合利底亚。',
    wrong: '先看 B 判断偏大偏小，再看 F 和 G 大调相比有什么不同。'
  });
  quiz('id-phrygian', chords([[['E3', 'G3', 'B3'], 'E', 'm'], [['F3', 'A3', 'C4'], 'F']], {labels: ['i', '']}), {
    question: '主和弦 Em 与 F 来回进行，带出的调式色彩是：',
    options: [['phrygian', 'E 弗里吉亚'], ['aeolian', 'E 自然小调'], ['dorian', 'E 多利亚']], answer: 'phrygian',
    right: 'F 是 E 的 ♭2，i–♭II 是弗里吉亚的特征和弦进行。',
    wrong: 'F 和弦的根音，是主音 E 的第几级？'
  });

  ChordLesson.run({
    steps, sections, quizExtras: true, tapParts: true,
    preload: ['E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'Bb3', 'C5', 'D5', 'E5', 'F5']
  });
})();
