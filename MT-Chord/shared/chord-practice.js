/* 和弦记号课程 · 课后练习（共享）
   - 题目与答案在各课 practice/questions.js（window.chordPractice）。
   - 成绩、用时、历史与报告沿用 MT 的 PracticeEngine / PracticeReport（引擎只记录「对 / 错」，判题在这里）。
   - 题型：name（看谱写记号，用按钮拼出记号）、build（看记号写和弦，点谱表放音）。
   - 判错时按错误类型给提示，不直接给答案。
   依赖：VexFlow、NotationRenderer、ChordStage（声音与记号字体）、PracticeEngine、PracticeReport、MTFormatTime。 */
(() => {
  'use strict';
  const data = chordPractice; // questions.js 中的全局常量
  const {chordSymbol, Sound, midiOf} = ChordStage;
  const VF = NotationRenderer.VF();
  const app = document.getElementById('chordPracticeApp');
  const QS = data.questions;

  /* ---------- 音名工具 ---------- */
  const LETTERS = 'CDEFGAB';
  const STEP = {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11};
  const show = name => name.replace('#', '♯').replace(/b$/, '♭').replace(/^([A-G])b/, '$1♭');
  const pc = name => (STEP[name[0]] + (name[1] === '#' ? 1 : name[1] === 'b' ? -1 : 0) + 12) % 12;
  const QUALITY = {'': 'major', M: 'major', maj: 'major', '△': 'major', m: 'minor', min: 'minor', '−': 'minor', aug: 'aug', '+': 'aug', dim: 'dim', '°': 'dim'};
  const SUFFIX = {major: '', minor: 'm', aug: '+', dim: '°'};
  const answerSymbol = a => chordSymbol(show(a.root), SUFFIX[a.quality], a.bass ? show(a.bass) : '');
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };

  /* ---------- 谱例解析 ---------- */
  const BEATS = {w: 4, h: 2, q: 1, 8: .5};
  function parseToken(token) {
    const [pitchPart, rawDur] = token.split(':');
    const tie = rawDur.includes('~'), plus = rawDur.includes('+');
    const dur = rawDur.replace(/[~+]/g, ''), dotted = dur.endsWith('.'), base = dur.replace('.', '');
    const pitches = pitchPart === 'r' ? [] : pitchPart.split('.').map(p => {
      const m = p.match(/^([A-G])(#|b|n)?(\d)$/);
      return {letter: m[1], acc: m[2] || '', octave: Number(m[3])};
    });
    return {rest: !pitches.length, pitches, base, dotted, beats: BEATS[base] * (dotted ? 1.5 : 1), tie, plus};
  }
  const soundName = p => p.letter + (p.acc === 'n' ? '' : p.acc) + p.octave;

  /* ---------- 谱例绘制（VexFlow） ---------- */
  const STAFF_GAP = 105, TOP = 42;
  function renderScore(host, score, {segment} = {}) {
    host.replaceChildren();
    const grand = score.staves.length > 1;
    const renderer = NotationRenderer.createRenderer(host);
    const ctx = renderer.getContext();
    const events = [], segmentNotes = [];
    let x = 10, beat = 0;
    const firstStaves = [];
    score.measures.forEach((measure, mi) => {
      const notesCount = Math.max(...score.staves.flatMap(s => (measure[s] || []).map(v => v.split(' ').length)));
      const content = measure.pickup ? 46 : Math.max(120, 30 + notesCount * 34);
      const staves = score.staves.map((clef, si) => {
        const stave = NotationRenderer.createStave(x, TOP + si * STAFF_GAP, 100, {});
        if (mi === 0) { stave.addClef(clef); if (score.time) stave.addTimeSignature(score.time); }
        return stave;
      });
      if (mi === 0 && grand) VF.Stave.formatBegModifiers(staves);
      const lead = staves[0].getNoteStartX() - x;
      staves.forEach(stave => stave.setWidth(lead + content + 14));
      staves.forEach(stave => stave.setContext(ctx).draw());
      if (mi === 0) firstStaves.push(...staves);
      // 声部
      const allVoices = [], perStave = [], beams = [], ties = [], formatter = new VF.Formatter();
      score.staves.forEach((clef, si) => {
        const stave = staves[si], voicesSrc = measure[clef] || [];
        const accState = new Map();
        const voices = voicesSrc.map((src, vi) => {
          const stem = voicesSrc.length > 1 ? (vi === 0 ? 1 : -1) : undefined;
          let local = 0, pendingTie = null;
          const notes = src.split(' ').map(token => {
            const t = parseToken(token);
            const keys = t.rest ? [clef === 'bass' ? (voicesSrc.length > 1 && vi === 0 ? 'f/3' : 'd/3') : (voicesSrc.length > 1 && vi === 0 ? 'd/5' : 'b/4')]
              : t.pitches.map(p => p.letter.toLowerCase() + (p.acc === 'n' ? '' : p.acc) + '/' + p.octave);
            const note = new VF.StaveNote({clef, keys, duration: t.base + (t.dotted ? 'd' : '') + (t.rest ? 'r' : ''), ...(stem ? {stem_direction: stem} : {}), auto_stem: !stem});
            note.setStave(stave);
            if (t.dotted) VF.Dot.buildAndAttach([note], {all: true});
            t.pitches.forEach((p, i) => {
              const key = p.letter + p.octave, want = p.acc === 'n' ? '' : p.acc, now = accState.get(key) || '';
              if (p.acc === 'n' || want !== now) note.addModifier(new VF.Accidental(want || 'n'), i);
              accState.set(key, want);
            });
            if (t.plus) note.addModifier(new VF.Annotation('+').setVerticalJustification(VF.Annotation.VerticalJustify.TOP), 0);
            const start = beat + local;
            if (pendingTie) { ties.push([pendingTie.note, note]); pendingTie.event.dur += t.beats; }
            let event = null;
            if (!t.rest && !pendingTie) { event = {keys: t.pitches.map(soundName), start, dur: t.beats}; events.push(event); }
            pendingTie = t.tie ? {note, event: event || pendingTie.event} : null;
            if (segment && mi === segment[0] && local >= segment[1] && local < segment[2]) segmentNotes.push(note);
            local += t.beats;
            return note;
          });
          const voice = new VF.Voice({num_beats: 4, beat_value: 4}).setMode(VF.Voice.Mode.SOFT).addTickables(notes);
          beams.push(...VF.Beam.generateBeams(notes, {beam_rests: false, ...(stem ? {stem_direction: stem} : {})}));
          return voice;
        });
        if (voices.length) {
          formatter.joinVoices(voices);
          perStave.push([stave, voices]);
          allVoices.push(...voices);
        }
      });
      if (allVoices.length) formatter.format(allVoices, content);
      perStave.forEach(([stave, voices]) => voices.forEach(v => v.draw(ctx, stave)));
      beams.forEach(b => b.setContext(ctx).draw());
      ties.forEach(([a, b]) => new VF.StaveTie({first_note: a, last_note: b, first_indices: [0], last_indices: [0]}).setContext(ctx).draw());
      const length = measure.pickup ? Math.max(...score.staves.flatMap(c => (measure[c] || []).map(v => v.split(' ').reduce((s, t) => s + parseToken(t).beats, 0)))) : 4;
      beat += length;
      x += staves[0].getWidth();
    });
    if (grand) {
      new VF.StaveConnector(firstStaves[0], firstStaves[1]).setType('brace').setContext(ctx).draw();
      new VF.StaveConnector(firstStaves[0], firstStaves[1]).setType('singleLeft').setContext(ctx).draw();
    }
    const width = x + 10, height = TOP + (score.staves.length - 1) * STAFF_GAP + 120;
    renderer.resize(width, height);
    const svg = host.querySelector('svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.querySelectorAll('text').forEach(t => t.setAttribute('stroke', 'none'));
    if (segmentNotes.length) {
      const xs = segmentNotes.map(n => n.getAbsoluteX());
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const left = Math.min(...xs) - 12, right = Math.max(...xs) + 26;
      rect.setAttribute('x', left); rect.setAttribute('y', TOP - 8);
      rect.setAttribute('width', right - left); rect.setAttribute('height', height - TOP - 22);
      rect.setAttribute('rx', 6); rect.setAttribute('class', 'segment-highlight');
      svg.insertBefore(rect, svg.firstChild);
    }
    fit(host, svg, width, height);
    return {events, segmentEvents: segment ? events.filter(e => e.start >= startBeat(score, segment[0]) + segment[1] && e.start < startBeat(score, segment[0]) + segment[2]) : events};
  }
  const startBeat = (score, mi) => score.measures.slice(0, mi).reduce((s, m) => s + (m.pickup ? .5 : 4), 0);
  // 小谱例放大到可读宽度；长谱例（第 27 题）保持可读尺寸，横向滚动。
  function fit(host, svg, width, height) {
    const avail = host.clientWidth || 340;
    const scale = Math.max(.85, Math.min(1.6, avail / width));
    svg.style.width = width * scale + 'px';
    svg.style.height = height * scale + 'px';
    svg.removeAttribute('width'); svg.removeAttribute('height');
  }
  function playEvents(events) {
    if (!events.length) return;
    const t0 = Math.min(...events.map(e => e.start)), spb = 60 / (data.tempo || 72);
    const notes = [], offsets = [], durations = [];
    events.forEach(e => e.keys.forEach(k => { notes.push(k); offsets.push((e.start - t0) * spb); durations.push(e.dur * spb); }));
    Sound.wake(); Sound.play(notes, offsets, durations);
  }

  /* ---------- 写和弦：点击谱表放音 ---------- */
  const E4 = 4 * 7 + 2; // 以「级」计：八度 × 7 + 字母序号
  const stepPitch = step => { const n = E4 + step; return {letter: LETTERS[n % 7], octave: Math.floor(n / 7)}; };
  const pitchStep = p => p.octave * 7 + LETTERS.indexOf(p.letter) - E4;
  function renderEntry(host, notes, selected, onPick) {
    host.replaceChildren();
    const renderer = NotationRenderer.createRenderer(host);
    const ctx = renderer.getContext();
    const width = 260, height = 170;
    renderer.resize(width, height);
    const stave = NotationRenderer.createStave(10, 45, width - 20);
    stave.addClef('treble').setContext(ctx).draw();
    if (notes.length) {
      const sorted = notes.map((n, i) => ({...n, i})).sort((a, b) => pitchStep(a) - pitchStep(b));
      const note = new VF.StaveNote({clef: 'treble', keys: sorted.map(n => n.letter.toLowerCase() + n.acc + '/' + n.octave), duration: 'w'});
      sorted.forEach((n, k) => {
        if (n.acc) note.addModifier(new VF.Accidental(n.acc), k);
        if (n.i === selected) note.setKeyStyle(k, {fillStyle: '#4f46e5', strokeStyle: '#4f46e5'});
      });
      note.setStave(stave);
      const voice = new VF.Voice({num_beats: 4, beat_value: 4}).setMode(VF.Voice.Mode.SOFT).addTickables([note]);
      new VF.Formatter().joinVoices([voice]).format([voice], 60);
      const tick = note.getTickContext();
      tick.setX(tick.getX() + (width / 2 - 12) - note.getAbsoluteX());
      voice.draw(ctx, stave);
    }
    const svg = host.querySelector('svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.removeAttribute('width'); svg.removeAttribute('height');
    svg.style.width = '100%'; svg.style.maxWidth = '420px'; svg.style.height = 'auto';
    const bottom = stave.getYForLine(4), half = stave.getSpacingBetweenLines() / 2;
    svg.addEventListener('pointerdown', event => {
      const pt = svg.createSVGPoint(); pt.x = event.clientX; pt.y = event.clientY;
      const y = pt.matrixTransform(svg.getScreenCTM().inverse()).y;
      const step = Math.max(-5, Math.min(13, Math.round((bottom - y) / half)));
      onPick(step);
    });
  }

  // 学生这次的作答，写进练习报告（只有答错时会用到）
  function answerText(q, draft) {
    if (q.type !== 'name') return draft.notes.map(n => show(n.letter + n.acc) + n.octave).join('–') || '（空）';
    return show(draft.root + draft.rootAcc) + draft.suffix + (draft.slash ? '/' + show(draft.bass + draft.bassAcc) : '');
  }

  /* ---------- 判题 ---------- */
  function judgeName(q, draft) {
    const a = q.answer, root = draft.root + draft.rootAcc, bass = draft.slash ? draft.bass + draft.bassAcc : '';
    const quality = QUALITY[draft.suffix];
    if (root !== a.root) {
      if (a.bass && root === a.bass) return {ok: false, msg: '低音不一定是根音。先把这几个音按三度叠置，最下面的才是根音。'};
      if (pc(root) === pc(a.root)) return {ok: false, msg: '音高对了，但根音要按谱面上的音名拼写。'};
      return {ok: false, msg: '根音不对。把这几个音按三度叠置，看看从哪个音开始。'};
    }
    if (quality !== a.quality) {
      if (draft.suffix === '−' && a.quality === 'dim') return {ok: false, msg: '「−」表示小三和弦；减三和弦用「°」或 dim。'};
      return {ok: false, msg: '根音对了。再算一算根音到三音、根音到五音的音程。'};
    }
    if (bass && bass === root) return {ok: false, msg: '低音就是根音时不写斜线，只写和弦本身。'};
    if (!a.bass && bass) return {ok: false, msg: '这个和弦的低音就是根音，不需要斜线。'};
    if (a.bass && !bass) return {ok: false, msg: '和弦写对了。再看最低的音：它不是根音，要用斜线写出低音。'};
    if (a.bass && bass !== a.bass) return {ok: false, msg: pc(bass) === pc(a.bass) ? '低音的音高对了，但要按谱面上的音名拼写。' : '斜线后面写的是谱面上最低的那个音。'};
    let msg = `正确。${answerSymbol(a)}　${q.tones}`;
    if (draft.suffix === '△') msg += '<br>提醒：用 △ 表示大三和弦的写法不常用，一般会读作七和弦（maj7）。三和弦直接写根音就好。';
    if (q.note) msg += '<br>' + q.note;
    return {ok: true, msg};
  }
  function judgeBuild(q, notes) {
    const names = [...new Set(notes.map(n => n.letter + n.acc))];
    const missing = q.notes.filter(n => !names.includes(n)), extra = names.filter(n => !q.notes.includes(n));
    for (const x of extra) {
      const twin = missing.find(m => pc(m) === pc(x));
      if (twin) return {ok: false, msg: `${show(x)} 的音高对了，但拼写不对。和弦音要按三度叠置来拼写。`};
    }
    if (extra.length) return {ok: false, msg: `${extra.map(show).join('、')} 不属于这个和弦。`};
    if (missing.length) return {ok: false, msg: `还缺 ${missing.length} 个和弦音。`};
    const lowest = notes.reduce((lo, n) => midiOf(n.letter + n.acc + n.octave) < midiOf(lo.letter + lo.acc + lo.octave) ? n : lo);
    if (lowest.letter + lowest.acc !== q.bass) return {ok: false, msg: q.symbol[2] ? '和弦音都对了。斜线后面的音要放在最低。' : '和弦音都对了。这个记号没有斜线，最低的音应该是根音。'};
    return {ok: true, msg: `正确。${chordSymbol(...q.symbol)}　${q.notes.map(show).join('–')}，低音 ${show(q.bass)}`};
  }

  /* ---------- 状态 ---------- */
  const engine = PracticeEngine.create({code: data.code, title: data.title, reportTitle: data.reportTitle,
    questions: QS.map(q => ({id: q.id, type: 'single-choice', options: [{value: 'ok'}, {value: 'no'}], correctAnswer: ['ok']}))});
  const drafts = QS.map(q => q.type === 'build' ? {notes: [], selected: -1} : {root: '', rootAcc: '', suffix: '', slash: '', bass: '', bassAcc: ''});
  const feedback = QS.map(() => null);
  let onDraft = null; // 当前题目的「提交」按钮状态
  const draftChanged = () => onDraft && onDraft();
  const groupOf = i => [...data.groups].reverse().find(g => QS.findIndex(q => q.id === g.from) <= i);

  /* ---------- 页面 ---------- */
  function header(extra = '') {
    return `<header class="cp-top"><a class="cp-back" href="${data.backURL}">← 课程首页</a><span class="cp-code">${data.code}</span>${extra}</header>`;
  }
  function renderStart() {
    app.innerHTML = header() + `<main class="cp-card cp-start"><p class="cp-kicker">课后练习</p><h1>${data.title}</h1>
      <p class="cp-lead">共 ${QS.length} 题：看谱写记号、看记号写和弦、分解和弦与谱例分析。答对才能进入下一题；答错会给出提示，可以再试。</p>
      <p class="cp-note">谱例可以播放；iPhone 请先关闭静音模式。</p>
      <button class="cp-primary" type="button" id="cpStart">开始练习</button></main>`;
    app.querySelector('#cpStart').addEventListener('click', () => { Sound.wake(); engine.start(); renderQuestion(); });
  }

  function renderQuestion() {
    const st = engine.state(), i = st.index, q = QS[i], review = st.mode === 'review';
    onDraft = null;
    const solved = st.stats[i]?.isSolved, group = groupOf(i);
    app.innerHTML = header(`<span class="cp-count">${review ? '回看' : `${st.solved} / ${QS.length} 完成`}</span>`) +
      `<main class="cp-card"><p class="cp-kicker">${group.title}</p><p class="cp-hint">${group.hint}</p>
      <h2 class="cp-label">第 ${q.label} 题</h2><div class="cp-question"></div>
      <p class="cp-feedback" aria-live="polite"></p><div class="cp-actions"></div></main><nav class="cp-chips" aria-label="题目"></nav>`;
    const box = app.querySelector('.cp-question'), fb = app.querySelector('.cp-feedback'), actions = app.querySelector('.cp-actions');
    const locked = solved || review;
    if (q.type === 'name') nameQuestion(q, i, box, locked, review);
    else buildQuestion(q, i, box, locked, review);
    const f = review ? {ok: true, msg: reviewAnswer(q)} : feedback[i];
    if (f) { fb.innerHTML = f.msg; fb.className = 'cp-feedback ' + (f.ok ? 'is-right' : 'is-wrong'); }
    // 按钮
    const btn = (text, cls, fn) => { const b = el('button', cls, text); b.type = 'button'; b.addEventListener('click', fn); actions.append(b); return b; };
    if (review) {
      if (i > 0) btn('← 上一题', 'cp-ghost', () => { engine.review(i - 1); renderQuestion(); });
      btn('返回结果', 'cp-ghost', () => { engine.backToResults(); renderResult(); });
      if (i < QS.length - 1) btn('下一题 →', 'cp-primary', () => { engine.review(i + 1); renderQuestion(); });
    } else if (solved) {
      btn(st.solved === QS.length ? '查看结果' : '下一题 →', 'cp-primary', () => {
        engine.next();
        if (engine.state().mode === 'result') renderResult(); else renderQuestion();
      });
    } else {
      const submit = btn('提交', 'cp-primary', () => {
        Sound.stop();
        const result = q.type === 'name' ? judgeName(q, drafts[i]) : judgeBuild(q, drafts[i].notes);
        feedback[i] = result;
        engine.submit([result.ok ? 'ok' : 'no'], answerText(q, drafts[i]));
        renderQuestion();
      });
      submit.disabled = q.type === 'name' ? !drafts[i].root || (drafts[i].slash && !drafts[i].bass) : !drafts[i].notes.length;
      onDraft = () => { submit.disabled = q.type === 'name' ? !drafts[i].root || (drafts[i].slash && !drafts[i].bass) : !drafts[i].notes.length; };
    }
    chips(st);
  }
  function reviewAnswer(q) {
    return q.type === 'name' ? `答案：${answerSymbol(q.answer)}　${q.tones}${q.note ? '<br>' + q.note : ''}`
      : `答案：${chordSymbol(...q.symbol)}　${q.notes.map(show).join('–')}，低音 ${show(q.bass)}`;
  }
  function chips(st) {
    const nav = app.querySelector('.cp-chips');
    QS.forEach((q, k) => {
      const status = PracticeEngine.questionStatus(st.stats[k] || {attempts: 0, isSolved: false});
      const b = el('button', `cp-chip is-${status}${k === st.index ? ' is-current' : ''}`, q.label);
      b.type = 'button';
      b.addEventListener('click', () => { if (st.mode === 'practice') engine.goTo(k); else { engine.backToResults(); engine.review(k); } renderQuestion(); });
      nav.append(b);
    });
  }

  function playButtons(box, items) {
    const row = el('div', 'cp-play');
    items.forEach(([text, fn]) => { const b = el('button', 'cp-ghost cp-small', '▶ ' + text); b.type = 'button'; b.addEventListener('click', fn); row.append(b); });
    box.append(row);
  }

  function nameQuestion(q, i, box, locked, review) {
    const score = el('div', 'cp-score' + (q.segment ? ' is-wide' : ''));
    box.append(score);
    const result = renderScore(score, q.score, {segment: q.segment});
    playButtons(box, q.segment ? [['本段', () => playEvents(result.segmentEvents)], ['全曲', () => playEvents(result.events)]] : [['播放', () => playEvents(result.events)]]);
    if (locked) return;
    const d = drafts[i];
    const builder = el('div', 'cp-builder');
    const preview = el('p', 'cp-preview');
    const update = () => {
      preview.innerHTML = d.root ? chordSymbol(show(d.root + d.rootAcc), d.suffix, d.slash ? (d.bass ? show(d.bass + d.bassAcc) : '?') : '') : '<span class="cp-placeholder">选择根音开始</span>';
      builder.querySelectorAll('[data-k]').forEach(b => b.setAttribute('aria-pressed', String(d[b.dataset.k] === b.dataset.v)));
      bassRow.hidden = !d.slash;
      draftChanged();
    };
    const row = (title, items) => {
      const r = el('div', 'cp-row'); r.append(el('span', 'cp-row-title', title));
      const g = el('div', 'cp-keys');
      items.forEach(([k, v, label, toggle]) => {
        const b = el('button', 'cp-key', label); b.type = 'button'; b.dataset.k = k; b.dataset.v = v;
        b.addEventListener('click', () => { d[k] = toggle && d[k] === v ? '' : v; if (k === 'slash' && !d.slash) { d.bass = ''; d.bassAcc = ''; } update(); });
        g.append(b);
      });
      r.append(g); return r;
    };
    const letters = k => [...LETTERS].map(L => [k, L, L]);
    const accs = k => [[k, 'b', chordSymbol('♭'), true], [k, '#', chordSymbol('♯'), true]];
    builder.append(preview,
      row('根音', [...letters('root'), ...accs('rootAcc')]),
      row('后缀', [['suffix', '', '不写'], ...['m', 'min', '−', 'M', 'maj', '△', 'aug', '+', 'dim', '°'].map(s => ['suffix', s, chordSymbol('', s)])]),
      row('低音', [['slash', 'yes', '／ 斜线', true]]));
    const bassRow = row('', [...letters('bass'), ...accs('bassAcc')]);
    bassRow.classList.add('cp-bass-row');
    builder.append(bassRow);
    box.append(builder);
    update();
  }

  function buildQuestion(q, i, box, locked, review) {
    box.append(el('p', 'cp-target', chordSymbol(...q.symbol)));
    const d = drafts[i];
    const staff = el('div', 'cp-entry');
    box.append(staff);
    const draw = () => {
      renderEntry(staff, review ? spellUp(q) : d.notes, review ? -1 : d.selected, locked ? () => {} : step => {
        const p = stepPitch(step), at = d.notes.findIndex(n => pitchStep(n) === step);
        if (at >= 0) { d.selected = at; } else { d.notes.push({...p, acc: ''}); d.selected = d.notes.length - 1; }
        draw(); draftChanged();
      });
    };
    draw();
    playButtons(box, [['播放', () => {
      const notes = review ? spellUp(q) : d.notes;
      if (notes.length) { Sound.wake(); Sound.play(notes.map(n => n.letter + n.acc + n.octave)); }
    }]]);
    if (locked) return;
    const tools = el('div', 'cp-tools');
    const tool = (label, fn, title) => { const b = el('button', 'cp-key', label); b.type = 'button'; if (title) b.title = title; b.addEventListener('click', () => { if (fn() !== false) { draw(); draftChanged(); } }); tools.append(b); };
    const sel = () => d.notes[d.selected];
    tool(chordSymbol('♭'), () => { if (!sel()) return false; sel().acc = sel().acc === 'b' ? '' : 'b'; }, '降号');
    tool(chordSymbol('♮'), () => { if (!sel()) return false; sel().acc = ''; }, '还原');
    tool(chordSymbol('♯'), () => { if (!sel()) return false; sel().acc = sel().acc === '#' ? '' : '#'; }, '升号');
    tool('↑', () => { if (!sel()) return false; const s = Math.min(13, pitchStep(sel()) + 1); if (d.notes.some(n => pitchStep(n) === s)) return false; Object.assign(sel(), stepPitch(s)); }, '上移');
    tool('↓', () => { if (!sel()) return false; const s = Math.max(-5, pitchStep(sel()) - 1); if (d.notes.some(n => pitchStep(n) === s)) return false; Object.assign(sel(), stepPitch(s)); }, '下移');
    tool('删除', () => { if (!sel()) return false; d.notes.splice(d.selected, 1); d.selected = d.notes.length - 1; });
    tool('清空', () => { d.notes = []; d.selected = -1; });
    box.append(el('p', 'cp-tip', '点谱表放音；点已有的音可以选中它，再加升降号或上下移动。'), tools);
  }
  // 回看时显示的标准答案：从低音开始向上排列
  function spellUp(q) {
    const order = [q.bass, ...q.notes.filter(n => n !== q.bass)];
    let octave = 4, last = -1;
    return order.map(n => {
      const idx = LETTERS.indexOf(n[0]);
      if (last >= 0 && idx <= last) octave++;
      last = idx;
      return {letter: n[0], acc: n.slice(1), octave};
    });
  }

  function renderResult() {
    const st = engine.state();
    const first = st.stats.filter(s => s.isSolved && s.attempts === 1).length;
    app.innerHTML = header() + `<main class="cp-card cp-result"><p class="cp-kicker">练习完成</p><h1>${data.title}</h1>
      <div class="cp-stats"><p><b>${st.accuracy}%</b><span>准确率</span></p><p><b>${MTFormatTime(st.seconds)}</b><span>用时</span></p><p><b>${first} / ${QS.length}</b><span>一次答对</span></p></div>
      <p class="cp-note">点题号可以回看答案。</p><nav class="cp-chips"></nav>
      <div class="cp-actions"><button class="cp-primary" type="button" id="cpCopy">复制练习报告</button><button class="cp-ghost" type="button" id="cpAgain">重新练习</button></div>
      <p class="cp-feedback" id="cpCopied" aria-live="polite"></p></main>`;
    chips(st);
    app.querySelector('#cpCopy').addEventListener('click', async () => {
      const text = PracticeReport.generate(engine.reportInput());
      try { await navigator.clipboard.writeText(text); app.querySelector('#cpCopied').textContent = '已复制，可以发给老师。'; }
      catch { app.querySelector('#cpCopied').textContent = text; }
    });
    app.querySelector('#cpAgain').addEventListener('click', () => {
      engine.reset(); drafts.forEach((d, k) => { drafts[k] = QS[k].type === 'build' ? {notes: [], selected: -1} : {root: '', rootAcc: '', suffix: '', slash: '', bass: '', bassAcc: ''}; });
      feedback.fill(null); renderStart();
    });
  }

  renderStart();
})();
