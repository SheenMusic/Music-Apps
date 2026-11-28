/* 第六課全曲：錄音與動畫共用 MIDI 時鐘；和弦判題沿用前五課。介面只保留播放、進度、換行、縮放。 */
(() => {
  'use strict';
  const DATA = window.SNOWMAN;
  const audio = document.getElementById('audio');
  const host = document.getElementById('score');
  const strip = document.querySelector('.strip');
  // 錄音與 MIDI 的對齊已確認為 1240 ms，不再讓學生調整。
  const OFFSET = 1240;
  const play = document.getElementById('play');
  const wrapButton = document.getElementById('wrap');
  let wrapOn = false, zoomValue = 100;
  const editor = document.getElementById('editor');
  const feedback = document.getElementById('feedback');
  const storageKey = 'snowman-analysis-v1';
  let view, state, selected = null, field, frame = 0, shown = false;
  let playing = false, saved = null, lit = new Set();
  try { saved = JSON.parse(localStorage.getItem(storageKey)); } catch {}
  const validSaved = saved && Date.now() - saved.updated < 7 * 86400000 && saved.version === 1;
  const question = window.SNOWMAN_QUESTION;

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({version: 1, updated: Date.now(), entries: [...state.entries], started: state.started,
        zoom: zoomValue, wrap: wrapOn}));
    } catch {}
  }
  // 部分瀏覽器（尤其 Safari）的 audio.currentTime 更新很粗，動畫會一跳一跳；
  // 播放中用 performance.now() 在兩次更新之間補間，數值一變就重新對齊。
  let clockAudio = 0, clockPerf = 0;
  function smoothTime() {
    const now = performance.now(), t = audio.currentTime;
    if (audio.paused || t !== clockAudio) { clockAudio = t; clockPerf = now; return t; }
    return Math.min(clockAudio + (now - clockPerf) / 1000 * audio.playbackRate, clockAudio + .5);
  }
  function midiTime() { return smoothTime() + OFFSET / 1000; }
  function audioTime(midi) { return Math.max(0, midi - OFFSET / 1000); }
  function scaleScore() {
    const scale = zoomValue / 100;
    view.svg.style.width = `${view.width * scale}px`;
    view.svg.style.height = `${view.height * scale}px`;
  }
  function render() {
    stop();
    const old = state;
    commit();
    view = SnowmanScore.mount(host, DATA, {wrap: wrapMode(),
      availableWidth: strip.clientWidth / (zoomValue / 100), onSelect: select});
    state = ChordAnalysis.create(question, view.positions, 100);
    if (old) { state.entries = old.entries; state.started = old.started; }
    state.started = state.started || Date.now();
    view.svg.addEventListener('click', scoreClick);
    lit = new Set();
    scaleScore(); paint();
    if (view.missing.length) console.warn('未配對的譜面符頭', view.missing);
  }
  function paint() {
    view.svg.querySelector('.answer-layer')?.remove();
    const layer = document.createElementNS('http://www.w3.org/2000/svg', 'g'); layer.setAttribute('class', 'answer-layer');
    view.svg.append(layer);
    for (const pos of view.positions) {
      const expected = shown ? question.chords.flatMap(c => c.splitFirst ? c.split : [c]).find(c => c.at.join(':') === pos.key) : null;
      const entry = shown ? (expected ? {text: expected.answer} : null) : state.entries.get(pos.key);
      const mark = shown ? '' : state.marks[pos.key];
      const parsed = entry && ChordInput.parse(entry.text);
      const dot = view.svg.querySelector(`[data-position="${pos.key}"]`);
      if (dot) { dot.classList.toggle('selected', selected === pos.key); dot.classList.toggle('has-answer', !!entry?.text); dot.classList.toggle('missing', mark === 'missing'); }
      if (parsed?.ok) {
        const [root, suffix, bass] = parsed.parts;
        const el = ChordStage.drawSymbol(layer, pos.x, pos.y, {root, suffix, bass, size: 19,
          color: expected?.optional ? '#64748b' : mark === 'wrong' ? '#b91c1c' : '#000000'});
        if (el?.setAttribute) el.setAttribute('pointer-events', 'none');
      }
      if (mark === 'missing') {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        for (const [key, value] of Object.entries({x: pos.x - 12, y: pos.y - 22, width: 26, height: 28, fill: 'none', stroke: '#b91c1c', 'stroke-dasharray': '4 3'})) rect.setAttribute(key, value);
        layer.append(rect);
      }
    }
  }
  function commit() {
    if (!selected) return;
    const draft = state.entries.get(selected);
    if (!draft?.text.trim()) { state.entries.delete(selected); delete state.marks[selected]; delete state.cands[selected]; return; }
    // 本课作答不判对错（2026-11-21 老师决定）：提交后由老师批改；这里只提示写法无法识别的记号。
    feedback.textContent = ChordInput.parse(draft.text).ok ? '' : '这个记号的写法无法识别，请检查。';
    save(); paint();
  }
  function select(pos) {
    if (shown) return;
    commit(); selected = pos.key;
    document.getElementById('positionLabel').textContent = `第 ${pos.measure + 1} 小节 · 第 ${Number((pos.beat + 1).toFixed(2))} 拍`;
    editor.hidden = false; editor.querySelector('.field-host').replaceChildren();
    field = ChordInput.field({value: state.entries.get(selected)?.text || '', onInput(value) {
      // field 回傳文字（與共用 Practice 的使用方式一致）。
      state.entries.set(selected, {text: value}); delete state.marks[selected]; delete state.cands[selected]; paint(); save();
    }, onEnter: commit, onSubmit: commit});
    editor.querySelector('.field-host').append(field.element);
    paint();
    const input = editor.querySelector('input'); input?.focus({preventScroll: true});
  }
  function tick() {
    const time = midiTime(), active = view.cues.filter(c => time >= c.on && time < c.off);
    const elements = new Set(active.map(c => c.el));
    // 只改變有變化的符頭，避免每一格畫面重設全部 class。
    for (const el of lit) if (!elements.has(el)) el.classList.remove('is-on');
    for (const el of elements) if (!lit.has(el)) el.classList.add('is-on');
    lit = elements;
    if (active.length) {
      // 跟隨最近開始的音；連線延續到後面小節的符頭與起音同時亮，取較前的小節。
      const current = active.reduce((a, b) => b.on > a.on || (b.on === a.on && b.measure < a.measure) ? b : a), measure = view.measures[current.measure];
      const scale = zoomValue / 100;
      if (wrapMode()) {
        const top = measure.y * scale;
        if (top < strip.scrollTop || top + 300 * scale > strip.scrollTop + strip.clientHeight) strip.scrollTop = top;
      } else {
        const progress = Math.max(0, Math.min(1, (time - measure.start) / (measure.end - measure.start)));
        const target = (measure.x + progress * measure.width) * scale - strip.clientWidth / 3;
        strip.scrollLeft += (Math.max(0, target) - strip.scrollLeft) * .15;
      }
    }
    showProgress();
    if (playing && !audio.paused) frame = requestAnimationFrame(tick);
  }
  async function start() {
    if (playing) { stop(); return; }
    try { await audio.play(); playing = true; play.classList.add('is-playing'); play.setAttribute('aria-label', '暂停'); cancelAnimationFrame(frame); frame = requestAnimationFrame(tick); }
    catch { feedback.textContent = '录音暂时无法播放，请再试一次。'; }
  }
  function stop() {
    audio.pause(); playing = false; cancelAnimationFrame(frame); play.classList.remove('is-playing'); play.setAttribute('aria-label', '播放');
    if (view) view.cues.forEach(c => c.el.classList.remove('is-on'));
    lit = new Set();
  }
  // 點符頭：只響這個音；點鋼琴譜表上灰點正下方的空白處：只響這個拍點縱向的鋼琴音（不含人聲）。
  // 兩者都把錄音進度移到這個位置；播放中直接跳過去繼續放，不另外發聲。
  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const noteName = midi => NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
  function jumpTo(time, pitches, heads) {
    const wasPlaying = playing;
    audio.currentTime = audioTime(time);
    if (wasPlaying) return;
    ChordStage.Sound.wake();
    ChordStage.Sound.play(pitches.map(noteName));
    showHeads(new Set(heads));
  }
  // 只點亮正在發聲的符頭。
  function showHeads(elements) {
    for (const el of lit) if (!elements.has(el)) el.classList.remove('is-on');
    for (const el of elements) el.classList.add('is-on');
    lit = elements;
    showProgress();
  }
  function showProgress() {
    if (Number.isFinite(audio.duration)) document.getElementById('seek').value = audio.currentTime / audio.duration * 1000;
  }
  // 手機固定長條譜；換行只在較寬的螢幕提供。
  function wrapMode() { return wrapOn && innerWidth >= 700; }
  function svgPoint(event) {
    const point = view.svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
    return point.matrixTransform(view.svg.getScreenCTM().inverse());
  }
  function scoreClick(event) {
    if (event.target.closest('.analysis-dot')) return;
    const head = event.target.closest('.vf-notehead');
    if (head) {
      const cue = view.cues.filter(c => c.el === head).sort((a, b) => a.on - b.on)[0];
      if (cue) jumpTo(cue.on, [cue.pitch], [head]);
      return;
    }
    const {x, y} = svgPoint(event);
    const row = view.measures.find(m => y >= m.y + view.staffY.rh - 40 && y <= m.y + view.staffY.lh + 80 && x >= m.x && x < m.x + m.width);
    if (!row) return;
    const pos = view.positions.filter(p => p.row === row.row && Math.abs(p.x - x) < 14).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
    if (!pos) return;
    const piano = view.cues.filter(c => c.staff !== 'voice' && c.measure === pos.measure && Math.abs(c.beat - pos.beat) < .01);
    if (!piano.length) return;
    // 只響這個拍點上（灰點正下方）縱向的鋼琴符頭；前面延續下來的音和人聲都不響。
    const attacks = piano.filter(c => !c.tied);
    const time = attacks.length ? Math.min(...attacks.map(c => c.on)) : view.beatTime(pos.start);
    jumpTo(time, [...new Set(piano.map(c => c.pitch))].sort((a, b) => a - b), piano.map(c => c.el));
  }
  // 提交：生成一段 Markdown，发到老师的「练习记录」表，并可复制发给老师。
  function report() {
    const student = (() => { try { return JSON.parse(localStorage.getItem('sheen.student')); } catch { return null; } })();
    const pad = n => String(n).padStart(2, '0'), now = new Date();
    const rows = [...state.entries].filter(([, d]) => d.text.trim()).map(([key, d]) => {
      const [m, beat] = key.split(':').map(Number);
      return {m, beat, text: d.text.trim()};
    }).sort((a, b) => a.m - b.m || a.beat - b.beat);
    const seconds = Math.round((Date.now() - (state.started || Date.now())) / 1000);
    const text = ['# MT Chord 06 · Snowman 和弦分析',
      `学生：${student?.name || '未识别'}　提交时间：${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
      `已写：${rows.length} 个记号 · 用时：${PracticeReport.time(seconds)}`,
      ['| 小节 | 拍 | 记号 |', '|---|---|---|', ...rows.map(r => `| ${r.m + 1} | ${Number((r.beat + 1).toFixed(2))} | ${r.text} |`)].join('\n')].join('\n\n');
    return {text, seconds};
  }
  let lastReport = '';
  async function submit() {
    commit();
    const {text, seconds} = report();
    if (!state.entries.size) { feedback.textContent = '还没有写任何记号。'; return; }
    if (!confirm('提交后老师会收到你的作答。确定提交吗？')) return;
    lastReport = text;
    const button = document.getElementById('submit');
    button.disabled = true;
    document.getElementById('copy').hidden = false;
    feedback.textContent = '正在发送作答…';
    try {
      const sent = await window.PracticeSync?.send({code: 'MT Chord 06', title: 'Snowman 和弦分析', seconds}, text);
      feedback.textContent = sent ? '作答已发出，也可以复制留存。' : '发送未完成，请重新提交或复制作答发给老师。';
    } catch {
      feedback.textContent = '发送未完成，请重新提交或复制作答发给老师。';
    } finally {
      button.disabled = false;
    }
  }
  play.onclick = start;
  audio.addEventListener('ended', () => { stop(); audio.currentTime = 0; showProgress(); });
  document.getElementById('seek').oninput = event => { if (Number.isFinite(audio.duration)) audio.currentTime = Number(event.target.value) / 1000 * audio.duration; if (!playing) tick(); };
  function setWrap(on) { wrapOn = on; wrapButton.setAttribute('aria-pressed', String(on)); }
  wrapButton.onclick = () => { setWrap(!wrapOn); render(); save(); };
  function setZoom(value) {
    zoomValue = Math.max(60, Math.min(180, value));
    if (wrapMode()) render(); else scaleScore();
    save();
  }
  document.getElementById('zoomIn').onclick = () => setZoom(zoomValue + 20);
  document.getElementById('zoomOut').onclick = () => setZoom(zoomValue - 20);
  document.getElementById('submit').onclick = submit;
  document.getElementById('copy').onclick = async () => {
    try { await navigator.clipboard.writeText(lastReport || report().text); feedback.textContent = '作答已复制，可以发给老师。'; }
    catch { feedback.textContent = '复制失败，请再试一次。'; }
  };
  document.getElementById('deleteEntry').onclick = () => { if (!selected) return; state.entries.delete(selected); delete state.marks[selected]; delete state.cands[selected]; editor.hidden = true; selected = null; paint(); save(); };
  document.getElementById('clear').onclick = () => {
    if (!confirm('清除这首曲子的作答，重新开始？')) return;
    lastReport = ''; document.getElementById('copy').hidden = true;
    state.entries.clear(); state.marks = {}; state.cands = {}; state.first = {}; state.started = Date.now(); selected = null;
    feedback.textContent = ''; editor.hidden = true; paint(); save();
  };
  render();
  if (validSaved && confirm('这台设备有 7 天内的作答记录，要继续吗？')) {
    state.entries = new Map(saved.entries || []); state.started = saved.started || Date.now();
    zoomValue = Number(saved.zoom) || 100; setWrap(!!saved.wrap); render();
  }
  document.addEventListener('keydown', event => {
    if (event.code !== 'Space' || event.defaultPrevented || event.target.closest('input, textarea, button, select, [contenteditable], [role=button]')) return;
    event.preventDefault(); start();
  });
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (wrapOn) render(); }, 200); });
  window.addEventListener('pagehide', save);
  window.SnowmanPlayback = {get view() { return view; }, get state() { return state; }};
})();
