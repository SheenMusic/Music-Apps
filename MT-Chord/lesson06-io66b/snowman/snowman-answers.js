/* 依老師 2026-11-21 PDF 的大小字轉寫；不採用舊版 questions.js 初稿。 */
window.SNOWMAN_QUESTION = {
  id: 'snowman-full', type: 'analysis',
  score: {firstBar: 1, time: '4/4', measures: [{}]},
  chords: [
    {at: [0, 0], answer: 'Eb(add2,add4)', splitFirst: true,
      wholeWrong: '整小节合写成 E♭(add2,add4) 有争议：问题在和弦的起点。第 1 拍的低音是 B♭，不是 E♭，所以 E♭ 和弦不是从第 1 拍开始的。把第 1 拍和后面分开来写。',
      split: [
      {at: [0, 0], answer: 'Bbsus4'}, {at: [0, 1.5], answer: 'Eb', merge: 'Eb(add4)'}, {at: [0, 3], answer: 'Ebsus4'}
    ]},
    {at: [3, 0], answer: 'Bb13sus4', accept: ['Eb(add4)/Bb'], acceptNote: '音都对。但钢琴低音 B♭ 上方一个八度内没有二、四、六度，按原位来看，以 B♭ 为根音，写成 B♭13sus4。'},
    {at: [4, 0], answer: ['Eb(add9)', 'Eb(add2)']},
    {at: [6, 0], answer: ['Bb(add9)/D', 'Bb(add2)/D'], accept: ['Dm7(b13)'], acceptNote: '音都对。但低音 D 上方一个八度内有六度（B♭），按转位来看，写成 B♭(add9)/D。'},
    {at: [8, 0], answer: 'Ab/C'},
    {at: [9, 0], answer: 'Cm'},
    {at: [10, 0], answer: ['Bbm(add9)', 'Bbm(add2)']},
    {at: [10, 1.5], answer: 'Bbsus2', optional: true},
    // 第 11 小节第 3 拍后半拍（老师 2026-11-22）：和弦仍是 B♭m(add9)，只换低音 A♭；这一拍实际响的是 D♭（没有 C），B♭m/A♭ 也对；可以只写 /A♭
    {at: [10, 2.5], answer: ['Bbm(add9)/Ab', 'Bbm/Ab'], note: '和弦没变，只换了低音，也可以只写 /A♭。'},
    {at: [10, 3.5], answer: 'Eb/G'},
    {at: [12, 0], answer: ['Ab(add9)', 'Ab(add2)']},
    {at: [13, 0], answer: 'Ebmaj9/G'},
    {at: [13, 1.5], answer: 'Gm7(b13)', optional: true},
    {at: [14, 0], answer: 'Dm11(b5)'},
    {at: [14, 2], answer: 'G7(b9)'},
    {at: [15, 0], answer: 'Cm9'},
    {at: [16, 0], answer: 'F7'},
    {at: [17, 0], answer: 'Fm11'},
    {at: [19, 0], answer: 'Fm11(b5)/Cb', also: ['Abm(maj13)/Cb', 'Cbmaj7(#11,b13)']},
    {at: [20, 3], answer: 'Abm/Bb', also: ['Bb7sus4(b9)']},
    {at: [21, 0], answer: 'Eb(add2,add4)', splitFirst: true, split: [
      {at: [21, 0], answer: 'Eb'}, {at: [21, 1.5], answer: 'Ebsus4'}, {at: [21, 3], answer: 'Ebsus2'}
    ]},
    {at: [23, 0], answer: 'Eb'}
  ]
};
