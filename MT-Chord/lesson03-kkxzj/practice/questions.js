/* 和弦记号 · 第三课 课后练习（初稿，2026-11-03，待老师确认）
   记号写法与判题见第二课 questions.js 的说明。
   看记号写和弦（第 1–8 题）照搬老师 PDF 练习的八个记号：完整的密集排列，不省略任何音。
   第 9–16 题（2026-11-18 新增）：最简结构（minimal）——按第五节的省略规律，能省的音全部省略；八度不限，低音要对。
   第 17–24 题：看谱写记号；第 25 题：谱例分析（2026-11-18 按老师修订的谱例与答案更新）。
   also = 另一种同样正确的分析（写哪一个都算对，答对后告诉学生另一个）；optional = 更细的分析，可写可不写（答完后用灰色显示）。 */
const chordPractice = {
  code: 'MT Chord 03',
  brand: 'MUSIC THEORY · CHORD SYMBOL',
  subtitle: '和弦记号 · 第三课',
  title: '延伸音和弦',
  reportTitle: '和弦记号 3 · 延伸音和弦 课后练习',
  backURL: '../',
  tempo: 72,
  groups: [
    {complete: true, from: 'q01', badge: '看记号写和弦', hint: '在谱表上写出和弦：完整的密集排列，不省略任何音。'},
    {from: 'q09', badge: '看记号写和弦 · 最简结构', hint: '在谱表上写出和弦的最简结构：能省略的音全部省略。音写在哪个八度都可以，但低音要对。'},
    {from: 'q17', badge: '看谱写记号 · 大谱表', hint: '在和弦上方写出和弦记号。'},
    {from: 'q25', badge: '谱例分析', hint: '用今日主题的和弦记号，标记出谱例的所有和弦。点击和弦开始的那个音上方，写出和弦记号。'}
  ],
  questions: [
    {id: 'q01', label: '1', type: 'build', symbol: 'Amaj9'},
    {id: 'q02', label: '2', type: 'build', symbol: 'Dm9'},
    {id: 'q03', label: '3', type: 'build', symbol: 'Eb9'},
    {id: 'q04', label: '4', type: 'build', symbol: 'Cø11'},
    {id: 'q05', label: '5', type: 'build', symbol: 'B11'},
    {id: 'q06', label: '6', type: 'build', symbol: 'Cmaj11(#5)'},
    {id: 'q07', label: '7', type: 'build', symbol: 'Gm(maj13)'},
    {id: 'q08', label: '8', type: 'build', symbol: 'Fm13'},

    {id: 'q09', label: '9', type: 'build', minimal: true, symbol: 'G9'},
    {id: 'q10', label: '10', type: 'build', minimal: true, symbol: 'Fø9'},
    {id: 'q11', label: '11', type: 'build', minimal: true, symbol: 'Ebm11'},
    {id: 'q12', label: '12', type: 'build', minimal: true, symbol: 'Bbmaj13/D'},
    {id: 'q13', label: '13', type: 'build', minimal: true, symbol: 'A13'},
    {id: 'q14', label: '14', type: 'build', minimal: true, symbol: 'Gm13'},
    {id: 'q15', label: '15', type: 'build', minimal: true, symbol: 'D11'},
    {id: 'q16', label: '16', type: 'build', minimal: true, symbol: 'Abmaj11(#5)'},

    {id: 'q17', label: '17', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['Eb4.A4.Eb5:w'], bass: ['C3.Bb3:w']}]}, answer: 'Cm13'},
    {id: 'q18', label: '18', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['C#4.F#4.B4:w'], bass: ['D3.A3:w']}]}, answer: 'Dmaj13', also: 'Bm9/D'},
    {id: 'q19', label: '19', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['F4.C5.Eb5:w'], bass: ['Db3.Ab3.Db4:w']}]}, answer: 'Dbmaj9'},
    {id: 'q20', label: '20', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['B3.A4:w'], bass: ['G2.F3:w']}]}, answer: 'G9'},
    {id: 'q21', label: '21', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['E4.G#4:w'], bass: ['F#3.A3:w']}]}, answer: 'F#m9'},
    {id: 'q22', label: '22', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['Gb4.C5.F5:w'], bass: ['Ab3:w']}]}, answer: 'Ab13'},
    {id: 'q23', label: '23', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['E4.G4.B4.D#5.F#5:w'], bass: ['E3:w']}]}, answer: 'Em(maj9)'},
    {id: 'q24', label: '24', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['D4.E4.F#4:w'], bass: ['B2.A3:w']}]}, answer: 'Bm11'},

    // 第 25 题（6/8，2026-11-18 老师修订）：弱起只有旋律，不写和弦。optional = 更细的分析（谱例上方第二行的记号），可写可不写
    {id: 'q25', label: '25', type: 'analysis', score: {staves: ['treble', 'bass'], time: '6/8', measures: [
      {pickup: true, treble: ['G4:8'], bass: ['r:8']},
      {treble: ['E4.B4.D5:q. E4.G4.C5:q G4:8'], bass: ['C3.G3:h.']},
      {treble: ['D5:8 E5:8 D5:8 C5:q.', 'E4.G4:q. E4.G4:q.'], bass: ['A3.C4:h.']},
      {treble: ['F4.A4.E5:q. F4.A4.D5:q A4:8'], bass: ['D3.C4:h.']},
      {treble: ['E5:8 F5:8 E5:8 D5:8 E5:8 D5.F5:8', 'F4.A4:q. F4.A4:q Ab4.C5:8'], bass: ['D3.C#4:q. G2.B3:q Bb3:8']},
      {treble: ['G5:q G5:8 G5:8 F5:8 E5:8', 'G4.B4.C#5:q. G4.D5:q G4.B4:8'], bass: ['A3:q. A2.A3:8 B2.B3:8 C#3.A3.C#4:8']},
      {treble: ['G4.C5.F5:q. C4.F4.A4:q.'], bass: ['D3.A3.D4:h.']},
      {treble: ['D4.F4.A4.B4:q. F4.A4.B4.E5:q D5:8'], bass: ['G3:q. G2:q.']},
      {treble: ['Eb4.F4.G4.C5:h.'], bass: ['Ab3:q. C4.F4:q.', 'Ab2:h.']},
      {treble: ['D4.E4.A4.C5:h.'], bass: ['C3.G3.B3:h.']}
    ]}, chords: [
      {at: [1, 0], answer: 'Cmaj9'}, {at: [1, 1.5], answer: 'C', optional: true},
      {at: [2, 0], answer: 'Am11'}, {at: [2, 1.5], answer: 'Am7', optional: true},
      {at: [3, 0], answer: 'Dm9'}, {at: [3, 1.5], answer: 'Dm7', optional: true},
      {at: [4, 0], answer: ['Dm(maj9)', 'DmM9']}, {at: [4, 1.5], answer: 'G13', also: 'G9'}, {at: [4, 2], answer: 'G13', optional: true}, {at: [4, 2.5], answer: 'Bb9'},
      {at: [5, 0], answer: 'A9'}, {at: [5, 1.5], answer: 'A11'}, {at: [5, 2], answer: 'G7/B'}, {at: [5, 2.5], answer: 'A9/C#'},
      {at: [6, 0], answer: 'Dm11'}, {at: [6, 1.5], answer: 'Dm7'},
      {at: [7, 0], answer: 'G9'}, {at: [7, 1.5], answer: 'G13'},
      {at: [8, 0], answer: 'Fm9/Ab', also: 'Abmaj13'},
      {at: [9, 0], answer: 'Cmaj13'}
    ]}
  ]
};
