/* 和弦记号课程 · 课后练习（共享）
   - 外壳与音程练习一致（shared/practice/practice-ui.js 的结构与样式类：页眉、开始页、题目导航、反馈框、结果页、历史记录）。
   - 题目与答案在各课 practice/questions.js（window.chordPractice）。
   - 成绩、用时、历史与报告沿用 MT 的 PracticeEngine / PracticeReport（引擎只记录「对 / 错」，判题在这里）。
     正确率 = 一次答对的题数 ÷ 总题数。
   - 和弦记号一律用键盘输入（ChordInput：乐手通用的文字写法，自动排成印刷体）。
   - 题型：name（看谱写记号）、build（看记号写和弦，点谱表写音）、
     analysis（谱例分析：在任何有音符的拍点上写记号，判断记号与起始位置）。
   - 判错时按错误类型给提示，不直接给答案；谱例分析漏写的和弦会标出位置并说明答案。
   - 声音：网站共享钢琴采样（ChordStage.Sound）。点谱例就播放（与课件演示区一致）。
   - 和弦记号一律用黑色印刷体（不上色）；答对后写在谱例上方、和弦符头的正上方。
   依赖：VexFlow、NotationRenderer、ChordStage、PracticeEngine、PracticeReport、MTFormatTime。 */
(() => {
  'use strict';
  const data = chordPractice; // questions.js 中的全局常量
  const {chordSymbol, drawSymbol, stackSymbols, Sound, midiOf} = ChordStage;
  const VF = NotationRenderer.VF();
  const app = document.getElementById('practiceApp');
  const QS = data.questions;

  /* ---------- 音名工具 ---------- */
  const LETTERS = 'CDEFGAB';
  const STEP = {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11};
  // 音名（内部写法 C、Ab、F#、Bbb、Fx）→ 显示写法 C、A♭、F♯、B𝄫、F𝄪
  const ACC_SHOW = {'': '', b: '♭', bb: '𝄫', '#': '♯', x: '𝄪'};
  const ACC_STEP = {'': 0, b: -1, bb: -2, '#': 1, x: 2};
  const show = name => name[0] + ACC_SHOW[name.slice(1)];
  const pc = name => (STEP[name[0]] + ACC_STEP[name.slice(1)] + 12) % 12;
  const QUALITY = {'': 'major', M: 'major', maj: 'major', '△': 'major', m: 'minor', min: 'minor', '−': 'minor', aug: 'aug', '+': 'aug', dim: 'dim', '°': 'dim'};
  const SUFFIX = {major: '', minor: 'm', aug: '+', dim: '°'};
  // 答案有两种写法：第一课 {root, quality, bass}；第二课起直接写记号文字（如 'Cm7(b5)/Gb'），用 ChordInput 解析
  // 答案也可以是几种写法的数组（如 ['G7/F', 'G/F']），第一种是标准写法
  const firstOf = a => Array.isArray(a) ? a[0] : a;
  const answerSymbol = a => (a = firstOf(a), typeof a === 'string') ? chordSymbol(...ChordInput.parse(a).parts) : chordSymbol(show(a.root), SUFFIX[a.quality], a.bass ? show(a.bass) : '');
  // 学生写的记号：[根音, 后缀, 低音]（显示用）
  // 学生的作答：键盘打出的文字（ChordInput 识别并排版）
  const emptyName = () => ({text: ''});
  const nameReady = d => ChordInput.parse(d.text).ok;
  const draftParts = d => ChordInput.parse(d.text).parts;   // 排版用：[根音, 后缀, 低音]
  const draftText = d => d.text.trim();                     // 报告里写学生打的原文
  const answerDraft = a => (a = firstOf(a), {text: typeof a === 'string' ? a : a.root + SUFFIX[a.quality] + (a.bass ? '/' + a.bass : '')});
  // 记号文字 → 和弦音（显示用，如 C–E–G–B♭）
  const tonesOf = text => ChordInput.spell(ChordInput.parse(text)).map(show).join('–');
  // 第二课起的题目：记号写成文字，这里补齐判题与显示要用的字段
  function prepare(q) {
    if (q.type === 'build' && typeof q.symbol === 'string') {
      const parsed = ChordInput.parse(q.symbol);
      q.notes = ChordInput.spell(parsed);
      q.bass = parsed.bass ? parsed.bass + parsed.bassAcc : parsed.root + parsed.rootAcc;
      q.symbol = parsed.parts;
    }
    if (q.type === 'build' && !q.notes.includes(q.bass)) q.notes.push(q.bass);  // 「三和弦/低音」：低音也是和弦音（如 A/G = A7/G）
    if (q.type === 'name' && typeof firstOf(q.answer) === 'string' && !q.tones) q.tones = tonesOf(firstOf(q.answer));
    if (q.type === 'analysis') q.chords.forEach(c => { if (typeof firstOf(c.answer) === 'string' && !c.tones) c.tones = tonesOf(firstOf(c.answer)); });
    return q;
  }
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };

  /* ---------- 谱例解析 ---------- */
  const BEATS = {w: 4, h: 2, q: 1, 8: .5, 16: .25};
  function parseToken(token) {
    const [pitchPart, rawDur] = token.split(':');
    const tie = rawDur.includes('~'), plus = rawDur.includes('+');
    const dur = rawDur.replace(/[~+]/g, ''), dotted = dur.endsWith('.'), base = dur.replace('.', '');
    const pitches = pitchPart === 'r' ? [] : pitchPart.split('.').map(p => {
      const m = p.match(/^([A-G])(##|bb|#|b|n)?(\d)$/);
      return {letter: m[1], acc: m[2] || '', octave: Number(m[3])};
    });
    return {rest: !pitches.length, pitches, base, dotted, beats: BEATS[base] * (dotted ? 1.5 : 1), tie, plus};
  }
  const soundName = p => p.letter + (p.acc === 'n' ? '' : p.acc) + p.octave;
  const posKey = (measure, beat) => `${measure}:${beat}`;
  // 「第 2 小节第 3 拍」；弱起小节是第 0 小节，写作「弱起」
  let hasPickup = true, firstBar = 1;
  function where(key) {
    const [measure, beat] = key.split(':').map(Number), n = beat + 1;
    // 小节从 0 起算：有弱起时第 0 小节是弱起，否则第 0 小节就是第 1 小节
    // firstBar：谱例从第几小节开始（长曲子分成几题时用）
    const bar = measure === 0 && hasPickup ? '弱起小节' : `第 ${(hasPickup ? measure : measure + 1) + firstBar - 1} 小节`;
    return `${bar}第 ${Math.floor(n)} 拍${Number.isInteger(n) ? '' : '后半拍'}`;
  }

  /* ---------- 调号 ----------
     score.key：调号（VexFlow 的写法，如 'Ab'、'F#m'）。谱例里的音一律写实际音高（如 Ab4），
     调号里已有的升降号不再在音符前重复；与调号不同的音自动加升降号或还原号。 */
  const KEY_COUNT = {C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7, F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7,
    Am: 0, Em: 1, Bm: 2, 'F#m': 3, 'C#m': 4, 'G#m': 5, 'D#m': 6, 'A#m': 7, Dm: -1, Gm: -2, Cm: -3, Fm: -4, Bbm: -5, Ebm: -6, Abm: -7};
  let keyAcc = () => '';
  function useKey(key) {
    const n = KEY_COUNT[key || 'C'] || 0;
    const letters = n > 0 ? 'FCGDAEB'.slice(0, n) : 'BEADGCF'.slice(0, -n);
    keyAcc = letter => letters.includes(letter) ? (n > 0 ? '#' : 'b') : '';
  }

  /* ---------- 谱例绘制（VexFlow） ----------
     记谱规则（规范 N03）：不完整的片段（没有拍号）谱表左右开放，不画小节线；带拍号的谱例画小节线。
     单个柱式和弦：符头居中。大谱表：左边留出花括号的位置。 */
  const STAFF_GAP = 105, TOP = 52, SYMBOL_SIZE = 19;
  function renderScore(host, score) {
    host.replaceChildren();
    useKey(score.key);
    const [num, den] = (score.time || '4/4').split('/').map(Number);
    const barBeats = num * 4 / den, compound = den === 8 && num % 3 === 0;
    const grand = score.staves.length > 1, metered = !!score.time;
    const single = !metered && score.measures.length === 1 &&
      score.staves.every(s => (score.measures[0][s] || []).every(v => v.split(' ').length === 1));
    const renderer = NotationRenderer.createRenderer(host);
    const ctx = renderer.getContext();
    const events = [], onsets = new Map(), topNotes = [];
    let x = grand ? 30 : 12, beat = 0;
    const segments = [];  // 每小节的起点与谱号（固定在左边的谱号要跟着换）
    const clefNow = score.measures[0]?.clefs ? score.staves.map(s => score.measures[0].clefs[s] || s) : [...score.staves];
    const firstStaves = [];
    score.measures.forEach((measure, mi) => {
      const notesCount = Math.max(...score.staves.flatMap(s => (measure[s] || []).map(v => v.split(' ').length)));
      const content = single ? 150 : measure.pickup ? 46 : Math.max(120, 30 + notesCount * 34);
      // 换谱号：measure.clefs = {bass: 'treble'} 表示「bass 这一行」从这个小节起改用高音谱号，直到再次更换
      const changed = score.staves.map((staff, si) => {
        const want = measure.clefs?.[staff] || clefNow[si];
        const differs = want !== clefNow[si];
        clefNow[si] = want;
        return differs;
      });
      segments.push({x, clefs: [...clefNow]});
      const staves = score.staves.map((staff, si) => {
        // 带拍号：每小节一个谱表，画小节线；没有拍号：谱表左右开放
        const stave = NotationRenderer.createStave(x, TOP + si * STAFF_GAP, 100, metered ? {} : undefined);
        if (mi === 0) { stave.addClef(clefNow[si]); if (score.key) stave.addKeySignature(score.key); if (score.time) stave.addTimeSignature(score.time); }
        else if (changed[si]) stave.addClef(clefNow[si]);
        return stave;
      });
      if (mi === 0 && grand) VF.Stave.formatBegModifiers(staves);
      const lead = staves[0].getNoteStartX() - x;
      staves.forEach(stave => stave.setWidth(lead + content + 14));
      staves.forEach(stave => stave.setContext(ctx).draw());
      if (mi === 0) firstStaves.push(...staves);
      // 声部
      const allVoices = [], perStave = [], beams = [], ties = [], formatter = new VF.Formatter();
      score.staves.forEach((staffName, si) => {
        const clef = clefNow[si], stave = staves[si], voicesSrc = measure[staffName] || [];
        const accState = new Map();
        const voices = voicesSrc.map((src, vi) => {
          const stem = voicesSrc.length > 1 ? (vi === 0 ? 1 : -1) : undefined;
          let local = 0, pendingTie = null;
          const notes = src.split(' ').map(token => {
            const t = parseToken(token);
            // 休止符的高度：两个声部时，上声部的休止符放高、下声部的放低，免得盖住另一个声部的音
            const multi = voicesSrc.length > 1;
            const keys = t.rest ? [clef === 'bass' ? (multi ? (vi === 0 ? 'b/3' : 'f/2') : 'd/3') : (multi ? (vi === 0 ? 'f/5' : 'f/4') : 'b/4')]
              : t.pitches.map(p => p.letter.toLowerCase() + (p.acc === 'n' ? '' : p.acc) + '/' + p.octave);
            const note = new VF.StaveNote({clef, keys, duration: t.base + (t.dotted ? 'd' : '') + (t.rest ? 'r' : ''), ...(stem ? {stem_direction: stem} : {}), auto_stem: !stem});
            note.setStave(stave);
            if (t.dotted) VF.Dot.buildAndAttach([note], {all: true});
            t.pitches.forEach((p, i) => {
              // 同一小节里已经写过的升降号继续有效；还没写过的，按调号（score.key）
              const key = p.letter + p.octave, want = p.acc === 'n' ? '' : p.acc, now = accState.has(key) ? accState.get(key) : keyAcc(p.letter);
              if (p.acc === 'n' || want !== now) note.addModifier(new VF.Accidental(want || 'n'), i);
              accState.set(key, want);
            });
            if (t.plus) note.addModifier(new VF.Annotation('+').setVerticalJustification(VF.Annotation.VerticalJustify.TOP), 0);
            const start = beat + local;
            if (pendingTie) { ties.push([pendingTie.note, note]); pendingTie.event.dur += t.beats; }
            let event = null;
            if (!t.rest && !pendingTie) {
              event = {keys: t.pitches.map(soundName), start, dur: t.beats};
              events.push(event);
              // 拍点：有新的音开始的位置（休止与延音线后半不算）
              const key = posKey(mi, local);
              if (!onsets.has(key)) onsets.set(key, {key, start, notes: []});
              onsets.get(key).notes.push(note);
            }
            if (si === 0 && !t.rest) topNotes.push(note);
            pendingTie = t.tie ? {note, event: event || pendingTie.event} : null;
            local += t.beats;
            return note;
          });
          const voice = new VF.Voice({num_beats: 4, beat_value: 4}).setMode(VF.Voice.Mode.SOFT).addTickables(notes);
          beams.push(...VF.Beam.generateBeams(notes, {beam_rests: false, ...(compound ? {groups: [new VF.Fraction(3, 8)]} : {}), ...(stem ? {stem_direction: stem} : {})}));
          return voice;
        });
        if (voices.length) {
          formatter.joinVoices(voices);
          perStave.push([stave, voices]);
          allVoices.push(...voices);
        }
      });
      if (allVoices.length) formatter.format(allVoices, content);
      // 单个柱式和弦：符头中心移到谱表正中
      if (single) {
        const notes = allVoices.flatMap(v => v.getTickables());
        const head = notes[0], middle = x + staves[0].getWidth() / 2;
        const shift = middle - (head.getNoteHeadBeginX() + head.getNoteHeadEndX()) / 2;
        new Set(notes.map(n => n.getTickContext())).forEach(tc => tc.setX(tc.getX() + shift));
      }
      perStave.forEach(([stave, voices]) => voices.forEach(v => v.draw(ctx, stave)));
      beams.forEach(b => b.setContext(ctx).draw());
      ties.forEach(([a, b]) => new VF.StaveTie({first_note: a, last_note: b, first_indices: [0], last_indices: [0]}).setContext(ctx).draw());
      // 小节长度（以四分音符为一拍）：按拍号；6/8 = 3 拍。弱起小节按实际写的音符算
      const length = measure.pickup ? Math.max(...score.staves.flatMap(c => (measure[c] || []).map(v => v.split(' ').reduce((s, t) => s + parseToken(t).beats, 0)))) : barBeats;
      beat += length;
      x += staves[0].getWidth();
    });
    if (grand) {
      new VF.StaveConnector(firstStaves[0], firstStaves[1]).setType('brace').setContext(ctx).draw();
      new VF.StaveConnector(firstStaves[0], firstStaves[1]).setType('singleLeft').setContext(ctx).draw();
    }
    const width = x + 12, height = TOP + (score.staves.length - 1) * STAFF_GAP + 110;
    renderer.resize(width, height);
    const svg = host.querySelector('svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.querySelectorAll('text').forEach(t => t.setAttribute('stroke', 'none'));
    // 记号的基线：在上方谱表最高的音（含符干）之上
    const highest = Math.min(firstStaves[0].getYForLine(0), ...topNotes.map(n => { try { return n.getBoundingBox().getY(); } catch { return Infinity; } }));
    const positions = [...onsets.values()].sort((a, b) => a.start - b.start).map(o => ({
      key: o.key, start: o.start,
      x: Math.min(...o.notes.map(n => n.getNoteHeadBeginX())),
      keys: events.filter(e => e.start === o.start).flatMap(e => e.keys)
    }));
    fit(host, svg, width, height);
    return {svg, events, positions, baseline: Math.min(TOP - 12, highest - 8), width, height, segments, score};
  }
  // 小谱例放大到可读宽度（不超过卡片）；长谱例（第 27 题）保持可读尺寸，横向滚动。
  function fit(host, svg, width, height) {
    const avail = host.clientWidth || 340;
    const scale = Math.max(.85, Math.min(1.5, avail / width));
    svg.style.width = width * scale + 'px';
    svg.style.height = height * scale + 'px';
    svg.removeAttribute('width'); svg.removeAttribute('height');
  }
  /* 长谱例横向滚动时，谱号、调号、拍号（大谱表还有花括号）固定在左边：
     另画一小段谱表（只有谱号、调号、拍号），盖在滚动区的左侧；谱号按左边正在显示的小节换（如左手换成高音谱号）。
     滚到最左时隐藏。update() 在谱面高度改变后调用。 */
  function pinStart(scroller, result) {
    const pin = el('div', 'score-pin');
    pin.setAttribute('aria-hidden', 'true');
    scroller.parentNode.insertBefore(pin, scroller);
    const {score, segments} = result, grand = score.staves.length > 1;
    let drawn = '', pinWidth = 0;
    function draw(clefs) {
      const key = clefs.join();
      if (key === drawn) return;
      drawn = key;
      pin.replaceChildren();
      const renderer = NotationRenderer.createRenderer(pin), ctx = renderer.getContext();
      const x = grand ? 30 : 12;
      const staves = clefs.map((clef, si) => {
        const stave = NotationRenderer.createStave(x, TOP + si * STAFF_GAP, 60, {});
        stave.addClef(clef); if (score.key) stave.addKeySignature(score.key); if (score.time) stave.addTimeSignature(score.time);
        return stave;
      });
      if (grand) VF.Stave.formatBegModifiers(staves);
      pinWidth = staves[0].getNoteStartX() + 4;
      staves.forEach(stave => { stave.setWidth(pinWidth - x); stave.setEndBarType(VF.Barline.type.NONE); stave.setContext(ctx).draw(); });
      if (grand) {
        new VF.StaveConnector(staves[0], staves[1]).setType('brace').setContext(ctx).draw();
        new VF.StaveConnector(staves[0], staves[1]).setType('singleLeft').setContext(ctx).draw();
      }
      size();
    }
    function size() {
      const svg = pin.querySelector('svg'); if (!svg) return;
      const scale = parseFloat(result.svg.style.width) / result.width;
      const view = result.svg.getAttribute('viewBox').split(' ').map(Number);  // 谱面上方为叠高的记号留出的位置也要对齐
      svg.setAttribute('viewBox', `0 ${view[1]} ${pinWidth} ${view[3]}`);
      svg.removeAttribute('width'); svg.removeAttribute('height');
      svg.style.width = pinWidth * scale + 'px'; svg.style.height = result.svg.style.height;
      svg.querySelectorAll('text').forEach(t => t.setAttribute('stroke', 'none'));
      const area = pin.offsetParent.getBoundingClientRect(), box = scroller.getBoundingClientRect();
      pin.style.top = result.svg.getBoundingClientRect().top - area.top + 'px';
      pin.style.left = box.left + scroller.clientLeft - area.left + 'px';
    }
    function onScroll() {
      const scale = parseFloat(result.svg.style.width) / result.width;
      const at = scroller.scrollLeft / scale + pinWidth;  // 盖住的地方右边第一个能看见的位置
      const segment = [...segments].reverse().find(sg => sg.x <= at) || segments[0];
      draw(segment.clefs);
      pin.classList.toggle('is-on', scroller.scrollLeft > 4);
    }
    scroller.addEventListener('scroll', onScroll, {passive: true});
    requestAnimationFrame(() => { draw(segments[0].clefs); onScroll(); });
    return {update: () => { if (drawn) size(); }};
  }
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const FINE_POINTER = matchMedia('(hover: hover) and (pointer: fine)').matches;
  let submittedAt = 0;
  function svgEl(svg, tag, attrs, first = false) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    if (first) svg.insertBefore(node, svg.firstChild); else svg.append(node);
    return node;
  }
  // 在谱例上方写和弦记号（黑色印刷体）。左缘对齐和弦的符头（标准记谱：记号标在和弦开始的位置）。
  function writeSymbol(result, x, [root, suffix, bass]) {
    const group = svgEl(result.svg, 'g', {class: 'answer-symbol'});
    drawSymbol(group, x, result.baseline, {root, suffix, bass, size: SYMBOL_SIZE, color: '#000000'});
  }
  function playEvents(events) {
    if (!events.length) return;
    const t0 = Math.min(...events.map(e => e.start)), spb = 60 / (data.tempo || 72);
    const notes = [], offsets = [], durations = [];
    events.forEach(e => e.keys.forEach(k => { notes.push(k); offsets.push((e.start - t0) * spb); durations.push(e.dur * spb); }));
    Sound.play(notes, offsets, durations);
  }
  const preload = events => Sound.preload([...new Set(events.flatMap(e => e.keys))]);

  /* ---------- 写和弦：点击谱表写音 ---------- */
  const E4 = 4 * 7 + 2; // 以「级」计：八度 × 7 + 字母序号
  const LOW = -6, HIGH = 17; // 可写的音域：F3 – A6（延伸音和弦的密集排列也写得下）
  const stepPitch = step => { const n = E4 + step; return {letter: LETTERS[n % 7], octave: Math.floor(n / 7)}; };
  const pitchStep = p => p.octave * 7 + LETTERS.indexOf(p.letter) - E4;
  const noteName = n => n.letter + n.acc + n.octave;
  function renderEntry(host, notes, selected, onPick) {
    host.replaceChildren();
    const renderer = NotationRenderer.createRenderer(host);
    const ctx = renderer.getContext();
    const width = 260, height = 210;
    renderer.resize(width, height);
    const stave = NotationRenderer.createStave(10, 75, width - 20);
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
      // 符头居中
      const tick = note.getTickContext();
      tick.setX(tick.getX() + width / 2 - (note.getNoteHeadBeginX() + note.getNoteHeadEndX()) / 2);
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
      const step = Math.max(LOW, Math.min(HIGH, Math.round((bottom - y) / half)));
      onPick(step);
    });
  }

  /* ---------- 判题 ---------- */
  function judgeName(q, draft) {
    if (typeof firstOf(q.answer) === 'string') {
      // 几种写法：符合任何一种就算对；都不符合时，按标准写法给提示
      const answers = [].concat(q.answer);
      for (const answer of answers) { const result = judgeSymbol({...q, answer}, draft); if (result.ok) return {...result, msg: result.msg.replace(answerSymbol(answer), answerSymbol(answers[0]))}; }
      return judgeSymbol({...q, answer: answers[0]}, draft);
    }
    const a = q.answer, typed = ChordInput.parse(draft.text);
    if (!typed.quality) return {ok: false, msg: '这一课只写三和弦记号：根音加三和弦的后缀。'};
    const root = typed.root + typed.rootAcc, bass = typed.bass ? typed.bass + typed.bassAcc : '', quality = typed.quality;
    if (root !== a.root) {
      if (a.bass && root === a.bass) return {ok: false, msg: '低音不一定是根音。先把这几个音按三度叠置，最下面的才是根音。'};
      if (pc(root) === pc(a.root)) return {ok: false, msg: '音高对了，但根音要按谱面上的音名拼写。'};
      return {ok: false, msg: '根音不对。把这几个音按三度叠置，看看从哪个音开始。'};
    }
    if (quality !== a.quality) {
      if (typed.suffix === '−' && a.quality === 'dim') return {ok: false, msg: '「−」表示小三和弦；减三和弦用「°」或 dim。'};
      return {ok: false, msg: '根音对了。再算一算根音到三音、根音到五音的音程。'};
    }
    if (bass && bass === root) return {ok: false, msg: '低音就是根音时不写斜线，只写和弦本身。'};
    if (!a.bass && bass) return {ok: false, msg: '这个和弦的低音就是根音，不需要斜线。'};
    if (a.bass && !bass) return {ok: false, msg: '和弦写对了。再看最低的音：它不是根音，要用斜线写出低音。'};
    if (a.bass && bass !== a.bass) return {ok: false, msg: pc(bass) === pc(a.bass) ? '低音的音高对了，但要按谱面上的音名拼写。' : '斜线后面写的是谱面上最低的那个音。'};
    let msg = `${answerSymbol(a)}　${q.tones}`;
    if (typed.suffix === '△') msg += '<br>提醒：用 △ 表示大三和弦的写法不常用，一般会读作七和弦（maj7）。三和弦直接写根音就好。';
    if (q.note) msg += '<br>' + q.note;
    return {ok: true, msg};
  }
  // 第二课起：比较根音、低音与和弦结构（同一个和弦的不同写法都算对，例如 Cø7 = Cm7(♭5)）
  const degreeOf = (parsed, d) => [...parsed.chord.entries()].filter(([k]) => parseInt(k) === d).map(([, v]) => v).sort().join();
  function judgeSymbol(q, draft) {
    const a = ChordInput.parse(q.answer), t = ChordInput.parse(draft.text);
    const root = t.root + t.rootAcc, want = a.root + a.rootAcc;
    const bass = t.bass ? t.bass + t.bassAcc : '', wantBass = a.bass ? a.bass + a.bassAcc : '';
    if (root !== want) {
      if (wantBass && root === wantBass) return {ok: false, msg: '低音不一定是根音。先把这些音按三度叠置，找出根音。'};
      if (pc(root) === pc(want)) return {ok: false, msg: '音高对了，但根音要按谱面上的音名拼写。'};
      return {ok: false, msg: '根音不对。把这些音按三度叠置，看看从哪个音开始。'};
    }
    if (t.key !== a.key) {
      const differs = d => degreeOf(t, d) !== degreeOf(a, d);
      if (differs(3) || differs(2) || differs(4)) return {ok: false, msg: '根音对了。再看三音：是大三度、小三度，还是被挂留音（sus）替代了？'};
      if (differs(5)) return {ok: false, msg: '三音对了。再看五音：纯五度、增五度还是减五度？'};
      if (!degreeOf(t, 7) !== !degreeOf(a, 7)) return {ok: false, msg: degreeOf(a, 7) ? '这个和弦有七音。' : '这个和弦没有七音。'};
      if (differs(7)) return {ok: false, msg: '七音的性质不对：大七度、小七度还是减七度？'};
      return {ok: false, msg: '和弦主体对了。再逐个算一算延伸音、附加音或变化音与根音的音程。'};
    }
    if (bass && bass === root) return {ok: false, msg: '低音就是根音时不写斜线，只写和弦本身。'};
    if (!wantBass && bass) return {ok: false, msg: '这个和弦的低音就是根音，不需要斜线。'};
    if (wantBass && !bass) return {ok: false, msg: '和弦写对了。再看最低的音：它不是根音，要用斜线写出低音。'};
    if (wantBass && bass !== wantBass) return {ok: false, msg: pc(bass) === pc(wantBass) ? '低音的音高对了，但要按谱面上的音名拼写。' : '斜线后面写的是谱面上最低的那个音。'};
    let msg = `${answerSymbol(q.answer)}　${q.tones}`;
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
    const lowest = notes.reduce((lo, n) => midiOf(noteName(n)) < midiOf(noteName(lo)) ? n : lo);
    if (lowest.letter + lowest.acc !== q.bass) return {ok: false, msg: q.symbol[2] ? '和弦音都对了。斜线后面的音要放在最低。' : '和弦音都对了。这个记号没有斜线，最低的音应该是根音。'};
    return {ok: true, msg: buildAnswer(q)};
  }
  const buildAnswer = q => `${chordSymbol(...q.symbol)}　${q.notes.map(show).join('–')}，低音 ${show(q.bass)}`;
  // 谱例分析：逐个位置检查。marks：位置 → right / wrong / missing
  /* 谱例分析的判题（规范 L21 答案库）
     chords[] 每一项：
       at        和弦开始的位置 [小节, 拍]；先现的和弦可以写几个位置 [[小节, 拍], [小节, 拍]]，写在任何一个都算对
       answer    规范写法（一个，或几个同样规范的写法）
       accept    可接受的写法：算对、给满分，同时提示规范写法
       optional  可写可不写：写对了算对，不写不扣分
     评分（老师 2026-11-08 确认）：
       - 得分 = 写对的必写和弦 ÷（必写和弦数 ＋ 写错位置或写错的多余记号数）；正确率用第一次检查的得分。
       - 同一个和弦延续时又写了一次（「重复写了」）：只提示，不扣分。
       - 全部必写的和弦都写对、没有写错的记号，这题才算完成。 */
  const positionsOf = c => (Array.isArray(c.at[0]) ? c.at : [c.at]).map(at => posKey(...at));
  function judgeChord(chord, draft) {
    const result = judgeName(chord, draft);
    if (result.ok || !chord.accept) return result;
    for (const answer of [].concat(chord.accept)) {
      if (judgeName({...chord, answer}, draft).ok) return {ok: true, msg: `${answerSymbol(answer)} 也可以；规范的写法是 ${answerSymbol(chord.answer)}。`, tip: true};
    }
    return result;
  }
  function judgeAnalysis(q, entries) {
    hasPickup = !!q.score.measures[0].pickup; firstBar = q.score.firstBar || 1;
    const issues = [], tips = [], marks = {}, used = new Set();
    let right = 0, extra = 0;
    const required = q.chords.filter(c => !c.optional);
    // 1. 每个和弦：在它可以写的位置里找学生的记号
    q.chords.forEach(chord => {
      const keys = positionsOf(chord), key = keys.find(k => entries.has(k));
      if (!key) {
        if (chord.optional) return;
        marks[keys[0]] = 'missing';
        issues.push(`${where(keys[0])}：漏写了。这里是一个和弦的起始位置，从这里开始的音组成 ${answerSymbol(chord.answer)}（${chord.tones}）。`);
        return;
      }
      keys.filter(k => entries.has(k)).forEach(k => used.add(k));
      const result = judgeChord(chord, entries.get(key));
      marks[key] = result.ok ? 'right' : 'wrong';
      if (result.ok && !chord.optional) right++;
      if (!result.ok) { issues.push(`${where(key)}：${result.msg}`); if (chord.optional) extra++; }
      if (result.tip) tips.push(`${where(key)}：${result.msg}`);
    });
    // 2. 其他位置上的记号：同一个和弦延续时重复写了（只提示），或者写错了位置
    const starts = q.chords.map(c => ({chord: c, key: positionsOf(c)[0]})).sort((a, b) => byPosition(a.key, b.key));
    [...entries.keys()].filter(k => !used.has(k)).sort(byPosition).forEach(key => {
      const sounding = starts.filter(x => byPosition(x.key, key) <= 0).pop();
      if (sounding && judgeName(sounding.chord, entries.get(key)).ok) {
        marks[key] = 'repeat';
        tips.push(`${where(key)}：同一个和弦还在延续，不用再写一次（不扣分）。`);
        return;
      }
      marks[key] = 'wrong'; extra++;
      issues.push(`${where(key)}：这里不是当前和弦的起始位置。`);
    });
    const credit = required.length ? right / (required.length + extra) : 1;
    const score = `写对 ${right} / ${required.length} 个和弦${extra ? `，多写错 ${extra} 个` : ''}`;
    if (issues.length) return {ok: false, credit, marks, msg: [score, ...issues, ...tips].join('<br>')};
    return {ok: true, credit, marks, msg: [...q.chords.map(c => `${where(positionsOf(c)[0])}：${answerSymbol(c.answer)}　${c.tones}${c.note ? '（' + c.note + '）' : ''}`), ...tips].join('<br>')};
  }
  const byPosition = (a, b) => { const [m1, b1] = a.split(':').map(Number), [m2, b2] = b.split(':').map(Number); return m1 - m2 || b1 - b2; };

  // 学生这次的作答，写进练习报告（只有答错时会用到）
  function answerText(q, draft) {
    if (q.type === 'build') return draft.notes.map(n => show(n.letter + n.acc) + n.octave).join('–') || '（空）';
    if (q.type === 'analysis') return [...draft.entries.keys()].sort(byPosition).map(k => `${k.replace(':', '.')} ${draftText(draft.entries.get(k))}`).join('，') || '（空）';
    return draftText(draft);
  }

  /* ---------- 状态 ---------- */
  QS.forEach(prepare);
  const engine = PracticeEngine.create({code: data.code, title: data.title, reportTitle: data.reportTitle,
    questions: QS.map(q => ({id: q.id, type: 'single-choice', options: [{value: 'ok'}, {value: 'no'}], correctAnswer: ['ok']}))});
  const freshDraft = q => q.type === 'build' ? {notes: [], selected: -1} : q.type === 'analysis' ? {entries: new Map(), current: null, marks: {}} : emptyName();
  let drafts = QS.map(freshDraft);
  const feedbacks = QS.map(() => null);
  const groupIndex = i => data.groups.reduce((found, g, k) => QS.findIndex(q => q.id === g.from) <= i ? k : found, 0);

  /* ---------- 页面外壳（与 practice-ui.js 相同的结构） ---------- */
  app.classList.add('cs-plain');
  app.innerHTML = `<main class="app-container">
    <header class="app-header">
      <div class="header-top-bar">
        <span class="header-title-left">${data.brand || 'MUSIC THEORY · CHORD SYMBOL'}</span>
        <div class="header-right-group">
          <span class="question-counter hidden" id="questionCounter"></span>
          <span class="header-title-right">LESSON ${data.code.slice(-2)}</span>
          <button class="history-toggle-btn" id="historyToggleBtn" type="button">历史记录</button>
        </div>
      </div>
      <div class="progress-bar-container"><div class="progress-bar" id="progressBar"></div></div>
    </header>

    <section class="card-container" id="startScreen">
      <div class="start-header">
        <p class="subtitle">${data.subtitle}</p>
        <h1 class="main-title">${data.title}</h1>
      </div>
      <div class="start-info">
        <p>• 本练习共 <strong>${QS.length} 个题目</strong>：看谱写记号、看记号写和弦、分解和弦与谱例分析。刷新或关闭页面后，本次练习进度将不会保留。</p>
        <p>• 答对才能进入下一题；答错会给出提示，可以再试。正确率按一次答对的题数计算。</p>
        <p>• 点谱例可以播放；iPhone 请先关闭静音模式。</p>
        <p>• 全部完成后，可复制练习结果发送给老师获取本课评价。</p>
      </div>
      <button class="primary-btn start-btn" id="startPracticeBtn" type="button">开始练习</button>
    </section>

    <section class="card-container hidden" id="questionCard">
      <div class="question-nav-wrapper" id="questionNavWrapper">
        <button class="question-nav-toggle" id="questionNavToggle" type="button" aria-expanded="false" aria-controls="questionNav">
          <span>题目导航</span>
          <span class="question-nav-toggle-icon" aria-hidden="true">⌄</span>
        </button>
        <nav class="question-nav chord-nav" id="questionNav" aria-label="题目导航"></nav>
      </div>
      <div class="type-badge-wrapper"><span class="type-badge single" id="typeBadge"></span></div>
      <h2 class="question-prompt" id="questionPrompt"></h2>
      <div class="chord-area" id="chordArea"></div>
      <div role="status" aria-live="polite" class="feedback-box hidden" id="feedbackBox">
        <div class="feedback-header">
          <span class="feedback-status-icon" id="feedbackIcon">✓</span>
          <span class="feedback-title" id="feedbackTitle">回答正确</span>
        </div>
        <p class="explanation-text" id="explanationText"></p>
      </div>
      <button class="secondary-btn hidden" id="backToResultBtn" type="button">返回结果</button>
      <div class="card-actions-grid">
        <button class="secondary-btn" id="prevBtn" type="button" title="快捷键：←" disabled>上一题</button>
        <button class="primary-btn" id="confirmBtn" type="button" title="快捷键：回车" disabled>提交</button>
        <button class="primary-btn hidden" id="nextBtn" type="button" title="快捷键：回车 或 →">下一题</button>
      </div>
    </section>

    <section class="card-container hidden" id="resultScreen">
      <h2 class="result-title">🎉 练习完成</h2>
      <div class="question-nav-wrapper expanded" id="resultQuestionNavWrapper">
        <button class="question-nav-toggle" id="resultQuestionNavToggle" type="button" aria-expanded="true" aria-controls="resultQuestionNav">
          <span>题目导航 · 点击题号回看</span>
          <span class="question-nav-toggle-icon" aria-hidden="true">⌄</span>
        </button>
        <nav class="question-nav chord-nav" id="resultQuestionNav" aria-label="完成后的题目导航"></nav>
      </div>
      <div class="result-stats-grid">
        <div class="stat-card"><span class="stat-value" id="resAccuracy">100%</span><span class="stat-label">正确率（一次答对 ÷ 总题数）</span></div>
        <div class="stat-card"><span class="stat-value" id="resTotalTime">00:00</span><span class="stat-label">答题总时长</span></div>
        <div class="stat-card"><span class="stat-value" id="resFirstPass">0/0</span><span class="stat-label">一次答对</span></div>
      </div>
      <div class="detail-list-wrapper">
        <h3>逐题答题记录（含错误尝试）</h3>
        <div class="detail-list" id="detailList"></div>
      </div>
      <div class="result-actions">
        <button class="primary-btn copy-btn" id="copyResultBtn" type="button">复制结果</button>
        <button class="secondary-btn" id="restartBtn" type="button">重新练习</button>
      </div>
    </section>

    <div class="modal-overlay hidden" id="historyModal" role="dialog" aria-modal="true" aria-labelledby="historyTitle">
      <div class="modal-card">
        <div class="modal-header">
          <h2 id="historyTitle">会话历史练习记录</h2>
          <button class="close-btn" id="closeHistoryBtn" type="button" aria-label="关闭历史记录">✕</button>
        </div>
        <p class="modal-tip">💡 只要不关闭/刷新页面，您本次会话中的所有练习记录都会自动保存在这里。</p>
        <div class="history-list" id="historyList"></div>
      </div>
    </div>

    <div class="return-home-wrap">
      <button class="return-home-link" id="returnHomeBtn" type="button">← 返回课程首页</button>
    </div>
    <footer class="app-footer">©Sheen · Music Theory</footer>
  </main>`;
  const byId = id => document.getElementById(id);
  const showEl = (id, visible) => byId(id).classList.toggle('hidden', !visible);
  const text = (id, value) => { byId(id).textContent = value; };
  const number = i => QS[i].label.padStart(2, '0');

  /* ---------- 题目导航：按题型分组，按钮与音程练习相同 ---------- */
  function buttonNav(id, state, result = false) {
    const nav = byId(id); nav.replaceChildren();
    data.groups.forEach((group, g) => {
      nav.append(el('span', 'question-nav-group', group.badge));
      QS.forEach((q, index) => {
        if (groupIndex(index) !== g) return;
        const stat = state.stats[index];
        const status = PracticeEngine.questionStatus(stat);
        const button = el('button', 'question-nav-btn ' + status, number(index));
        button.type = 'button';
        const label = {unanswered: '未作答', attempted: '已尝试', solved: '一次答对', 'needs-review': '需要复习'}[status];
        button.setAttribute('aria-label', `${result ? '回看' : '跳转到'}第 ${q.label} 题，${label}`);
        if (!result && index === state.index) { button.classList.add('current'); button.setAttribute('aria-current', 'step'); }
        button.onclick = () => { if (!result && index === state.index) return; result ? engine.review(index) : engine.goTo(index); render(); };
        nav.append(button);
      });
    });
  }
  function feedback(correct, message) {
    showEl('feedbackBox', true);
    byId('feedbackBox').classList.toggle('correct-bg', correct);
    byId('feedbackBox').classList.toggle('wrong-bg', !correct);
    text('feedbackIcon', correct ? '✓' : '✕');
    text('feedbackTitle', correct ? '回答正确！' : '回答错误，请再试一次！');
    byId('explanationText').innerHTML = message;
  }
  // 谱例分析：至少写了一个记号，且写了的都完整（只点了位置、还没选根音的不算）
  const analysisReady = d => { const written = [...d.entries.values()].filter(x => x.text.trim()); return written.length > 0 && written.every(nameReady); };
  const ready = (q, d) => q.type === 'build' ? d.notes.length > 0 : q.type === 'analysis' ? analysisReady(d) : nameReady(d);
  const refreshConfirm = () => {
    const s = engine.state(), q = QS[s.index];
    byId('confirmBtn').disabled = !ready(q, drafts[s.index]);
  };

  function render() {
    const s = engine.state(), playing = s.mode === 'practice', review = s.mode === 'review';
    showEl('startScreen', s.mode === 'start'); showEl('questionCard', playing || review);
    showEl('resultScreen', s.mode === 'result'); showEl('questionCounter', playing || review);
    byId('progressBar').style.width = `${s.total ? s.solved / s.total * 100 : 0}%`;
    if (s.mode === 'result') { renderResults(s); return; }
    if (!playing && !review) return;
    Sound.stop();
    const i = s.index, q = QS[i], stat = s.stats[i], group = data.groups[groupIndex(i)];
    const solved = stat.isSolved, locked = solved || review;
    text('questionCounter', `${i + 1} / ${s.total}`);
    byId('prevBtn').disabled = i === 0;
    text('typeBadge', group.badge);
    text('questionPrompt', `${q.label}. ${group.hint}`);
    const area = byId('chordArea'); area.replaceChildren();
    if (q.type === 'build') buildQuestion(q, i, area, locked, review);
    else if (q.type === 'analysis') analysisQuestion(q, i, area, locked, review);
    else nameQuestion(q, i, area, locked, review);
    showEl('feedbackBox', false);
    if (solved || review) feedback(true, feedbacks[i]?.ok ? feedbacks[i].msg : reviewAnswer(q));
    else if (feedbacks[i]) feedback(false, feedbacks[i].msg);
    showEl('confirmBtn', !locked);
    refreshConfirm();
    showEl('nextBtn', solved && (!review || i < s.total - 1));
    text('nextBtn', review ? '下一题' : s.solved === s.total ? '结束练习' : '下一题');
    showEl('backToResultBtn', review);
    buttonNav('questionNav', s);
  }
  function reviewAnswer(q) {
    if (q.type === 'build') return '答案：' + buildAnswer(q);
    if (q.type === 'analysis') return judgeAnalysis(q, new Map(q.chords.map(c => [posKey(...c.at), answerDraft(c.answer)]))).msg;
    return `答案：${answerSymbol(q.answer)}　${q.tones}${q.note ? '<br>' + q.note : ''}`;
  }

  /* ---------- 看谱写记号 ---------- */
  function nameQuestion(q, i, box, locked) {
    const score = el('div', 'staff-question chord-score tap-to-play');
    score.setAttribute('aria-label', '谱例，点击播放');
    box.append(score);
    const result = renderScore(score, q.score);
    preload(result.events);
    score.addEventListener('click', () => { Sound.wake(); playEvents(result.events); });
    const d = drafts[i];
    // 答对后：在和弦符头的正上方写出学生写的记号；回看时没有记录就写标准答案
    if (locked) {
      const parts = nameReady(d) && feedbacks[i]?.ok ? draftParts(d) : [show(q.answer.root), SUFFIX[q.answer.quality], q.answer.bass ? show(q.answer.bass) : ''];
      writeSymbol(result, result.positions[0].x, parts);
      return;
    }
    box.append(el('p', 'chord-tip', '点谱例可以播放。'));
    const input = ChordInput.field({value: d.text, guide: data.inputGuide,
      onInput: value => { d.text = value; refreshConfirm(); },
      onEnter: () => { if (!byId('confirmBtn').disabled) byId('confirmBtn').click(); }});
    box.append(input.element);
    // 电脑上进入新题（或答错后）光标直接落在输入框里，不用先点
    if (FINE_POINTER) requestAnimationFrame(() => input.input.focus({preventScroll: true}));
  }

  /* ---------- 看记号写和弦 ---------- */
  function buildQuestion(q, i, box, locked, review) {
    box.append(el('p', 'chord-target', chordSymbol(...q.symbol)));
    const d = drafts[i];
    const staff = el('div', 'staff-question chord-entry');
    box.append(staff);
    const shown = () => review && !feedbacks[i]?.ok ? spellUp(q) : d.notes;
    const draw = () => {
      renderEntry(staff, shown(), locked ? -1 : d.selected, locked ? () => { Sound.wake(); Sound.play(shown().map(noteName)); } : step => {
        const p = stepPitch(step), at = d.notes.findIndex(n => pitchStep(n) === step);
        if (at >= 0) d.selected = at;
        else { d.notes.push({...p, acc: ''}); d.selected = d.notes.length - 1; }
        Sound.wake(); Sound.play([noteName(d.notes[d.selected])]);
        draw(); refreshConfirm();
      });
    };
    draw();
    const play = el('div', 'chord-play');
    const playBtn = el('button', 'secondary-btn chord-small', '▶ 播放和弦'); playBtn.type = 'button';
    playBtn.addEventListener('click', () => { const notes = shown(); if (notes.length) { Sound.wake(); Sound.play(notes.map(noteName)); } });
    play.append(playBtn); box.append(play);
    if (locked) return;
    const tools = el('div', 'chord-tools');
    const tool = (label, fn, title) => {
      const b = el('button', 'chord-key', label); b.type = 'button'; if (title) b.setAttribute('aria-label', title);
      b.addEventListener('click', () => { if (fn() !== false) { draw(); refreshConfirm(); } });
      tools.append(b);
    };
    const sel = () => d.notes[d.selected];
    const replay = () => { Sound.wake(); Sound.play([noteName(sel())]); };
    // 降号：再点一次变成重降（C°7 的七音 B𝄫），第三次去掉
    tool(chordSymbol('♭'), () => { if (!sel()) return false; sel().acc = {'': 'b', b: 'bb'}[sel().acc] || ''; replay(); }, '降号');
    tool(chordSymbol('♮'), () => { if (!sel()) return false; sel().acc = ''; replay(); }, '还原');
    tool(chordSymbol('♯'), () => { if (!sel()) return false; sel().acc = sel().acc === '#' ? '' : '#'; replay(); }, '升号');
    tool('↑', () => { if (!sel()) return false; const s = Math.min(HIGH, pitchStep(sel()) + 1); if (d.notes.some(n => pitchStep(n) === s)) return false; Object.assign(sel(), stepPitch(s)); replay(); }, '上移');
    tool('↓', () => { if (!sel()) return false; const s = Math.max(LOW, pitchStep(sel()) - 1); if (d.notes.some(n => pitchStep(n) === s)) return false; Object.assign(sel(), stepPitch(s)); replay(); }, '下移');
    tool('删除', () => { if (!sel()) return false; d.notes.splice(d.selected, 1); d.selected = d.notes.length - 1; });
    tool('清空', () => { d.notes = []; d.selected = -1; });
    box.append(el('p', 'chord-tip', '点谱表写音（会发声）；点已有的音可以选中它，再加升降号或上下移动。'), tools);
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

  /* ---------- 谱例分析 ----------
     任何有音符的拍点都可以点；点中后在下方拼记号，记号写在那个拍点的符头正上方（黑色印刷体）。
     提交后：写错位置、记号不对的标红；漏写的位置用虚线框标出。 */
  function analysisQuestion(q, i, box, locked, review) {
    const d = drafts[i];
    hasPickup = !!q.score.measures[0].pickup; firstBar = q.score.firstBar || 1;
    const entries = review && !feedbacks[i]?.ok
      ? new Map(q.chords.map(c => [posKey(...c.at), answerDraft(c.answer)]))
      : d.entries;
    const score = el('div', 'staff-question chord-score is-wide');
    box.append(score);
    const result = renderScore(score, q.score);
    preload(result.events);
    const pin = pinStart(score, result);
    const {svg, positions, baseline, height} = result;
    const layer = svgEl(svg, 'g', {class: 'analysis-layer'}, true);
    const symbols = svgEl(svg, 'g', {class: 'analysis-symbols'});
    const half = k => {
      const prev = positions[k - 1], next = positions[k + 1], at = positions[k].x;
      return [prev ? (prev.x + at) / 2 : at - 16, next ? (next.x + at) / 2 : at + 22];
    };
    const width = result.width, scale = parseFloat(svg.style.width) / width;
    function paint() {
      layer.replaceChildren(); symbols.replaceChildren();
      // 记号：挤在一起时自动往上叠一行（stackSymbols）
      const written = positions.filter(p => entries.has(p.key) && nameReady(entries.get(p.key)));
      const {placed, top} = stackSymbols(symbols, written.map(p => {
        const [root, suffix, bass] = draftParts(entries.get(p.key));
        return {x: p.x, symbol: {root, suffix, bass, size: SYMBOL_SIZE, color: d.marks[p.key] === 'wrong' && !locked ? '#b91c1c' : '#000000'}};
      }), baseline);
      const boxOf = new Map(written.map((p, n) => [p.key, placed[n].box]));
      // 记号叠高后，谱例向上留出位置
      const extra = Math.max(0, Math.ceil(6 - top));
      svg.setAttribute('viewBox', `0 ${-extra} ${width} ${height + extra}`);
      svg.style.height = (height + extra) * scale + 'px';
      positions.forEach((p, k) => {
        const [left, right] = half(k), mark = locked ? '' : d.marks[p.key] || '';
        if (p.key === d.current && !locked) svgEl(layer, 'rect', {x: left + 1, y: 2 - extra, width: right - left - 2, height: height + extra - 4, rx: 5, class: 'analysis-current'});
        if (mark === 'wrong' || mark === 'missing' || mark === 'repeat') {
          const box = boxOf.get(p.key) || {x: p.x, y: baseline - SYMBOL_SIZE, width: 18, height: SYMBOL_SIZE + 4};
          svgEl(layer, 'rect', {x: box.x - 4, y: box.y - 3, width: box.width + 8, height: box.height + 6, rx: 4, class: 'analysis-' + mark});
        }
        // 可以点的拍点：符头上方一个小点
        if (!locked && !entries.has(p.key)) svgEl(layer, 'circle', {cx: p.x + 6, cy: baseline - 6, r: 2.4, class: 'analysis-dot'});
      });
      pin.update();
    }
    paint();
    // 点谱例：选中最近的拍点，并播放从这里开始的音
    svg.addEventListener('click', event => {
      const pt = svg.createSVGPoint(); pt.x = event.clientX; pt.y = event.clientY;
      const x = pt.matrixTransform(svg.getScreenCTM().inverse()).x;
      const k = positions.findIndex((p, n) => { const [left, right] = half(n); return x >= left && x < right; });
      if (k < 0) return;
      Sound.wake(); Sound.play(positions[k].keys);
      if (!locked) select(k);
    });
    function select(k) {
      // 离开时没写字的位置不保留
      if (d.current && !d.entries.get(d.current)?.text.trim()) d.entries.delete(d.current);
      d.current = positions[k].key;
      if (!d.entries.has(d.current)) d.entries.set(d.current, emptyName());
      paint(); drawEditor();
    }
    const play = el('div', 'chord-play');
    const playAll = el('button', 'secondary-btn chord-small', '▶ 播放全曲'); playAll.type = 'button';
    playAll.addEventListener('click', () => { Sound.wake(); playEvents(result.events); });
    play.append(playAll); box.append(play);
    if (locked) return;
    box.append(el('p', 'chord-tip', '点谱例中任何一个音的上方，就在那个位置写记号；点中的位置会播放。'));
    const editor = el('div', 'analysis-editor');
    box.append(editor);
    function drawEditor() {
      editor.replaceChildren();
      if (!d.current) return;
      const draft = d.entries.get(d.current);
      const head = el('div', 'analysis-editor-head');
      head.append(el('span', '', where(d.current)));
      const remove = el('button', 'secondary-btn chord-small', '删除这个记号'); remove.type = 'button';
      remove.addEventListener('click', () => { d.entries.delete(d.current); delete d.marks[d.current]; d.current = null; paint(); drawEditor(); refreshConfirm(); });
      head.append(remove);
      // 空格：写下一个音符位置；回车：结束输入
      const input = ChordInput.field({value: draft.text, guide: data.inputGuide,
        onInput: value => { draft.text = value; delete d.marks[d.current]; paint(); refreshConfirm(); },
        onSpace: () => select(Math.min(positions.length - 1, positions.findIndex(p => p.key === d.current) + 1)),
        onEnter: () => { d.current = null; paint(); drawEditor(); }});
      editor.append(head, input.element);
      input.focus();
    }
    drawEditor();
  }

  /* ---------- 提交 ---------- */
  byId('confirmBtn').onclick = () => {
    const i = engine.state().index, q = QS[i], d = drafts[i];
    if (!ready(q, d)) return;
    Sound.stop();
    // 谱例分析：没写完的空位置不算作答，先去掉
    if (q.type === 'analysis') d.entries.forEach((draft, key) => { if (!draft.text.trim()) d.entries.delete(key); });
    const result = q.type === 'build' ? judgeBuild(q, d.notes) : q.type === 'analysis' ? judgeAnalysis(q, d.entries) : judgeName(q, d);
    if (q.type === 'analysis') { d.marks = result.marks; d.current = null; }
    feedbacks[i] = result;
    submittedAt = Date.now();
    engine.submit([result.ok ? 'ok' : 'no'], answerText(q, d), q.type === 'analysis' ? result.credit : undefined);
    render();
  };

  /* ---------- 结果页 ---------- */
  function renderResults(s) {
    text('resAccuracy', s.accuracy + '%'); text('resTotalTime', MTFormatTime(s.seconds)); text('resFirstPass', `${s.firstPass}/${s.total}`);
    buttonNav('resultQuestionNav', s, true);
    byId('detailList').replaceChildren();
    s.stats.forEach((stat, index) => {
      const item = el('div', 'detail-item');
      const top = el('div', 'detail-item-top');
      const label = el('span'); label.textContent = '第 ' + QS[index].label + ' 题';
      // 谱例分析：写出第一次检查的得分（按比例算进正确率）
      const first = QS[index].type === 'analysis' && stat.firstScore !== undefined ? ` | 首次得分 ${Math.round(stat.firstScore * 100)}%` : '';
      const detail = el('span'); detail.textContent = `尝试 ${stat.attempts} 次 | 用时 ${stat.timeSpent} 秒${first}`;
      top.append(label, detail);
      const wrong = el('div', stat.wrongAnswers.length ? 'detail-item-wrong-choices' : 'detail-item-first-pass');
      wrong.textContent = stat.wrongAnswers.length ? '❌ 错误尝试：' + stat.wrongAnswers.join(' ｜ ') : '✓ 一次通过';
      item.append(top, wrong); byId('detailList').append(item);
    });
  }

  /* ---------- 按钮 ---------- */
  byId('startPracticeBtn').onclick = () => { Sound.wake(); engine.start(); render(); };
  byId('prevBtn').onclick = () => { engine.goTo(engine.state().index - 1); render(); };
  byId('nextBtn').onclick = () => { engine.next(); render(); };
  byId('backToResultBtn').onclick = () => { engine.backToResults(); render(); };
  byId('restartBtn').onclick = () => { engine.reset(); drafts = QS.map(freshDraft); feedbacks.fill(null); render(); };
  byId('returnHomeBtn').onclick = () => {
    if (engine.state().mode === 'practice' && !confirm('确定返回课程首页吗？\n\n当前练习尚未完成。返回后，本次答题进度和计时将不会保留。')) return;
    window.location.href = data.backURL || '../';
  };
  for (const prefix of ['questionNav', 'resultQuestionNav']) {
    byId(prefix + 'Toggle').onclick = () => {
      const expanded = byId(prefix + 'Wrapper').classList.toggle('expanded');
      byId(prefix + 'Toggle').setAttribute('aria-expanded', String(expanded));
    };
  }
  function closeHistory() { showEl('historyModal', false); byId('historyToggleBtn').focus(); }
  byId('historyToggleBtn').onclick = () => {
    const list = byId('historyList'), history = engine.state().history; list.replaceChildren();
    if (!history.length) list.append(el('p', '', '暂无历史记录，完成一次练习后会自动保存在这里。'));
    history.forEach((rec, i) => {
      const item = el('div', 'history-card-item');
      const title = el('div', 'history-card-header'); title.textContent = `记录 #${history.length - i} (${rec.timestamp}) · 正确率: ${rec.accuracy}%`;
      const meta = el('div', 'history-card-meta'); meta.textContent = `用时: ${rec.totalTime} | 一次答对: ${rec.firstPass}/${rec.total} 题`;
      item.append(title, meta); list.append(item);
    });
    showEl('historyModal', true); byId('closeHistoryBtn').focus();
  };
  byId('closeHistoryBtn').onclick = closeHistory;
  byId('historyModal').onclick = e => { if (e.target === byId('historyModal')) closeHistory(); };
  /* ---------- 键盘操作（电脑） ----------
     回车：提交；答对后进入下一题，最后一题答对后查看结果。答对后半秒内的回车不翻页，免得连按跳过反馈。
     ← →：光标不在输入框里时换到上一题、下一题。
     输入框自己处理的回车（提交、谱例分析里结束一个位置）不再往下传。 */
  document.addEventListener('keydown', e => {
    const s = engine.state();
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.isComposing) return;
    if (!['practice', 'review'].includes(s.mode) || !byId('historyModal').classList.contains('hidden')) return;
    const target = e.target, typing = target.closest?.('input, textarea, select, [contenteditable]');
    if (e.key === 'Enter' && !typing && !target.closest?.('button, a, summary')) {
      const visible = id => !byId(id).classList.contains('hidden');
      if (visible('nextBtn')) { e.preventDefault(); if (Date.now() - submittedAt > 500) byId('nextBtn').click(); }
      else if (visible('confirmBtn') && !byId('confirmBtn').disabled) { e.preventDefault(); byId('confirmBtn').click(); }
    }
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !typing) {
      e.preventDefault();
      engine.goTo(s.index + (e.key === 'ArrowLeft' ? -1 : 1)); render();
    }
  });
  document.addEventListener('keydown', e => {
    if (byId('historyModal').classList.contains('hidden')) return;
    if (e.key === 'Escape') closeHistory();
    if (e.key === 'Tab') { e.preventDefault(); byId('closeHistoryBtn').focus(); }
  });
  function copyTextToClipboard(value) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(value);
    return new Promise((resolve, reject) => {
      const area = document.createElement('textarea'); area.value = value; area.readOnly = true;
      area.style.position = 'fixed'; area.style.opacity = '0'; document.body.append(area); area.select(); area.setSelectionRange(0, area.value.length);
      try { document.execCommand('copy') ? resolve() : reject(new Error('Fallback copy failed')); } catch (e) { reject(e); } finally { area.remove(); }
    });
  }
  byId('copyResultBtn').onclick = () => {
    copyTextToClipboard(PracticeReport.generate(engine.reportInput()))
      .then(() => alert('练习结果已成功复制到剪贴板，快去分享给你的老师吧！'))
      .catch(() => alert('复制失败，请手动截图发送。'));
  };
  render();
})();
