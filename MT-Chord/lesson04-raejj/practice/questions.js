/* 和弦记号 · 第四课 课后练习（初稿，2026-11-03，待老师确认）
   记号写法与判题见第二课 questions.js 的说明。变化的五音与 ♯11 / ♭13 是等音：有纯五度时只能是 ♯11 / ♭13；没有纯五度时拼写优先——拼成五音的字母记 ♯5 / ♭5，拼成 11、13 的字母记 ♯11 / ♭13，另一种写法也接受（accept，提示更推荐按拼写；2026-11-19 老师确认）。
   看记号写和弦（第 1–8 题）照搬老师 PDF 练习的八个记号：完整的密集排列，不省略任何音。
   全部题目照搬老师 PDF 练习（2026-11-04 转写）；谱例分析的答案是初稿分析，待老师确认。
   2026-11-18（V2）：撤掉原第 17 题四部和声分析；第 9–16 题新增最简结构（minimal，规范 L30）；原第 9–16 题顺延为第 17–24 题，谱例分析为第 25 题。
   原第 10 题（现第 18 题）按老师更正：高音谱表是 G♯3、D4、G4（没有 C♯4），答案 E7(♯9)。
   第 20、23、24 题与第 25 题第 5–7 小节都按这条处理（2026-11-19）。
   第 25 题第 4 小节第 3、4 拍：规范答案拆开写 E7(♯9)、E7(♭13)，也接受只在第 3 拍写 E7(♯9, ♭13)，其他写法不接受（2026-11-19）。
   第 1–4 小节延长的音写成第二声部（老师的谱例）；第 6 小节第 3 拍 A♭4（原 G♯4），第 7 小节 A4 写还原号（2026-11-19）。 */
