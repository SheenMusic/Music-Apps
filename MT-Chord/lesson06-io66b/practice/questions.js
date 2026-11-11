/* 和弦记号 · 第六课 课后练习：综合分析（2026-11-04，照搬老师 PDF「06和弦标记_综合分析」）
   作品：《Do You Want to Build a Snowman》（电影《冰雪奇缘》）钢琴伴奏。只转写钢琴的两行（不含人声与歌词）；分成两题：第 1–12 小节、第 13–25 小节。
   原谱多处标 8va（高八度演奏），这里按记谱音高写，8va 记号尚未显示；左手多处用高音谱号，按原谱换谱号（measure.clefs）。
   和弦的延续（同一个和弦在下一小节重复或延长）不重复写记号。答案是初稿分析，待老师确认。
   记号写法与判题见第二课 questions.js 的说明。 */
const chordPractice = {
  code: 'MT Chord 06',
  brand: 'MUSIC THEORY · CHORD SYMBOL',
  subtitle: '和弦记号 · 第六课',
  title: '综合分析',
  reportTitle: '和弦记号 6 · 综合分析 课后练习',
  backURL: '../',
  tempo: 80,
  groups: [
    {from: 'q01', badge: '综合分析', hint: '《Do You Want to Build a Snowman》。点击和弦开始的那个音上方，写出和弦记号；同一个和弦延续时不重复写。'}
  ],
  questions: [
    {id: 'q01', label: '1', type: 'analysis', score: {staves: ['treble', 'bass'], key: 'Eb', time: '4/4', firstBar: 1, measures: [
      {clefs: {bass: 'treble'}, treble: ['F4:8 Bb4:8 Eb5:8 G4:8 Bb4:8 Eb5:8 Ab4:8 Bb4:8'], bass: ['Bb4:q. Eb4:q. Eb5:q']},
      {treble: ['F4:8 Bb4:8 Eb5:8 G4:8 Bb4:8 Eb5:8 Ab4:8 Bb4:8'], bass: ['Bb4:q. Eb4:q. Eb5:q']},
      {treble: ['F4:8 Bb4:8 Eb5:8 G4:8 Bb4:8 Eb5:8 Ab4:8 Bb4:8'], bass: ['Bb4:q. Eb4:q. Eb5:q']},
      {treble: ['Bb4.Eb5.G5:w'], bass: ['Bb4.Ab5:w']},
      {clefs: {bass: 'bass'}, treble: ['F4:8 Bb4:8 Eb5:8 G4:8 r:q Bb4.Bb5:q', 'r:h G4:h'], bass: ['r:q. Bb3:8 Bb3:h', 'Eb3:w']},
      {treble: ['G4.Bb4.Bb5:w'], bass: ['Eb3.Bb3:w']},
      {treble: ['F4:8 Bb4:8 F5:8 C5:8 r:q D5.D6:q', 'r:h C5:h'], bass: ['r:q. Bb3:8 Bb3:h', 'D3:w']},
      {treble: ['C5.D5.D6:w'], bass: ['D3.Bb3:w']},
      {clefs: {bass: 'treble'}, treble: ['Ab5:8 Eb5:8 Ab4:h.'], bass: ['r:q. Ab4:8 Ab4:h', 'C4:w']},
      {treble: ['G4.G5:8 Eb5:8 G4:h.'], bass: ['C4.C5:w']},
      {treble: ['C5:8 Db5:8 r:8 C5:8 C5:8 D5:q Eb5:8', 'F4:q. F4:8 F4:q. Eb4.Bb4:8'], bass: ['Bb3:h Bb3:8 Ab3:q G3.Bb3:8']},
      {treble: ['Eb4.Bb4.Eb5:w'], bass: ['G3.Bb3:w']}
    ]}, chords: [
      {at: [0, 0], answer: ['Eb', 'Eb(add9)', 'Ebadd9']},
      {at: [3, 0], answer: ['Bb13sus4', 'Bb13(sus4)', 'Eb(add4)/Bb']},
      {at: [4, 0], answer: ['Eb', 'Eb(add9)', 'Ebadd9']},
      {at: [6, 0], answer: ['Bbadd9/D', 'Bb(add9)/D']},
      {at: [8, 0], answer: 'Ab/C'},
      {at: [9, 0], answer: 'Cm'},
      {at: [10, 0], answer: ['Fm7/Bb', 'Bb9sus4', 'Bb9(sus4)']},
      {at: [10, 2.5], answer: 'Bb7/Ab'},
      {at: [10, 3.5], answer: 'Eb/G', note: '和弦提前在第 11 小节最后半拍进入（连到第 12 小节）。'}
    ]},

    {id: 'q02', label: '2', type: 'analysis', score: {staves: ['treble', 'bass'], key: 'Eb', time: '4/4', firstBar: 13, measures: [
      {clefs: {bass: 'treble'}, treble: ['Bb4:8 Eb5:8 Bb5:8 C5:8 C5:h'], bass: ['r:q. Eb5:8 Eb5:h', 'Ab4:w']},
      {treble: ['F4.Bb4.D5:q. F4.Bb4.Eb5:8 F4.Bb4.Eb5:h'], bass: ['G4.Eb5:q. G4.D5:8 G4.D5:h']},
      {treble: ['Ab4.C5.G5:h Ab4.Bn4.F5:h'], bass: ['D4.F5:h G4.D5:h']},
      {treble: ['Eb5.C6:q. D5.Bb5:8 D5.Bb5:q G4.Eb5:q'], bass: ['r:8 G4:8 C5:h.', 'C4:w']},
      {treble: ['C5.An5:w'], bass: ['F3:w']},
      {treble: ['F4:8 Bb4:8 Eb5:8 G4:8 G4:q C4.Ab4:q'], bass: ['r:q. Ab4:8 Ab4:h', 'F3:w']},
      {treble: ['C4.Ab4.Bb4.Bb5:w'], bass: ['F3.Ab4:w']},
      {treble: ['F4:8 Bb4:8 Eb5:8 G4:8 G4:q Ab4:q'], bass: ['r:q. Bb4:8 Bb4:q Cb5:q', 'Cb4.Ab4:w']},
      {clefs: {bass: 'bass'}, treble: ['Ab4.Ab5:h. Eb4.Ab4.Cb5:q'], bass: ['Cb5:h. Bb2.Bb3:q', 'Cb4.Ab4:h.']},
      {treble: ['G4:8 Bb4:8 Eb5:8 Ab4:8 Bb4:8 Eb5:8 F4:8 Bb4:8'], bass: ['Eb3.Bb3:w']},
      {treble: ['G4:8 Bb4:8 Eb5:8 Ab4:8 Bb4:8 Eb5:8 F4:8 Bb4:8'], bass: ['Eb3.Bb3:w']},
      {treble: ['Bb3.Eb4.G4:w'], bass: ['Eb2.Bb2.Eb3:w']},
      {treble: ['Bb3.Eb4.G4:w'], bass: ['Eb2.Bb2.Eb3:w']}
    ]}, chords: [
      {at: [0, 0], answer: ['Abadd9', 'Ab(add9)']},
      {at: [1, 0], answer: 'Ebmaj9/G'},
      {at: [2, 0], answer: ['Dm11(b5)', 'Dø11']}, {at: [2, 2], answer: 'G7(b9)'},
      {at: [3, 0], answer: 'Cm9'},
      {at: [4, 0], answer: 'F'},
      {at: [5, 0], answer: ['Fm11', 'Fm9']},
      {at: [7, 0], answer: 'Abm/Cb'},
      {at: [8, 3], answer: ['Bb7(b9,sus4)', 'Bb7sus4(b9)']},
      {at: [9, 0], answer: ['Eb', 'Eb(add9)', 'Ebadd9']},
      {at: [11, 0], answer: 'Eb'}
    ]}
  ]
};
