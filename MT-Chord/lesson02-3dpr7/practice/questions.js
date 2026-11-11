/* 和弦记号 · 第二课 课后练习（初稿，2026-11-03，待老师确认）
   题型与第一课相同；第二课起答案直接写记号文字（与学生的键盘输入同一套写法），由 ChordInput 解析：
     name：answer = 记号文字，或几种可接受写法的数组（第一种是标准写法）。同一个和弦的不同写法都算对（如 Cø7 = Cm7(b5)）。
     build：symbol = 记号文字；和弦音与低音由记号自动推出。
     analysis：chords[].answer 同 name。
   全部题目照搬老师 PDF 练习（2026-11-04 从 PDF 的字形坐标转写）；谱例分析的答案是初稿分析，待老师确认。
   谱例记法见第一课 questions.js 的说明（bb = 重降，## = 重升）。 */
const chordPractice = {
  code: 'MT Chord 02',
  brand: 'MUSIC THEORY · CHORD SYMBOL',
  subtitle: '和弦记号 · 第二课',
  title: '七和弦',
  reportTitle: '和弦记号 2 · 七和弦 课后练习',
  backURL: '../',
  tempo: 72,
  // 练习页「输入说明」里加的七和弦写法（在通用说明之后）
  inputGuide: [
    ['maj7 / M7 / ^7', '大七和弦，^7 排成 △7'],
    ['m7 / min7 / -7', '小七和弦'],
    ['7', '大小七和弦（属七）'],
    ['o7 / dim7', '减七和弦，o7 排成 °7'],
    ['m7b5 / m7-5', '半减七和弦（电脑上打不出 ø 时用这个写法）'],
    ['m(maj7) / mM7', '小大七和弦'],
    ['7(#5) / +7 / aug7', '增七和弦'],
    ['maj7(#5)', '增大七和弦']
  ],
  groups: [
    {from: 'q01', badge: '看谱写记号', hint: '写出谱例的和弦记号。'},
    {from: 'q09', badge: '看记号写和弦', hint: '在谱表上写出和弦（四个音都要写）。注意拼写和低音。'},
    {from: 'q17', badge: '看谱写记号 · 大谱表', hint: '写出谱例的和弦记号。'},
    {from: 'q25', badge: '谱例分析', hint: '用今日主题的和弦记号，标记出谱例的所有和弦。点击和弦开始的那个音上方，写出和弦记号。'}
  ],
  questions: [
    {id: 'q01', label: '1', type: 'name', score: {staves: ['treble'], measures: [{treble: ['Eb4.Bb4.Db5.G5:w']}]}, answer: 'Eb7'},
    {id: 'q02', label: '2', type: 'name', score: {staves: ['treble'], measures: [{treble: ['G4.Bb4.D5.F5:w']}]}, answer: 'Gm7'},
    {id: 'q03', label: '3', type: 'name', score: {staves: ['treble'], measures: [{treble: ['D4.A4.C#5.F5:w']}]}, answer: ['Dm(maj7)', 'DmM7']},
    {id: 'q04', label: '4', type: 'name', score: {staves: ['treble'], measures: [{treble: ['Db4.Ab4.C5.F5:w']}]}, answer: 'Dbmaj7'},
    {id: 'q05', label: '5', type: 'name', score: {staves: ['treble'], measures: [{treble: ['D4.F#4.A#4.C#5:w']}]}, answer: 'Dmaj7(#5)'},
    {id: 'q06', label: '6', type: 'name', score: {staves: ['treble'], measures: [{treble: ['E4.A4.C#5.F#5:w']}]}, answer: 'F#m7/E'},
    {id: 'q07', label: '7', type: 'name', score: {staves: ['treble'], measures: [{treble: ['Gb4.A4.C5.Eb5:w']}]}, answer: 'Ao7/Gb'},
    {id: 'q08', label: '8', type: 'name', score: {staves: ['treble'], measures: [{treble: ['C4.G4.Bb4.E5:w']}]}, answer: 'C7'},

    {id: 'q09', label: '9', type: 'build', symbol: 'C#m7(b5)'},
    {id: 'q10', label: '10', type: 'build', symbol: 'Bo7/F'},
    {id: 'q11', label: '11', type: 'build', symbol: 'A7(#5)/E#'},
    {id: 'q12', label: '12', type: 'build', symbol: 'Dø7'},
    {id: 'q13', label: '13', type: 'build', symbol: 'A/G'},
    {id: 'q14', label: '14', type: 'build', symbol: 'Dbmaj7(#5)'},
    {id: 'q15', label: '15', type: 'build', symbol: 'Ebm(maj7)'},
    {id: 'q16', label: '16', type: 'build', symbol: 'Ab7/Eb'},

    {id: 'q17', label: '17', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['C4.F4.A4:w'], bass: ['Eb3:w']}]}, answer: 'F7/Eb'},
    {id: 'q18', label: '18', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['G#4.D#5:w'], bass: ['E3.B3:w']}]}, answer: 'Emaj7'},
    {id: 'q19', label: '19', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['C#4.A4:w'], bass: ['E2.F#3:w']}]}, answer: 'F#m7/E'},
    {id: 'q20', label: '20', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['C4.E4.Ab4:w'], bass: ['F3:w']}]}, answer: ['Fm(maj7)', 'FmM7']},
    {id: 'q21', label: '21', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['E4:w'], bass: ['C3.G#3.Bb3:w']}]}, answer: ['C7(#5)', 'C+7', 'Caug7']},
    {id: 'q22', label: '22', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['G#4.E#5:w'], bass: ['A2.C#4:w']}]}, answer: 'Amaj7(#5)'},
    {id: 'q23', label: '23', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['Db4.Fb4:w'], bass: ['Bb2.Ab3:w']}]}, answer: ['Bbø7', 'Bbm7(b5)']},
    {id: 'q24', label: '24', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['C4.F#4.A4:w'], bass: ['D#3:w']}]}, answer: 'D#o7'},

    // 第 25 题（A♭ 大调，4/4）：每两拍一个和弦，没有和弦外音。第 2 小节第 1 拍的 E♮ 是 F♭ 的等音（老师设计的考点）：D♭m(maj7)。
    // 第 4 小节整小节一个和弦（低音只换八度），第 3 拍写记号算错。
    {id: 'q25', label: '25', type: 'analysis', score: {staves: ['treble', 'bass'], key: 'Ab', time: '4/4', measures: [
      {treble: ['r:q C4.Eb4.Ab4:q r:q C4.F4.Ab4:q'], bass: ['F3:h Eb3:h']},
      {treble: ['r:8 C4:8 E4:8 Ab4:8 Ab4:q G4:q', 'r:h Bb3.Eb4:h'], bass: ['Db3:h C3:h']},
      {treble: ['r:q Ab3.Db4.F4.Ab4:q r:q Bb3.Db4.F4:q'], bass: ['Bb2:h Ab2:h']},
      {treble: ['r:q Db4.F4.Bb4:q F4.Bb4.Db5:q Db4.F4.Bb4:q'], bass: ['G2:h G3:h']},
      {treble: ['E4.G4.C5:w'], bass: ['C3.Bb3:w']}
    ]}, chords: [
      {at: [0, 0], answer: 'Fm7'}, {at: [0, 2], answer: 'Fm7/Eb'},
      {at: [1, 0], answer: ['Dbm(maj7)', 'DbmM7'], note: '旋律里的还原 E 是 F♭ 的等音写法：D♭–F♭–A♭–C，小大七和弦。'}, {at: [1, 2], answer: 'Cm7'},
      {at: [2, 0], answer: 'Bbm7'}, {at: [2, 2], answer: 'Bbm7/Ab'},
      {at: [3, 0], answer: ['Gø7', 'Gm7(b5)']},
      {at: [4, 0], answer: 'C7'}
    ]}
  ]
};
