/* 和弦记号 · 第四课 课后练习（初稿，2026-11-03，待老师确认）
   记号写法与判题见第二课 questions.js 的说明。变化音按拼写判断：同一个琴键，拼成五音的字母记 ♯5 / ♭5，拼成 13、11 的字母记 ♭13 / ♯11。
   看记号写和弦（第 1–8 题）照搬老师 PDF 练习的八个记号：完整的密集排列，不省略任何音。
   全部题目照搬老师 PDF 练习（2026-11-04 转写，含第 17 题四部和声分析）；两道分析题的答案是初稿分析，待老师确认。 */
const chordPractice = {
  code: 'MT Chord 04',
  brand: 'MUSIC THEORY · CHORD SYMBOL',
  subtitle: '和弦记号 · 第四课',
  title: '和弦变音',
  reportTitle: '和弦记号 4 · 和弦变音 课后练习',
  backURL: '../',
  tempo: 72,
  groups: [
    {from: 'q01', badge: '看记号写和弦', hint: '在谱表上写出和弦：完整的密集排列，不省略任何音。'},
    {from: 'q09', badge: '看谱写记号 · 大谱表', hint: '写出谱例的和弦记号。变化音按拼写判断。'},
    {from: 'q17', badge: '四部和声分析', hint: '每小节一个和弦。点击和弦开始的那个音上方，写出和弦记号。'},
    {from: 'q18', badge: '谱例分析', hint: '标记出谱例的所有和弦。点击和弦开始的那个音上方，写出和弦记号。'}
  ],
  questions: [
    {id: 'q01', label: '1', type: 'build', symbol: 'Fmaj9(#11)'},
    {id: 'q02', label: '2', type: 'build', symbol: 'Dbmaj9(#5)'},
    {id: 'q03', label: '3', type: 'build', symbol: 'Eb7(b9)'},
    {id: 'q04', label: '4', type: 'build', symbol: 'Dmaj7(#9)'},
    {id: 'q05', label: '5', type: 'build', symbol: 'Em11(b9)'},
    {id: 'q06', label: '6', type: 'build', symbol: 'G11(b9,#9)'},
    {id: 'q07', label: '7', type: 'build', symbol: 'Am13(b5)'},
    {id: 'q08', label: '8', type: 'build', symbol: 'B11(b9,b13)'},

    {id: 'q09', label: '9', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['C4.D#4.G#4:w'], bass: ['B2.A3:w']}]}, answer: 'B13(b9)'},
    {id: 'q10', label: '10', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['C#4.D4.Gn4:w'], bass: ['E2.E3:w']}]}, answer: 'E13(#9)', note: '♯9 实际是 F𝄪，谱面按习惯写成同音的 G。'},
    {id: 'q11', label: '11', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['C#4.E4.Bb4:w'], bass: ['A2.G3:w']}]}, answer: 'A7(b9)'},
    {id: 'q12', label: '12', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['F4.A4.Eb5:w'], bass: ['Db3.C4:w']}]}, answer: 'Dbmaj9(#5)'},
    {id: 'q13', label: '13', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['F4.Ab4.B4.Eb5:w'], bass: ['G3.D4:w']}]}, answer: 'G7(b9,b13)'},
    {id: 'q14', label: '14', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['D4.E4.Ab4.B4:w'], bass: ['C3.G3:w']}]}, answer: 'Cmaj9(b13)'},
    {id: 'q15', label: '15', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['E4.A4:w'], bass: ['F3.B3:w']}]}, answer: 'Fmaj7(#11)'},
    {id: 'q16', label: '16', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['Db4.E4.C5:w'], bass: ['Bb2.Ab3:w']}]}, answer: 'Bbm9(#11)', note: 'E 拼在十一音的字母上（不是五音 F），所以记 ♯11。'},

    // 第 17 题：四部和声分析（F 大调，每小节一个和弦）
    {id: 'q17', label: '17', type: 'analysis', score: {staves: ['treble', 'bass'], key: 'F', time: '4/4', measures: [
      {treble: ['F4.C5.E5:w'], bass: ['D3:w']},
      {treble: ['F4.A4.D5:w'], bass: ['C3:w']},
      {treble: ['F4.A4.D5:w'], bass: ['B2:w']},
      {treble: ['C#4.G4.C5:w'], bass: ['A2:w']},
      {treble: ['C#4.E4.A4:w'], bass: ['F2:w']},
      {treble: ['D4.G4:w'], bass: ['E3.G#3:w']},
      {treble: ['C#4.F4:w'], bass: ['A2.G3:w']},
      {treble: ['C#4.G4:w'], bass: ['D3.F3:w']}
    ]}, chords: [
      {at: [0, 0], answer: 'Dm9'}, {at: [1, 0], answer: 'Dm7/C'}, {at: [2, 0], answer: ['Bø7', 'Bm7(b5)']},
      {at: [3, 0], answer: 'A7(#9)'}, {at: [4, 0], answer: 'Fmaj7(#5)'}, {at: [5, 0], answer: 'E7(#9)'},
      {at: [6, 0], answer: 'A7(b13)'}, {at: [7, 0], answer: ['Dm(maj11)', 'DmM11']}
    ]},

    // 第 18 题：谱例分析（4/4，弱起）；第 2、4 小节最后一拍的旋律音按和弦外音处理（写不写都算对的情况待老师确认）
    {id: 'q18', label: '18', type: 'analysis', score: {staves: ['treble', 'bass'], time: '4/4', measures: [
      {pickup: true, treble: ['E4:q'], bass: ['r:q']},
      {treble: ['D4.G#4.C5:h. B4:q'], bass: ['r:q B2:q G#3:h', 'E2:w']},
      {treble: ['E4.G4.C5:h. B4:q'], bass: ['r:q C3:q A3:h', 'F2:w']},
      {treble: ['E4.A4.C5:h E5:h'], bass: ['F#3.C4:w']},
      {treble: ['E4.F4.A4:h B3.D4.Gn4:q C5:q'], bass: ['D3.C4:h E3.G#3:h']},
      {treble: ['Bb3.C#4.F4:h D4.G4:h'], bass: ['A2.G3:h B2.A3:h']},
      {treble: ['C4.E4.F4.A4:h D4.E4.G#4.C5:h'], bass: ['C3.A3:h Bb2.Bb3:h']},
      {treble: ['Gb4.A4.C5.D5:w'], bass: ['Ab2.Ab3:w']},
      {treble: ['F4.Ab4.B4.E5:w'], bass: ['G2.G3:w']}
    ]}, chords: [
      {at: [1, 0], answer: 'E7(b13)'}, {at: [2, 0], answer: ['Fmaj9', 'Fmaj9(#11)']}, {at: [3, 0], answer: ['F#ø7', 'F#m7(b5)']},
      {at: [4, 0], answer: 'Dm9'}, {at: [4, 2], answer: ['E7(#9)', 'E7(#9,b13)']},
      {at: [5, 0], answer: 'A7(b9,b13)'}, {at: [5, 2], answer: ['Bm7(b13)', 'Gadd9/B', 'G(add9)/B']},
      {at: [6, 0], answer: 'Fmaj7/C'}, {at: [6, 2], answer: 'Bb9(#11)'},
      {at: [7, 0], answer: 'Ab7(b9,#11)'}, {at: [8, 0], answer: 'G13(b9)'}
    ]}
  ]
};
