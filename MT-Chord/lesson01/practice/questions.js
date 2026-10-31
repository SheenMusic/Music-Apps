/* 和弦记号 · 第一课 课后练习（题目与答案：老师 2026-10-27 确认）
   type
     name：看谱写和弦记号。answer = {root, quality, bass}；bass 为空表示原位（不写斜线）。
     build：看记号写和弦。symbol = [根音, 后缀, 低音]（显示用）；notes = 和弦音拼写；bass = 低音。
   quality：major / minor / aug / dim。音名用 A–G 加 # / b（输入）；显示时换成 ♯ / ♭。
   score：谱例。staves = 谱表；measures 每小节写各谱表的声部（第一个声部在上方）。
     记法：音名八度:时值，和弦用「.」连接（E4.G4.C5:q）；r = 休止；时值 w h q 8，加「.」为附点；
     「~」连到下一个音；「+」在音上方标「+」；n = 还原号（强制显示）。
   segment：第 27 题每个和弦所在的位置 [小节, 开始拍, 结束拍]。 */
const chordPractice = {
  code: 'MT Chord 01',
  title: '和弦记号 1 · 三和弦',
  reportTitle: '和弦记号 1 · 三和弦 课后练习',
  backURL: '../',
  tempo: 72,
  groups: [
    {from: 'q01', title: '柱式和弦（单谱表）', hint: '在和弦上方写出记号。'},
    {from: 'q09', title: '柱式和弦（单谱表）', hint: '在记号下方写出和弦。八度与排列不限，注意拼写和低音。'},
    {from: 'q17', title: '柱式和弦（大谱表）', hint: '写出和弦记号。'},
    {from: 'q23', title: '分解和弦', hint: '一小节一个和弦，写出和弦记号。'},
    {from: 'q27-1', title: '谱例分析', hint: '按低声部划分，写出高亮部分的和弦记号。'}
  ],
  questions: [
    {id: 'q01', label: '1', type: 'name', score: {staves: ['treble'], measures: [{treble: ['Ab4.C5.Eb5:w']}]}, answer: {root: 'Ab', quality: 'major', bass: ''}, tones: 'A♭–C–E♭'},
    {id: 'q02', label: '2', type: 'name', score: {staves: ['treble'], measures: [{treble: ['C#4.G#4.E5:w']}]}, answer: {root: 'C#', quality: 'minor', bass: ''}, tones: 'C♯–E–G♯'},
    {id: 'q03', label: '3', type: 'name', score: {staves: ['treble'], measures: [{treble: ['G#4.B4.D5:w']}]}, answer: {root: 'G#', quality: 'dim', bass: ''}, tones: 'G♯–B–D'},
    {id: 'q04', label: '4', type: 'name', score: {staves: ['treble'], measures: [{treble: ['F4.Ab4.Db5:w']}]}, answer: {root: 'Db', quality: 'major', bass: 'F'}, tones: 'D♭–F–A♭'},
    {id: 'q05', label: '5', type: 'name', score: {staves: ['treble'], measures: [{treble: ['F#4.D#5.B5:w']}]}, answer: {root: 'B', quality: 'major', bass: 'F#'}, tones: 'B–D♯–F♯'},
    {id: 'q06', label: '6', type: 'name', score: {staves: ['treble'], measures: [{treble: ['A4.Db5.F5:w']}]}, answer: {root: 'Db', quality: 'aug', bass: 'A'}, tones: 'D♭–F–A'},
    {id: 'q07', label: '7', type: 'name', score: {staves: ['treble'], measures: [{treble: ['Gb4.Bb4.Eb5:w']}]}, answer: {root: 'Eb', quality: 'minor', bass: 'Gb'}, tones: 'E♭–G♭–B♭'},
    {id: 'q08', label: '8', type: 'name', score: {staves: ['treble'], measures: [{treble: ['E4.A#4.C#5:w']}]}, answer: {root: 'A#', quality: 'dim', bass: 'E'}, tones: 'A♯–C♯–E'},

    {id: 'q09', label: '9', type: 'build', symbol: ['D', '+', ''], notes: ['D', 'F#', 'A#'], bass: 'D'},
    {id: 'q10', label: '10', type: 'build', symbol: ['G', '+', 'B'], notes: ['G', 'B', 'D#'], bass: 'B'},
    {id: 'q11', label: '11', type: 'build', symbol: ['C', '°', 'E♭'], notes: ['C', 'Eb', 'Gb'], bass: 'Eb'},
    {id: 'q12', label: '12', type: 'build', symbol: ['E♭', '', 'G'], notes: ['Eb', 'G', 'Bb'], bass: 'G'},
    {id: 'q13', label: '13', type: 'build', symbol: ['D♯', '−', 'F♯'], notes: ['D#', 'F#', 'A#'], bass: 'F#'},
    {id: 'q14', label: '14', type: 'build', symbol: ['B', '', 'D♯'], notes: ['B', 'D#', 'F#'], bass: 'D#'},
    {id: 'q15', label: '15', type: 'build', symbol: ['F', '°', 'A♭'], notes: ['F', 'Ab', 'Cb'], bass: 'Ab'},
    {id: 'q16', label: '16', type: 'build', symbol: ['B♭', '+', 'D'], notes: ['Bb', 'D', 'F#'], bass: 'D'},

    {id: 'q17', label: '17', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['G4.C5.G5:w'], bass: ['Eb3:w']}]}, answer: {root: 'C', quality: 'minor', bass: 'Eb'}, tones: 'C–E♭–G'},
    {id: 'q18', label: '18', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['D4.A4.D5:w'], bass: ['A2.F#3:w']}]}, answer: {root: 'D', quality: 'major', bass: 'A'}, tones: 'D–F♯–A'},
    {id: 'q19', label: '19', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['A4.A5:w'], bass: ['C3.A3:w']}]}, answer: {root: 'A', quality: 'minor', bass: 'C'}, tones: 'A–C–(E)', note: '五音 E 被省略了，仍然是 A 小三和弦。'},
    {id: 'q20', label: '20', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['E4.G4.E5:w'], bass: ['C#3.G3:w']}]}, answer: {root: 'C#', quality: 'dim', bass: ''}, tones: 'C♯–E–G'},
    {id: 'q21', label: '21', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['D4.Bb4:w'], bass: ['Bb2.Bb3:w']}]}, answer: {root: 'Bb', quality: 'major', bass: ''}, tones: 'B♭–D–(F)', note: '五音 F 被省略了，仍然是 B♭ 大三和弦。'},
    {id: 'q22', label: '22', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['E4.G#4.C5:w'], bass: ['C3:w']}]}, answer: {root: 'C', quality: 'aug', bass: ''}, tones: 'C–E–G♯'},

    {id: 'q23', label: '23', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['r:q. D5:8 F5:h'], bass: ['r:8 D3:8 F3:h.', 'Ab2:w']}]}, answer: {root: 'D', quality: 'dim', bass: 'Ab'}, tones: 'D–F–A♭'},
    {id: 'q24', label: '24', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['r:q E4.G4.C5:q E4.G4.C5:q E4.G4.C5:q'], bass: ['r:8 G3:q G3:8~ G3:8 G3:q G3:8', 'G2:h G2:h']}]}, answer: {root: 'C', quality: 'major', bass: 'G'}, tones: 'C–E–G'},
    {id: 'q25', label: '25', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['r:q D4.G4.Bb4:q D4.G4.D5:q D4.G4.Bb4:q'], bass: ['G3:w']}]}, answer: {root: 'G', quality: 'minor', bass: ''}, tones: 'G–B♭–D', note: '小节里第一个 B♭ 的降号，对同一小节后面的 B 继续有效。'},
    {id: 'q26', label: '26', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['r:8 E4:8 Ab4:8 Bb4:8+ C5:h'], bass: ['Ab3:w']}]}, answer: {root: 'Ab', quality: 'aug', bass: ''}, tones: 'A♭–C–E', note: '标「+」的 B♭ 不属于和弦，是和弦外音。'},
  ]
};

