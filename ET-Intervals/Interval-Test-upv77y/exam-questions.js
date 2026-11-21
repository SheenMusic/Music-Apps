/* 音程听力综合测试：出题与判分（页面和测试共用，不碰 DOM 和声音）
 *
 * 两部分都按题型分段出题：先上行旋律，再下行旋律，最后和声；段内顺序随机。
 * 答题时不提示题型，只在回看和报告里显示。
 *
 * 第一部分「音程性质」36 题：上行旋律、下行旋律、和声各 12 题。
 *   12 种单音程各 2 次、12 种复音程（九度到十五度，含复三全音）各 1 次。
 *   作答：选一个度数（2–15）和一个性质（d m P M A），两行按钮互不影响。
 *   等音程都算对：只要所选音程的半音数与题目相同就对，例如小三度答 A2、
 *   三全音答 A4 或 d5、纯五度答 d6。不成立的组合（如 P3、M4）算错。
 * 第二部分「听音找音」12 题：显示已知音，播放两个音，在键盘上点出另一个音。
 *   上行、下行、和声各 4 题；每次随机抽单音程 8 种、复音程 4 种。
 *   旋律题的已知音是先响的音；和声题的已知音随机是低音或高音。
 *   只看音高，不看升降写法。
 * 音名写法沿用 ET 的规则（../shared/interval-spelling.js）。
 */
