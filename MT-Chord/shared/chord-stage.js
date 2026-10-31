/* 和弦记号课程 · 共享演示区
   - Sound：网站共享钢琴采样（audio_pn：Salamander Grand Piano V3，C2–C6，每隔小三度一个）
   - Stage：上区 · 谱表 · 下区的演示区；谱表固定居中，场景之间用“神奇移动”过渡
     （相同的音保持不动，移动的音滑到新位置，新出现的音渐入，消失的音渐出）
   - chordSymbol：和弦记号的统一写法（后缀缩小、与根音底部对齐）
   依赖：VexFlow 4.2.5、shared/notation（NotationConfig / NotationRenderer）。 */
(() => {
  'use strict';

  /* ---------- 颜色：演示区是固定的浅色纸面，两种主题下都用这组颜色 ---------- */
  const COLOR = {
    ink: '#000000',    // 谱线、谱号、普通符头
    root: '#4f46e5',   // 根音
    third: '#0f766e',  // 三音
    fifth: '#b45309',  // 五音
    bass: '#dc2626',   // 低音
    faint: '#94a3b8'   // 暂不强调的音
  };

  /* ---------- 音名工具 ---------- */
  const LETTER_STEP = {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11};
  const SAMPLE_NAMES = ['C','Cs','D','Ds','E','F','Fs','G','Gs','A','As','B'];
  function parse(note) {
    const m = note.match(/^([A-G])(#|b)?(\d)$/);
    return {letter: m[1], accidental: m[2] || '', octave: Number(m[3])};
  }
  function midiOf(note) {
    const n = parse(note);
    return 12 * (n.octave + 1) + LETTER_STEP[n.letter] + (n.accidental === '#' ? 1 : n.accidental === 'b' ? -1 : 0);
  }
  // 谱表上的位置（以“级”计）：同一字母同一八度为同一级。
  const staffStep = note => { const n = parse(note); return n.octave * 7 + 'CDEFGAB'.indexOf(n.letter); };
  const pretty = note => note.replace(/\d/g, '').replace('#', '♯').replace('b', '♭');

  /* ---------- 声音 ---------- */
  const Sound = (() => {
    const base = document.documentElement.dataset.sampleBase || '../../audio_pn/';
    const buffers = new Map();
    let context = null, playing = [];

    /* 诊断：网址加 ?audio=debug 时，页面顶部显示音频状态与事件记录（学生平时看不到）。
       BUILD 在改声音代码时更新，并与页面里 <script ...?v=> 的版本一致，用来确认手机上跑的是哪一版。 */
    const BUILD = '20261029e';
    const debug = /[?&]audio=debug\b/.test(location.search) ? audioDebugPanel() : null;
    const born = performance.now();
    let created = 0;
    function log(text) {
      if (!debug) return;
      debug.lines.push(`${((performance.now() - born) / 1000).toFixed(1).padStart(6)}s  ${text}`);
      if (debug.lines.length > 80) debug.lines.shift();
      debug.render();
    }
    // 输出延迟：交给浏览器的声音要等多久才从扬声器出来（浏览器能报告时）
    const latency = c => `延迟 ${Math.round((c.outputLatency || 0) * 1000)}+${Math.round((c.baseLatency || 0) * 1000)} ms`;
    const gesture = () => !navigator.userActivation ? '点按未知' : navigator.userActivation.isActive ? '在点按中' : '不在点按中';
    // 对照试验：网址再加 &session=off 时完全不设置 audioSession，看它是不是没声音的原因
    const sessionOff = /[?&]session=off\b/.test(location.search);
    const sessionText = () => navigator.audioSession ? `${navigator.audioSession.type}/${navigator.audioSession.state}` : '无';
    if (debug && navigator.audioSession) {
      navigator.audioSession.addEventListener('statechange', () => log(`audioSession 状态 → ${navigator.audioSession.state}`));
    }
    // 信号电平：诊断时声音先经过一个 AnalyserNode 再到扬声器，播放后记录实际送出的峰值。
    // 有电平却听不到 = 信号是好的，卡在浏览器到扬声器之间；电平为 0 = 送出去的就是静音。
    const meters = new WeakMap();
    function output(c) {
      if (!debug) return destination(c);
      if (!meters.has(c)) {
        const analyser = c.createAnalyser();
        analyser.fftSize = 2048;
        analyser.connect(destination(c));
        meters.set(c, analyser);
      }
      return meters.get(c);
    }
    // 对照试验：网址再加 &out=element 时，合成好的声音不由 Web Audio 直接送到扬声器，
    // 而是接到一个隐藏的 <audio> 元素播放（和 YouTube 等视频走同一条出声通道）。
    // Mac Safari 实测：搁置后 Web Audio 有信号却无声，同一标签页外的 YouTube 正常。
    const viaElement = /[?&]out=element\b/.test(location.search);
    const sinks = new WeakMap();   // 音频 → {node, element}
    function destination(c) {
      if (!viaElement) return c.destination;
      if (!sinks.has(c)) {
        const node = c.createMediaStreamDestination(), element = new Audio();
        element.srcObject = node.stream;
        element.addEventListener('pause', () => log('audio 元素暂停了'));
        element.addEventListener('playing', () => log('audio 元素开始播放'));
        sinks.set(c, {node, element});
      }
      return sinks.get(c).node;
    }
    // <audio> 元素也要在点按中 play() 才能出声
    function playSink(c, why) {
      if (!viaElement) return;
      destination(c);
      const {element} = sinks.get(c);
      if (!element.paused) return;
      element.play().then(
        () => log(`${why}：audio 元素 play()（${gesture()}）成功`),
        error => log(`${why}：audio 元素 play()（${gesture()}）失败：${error.message}`)
      );
    }
    function closeSink(c) {
      const sink = sinks.get(c);
      if (!sink) return;
      sink.element.pause();
      sink.element.srcObject = null;
      sinks.delete(c);
    }
    function measure(c, label) {
      if (!debug) return;
      const analyser = output(c);
      const data = new Float32Array(analyser.fftSize);
      let peak = 0, count = 0;
      const timer = setInterval(() => {
        analyser.getFloatTimeDomainData(data);
        for (const v of data) peak = Math.max(peak, Math.abs(v));
        if (++count < 10) return;
        clearInterval(timer);
        log(`　${label}电平 ${peak.toFixed(3)}${peak < 0.001 ? '（没有信号）' : '（有信号）'}`);
      }, 50);
    }
    function audioDebugPanel() {
      const panel = document.createElement('div');
      // 平时只显示最近 6 条，点按穿透到课件（不挡喇叭按钮）；点「展开」才能滚动看全部记录
      panel.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:99999;max-height:30vh;overflow:auto;pointer-events:none;'
        + 'background:rgba(0,0,0,.7);color:#fff;font:11px/1.4 ui-monospace,Menlo,monospace;padding:6px 8px;white-space:pre-wrap';
      const status = document.createElement('div'), list = document.createElement('div');
      const copy = document.createElement('button'), more = document.createElement('button'), tone = document.createElement('button');
      status.style.cssText = 'color:#7fe0ff;margin-bottom:4px';
      for (const button of [copy, more, tone]) button.style.cssText = 'float:right;margin-left:6px;font:inherit;padding:2px 8px;pointer-events:auto';
      copy.textContent = '复制记录';
      more.textContent = '展开';
      tone.textContent = '测试音';
      // 测试音：不用钢琴采样的一声「嘀」（880 Hz，0.4 秒），排除采样本身的因素
      tone.addEventListener('click', () => {
        const c = ctx('点按'), osc = c.createOscillator(), gain = c.createGain(), at = c.currentTime + 0.02;
        osc.frequency.value = 880;
        gain.gain.value = 0.2;
        osc.connect(gain).connect(output(c));
        osc.start(at);
        osc.stop(at + 0.4);
        quietAt = Math.max(quietAt, performance.now() + 420);
        log(`测试音：音频 #${created} ${c.state}，session ${sessionText()}`);
        measure(c, '测试音');
      });
      copy.addEventListener('click', () => {
        const text = status.textContent + '\n' + state.lines.join('\n');
        navigator.clipboard?.writeText(text).then(() => { copy.textContent = '已复制'; }, () => { copy.textContent = '复制失败，请截图'; });
      });
      let expanded = false;
      more.addEventListener('click', () => {
        expanded = !expanded;
        more.textContent = expanded ? '收起' : '展开';
        panel.style.pointerEvents = expanded ? 'auto' : 'none';
        state.render();
      });
      panel.append(copy, more, tone, status, list);
      const state = {
        lines: [],
        render() { list.textContent = (expanded ? state.lines : state.lines.slice(-6)).join('\n'); }
      };
      let lastTime = 0;
      setInterval(() => {
        const c = context, time = c ? c.currentTime : 0;
        status.textContent = [
          `版本 ${BUILD}`,
          c ? `音频 #${created} ${c.state}` : '音频 未建',
          c ? `时钟 ${time.toFixed(2)} ${time > lastTime ? '在走' : '停'}` : '',
          c ? `${c.sampleRate} Hz` : '',
          c ? latency(c) : '',
          c && context.state === 'running' ? `静了 ${Math.max(0, Math.round((performance.now() - quietAt) / 1000))} 秒` : '',
          `session ${sessionText()}${sessionOff ? '（对照：不设置）' : ''}`,
          viaElement ? `输出 audio 元素${c && sinks.has(c) ? (sinks.get(c).element.paused ? ' 暂停' : ' 在播') : ''}` : '输出 Web Audio',
          `采样 ${buffers.size}`,
          `页面 ${document.visibilityState}`
        ].filter(Boolean).join(' · ');
        lastTime = time;
      }, 300);
      const attach = () => document.body.append(panel);
      if (document.body) attach(); else document.addEventListener('DOMContentLoaded', attach);
      return state;
    }
    // 采样在 C、D♯、F♯、A 上（MIDI 是 3 的倍数），C2–C6（MIDI 36–84）。
    // 每个音用最近的采样，变调最多 1 个半音；范围外的音用两端的采样。
    const LOW = 36, HIGH = 84;
    function sampleOf(note) {
      const midi = midiOf(note), sample = Math.max(LOW, Math.min(HIGH, Math.round(midi / 3) * 3));
      return {file: SAMPLE_NAMES[sample % 12] + (Math.floor(sample / 12) - 1) + '.mp3', rate: Math.pow(2, (midi - sample) / 12)};
    }
    // iPhone：锁屏、切到别的 App、来电或其他声音之后，音频会变成 interrupted（不是 suspended），
    // 只认 suspended 就会一直没声音、要刷新才好。所以只要不是 running，就在学生下一次点按时恢复；已关闭的重建。
    // audioSession 'playback'：静音键开着也能出声（Safari 16.4 起）。
    // Safari（Mac / iPhone / 微信，都是 WebKit）：页面搁置一会或从后台回来后，旧的音频仍报告 running、
    // 也接收声音，但没有输出，声音积压到页面关闭时才放出来；新建的音频总是正常。
    // 所以从后台回来、或超过 IDLE 秒没有声音之后，学生下一次点按时关闭旧的、新建一个（已解码的采样直接沿用）。
    // 只在点按（wake）时重建：点按之外新建的音频会被 Safari 挡住。
    const IDLE = 10;
    let stale = false, quietAt = 0;   // quietAt：最近一次使用音频、或最后一个音结束的时刻（performance.now，毫秒）
    document.addEventListener('visibilitychange', () => {
      log('页面' + (document.visibilityState === 'visible' ? '回到前台' : '进入后台'));
      if (document.visibilityState === 'visible' && context) stale = true;
    });
    window.addEventListener('pageshow', event => {
      log('pageshow' + (event.persisted ? '（从返回缓存恢复）' : ''));
      if (event.persisted && context) stale = true;
    });
    window.addEventListener('pagehide', () => log('pagehide'));
    // why：谁在调用（点按 / 播放 / 解码），只用于诊断记录
    function ctx(why = '') {
      if (!sessionOff && navigator.audioSession && navigator.audioSession.type !== 'playback') {
        try { navigator.audioSession.type = 'playback'; log(`audioSession → ${sessionText()}`); } catch (error) { log('audioSession 设置失败：' + error.message); }
      }
      const now = performance.now(), idle = now - quietAt > IDLE * 1000;
      if (why === '点按' && context && (stale || idle)) {
        playing = [];
        log(`${why}：关闭旧音频 #${created}（${stale ? '回到前台后第一次点按' : `${Math.round((now - quietAt) / 1000)} 秒没有声音`}）`);
        closeSink(context);
        context.close().catch(() => {});
        context = null;
        stale = false;
      }
      quietAt = Math.max(quietAt, now);
      if (!context || context.state === 'closed') {
        context = new (window.AudioContext || window.webkitAudioContext)();
        created++;
        log(`${why}：新建音频 #${created}，${gesture()}，状态 ${context.state}，session ${sessionText()}`);
        const mine = context, n = created;
        mine.addEventListener('statechange', () => log(`音频 #${n} 状态 → ${mine.state}`));
      }
      if (context.state !== 'running') {
        const mine = context, before = context.state;
        mine.resume().then(
          () => log(`${why}：恢复（${gesture()}）${before} → ${mine.state}`),
          error => log(`${why}：恢复失败（${gesture()}）${before}：${error.message}`)
        );
      }
      if (why === '点按') playSink(context, why);
      return context;
    }
    function load(note) {
      const {file} = sampleOf(note);
      if (!buffers.has(file)) {
        const request = fetch(base + file)
          .then(response => { if (!response.ok) throw new Error(file); return response.arrayBuffer(); })
          .then(data => new Promise((resolve, reject) => ctx('解码').decodeAudioData(data, resolve, reject)))
          .catch(error => { console.warn('钢琴采样载入失败', error); log(`采样 ${file} 载入失败：${error && error.message}`); buffers.delete(file); return null; });
        buffers.set(file, request);
      }
      return buffers.get(file);
    }
    // generation：每次 stop / play 加一；采样还在载入时又按了别的，旧的这次就不再发声。
    let generation = 0;
    function stop() {
      generation++;
      if (!context) return;
      for (const {source, gain} of playing) {
        gain.gain.cancelScheduledValues(context.currentTime);
        gain.gain.setTargetAtTime(0, context.currentTime, 0.03);
        source.stop(context.currentTime + 0.2);
      }
      playing = [];
    }
    // offsets：每个音相对开始的秒数；省略即柱式和弦。durations：每个音的时值（秒）。
    // 省略 durations 时像真实钢琴一样：下一个音（和弦）响起时，前面的音放掉（约 0.15 秒收尾）；最后一组自然衰减（约 6 秒）。
    // 返回实际开始的时刻（音频时钟，秒），供谱面高亮对齐；被打断则返回 null。
    async function play(notes, offsets = notes.map(() => 0), durations = null) {
      if (!notes.length) return null;
      const c = ctx('播放');
      stop();
      const mine = generation;
      const loaded = await Promise.all(notes.map(load));
      if (mine !== generation) return null;
      const start = c.currentTime + 0.02, level = 0.9 / Math.sqrt(notes.length);
      if (debug) {
        const missing = loaded.filter(buffer => !buffer).length;
        log(`播放 ${notes.join(' ')}：音频 #${created} ${c.state}${c === context ? '' : '（已被替换！）'}，时钟 ${c.currentTime.toFixed(2)}，${latency(c)}${missing ? `，缺 ${missing} 个采样` : ''}`);
        const t = c.currentTime;
        setTimeout(() => log(c.currentTime > t ? '　0.5 秒后时钟在走' : `　0.5 秒后时钟没走（${c.state}）→ 不会有声音`), 500);
        measure(c, '');
      }
      const onsets = [...new Set(offsets)].sort((a, b) => a - b);
      let last = start;   // 最后一个音停下的时刻（音频时钟）
      loaded.forEach((buffer, i) => {
        if (!buffer) return;
        const source = c.createBufferSource(), gain = c.createGain();
        source.buffer = buffer;
        source.playbackRate.value = sampleOf(notes[i]).rate;
        gain.gain.value = level;
        source.connect(gain).connect(output(c));
        const at = start + offsets[i];
        source.start(at);
        if (durations) {
          const end = at + Math.max(.15, durations[i]);
          gain.gain.setTargetAtTime(0, end, 0.06);
          source.stop(end + 0.4);
          last = Math.max(last, end + 0.4);
        } else {
          const next = onsets.find(o => o > offsets[i]);
          if (next === undefined) { source.stop(at + 6); last = Math.max(last, at + 6); }
          else { gain.gain.setTargetAtTime(0, start + next, 0.05); source.stop(start + next + 0.5); }
        }
        playing.push({source, gain});
      });
      quietAt = Math.max(quietAt, performance.now() + (last - c.currentTime) * 1000);
      return start;
    }
    // 此刻耳朵听到的是音频时钟上的哪一刻：扣除输出延迟（浏览器能报告时）。
    const heard = () => context ? context.currentTime - (context.outputLatency || context.baseLatency || 0) : 0;
    return {play, stop, heard, preload: notes => notes.forEach(load), wake: () => ctx('点按')};
  })();

  /* ---------- 和弦记号写法（记谱字体） ---------- */
  // 依照乐谱软件的惯例：字母与数字用衬线体 Edwin（MuseScore 的和弦记号字体，仿 New Century Schoolbook），
  // 升降号与 △ ° + − 用 Bravura Text 的 SMuFL 和弦记号专用字形。字体文件见 assets/fonts，
  // 由 shared/notation/notation-styles.css 声明。
  const TEXT_FONT = 'Edwin, "Century Schoolbook", "New Century Schoolbook", Georgia, "Times New Roman", serif';
  const MUSIC_FONT = '"Bravura Text", Bravura';
  const MUSIC_GLYPH = {'♭': '', '♯': '', '♮': '', '△': '', '°': '', 'ø': '', '+': '', '−': ''};
  // 拆成「文字 / 记谱字形」片段：[{text, music}]
  const pieces = text => [...String(text)].reduce((list, ch) => {
    const music = ch in MUSIC_GLYPH, glyph = music ? MUSIC_GLYPH[ch] : ch;
    const last = list[list.length - 1];
    if (last && last.music === music) last.text += glyph; else list.push({text: glyph, music});
    return list;
  }, []);
  const isLetterSuffix = suffix => /^[a-z0-9(]/i.test(suffix);
  const htmlPieces = text => pieces(text).map(p => p.music ? `<span class="cs-music">${p.text}</span>` : p.text).join('');
  function chordSymbol(root, suffix = '', bass = '') {
    const sign = suffix && !isLetterSuffix(suffix);
    return `<span class="cs"><span class="cs-root">${htmlPieces(root)}</span>` +
      (suffix ? `<span class="cs-suffix${sign ? ' cs-sign' : ''}">${htmlPieces(suffix)}</span>` : '') +
      (bass ? `<span class="cs-slash">/</span><span class="cs-bass">${htmlPieces(bass)}</span>` : '') + '</span>';
  }

  /* ---------- 谱面 ---------- */
  // 记谱字体：Bravura（VexFlow 默认，Dorico 的标准字体）。
  const VF = window.NotationRenderer?.VF();
  VF?.setMusicFont?.('Bravura', 'Gonville', 'Custom');

  // 谱面几何固定：画布宽 258、以谱表中线为中心；所有场景共用，谱表大小与位置始终不变。
  // 横向对齐规则：
  //   · 单个和弦：符头中心落在画布正中（= 演示区中轴，与下方说明、按钮同一条轴）；
  //   · 一行多个和弦：slot 0–3 在谱号之后等距排开；两个和弦对比用 PAIR，左右对称于中轴；
  //   · 和弦记号：左缘对齐所标和弦的符头左缘（标准记谱：记号标在和弦开始的位置）。
  const GEO = {width: 258, half: 72, slot0: 80, slotWidth: 50, labelGap: 6, labelSize: 10,
    accidentalColumn: 10, symbolSize: 20, symbolLift: 16, staffLine: .5, ledgerLine: .65};
  const CENTER = (GEO.width / 2 - GEO.slot0) / GEO.slotWidth; // 单个和弦：正中
  const PAIR = [(GEO.width / 2 - 45 - GEO.slot0) / GEO.slotWidth, (GEO.width / 2 + 45 - GEO.slot0) / GEO.slotWidth];
  const slotCenter = slot => GEO.slot0 + slot * GEO.slotWidth;
  const HEAD_HALF = 6.6; // Bravura 全音符符头半宽（谱线间距 10）
  const LABEL_FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  // 动效：iOS 风格曲线（先快后慢，无回弹）。与讲解区文字上移共用，见 chord-stage.css 的 --stage-ease。
  const EASE = 'cubic-bezier(.32,.72,0,1)';
  const MOTION = {duration: 480, easing: EASE};
  const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function bySlot(tones) {
    const groups = new Map();
    for (const t of tones) {
      const slot = t.slot ?? CENTER;
      if (!groups.has(slot)) groups.set(slot, []);
      groups.get(slot).push(t);
    }
    return groups;
  }
  // 变音记号分列（标准排法）：同一位置的和弦自上而下排，
  // 与已放好的记号相距不足七度时，移到更左一列。
  function accidentalColumns(tones) {
    const columns = new Map();
    for (const list of bySlot(tones.filter(t => parse(t.key).accidental)).values()) {
      const placed = [];
      list.sort((a, b) => staffStep(b.key) - staffStep(a.key)).forEach(t => {
        let column = 0;
        while (placed.some(p => p.column === column && Math.abs(p.step - staffStep(t.key)) < 6)) column++;
        placed.push({column, step: staffStep(t.key)});
        columns.set(t.id, column);
      });
    }
    return columns;
  }
  // 二度音程的符头错开：自下而上，与下方相邻（二度）且下方未错开的音，移到右侧。
  function displacedNotes(tones) {
    const shifted = new Set();
    for (const list of bySlot(tones).values()) {
      const sorted = [...list].sort((a, b) => staffStep(a.key) - staffStep(b.key));
      sorted.forEach((t, i) => {
        const below = sorted[i - 1];
        if (below && staffStep(t.key) - staffStep(below.key) === 1 && !shifted.has(below.id)) shifted.add(t.id);
      });
    }
    // tone.shift：指定错开与否（如演示「下方的音在右」的写法），优先于自动规则
    for (const t of tones) if (t.shift !== undefined) { if (t.shift) shifted.add(t.id); else shifted.delete(t.id); }
    return shifted;
  }

  // 谱面上方的和弦记号。symbol：{slot, root, suffix} 或 {slot, stack: [['C','m'], ['C','min'], …]}
  // 同一和弦的几种写法上下叠放（第一种在最上面），左缘都对齐符头左缘。
  function drawSymbol(group, x, baseline, symbol) {
    const size = symbol.size || GEO.symbolSize;
    const lines = symbol.stack || [symbol.text ? {text: symbol.text, color: symbol.color} : [symbol.root, symbol.suffix || '', symbol.bass || '']];
    lines.forEach((line, row) => {
      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', baseline - (lines.length - 1 - row) * size * 1.08);
      text.setAttribute('class', 'staff-symbol');
      if (symbol.anchor === 'middle') text.setAttribute('text-anchor', 'middle');
      const span = (content, fontSize, fill) => pieces(content).forEach(piece => {
        const t = document.createElementNS(SVG_NS, 'tspan');
        t.textContent = piece.text;
        // font: 'label' = 说明文字（无衬线，可含中文，如「上行」）；默认为和弦记号字体
        t.setAttribute('font-family', piece.music ? MUSIC_FONT : symbol.font === 'label' ? LABEL_FONT : TEXT_FONT);
        if (symbol.font === 'label') t.setAttribute('font-weight', '700');
        t.setAttribute('font-size', fontSize);
        t.setAttribute('fill', fill);
        text.append(t);
      });
      if (!Array.isArray(line)) span(line.text, size, line.color || COLOR.ink);
      else {
        // [根音, 后缀, 低音]；根音为空时是简化写法「/低音」
        const [root, suffix = '', bass = ''] = line;
        if (root) span(root, size, symbol.color || COLOR.root);
        // 字母后缀 .62 倍；以专用符号开头的后缀（如 △7）：符号 .8 倍，其后的数字仍 .62 倍
        if (suffix && isLetterSuffix(suffix)) span(suffix, size * .62, symbol.color || COLOR.third);
        else if (suffix) suffix.match(/[♭♯♮△°ø+−]+|[^♭♯♮△°ø+−]+/g).forEach(part => span(part, size * (part[0] in MUSIC_GLYPH ? .8 : .62), symbol.color || COLOR.third));
        if (bass) { span('/', size, COLOR.faint); span(bass, size, symbol.color || COLOR.bass); }
      }
      group.append(text);
    });
  }
  const symbolId = symbol => symbol.id || 'symbol:' + (symbol.stack || [symbol.text ? [symbol.text] : [symbol.root, symbol.suffix || '', symbol.bass ? '/' + symbol.bass : '']])
    .map(line => Array.isArray(line) ? line.join('') : line.text).join('/');

  // 每个音（和每个记号）单独成组（<g data-tone>），方便场景之间逐个追踪。
  function render(host, scene, scale) {
    const tones = scene.tones;
    host.replaceChildren();
    const width = GEO.width * scale;
    const renderer = NotationRenderer.createRenderer(host, {scale});
    renderer.resize(GEO.width, GEO.half * 2 + 60);
    const context = renderer.getContext();
    // scene.barlines：传 options，共享谱表不再在绘制时去掉结束线
    const stave = NotationRenderer.createStave(4, 40, GEO.width - 8, scene.barlines ? {initial: true} : undefined);
    // 不完整的音乐片段：谱表左右开放，不画小节线。带拍号的（scene.time，如 '4/4'）是真实的音乐片段，画结束线（N03）。
    if (!scene.barlines && !scene.time) stave.setEndBarType(VF.Barline.type.NONE);
    stave.setStyle({strokeStyle: COLOR.ink, fillStyle: COLOR.ink, lineWidth: GEO.staffLine});
    stave.addClef('treble');
    if (scene.time) stave.addTimeSignature(scene.time);
    stave.setContext(context).draw();
    // scene.bars：谱表中间的小节线（位置以 slot 计），用于并排的几个小节；结尾的小节线由 scene.barlines 打开
    for (const slot of scene.bars || []) {
      const line = document.createElementNS(SVG_NS, 'line'), x = slotCenter(slot);
      Object.entries({x1: x, x2: x, y1: stave.getYForLine(0), y2: stave.getYForLine(4), stroke: COLOR.ink, 'stroke-width': 1}).forEach(([k, v]) => line.setAttribute(k, v));
      host.querySelector('svg').append(line);
    }
    const middle = (stave.getYForLine(0) + stave.getYForLine(4)) / 2;
    const columns = accidentalColumns(tones), shifted = displacedNotes(tones), placed = new Map();

    for (const tone of tones) {
      const n = parse(tone.key), color = tone.color || COLOR.ink, slot = tone.slot ?? CENTER;
      const group = context.openGroup('tone');
      group.dataset.tone = tone.id;
      // 被强调颜色的音（根音、三音……）：播放时提亮，不换颜色
      if (color !== COLOR.ink && color !== COLOR.faint) { group.classList.add('tone-colored'); group.style.setProperty('--tone-color', color); }
      // duration：默认全音符；'h' / 'q' 带符干，stem: 'up' | 'down' 指定方向（多声部各自独立的符干）；
      // stem: 'none' 不画自己的符干（和别的音共用一根，见 scene.stems）
      const duration = tone.duration || 'w';
      const note = new VF.StaveNote({clef: 'treble', keys: [n.letter.toLowerCase() + n.accidental + '/' + n.octave], duration,
        ...(tone.stem && tone.stem !== 'none' ? {stem_direction: tone.stem === 'up' ? 1 : -1} : {auto_stem: true})});
      if (tone.stem === 'none') note.setStemStyle({strokeStyle: 'transparent', fillStyle: 'transparent'});
      note.setLedgerLineStyle({strokeStyle: COLOR.ink, lineWidth: GEO.ledgerLine});
      const accidental = n.accidental ? new VF.Accidental(n.accidental) : null;
      if (accidental) note.addModifier(accidental, 0);
      note.setKeyStyle(0, {fillStyle: color, strokeStyle: color});
      note.setStave(stave);
      const voice = new VF.Voice({num_beats: 4, beat_value: 4}).setMode(VF.Voice.Mode.SOFT).addTickables([note]);
      NotationRenderer.createFormatter().joinVoices([voice]).format([voice], 0);
      // 排版之后再设定变音记号的列（正值向左）；错开的符头，记号仍贴着和弦左侧。
      // 二度错开的距离：Bravura 符头是倾斜的椭圆，按实际轮廓测得（谱线间距 10）。
      // 二分 / 四分音符：右边的音较高 11.7、较低 8.4，轮廓正好相切；全音符用 13（略有重叠，视觉上相切）。
      const head = note.getNoteHeadEndX() - note.getNoteHeadBeginX();
      const partner = shifted.has(tone.id) && tones.find(t => t !== tone && (t.slot ?? CENTER) === slot && Math.abs(staffStep(t.key) - staffStep(tone.key)) === 1);
      const displace = !shifted.has(tone.id) ? 0 : duration === 'w' ? 13 : partner && staffStep(partner.key) > staffStep(tone.key) ? 8.4 : 11.7;
      if (accidental) accidental.setXShift(accidental.getXShift() + 1.5 + columns.get(tone.id) * GEO.accidentalColumn + displace);
      // 符头中心对准该位置的中心；二度错开的音再右移一个符头。
      const x = slotCenter(slot) - head / 2 + displace;
      const tick = note.getTickContext();
      tick.setX(tick.getX() + x - note.getNoteHeadBeginX());
      voice.draw(context, stave);
      const y = note.getYs()[0];
      if (tone.label) {
        context.save();
        context.setFont(LABEL_FONT, `${GEO.labelSize}px`, 'bold');
        context.setFillStyle(tone.labelColor || color);
        context.fillText(tone.label, note.getNoteHeadEndX() + GEO.labelGap, y + GEO.labelSize * 0.36);
        context.restore();
      }
      context.closeGroup();
      const line = note.getKeyProps()[0].line;
      const ledgers = line < 1 ? Math.floor(1 - line) : line > 5 ? Math.floor(line - 5) : 0; // 加线数
      placed.set(tone.id, {node: group, x, y, look: [n.accidental, ledgers, tone.label || '', color, tone.labelColor || '', duration, tone.stem || ''].join('|'),
        headLeft: note.getNoteHeadBeginX(), headRight: note.getNoteHeadEndX()});
    }

    // 共用的符干（和弦记谱）：scene.stems = [{id, tones: [下方的音, 上方的音], dir: 'up'}]
    // 朝上的符干画在下方符头的右缘，从下方的音画到上方的音之上 3.5 个间距；两个音都设 stem: 'none'。
    for (const stem of scene.stems || []) {
      const [low, high] = stem.tones.map(id => placed.get(id));
      if (!low || !high) continue;
      const up = stem.dir !== 'down', x = up ? low.headRight - .75 : high.headLeft + .75;
      const group = context.openGroup('tone');
      group.dataset.tone = stem.id;
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', x);
      line.setAttribute('x2', x);
      line.setAttribute('y1', up ? low.y : high.y);
      line.setAttribute('y2', up ? high.y - 35 : low.y + 35);
      line.setAttribute('stroke', COLOR.ink);
      line.setAttribute('stroke-width', '1.5');
      group.append(line);
      context.closeGroup();
      placed.set(stem.id, {node: group, x, y: low.y, look: 'stem'});
    }

    for (const symbol of scene.staffSymbols || []) {
      const slot = symbol.slot ?? CENTER, id = symbolId(symbol);
      const group = context.openGroup('tone');
      group.dataset.tone = id;
      // 和弦记号左缘对齐符头左缘；anchor: 'middle' 的文字（如「上行」、度数）居中于该位置。
      // lift：离第一线的距离，默认 16；避让朝上的符干时加大
      const y = stave.getYForLine(0) - (symbol.lift ?? GEO.symbolLift), x = slotCenter(slot) - (symbol.anchor === 'middle' ? 0 : HEAD_HALF);
      drawSymbol(group, x, y, symbol);
      context.closeGroup();
      placed.set(id, {node: group, x, y, look: 'symbol|' + symbolId({...symbol, id: null})});
    }

    // 谱表下方的文字（如「大 小 增 减」「原位 转位」）：居中对齐各自和弦的符头。
    for (const label of scene.staffLabels || []) {
      const slot = label.slot ?? CENTER, id = label.id || `label:${slot}:${label.text}`;
      const group = context.openGroup('tone');
      group.dataset.tone = id;
      const text = document.createElementNS(SVG_NS, 'text');
      // drop：上下移动（px，负数向上），用于多行标注
      const x = slotCenter(slot), y = middle + GEO.half - 10 + (label.drop || 0);
      text.setAttribute('x', x);
      text.setAttribute('y', y);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('class', 'staff-symbol staff-caption');
      text.setAttribute('font-family', LABEL_FONT);
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', label.color || '#334155');
      text.textContent = label.text;
      group.append(text);
      context.closeGroup();
      placed.set(id, {node: group, x, y, look: 'label|' + label.text});
    }

    const svg = host.querySelector('svg');
    svg.setAttribute('viewBox', `0 ${middle - GEO.half} ${GEO.width} ${GEO.half * 2}`);
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(GEO.half * 2 * scale));
    svg.style.width = width + 'px';
    svg.style.height = 'auto';
    svg.dataset.theoryMusicFit = 'true'; // 视口已固定，共享框架不要再裁切
    svg.querySelectorAll('text:not(.staff-symbol)').forEach(text => text.classList.add('staff-label'));
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', tones.length ? '五线谱：' + tones.map(t => pretty(t.key)).join('、') : '空白五线谱');
    return {svg, placed};
  }

  // 神奇移动：比较前后两个场景中同一 id 的音（或记号）。
  function transition(svg, before, after) {
    const shift = (dx, dy) => `translate(${dx}px, ${dy}px)`;
    for (const [id, now] of after.placed) {
      const old = before.placed.get(id);
      if (!old) {
        // 新出现：原地渐入
        now.node.animate([{opacity: 0, transform: 'translateY(-4px)'}, {opacity: 1, transform: 'none'}], {duration: 450, delay: 150, easing: 'ease-out', fill: 'backwards'});
        continue;
      }
      const dx = old.x - now.x, dy = old.y - now.y;
      if (!dx && !dy && old.look === now.look) continue;
      if (old.look === now.look) {
        // 只是换了位置：整组滑过去
        now.node.animate([{transform: shift(dx, dy)}, {transform: 'none'}], {...MOTION, fill: 'backwards'});
        continue;
      }
      // 外观也变了（变音记号、加线、标签或颜色）：旧图形边移动边淡出，新图形边移动边淡入
      svg.append(old.node);
      old.node.animate([{transform: 'none', opacity: 1}, {opacity: 0, offset: .35}, {transform: shift(-dx, -dy), opacity: 0}], {...MOTION, fill: 'forwards'})
        .onfinish = () => old.node.remove();
      now.node.animate([{transform: shift(dx, dy), opacity: 0}, {opacity: 1, offset: .35}, {transform: 'none', opacity: 1}], {...MOTION, fill: 'backwards'});
    }
    for (const [id, old] of before.placed) {
      if (after.placed.has(id)) continue;
      // 消失：原地渐出
      svg.append(old.node);
      old.node.animate([{opacity: 1}, {opacity: 0}], {duration: 350, easing: 'ease-in', fill: 'forwards'}).onfinish = () => old.node.remove();
    }
  }

  // 文字区块（说明）内容变化时渐变替换。
  function swapHTML(element, html, animate) {
    if (element.innerHTML === html) return;
    element.innerHTML = html;
    element.hidden = !html;
    if (animate && html && !reducedMotion()) element.animate([{opacity: 0}, {opacity: 1}], {duration: 450, easing: 'ease-out'});
  }

  /* ---------- 演示区 ---------- */
  // 布局：上区 · 谱表 · 下区（说明、按钮）。上下区预留同样高度，谱表在正中；记号画在谱表上方。
  // 不需要谱表的步骤（纯记号、对照表）用 panel：谱表淡出，面板淡入，占据整个演示区中央。
  function create(boardEl) {
    const layout = document.createElement('div');
    layout.className = 'chord-board';
    layout.innerHTML =
      '<div class="zone zone-top"></div>' +
      '<div class="chord-staff" data-notation></div>' +
      '<div class="zone zone-bottom"><p class="stage-caption" hidden></p><div class="board-controls" role="group" hidden></div></div>' +
      '<div class="stage-panel" hidden></div>';
    const host = layout.querySelector('.chord-staff');
    const captionEl = layout.querySelector('.stage-caption');
    const controlsEl = layout.querySelector('.board-controls');
    const panelEl = layout.querySelector('.stage-panel');
    let scene = {tones: []}, drawn = null, lastWidth = 0, panelKey = null;

    function scale() {
      const board = host.closest('.lesson-board');
      const byWidth = (host.clientWidth || 320) / GEO.width;
      if (!board) return Math.max(1, Math.min(1.6, byWidth));
      const style = getComputedStyle(board);
      const inner = board.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      const reserve = parseFloat(getComputedStyle(layout).getPropertyValue('--stage-zone')) || 76;
      const gap = parseFloat(getComputedStyle(layout).rowGap) || 0;
      return Math.max(.9, Math.min(1.6, byWidth, (inner - 2 * reserve - 2 * gap) / (GEO.half * 2)));
    }
    function draw(animate) {
      if (!VF) { host.innerHTML = '<p class="theory-note">五线谱组件未载入，请检查网络连接后刷新页面。</p>'; return; }
      const s = scale();
      const before = drawn && drawn.scale === s && host.contains(drawn.svg) ? drawn : null;
      const after = render(host, scene, s);
      drawn = {...after, scale: s};
      if (animate && before && !reducedMotion()) transition(after.svg, before, after);
    }
    // panel：{key, html, state}。同一个 key 只更新 state（由 CSS 过渡高亮），换 key 才替换并渐入。
    function showPanel(panel, animate) {
      layout.classList.toggle('has-panel', !!panel);
      if (!panel) { panelEl.hidden = true; panelKey = null; return; }
      panelEl.hidden = false;
      if (panel.key !== panelKey) {
        panelEl.innerHTML = panel.html;
        panelKey = panel.key;
        if (animate && !reducedMotion()) panelEl.animate([{opacity: 0, transform: 'translateY(6px)'}, {opacity: 1, transform: 'none'}], {duration: 500, easing: 'ease-out'});
      }
      panelEl.dataset.state = panel.state || '';
      // marks：面板里带 data-mark 的元素（如琴键），列出的加上 active（由 CSS 过渡）
      const marks = new Set(panel.marks || []);
      panelEl.querySelectorAll('[data-mark]').forEach(el => el.classList.toggle('active', marks.has(el.dataset.mark)));
    }

    /* 播放高亮：每一帧对照音频时钟，正在响的音加上 is-playing。
       schedule：[{id, at, end}]，at / end 为音频时钟（秒）；heard() 为此刻听到的时刻。 */
    let schedule = [], heard = null, frame = 0;
    function tick() {
      const now = heard(), live = new Set(schedule.filter(s => now >= s.at && now < s.end).map(s => s.id));
      for (const [id, {node}] of drawn?.placed || []) node.classList.toggle('is-playing', live.has(id));
      frame = now < Math.max(...schedule.map(s => s.end)) ? requestAnimationFrame(tick) : 0;
      if (!frame) stopHighlight();
    }
    function highlight(next, clock) {
      stopHighlight();
      if (!next.length) return;
      schedule = next;
      heard = clock;
      frame = requestAnimationFrame(tick);
    }
    function stopHighlight() {
      cancelAnimationFrame(frame);
      frame = 0;
      schedule = [];
      host.querySelectorAll('.is-playing').forEach(node => node.classList.remove('is-playing'));
    }
    new ResizeObserver(() => {
      if (host.clientWidth && host.clientWidth !== lastWidth) { lastWidth = host.clientWidth; draw(false); }
    }).observe(host);

    return {
      element: layout,
      // next：{tones:[{id,key,slot,color,label,duration,stem}],
      //        staffSymbols:[{slot,root,suffix}|{slot,stack}|{id,slot,text,anchor,size,color}], caption,
      //        staffLabels:[{id,slot,text,color,drop}]（谱表下方文字）, controls:[[id, 文字]], pressed,
      //        panel:{key,html,state,marks}, barlines}
      show(next, {animate = false} = {}) {
        scene = {tones: [], ...next};
        swapHTML(captionEl, scene.panel ? '' : scene.caption || '', animate);
        const buttons = (scene.controls || []).map(([id, text]) => `<button type="button" data-control="${id}" aria-pressed="${id === scene.pressed}">${text}</button>`).join('');
        if (controlsEl.innerHTML !== buttons) controlsEl.innerHTML = buttons;
        controlsEl.hidden = !buttons;
        showPanel(scene.panel, animate);
        draw(animate);
      },
      highlight,
      stopHighlight,
      get tones() { return scene.tones; }
    };
  }

  window.ChordStage = Object.freeze({midiOf, COLOR, Sound, chordSymbol, create, pretty, parse, CENTER, PAIR, slotAt: x => (x - GEO.slot0) / GEO.slotWidth});
})();
