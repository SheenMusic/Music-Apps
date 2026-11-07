/* 第六课长期练习：音程熟练度（识别、构建）。
   一度到十五度；纯、大、小音程出现得多一些，增、减少一些（权重 2 : 1）；没有减一度。
   所有音在 C2–C6 之间。出发音最多一个升降号（不出 E♯、B♯、F♭、C♭）；
   另一个音平时最多一个升降号，大约每 8 题有 1 题是重升或重降，两道重升降题之间至少隔 3 题。
   谱表是上下相连的大谱表：高音谱表和低音谱表之间只隔一条不画出来的中央 C 线，
   只有出现中央 C 时才在符头下衬一根短加线。
   每组 30 次作答：答错只提示不对，可以继续尝试，但每作答一次都用掉一次；30 次用完这一组就结束。
   每道题从出现开始计时，到答对为止（中间答错的时间也算），答题时不显示秒表。
   正确率 = 答对次数 ÷ 30；平均用时只算答对的题。不设通过标准。
   每组的成绩记在本机浏览器里，开始页显示最近一组、最好成绩和最近 7 天的平均用时走势。 */
(function () {
  'use strict';
  const ROUND = 30;            // 每组作答次数
  const NEXT_DELAY = 700;      // 答对后停留多久自动进入下一题（不计入用时）
  const DOUBLE_GAP = 3;        // 两道重升降题之间至少隔几道普通题
  const DOUBLE_CHANCE = .2;    // 隔够以后，每题出重升降的机会（平均约每 8 题 1 题）
  const INPUT = '#6366f1';     // 学生放的目标音
  const RIGHT = '#059669';     // 正确答案
  const STORAGE_KEY = 'mt-intervals:training';
  const TREND_DAYS = 7;        // 走势图只画最近 7 天
  const KEEP = 300;            // 本机最多保留多少组成绩

  /* 音：letter 0–6（C–B），accidental -2…2，octave；step 是谱上的位置（线、间） */
  const LETTERS = 'CDEFGAB', NATURAL = [0, 2, 4, 5, 7, 9, 11];
  const SIGN = {'-2': '𝄫', '-1': '♭', 0: '', 1: '♯', 2: '𝄪'};
  const VEX_SIGN = {'-2': 'bb', '-1': 'b', 0: '', 1: '#', 2: '##'};
  const midi = n => 12 * (n.octave + 1) + NATURAL[n.letter] + n.accidental;
  const step = n => n.octave * 7 + n.letter;
  const fromStep = s => ({letter: s % 7, octave: Math.floor(s / 7), accidental: 0});
  const noteName = n => LETTERS[n.letter] + SIGN[n.accidental];
  const fullName = n => noteName(n) + n.octave;
  const same = (a, b) => step(a) === step(b) && a.accidental === b.accidental;
  const vexKey = n => LETTERS[n.letter].toLowerCase() + VEX_SIGN[n.accidental] + '/' + n.octave;
  // 音域 C2–C6：谱上的位置和实际音高都不能超出（例如不出 B♯1、C♯6）
  const LOW_STEP = 14, HIGH_STEP = 42, LOW_MIDI = 36, HIGH_MIDI = 84;
  const inRange = n => step(n) >= LOW_STEP && step(n) <= HIGH_STEP && midi(n) >= LOW_MIDI && midi(n) <= HIGH_MIDI;
  // 出发音：最多一个升降号，E♯、B♯、F♭、C♭ 不做出发音
  const plain = n => Math.abs(n.accidental) <= 1 && !((n.letter === 2 || n.letter === 6) && n.accidental === 1) && !((n.letter === 3 || n.letter === 0) && n.accidental === -1);
  // 另一个音：平时最多一个升降号；重升降题必须是重升或重降，但不出 E𝄪、B𝄪、F𝄫、C𝄫
  const single = n => Math.abs(n.accidental) <= 1;
  const double = n => Math.abs(n.accidental) === 2 && !((n.letter === 2 || n.letter === 6) && n.accidental === 2) && !((n.letter === 3 || n.letter === 0) && n.accidental === -2);

  /* 音程：一度到十五度，每个度数可以用的性质；纯、大、小权重 2，增、减权重 1 */
  const DEGREES = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五'];
  const QUALITY = {d: '减', m: '小', P: '纯', M: '大', A: '增'};
  const QUALITY_ORDER = ['d', 'm', 'P', 'M', 'A'];
  const OFFSET = {perfect: {d: -1, P: 0, A: 1}, major: {d: -2, m: -1, M: 0, A: 1}};
  const intervalName = (quality, degree) => `${QUALITY[quality]}${DEGREES[degree - 1]}度`;
  const INTERVALS = [];
  for (let degree = 1; degree <= 15; degree++) {
    const simple = (degree - 1) % 7, perfect = [0, 3, 4].includes(simple);
    const base = NATURAL[simple] + 12 * Math.floor((degree - 1) / 7);
    const offsets = perfect ? OFFSET.perfect : OFFSET.major;
    Object.keys(offsets).forEach(quality => {
      if (degree === 1 && quality === 'd') return;
      INTERVALS.push({code: quality + degree, quality, degree, semis: base + offsets[quality], name: intervalName(quality, degree), weight: /[PMm]/.test(quality) ? 2 : 1});
    });
  }
  const random = list => list[Math.floor(Math.random() * list.length)];
  // 先随机选度数（1–15 机会相同），再按权重选性质
  function pickInterval() {
    const degree = 1 + Math.floor(Math.random() * 15);
    const pool = INTERVALS.filter(iv => iv.degree === degree).flatMap(iv => Array(iv.weight).fill(iv));
    return random(pool);
  }
  // 从 note 出发，向上（sign 1）或向下（sign -1）的音程
  function move(note, iv, sign) {
    const target = fromStep(step(note) + sign * (iv.degree - 1));
    target.accidental = midi(note) + sign * iv.semis - midi(target);
    return target;
  }
  const NOTES = [];
  for (let s = LOW_STEP; s <= HIGH_STEP; s++) for (const accidental of [-1, 0, 1]) {
    const n = {...fromStep(s), accidental};
    if (plain(n) && inRange(n)) NOTES.push(n);
  }
  // 一题：音程、方向随机；识别题的方向决定出发音在上还是在下，所以重升降可能出现在高音，也可能在低音
  // 相邻两题不用同一个出发音，也不出同一个音程
  function makeQuestion(previous, wantDouble) {
    for (;;) {
      const iv = pickInterval(), sign = Math.random() < .5 ? -1 : 1;
      if (previous && iv.code === previous.iv.code) continue;
      const choices = NOTES.filter(n => {
        const target = move(n, iv, sign);
        return inRange(target) && (wantDouble ? double(target) : single(target)) && (!previous || noteName(n) !== noteName(previous.given));
      });
      if (!choices.length) continue;
      const given = random(choices), target = move(given, iv, sign);
      return {iv, sign, given, target, low: sign > 0 ? given : target, high: sign > 0 ? target : given, double: wantDouble};
    }
  }

  /* 大谱表：高音谱表 E4–F5，低音谱表 G2–A3，中间一条不画出来的 C4 线。
     两个谱表连成一个坐标，所以所有音都放在高音谱表的同一个和弦里排版（VexFlow 自动处理
     二度错开和变音记号避让），VexFlow 自己的加线不画，按大谱表另画短加线：
     C4（中间那条线）、E2 和 C2（低音谱表下方）、A5 和 C6（高音谱表上方）。 */
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const TOP_STEP = 38;  // 高音谱表第一线 F5
  const ledgers = s => [s === 28 && 28, s <= 16 && 16, s <= 14 && 14, s >= 40 && 40, s >= 42 && 42].filter(Boolean);
  let geometry = null;  // 最近一次画的谱表：点谱表时换算成音高
  function line(svg, d, color, width) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d); path.setAttribute('stroke', color); path.setAttribute('stroke-width', String(width)); path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round'); path.setAttribute('stroke-linejoin', 'round');
    svg.append(path);
  }
  function drawStaff(element, tones, arrow = 0) {
    element.replaceChildren();
    geometry = null;
    const VF = NotationRenderer.VF(), c = NotationConfig;
    if (!VF) { element.textContent = '五线谱组件未载入，请检查网络连接后刷新页面。'; return; }
    const sorted = [...tones].sort((a, b) => step(a.note) - step(b.note) || a.note.accidental - b.note.accidental);
    const width = Math.min(260, element.clientWidth || 260), left = 24;
    const renderer = NotationRenderer.createRenderer(element, {scale: 1});
    renderer.resize(width, 300);
    const context = renderer.getContext();
    const treble = NotationRenderer.createStave(left, 0, width - left - c.padding, {initial: true});
    const space = treble.getSpacingBetweenLines(), above = treble.getYForLine(0) - treble.getY();
    // 低音谱表第五线（A3）比高音谱表第一线（E4）低两个线距，中间正好空出 C4 那条线
    const bass = NotationRenderer.createStave(left, treble.getYForLine(4) + 2 * space - above, width - left - c.padding, {initial: true});
    [treble, bass].forEach(stave => stave.setEndBarType(VF.Barline.type.NONE));
    treble.addClef('treble').setContext(context).draw();
    bass.addClef('bass').setContext(context).draw();
    new VF.StaveConnector(treble, bass).setType('brace').setContext(context).draw();
    new VF.StaveConnector(treble, bass).setType('singleLeft').setContext(context).draw();
    const note = new VF.StaveNote({clef: 'treble', keys: sorted.map(t => vexKey(t.note)), duration: 'w'});
    // N18：字母相同、变音不同的两个音（一度、八度、十五度）都写出变音记号，本位音写还原号
    const shown = t => t.note.accidental || sorted.some(o => o.note.letter === t.note.letter && o.note.accidental !== t.note.accidental);
    // 同度两个符头左右错开，低音在左；VexFlow 却把右边符头的记号放在外侧一列，
    // 所以同度的两个记号互换挂上去，外侧（最左）一列就是低音的记号
    const owner = sorted.map((t, i) => {
      if (i > 0 && step(sorted[i - 1].note) === step(t.note)) return i - 1;
      if (i < sorted.length - 1 && step(sorted[i + 1].note) === step(t.note)) return i + 1;
      return i;
    });
    sorted.forEach((t, i) => {
      const color = t.color || '#000000';
      note.setKeyStyle(i, {fillStyle: color, strokeStyle: color});
      const source = sorted[owner[i]], sourceColor = source.color || '#000000';
      if (shown(source)) {
        const accidental = new VF.Accidental(VEX_SIGN[source.note.accidental] || 'n');
        accidental.setStyle({fillStyle: sourceColor, strokeStyle: sourceColor});
        note.addModifier(accidental, i);
      }
    });
    note.setLedgerLineStyle({strokeStyle: 'transparent', fillStyle: 'transparent'});
    NotationRenderer.formatAndDraw(context, treble, [note]);
    const svg = element.querySelector('svg');
    const topLine = treble.getYForLine(0), half = space / 2, yOf = s => topLine + (TOP_STEP - s) * half;
    // 大谱表自己的短加线：按每个符头的实际位置画，二度、同度错开时同一条加线连起来
    const spans = {};
    note.noteHeads.forEach((head, i) => {
      const x = head.getAbsoluteX(), w = head.getWidth();
      ledgers(step(sorted[i].note)).forEach(s => {
        const span = spans[s] || [x, x + w];
        spans[s] = [Math.min(span[0], x), Math.max(span[1], x + w)];
      });
    });
    Object.entries(spans).forEach(([s, [from, to]]) => line(svg, `M${from - 5} ${yOf(s)} L${to + 5} ${yOf(s)}`, c.staffLineColor, c.ledgerLineWidth));
    if (arrow) {
      const right = Math.max(...note.noteHeads.map(head => head.getAbsoluteX() + head.getWidth()));
      const from = sorted.findIndex(t => t.arrow), y = note.getYs()[from], x = right + 14;
      const end = y - arrow * 26;
      line(svg, `M${x} ${y} L${x} ${end} M${x - 5} ${end + arrow * 7} L${x} ${end} L${x + 5} ${end + arrow * 7}`, INPUT, 2);
    }
    // 高度固定为 C6、C2 上下再留两个线距，换题时谱表不跳动
    const box = svg.getBBox();
    const top = Math.min(box.y - 4, yOf(HIGH_STEP) - 2 * space), bottom = Math.max(box.y + box.height + 4, yOf(LOW_STEP) + 2 * space);
    svg.setAttribute('viewBox', `0 ${top} ${width} ${bottom - top}`);
    svg.setAttribute('height', String(bottom - top));
    svg.style.height = `${bottom - top}px`;  // 覆盖 resize 时写进去的临时高度
    geometry = {svg, topLine, half};
  }

  /* 本机成绩记录：每组一条 {at, mode, correct, total, average} */
  function loadHistory() {
    try {
      const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(list) ? list.filter(e => e && e.at && e.mode && Number.isFinite(e.correct)) : [];
    } catch (e) { return []; }
  }
  function saveHistory(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-KEEP))); } catch (e) { /* 无痕模式等存不了时，只是不保留成绩 */ }
  }

  /* 页面状态 */
  const byId = id => document.getElementById(id);
  const show = (id, visible) => byId(id).classList.toggle('hidden', !visible);
  const KINDS = {identify: '识别音程', build: '构建音程'};
  const DIRECTION = {up: '向上', down: '向下'};
  let mode = 'identify', questions = [], records = [], index = 0, attempts = 0, started = 0, sinceDouble = 0;
  let placed = null, locked = true;      // 构建题：学生放在谱上的目标音
  let pick = {quality: null, degree: null};  // 识别题：已选的性质和度数

  document.querySelector('[data-group="mode"]').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    mode = button.dataset.value;
    choose();
  });
  function choose() {
    document.querySelectorAll('[data-group="mode"] button').forEach(b => b.classList.toggle('selected', b.dataset.value === mode));
    renderHistory();
  }

  function start(chosen = mode) {
    mode = chosen;
    questions = []; records = []; attempts = 0; sinceDouble = 0;
    show('startScreen', false); show('resultScreen', false);
    nextQuestion();
  }
  function nextQuestion() {
    const wantDouble = sinceDouble >= DOUBLE_GAP && Math.random() < DOUBLE_CHANCE;
    const q = makeQuestion(questions[questions.length - 1], wantDouble);
    sinceDouble = q.double ? 0 : sinceDouble + 1;
    questions.push(q);
    records.push({q, wrong: [], seconds: null});
    index = questions.length - 1;
    showQuestion();
  }
  function progress() {
    byId('progressBar').style.width = `${attempts / ROUND * 100}%`;
    byId('questionCounter').classList.toggle('hidden', !questions.length || !byId('resultScreen').classList.contains('hidden'));
    byId('questionCounter').textContent = `第 ${index + 1} 题`;
    byId('countText').textContent = `作答 ${attempts}/${ROUND}`;
  }

  function showQuestion() {
    const q = questions[index];
    show('questionCard', true); show('feedback', false);
    byId('kindBadge').textContent = KINDS[mode];
    byId('questionCard').classList.toggle('building', mode === 'build');
    placed = null;
    locked = false;
    if (mode === 'identify') {
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
    // 计时只在后台进行：答对后才显示这题的用时
    started = performance.now();
  }
  // 作答中的谱面（转屏时也用它重画）
  function drawQuestion() {
    const q = questions[index];
    if (mode === 'identify') { drawStaff(byId('staff'), [{note: q.low}, {note: q.high}]); return; }
    const tones = [{note: q.given, arrow: true}];
    if (placed) tones.push({note: placed, color: INPUT});
    drawStaff(byId('staff'), tones, q.sign);
  }

  /* 识别题：上排 d m P M A 五个性质键，下面三排 1–15 度数键；两样都选好就提交，先选哪个都可以 */
  function identifyPad() {
    const element = byId('pad');
    element.replaceChildren();
    pick = {quality: null, degree: null};
    const row = (columns, className) => {
      const div = document.createElement('div');
      div.className = 'drill-pad-row ' + className;
      div.style.setProperty('--columns', columns);
      element.append(div);
      return div;
    };
    const qualities = row(5, 'qualities');
    QUALITY_ORDER.forEach(quality => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'option-btn';
      button.dataset.quality = quality;
      button.setAttribute('aria-label', QUALITY[quality]);
      button.innerHTML = `<b>${quality}</b><small>${QUALITY[quality]}</small>`;
      qualities.append(button);
    });
    for (let r = 0; r < 3; r++) {
      const degrees = row(5, 'degrees');
      for (let degree = r * 5 + 1; degree <= r * 5 + 5; degree++) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'option-btn';
        button.dataset.degree = degree;
        button.setAttribute('aria-label', `${DEGREES[degree - 1]}度`);
        button.textContent = degree;
        degrees.append(button);
      }
    }
    markPick();
  }
  function markPick() {
    byId('pad').querySelectorAll('[data-quality]').forEach(b => b.classList.toggle('selected', b.dataset.quality === pick.quality));
    byId('pad').querySelectorAll('[data-degree]').forEach(b => b.classList.toggle('selected', Number(b.dataset.degree) === pick.degree));
  }
  byId('pad').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || locked || mode !== 'identify') return;
    if (button.dataset.quality) pick.quality = button.dataset.quality;
    else pick.degree = Number(button.dataset.degree);
    markPick();
    if (pick.quality && pick.degree) submit({...pick});
  });

  /* 构建题：点谱表放音，↑↓ 微调一格（换位置后回到还原），♭♯ 加减变音记号，确认提交 */
  function updateBuildPad() {
    document.querySelectorAll('[data-accidental]').forEach(b => b.classList.toggle('selected', placed?.accidental === Number(b.dataset.accidental)));
    byId('confirmBtn').disabled = !placed || locked;
  }
  function place(note) {
    if (locked || mode !== 'build') return;
    placed = {...fromStep(Math.max(LOW_STEP, Math.min(HIGH_STEP, step(note)))), accidental: note.accidental};
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
    if (locked || mode !== 'build' || !geometry) return;
    event.preventDefault();
    const point = geometry.svg.createSVGPoint();
    point.x = event.clientX; point.y = event.clientY;
    const y = point.matrixTransform(geometry.svg.getScreenCTM().inverse()).y;
    // 高音谱表第一线是 F5；往下每半个线距低一个音级（低音谱表接着往下数）
    place(fromStep(TOP_STEP + Math.round((geometry.topLine - y) / geometry.half)));
  });
  byId('upBtn').onclick = () => nudge(1);
  byId('downBtn').onclick = () => nudge(-1);
  document.querySelectorAll('[data-accidental]').forEach(b => { b.onclick = () => accidental(Number(b.dataset.accidental)); });
  byId('confirmBtn').onclick = () => { if (placed && !locked) submit(placed); };
  // 电脑上：方向键微调，回车确认
  document.addEventListener('keydown', event => {
    if (mode !== 'build' || locked || byId('questionCard').classList.contains('hidden')) return;
    if (event.key === 'ArrowUp') { event.preventDefault(); nudge(1); }
    if (event.key === 'ArrowDown') { event.preventDefault(); nudge(-1); }
    if (event.key === 'Enter' && placed) { event.preventDefault(); submit(placed); }
  });

  // 每作答一次用掉一次；答对进入下一题，答错留在这题继续试；30 次用完就结束
  function submit(given) {
    attempts++;
    const r = records[index], q = r.q;
    const correct = mode === 'identify' ? given.quality === q.iv.quality && given.degree === q.iv.degree : same(given, q.target);
    const answer = mode === 'identify' ? intervalName(given.quality, given.degree) : fullName(given);
    const box = byId('feedback');
    show('feedback', true);
    box.classList.toggle('correct-bg', correct);
    box.classList.toggle('wrong-bg', !correct);
    if (correct) {
      r.seconds = Math.round((performance.now() - started) / 100) / 10;
      locked = true;
      byId('feedbackTitle').textContent = `✓ 正确 · ${q.iv.name} · ${r.seconds.toFixed(1)} 秒`;
      if (mode === 'build') drawStaff(byId('staff'), [{note: q.given, arrow: true}, {note: q.target, color: RIGHT}], q.sign);
      updateBuildPad();
      setTimeout(() => { if (byId('questionCard').classList.contains('hidden')) return; attempts >= ROUND ? finish() : nextQuestion(); }, NEXT_DELAY);
    } else {
      r.wrong.push(answer);
      byId('feedbackTitle').textContent = `✕ 不对（${answer}），再试一次`;
      if (mode === 'identify') { pick = {quality: null, degree: null}; markPick(); }
      if (attempts >= ROUND) {
        locked = true;
        updateBuildPad();
        setTimeout(() => { if (!byId('questionCard').classList.contains('hidden')) finish(); }, NEXT_DELAY);
      }
    }
    progress();
  }

  /* 结果 */
  const seconds1 = value => value.toFixed(1);
  const percent = correct => `${Math.round(correct / ROUND * 100)}%`;
  const describe = q => mode === 'identify'
    ? `${fullName(q.low)}–${fullName(q.high)}  ${q.iv.name}`
    : `${fullName(q.given)} ${DIRECTION[q.sign > 0 ? 'up' : 'down']}${q.iv.name} → ${fullName(q.target)}`;
  function summary() {
    const solved = records.filter(r => r.seconds !== null);
    const average = solved.length ? Math.round(solved.reduce((sum, r) => sum + r.seconds, 0) / solved.length * 10) / 10 : null;
    return {solved, correct: solved.length, average};
  }
  let result = null;  // 本组成绩与对比，复制成绩时用
  function finish() {
    locked = true;
    const s = summary(), all = loadHistory(), before = all.filter(e => e.mode === mode);
    const previous = before[before.length - 1] || null;
    const timed = before.filter(e => e.average !== null);
    const bestAverage = timed.length ? Math.min(...timed.map(e => e.average)) : null;
    const bestCorrect = before.length ? Math.max(...before.map(e => e.correct)) : null;
    const entry = {at: Date.now(), mode, correct: s.correct, total: ROUND, average: s.average};
    saveHistory([...all, entry]);
    result = {...s, entry, previous, bestAverage, bestCorrect};
    show('questionCard', false); show('resultScreen', true);
    progress();
    byId('resultTitle').textContent = `${KINDS[mode]} · 本组完成`;
    byId('resAccuracy').textContent = percent(s.correct);
    byId('resAccuracyLabel').textContent = `正确率（答对 ${s.correct}/${ROUND} 次）`;
    byId('resAverage').textContent = s.average === null ? '—' : `${seconds1(s.average)} 秒`;
    byId('resCompare').textContent = compare(result).join('\n');
    const list = byId('detailList');
    list.replaceChildren();
    records.forEach((r, i) => {
      const item = document.createElement('div');
      item.className = 'detail-item';
      const top = document.createElement('div');
      top.className = 'detail-item-top';
      const label = document.createElement('span');
      label.textContent = `第 ${i + 1} 题`;
      const time = document.createElement('span');
      time.textContent = r.seconds === null ? '没有答对' : `${seconds1(r.seconds)} 秒`;
      top.append(label, time);
      const line = document.createElement('div');
      const clean = r.seconds !== null && !r.wrong.length;
      line.className = clean ? 'detail-item-first-pass' : 'detail-item-wrong-choices';
      line.textContent = (clean ? '✓ ' : '✕ ') + describe(r.q) + (r.wrong.length ? ` · 答错：${r.wrong.join('、')}` : '');
      item.append(top, line);
      list.append(item);
    });
  }
  // 和自己比：上一组、以前最快的平均用时、以前最高的正确率
  function compare(r) {
    const lines = [];
    if (!r.previous) return ['这是这个题型的第一组成绩，之后每组都会和它比较。'];
    if (r.average !== null && r.previous.average !== null) {
      const diff = Math.round((r.previous.average - r.average) * 10) / 10;
      lines.push(diff > 0 ? `比上一组快 ${seconds1(diff)} 秒` : diff < 0 ? `比上一组慢 ${seconds1(-diff)} 秒` : '和上一组一样快');
    }
    if (r.average !== null && (r.bestAverage === null || r.average < r.bestAverage)) lines.push('🎉 新纪录：平均用时最快');
    if (r.bestCorrect !== null && r.correct > r.bestCorrect) lines.push('🎉 新纪录：正确率最高');
    lines.push(`上一组：正确率 ${percent(r.previous.correct)} · 平均 ${r.previous.average === null ? '—' : seconds1(r.previous.average) + ' 秒'}`);
    return lines;
  }
  const pad2 = n => String(n).padStart(2, '0');
  const dateText = at => { const d = new Date(at); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
  function report() {
    const r = result, number = i => pad2(i + 1);
    const sections = [`【MT06 · 长期练习 · ${KINDS[mode]}】\n${dateText(r.entry.at)}`];
    const best = r.bestAverage === null ? '' : ` · 以前最快 ${seconds1(r.bestAverage)} 秒`;
    const before = r.previous ? `\n（上一组 ${r.previous.average === null ? '—' : seconds1(r.previous.average) + ' 秒'}${best}）` : '';
    sections.push(`作答 ${ROUND} 次 · 答对 ${r.correct} 次 · 正确率 ${percent(r.correct)}\n答对题平均用时：${r.average === null ? '—' : seconds1(r.average) + ' 秒'}${before}`);
    const wrong = records.flatMap((x, i) => x.wrong.length ? [`${number(i)}  ${describe(x.q)}  ✗ ${x.wrong.join('、')}`] : []);
    sections.push(wrong.length ? `答错过的题：\n${wrong.join('\n')}` : '✓ 全部一次答对');
    const slowest = records.map((x, i) => ({...x, i})).filter(x => x.seconds !== null).sort((a, b) => b.seconds - a.seconds).slice(0, 3);
    if (slowest.length) sections.push(`最慢的 3 题：\n${slowest.map(x => `${number(x.i)}  ${describe(x.q)}  ${seconds1(x.seconds)}秒`).join('\n')}`);
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

  /* 开始页：所选题型的最近一组、最快平均、最高正确率，以及最近 7 天每组平均用时的走势 */
  function renderHistory() {
    const box = byId('history'), list = loadHistory().filter(e => e.mode === mode);
    box.replaceChildren();
    if (!list.length) {
      const empty = document.createElement('p');
      empty.className = 'history-empty';
      empty.textContent = `还没有${KINDS[mode]}的成绩。做完一组后，这里会显示你的成绩和变化。`;
      box.append(empty);
      return;
    }
    const last = list[list.length - 1], timed = list.filter(e => e.average !== null);
    const stats = [
      ['最近一组', `${percent(last.correct)} · ${last.average === null ? '—' : seconds1(last.average) + '秒'}`],
      ['最快平均', timed.length ? `${seconds1(Math.min(...timed.map(e => e.average)))} 秒` : '—'],
      ['最高正确率', percent(Math.max(...list.map(e => e.correct)))]
    ];
    const grid = document.createElement('div');
    grid.className = 'history-stats';
    stats.forEach(([label, value]) => {
      const cell = document.createElement('div');
      cell.innerHTML = `<span class="history-value"></span><span class="history-label"></span>`;
      cell.firstChild.textContent = value;
      cell.lastChild.textContent = label;
      grid.append(cell);
    });
    box.append(grid);
    const recent = timed.filter(e => e.at >= Date.now() - TREND_DAYS * 864e5);
    if (recent.length >= 2) box.append(trend(recent));
  }
  // 走势图：每组一个点（平均用时）。用时越短点越高，线往上走就是越来越快
  function trend(list) {
    const figure = document.createElement('figure');
    figure.className = 'history-trend';
    const W = 300, H = 72, PAD = 8;
    const values = list.map(e => e.average), min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
    const x = i => PAD + (W - PAD * 2) * (list.length === 1 ? .5 : i / (list.length - 1));
    const y = v => PAD + (H - PAD * 2) * (v - min) / span;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `最近 ${TREND_DAYS} 天每组平均用时：${values.map(seconds1).join('、')} 秒`);
    const path = document.createElementNS(SVG_NS, 'polyline');
    path.setAttribute('points', list.map((e, i) => `${x(i)},${y(e.average)}`).join(' '));
    path.setAttribute('class', 'trend-line');
    svg.append(path);
    list.forEach((e, i) => {
      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', x(i)); dot.setAttribute('cy', y(e.average)); dot.setAttribute('r', 4);
      dot.setAttribute('class', 'trend-dot');
      const title = document.createElementNS(SVG_NS, 'title');
      title.textContent = `${dateText(e.at)} · ${seconds1(e.average)} 秒 · 正确率 ${percent(e.correct)}`;
      dot.append(title);
      svg.append(dot);
    });
    const caption = document.createElement('figcaption');
    caption.textContent = `最近 ${TREND_DAYS} 天 ${list.length} 组的平均用时：${seconds1(values[0])} → ${seconds1(values[values.length - 1])} 秒（越快点越高，线往上走就是进步）`;
    figure.append(svg, caption);
    return figure;
  }

  byId('startBtn').onclick = () => start();
  byId('againBtn').onclick = () => start(mode);
  byId('copyBtn').onclick = () => copy(report())
    .then(() => alert('成绩已复制，可以发给老师，或者粘贴到备忘录里保存。'))
    .catch(() => alert('复制失败，请手动截图保存。'));
  // 回到练习首页：结果页的「回到练习首页」，以及答题中途的「退出」
  function backToStart() {
    questions = []; records = []; index = 0; attempts = 0; locked = true;
    show('questionCard', false); show('resultScreen', false); show('startScreen', true);
    progress();
    choose();
  }
  byId('restartBtn').onclick = backToStart;
  byId('quitBtn').onclick = () => {
    if (confirm('确定退出这一组练习吗？\n\n退出后回到练习首页，这一组的成绩不会保留。')) backToStart();
  };
  byId('homeBtn').onclick = () => {
    const busy = questions.length && byId('resultScreen').classList.contains('hidden');
    if (busy && !confirm('确定返回第六课首页吗？\n\n这一组还没有做完，返回后成绩不会保留。')) return;
    window.location.href = '../index.html';
  };
  // 快速连点时：不放大页面（双击缩放、双指缩放）；文字选择在 CSS 里关掉
  document.addEventListener('dblclick', event => event.preventDefault());
  document.addEventListener('gesturestart', event => event.preventDefault());
  // 转屏或改变宽度时重画当前谱例（答题中才重画）
  let lastWidth = 0;
  new ResizeObserver(() => {
    const element = byId('staff');
    if (element.clientWidth && element.clientWidth !== lastWidth && questions.length && !locked) {
      lastWidth = element.clientWidth;
      drawQuestion();
    }
  }).observe(byId('staff'));
  choose();
  progress();
})();