(function (root) {
  'use strict';

  const DEGREE_NAMES = {
    2: '二度', 3: '三度', 4: '四度', 5: '五度', 6: '六度', 7: '七度', 8: '八度',
    9: '九度', 10: '十度', 11: '十一度', 12: '十二度', 13: '十三度', 14: '十四度', 15: '十五度'
  };

  // degrees：答哪个度数算度数对（三全音有两个）
  const INTERVALS = [
    { id: 'm2', name: '小二度', semitones: 1, degrees: [2], quality: 'm' },
    { id: 'M2', name: '大二度', semitones: 2, degrees: [2], quality: 'M' },
    { id: 'm3', name: '小三度', semitones: 3, degrees: [3], quality: 'm' },
    { id: 'M3', name: '大三度', semitones: 4, degrees: [3], quality: 'M' },
    { id: 'P4', name: '纯四度', semitones: 5, degrees: [4], quality: 'P' },
    { id: 'TT', name: '三全音', semitones: 6, degrees: [4, 5], quality: ['A', 'd'] },
    { id: 'P5', name: '纯五度', semitones: 7, degrees: [5], quality: 'P' },
    { id: 'm6', name: '小六度', semitones: 8, degrees: [6], quality: 'm' },
    { id: 'M6', name: '大六度', semitones: 9, degrees: [6], quality: 'M' },
    { id: 'm7', name: '小七度', semitones: 10, degrees: [7], quality: 'm' },
    { id: 'M7', name: '大七度', semitones: 11, degrees: [7], quality: 'M' },
    { id: 'P8', name: '纯八度', semitones: 12, degrees: [8], quality: 'P' },
    { id: 'm9', name: '小九度', semitones: 13, degrees: [9], quality: 'm' },
    { id: 'M9', name: '大九度', semitones: 14, degrees: [9], quality: 'M' },
    { id: 'm10', name: '小十度', semitones: 15, degrees: [10], quality: 'm' },
    { id: 'M10', name: '大十度', semitones: 16, degrees: [10], quality: 'M' },
    { id: 'P11', name: '纯十一度', semitones: 17, degrees: [11], quality: 'P' },
    { id: 'cTT', name: '复三全音', semitones: 18, degrees: [11, 12], quality: ['A', 'd'] },
    { id: 'P12', name: '纯十二度', semitones: 19, degrees: [12], quality: 'P' },
    { id: 'm13', name: '小十三度', semitones: 20, degrees: [13], quality: 'm' },
    { id: 'M13', name: '大十三度', semitones: 21, degrees: [13], quality: 'M' },
    { id: 'm14', name: '小十四度', semitones: 22, degrees: [14], quality: 'm' },
    { id: 'M14', name: '大十四度', semitones: 23, degrees: [14], quality: 'M' },
    { id: 'P15', name: '纯十五度', semitones: 24, degrees: [15], quality: 'P' }
  ];

  const TYPE_NAMES = { asc: '上行旋律音程', desc: '下行旋律音程', harm: '和声音程' };

  // 性质按钮：始终显示这 5 个，不随度数变化
  const QUALITIES = ['d', 'm', 'P', 'M', 'A'];

  // 某个音程算对的写法：三全音是 A4 / d5（复三全音 A11 / d12），其余只有一种
  function acceptedAnswers(interval) {
    if (Array.isArray(interval.quality)) return interval.quality.map((q, i) => ({ degree: interval.degrees[i], quality: q }));
    return [{ degree: interval.degrees[0], quality: interval.quality }];
  }

  // 学生的答案写成半角缩写，例如 M3、A11
  function answerLabel(degree, quality) {
    return `${quality}${degree}`;
  }

  // 所选音程的半音数；组合不成立（如 P3、M4）时返回 null
  const BASE = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11 };
  function semitonesOf(degree, quality) {
    const simple = (degree - 1) % 7 + 1, octaves = Math.floor((degree - 1) / 7);
    const perfectType = [1, 4, 5].includes(simple);
    const shift = perfectType
      ? { d: -1, P: 0, A: 1 }[quality]
      : { d: -2, m: -1, M: 0, A: 1 }[quality];
    return shift === undefined ? null : BASE[simple] + 12 * octaves + shift;
  }

  // 作答 → 自然音程（只认题库里的写法，用于测试）；不是自然音程写法时返回 null
  function intervalFromAnswer(degree, quality) {
    return INTERVALS.find(i => acceptedAnswers(i).some(a => a.degree === degree && a.quality === quality)) || null;
  }

  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // 拼写用的度数：三全音随机写成增四度或减五度（复三全音写成增十一度或减十二度）
  function spellingDegree(interval) {
    return interval.degrees[Math.floor(Math.random() * interval.degrees.length)];
  }

  const TYPE_ORDER = ['asc', 'desc', 'harm'];

  // 题目的标准答案缩写，例如 m6、P12；三全音按题目的写法给 A4 或 d5（复三全音 A11 或 d12）
  function correctLabel(interval, degree) {
    const quality = Array.isArray(interval.quality) ? interval.quality[interval.degrees.indexOf(degree)] : interval.quality;
    return quality + degree;
  }

  /* 音区（2026-11-10）：全部音在 E3（52）到 C6（84）之间，钢琴采样覆盖 C2–C6。
   * 两个音里较低的那个：约 2 成落在 E3–F#3（G3 以下），其余在 G3 以上；
   * 低音最高到 C5（72），复音程的高音因此最多到 C6。 */
  const LOWEST = 52, BELOW_G3 = 54, G3 = 55, HIGHEST = 84, LOW_TOP = 72;
  const LOW_BAND_CHANCE = 0.2;

  // 这一题较低那个音的范围 [lo, hi]
  function lowNoteRange(semitones) {
    const top = Math.min(LOW_TOP, HIGHEST - semitones);
    return Math.random() < LOW_BAND_CHANCE ? [LOWEST, BELOW_G3] : [G3, top];
  }

  /* 出一组音。up：起始音（ref）在下方；否则起始音在上方、向下数。
   * 返回 ref（起始音）、target（另一个音）、low、high */
  function pickPair(interval, up, degree) {
    const S = root.IntervalSpelling;
    const n = interval.semitones;
    const [lo, hi] = lowNoteRange(n);
    const q = up
      ? S.pickQuestion({ refMin: lo, refMax: hi, delta: n, degree })
      : S.pickQuestion({ refMin: lo + n, refMax: hi + n, delta: -n, degree });
    const ref = { midi: q.refMidi, name: q.ref.display };
    const target = { midi: q.targetMidi, name: q.target.display };
    return { ref, target, low: up ? ref : target, high: up ? target : ref };
  }

  // 题量配额（2026-11-10）：单音程约 2/3、复音程约 1/3
  const SIMPLE = INTERVALS.filter(i => i.semitones <= 12);
  const COMPOUND = INTERVALS.filter(i => i.semitones > 12);

  // 第一部分：12 种单音程各 2 次、12 种复音程各 1 次，共 36 题；按题型分段，每段 12 题
  function buildPartOne() {
    const intervals = shuffle(SIMPLE.concat(SIMPLE, COMPOUND));
    return intervals.map((interval, i) => {
      const type = TYPE_ORDER[Math.floor(i / 12)];
      const degree = spellingDegree(interval);
      const { low, high } = pickPair(interval, type !== 'desc', degree);
      // played：播放顺序（旋律题先后、和声题同时）
      const played = type === 'desc' ? [high, low] : [low, high];
      return { part: 1, type, interval, label: correctLabel(interval, degree), low, high, played, answer: null };
    });
  }

  /* 第二部分：随机抽单音程 8 种、复音程 4 种，共 12 题；按题型分段，每段 4 题。
   * 已知音（ref）：旋律题是先响的音；和声题随机是低音或高音。
   * 键盘以已知音为中心，向两边各延伸两个八度。 */
  function buildPartTwo() {
    const intervals = shuffle(shuffle(SIMPLE).slice(0, 8).concat(shuffle(COMPOUND).slice(0, 4)));
    return intervals.map((interval, i) => {
      const type = TYPE_ORDER[Math.floor(i / 4)];
      const up = type === 'asc' || (type === 'harm' && Math.random() < 0.5);
      const degree = spellingDegree(interval);
      const { ref, target, low, high } = pickPair(interval, up, degree);
      const played = type === 'harm' ? [low, high] : [ref, target];
      return { part: 2, type, interval, label: correctLabel(interval, degree), ref, target, low, high, played, answer: null };
    });
  }

  function buildExam() {
    return buildPartOne().concat(buildPartTwo());
  }

  // 第一部分 answer = { degree, quality }；第二部分 answer = { midi }
  function grade(question) {
    const a = question.answer;
    if (!a) return { correct: false, degreeCorrect: false };
    if (question.part === 2) return { correct: a.midi === question.target.midi, degreeCorrect: null };
    // 等音程都算对：半音数相同即可
    const correct = semitonesOf(a.degree, a.quality) === question.interval.semitones;
    return {
      correct,
      // 度数判断：答对（含等音程写法）或度数与自然写法一致
      degreeCorrect: correct || question.interval.degrees.includes(a.degree)
    };
  }

  root.IntervalExam = Object.freeze({
    INTERVALS, DEGREE_NAMES, TYPE_NAMES, TYPE_ORDER,
    QUALITIES, acceptedAnswers, answerLabel, semitonesOf, intervalFromAnswer, buildExam, buildPartOne, buildPartTwo, correctLabel, grade
  });
})(typeof window === 'undefined' ? globalThis : window);
