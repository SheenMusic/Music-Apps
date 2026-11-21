/* 调式与音阶课程 · 演示区工具（2026-11-21 初稿）
   在和弦课的共享舞台（MT-Chord/shared/chord-stage.js、chord-lesson.js）上，提供音阶谱例：
   - scale(keys, opts)：一条横向排列的音阶，点击单个音发声，喇叭按顺序弹出整条音阶
   - chords(list, opts)：几个并排的柱式和弦（特征和弦进行）
   - MODES：以 C 为主音的七个调式（平行比较），按亮度从亮到暗排列
   颜色：主音用根音色；特征音（和大调或自然小调不同的那个音）用红色；其余黑色；暂不强调的音用灰色。 */
(() => {
  'use strict';
  const {COLOR} = ChordStage;
  const MARK = COLOR.bass;        // 特征音
  const FAINT = COLOR.faint;

  // 以 C 为主音的七个调式：从亮到暗（相邻两个只差一个音）
  // keys：C4–C5；labels：相对大调的音级；mark：和同主音大调（偏大）或自然小调（偏小）相比的特征音位置
  const MODES = [
    {id: 'lydian', zh: '利底亚', en: 'Lydian', keys: ['C4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C5'], labels: ['1', '2', '3', '♯4', '5', '6', '7', '1'], mark: [3], family: 'major'},
    {id: 'ionian', zh: '大调（伊奥尼亚）', en: 'Ionian', keys: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], labels: ['1', '2', '3', '4', '5', '6', '7', '1'], mark: [], family: 'major'},
    {id: 'mixolydian', zh: '混合利底亚', en: 'Mixolydian', keys: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'C5'], labels: ['1', '2', '3', '4', '5', '6', '♭7', '1'], mark: [6], family: 'major'},
    {id: 'dorian', zh: '多利亚', en: 'Dorian', keys: ['C4', 'D4', 'Eb4', 'F4', 'G4', 'A4', 'Bb4', 'C5'], labels: ['1', '2', '♭3', '4', '5', '6', '♭7', '1'], mark: [5], family: 'minor'},
    {id: 'aeolian', zh: '自然小调（爱奥利亚）', en: 'Aeolian', keys: ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5'], labels: ['1', '2', '♭3', '4', '5', '♭6', '♭7', '1'], mark: [], family: 'minor'},
    {id: 'phrygian', zh: '弗里吉亚', en: 'Phrygian', keys: ['C4', 'Db4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5'], labels: ['1', '♭2', '♭3', '4', '5', '♭6', '♭7', '1'], mark: [1], family: 'minor'},
    {id: 'locrian', zh: '洛克里亚', en: 'Locrian', keys: ['C4', 'Db4', 'Eb4', 'F4', 'Gb4', 'Ab4', 'Bb4', 'C5'], labels: ['1', '♭2', '♭3', '4', '♭5', '♭6', '♭7', '1'], mark: [1, 4], family: 'minor'}
  ];
  const mode = id => MODES.find(m => m.id === id);

  // 横向位置：n 个音平均分布（scene.wide = 1.45 时，可用位置约 0.3–4.8）
  const slotsFor = n => Array.from({length: n}, (_, i) => n === 1 ? 2.55 : 0.35 + i * (4.4 / (n - 1)));

  // 一条音阶。keys：音；labels：符头右边的标签（可省略）；mark：要标红的位置；faint：变灰的位置；
  // tonic：主音位置着色（默认第一个与最后一个，若和第一个同名）；symbol：谱例上方的文字
  function scale(keys, {labels = [], mark = [], faint = [], tonic = null, captions = [], caption = '', intervals = [], prefix = 's', extra = {}} = {}) {
    const slots = slotsFor(keys.length);
    const tonics = tonic || keys.map((k, i) => k.replace(/\d/, '') === keys[0].replace(/\d/, '') ? i : -1).filter(i => i >= 0);
    const colorAt = i => faint.includes(i) ? FAINT : mark.includes(i) ? MARK : tonics.includes(i) ? COLOR.root : COLOR.ink;
    const tones = keys.map((key, i) => ({id: prefix + i, key, slot: slots[i], label: '', color: colorAt(i)}));
    // 音级写在每个音的正下方（横向排列的音阶，写在符头右边会挤在一起）；文字说明再往下一行
    const below = labels.map((text, i) => text ? {slot: slots[i], text, color: colorAt(i) === COLOR.ink ? '#334155' : colorAt(i)} : null).filter(Boolean);
    return {wide: 1.45, tap: 'note', tones, offsets: keys.map((_, i) => i * 0.42),
      staffLabels: [...below, ...captions.map((text, i) => text ? {slot: slots[i], text, drop: labels.some(Boolean) ? 16 : 0} : null).filter(Boolean)],
      intervals: intervals.map(([a, b, text]) => [prefix + a, prefix + b, text]),
      caption, ...extra};
  }
  // 一个调式的音阶（以 C 为主音）
  const modeScale = (id, opts = {}) => {
    const m = mode(id);
    return scale(m.keys, {labels: m.labels, mark: m.mark, ...opts});
  };
  // 几个并排的柱式和弦：list = [[keys, root, suffix, bass?], …]
  function chords(list, {caption = '', labels = []} = {}) {
    const n = list.length, slots = n === 2 ? ChordStage.PAIR : slotsFor(n);
    return {wide: n > 2 ? 1.45 : undefined, tap: 'chord', caption,
      tones: list.flatMap(([keys], i) => keys.map((key, j) => ({id: `c${i}-${j}`, key, slot: slots[i], color: COLOR.ink, label: ''}))),
      staffSymbols: list.map(([, root, suffix = '', bass = ''], i) => ({slot: slots[i], root, suffix, bass, size: 15})),
      staffLabels: labels.map((text, i) => text ? {slot: slots[i], text} : null).filter(Boolean)};
  }
  // 七个调式的选择按钮（onControl 收到 'mode:<id>'）
  const modeButtons = (ids = MODES.map(m => m.id)) => ids.map(id => [`mode:${id}`, mode(id).zh.replace(/（.*）/, '')]);

  window.ScaleKit = Object.freeze({MODES, mode, scale, modeScale, chords, modeButtons, MARK, FAINT});
})();