/* 第 27 题：同一段谱例，七个和弦 */
(() => {
  const score = {staves: ['treble', 'bass'], time: '4/4', measures: [
    {pickup: true, treble: ['E4:8'], bass: ['r:8']},
    {treble: ['C5:q. E4:8 C5:q. E4:8'], bass: ['r:8 E3:8 C4:q r:8 E3:8 C4:q', 'A2:h G#2:h']},
    {treble: ['C5:8 E5:8 C5:8 G4:8 A4:q. C5:8'], bass: ['r:8 E3:8 C4:8 E3:8 r:8 C3:8 A3:8 C3:8', 'Gn2:h F#2:h']},
    {treble: ['A4:q. F4:8 C5:q Ab4:q'], bass: ['r:8 C3:8 A3:8 C3:8 r:8 C3:8 Ab3:8 C3:8', 'Fn2:h F2:h']},
    {treble: ['G4:h~ G4:q. r:8'], bass: ['r:8 G3:8 C4:8 E4:8 G4:q. r:8', 'C3:w']}
  ]};
  const chords = [
    [[1, 0, 2], {root: 'A', quality: 'minor', bass: ''}, 'A–C–E'],
    [[1, 2, 4], {root: 'C', quality: 'aug', bass: 'G#'}, 'C–E–G♯', 'G♯–C–E 按三度叠置是 C–E–G♯：C 增三和弦，低音 G♯。'],
    [[2, 0, 2], {root: 'C', quality: 'major', bass: 'G'}, 'C–E–G'],
    [[2, 2, 4], {root: 'F#', quality: 'dim', bass: ''}, 'F♯–A–C'],
    [[3, 0, 2], {root: 'F', quality: 'major', bass: ''}, 'F–A–C'],
    [[3, 2, 4], {root: 'F', quality: 'minor', bass: ''}, 'F–A♭–C'],
    [[4, 0, 4], {root: 'C', quality: 'major', bass: ''}, 'C–E–G']
  ];
  chords.forEach(([segment, answer, tones, note], i) => chordPractice.questions.push(
    {id: `q27-${i + 1}`, label: `27-${i + 1}`, type: 'name', score, segment, answer, tones, note}));
})();
