/* 和弦记号 · 第五课 课后练习（初稿，2026-11-03，待老师确认）
   记号写法与判题见第二课 questions.js 的说明。原位优先；属和弦的省略音可以用斜线简化（如 F/G）。
   看记号写和弦（第 1–8 题）照搬老师 PDF 练习的八个记号。
   全部题目照搬老师 PDF 练习（2026-11-04 转写，含作品分析《一世情缘》前奏）；两道分析题的答案是初稿分析，待老师确认。 */
const chordPractice = {
  code: 'MT Chord 05',
  brand: 'MUSIC THEORY · CHORD SYMBOL',
  subtitle: '和弦记号 · 第五课',
  title: '非三度关系的和弦',
  reportTitle: '和弦记号 5 · 非三度关系的和弦 课后练习',
  backURL: '../',
  tempo: 72,
  groups: [
    {from: 'q01', badge: '看记号写和弦', hint: '在谱表上写出和弦（原位，密集排列）。'},
    {from: 'q09', badge: '看谱写记号', hint: '在和弦上方写出和弦记号（原位优先，属七斜线简化）。'},
    {from: 'q17', badge: '看谱写记号 · 大谱表', hint: '在和弦上方写出和弦记号（原位优先，属七斜线简化）。'},
    {from: 'q25', badge: '作品分析', hint: '《一世情缘》前奏。点击和弦开始的那个音上方，写出和弦记号。'},
    {from: 'q26', badge: '谱例分析', hint: '标记出谱例的所有和弦。点击和弦开始的那个音上方，写出和弦记号。'}
  ],
  questions: [
    {id: 'q01', label: '1', type: 'build', symbol: 'C7(sus4)'},
    {id: 'q02', label: '2', type: 'build', symbol: 'F(add2)'},
    {id: 'q03', label: '3', type: 'build', symbol: 'Eb6/9'},
    {id: 'q04', label: '4', type: 'build', symbol: 'Dmaj9(sus4)'},
    {id: 'q05', label: '5', type: 'build', symbol: 'E7(b9sus4)'},
    {id: 'q06', label: '6', type: 'build', symbol: 'F(sus2)'},
    {id: 'q07', label: '7', type: 'build', symbol: 'F(sus2#11)'},
    {id: 'q08', label: '8', type: 'build', symbol: 'Ab5'},

    {id: 'q09', label: '9', type: 'name', score: {staves: ['treble'], measures: [{treble: ['Eb4.F4.Bb4.F5:w']}]}, answer: 'Ebsus2'},
    {id: 'q10', label: '10', type: 'name', score: {staves: ['treble'], measures: [{treble: ['E4.B4.C#5.G5:w']}]}, answer: 'Em6'},
    {id: 'q11', label: '11', type: 'name', score: {staves: ['treble'], measures: [{treble: ['B3.F#4.B4.E5:w']}]}, answer: ['Bsus4', 'Bsus']},
    {id: 'q12', label: '12', type: 'name', score: {staves: ['treble'], measures: [{treble: ['Eb4.Ab4.Db5:w']}]}, answer: ['Eb7sus4', 'Eb7sus']},
    {id: 'q13', label: '13', type: 'name', score: {staves: ['treble'], measures: [{treble: ['E4.B4.C#5:w']}]}, answer: ['E6(omit3)', 'E6(no3)']},
    {id: 'q14', label: '14', type: 'name', score: {staves: ['treble'], measures: [{treble: ['D4.F#4.B4:w']}]}, answer: 'D6', note: '省略的五音不用写出来。'},
    {id: 'q15', label: '15', type: 'name', score: {staves: ['treble'], measures: [{treble: ['C4.F4.Bb4.D5:w']}]}, answer: ['Bb/C', 'C9sus4(omit5)', 'C9(sus4,omit5)'], note: '属和弦的省略音写法，常简写成 B♭/C。'},
    {id: 'q16', label: '16', type: 'name', score: {staves: ['treble'], measures: [{treble: ['C4.G4.Bb4.D5.F5:w']}]}, answer: ['C9sus4', 'C9(sus4)', 'C9sus', 'Gm7/C'], note: '也常简写成 Gm7/C。'},

    {id: 'q17', label: '17', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['E4.A4.D5:w'], bass: ['A2.A3:w']}]}, answer: ['Asus4', 'Asus']},
    {id: 'q18', label: '18', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['F4.Ab4.D5:w'], bass: ['F3.C4:w']}]}, answer: 'Fm6'},
    {id: 'q19', label: '19', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['D4.E4.A4:w'], bass: ['C3.C4:w']}]}, answer: 'C6/9'},
    {id: 'q20', label: '20', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['G#4.C#5.E#5:w'], bass: ['B2.D#4:w']}]}, answer: 'B6/9(#11)'},
    {id: 'q21', label: '21', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['A4.C5.Eb5.G5:w'], bass: ['D3.C4:w']}]}, answer: ['D7(b9,sus4)', 'D7sus4(b9)']},
    {id: 'q22', label: '22', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['C4.F4.C5:w'], bass: ['F2.F3:w']}]}, answer: 'F5'},
    {id: 'q23', label: '23', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['Eb4.Ab4.Eb5:w'], bass: ['Ab2.Eb3.Bb3:w']}]}, answer: 'Absus2'},
    {id: 'q24', label: '24', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['C4.Eb4.G4:w'], bass: ['Bb2.F3:w']}]}, answer: ['Bb6/9(sus4)', 'Bb6/9sus4', 'Cm11/Bb']},

    // 第 25 题：作品分析《一世情缘》前奏（4/4，弱起）。弱起的 E 原谱连到第 1 小节，这里暂不画连音线
    {id: 'q25', label: '25', type: 'analysis', score: {staves: ['treble', 'bass'], time: '4/4', measures: [
      {pickup: true, treble: ['D4:8 E4:8'], bass: ['r:q']},
      {treble: ['C4.E4.A4:q G3.D4:8 E4:8 F#3.A3:q D4:8 E4:8'], bass: ['F2.C3.F3:q E2.B2.E3:q D2.A2.D3:q r:q']},
      {treble: ['A3.D4.A4:q E4:q D4:q r:16 F4:16 G4:16 D5:16'], bass: ['D3.Bb3:q C3.A3:q Bb2.G3:q r:q']},
      {treble: ['A3.D4.A4:q G3.C4.G4:q C4.F4:q Bb3.Eb4:q'], bass: ['Bb2.F3.Bb3:q Eb2.Bb2.Eb3:q Ab2.Eb3.Ab3:q Gb2.Db3.Gb3:q']},
      {treble: ['B3.E4.B4:h r:h'], bass: ['G2.D3.G3:w']}
    ]}, chords: [
      {at: [1, 0], answer: 'Fmaj7'}, {at: [1, 1], answer: 'Em7'}, {at: [1, 2], answer: 'D'},
      {at: [2, 0], answer: 'Bbmaj7/D'}, {at: [2, 1], answer: 'Am/C'}, {at: [2, 2], answer: 'Gm/Bb'},
      {at: [3, 0], answer: 'Bbmaj7'}, {at: [3, 1], answer: ['Eb6', 'Cm7/Eb']}, {at: [3, 2], answer: ['Ab6', 'Fm7/Ab']}, {at: [3, 3], answer: ['Gb6', 'Ebm7/Gb']},
      {at: [4, 0], answer: 'G6'}
    ]},

    // 第 26 题：谱例分析（F 大调，4/4）。第 3、5 小节后半的旋律跨到低音谱表；
    // 最后一小节原谱高音谱表标 8va、低音谱表换成高音谱号，这里暂按实际音高写在原谱号里（8va 与换谱号尚未支持）
    {id: 'q26', label: '26', type: 'analysis', score: {staves: ['treble', 'bass'], key: 'F', time: '4/4', measures: [
      {treble: ['r:q A3.D4.G4:h.'], bass: ['F2:w']},
      {treble: ['r:q Db4.F4.C5:h.'], bass: ['Bb2:w']},
      {treble: ['r:8 C5:8 G4:8 F4:8 r:8 C4:8 G4:8 F4:8'], bass: ['r:h G3:8 r:8 r:q', 'F2:w']},
      {treble: ['C4.D4.A4:w'], bass: ['Bb2.F3:w']},
      {treble: ['r:8 C5:8 Ab4:8 F4:8 r:8 Db4:8 F4:8 Ab4:8'], bass: ['r:h C4:8 r:8 r:q', 'Db3:w']},
      {treble: ['Bb3.Db4.G4:h. F4:q'], bass: ['C3:w']},
      {treble: ['G3.C4.F4:w'], bass: ['F2.C3.F3:w']},
      {treble: ['G5.D6.G6:w'], bass: ['F4.C5.E5:w']}
    ]}, chords: [
      {at: [0, 0], answer: 'F6/9'}, {at: [1, 0], answer: ['Bbm(add9)', 'Bbmadd9']}, {at: [2, 0], answer: 'Fsus2'},
      {at: [3, 0], answer: 'Bbmaj9'}, {at: [4, 0], answer: 'Dbmaj7'}, {at: [5, 0], answer: ['C7(b9,sus4)', 'C7sus4(b9)']},
      {at: [6, 0], answer: 'Fsus2'}, {at: [7, 0], answer: ['Fmaj13(omit3)', 'Cadd9/F', 'C(add9)/F']}
    ]}
  ]
};
