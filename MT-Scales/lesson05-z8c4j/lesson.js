/* 调式与音阶 · 第五课：调式与七和弦（初稿，2026-11-21）
   依据 docs/scales/course-proposal.md：每种调式的主和弦七和弦；从和弦记号推断调式（衔接和弦记号课）。待老师逐页审核。 */
(() => {
  'use strict';
  const {scale, mode, modeButtons, MARK} = ScaleKit;
  const {chordSymbol: cs} = ChordStage;
  // 每种调式的主和弦七和弦，以及能进一步区分调式的延伸音（在音阶里的位置）
  const TONIC = {
    lydian: ['maj7', '♯11', 3], ionian: ['maj7', '', -1], mixolydian: ['7', '', -1],
    dorian: ['m7', '13', 5], aeolian: ['m7', '♭13', 5], phrygian: ['m7', '♭9', 1], locrian: ['m7(♭5)', '', -1]
  };
  // 音阶上标出 1、3、5、7 级（其余音变灰），谱例上方写主和弦七和弦
  function stacked(id, {withTension = false} = {}) {
    const m = mode(id), [suffix, tension, at] = TONIC[id];
    const chordTones = [0, 2, 4, 6, 7];
    const faint = m.keys.map((_, i) => i).filter(i => !chordTones.includes(i) && !(withTension && i === at));
    const full = withTension && tension ? (suffix === 'maj7' ? `maj7(${tension})` : suffix === 'm7' && tension === '13' ? 'm13' : `${suffix}(${tension})`) : suffix;
    return {...scale(m.keys, {labels: m.labels, faint, mark: withTension && at >= 0 ? [at] : m.mark.filter(i => chordTones.includes(i))}),
      staffSymbols: [{slot: 2.55, root: 'C', suffix: full, size: 16}], controls: modeButtons(), pressed: `mode:${id}`, caption: m.zh};
  }
  const table = {key: 'chord-modes', html: '<div class="compare-table" role="table" aria-label="和弦记号与调式" style="--cols: 1fr 2fr">' +
    '<div class="compare-row compare-head" role="row"><span role="columnheader">和弦记号</span><span role="columnheader">可以配的调式</span></div>' +
    [['maj7', '大调、利底亚'], ['7', '混合利底亚'], ['m7', '多利亚、自然小调、弗里吉亚'], ['m7(♭5)', '洛克里亚']]
      .map(([x, t]) => `<div class="compare-row" role="row"><span role="cell">${cs('C', x)}</span><span role="cell">${t}</span></div>`).join('') + '</div>'};
  const tensions = {key: 'tension-modes', html: '<div class="compare-table" role="table" aria-label="延伸音与调式" style="--cols: 1fr 2fr">' +
    '<div class="compare-row compare-head" role="row"><span role="columnheader">和弦记号</span><span role="columnheader">调式</span></div>' +
    [['maj7(♯11)', '利底亚'], ['m13', '多利亚'], ['m7(♭13)', '自然小调'], ['m7(♭9)', '弗里吉亚']]
      .map(([x, t]) => `<div class="compare-row" role="row"><span role="cell">${cs('C', x)}</span><span role="cell">${t}</span></div>`).join('') + '</div>'};

  const {steps, sections, section, group, quiz, p, accent} = ChordLesson.builder();
  let n = 0;
  const say = (text, scene, extra = {}) => group('p' + (++n), [[p(text), scene, extra]]);

  section('tonic', '一', '每种调式的主和弦');
  say('在调式的 1、3、5、7 级上叠出七和弦，得到这种调式的主和弦。', stacked('ionian'), {hint: '点击下方的按钮，比较七种调式的主和弦。'});
  say(`大调与利底亚的主和弦都是 ${accent('maj7')}。`, stacked('lydian'));
  say(`混合利底亚的主和弦是 ${accent('7')}（属七和弦）。`, stacked('mixolydian'));
  say(`多利亚、自然小调、弗里吉亚的主和弦都是 ${accent('m7')}。`, stacked('dorian'));
  say(`洛克里亚的主和弦是 ${accent('m7(♭5)')}（半减七和弦）。`, stacked('locrian'));

  section('reverse', '二', '从和弦记号推断调式');
  say('反过来，看到一个和弦记号，就能把调式缩小到一两种。', {panel: table});
  say('主和弦相同的几种调式，要靠特征音来区分；特征音写进记号成为延伸音时，调式就确定了。', stacked('lydian', {withTension: true}));
  say('利底亚的 ♯4 写成 ♯11：maj7(♯11)。', stacked('lydian', {withTension: true}));
  say('多利亚的 6 写成 13：m13；自然小调的 ♭6 写成 ♭13：m7(♭13)。', stacked('dorian', {withTension: true}));
  say('弗里吉亚的 ♭2 写成 ♭9：m7(♭9)。', stacked('phrygian', {withTension: true}));
  say('把这些对应整理在一起：', {panel: tensions});
  quiz('c7', {panel: {key: 'q-c7', html: `<p class="symbol-row big">${cs('C', '7')}</p>`}}, {
    question: '和弦 C7 对应的调式是：',
    options: [['mixolydian', '混合利底亚'], ['ionian', '大调'], ['dorian', '多利亚']], answer: 'mixolydian',
    right: '1、3、5、♭7：大三和弦加小七度，是混合利底亚的主和弦。',
    wrong: 'C7 的七音是大七度还是小七度？哪种偏大的调式有 ♭7？'
  });
  quiz('cm7b9', {panel: {key: 'q-cm7b9', html: `<p class="symbol-row big">${cs('C', 'm7(♭9)')}</p>`}}, {
    question: '和弦 Cm7(♭9) 对应的调式是：',
    options: [['phrygian', '弗里吉亚'], ['aeolian', '自然小调'], ['locrian', '洛克里亚']], answer: 'phrygian',
    right: 'm7 说明是偏小的调式，♭9 就是 ♭2：弗里吉亚。洛克里亚的主和弦还有 ♭5。',
    wrong: '♭9 相当于第几级？哪种调式的特征音是它？'
  });
  quiz('maj7s11', {panel: {key: 'q-maj7s11', html: `<p class="symbol-row big">${cs('C', 'maj7(♯11)')}</p>`}}, {
    question: '和弦 Cmaj7(♯11) 对应的调式是：',
    options: [['lydian', '利底亚'], ['ionian', '大调'], ['mixolydian', '混合利底亚']], answer: 'lydian',
    right: '♯11 就是 ♯4，是利底亚的特征音。',
    wrong: '♯11 相当于第几级？'
  });

  ChordLesson.run({
    steps, sections, quizExtras: true, tapParts: true,
    onControl: id => stacked(id.slice(5)),
    preload: ['C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'F#4', 'Gb4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5']
  });
})();
