/* 和弦记号用法 · 入学自测
   流程：A 音程基础 10 题 → B 和弦记号 3 题（B1 答对才出现 B2）→ B 没有全对时，再做 5 道补充题（第 1–5 课各一题）。
   - 每题答完立即显示对错与讲解；每题都可以跳过（不得分）。
   - 从第 2 题起可以放弃测试：放弃后不计分，判定为未通过。
   - 结论：放弃 → 未完成；A 正确率低于 80% → 建议先学音程理论基础；
     A 通过且 B 全对 → 掌握扎实（链接到首页咨询）；其余 → 适合学习本课程，并列出薄弱单元。
   - 全部在浏览器里运行，不收集、不保存数据；结果页提醒学员复制成绩单或截图。
   依赖：NotationRenderer（谱例）、ChordStage.chordSymbol（记号排版）、ChordInput.parse（和弦记号判题）。 */
(() => {
  'use strict';
  const EN = ['en','ja'].includes(document.documentElement.dataset.siteLanguage); // Japanese falls back to English.
  const L = (zh, en) => (EN ? en : zh);
  const root = document.getElementById('entryTest');
  const esc = text => String(text).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

  /* ---------- 音名：读入与显示 ---------- */
  const SIGN = {'': '', '#': '#', '♯': '#', '##': 'x', x: 'x', '𝄪': 'x', b: 'b', '♭': 'b', bb: 'bb', '𝄫': 'bb'};
  const WORD = {sharp: '#', flat: 'b', doublesharp: 'x', doubleflat: 'bb', natural: ''};
  const ZH_WORD = {'升': '#', '降': 'b', '重升': 'x', '重降': 'bb'};
  const SHOW = {'': '', '#': '♯', b: '♭', x: '𝄪', bb: '𝄫'};
  const showNote = note => note[0] + SHOW[note.slice(1)];
  // 返回内部写法（C、F#、Bb、Fx、Ebb）或 null。
  // 中英文都接受：F#、F♯、Fsharp、F sharp；中文另外接受 升F、#F（英文写法没有把升降号放在前面的习惯，所以英文不接受 #F）。
  function readNote(raw) {
    const s = String(raw).trim().replace(/\s+/g, '').replace(/-/g, '');
    let m = s.match(/^([A-Ga-g])(##|#|♯|x|𝄪|bb|b|♭|𝄫)?$/u);
    if (m) return m[1].toUpperCase() + SIGN[m[2] || ''];
    m = s.match(/^([A-Ga-g])(doublesharp|doubleflat|sharp|flat|natural)$/i);
    if (m) return m[1].toUpperCase() + WORD[m[2].toLowerCase()];
    if (!EN) {
      m = s.match(/^(重升|重降|升|降)([A-Ga-g])$/u);
      if (m) return m[2].toUpperCase() + ZH_WORD[m[1]];
      m = s.match(/^(##|#|♯|𝄪|bb|♭|𝄫)([A-Ga-g])$/u);
      if (m) return m[2].toUpperCase() + SIGN[m[1]];
    }
    return null;
  }
  // 一串音名：空格、逗号、顿号都可以分隔；“F sharp”“升 F”这类中间的空格先合并
  function readNotes(raw) {
    const text = String(raw).replace(/[，、,;；]/g, ' ')
      .replace(/double[\s-]+/gi, 'double')
      .replace(/\s+(?=(doublesharp|doubleflat|sharp|flat|natural)\b)/gi, '')
      .replace(/(重升|重降|升|降)\s+/g, '$1').trim();
    if (!text) return [];
    return text.split(/\s+/).map(token => ({token, note: readNote(token)}));
  }

  /* ---------- 音程：性质 + 度数 ---------- */
  const QUALITIES = [
    ['dd', '倍减', 'doubly diminished'], ['d', '减', 'diminished'], ['m', '小', 'minor'], ['M', '大', 'major'],
    ['P', '纯', 'perfect'], ['A', '增', 'augmented'], ['AA', '倍增', 'doubly augmented']
  ];
  const ZH_NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五'];
  const ordinal = n => n + ((n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({1: 'st', 2: 'nd', 3: 'rd'}[n % 10] || 'th'));
  const degreeName = n => L(ZH_NUM[n] + '度', ordinal(n));
  const qualityName = q => { const item = QUALITIES.find(x => x[0] === q); return L(item[1], item[2]); };
  const intervalName = a => (EN ? `${qualityName(a.q)} ${degreeName(a.d)}` : `${qualityName(a.q)}${degreeName(a.d)}`);

  /* ---------- 题库 ---------- */
  const A = [
    {id: 'A1', type: 'interval', staff: ['E4', 'C5'],
      prompt: L('谱例中的音程是什么？', 'What is the interval shown?'),
      answer: {q: 'm', d: 6},
      explain: L('E 到 C 是六度，相差 8 个半音：小六度。', 'E up to C is a 6th spanning 8 semitones: a minor 6th.')},
    {id: 'A2', type: 'note',
      prompt: L('F 上方的增四度音是什么？', 'What note is an augmented 4th above F?'),
      answer: 'B',
      explain: L('F 上方的四度是 B（音名 F→B）。F–B 相差 6 个半音，正好是增四度。', 'A 4th above F has the letter name B. F to B spans 6 semitones, which is exactly an augmented 4th.')},
    {id: 'A3', type: 'single',
      prompt: L('下列哪个是变化音程？', 'Which of these is a chromatic interval?'),
      options: ['F–B', 'B–F', 'C–D♯', 'E–F'], answer: [2],
      note: L('变化音程的概念', 'the idea of chromatic intervals'),
      explain: L('F–B（增四度）和 B–F（减五度）都出现在自然音阶里，E–F 是小二度，它们都是自然音程；C–D♯ 是增二度，不出现在自然音阶里，所以是变化音程。如果答错了，建议自己查一下“变化音程”的意思。',
        'F–B (augmented 4th) and B–F (diminished 5th) both occur within the major scale, and E–F is a minor 2nd, so all three are diatonic intervals. C–D♯ is an augmented 2nd, which does not occur within the major scale, so it is a chromatic interval. If you got this wrong, it is worth looking up what “chromatic interval” means.')},
    {id: 'A4', type: 'multi',
      prompt: L('下列哪些音程与 C–E♭ 互为等音程？', 'Which of these intervals are enharmonically equivalent to C–E♭?'),
      hint: L('至少有两个正确答案，请选出全部。', 'At least two answers are correct. Select all that apply.'),
      options: ['C–D♯', 'B♯–E♭', 'B♯–D♯', 'D–F'], answer: [0, 1, 2],
      explain: L('等音程指音高相同、写法不同的音程，并不是“距离相等”的音程。C–D♯、B♯–E♭、B♯–D♯ 弹出来和 C–E♭ 完全是同样的两个音；D–F 虽然也是小三度，但音高不同，所以不是等音程。',
        'Enharmonically equivalent intervals sound exactly the same pitches but are spelled differently; it is not just about having the same size. C–D♯, B♯–E♭ and B♯–D♯ all sound the same two pitches as C–E♭. D–F is also a minor 3rd, but its pitches are different, so it is not enharmonically equivalent.')},
    {id: 'A5', type: 'note',
      prompt: L('从 A♭ 向上构成增六度，上方音是什么？', 'What note is an augmented 6th above A♭?'),
      answer: 'F#',
      explain: L('A♭ 上方的六度是 F。A♭–F 是大六度（9 个半音），增六度要再大半音：F♯。', 'A 6th above A♭ has the letter name F. A♭–F is a major 6th (9 semitones); an augmented 6th is a semitone larger: F♯.')},
    {id: 'A6', type: 'interval', staff: ['C4', 'E5'],
      prompt: L('谱例中的音程是什么？', 'What is the interval shown?'),
      answer: {q: 'M', d: 10},
      explain: L('C4 到 E5 超过了一个八度：大三度加一个八度，是大十度。', 'C4 to E5 is more than an octave: a major 3rd plus an octave makes a major 10th.')},
    {id: 'A7', type: 'interval',
      prompt: L('增十一度对应的单音程是什么？', 'What is the simple-interval equivalent of an augmented 11th?'),
      answer: {q: 'A', d: 4},
      explain: L('复音程减去一个八度（度数减 7），性质不变：增十一度 → 增四度。', 'Remove an octave (subtract 7 from the number) and keep the quality: augmented 11th → augmented 4th.')},
    {id: 'A8', type: 'interval',
      prompt: L('减七度转位后是什么音程？', 'What does a diminished 7th become when inverted?'),
      answer: {q: 'A', d: 2},
      explain: L('转位时，度数相加等于 9，大小互换、增减互换、纯不变：减七度 → 增二度。', 'When inverted, the two numbers add up to 9; major and minor swap, augmented and diminished swap, and perfect stays perfect: diminished 7th → augmented 2nd.')},
    {id: 'A9', type: 'interval', staff: ['Gb4', 'A#4'],
      prompt: L('谱例中的音程是什么？', 'What is the interval shown?'),
      answer: {q: 'AA', d: 2},
      explain: L('G 到 A 是二度。G♭–A♯ 相差 4 个半音，比增二度（3 个半音）还大半音：倍增二度。', 'G to A is a 2nd. G♭–A♯ spans 4 semitones, a semitone more than an augmented 2nd (3 semitones): a doubly augmented 2nd.')},
    {id: 'A10', type: 'interval', staff: ['Eb4', 'G#5'],
      prompt: L('谱例中的音程是什么？', 'What is the interval shown?'),
      answer: {q: 'A', d: 10},
      explain: L('E♭ 到 G♯ 是三度，相差 5 个半音，比大三度多半音，是增三度；再加一个八度：增十度。', 'E♭ to G♯ is a 3rd spanning 5 semitones, a semitone more than a major 3rd: an augmented 3rd. Add an octave: an augmented 10th.')}
  ];
  const C13 = ['C', 'E', 'G', 'Bb', 'Db', 'F', 'A'];
  const B = [
    {id: 'B1', type: 'notes',
      prompt: L('C13(♭9) 包含哪些音？请写出全部组成音。', 'Which notes make up C13(♭9)? Write all of them.'),
      symbol: ['C', '13(♭9)', ''],
      hint: L('不分先后，用空格或逗号隔开，例如：C E G。', 'Any order; separate notes with spaces or commas, for example: C E G.'),
      answer: C13,
      explain: L('C7 是 C–E–G–B♭，在上方叠加 ♭9（D♭）、11（F）和 13（A）：C–E–G–B♭–D♭–F–A。', 'C7 is C–E–G–B♭. Stack ♭9 (D♭), 11 (F) and 13 (A) on top: C–E–G–B♭–D♭–F–A.')},
    {id: 'B2', type: 'pick', needs: 'B1',
      prompt: L('C13(♭9) 的这些音里，哪些可以省略？', 'Which of these notes in C13(♭9) can be left out?'),
      hint: L('选出全部可以省略的音。', 'Select every note that can be left out.'),
      options: C13.map(showNote), answer: [2, 5],
      explain: L('根音、三音、七音和最高的延伸音（13）通常不省略；♭9 是记号里明确写出的变化音，也要保留。可以省略的是五音 G 和十一音 F。', 'The root, 3rd, 7th and the highest extension (13) are normally kept, and ♭9 is written into the symbol, so it stays too. The 5th (G) and the 11th (F) can be left out.')},
    {id: 'B3', type: 'symbol', staff: [['C4', 'E4', 'G#4', 'Bb4', 'D#5']],
      prompt: L('谱例中的和弦，应该写成什么和弦记号？', 'What chord symbol should be written for this chord?'),
      hint: L('用键盘打出和弦记号，例如 Cm7 或 F7(b9)。升号打 #，降号打 b。', 'Type the chord symbol, for example Cm7 or F7(b9). Type # for sharp and b for flat.'),
      answer: 'C7(#5,#9)',
      explain: L('谱中没有 G，G♯ 替代了五音，所以记作 ♯5，而不是 ♭13；D♯ 在九音的位置，记作 ♯9。答案是 C7(♯5,♯9)，也可以写作 C+7(♯9)。', 'There is no G, so G♯ replaces the 5th and is written ♯5, not ♭13. D♯ sits in the 9th position and is written ♯9. The answer is C7(♯5,♯9), which can also be written C+7(♯9).')}
  ];
  const D = [
    {id: 'D1', type: 'single', unit: L('第 1 课 · 三和弦', 'Unit 1 · Triads'),
      prompt: L('Am 的组成音是什么？', 'Which notes make up Am?'),
      options: ['A–C–E', 'A–C♯–E', 'A–C–E♭'], answer: [0],
      explain: L('Am 是小三和弦：根音 A，上方小三度 C，纯五度 E。', 'Am is a minor triad: root A, a minor 3rd above (C) and a perfect 5th above (E).')},
    {id: 'D2', type: 'single', unit: L('第 2 课 · 七和弦', 'Unit 2 · Seventh chords'),
      prompt: L('C7 和 Cmaj7 有什么不同？', 'What is the difference between C7 and Cmaj7?'),
      options: [L('C7 的七音是 B♭，Cmaj7 的七音是 B', 'The 7th of C7 is B♭; the 7th of Cmaj7 is B'), L('两者完全相同', 'They are exactly the same'), L('C7 的三音是 E♭', 'The 3rd of C7 is E♭')], answer: [0],
      explain: L('单独的 7 表示小七度（B♭）；maj7 表示大七度（B）。两者的三音都是 E。', 'A plain 7 means a minor 7th (B♭); maj7 means a major 7th (B). Both chords have E as the 3rd.')},
    {id: 'D3', type: 'single', unit: L('第 3 课 · 延伸音和弦', 'Unit 3 · Extended chords'),
      prompt: L('Cmaj9 比 Cmaj7 多了哪个音？', 'Which note does Cmaj9 add to Cmaj7?'),
      options: ['D', 'E♭', 'F'], answer: [0],
      explain: L('9 是大九度：C 上方的 D。', 'The 9th is a major 9th: D above C.')},
    {id: 'D4', type: 'single', unit: L('第 4 课 · 和弦变音', 'Unit 4 · Altered chords'),
      prompt: L('G7(♭9) 中的 ♭9 是哪个音？', 'Which note is the ♭9 in G7(♭9)?'),
      options: ['A♭', 'A', 'G♯'], answer: [0],
      explain: L('G 上方的九度是 A，♭9 把它降低半音：A♭（不写作 G♯）。', 'The 9th above G is A; ♭9 lowers it by a semitone: A♭ (not G♯).')},
    {id: 'D5', type: 'single', unit: L('第 5 课 · 非三度关系的和弦', 'Unit 5 · Chords not built in thirds'),
      prompt: L('Csus4 的组成音是什么？', 'Which notes make up Csus4?'),
      options: ['C–F–G', 'C–E–F–G', 'C–E–G'], answer: [0],
      explain: L('sus4 用四音 F 替代三音 E：C–F–G。', 'In sus4, the 4th (F) replaces the 3rd (E): C–F–G.')}
  ];

  /* ---------- 状态 ---------- */
  const state = {phase: 'start', queue: [], index: 0, results: {}, startedAt: null, abandoned: false};
  let current = null; // 当前题目的作答
  let staffView = null;

  function buildQueue() {
    // B2 只有在 B1 答对时才出现；补充题只有在 B 没有全对时才出现，都在运行时追加
    state.queue = [...A.map(q => ({...q, part: 'A'})), ...B.filter(q => q.id !== 'B2').map(q => ({...q, part: 'B'}))];
  }
  const answered = () => Object.keys(state.results).length;

  /* ---------- 判题 ---------- */
  const sameSet = (a, b) => a.length === b.length && a.every(x => b.includes(x));
  const TARGET_B3 = ChordInput.parse('C7(#5,#9)');
  function grade(q, value) {
    if (q.type === 'interval') return value.q === q.answer.q && value.d === q.answer.d;
    if (q.type === 'note') return value === q.answer;
    if (q.type === 'single' || q.type === 'multi' || q.type === 'pick') return sameSet(value, q.answer);
    if (q.type === 'notes') return sameSet([...new Set(value)], q.answer);
    if (q.type === 'symbol') {
      const p = ChordInput.parse(value);
      return p.ok && p.root === 'C' && p.rootAcc === '' && p.key === TARGET_B3.key && (!p.bass || (p.bass === 'C' && p.bassAcc === ''));
    }
    return false;
  }
  function answerText(q) {
    if (q.type === 'interval') return intervalName(q.answer);
    if (q.type === 'note') return showNote(q.answer);
    if (q.type === 'notes') return q.answer.map(showNote).join(' ');
    if (q.type === 'symbol') return 'C7(♯5,♯9)';
    return q.answer.map(i => q.options[i]).join(L('、', ', '));
  }
  function responseText(q, value) {
    if (q.type === 'interval') return intervalName(value);
    if (q.type === 'note') return showNote(value);
    if (q.type === 'notes') return value.map(showNote).join(' ');
    if (q.type === 'symbol') return value.trim();
    return value.map(i => q.options[i]).join(L('、', ', '));
  }

  /* ---------- 渲染 ---------- */
  function progressLabel(q) {
    if (q.part === 'A') return L(`第一部分 · 音程基础 · 第 ${A.indexOf(A.find(x => x.id === q.id)) + 1} / ${A.length} 题`, `Part 1 · Intervals · Question ${A.findIndex(x => x.id === q.id) + 1} of ${A.length}`);
    if (q.part === 'B') return L(`第二部分 · 和弦记号 · ${q.id}`, `Part 2 · Chord symbols · ${q.id}`);
    return L(`补充题 · ${q.unit}`, `Extra question · ${q.unit}`);
  }
  function showStart() {
    root.innerHTML = `<div class="et-card"><p class="et-hint">${L('大约需要 10–15 分钟。题目不多，请独立完成，不要查资料。', 'It takes about 10–15 minutes. Please work on your own without looking anything up.')}</p>
      <div class="et-actions"><button class="et-btn et-primary" type="button" data-start>${L('开始测试', 'Start the test')}</button></div></div>`;
    root.querySelector('[data-start]').addEventListener('click', () => {
      buildQueue(); state.startedAt = new Date(); state.phase = 'question'; state.index = 0; showQuestion();
    });
  }

  function showQuestion() {
    const q = state.queue[state.index];
    current = {value: null};
    if (staffView) { staffView.destroy(); staffView = null; }
    const symbolLine = q.symbol ? `<p class="et-preview">${ChordStage.chordSymbol(...q.symbol)}</p>` : '';
    root.innerHTML = `<div class="et-card">
      <p class="et-progress">${esc(progressLabel(q))}</p>
      <p class="et-prompt">${esc(q.prompt)}</p>${symbolLine}
      ${q.hint ? `<p class="et-hint">${esc(q.hint)}</p>` : ''}
      ${q.staff ? '<div class="et-staff" data-staff></div>' : ''}
      <div data-input></div>
      <div class="et-actions" data-actions>
        <button class="et-btn et-primary" type="button" data-submit disabled>${L('提交', 'Submit')}</button>
        <button class="et-btn" type="button" data-skip>${L('跳过', 'Skip')}</button>
      </div>
      <div data-feedback></div>
      ${answered() >= 1 ? `<p class="et-quit"><button class="et-link-button" type="button" data-quit>${L('放弃测试', 'Stop the test')}</button></p>` : ''}
    </div>`;
    if (q.staff) {
      staffView = NotationRenderer.mount(root.querySelector('[data-staff]'));
      const harmonic = Array.isArray(q.staff[0]);
      staffView.set({clef: 'treble', notes: harmonic ? q.staff : q.staff.map(n => [n]).map(k => ({keys: k, duration: 'h'})), label: L('五线谱谱例', 'Staff example')});
    }
    const submit = root.querySelector('[data-submit]');
    const setValue = (value, ready) => { current.value = value; submit.disabled = !ready; };
    renderInput(q, root.querySelector('[data-input]'), setValue, () => { if (!submit.disabled) finishQuestion(q, false); });
    submit.addEventListener('click', () => finishQuestion(q, false));
    root.querySelector('[data-skip]').addEventListener('click', () => finishQuestion(q, true));
    const quit = root.querySelector('[data-quit]');
    if (quit) quit.addEventListener('click', () => confirmQuit(quit));
  }

  function renderInput(q, box, setValue, onEnter) {
    if (q.type === 'interval') {
      const pick = {q: null, d: null};
      box.innerHTML = `<p class="et-group-label">${L('性质', 'Quality')}</p><div class="et-chips" data-q>${QUALITIES.map(([id]) => `<button class="et-chip" type="button" aria-pressed="false" data-v="${id}">${esc(qualityName(id))}</button>`).join('')}</div>
        <p class="et-group-label">${L('度数', 'Number')}</p><div class="et-chips et-degrees" data-d>${Array.from({length: 15}, (_, i) => `<button class="et-chip" type="button" aria-pressed="false" data-v="${i + 1}">${EN ? ordinal(i + 1) : i + 1}</button>`).join('')}</div>
        <p class="et-current" data-current></p>`;
      const current = box.querySelector('[data-current]');
      const update = () => {
        current.textContent = pick.q && pick.d ? L('你的答案：', 'Your answer: ') + intervalName(pick) : L('请选择性质和度数。', 'Choose a quality and a number.');
        setValue({...pick}, !!(pick.q && pick.d));
      };
      ['q', 'd'].forEach(key => box.querySelector(`[data-${key}]`).addEventListener('click', event => {
        const button = event.target.closest('button'); if (!button) return;
        box.querySelectorAll(`[data-${key}] button`).forEach(b => b.setAttribute('aria-pressed', String(b === button)));
        pick[key] = key === 'd' ? Number(button.dataset.v) : button.dataset.v;
        update();
      }));
      update();
    } else if (q.type === 'note' || q.type === 'notes' || q.type === 'symbol') {
      const placeholder = q.type === 'note' ? L('例如 F#、Bb 或 升F', 'e.g. F#, Bb or F sharp') : q.type === 'notes' ? L('例如 C E G', 'e.g. C E G') : L('例如 Cm7', 'e.g. Cm7');
      box.innerHTML = `<input class="et-text" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" aria-label="${esc(L('作答', 'Your answer'))}" placeholder="${esc(placeholder)}"><p class="et-preview" data-preview></p>`;
      const input = box.querySelector('input'), preview = box.querySelector('[data-preview]');
      const update = () => {
        preview.classList.remove('is-error');
        const text = input.value;
        if (!text.trim()) { preview.innerHTML = ''; setValue(null, false); return; }
        if (q.type === 'note') {
          const note = readNote(text);
          if (note) { preview.textContent = showNote(note); setValue(note, true); }
          else { preview.classList.add('is-error'); preview.textContent = L('无法识别这个音名。音名用 A–G，例如 F#、Bb、升F。', 'This note name is not recognised. Use A–G, e.g. F#, Bb or F sharp.'); setValue(null, false); }
        } else if (q.type === 'notes') {
          const list = readNotes(text), bad = list.filter(x => !x.note);
          if (bad.length) { preview.classList.add('is-error'); preview.textContent = L('无法识别：', 'Not recognised: ') + bad.map(x => x.token).join(' '); setValue(null, false); }
          else { preview.textContent = list.map(x => showNote(x.note)).join('  '); setValue(list.map(x => x.note), true); }
        } else {
          const p = ChordInput.parse(text);
          if (p.ok) { preview.innerHTML = ChordStage.chordSymbol(...p.parts); setValue(text, true); }
          else { preview.classList.add('is-error'); preview.textContent = EN ? 'This chord symbol is not recognised yet. Check the spelling, e.g. Cm7, F7(b9), Bb/D.' : p.error; setValue(null, false); }
        }
      };
      input.addEventListener('input', update);
      input.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); onEnter(); } });
      update();
      input.focus({preventScroll: true});
    } else {
      const multi = q.type !== 'single';
      box.innerHTML = `<div class="et-options">${q.options.map((label, i) => `<label class="et-option"><input type="${multi ? 'checkbox' : 'radio'}" name="opt" value="${i}"><span>${esc(label)}</span></label>`).join('')}</div>`;
      box.addEventListener('change', () => {
        const value = [...box.querySelectorAll('input:checked')].map(x => Number(x.value));
        setValue(value, value.length > 0);
      });
    }
  }

  function finishQuestion(q, skipped) {
    const correct = !skipped && grade(q, current.value);
    state.results[q.id] = {q, skipped, correct, response: skipped ? '' : responseText(q, current.value)};
    root.querySelectorAll('[data-input] input, [data-input] button').forEach(el => { el.disabled = true; });
    const actions = root.querySelector('[data-actions]');
    const quit = root.querySelector('.et-quit');
    if (quit) quit.remove();
    const verdict = skipped ? L('已跳过', 'Skipped') : correct ? L('正确', 'Correct') : L('不正确', 'Not quite');
    root.querySelector('[data-feedback]').innerHTML = `<div class="et-feedback ${skipped ? 'is-skipped' : correct ? 'is-correct' : 'is-wrong'}">
      <p><strong>${verdict}</strong>${correct ? '' : `　${L('正确答案：', 'Answer: ')}${esc(answerText(q))}`}</p><p>${esc(q.explain)}</p></div>`;
    // 运行时追加：B1 答对 → B2；B 部分结束且没有全对 → 补充题
    if (q.id === 'B1' && correct) state.queue.splice(state.index + 1, 0, {...B[1], part: 'B'});
    const last = state.index === state.queue.length - 1;
    if (last && q.part === 'B' && !partBPassed()) state.queue.push(...D.map(x => ({...x, part: 'D'})));
    const done = state.index === state.queue.length - 1;
    actions.innerHTML = `<button class="et-btn et-primary" type="button" data-next>${done ? L('查看结果', 'See results') : L('下一题', 'Next question')}</button>`;
    const next = actions.querySelector('[data-next]');
    next.addEventListener('click', () => { if (done) showResult(); else { state.index += 1; showQuestion(); window.scrollTo({top: root.offsetTop - 40, behavior: 'smooth'}); } });
    next.focus({preventScroll: true});
  }
  const partBPassed = () => ['B1', 'B2', 'B3'].every(id => state.results[id] && state.results[id].correct);

  function confirmQuit(trigger) {
    if (root.querySelector('.et-confirm')) return;
    const box = document.createElement('div');
    box.className = 'et-confirm';
    box.innerHTML = `<p>${L('确定要结束测试吗？放弃后本次测试不计分，判定为未通过。<br>还是建议你把题目做完：每一题都有讲解，不会的题也可以直接跳过。', 'Are you sure you want to stop? If you stop now, the test will not be scored and will count as not passed.<br>We still recommend finishing: every question comes with an explanation, and you can skip any question you are unsure of.')}</p>
      <div class="et-actions"><button class="et-btn et-primary" type="button" data-stay>${L('继续答题', 'Keep going')}</button><button class="et-btn" type="button" data-leave>${L('结束测试', 'Stop the test')}</button></div>`;
    trigger.closest('.et-quit').after(box);
    box.querySelector('[data-stay]').addEventListener('click', () => box.remove());
    box.querySelector('[data-leave]').addEventListener('click', () => { state.abandoned = true; showResult(); });
    box.querySelector('[data-stay]').focus();
  }

  /* ---------- 结果与成绩单 ---------- */
  function scoreA() { return A.filter(q => state.results[q.id] && state.results[q.id].correct).length; }
  function verdictOf() {
    if (state.abandoned) return 'abandoned';
    if (scoreA() / A.length < 0.8) return 'intervals';
    if (partBPassed()) return 'solid';
    return 'suitable';
  }
  const pad = n => String(n).padStart(2, '0');
  const stamp = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  function line(q, label) {
    const r = state.results[q.id];
    if (!r) return `${label}  ${L('未作答', 'not answered')}`;
    if (r.skipped) return `${label}  ${L('跳过', 'skipped')}`;
    return `${label}  ${r.correct ? '✓' : '✗'}${r.correct ? '' : `  ${L('作答：', 'answer given: ')}${r.response}`}`;
  }
  function report(verdict, title) {
    const lines = [L('和弦记号用法 · 入学自测', 'Chord Symbols · Entry Self-Test'), `${L('时间：', 'Date: ')}${stamp(new Date())}`, `${L('结论：', 'Result: ')}${title}`, ''];
    const a = scoreA();
    lines.push(state.abandoned ? L(`第一部分 · 音程基础：未完成（已答 ${A.filter(q => state.results[q.id]).length} / ${A.length} 题，不计分）`, `Part 1 · Intervals: not completed (${A.filter(q => state.results[q.id]).length} of ${A.length} answered, not scored)`)
      : L(`第一部分 · 音程基础：${a} / ${A.length}（${Math.round(a / A.length * 100)}%）`, `Part 1 · Intervals: ${a} / ${A.length} (${Math.round(a / A.length * 100)}%)`));
    A.forEach((q, i) => lines.push('  ' + line(q, `${i + 1}`)));
    const bAsked = B.filter(q => state.results[q.id]);
    if (bAsked.length) {
      lines.push('', L('第二部分 · 和弦记号：', 'Part 2 · Chord symbols:'));
      bAsked.forEach(q => {
        lines.push('  ' + line(q, q.id));
        if (q.id === 'B1' && !state.results.B1.correct) lines.push('  ' + L('B2  未出现（B1 未答对）', 'B2  not shown (B1 not correct)'));
      });
    }
    const dAsked = D.filter(q => state.results[q.id]);
    if (dAsked.length) {
      lines.push('', L('补充题：', 'Extra questions:'));
      dAsked.forEach(q => lines.push('  ' + line(q, q.unit)));
    }
    const notes = [];
    const a3 = state.results.A3;
    if (a3 && !a3.correct) notes.push(L('变化音程的概念（第 3 题）', 'the idea of chromatic intervals (question 3)'));
    const weak = D.filter(q => state.results[q.id] && !state.results[q.id].correct).map(q => q.unit);
    weak.forEach(u => notes.push(u));
    if (notes.length) { lines.push('', L('需要关注：', 'Areas to review:')); notes.forEach(n => lines.push('  · ' + n)); }
    return lines.join('\n');
  }

  function showResult() {
    if (staffView) { staffView.destroy(); staffView = null; }
    const verdict = verdictOf();
    const a = scoreA();
    const intervalLink = `<a class="text-link" href="../../interval-theory/">${L('音程理论基础', 'Interval Fundamentals')}</a>`;
    const contactLink = `<a class="text-link" href="/#contact">${L('私信老师 →', 'Get in touch →')}</a>`;
    const content = {
      abandoned: [L('测试未完成', 'Test not completed'),
        L(`本次测试没有完成，不计分，判定为未通过。和弦记号建立在音程知识之上，建议先学习${intervalLink}，打好音程基础。`, `The test was not completed, so it is not scored and counts as not passed. Chord symbols build on interval knowledge, so we recommend starting with ${intervalLink} to build a secure foundation.`)],
      intervals: [L('建议先学习音程理论基础', 'Start with Interval Fundamentals'),
        L(`你的音程部分得分为 ${a} / ${A.length}，低于 80%。和弦记号建立在音程知识之上，建议先学习${intervalLink}，再学习本课程。`, `You scored ${a} / ${A.length} on intervals, which is below 80%. Chord symbols build on interval knowledge, so we recommend taking ${intervalLink} before this course.`)],
      solid: [L('基础扎实', 'Solid foundations'),
        L(`你的音程和和弦知识都掌握得很扎实。如果有其他方面的音乐疑问，欢迎和老师私信聊聊。${contactLink}`, `Your knowledge of intervals and chords is solid. If you have questions about other areas of music, you are welcome to get in touch with the teacher. ${contactLink}`)],
      suitable: [L('适合学习本课程', 'This course is a good fit'),
        L(`你的音程部分得分为 ${a} / ${A.length}，已经具备学习和弦记号的音程基础，适合学习和弦记号用法。成绩单里列出了需要重点关注的内容。`, `You scored ${a} / ${A.length} on intervals, so you have the interval foundation needed for chord symbols, and Chord Symbols is a good fit. Your report lists the areas to focus on.`)]
    }[verdict];
    const text = report(verdict, content[0]);
    root.innerHTML = `<div class="et-card et-result">
      <h2 class="section-title public-section">${content[0]}</h2>
      <p>${content[1]}</p>
      <p class="et-save">${L('请马上复制成绩单或截图保存。关闭或刷新页面后，结果不会保留；报名时请把成绩单发给老师。', 'Please copy your report or take a screenshot now. The results are not kept once you close or refresh this page. Send the report to the teacher when you enrol.')}</p>
      <pre class="et-report" data-report>${esc(text)}</pre>
      <div class="et-actions"><button class="et-btn et-primary" type="button" data-copy>${L('复制成绩单', 'Copy report')}</button><span class="et-copied" data-copied aria-live="polite"></span></div>
      ${verdict === 'suitable' ? `<p style="margin-top:24px"><a class="text-link" href="../">${L('查看课程介绍 →', 'View the course →')}</a></p>` : ''}
    </div>`;
    root.querySelector('[data-copy]').addEventListener('click', async () => {
      const note = root.querySelector('[data-copied]');
      try { await navigator.clipboard.writeText(text); note.textContent = L('已复制。', 'Copied.'); }
      catch (error) {
        const range = document.createRange(); range.selectNodeContents(root.querySelector('[data-report]'));
        const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
        note.textContent = L('无法自动复制，已选中成绩单，请手动复制。', 'Automatic copy is unavailable. The report is selected; please copy it manually.');
      }
    });
    window.scrollTo({top: root.offsetTop - 40, behavior: 'smooth'});
  }

  showStart();
})();