const chordPractice = {
  code: 'MT Chord 04',
  brand: 'MUSIC THEORY · CHORD SYMBOL',
  subtitle: '和弦记号 · 第四课',
  title: '变化音和弦',
  reportTitle: '和弦记号 4 · 变化音和弦 课后练习',
  backURL: '../',
  tempo: 72,
  unisonTool: true,  // 写和弦题显示「加同度音」（同一位置写两个音，如 ♭9 与 ♯9；第四课起）
  groups: [
    {complete: true, from: 'q01', badge: '看记号写和弦', hint: '在谱表上写出和弦：完整的密集排列，不省略任何音。'},
    {from: 'q09', badge: '看记号写和弦 · 最简结构', hint: '在谱表上写出和弦的最简结构：能省略的音全部省略，记号上写出的变化音不能省。音写在哪个八度都可以，但低音要对。'},
    {from: 'q17', badge: '看谱写记号 · 大谱表', hint: '写出谱例的和弦记号。变化音按拼写判断。'},
    {from: 'q25', badge: '谱例分析', hint: '标记出谱例的所有和弦。点击和弦开始的那个音上方，写出和弦记号。'}
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

    {id: 'q09', label: '9', type: 'build', minimal: true, symbol: 'C7(b9)'},
    {id: 'q10', label: '10', type: 'build', minimal: true, symbol: 'F7(#9)'},
    {id: 'q11', label: '11', type: 'build', minimal: true, symbol: 'Gmaj7(#11)'},
    {id: 'q12', label: '12', type: 'build', minimal: true, symbol: 'Bbm7(b5)'},
    {id: 'q13', label: '13', type: 'build', minimal: true, symbol: 'Eb9(#11)'},
    {id: 'q14', label: '14', type: 'build', minimal: true, symbol: 'A13(b9)'},
    {id: 'q15', label: '15', type: 'build', minimal: true, symbol: 'D7(#5,#9)'},
    {id: 'q16', label: '16', type: 'build', minimal: true, symbol: 'G7(b9,b13)/B'},

    {id: 'q17', label: '17', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['C4.D#4.G#4:w'], bass: ['B2.A3:w']}]}, answer: 'B13(b9)'},
        {id: 'q18', label: '18', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['G#3.D4.Gn4:w'], bass: ['E2.E3:w']}]}, answer: 'E7(#9)', note: '♯9 实际是 F𝄪，谱面按习惯写成同音的 G；三音 G♯ 在，所以 G 是 ♯9。'},
    {id: 'q19', label: '19', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['C#4.E4.Bb4:w'], bass: ['A2.G3:w']}]}, answer: 'A7(b9)'},
    {id: 'q20', label: '20', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['F4.A4.Eb5:w'], bass: ['Db3.C4:w']}]}, answer: 'Dbmaj9(#5)', accept: ['Dbmaj9(b13)'], note: 'A 写成五音的字母，更推荐按拼写记作 ♯5；没有纯五度，记作 ♭13 也算对。'},
    {id: 'q21', label: '21', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['F4.Ab4.B4.Eb5:w'], bass: ['G3.D4:w']}]}, answer: 'G7(b9,b13)'},
    {id: 'q22', label: '22', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['D4.E4.Ab4.B4:w'], bass: ['C3.G3:w']}]}, answer: 'Cmaj9(b13)'},
    {id: 'q23', label: '23', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['E4.A4:w'], bass: ['F3.B3:w']}]}, answer: 'Fmaj7(#11)', accept: ['Fmaj7(b5)'], note: 'B 写成十一音的字母，更推荐按拼写记作 ♯11；没有纯五度，记作 ♭5 也算对。'},
    {id: 'q24', label: '24', type: 'name', score: {staves: ['treble', 'bass'], measures: [{treble: ['Db4.E4.C5:w'], bass: ['Bb2.Ab3:w']}]}, answer: 'Bbm9(#11)', accept: ['Bbm9(b5)'], note: 'E 写成十一音的字母（不是五音的字母 F），更推荐按拼写记作 ♯11；没有纯五度，记作 ♭5 也算对。'},

    // 第 25 题：谱例分析（4/4，弱起）；第 2、4 小节最后一拍的旋律音按和弦外音处理（写不写都算对的情况待老师确认）
    {id: 'q25', label: '25', type: 'analysis', score: {staves: ['treble', 'bass'], time: '4/4', measures: [
      {pickup: true, treble: ['E4:q'], bass: ['r:q']},
      {treble: ['C5:h. B4:q', 'D4.G#4:w'], bass: ['r:q B2:q G#3:h', 'E2:w']},
      {treble: ['C5:h. B4:q', 'E4.G4:w'], bass: ['r:q C3:q A3:h', 'F2:w']},
      {treble: ['C5:h E5:h', 'E4.A4:w'], bass: ['F#3.C4:w']},
      {treble: ['A4:h Gn4:q C5:q', 'E4.F4:h B3.D4:h'], bass: ['D3.C4:h E3.G#3:h']},  // 第 3、4 拍：B3、D4 是符干朝下的第二声部（2026-11-19）
      {treble: ['Bb3.C#4.F4:h D4.G4:h'], bass: ['A2.G3:h B2.A3:h']},
      {treble: ['C4.E4.F4.A4:h D4.E4.Ab4.C5:h'], bass: ['C3.A3:h Bb2.Bb3:h']},
      {treble: ['Gb4.An4.C5.D5:w'], bass: ['Ab2.Ab3:w']},
      {treble: ['F4.Ab4.B4.E5:w'], bass: ['G2.G3:w']}
    ]}, chords: [
      {at: [1, 0], answer: 'E7(b13)'}, {at: [2, 0], answer: ['Fmaj9', 'Fmaj9(#11)']}, {at: [3, 0], answer: ['F#ø7', 'F#m7(b5)']},
      {at: [4, 0], answer: 'Dm9'}, {at: [4, 2], answer: 'E7(#9,b13)', splitFirst: true, split: [{at: [4, 2], answer: 'E7(#9)'}, {at: [4, 3], answer: 'E7(b13)'}]},
      {at: [5, 0], answer: 'A7(b9,b13)', accept: ['A7(#5,b9)'], note: 'F 写成十三音的字母，更推荐 ♭13；没有纯五度，写 ♯5 也算对'}, {at: [5, 2], answer: ['Bm7(b13)', 'Gadd9/B', 'G(add9)/B'], accept: ['Bm7(#5)'], note: 'G 写成十三音的字母，更推荐 ♭13；没有纯五度，写 ♯5 也算对'},
      {at: [6, 0], answer: 'Fmaj7/C'}, {at: [6, 2], answer: 'Bb9(#11)', accept: ['Bb9(b5)'], note: 'E 写成十一音的字母，更推荐 ♯11；没有纯五度，写 ♭5 也算对'},
      {at: [7, 0], answer: 'Ab7(b9,#11)', accept: ['Ab7(b5,b9)'], note: 'D 写成十一音的字母，更推荐 ♯11；没有纯五度，写 ♭5 也算对'}, {at: [8, 0], answer: 'G13(b9)'}
    ]}
  ]
};
