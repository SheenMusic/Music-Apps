/* 第五课辅助练习：六七度速认（试用版）。
   只练转位法：六度当作三度、七度当作二度来认，再转回来。
   识别：谱上给两个音，点一下选音程（减、小、大、增的六度、七度）。
   构建：给一个音、方向和音程，在谱上点出目标音，用 ↑↓ 微调、♭♯ 加变音记号，再按确认。
   识别题 8 种音程完全随机；构建题分两档：标准（大小音程出现得多一些，没有重升、重降）
   和挑战（8 种音程平均出现，含重升、重降）。所有音在 G3–D6 之间。
   每道题在后台计时（出题到作答），答题时不显示走动的秒表，答完才显示这题用了几秒。
   题目不限数量：从第 2 题起显示平均用时（最近 10 题，不满 10 题按已做的题算）；
   做满 10 题、最近 10 题至少答对 9 题、并且平均用时达到合格标准，才可以结束练习、生成报告
   （报告也只统计最近 10 题）。
   答错时用浅红色的参考音演示转位。 */
(function () {
  'use strict';
  const WINDOW = 10;                            // 按最近几题计算平均
  const STANDARD = {identify: 5.5, build: 7};   // 合格标准：最近 10 题平均秒数
  const SHOW_FROM = 2;                           // 做完第几题开始显示平均用时
  const PASS_CORRECT = 9;                        // 最近 10 题至少答对几题
  const NEXT_DELAY = 700;      // 答对后停留多久自动进入下一题（不计入用时）
  const REFERENCE = '#f87171'; // 和课件第四节一样的浅红色参考音
  const INPUT = '#6366f1';     // 学生放的目标音
  const RIGHT = '#059669';     // 正确答案
  const LOW = 55, HIGH = 86;   // G3–D6

  const INTERVALS = [
    {code: 'd6', name: '减六度', degree: 6, semis: 7, inverted: '增三度'},
    {code: 'm6', name: '小六度', degree: 6, semis: 8, inverted: '大三度'},
    {code: 'M6', name: '大六度', degree: 6, semis: 9, inverted: '小三度'},
    {code: 'A6', name: '增六度', degree: 6, semis: 10, inverted: '减三度'},
    {code: 'd7', name: '减七度', degree: 7, semis: 9, inverted: '增二度'},
    {code: 'm7', name: '小七度', degree: 7, semis: 10, inverted: '大二度'},
    {code: 'M7', name: '大七度', degree: 7, semis: 11, inverted: '小二度'},
    {code: 'A7', name: '增七度', degree: 7, semis: 12, inverted: '减二度'}
  ];
  const KINDS = {identify: '识别音程', build: '构建音程'};
  const DIRECTION = {up: '向上', down: '向下'};

  /* 音：letter 0–6（C–B），accidental -1 / 0 / 1，octave */
  const LETTERS = 'CDEFGAB', NATURAL = [0, 2, 4, 5, 7, 9, 11];
  const SIGN = {'-2': '𝄫', '-1': '♭', 0: '', 1: '♯', 2: '𝄪'};
  const VEX_SIGN = {'-2': 'bb', '-1': 'b', 0: '', 1: '#', 2: '##'};
  const midi = n => 12 * (n.octave + 1) + NATURAL[n.letter] + n.accidental;
  const step = n => n.octave * 7 + n.letter;                    // 谱上的位置（线、间）
  const fromStep = s => ({letter: s % 7, octave: Math.floor(s / 7), accidental: 0});
  const noteName = n => LETTERS[n.letter] + SIGN[n.accidental];
  const same = (a, b) => step(a) === step(b) && a.accidental === b.accidental;
  const vexKey = n => LETTERS[n.letter].toLowerCase() + VEX_SIGN[n.accidental] + '/' + n.octave;
  // 出发音和识别题的音：最多一个升降号，E♯、B♯、F♭、C♭ 先不出现
  const plain = n => Math.abs(n.accidental) <= 1 && !((n.letter === 2 || n.letter === 6) && n.accidental === 1) && !((n.letter === 3 || n.letter === 0) && n.accidental === -1);
  // 构建题的目标音：可以有重升、重降，也可以是 E♯、B♯、F♭、C♭；只是不出 E𝄪、B𝄪、F𝄫、C𝄫
  const spelled = n => Math.abs(n.accidental) <= 2 && !((n.letter === 2 || n.letter === 6) && n.accidental === 2) && !((n.letter === 3 || n.letter === 0) && n.accidental === -2);
  const inRange = n => midi(n) >= LOW && midi(n) <= HIGH;
  // 从 note 出发，向上（sign 1）或向下（sign -1）的音程
  function move(note, iv, sign) {
    const target = fromStep(step(note) + sign * (iv.degree - 1));
    target.accidental = midi(note) + sign * iv.semis - midi(target);
    return target;
  }
  const NOTES = [];
  for (let s = step({letter: 4, octave: 3}); s <= step({letter: 1, octave: 6}); s++) for (const accidental of [-1, 0, 1]) {
    const n = {...fromStep(s), accidental};
    if (plain(n) && inRange(n)) NOTES.push(n);
  }

  const random = list => list[Math.floor(Math.random() * list.length)];
  // 一题：音程、方向完全随机；相邻两题不用同一个出发音
  // 构建题标准档：大、小音程各出现 2 次时，增、减各出现 1 次
  const STANDARD_POOL = INTERVALS.flatMap(iv => /[Mm]/.test(iv.code) ? [iv, iv] : [iv]);
  function makeQuestion(kind, previous) {
    const challenge = kind === 'build' && level === 'challenge';
    const iv = random(kind === 'build' && !challenge ? STANDARD_POOL : INTERVALS);
    const sign = kind === 'build' && Math.random() < .5 ? -1 : 1;
    const choices = NOTES.filter(n => {
      const target = move(n, iv, sign);
      return (challenge ? spelled(target) : plain(target)) && inRange(target) && (!previous || noteName(n) !== noteName(previous.given));
    });
    const given = random(choices);
    const target = move(given, iv, sign);
    // 识别题统一按「低音 → 高音」：given 是低音
    return {iv, sign, given, target, low: sign > 0 ? given : target, high: sign > 0 ? target : given};
  }

  /* 五线谱：一个全音符和弦，每个音可以单独上色；构建题在出发音旁边画方向箭头 */
  const SVG_NS = 'http://www.w3.org/2000/svg';
  let geometry = null;  // 最近一次画的谱表：点谱表时换算成音高
  function drawStaff(element, tones, arrow = 0) {
    element.replaceChildren();
    geometry = null;
    const VF = NotationRenderer.VF(), c = NotationConfig;
    if (!VF) { element.textContent = '五线谱组件未载入，请检查网络连接后刷新页面。'; return; }
    const sorted = [...tones].sort((a, b) => midi(a.note) - midi(b.note));
    const width = Math.min(240, element.clientWidth || 240);
    const renderer = NotationRenderer.createRenderer(element, {scale: 1});
    renderer.resize(width, c.height);
    const context = renderer.getContext();
    const stave = NotationRenderer.createStave(c.padding, c.staveY, width - c.padding * 2);
    stave.addClef('treble').setContext(context).draw();
    const note = new VF.StaveNote({clef: 'treble', keys: sorted.map(t => vexKey(t.note)), duration: 'w'});
    sorted.forEach((t, i) => {
      const color = t.color || '#000000';
      note.setKeyStyle(i, {fillStyle: color, strokeStyle: color});
      if (t.note.accidental) {
        const accidental = new VF.Accidental(VEX_SIGN[t.note.accidental]);
        accidental.setStyle({fillStyle: color, strokeStyle: color});
        note.addModifier(accidental, i);
      }
    });
    note.setLedgerLineStyle({strokeStyle: c.staffLineColor, lineWidth: c.ledgerLineWidth});
    NotationRenderer.formatAndDraw(context, stave, [note]);
    const svg = element.querySelector('svg');
    if (arrow) {
      const from = sorted.findIndex(t => t.arrow), y = note.getYs()[from], x = note.getNoteHeadEndX() + 22;
      const end = y - arrow * 26;
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', `M${x} ${y} L${x} ${end} M${x - 5} ${end + arrow * 7} L${x} ${end} L${x + 5} ${end + arrow * 7}`);
      path.setAttribute('stroke', INPUT); path.setAttribute('stroke-width', '2'); path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round'); path.setAttribute('stroke-linejoin', 'round');
      svg.append(path);
    }
    const box = svg.getBBox();
    const top = Math.min(0, box.y - 4), bottom = Math.max(c.height, box.y + box.height + 4);
    svg.setAttribute('viewBox', `0 ${top} ${width} ${bottom - top}`);
    svg.setAttribute('height', String(bottom - top));
    // 第一线（F5）的位置和线距：点谱表时用来算出点的是哪条线、哪个间
    geometry = {svg, topLine: stave.getYForLine(0), half: stave.getSpacingBetweenLines() / 2};
  }

  /* 页面状态 */
  const byId = id => document.getElementById(id);
  const show = (id, visible) => byId(id).classList.toggle('hidden', !visible);
  let kind = 'identify', level = 'standard', questions = [], records = [], index = 0, started = 0;
  const label = () => kind === 'build' ? `${KINDS.build} · ${level === 'challenge' ? '挑战' : '标准'}` : KINDS.identify;
  let placed = null, locked = true;   // 构建题：学生放在谱上的目标音
  let waiting = false;                // 答错后等学生按「下一题」

  // 开始页的选择：题型（识别 / 构建），构建题再选难度（标准 / 挑战）
  function choose() {
    document.querySelectorAll('[data-group="kind"] button').forEach(b => b.classList.toggle('selected', b.dataset.value === kind));
    document.querySelectorAll('[data-group="level"] button').forEach(b => b.classList.toggle('selected', b.dataset.value === level));
    show('levelBox', kind === 'build');
  }
  document.querySelectorAll('.drill-choices').forEach(group => group.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (group.dataset.group === 'kind') kind = button.dataset.value; else level = button.dataset.value;
    choose();
  }));

  function start(chosen = kind) {
    kind = chosen;
    choose();
    questions = [makeQuestion(kind)];
    records = [];
    index = 0;
    show('startScreen', false); show('resultScreen', false);
    byId('stdText').textContent = STANDARD[kind];
    status();
    showQuestion();
  }
  function progress() {
    // 进度条：前 10 题逐题填满，之后保持满格
    byId('progressBar').style.width = `${Math.min(records.length, WINDOW) / WINDOW * 100}%`;
    byId('questionCounter').classList.toggle('hidden', !questions.length || !byId('resultScreen').classList.contains('hidden'));
    byId('questionCounter').textContent = `第 ${index + 1} 题`;
  }

  /* 合格标准：最近 10 题的平均用时与答对题数 */
  const recent = () => records.slice(-WINDOW);
  // streak：从最后一题往前数，连续答对了几题
  function standing() {
    const last = recent(), mean = average(last), correct = last.filter(r => r.correct).length;
    const ready = records.length >= WINDOW, accurate = correct >= PASS_CORRECT, fastEnough = mean <= STANDARD[kind];
    return {mean, count: last.length, correct, ready, accurate, fastEnough, passed: ready && accurate && fastEnough};
  }
  function status() {
    const s = standing(), note = byId('statusNote');
    byId('avgText').textContent = records.length >= SHOW_FROM ? `近 ${s.count} 题 ${seconds1(s.mean)} 秒 · 对 ${s.correct}/${s.count}` : `已做 ${records.length} 题`;
    note.className = 'drill-status-note' + (s.ready && !s.passed ? ' keep' : '');
    note.textContent = !s.ready ? `再做 ${WINDOW - records.length} 题开始判定合格`
      : !s.accurate ? `最近 10 题错了 ${s.count - s.correct} 题，最多错 1 题，加油！`
      : '还需练习，加油！平均还要再快一点';
    show('statusNote', !s.passed);
    show('finishBtn', s.passed);
  }

  function showQuestion() {
    const q = questions[index];
    show('questionCard', true); show('feedback', false); show('nextBtn', false);
    byId('kindBadge').textContent = label();
    byId('questionCard').classList.toggle('building', kind === 'build');
    placed = null;
    locked = false;
    waiting = false;
    if (kind === 'identify') {
      byId('prompt').textContent = '这是什么音程？';
      byId('tag').textContent = '';
      identifyPad();
    } else {
      byId('prompt').textContent = `从 ${noteName(q.given)} ${DIRECTION[q.sign > 0 ? 'up' : 'down']}构建${q.iv.name}`;
      byId('tag').textContent = q.iv.code;
      byId('pad').replaceChildren();
      updateBuildPad();
    }
    drawQuestion();
    progress();
    started = performance.now();
    // 计时只在后台进行：答题时不显示走动的秒表，答完再显示这题的用时
    byId('timer').textContent = '';
  }
  // 作答中的谱面（转屏时也用它重画）
  function drawQuestion() {
    const q = questions[index];
    if (kind === 'identify') { drawStaff(byId('staff'), [{note: q.low}, {note: q.high}]); return; }
    const tones = [{note: q.given, arrow: true}];
    if (placed) tones.push({note: placed, color: INPUT});
    drawStaff(byId('staff'), tones, q.sign);
  }

  /* 识别题：两排按钮，点一下就提交 */
  function identifyPad() {
    const element = byId('pad');
    element.replaceChildren();
    ['六', '七'].forEach(degree => {
      const row = document.createElement('div');
      row.className = 'drill-pad-row';
      row.style.setProperty('--columns', 4);
      ['减', '小', '大', '增'].forEach(quality => {
        const name = `${quality}${degree}度`, button = document.createElement('button');
        button.type = 'button';
        button.className = 'option-btn';
        button.textContent = name;
        button.onclick = () => {
          if (locked) return;
          button.classList.add('selected');
          submit(name);
        };
        row.append(button);
      });
      element.append(row);
    });
  }

  /* 构建题：点谱表放音，↑↓ 微调一格（换位置后回到还原），♭♯ 加减变音记号，确认提交 */
  const buildPad = byId('buildPad');
  function updateBuildPad() {
    document.querySelectorAll('[data-accidental]').forEach(b => b.classList.toggle('selected', placed?.accidental === Number(b.dataset.accidental)));
    // 答错后「确认」键变成「下一题」，不用另外往下找按钮
    byId('confirmBtn').textContent = waiting ? '下一题' : '确认';
    byId('confirmBtn').disabled = waiting ? false : !placed || locked;
  }
  function place(note) {
    if (locked || kind !== 'build') return;
    const lowest = step({letter: 4, octave: 3}), highest = step({letter: 1, octave: 6});
    placed = {...fromStep(Math.max(lowest, Math.min(highest, step(note)))), accidental: note.accidental};
    drawQuestion();
    updateBuildPad();
  }
  function nudge(direction) {
    const from = placed || questions[index].given;
    place(fromStep(step(from) + direction));
  }
  function accidental(value) {
    if (!placed) return;
    place({...placed, accidental: placed.accidental === value ? 0 : value});
  }
  byId('staffBox').addEventListener('pointerdown', event => {
    if (locked || kind !== 'build' || !geometry) return;
    event.preventDefault();
    const point = geometry.svg.createSVGPoint();
    point.x = event.clientX; point.y = event.clientY;
    const y = point.matrixTransform(geometry.svg.getScreenCTM().inverse()).y;
    // 第一线是 F5；往下每半个线距低一个音级
    const offset = Math.round((geometry.topLine - y) / geometry.half);
    place(fromStep(step({letter: 3, octave: 5}) + offset));
  });
  byId('upBtn').onclick = () => nudge(1);
  byId('downBtn').onclick = () => nudge(-1);
  document.querySelectorAll('[data-accidental]').forEach(b => { b.onclick = () => accidental(Number(b.dataset.accidental)); });
  byId('confirmBtn').onclick = () => {
    if (waiting) next();
    else if (placed && !locked) submit(placed);
  };
  // 电脑上：方向键微调，回车确认
  document.addEventListener('keydown', event => {
    if (kind !== 'build' || locked || byId('questionCard').classList.contains('hidden')) return;
    if (event.key === 'ArrowUp') { event.preventDefault(); nudge(1); }
    if (event.key === 'ArrowDown') { event.preventDefault(); nudge(-1); }
    if (event.key === 'Enter' && placed) { event.preventDefault(); submit(placed); }
  });
  document.addEventListener('keydown', event => {
    // 同一次回车刚提交了答案（defaultPrevented）时不跳题
    if (event.key === 'Enter' && waiting && !event.defaultPrevented && !byId('questionCard').classList.contains('hidden')) { event.preventDefault(); next(); }
  });

  function submit(given) {
    const seconds = Math.round((performance.now() - started) / 100) / 10;
    locked = true;
    byId('timer').textContent = seconds.toFixed(1) + '″';
    byId('pad').classList.add('locked');
    updateBuildPad();
    const q = questions[index];
    const correct = kind === 'identify' ? given === q.iv.name : same(given, q.target);
    const answer = kind === 'identify' ? given : noteName(given);
    records.push({q, given: answer, correct, seconds});
    const box = byId('feedback');
    show('feedback', true);
    box.classList.toggle('correct-bg', correct);
    box.classList.toggle('wrong-bg', !correct);
    byId('feedbackTitle').textContent = correct ? `✓ 正确 · ${seconds.toFixed(1)} 秒` : `✕ 正确答案：${kind === 'identify' ? q.iv.name : noteName(q.target)}`;
    if (correct) {
      byId('feedbackText').textContent = '';
      if (kind === 'build') drawStaff(byId('staff'), [{note: q.given, arrow: true}, {note: q.target, color: RIGHT}], q.sign);
      setTimeout(() => { if (records.length === index + 1 && !byId('questionCard').classList.contains('hidden')) next(); }, NEXT_DELAY);
    } else {
      demo(q);
      waiting = true;
      if (kind === 'build') updateBuildPad(); else show('nextBtn', true);
    }
    progress();
    status();
  }
  // 演示转位：识别题和向上的构建题，把低音移高一个八度；向下的构建题，把出发音移低一个八度
  function demo(q) {
    if (kind === 'identify') {
      const octave = {...q.low, octave: q.low.octave + 1};
      drawStaff(byId('staff'), [{note: q.low}, {note: q.high}, {note: octave, color: REFERENCE}]);
      byId('feedbackText').textContent = `把低音 ${noteName(q.low)} 移高一个八度（浅红色）：${noteName(q.high)}–${noteName(q.low)} 是${q.iv.inverted}，转回来就是${q.iv.name}。`;
      return;
    }
    const octave = {...q.given, octave: q.given.octave + q.sign};
    drawStaff(byId('staff'), [{note: q.given, arrow: true}, {note: q.target, color: RIGHT}, {note: octave, color: REFERENCE}], q.sign);
    const way = q.sign > 0 ? ['向上', '高', '往下'] : ['向下', '低', '往上'];
    byId('feedbackText').textContent = `${way[0]}的${q.iv.name}转位后是${q.iv.inverted}：把 ${noteName(q.given)} 移${way[1]}一个八度（浅红色），${way[2]}找${q.iv.inverted}，就是 ${noteName(q.target)}。` +
      `（你的答案：${records[records.length - 1].given}）`;
  }
  // 题目不限数量：每次需要下一题时再出
  function next() {
    questions.push(makeQuestion(kind, questions[index]));
    index++;
    showQuestion();
  }

  /* 结果 */
  const average = list => list.length ? list.reduce((sum, r) => sum + r.seconds, 0) / list.length : 0;
  const seconds1 = value => value.toFixed(1);
  const describe = q => kind === 'identify'
    ? `${noteName(q.low)}–${noteName(q.high)}  ${q.iv.name}`
    : `${noteName(q.given)} ${DIRECTION[q.sign > 0 ? 'up' : 'down']}${q.iv.name} → ${noteName(q.target)}`;
  // 报告只统计最近 10 题；number 是这道题在本次练习里的题号
  function summary() {
    const last = recent().map((r, i) => ({...r, number: records.length - recent().length + i + 1}));
    const byDegree = [[6, '六度'], [7, '七度']].flatMap(([d, name]) => {
      const list = last.filter(r => r.q.iv.degree === d);
      return list.length ? [`${name} ${seconds1(average(list))}`] : [];
    }).join(' · ');
    return {last, correct: last.filter(r => r.correct).length, average: average(last), byDegree};
  }

  function showResults() {
    locked = true;
    show('questionCard', false); show('resultScreen', true);
    progress();
    const s = summary(), other = kind === 'identify' ? 'build' : 'identify';
    byId('resultTitle').textContent = `✓ ${label()} · 合格`;
    byId('resAverage').textContent = `${seconds1(s.average)} 秒`;
    byId('resCorrect').textContent = `${s.correct}/${s.last.length}`;
    byId('resDegrees').textContent = `合格标准：平均 ≤ ${STANDARD[kind]} 秒 · 本次共练 ${records.length} 题\n平均用时（秒）：${s.byDegree}`;
    byId('otherBtn').textContent = `开始${KINDS[other]}练习`;
    byId('otherBtn').onclick = () => start(other);
    const list = byId('detailList');
    list.replaceChildren();
    s.last.forEach(r => {
      const item = document.createElement('div');
      item.className = 'detail-item';
      const top = document.createElement('div');
      top.className = 'detail-item-top';
      const label = document.createElement('span');
      label.textContent = `第 ${r.number} 题`;
      const time = document.createElement('span');
      time.textContent = `${seconds1(r.seconds)} 秒`;
      top.append(label, time);
      const line = document.createElement('div');
      line.className = r.correct ? 'detail-item-first-pass' : 'detail-item-wrong-choices';
      line.textContent = r.correct ? `✓ ${describe(r.q)}` : `✕ ${describe(r.q)} · 答：${r.given}`;
      item.append(top, line);
      list.append(item);
    });
  }
  function report() {
    const s = summary(), number = r => String(r.number).padStart(2, '0');
    const sections = ['【MT05 · 辅助练习 · 六七度速认】', `题型：${label()} · 合格标准：平均 ≤ ${STANDARD[kind]}秒，最近 10 题至少对 ${PASS_CORRECT} 题\n✓ 合格`];
    sections.push(`最近 10 题：正确 ${s.correct}/${s.last.length} · 平均 ${seconds1(s.average)}秒\n（${s.byDegree}）\n本次共练：${records.length} 题`);
    const wrong = s.last.flatMap(r => r.correct ? [] : [`${number(r)}  ${describe(r.q)}  ✗ ${r.given}`]);
    sections.push(wrong.length ? `做错的题：\n${wrong.join('\n')}` : '✓ 最近 10 题全部正确');
    const slowest = [...s.last].sort((a, b) => b.seconds - a.seconds).slice(0, 3);
    sections.push(`最慢的 3 题：\n${slowest.map(r => `${number(r)}  ${describe(r.q)}  ${seconds1(r.seconds)}秒`).join('\n')}`);
    sections.push('© Sheen · Music Theory');
    return sections.join('\n\n');
  }
  // 和课后练习一样：能用剪贴板就用，否则退回到 execCommand
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise((resolve, reject) => {
      const area = document.createElement('textarea');
      area.value = text; area.readOnly = true; area.style.position = 'fixed'; area.style.opacity = '0';
      document.body.append(area); area.select();
      try { document.execCommand('copy') ? resolve() : reject(new Error('copy failed')); } catch (e) { reject(e); } finally { area.remove(); }
    });
  }

  byId('startBtn').onclick = () => start();
  byId('finishBtn').onclick = () => { if (standing().passed) showResults(); };
  byId('nextBtn').onclick = next;
  byId('copyBtn').onclick = () => copy(report())
    .then(() => alert('练习结果已复制到剪贴板，可以发给老师了。'))
    .catch(() => alert('复制失败，请手动截图发送。'));
  // 回到辅助练习首页：结果页的「回到练习首页」，以及答题中途的「退出」
  function backToStart() {
    questions = []; records = []; index = 0; locked = true;
    show('questionCard', false); show('resultScreen', false); show('startScreen', true);
    progress();
  }
  byId('restartBtn').onclick = backToStart;
  byId('quitBtn').onclick = () => {
    if (confirm('确定退出这一轮练习吗？\n\n退出后回到辅助练习首页，本轮成绩不会保留。')) backToStart();
  };
  byId('homeBtn').onclick = () => {
    const busy = questions.length && byId('resultScreen').classList.contains('hidden');
    if (busy && !confirm('确定返回课程首页吗？\n\n当前练习尚未完成，返回后本次成绩不会保留。')) return;
    window.location.href = '../index.html';
  };
  // 快速连点时：不放大页面（双击缩放、双指缩放）；文字选择在 CSS 里关掉
  document.addEventListener('dblclick', event => event.preventDefault());
  document.addEventListener('gesturestart', event => event.preventDefault());
  // 转屏或改变宽度时重画当前谱例（答题中才重画，答完显示的演示保持不变）
  let lastWidth = 0;
  new ResizeObserver(() => {
    const element = byId('staff');
    if (element.clientWidth && element.clientWidth !== lastWidth && questions.length && !locked) {
      lastWidth = element.clientWidth;
      drawQuestion();
    }
  }).observe(byId('staff'));
})();
