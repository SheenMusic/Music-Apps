/* 和弦记号课程 · 共享演示区
   - Sound：网站共享钢琴采样（audio_pn：Salamander Grand Piano V3，C2–C6，每隔小三度一个）
   - Stage：上区 · 谱表 · 下区的演示区；谱表固定居中，场景之间用“神奇移动”过渡
     （相同的音保持不动，移动的音滑到新位置，新出现的音渐入，消失的音渐出）
   - chordSymbol / drawSymbol：和弦记号的统一写法（印刷体：字母后缀缩小、与根音底部对齐；括号及 sus、add、omit、no 为上标）
   依赖：VexFlow 4.2.5、shared/notation（NotationConfig / NotationRenderer）。 */
(() => {
  'use strict';

  /* ---------- 颜色：演示区是固定的浅色纸面，两种主题下都用这组颜色 ---------- */
  const COLOR = {
    ink: '#000000',    // 谱线、谱号、普通符头
    root: '#4f46e5',   // 根音
    third: '#0f766e',  // 三音
    fifth: '#b45309',  // 五音
    seventh: '#be185d', // 七音（第二课起，初稿）
    ext: '#0369a1',    // 延伸音 9 / 11 / 13 与变化音（第三课起，初稿）
    bass: '#dc2626',   // 低音
    faint: '#94a3b8'   // 暂不强调的音
  };

  /* ---------- 音名工具 ---------- */
  const LETTER_STEP = {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11};
  const SAMPLE_NAMES = ['C','Cs','D','Ds','E','F','Fs','G','Gs','A','As','B'];
  function parse(note) {
    // 升降号：# b，以及重升 ## 与重降 bb（如 C°7 的七音 B𝄫）；n = 写出还原号的本位音（N18）
    const m = note.match(/^([A-G])(##|bb|#|b|n)?(\d)$/);
    return {letter: m[1], accidental: m[2] || '', octave: Number(m[3])};
  }
  function midiOf(note) {
    const n = parse(note);
    return 12 * (n.octave + 1) + LETTER_STEP[n.letter] + ({'#': 1, '##': 2, b: -1, bb: -2}[n.accidental] || 0);
  }
  // 谱表上的位置（以“级”计）：同一字母同一八度为同一级。
  const staffStep = note => { const n = parse(note); return n.octave * 7 + 'CDEFGAB'.indexOf(n.letter); };
  const pretty = note => note.replace(/\d/g, '').replace('##', '𝄪').replace('bb', '𝄫').replace('#', '♯').replace(/(?<=.)b/, '♭').replace(/(?<=.)n/, '');

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
    // 贝斯（第三课起）：音名前加「bass:」（如 bass:C2），用低音提琴拨弦的录音（audio_bass/C2.mp3，
    // University of Iowa Electronic Music Studios 的 MIS 采样，可自由使用），其他音高由 C2 变调
    const bassBase = document.documentElement.dataset.bassBase || base.replace(/audio_pn\/?$/, 'audio_bass/');
    function sampleOf(note) {
      if (note.startsWith('bass:')) return {file: 'bass:C2.mp3', url: bassBase + 'C2.mp3', rate: Math.pow(2, (midiOf(note.slice(5)) - 36) / 12)};
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
      const {file, url} = sampleOf(note);
      if (!buffers.has(file)) {
        const request = fetch(url || base + file)
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
  // 依照印刷乐谱的惯例：字母与数字用衬线体 Edwin（MuseScore 的和弦记号字体，仿 New Century Schoolbook）；
  // 升降号用 Bravura Text 的文字用升降号；性质符号写成上标：° + − 用 Edwin 的字形，△ 用 Bravura Text。
  // 字母后缀（m、maj、dim、7…）缩小到 .78 倍，与根音底部对齐。字体文件见 assets/fonts，
  // 由 shared/notation/notation-styles.css 声明。
  const TEXT_FONT = 'Edwin, "Century Schoolbook", "New Century Schoolbook", Georgia, "Times New Roman", serif';
  const MUSIC_FONT = '"Bravura Text", Bravura';
  const MUSIC_GLYPH = {'♭': '\ued60', '♯': '\ued62', '♮': '\ued61', '𝄫': '\ued64', '𝄪': '\ued63', '△': '\ue873', 'ø': '\ue871'};
  const SIGN = '△°ø+−';           // 性质符号：按视觉底线对齐
  const SUFFIX_SCALE = .78, SIGN_SCALE = 1, SIGN_RAISE = 0;  // 性质符号也写在底线上，字号放大到和字母后缀一样醒目
  // 括号里的变化音（如 7(♭9)）：再小一号，放在右上角（规范 N08，Real Book / Berklee 的印刷惯例）
  const ALT_SCALE = .6, ALT_RAISE = .42;
  // 拆成片段：[{text, music, sign, alt}]；同类相邻的字合成一段。alt = 括号里（含括号）
  // 上下标规则（2026-11-21 老师确认）：字母、数字、性质符号（△ ° ø + −）都与音名底线对齐；
  // 括号里的内容，以及括号外的 sus、add、omit、no，与音名顶线对齐（上标）。
  const raisedWords = text => {
    const marks = new Set();
    let depth = 0;
    const plain = [...String(text)].map(ch => { if (ch === '(') depth++; const out = depth ? ' ' : ch; if (ch === ')') depth = Math.max(0, depth - 1); return out; }).join('');
    for (const m of plain.matchAll(/(sus|add|omit|no)\d*/g)) for (let i = m.index; i < m.index + m[0].length; i++) marks.add(i);
    return marks;
  };
  const pieces = text => {
    let depth = 0, index = -1;
    const words = raisedWords(text);
    return [...String(text)].reduce((list, ch) => {
      index++;
      if (ch === '(') depth++;
      const alt = depth > 0 || words.has(index);
      if (ch === ')') depth = Math.max(0, depth - 1);
      const music = ch in MUSIC_GLYPH, sign = SIGN.includes(ch) && !alt, glyph = music ? MUSIC_GLYPH[ch] : ch;
      const last = list[list.length - 1];
      if (last && last.music === music && last.sign === sign && last.alt === alt) last.text += glyph; else list.push({text: glyph, music, sign, alt});
      return list;
    }, []);
  };
  const isLetterSuffix = suffix => /^[a-z0-9(]/i.test(suffix);
  // small：以性质符号开头的后缀（如 △7），符号后面的数字仍按字母后缀的大小
  const htmlPieces = (text, small = false) => pieces(text).map(p => {
    // ° 字形本身就在字母上方：单独标出，再往下移到底线
    const cls = [p.music && 'cs-music', p.sign && 'cs-mark', p.sign && p.text.includes('°') && 'cs-degree', p.alt && 'cs-alt', small && !p.sign && !p.alt && 'cs-small'].filter(Boolean).join(' ');
    return cls ? `<span class="${cls}">${p.text}</span>` : p.text;
  }).join('');
  function chordSymbol(root, suffix = '', bass = '') {
    const sign = suffix && !isLetterSuffix(suffix);
    return `<span class="cs"><span class="cs-root">${htmlPieces(root)}</span>` +
      (suffix ? `<span class="cs-suffix${sign ? ' cs-sign' : ''}">${htmlPieces(suffix, sign)}</span>` : '') +
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
  // 大谱表：两行谱表第一线之间的距离；低音谱表下方留的空间（放谱表下方的文字）
  const GRAND_GAP = 92, GRAND_BOTTOM = 46, GRAND_HEIGHT = GEO.half - 20 + 40 + GRAND_GAP + GRAND_BOTTOM;
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

  // 大谱表：同一位置上下两行谱表的音分开处理（二度错开、变音记号分列只在同一行谱表里比较）
  function bySlot(tones) {
    const groups = new Map();
    for (const t of tones) {
      const slot = (t.slot ?? CENTER) + (t._staff === 'bass' ? '|bass' : '');
      if (!groups.has(slot)) groups.set(slot, []);
      groups.get(slot).push(t);
    }
    return groups;
  }
  // N18 同字母变音记号：每个音实际要画的变音记号（'' = 不画，'n' = 还原号）。
  // 同一位置（和声）字母相同、变音不同的音（一度、八度、十五度），本位音写还原号；
  // 同一小节（scene.bars 分隔）里前面出现过同字母、不同变音的音，后面的本位音也写还原号。
  function shownAccidentals(tones, bars = []) {
    const plain = t => { const a = parse(t.key).accidental; return a === 'n' ? '' : a; };
    const letter = t => parse(t.key).letter, bar = t => bars.filter(b => b < (t.slot ?? CENTER)).length;
    const shown = new Map();
    for (const t of tones) {
      const clash = tones.some(o => o !== t && letter(o) === letter(t) && plain(o) !== plain(t) &&
        ((o.slot ?? CENTER) === (t.slot ?? CENTER) || (bars.length && bar(o) === bar(t) && (o.slot ?? CENTER) < (t.slot ?? CENTER))));
      shown.set(t.id, plain(t) || (clash || parse(t.key).accidental === 'n' ? 'n' : ''));
    }
    return shown;
  }
  /* 调号与标准临时记号规则（调式与音阶课程，scene.key 打开；未设 scene.key 的场景不受影响）。
     scene.key：大调调名（'C' 'G' 'Bb' 'F#' …，'C' = 空调号）。每个音按实际音高书写（'C5' 即本位 C）：
     与调号或本小节同一八度前面的同名音不同时才写记号；tone.cautionary 写括号里的提示记号。 */
  const SHARP_ORDER = 'FCGDAEB', FLAT_ORDER = 'BEADGCF';
  const KEY_COUNT = {C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7, F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7};
  function keyDefaults(key) {
    const count = KEY_COUNT[key] || 0, defaults = {};
    for (const letter of 'CDEFGAB') defaults[letter] = '';
    if (count > 0) [...SHARP_ORDER.slice(0, count)].forEach(l => { defaults[l] = '#'; });
    if (count < 0) [...FLAT_ORDER.slice(0, -count)].forEach(l => { defaults[l] = 'b'; });
    return defaults;
  }
  function tonalAccidentals(tones, bars = [], key = 'C') {
    const defaults = keyDefaults(key), shown = new Map();
    const bar = t => bars.filter(b => b < (t.slot ?? CENTER)).length;
    let state = new Map(), current = -1;
    [...tones].sort((a, b) => (a.slot ?? CENTER) - (b.slot ?? CENTER)).forEach(t => {
      if (bar(t) !== current) { current = bar(t); state = new Map(); }
      const n = parse(t.key), place = n.letter + n.octave, actual = n.accidental === 'n' ? '' : n.accidental;
      const before = state.has(place) ? state.get(place) : defaults[n.letter];
      shown.set(t.id, actual !== before ? actual || 'n' : t.cautionary ? `(${actual || 'n'})` : '');
      state.set(place, actual);
    });
    return shown;
  }
  // 变音记号分列（标准排法）：同一位置的和弦自上而下排，
  // 与已放好的记号相距不足七度时，移到更左一列。
  // 同度（同一线或间）：高音的记号在内侧，低音的记号在外侧，与左右错开的符头顺序一致（N18）。
  function accidentalColumns(tones, shown) {
    const columns = new Map();
    for (const list of bySlot(tones.filter(t => shown.get(t.id))).values()) {
      const placed = [];
      list.sort((a, b) => staffStep(b.key) - staffStep(a.key) || midiOf(b.key) - midiOf(a.key)).forEach(t => {
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
      const sorted = [...list].sort((a, b) => staffStep(a.key) - staffStep(b.key) || midiOf(a.key) - midiOf(b.key));
      sorted.forEach((t, i) => {
        const below = sorted[i - 1];
        if (below && staffStep(t.key) - staffStep(below.key) === 1 && !shifted.has(below.id)) shifted.add(t.id);
        // 变音不同的同度（增一度等）：音高较高的符头移到右侧（N18）；完全相同的音（纯一度）保持重叠
        if (below && staffStep(t.key) === staffStep(below.key) && midiOf(t.key) !== midiOf(below.key) && !shifted.has(below.id)) shifted.add(t.id);
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
      // 上标的性质符号用 dy 抬高，下一段再落回基线
      let raised = 0;
      const span = (content, fontSize, fill) => pieces(content).forEach(piece => {
        const t = document.createElementNS(SVG_NS, 'tspan');
        t.textContent = piece.text;
        // font: 'label' = 说明文字（无衬线，可含中文，如「上行」）；默认为和弦记号字体
        t.setAttribute('font-family', piece.music ? MUSIC_FONT : symbol.font === 'label' ? LABEL_FONT : TEXT_FONT);
        if (symbol.font === 'label') t.setAttribute('font-weight', '700');
        // 上标只用于和弦记号（[根音, 后缀, 低音]）；说明文字（如「8 − 3 = 5」）里的符号保持原样
        const sign = piece.sign && Array.isArray(line), alt = piece.alt && Array.isArray(line);
        // ° 字形本身就在字母上方：往下移到底线（Demo 试行）
        const lift = alt ? size * ALT_RAISE : sign ? size * (piece.text.includes('°') ? -0.38 : SIGN_RAISE) : 0;
        if (lift !== raised) { t.setAttribute('dy', raised - lift); raised = lift; }
        t.setAttribute('font-size', alt ? size * ALT_SCALE : sign ? size * SIGN_SCALE * (piece.music ? .9 : 1) : fontSize);
        t.setAttribute('fill', fill);
        text.append(t);
      });
      if (!Array.isArray(line)) span(line.text, size, line.color || COLOR.ink);
      else {
        // [根音, 后缀, 低音]；根音为空时是简化写法「/低音」
        const [root, suffix = '', bass = ''] = line;
        if (root) span(root, size, symbol.color || COLOR.root);
        // 字母后缀与数字 .78 倍；性质符号（△ ° + −）为上标；后缀里的升降号（如 7(♭9)）与数字同大
        if (suffix) span(suffix, size * SUFFIX_SCALE, symbol.color || COLOR.third);
        // symbol.color：整个记号同一颜色（练习与 Quiz 答对后显示的黑色印刷体），斜线也一样
        if (bass) { span('/', size, symbol.color || COLOR.faint); span(bass, size, symbol.color || COLOR.bass); }
      }
      group.append(text);
    });
  }
  // 一排和弦记号（谱例上方）：都写在基准行；和左边的记号挤在一起时往上跳一行，
  // 第二行也挤就跳到第三行，以此类推；不挤的记号回到基准行。
  // items：[{x, symbol}]，按 x 从左到右。返回每个记号的 {row, box}（box 已含上移）和最高处的 y。
  function stackSymbols(group, items, baseline, {gap = 4, rowHeight} = {}) {
    const rightEdges = [];
    let top = Infinity;
    const placed = items.map(item => {
      const g = document.createElementNS(SVG_NS, 'g');
      group.append(g);
      drawSymbol(g, item.x, baseline, item.symbol);
      const box = g.getBBox();
      let row = 0;
      while (rightEdges[row] !== undefined && rightEdges[row] + gap > box.x) row++;
      rightEdges[row] = box.x + box.width;
      const lift = row * (rowHeight || (item.symbol.size || GEO.symbolSize) * 1.15);
      if (lift) g.setAttribute('transform', `translate(0 ${-lift})`);
      top = Math.min(top, box.y - lift);
      return {row, box: {x: box.x, y: box.y - lift, width: box.width, height: box.height}};
    });
    return {placed, top};
  }
  const symbolId = symbol => symbol.id || 'symbol:' + (symbol.stack || [symbol.text ? [symbol.text] : [symbol.root, symbol.suffix || '', symbol.bass ? '/' + symbol.bass : '']])
    .map(line => Array.isArray(line) ? line.join('') : line.text).join('/');

  /* ---------- 带节奏的小段乐谱（scene.score，第四课 alt 起） ----------
     大谱表、不写拍号与小节线；八分音符自动连符尾。
     score = {treble: [item], bass: [item], symbol: {root, suffix}, beat: 每拍秒数}
     item = {keys: ['G#4', 'D4', 'A3'], d: 'w' | 'h' | 'q' | '8', dot, arp（琶音）, small（小符头）, ring（发声拍数）, labels: ['♯9', '13', '3']（上方的文字，从上到下）}
     scoreScene(score, extra) 生成可播放的场景：点一个音（或和弦）播放它，点空白处按节奏播放整段。 */
  const BEATS = {w: 4, h: 2, q: 1, '8': .5};
  const beatsOf = item => BEATS[item.d] * (item.dot ? 1.5 : 1);
  function scoreScene(score, extra = {}) {
    const beat = score.beat || .5, tones = [], offsets = [], durations = [];
    for (const staff of ['treble', 'bass']) {
      let at = 0;
      (score[staff] || []).forEach((item, k) => {
        item.ids = item.keys.map((key, i) => `${staff[0]}${k}-${i}`);
        // ring：发声的拍数（如左手全音符在右手弹完之前一直响着），默认等于时值
        item.keys.forEach((key, i) => { tones.push({id: item.ids[i], key}); offsets.push(at * beat); durations.push((item.ring || beatsOf(item)) * beat); });
        at += beatsOf(item);
      });
    }
    return {grand: true, tap: 'chord', ...extra, score, tones, offsets, durations};
  }
  function renderScore(host, scene, scale) {
    const score = scene.score, W = GEO.width * (scene.wide || 1);
    host.replaceChildren();
    const renderer = NotationRenderer.createRenderer(host, {scale});
    renderer.resize(W, GEO.half * 2 + 60 + GRAND_GAP);
    const context = renderer.getContext();
    const make = (y, clef) => {
      const stave = NotationRenderer.createStave(16, y, W - 20);
      stave.setEndBarType(VF.Barline.type.NONE);
      stave.setStyle({strokeStyle: COLOR.ink, fillStyle: COLOR.ink, lineWidth: GEO.staffLine});
      stave.addClef(clef);
      return stave;
    };
    const treble = make(40, 'treble'), bass = make(40 + GRAND_GAP, 'bass');
    VF.Stave.formatBegModifiers([treble, bass]);
    treble.setContext(context).draw();
    bass.setContext(context).draw();
    for (const type of ['brace', 'singleLeft']) new VF.StaveConnector(treble, bass).setType(type).setContext(context).draw();
    const built = [], voices = [], beams = [];
    for (const [staff, stave] of [['treble', treble], ['bass', bass]]) {
      const items = score[staff] || [];
      if (!items.length) continue;
      const notes = items.map(item => {
        const keys = item.keys.map(key => { const p = parse(key); return p.letter.toLowerCase() + (p.accidental === 'n' ? '' : p.accidental) + '/' + p.octave; });
        const note = new VF.StaveNote({clef: staff, keys, duration: item.d + (item.dot ? 'd' : ''),
          ...(item.stem ? {stem_direction: item.stem === 'up' ? 1 : -1} : {auto_stem: true}), ...(item.small ? {glyph_font_scale: 27} : {})});
        note.setStave(stave);
        item.keys.forEach((key, i) => { const a = parse(key).accidental; if (a) note.addModifier(new VF.Accidental(a), i); });
        if (item.dot) VF.Dot.buildAndAttach([note], {all: true});
        if (item.arp) note.addModifier(new VF.Stroke(VF.Stroke.Type.ARPEGGIO_DIRECTIONLESS), 0);
        // 上方文字：先加的离符头最近，所以从下往上加
        [...(item.labels || [])].reverse().forEach(text => {
          const label = new VF.Annotation(text).setVerticalJustification(VF.Annotation.VerticalJustify.TOP);
          label.setFont(LABEL_FONT, 9);
          note.addModifier(label, 0);
        });
        built.push({note, ids: item.ids});
        return note;
      });
      voices.push(new VF.Voice({num_beats: 4, beat_value: 4}).setMode(VF.Voice.Mode.SOFT).addTickables(notes));
      if (staff === 'treble') beams.push(...VF.Beam.generateBeams(notes.filter((n, i) => items[i].d === '8')));
    }
    const formatter = new VF.Formatter();
    voices.forEach(voice => formatter.joinVoices([voice]));
    formatter.format(voices, treble.getNoteEndX() - treble.getNoteStartX() - 24);
    const placed = new Map();
    for (const {note, ids} of built) {
      const group = context.openGroup('tone');
      group.dataset.tone = ids[0];
      note.setContext(context).draw();
      context.closeGroup();
      placed.set(ids[0], {node: group, x: note.getAbsoluteX(), y: note.getYs()[0], look: 'score|' + ids.join(), play: ids});
    }
    beams.forEach(beam => beam.setContext(context).draw());
    // 和弦记号：写在第一个音的上方
    const view = {top: treble.getYForLine(0) - (GEO.half - 4), bottom: bass.getYForLine(4) + GRAND_BOTTOM};
    if (score.symbol) {
      const group = context.openGroup('tone');
      group.dataset.tone = 'score-symbol';
      drawSymbol(group, treble.getNoteStartX() + 2, view.top + GEO.symbolSize + 2, score.symbol);
      context.closeGroup();
      placed.set('score-symbol', {node: group, x: 0, y: 0, look: 'symbol|' + score.symbol.root + score.symbol.suffix, play: scene.tones.map(t => t.id)});
    }
    const svg = host.querySelector('svg'), height = view.bottom - view.top, width = GEO.width * scale;
    svg.setAttribute('viewBox', `0 ${view.top} ${W} ${height}`);
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height * scale / (scene.wide || 1)));
    svg.style.width = width + 'px';
    svg.style.height = 'auto';
    svg.dataset.theoryMusicFit = 'true';
    svg.querySelectorAll('text:not(.staff-symbol)').forEach(text => text.classList.add('staff-label'));
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', '五线谱片段');
    return {svg, placed, height};
  }

  // 每个音（和每个记号）单独成组（<g data-tone>），方便场景之间逐个追踪。
  function render(host, scene, scale) {
    if (scene.score) return renderScore(host, scene, scale);
    // scene.grand：大谱表（第三课起）。C4 以下的音写在低音谱表（tone.staff 可指定 'treble' / 'bass'）
    const grand = !!scene.grand;
    const tones = scene.tones.map(t => ({...t, _staff: grand && (t.staff === 'bass' || (t.staff !== 'treble' && midiOf(t.key) < 60)) ? 'bass' : 'treble'}));
    host.replaceChildren();
    // scene.wide：画布加宽到 wide 倍、显示宽度不变（整体缩小），用于一行放不下的多个和弦
    const wide = scene.wide || 1, W = GEO.width * wide;
    const width = GEO.width * scale;
    const renderer = NotationRenderer.createRenderer(host, {scale});
    renderer.resize(W, GEO.half * 2 + 60 + (grand ? GRAND_GAP : 0));
    const context = renderer.getContext();
    // scene.barlines：传 options，共享谱表不再在绘制时去掉结束线
    const makeStave = (y, clef) => {
      const stave = NotationRenderer.createStave(grand ? 16 : 4, y, W - (grand ? 20 : 8), scene.barlines ? {initial: true} : undefined);
      // 不完整的音乐片段：谱表左右开放，不画小节线。带拍号的（scene.time，如 '4/4'）是真实的音乐片段，画结束线（N03）。
      if (!scene.barlines && !scene.time) stave.setEndBarType(VF.Barline.type.NONE);
      stave.setStyle({strokeStyle: COLOR.ink, fillStyle: COLOR.ink, lineWidth: GEO.staffLine});
      stave.addClef(clef);
      if (scene.key && scene.key !== 'C') stave.addKeySignature(scene.key);
      if (scene.time) stave.addTimeSignature(scene.time);
      return stave;
    };
    const stave = makeStave(40, 'treble');
    const bassStave = grand ? makeStave(40 + GRAND_GAP, 'bass') : null;
    if (grand) VF.Stave.formatBegModifiers([stave, bassStave]);
    stave.setContext(context).draw();
    if (grand) {
      bassStave.setContext(context).draw();
      for (const type of ['brace', 'singleLeft']) new VF.StaveConnector(stave, bassStave).setType(type).setContext(context).draw();
    }
    const staveOf = tone => tone._staff === 'bass' ? bassStave : stave;
    // 画面的上下范围：单行谱表以中线为中心；大谱表从高音谱表上方到低音谱表下方
    const lineY = (st, line) => st.getYForLine(line);
    const view = grand
      ? {top: lineY(stave, 0) - (GEO.half - 20), bottom: lineY(bassStave, 4) + GRAND_BOTTOM}
      : {top: (lineY(stave, 0) + lineY(stave, 4)) / 2 - GEO.half, bottom: (lineY(stave, 0) + lineY(stave, 4)) / 2 + GEO.half};
    // 某个音在它那一行谱表上的 y（不画也能算）：用于八度范围框
    const yOfKey = (key, st, clef) => lineY(st, 4) - (staffStep(key) - staffStep(clef === 'bass' ? 'G2' : 'E4')) * 5;
    // scene.bars：谱表中间的小节线（位置以 slot 计），用于并排的几个小节；结尾的小节线由 scene.barlines 打开
    for (const slot of scene.bars || []) {
      const line = document.createElementNS(SVG_NS, 'line'), x = slotCenter(slot);
      Object.entries({x1: x, x2: x, y1: stave.getYForLine(0), y2: (bassStave || stave).getYForLine(4), stroke: COLOR.ink, 'stroke-width': 1}).forEach(([k, v]) => line.setAttribute(k, v));
      host.querySelector('svg').append(line);
    }
    const shown = scene.key ? tonalAccidentals(tones, scene.bars, scene.key) : shownAccidentals(tones, scene.bars), columns = accidentalColumns(tones, shown), shifted = displacedNotes(tones), placed = new Map();

    for (const tone of tones) {
      const n = parse(tone.key), color = tone.color || COLOR.ink, slot = tone.slot ?? CENTER, own = staveOf(tone), clef = tone._staff;
      const group = context.openGroup('tone');
      group.dataset.tone = tone.id;
      // 被强调颜色的音（根音、三音……）：播放时提亮，不换颜色
      if (color !== COLOR.ink && color !== COLOR.faint) { group.classList.add('tone-colored'); group.style.setProperty('--tone-color', color); }
      // duration：默认全音符；'h' / 'q' 带符干，stem: 'up' | 'down' 指定方向（多声部各自独立的符干）；
      // stem: 'none' 不画自己的符干（和别的音共用一根，见 scene.stems）
      const duration = tone.duration || 'w';
      const note = new VF.StaveNote({clef, keys: [n.letter.toLowerCase() + (n.accidental === 'n' ? '' : n.accidental) + '/' + n.octave], duration,
        ...(tone.stem && tone.stem !== 'none' ? {stem_direction: tone.stem === 'up' ? 1 : -1} : {auto_stem: true})});
      if (tone.stem === 'none') note.setStemStyle({strokeStyle: 'transparent', fillStyle: 'transparent'});
      note.setLedgerLineStyle({strokeStyle: COLOR.ink, lineWidth: GEO.ledgerLine});
      // 括号里的提示记号（tonalAccidentals 写成 '(n)'）
      const sign = shown.get(tone.id) || '', cautionary = sign.startsWith('(');
      const accidental = sign ? new VF.Accidental(cautionary ? sign.slice(1, -1) : sign) : null;
      if (cautionary) accidental.setAsCautionary();
      if (accidental) note.addModifier(accidental, 0);
      note.setKeyStyle(0, {fillStyle: color, strokeStyle: color});
      note.setStave(own);
      const voice = new VF.Voice({num_beats: 4, beat_value: 4}).setMode(VF.Voice.Mode.SOFT).addTickables([note]);
      NotationRenderer.createFormatter().joinVoices([voice]).format([voice], 0);
      // 排版之后再设定变音记号的列（正值向左）；错开的符头，记号仍贴着和弦左侧。
      // 二度错开的距离：Bravura 符头是倾斜的椭圆，按实际轮廓测得（谱线间距 10）。
      // 二分 / 四分音符：右边的音较高 11.7、较低 8.4，轮廓正好相切；全音符用 13（略有重叠，视觉上相切）。
      const head = note.getNoteHeadEndX() - note.getNoteHeadBeginX();
      const partner = shifted.has(tone.id) && tones.find(t => t !== tone && (t.slot ?? CENTER) === slot && t._staff === tone._staff && Math.abs(staffStep(t.key) - staffStep(tone.key)) <= 1);
      const displace = !shifted.has(tone.id) ? 0 : duration === 'w' ? 13 : partner && staffStep(partner.key) > staffStep(tone.key) ? 8.4 : 11.7;
      if (accidental) accidental.setXShift(accidental.getXShift() + 1.5 + columns.get(tone.id) * GEO.accidentalColumn + displace);
      // 符头中心对准该位置的中心；二度错开的音再右移一个符头。
      const x = slotCenter(slot) - head / 2 + displace;
      const tick = note.getTickContext();
      tick.setX(tick.getX() + x - note.getNoteHeadBeginX());
      voice.draw(context, own);
      const y = note.getYs()[0];
      // 符头右边的标签；tone.labelScale 放大（如突出「7」），tone.labelShift 往右挪（被错开的符头挡住时会自动往右挪，不用手动设）
      if (tone.label) {
        const labelSize = GEO.labelSize * (tone.labelScale || 1);
        context.save();
        context.setFont(LABEL_FONT, `${labelSize}px`, 'bold');
        context.setFillStyle(tone.labelColor || color);
        // 自动避让：同一位置有被二度错开到右边的符头，且上下离得近（两个音级以内），标签挪到那个符头右边；
        // 那个音自己也有标签时，再让出它的标签宽度
        const step = staffStep(tone.key);
        const blockers = shifted.has(tone.id) ? [] : tones.filter(t => t !== tone && shifted.has(t.id) && (t.slot ?? CENTER) === slot && t._staff === tone._staff && Math.abs(staffStep(t.key) - step) <= 2);
        const avoid = blockers.length ? Math.max(...blockers.map(t => ((t.duration || 'w') === 'w' ? 13 : 11.7) +
          (t.label && Math.abs(staffStep(t.key) - step) <= 1 ? GEO.labelGap + GEO.labelSize * (t.labelScale || 1) * 0.65 * t.label.length : 0))) : 0;
        context.fillText(tone.label, note.getNoteHeadEndX() + GEO.labelGap + Math.max(avoid, tone.labelShift || 0), y + labelSize * 0.36);
        context.restore();
      }
      context.closeGroup();
      const line = note.getKeyProps()[0].line;
      const ledgers = line < 1 ? Math.floor(1 - line) : line > 5 ? Math.floor(line - 5) : 0; // 加线数
      placed.set(tone.id, {node: group, x, y, look: [shown.get(tone.id), ledgers, tone.label || '', tone.labelScale || 1, tone.labelShift || 0, color, tone.labelColor || '', duration, tone.stem || '', clef].join('|'),
        headLeft: note.getNoteHeadBeginX(), headRight: note.getNoteHeadEndX(), tone: true, slot, key: tone.key, staff: own, clef});
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
      // 和弦里有加线以上的高音时，记号自动抬高，不压在符头上
      const highest = Math.min(Infinity, ...[...placed.values()].filter(p => p.tone && p.slot === slot).map(p => p.y));
      const auto = Math.max(GEO.symbolLift, stave.getYForLine(0) - highest + 12);
      const y = stave.getYForLine(0) - (symbol.lift ?? auto), x = slotCenter(slot) - (symbol.anchor === 'middle' ? 0 : HEAD_HALF);
      drawSymbol(group, x, y, symbol);
      context.closeGroup();
      placed.set(id, {node: group, x, y, look: 'symbol|' + symbolId({...symbol, id: null}), play: tones.filter(t => (t.slot ?? CENTER) === slot).map(t => t.id)});
    }

    // scene.arrows：[[从哪个音, 到哪个音, 颜色?], …]：声部进行的倾向，从前一个符头右边指到后一个符头左边
    for (const [from, to, color] of scene.arrows || []) {
      const a = placed.get(from), b = placed.get(to);
      if (!a || !b) continue;
      const id = `arrow:${from}:${to}`, group = context.openGroup('tone');
      group.dataset.tone = id;
      // 起点在这个和弦最右边的符头之后（二度错开的符头不挡住箭头），终点在目标和弦最左边的符头之前
      const slotOf = id => (tones.find(t => t.id === id)?.slot ?? CENTER);
      const edge = (id, pick) => pick(...tones.filter(t => (t.slot ?? CENTER) === slotOf(id)).map(t => placed.get(t.id)).filter(Boolean).map(p => pick === Math.max ? p.headRight : p.headLeft));
      const x1 = edge(from, Math.max) + 3, x2 = edge(to, Math.min) - 3, y1 = a.y, y2 = b.y;
      const angle = Math.atan2(y2 - y1, x2 - x1), size = 4.5, ink = color || '#64748b';
      const line = document.createElementNS(SVG_NS, 'path');
      const back = (k, turn) => `${x2 - size * Math.cos(angle + turn) * k} ${y2 - size * Math.sin(angle + turn) * k}`;
      line.setAttribute('d', `M ${x1} ${y1} L ${x2} ${y2} M ${back(1, .5)} L ${x2} ${y2} L ${back(1, -.5)}`);
      Object.entries({fill: 'none', stroke: ink, 'stroke-width': 1.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'staff-arrow'}).forEach(([k, v]) => line.setAttribute(k, v));
      group.append(line);
      context.closeGroup();
      placed.set(id, {node: group, x: x1, y: y1, look: `arrow|${x2 - x1}|${y2 - y1}|${ink}`});
    }

    // 谱表下方的文字（如「大 小 增 减」「原位 转位」）：居中对齐各自和弦的符头。
    for (const label of scene.staffLabels || []) {
      const slot = label.slot ?? CENTER, id = label.id || `label:${slot}:${label.text}`;
      const group = context.openGroup('tone');
      group.dataset.tone = id;
      const text = document.createElementNS(SVG_NS, 'text');
      // drop：上下移动（px，负数向上），用于多行标注
      const x = slotCenter(slot), y = view.bottom - 10 + (label.drop || 0);
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
      placed.set(id, {node: group, x, y, look: 'label|' + label.text, play: label.play || tones.filter(t => (t.slot ?? CENTER) === slot).map(t => t.id)});
    }

    drawOverlays(context, scene, tones, placed, view, yOfKey);
    const svg = host.querySelector('svg');
    const height = view.bottom - view.top;
    svg.setAttribute('viewBox', `0 ${view.top} ${W} ${height}`);
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height * scale / wide));
    svg.style.width = width + 'px';
    svg.style.height = 'auto';
    svg.dataset.theoryMusicFit = 'true'; // 视口已固定，共享框架不要再裁切
    svg.querySelectorAll('text:not(.staff-symbol)').forEach(text => text.classList.add('staff-label'));
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', tones.length ? '五线谱：' + tones.map(t => pretty(t.key)).join('、') : '空白五线谱');
    return {svg, placed, height};
  }

  /* ---------- 谱面上的标注（第三课起） ----------
     scene.intervals：[[音 id, 音 id, 文字]]：两个相邻符头之间的音程（如分解和弦相邻两音的 M3）
     scene.brackets：[{from, to, text, drop}]：谱表下方的横括号，from / to 为 slot（如「C」「C7」）
     scene.ladders：[{ids, box}]：「三度台阶」：在和弦右边，把 ids 的符头从低到高连成台阶；box = 框住最高一级
     scene.arcs：[{from, to, text, color, side}]：两个音之间的弧线与音程（side 'left' 默认 / 'right'）
     scene.octaves：[{id, color}]：从这个音往上一个八度的范围框 */
  function drawOverlays(context, scene, tones, placed, view, yOfKey) {
    // play：点这个标注时播放的音（如音程标注 → 那两个音，括号 → 括号下的音）
    const add = (id, look, x, y, build, play) => {
      const group = context.openGroup('tone');
      group.dataset.tone = id;
      build(group);
      context.closeGroup();
      placed.set(id, {node: group, x, y, look, play});
    };
    const el = (name, attrs) => {
      const node = document.createElementNS(SVG_NS, name);
      Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
      return node;
    };
    const label = (x, y, text, color, anchor = 'middle', size = 10) => {
      const t = el('text', {x, y, 'text-anchor': anchor, 'font-family': LABEL_FONT, 'font-size': size, 'font-weight': 700, fill: color, class: 'staff-symbol staff-mark'});
      t.textContent = text;
      return t;
    };
    const head = id => placed.get(id);
    const center = p => (p.headLeft + p.headRight) / 2;
    const GREY = '#64748b';
    for (const [a, b, text, color] of scene.intervals || []) {
      const p = head(a), q = head(b);
      if (!p || !q) continue;
      // 写在谱表下方同一行（不压在谱线和符头上）
      const x = (center(p) + center(q)) / 2, y = view.bottom - 22;
      add(`interval:${a}:${b}`, `interval|${text}|${x}|${y}`, x, y, g => g.append(label(x, y, text, color || GREY, 'middle', 10)), [a, b]);
    }
    // 括号：文字写在横线中间的缺口里，一行只占 12px，两层括号放得下（不压到谱表下方的音）
    for (const {from, to = from, text, drop = 0, color, id} of scene.brackets || []) {
      const x1 = slotCenter(from) - 9, x2 = slotCenter(to) + 9, y = view.bottom - 26 + drop, mid = (x1 + x2) / 2, gap = text.length * 4.5 + 6;
      const play = tones.filter(t => (t.slot ?? CENTER) >= from - 1e-6 && (t.slot ?? CENTER) <= to + 1e-6).map(t => t.id);
      add(id || `bracket:${from}:${to}:${text}`, `bracket|${x1}|${x2}|${y}|${text}`, x1, y, g => {
        g.append(el('path', {d: `M ${x1} ${y - 4} L ${x1} ${y} L ${mid - gap} ${y} M ${mid + gap} ${y} L ${x2} ${y} L ${x2} ${y - 4}`, fill: 'none', stroke: color || GREY, 'stroke-width': 1.1, 'stroke-linejoin': 'round'}));
        g.append(label(mid, y + 4, text, color || '#334155', 'middle', 12));
      }, play);
    }
    for (const {ids, box, color, dx = 8, id} of scene.ladders || []) {
      const heads = ids.map(head).filter(Boolean).sort((p, q) => q.y - p.y);
      if (heads.length < 2) continue;
      const step = 6, x0 = Math.max(...heads.map(p => p.headRight)) + dx, ink = color || GREY;
      let d = '';
      heads.forEach((p, i) => {
        const x = x0 + i * step;
        d += `${i ? 'L' : 'M'} ${x} ${p.y} L ${x + step} ${p.y} `;
        if (heads[i + 1]) d += `L ${x + step} ${heads[i + 1].y} `;
      });
      const top = heads[heads.length - 1], xt = x0 + (heads.length - 1) * step;
      add(id || `ladder:${ids.join(',')}`, `ladder|${d}|${!!box}`, x0, heads[0].y, g => {
        g.append(el('path', {d, fill: 'none', stroke: ink, 'stroke-width': 1.3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round'}));
        if (box) g.append(el('rect', {x: xt - 3, y: top.y - 5, width: step + 6, height: 10, rx: 2, fill: 'none', stroke: COLOR.ext, 'stroke-width': 1.4}));
      }, ids);
    }
    // Demo：shape:'bracket' 为和弦内的一组音添加竖方括号。
    for (const {from, to, text, color, side = 'left', id, shape, ids} of scene.arcs || []) {
      const p = head(from), q = head(to);
      if (!p || !q) continue;
      const left = side === 'left', ink = color || COLOR.ext;
      const sameSlot = tones.filter(t => (t.slot ?? CENTER) === p.slot).map(t => placed.get(t.id)).filter(Boolean);
      const edge = left ? Math.min(...sameSlot.map(h => h.headLeft)) - 26 : Math.max(...sameSlot.map(h => h.headRight)) + 22;
      const bulge = (left ? -1 : 1) * (8 + Math.abs(p.y - q.y) * .08), mid = (p.y + q.y) / 2;
      const bracket = shape === 'bracket', tip = edge + (left ? 5 : -5);
      const path = bracket
        ? `M ${tip} ${p.y} L ${edge} ${p.y} L ${edge} ${q.y} L ${tip} ${q.y}`
        : `M ${edge} ${p.y} Q ${edge + bulge * 2} ${mid} ${edge} ${q.y}`;
      add(id || `arc:${from}:${to}`, `arc|${shape || 'curve'}|${text}|${edge}|${p.y}|${q.y}|${ink}`, edge, mid, g => {
        g.append(el('path', {d: path, fill: 'none', stroke: ink, 'stroke-width': 1.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}));
        const textX = bracket ? edge + (left ? -5 : 5) : edge + bulge + (left ? -3 : 3);
        g.append(label(textX, mid + 3.5, text, ink, left ? 'end' : 'start'));
      }, ids || [from, to]);
    }
    for (const {id: from, color} of scene.octaves || []) {
      const p = head(from);
      if (!p) continue;
      const octave = p.key.replace(/\d$/, n => Number(n) + 1);
      const y1 = yOfKey(octave, p.staff, p.clef) - 7, y2 = p.y + 7, ink = color || COLOR.bass;
      const x1 = p.headLeft - 22, x2 = p.headRight + 34;
      add(`octave:${from}`, `octave|${y1}|${y2}`, x1, y1, g => g.append(el('rect', {x: x1, y: y1, width: x2 - x1, height: y2 - y1, rx: 4, fill: 'none', stroke: ink, 'stroke-width': 1.2, 'stroke-dasharray': '4 3'})), null);
    }
  }
  /* 点击谱面（全部课程，v1.26）：
     ① 点在符头（或符头旁的标签）上 → 这一个音；
     ② 点在标注上（谱表下方的度数、音程、括号、台阶、弧线、和弦记号）→ 标注对应的音；
     ③ 点在某个和弦的竖列里（符头之间、上下）→ 这个和弦；
     ④ 都不是 → null（由课程播放整个谱面）。返回 {ids, single}；single = 只点了一个音（灰色的省略音也照样发声） */
  function hitTest(drawn, event) {
    if (!drawn?.svg) return null;
    const group = event.target.closest?.('[data-tone]');
    const own = group && drawn.svg.contains(group) && drawn.placed.get(group.dataset.tone);
    if (own?.tone) return {ids: [group.dataset.tone], single: true};
    if (own?.play?.length) return {ids: own.play, single: own.play.length === 1};
    const matrix = drawn.svg.getScreenCTM();
    if (!matrix) return null;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    const heads = [...drawn.placed.entries()].filter(([, p]) => p.tone);
    if (!heads.length) return null;
    const cx = p => (p.headLeft + p.headRight) / 2;
    const near = heads.filter(([, p]) => Math.abs(cx(p) - point.x) < 9 && Math.abs(p.y - point.y) < 6);
    if (near.length) return {ids: [near.sort((a, b) => Math.abs(a[1].y - point.y) - Math.abs(b[1].y - point.y))[0][0]], single: true};
    const slots = [...new Set(heads.map(([, p]) => p.slot))];
    const slot = slots.reduce((a, b) => Math.abs(slotCenter(b) - point.x) < Math.abs(slotCenter(a) - point.x) ? b : a);
    // 只有一列和弦时，点哪里都是整个谱面（交给课程处理）
    if (slots.length < 2 || Math.abs(slotCenter(slot) - point.x) >= 16) return null;
    const column = heads.filter(([, p]) => p.slot === slot), ys = column.map(([, p]) => p.y);
    if (point.y < Math.min(...ys) - 24 || point.y > Math.max(...ys) + 24) return null;  // 和弦竖列的上下范围之外 = 空白处
    const ids = column.map(([id]) => id);
    return {ids, single: ids.length === 1};
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
      // 位置不变、只换了颜色或标签（如第六课换根音）：新图形直接显示，旧图形盖在上面淡出，符头不闪
      if (!dx && !dy) {
        svg.append(old.node);
        old.node.animate([{opacity: 1}, {opacity: 0}], {duration: 220, easing: 'ease-out', fill: 'forwards'}).onfinish = () => old.node.remove();
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
      return Math.max(.9, Math.min(1.6, byWidth, (inner - 2 * reserve - 2 * gap) / (scene.grand ? GRAND_HEIGHT : GEO.half * 2)));
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
        layout.classList.toggle('is-tappable', !!scene.tap);
        swapHTML(captionEl, scene.panel ? '' : scene.caption || '', animate);
        const buttons = (scene.controls || []).map(([id, text]) => `<button type="button" data-control="${id}" aria-pressed="${id === scene.pressed}">${text}</button>`).join('');
        if (controlsEl.innerHTML !== buttons) controlsEl.innerHTML = buttons;
        controlsEl.hidden = !buttons;
        showPanel(scene.panel, animate);
        draw(animate);
      },
      highlight,
      stopHighlight,
      // 点击谱面：返回点到的音（或和弦、标注对应的音），见 hitTest
      hit: event => hitTest(drawn, event),
      get tones() { return scene.tones; }
    };
  }

  // drawSymbol：练习页在自己的谱例上方写和弦记号（与演示区同一套印刷体）
  window.ChordStage = Object.freeze({midiOf, COLOR, Sound, chordSymbol, drawSymbol, stackSymbols, create, pretty, parse, scoreScene, CENTER, PAIR, slotAt: x => (x - GEO.slot0) / GEO.slotWidth});
})();
