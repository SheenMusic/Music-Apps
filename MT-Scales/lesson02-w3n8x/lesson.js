/* 调式与音阶 · 第二课：同一个主音，七种调式（初稿，2026-11-21）
   依据 docs/scales/course-proposal.md：平行比较、偏大与偏小、亮度阶梯。待老师逐页审核。 */
(() => {
  'use strict';
  const {scale, modeScale, mode, modeButtons, MODES} = ScaleKit;
  const WHITE = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5'];
  const fromDegree = (k, name) => scale(WHITE.slice(k, k + 8), {captions: [name]});
  // 亮度阶梯：从 i 到下一级，降低的那个音标红
  const LOWERED = {ionian: 3, mixolydian: 6, dorian: 2, aeolian: 5, phrygian: 1, locrian: 4};
  const ladder = id => {
    const m = mode(id);
    return {...scale(m.keys, {labels: m.labels, mark: LOWERED[id] === undefined ? [3] : [LOWERED[id]]}), controls: modeButtons().map(([key, text]) => [key.replace('mode:', 'ladder:'), text]), pressed: `ladder:${id}`, caption: m.zh};
  };
  const picker = id => ({...modeScale(id), controls: modeButtons(), pressed: `mode:${id}`, caption: `${mode(id).zh}（${mode(id).family === 'major' ? '偏大' : '偏小'}）`});

  const {steps, sections, section, group, quiz, p, accent} = ChordLesson.builder();
  let n = 0;
  const say = (text, scene, extra = {}) => group('p' + (++n), [[p(text), scene, extra]]);

  section('names', '一', '七种调式');
  say('大调音阶从不同的音级开始，可以得到七种不同的全音、半音排列，叫作七种<strong>调式（Mode）</strong>。', fromDegree(1, '从 2 级开始'));
  say('七种调式的名称来自古希腊的地名：伊奥尼亚、多利亚、弗里吉亚、利底亚、混合利底亚、爱奥利亚、洛克里亚。', fromDegree(1, '多利亚'));
  say(`其中，${accent('伊奥尼亚就是大调，爱奥利亚就是自然小调')}；本课程之后直接使用「大调」和「自然小调」这两个名称。`, scale(['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4'], {captions: ['从 6 级开始：自然小调']}));
  say('只记「从第几级开始」，记住的只是白键的位置，换一个主音就要重新推算，也听不出每种调式的声音。', fromDegree(1, '多利亚'));
  say('更有效的方法是<strong>平行比较</strong>：把七种调式放在同一个主音上，看每一种与大调或自然小调差在哪个音。', modeScale('dorian'));

  section('family', '二', '偏大与偏小');
  say(`主音上方是${accent('大三度')}的调式，听起来偏大：利底亚、大调、混合利底亚。`, picker('lydian'), {hint: '点击下方的按钮，比较同一个主音上的七种调式。'});
  say(`主音上方是${accent('小三度')}的调式，听起来偏小：多利亚、自然小调、弗里吉亚、洛克里亚。`, picker('dorian'));
  say('偏大的调式与大调比较，偏小的调式与自然小调比较，每种只差一两个音。', picker('mixolydian'));
  say('这个与众不同的音，叫作这种调式的<strong>特征音（Characteristic Note）</strong>，在谱例中用红色标出。', picker('dorian'));
  quiz('family-dorian', modeScale('dorian'), {
    question: '多利亚调式听起来偏大还是偏小？',
    options: [['minor', '偏小'], ['major', '偏大']], answer: 'minor',
    right: '多利亚的主音上方是小三度（♭3），所以偏小，要和自然小调比较。',
    wrong: '看主音上方的三度是大三度还是小三度。'
  });

  section('ladder', '三', '亮度阶梯');
  say('七种调式还可以按亮度排成一列：每往下一级，就有一个音降低半音，听起来更暗。', ladder('lydian'));
  say('最亮的是利底亚；把它的 ♯4 还原成 4，就是大调。', ladder('ionian'));
  say('把大调的 7 降低半音，就是混合利底亚。', ladder('mixolydian'));
  say('再把 3 降低半音，就是多利亚，调式从偏大变成偏小。', ladder('dorian'));
  say('再把 6 降低半音，就是自然小调。', ladder('aeolian'));
  say('再把 2 降低半音，就是弗里吉亚。', ladder('phrygian'));
  say('最后把 5 降低半音，就是最暗的洛克里亚。', ladder('locrian'), {hint: '点击按钮，从亮到暗依次听一遍。'});
  quiz('brightest', modeScale('ionian'), {
    question: '七种调式中，最亮的是：',
    options: [['lydian', '利底亚'], ['ionian', '大调'], ['mixolydian', '混合利底亚']], answer: 'lydian',
    right: '利底亚比大调多一个升高的音（♯4），是最亮的调式。',
    wrong: '亮度阶梯的最上面是哪一种？它和大调差在哪个音？'
  });
  quiz('mixo-step', modeScale('mixolydian', {mark: []}), {
    question: '混合利底亚与大调相比，哪个音不同？',
    options: [['b7', '♭7'], ['b3', '♭3'], ['s4', '♯4']], answer: 'b7',
    right: '混合利底亚 = 大调降低 7 级：♭7。',
    wrong: '把谱例和大调音阶逐个比较。'
  });

  ChordLesson.run({
    steps, sections, quizExtras: true, tapParts: true,
    onControl: id => id.startsWith('ladder:') ? ladder(id.slice(7)) : picker(id.slice(5)),
    preload: ['A3', 'B3', 'C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'F#4', 'Gb4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5', 'D5']
  });
})();
