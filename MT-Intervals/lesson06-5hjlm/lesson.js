/* 音程 · 第六课：音程的快速识别（综合复习）
   以 assets/lesson-06.pdf 的四组判断方法为主线，按 1–5 课的「一步一句」重写：
   一、二度与三度（参照音程 + 变化音推导）；二、四度与五度（三全音特例 + 谱面位形）；
   三、六度与七度（借助转位）；四、复音程（减 7 回到单音程）；五、判断流程（把四种方法串成一条路线）。
   每节后有课内 Quiz；全课结束进入 practice/ 结业测验，按单元量化学习成果。
   讲解区：<strong> = 音乐术语；accent() = 重点词；warn() = 「注意」。
   演示区与流程用和弦记号课程的共享实现（MT-Chord/shared）。规则见 docs/interactive-theory-lesson-standard.md。 */
(() => {
  'use strict';
  const {COLOR, CENTER} = ChordStage;

  /* ---------- 谱例资料 ---------- */
  const tone = (id, key, slot, extra = {}) => ({id, key, slot, ...extra});
  const below = (id, slot, text, color = '#334155') => ({id, slot, text, color, drop: 0});
  const above = (id, slot, text, extra = {}) => ({id, slot, text, anchor: 'middle', font: 'label', size: 16, color: '#4f46e5', ...extra});
  const changed = {color: COLOR.bass};
  const reference = {color: '#f87171'};

  // 和声音程：notes 从低到高 [id, 音, extra]；上方标名称，下方可加说明。先低后高依次发声
  const stack = (notes, name, under = null, lift = 30) => ({
    tones: notes.map(([id, key, extra = {}]) => tone(id, key, CENTER, extra)),
    staffSymbols: name ? [above('name', CENTER, name, {lift})] : [],
    staffLabels: under ? [below('under', CENTER, under)] : [],
    offsets: notes.map((_, i) => i * .5), play: true
  });
  const two = (lo, hi, name, under) => stack([['lo', lo], ['hi', hi]], name, under);
  // 变化音推导：先给出去掉变化记号的参考音程，再把变化后的那个音标红
  const altered = (lo, hi, name, under, which) => stack([['lo', lo, which === 'lo' ? changed : {}], ['hi', hi, which === 'hi' ? changed : {}]], name, under);
  // 用转位认六、七度：「?」→ 上方加浅红参考音（下方音高八度）→ 标出答案
  const guess = (lo, hi) => two(lo, hi, '?');
  const lookUp = (lo, hi, ref, under) => ({...stack([['lo', lo], ['hi', hi], ['ref', ref, reference]], '?', under)});
  const answer = (lo, hi, ref, name, under) => ({...stack([['lo', lo], ['hi', hi], ['ref', ref, reference]], name, under), play: false});

  // 度数对照（面板）：上一行 top，下一行 bottom；marks 'cN' 高亮上一行为 N 的那一列
  const table = (key, tags, top, bottom, foot, marks = []) => ({panel: {key, marks, html:
    `<div class="sums" style="--columns:${top.length}"><span class="sm-tag">${tags[0]}</span><span class="sm-tag">${tags[1]}</span>` +
    top.map((n, i) => `<span class="sm-cell" data-mark="c${n}" style="grid-column:${i + 2};grid-row:1">${n}</span>` +
      `<span class="sm-cell" data-mark="c${n}" style="grid-column:${i + 2};grid-row:2">${bottom[i]}</span>`).join('') +
    `<span class="sm-total">${foot}</span></div>`}});
  const range = (a, b) => Array.from({length: b - a + 1}, (_, i) => a + i);
  const inversionTable = marks => table('inv', ['原位', '转位'], range(1, 8), range(1, 8).map(n => 9 - n), '同一列相加 = 9', marks);
  const compoundTable = marks => table('cmp', ['复音程', '单音程'], range(9, 15), range(2, 8), '复音程度数 − 7 = 单音程度数', marks);

  // 判断流程（面板）：先读度数，再按度数走对应的路线
  const ROUTES = [
    ['r23', '二、三度', '找自然音程参照'],
    ['r45', '四、五度', '纯音程 + F–B / B–F 特例'],
    ['r67', '六、七度', '转位成三、二度'],
    ['r9', '九度以上', '减 7 回到单音程']
  ];
  const flow = marks => ({panel: {key: 'flow', marks, html:
    `<div class="flow"><p class="flow-head">① 先读度数</p>` +
    ROUTES.map(([id, deg, how]) => `<div class="flow-row" data-mark="${id}"><b>${deg}</b><span>${how}</span></div>`).join('') +
    `<p class="flow-foot">② 有变化音时，再判断变宽或变窄</p></div>`}});

  /* ---------- 课程内容 ---------- */
  const {steps, sections, section, group, quiz, accent, p, warn} = ChordLesson.builder();

  // 一、二度与三度
  section('seconds', '一', '二度与三度');
  group('seconds', [
    [p(`判断音程，总是先读<strong>度数</strong>，再定<strong>性质</strong>。定性质最快的办法，是先记住几个${accent('参照音程')}。`), flow([])],
    [p(`自然二度中，只有 <strong>B–C、E–F</strong> 是${accent('小二度')}，其余都是大二度。`), [two('B3', 'C4', 'm2'), two('E4', 'F4', 'm2'), two('C4', 'D4', 'M2')], {sequence: 1400}],
    [p(`自然三度中，<strong>C–E、F–A、G–B</strong> 是${accent('大三度')}，其余都是小三度。`), [two('C4', 'E4', 'M3'), two('F4', 'A4', 'M3'), two('G4', 'B4', 'M3'), two('D4', 'F4', 'm3')], {sequence: 1400}],
    [p(`遇到变化音时，先${accent('去掉变化记号')}，判断参考音程的性质。`), [two('E4', 'G#4', '?'), two('E4', 'G4', 'm3', '参考音程')], {sequence: 1400}],
    [p(`再看变化音：上方音升高、或下方音降低，音程${accent('变宽')}；上方音降低、或下方音升高，音程${accent('变窄')}。`), [two('E4', 'G4', 'm3'), altered('E4', 'G#4', 'M3', '上方音升高 → 变宽', 'hi')], {sequence: 1400}],
    [p(`例如 E♭–G：E–G 是小三度，下方音降低，变宽一个半音，所以是${accent('大三度')}。`), [two('E4', 'G4', 'm3'), altered('Eb4', 'G4', 'M3', '下方音降低 → 变宽', 'lo')], {sequence: 1400}]
  ]);
  const HINT_ALT = '先去掉变化记号，参考音程是什么性质？变化音让它变宽还是变窄？';
  quiz('fs-a', guess('F#4', 'A4'), {
    question: '这个音程是：', options: [['M3', '大三度'], ['m3', '小三度'], ['d3', '减三度']], answer: 'm3',
    right: '正确。F–A 是大三度；下方音升高，变窄一个半音，所以是小三度。', wrong: HINT_ALT
  });
  quiz('b-cs', guess('B4', 'C#5'), {
    question: '这个音程是：', options: [['m2', '小二度'], ['M2', '大二度'], ['A2', '增二度']], answer: 'M2',
    right: '正确。B–C 是小二度；上方音升高，变宽一个半音，所以是大二度。', wrong: HINT_ALT
  });

  // 二、四度与五度
  section('fourths', '二', '四度与五度');
  group('fourths', [
    [p(`自然四度、五度，绝大多数是<strong>纯音程</strong>。`), [two('C4', 'F4', 'P4'), two('C4', 'G4', 'P5')], {sequence: 1400}],
    [p(`特例只有一对：<strong>F–B</strong> 是增四度，<strong>B–F</strong> 是减五度，它们都是${accent('三全音')}。`), [two('F4', 'B4', 'A4'), two('B4', 'F5', 'd5', '三全音 TT')], {sequence: 1400}],
    [p(`在谱上读度数：四度的两个音${accent('一线一间')}。`), two('E4', 'A4', 'P4', '一线一间')],
    [p(`五度的两个音${accent('同在线上')}，或同在间上。`), [two('E4', 'B4', 'P5', '同在线上'), two('F4', 'C5', 'P5', '同在间上')], {sequence: 1400}],
    [warn(`位形只帮助读<strong>度数</strong>，不决定性质。F–B 也是一线一间，但它是增四度。`), two('F4', 'B4', 'A4', '一线一间')],
    [p(`有变化音时，仍按「变宽、变窄」推导。例如 F–B♭：F–B 是增四度，上方音降低，变窄成${accent('纯四度')}。`), [two('F4', 'B4', 'A4'), altered('F4', 'Bb4', 'P4', '上方音降低 → 变窄', 'hi')], {sequence: 1400}]
  ]);
  quiz('bb-f', guess('Bb4', 'F5'), {
    question: '这个音程是：', options: [['d5', '减五度'], ['P5', '纯五度'], ['A5', '增五度']], answer: 'P5',
    right: '正确。B–F 是减五度；下方音降低，变宽一个半音，所以是纯五度。', wrong: 'B–F 是自然五度里的特例。下方音降低，音程变宽还是变窄？'
  });
  quiz('e-as', guess('E4', 'A#4'), {
    question: '这个音程是：', options: [['P4', '纯四度'], ['A4', '增四度'], ['d5', '减五度']], answer: 'A4',
    right: '正确。E–A 是纯四度；上方音升高，变宽一个半音，所以是增四度。', wrong: '先读度数：一线一间是几度？E–A 是什么性质？'
  });

  // 三、六度与七度
  section('inversion', '三', '六度与七度');
  group('inversion', [
    [p(`六度、七度跨度大，直接数音数${accent('又慢又容易错')}。`), guess('E4', 'C5')],
    [p(`第五课学过：单音程转位前后，度数相加等于 9。所以${accent('六度转位成三度，七度转位成二度')}。`), inversionTable(['c6', 'c7'])],
    [p(`转位后性质反转：<strong>大 ↔ 小，增 ↔ 减</strong>，纯音程不变。`), inversionTable(['c2', 'c3', 'c6', 'c7'])],
    [p(`例如 E–C：把下方的 E 移高一个八度，得到 C–E。`), lookUp('E4', 'C5', 'E5', 'C–E　M3')],
    [p(`C–E 是大三度，反转回来，E–C 就是${accent('小六度')}。`), answer('E4', 'C5', 'E5', 'm6', 'M3 → m6')],
    [p(`七度也一样：A–G 转位成 G–A，大二度，所以 A–G 是${accent('小七度')}。`), [guess('A4', 'G5'), lookUp('A4', 'G5', 'A5', 'G–A　M2'), answer('A4', 'G5', 'A5', 'm7', 'M2 → m7')], {sequence: 1600}]
  ]);
  const HINT_INV = '把下方音移高一个八度，转位后是几度、什么性质？再把性质反转回来。';
  quiz('d-b', guess('D4', 'B4'), {
    question: '这个音程是：', options: [['m6', '小六度'], ['M6', '大六度'], ['A6', '增六度']], answer: 'M6',
    right: '正确。转位成 B–D 是小三度，反转回来是大六度。', wrong: HINT_INV
  });
  quiz('g-fs', guess('G4', 'F#5'), {
    question: '这个音程是：', options: [['m7', '小七度'], ['M7', '大七度'], ['d8', '减八度']], answer: 'M7',
    right: '正确。转位成 F♯–G 是小二度，反转回来是大七度。', wrong: HINT_INV
  });

  // 四、复音程
  section('compound', '四', '复音程');
  group('compound', [
    [p(`超过八度的<strong>复音程</strong>，先把度数${accent('减去 7')}，回到对应的单音程。`), compoundTable([])],
    [p(`例如 C4–E5：10 − 7 = 3，对应单音程 C–E。`), compoundTable(['c10'])],
    [p(`复音程与对应单音程的大、小、纯、增、减${accent('性质相同')}。C–E 是大三度，所以 C4–E5 是大十度。`), [two('C4', 'E4', 'M3'), two('C4', 'E5', 'M10')], {sequence: 1400}],
    [p(`再如 D4–G5：D 到 G 是四度，再加一个八度，是${accent('十一度')}（11 − 7 = 4）。D–G 是纯四度，所以是纯十一度。`), [two('D4', 'G4', 'P4'), two('D4', 'G5', 'P11')], {sequence: 1400}],
    [warn(`读复音程时，先确认跨了几个八度，再数度数；数错度数，后面的性质判断就全错了。`), compoundTable(['c11'])]
  ]);
  quiz('c-d5', guess('C4', 'D5'), {
    question: '这个音程是：', options: [['M2', '大二度'], ['M9', '大九度'], ['m9', '小九度']], answer: 'M9',
    right: '正确。C–D 是大二度，再加一个八度，是大九度。', wrong: '它超过了八度吗？减去 7 后对应哪个单音程？'
  });
  quiz('e-b5', guess('E4', 'B5'), {
    question: '这个音程是：', options: [['P5', '纯五度'], ['P12', '纯十二度'], ['d12', '减十二度']], answer: 'P12',
    right: '正确。E–B 是纯五度，加一个八度是纯十二度。', wrong: '先确认度数：E4 到 B5 是几度？对应的单音程是什么性质？'
  });

  // 五、判断流程
  section('flow', '五', '判断流程');
  group('flow', [
    [p(`把四种方法串起来：遇到任何音程，第一步都是${accent('读度数')}。`), flow([])],
    [p(`二、三度，找自然音程参照；四、五度，记住纯音程和三全音特例。`), flow(['r23', 'r45'])],
    [p(`六、七度，转位成三、二度；九度以上，减 7 回到单音程。`), flow(['r67', 'r9'])],
    [p(`最后，有变化音时，再判断音程${accent('变宽还是变窄')}。`), flow(['r23', 'r45', 'r67', 'r9'])]
  ]);
  quiz('ab-f', guess('Ab4', 'F5'), {
    question: '这个音程是：', options: [['m6', '小六度'], ['M6', '大六度'], ['A6', '增六度']], answer: 'M6',
    right: '正确。六度先转位：F–A♭，F–A 是大三度，上方音降低变成小三度；反转回来是大六度。', wrong: '六度用哪种方法？转位后还有变化音，别忘了判断变宽或变窄。'
  });
  quiz('cs-g5', guess('C#4', 'G5'), {
    question: '这个音程是：', options: [['P12', '纯十二度'], ['d12', '减十二度'], ['A11', '增十一度']], answer: 'd12',
    right: '正确。C4–G5 是十二度，对应 C–G 纯五度；下方音升高变窄，所以是减十二度。', wrong: '先读度数并减 7，再看变化音让音程变宽还是变窄。'
  });

  ChordLesson.run({
    steps, sections, countBy: 'lesson', noteLength: 1,
    storageId: 'interval-06', formerPaths: ['/MT-Intervals/lesson06/', '/MT-Intervals/lesson06/index.html'],
    preload: ['B3','C4','C#4','D4','E4','Eb4','F4','F#4','G4','G#4','A4','A#4','Ab4','B4','Bb4','C5','C#5','D5','E5','F5','F#5','G5','A5','B5']
  });

  /* ---------- 完成页：MusicTheory.net 强化练习（链接为 PDF 原有超链接） ---------- */
  const EXTERNAL = [
    ['二度与三度', [['大小二度识别', 'brwyryyroyybnyynbyb'], ['增减二度识别', 'brwyrybyyeybnyynbyb'], ['大小三度识别', 'brwyryyeybybnyynbyb'], ['增减三度识别', 'brwyrynyyoybnyynbyb']]],
    ['四度与五度', [['纯四度 / 纯五度识别', 'brwyryyobyybnyynbyb'], ['增减四度 / 五度识别', 'brwyrycyyydbnyynbyb']]],
    ['六度与七度', [['大小六度 / 七度识别', 'brwyryyyggybnyynbyb'], ['增减六度 / 七度识别', 'brwyryobyycbnyynbyb']]],
    ['复音程', [['9–15 度复音程识别', 'brwyry99999bnbynbyb']]]
  ];
  const list = document.getElementById('exerciseLinks');
  EXTERNAL.forEach(([group, items]) => {
    const h = document.createElement('h3'); h.textContent = group; list.append(h);
    items.forEach(([title, config]) => {
      const a = document.createElement('a');
      a.className = 'secondary btn-link exercise-link';
      a.href = `https://www.musictheory.net/exercises/interval/${config}`;
      a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', `${title}，MusicTheory.net 外部练习，新窗口打开`);
      const text = document.createElement('span'); text.textContent = title;
      const arrow = document.createElement('span'); arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true');
      a.append(text, arrow); list.append(a);
    });
  });
})();
