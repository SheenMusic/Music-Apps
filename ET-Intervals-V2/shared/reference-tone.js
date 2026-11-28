/* 参考音（音程听力训练 V2.1 的构唱课共用）
   默认钢琴采样（网站共享 audio_pn：Salamander Grand Piano，C2–C6，每隔小三度一个，
   每个音用最近的采样、变调不超过 1 个半音；与综合测试相同）。可以换成正弦波。
   钢琴音会自然衰减，所以每次播放固定长度，不再「一直响到按停止」。

   ReferenceTone.play(midi, timbre, volumes) → 返回播放秒数；timbre 为 'piano' 或 'sine'；
     midi 也可以是数组（和声模唱课同时播放低音和高音）
   ReferenceTone.playSequence([{ midi, at, seconds }, …], timbre) → 按时间先后播放（听辨课：两个音一前一后），返回总秒数
   ReferenceTone.stop()
   ReferenceTone.preload() → 先载入全部采样（约 2.4 MB） */
(function (root) {
  'use strict';
  const SAMPLE_BASE = '/audio_pn/';
  const SAMPLE_NAMES = { 0: 'C', 3: 'Ds', 6: 'Fs', 9: 'A' };
  const SECONDS = 2.2;
  let audioCtx = null;
  let stale = false;
  let nodes = [];
  const buffers = new Map();

  // iPhone：静音键开着也出声；页面回到前台后旧的音频可能没有输出，下一次播放时新建
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && audioCtx) stale = true;
  });

  function context() {
    // iPhone：「只播放」模式下静音键开着也出声。但开了麦克风的页面会改成「播放 + 录音」，
    // 这里不能再改回「只播放」，否则 Safari 不允许录音（Audio Session Category is not compatible with Audio Capture）
    if (navigator.audioSession && navigator.audioSession.type === 'auto') {
      try { navigator.audioSession.type = 'playback'; } catch (e) {}
    }
    if (audioCtx && (stale || audioCtx.state === 'closed')) {
      audioCtx.close().catch(() => {});
      audioCtx = null;
      stale = false;
    }
    if (!audioCtx) audioCtx = new (root.AudioContext || root.webkitAudioContext)();
    if (audioCtx.state !== 'running') audioCtx.resume().catch(() => {});
    return audioCtx;
  }

  function sampleOf(midi) {
    const sample = Math.max(36, Math.min(84, Math.round(midi / 3) * 3));
    return { file: `${SAMPLE_NAMES[sample % 12]}${Math.floor(sample / 12) - 1}.mp3`, rate: Math.pow(2, (midi - sample) / 12) };
  }

  function loadSample(midi) {
    const { file } = sampleOf(midi);
    if (!buffers.has(file)) {
      const request = fetch(SAMPLE_BASE + file)
        .then(response => { if (!response.ok) throw new Error(file); return response.arrayBuffer(); })
        .then(data => new Promise((resolve, reject) => context().decodeAudioData(data, resolve, reject)))
        .catch(error => { console.warn('钢琴采样载入失败', error); buffers.delete(file); return null; });
      buffers.set(file, request);
    }
    return buffers.get(file);
  }

  function preload() {
    for (let midi = 36; midi <= 84; midi += 3) loadSample(midi);
  }

  function stop() {
    nodes.forEach(node => { try { node.stop(); } catch (e) {} });
    nodes = [];
  }

  // 结尾 0.15 秒淡出到静音，避免爆音
  function output(ctx, start, volume, seconds = SECONDS) {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.setValueAtTime(volume, start + seconds - 0.15);
    gain.gain.linearRampToValueAtTime(0, start + seconds);
    gain.connect(ctx.destination);
    return gain;
  }

  function playNote(ctx, midi, timbre, start, volume, seconds = SECONDS) {
    const frequency = 440 * Math.pow(2, (midi - 69) / 12);
    if (timbre === 'sine') {
      const osc = ctx.createOscillator(), env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, start);
      env.gain.setValueAtTime(0, start);
      env.gain.linearRampToValueAtTime(1, start + 0.02);
      env.gain.setTargetAtTime(0.55, start + 0.02, 0.8);
      osc.connect(env);
      env.connect(output(ctx, start, 0.3 * volume, seconds));
      osc.start(start);
      osc.stop(start + seconds);
      nodes.push(osc);
      return;
    }
    loadSample(midi).then(buffer => {
      if (!buffer) return;
      const source = ctx.createBufferSource(), clean = ctx.createBiquadFilter();
      source.buffer = buffer;
      source.playbackRate.value = sampleOf(midi).rate;
      // 滤掉低于这个音一个八度的余音杂音（同综合测试）
      clean.type = 'highpass';
      clean.frequency.value = frequency * 0.5;
      clean.Q.value = 0.7;
      const at = Math.max(start, ctx.currentTime + 0.01);
      source.connect(clean);
      clean.connect(output(ctx, at, 0.85 * volume, seconds));
      source.start(at);
      source.stop(at + seconds);
      nodes.push(source);
    });
  }

  // volumes：每个音的音量比例（和声模唱练习模式：突出一个声部、压低另一个）
  function play(midi, timbre, volumes) {
    stop();
    const ctx = context();
    const start = ctx.currentTime + 0.03;
    const notes = Array.isArray(midi) ? midi : [midi];
    // 两个音同时播放时各自小声一点，合起来和单音差不多响
    notes.forEach((note, i) => playNote(ctx, note, timbre, start, (notes.length > 1 ? 0.7 : 1) * (volumes ? volumes[i] : 1)));
    return SECONDS;
  }

  function playSequence(notes, timbre) {
    stop();
    const ctx = context();
    const start = ctx.currentTime + 0.05;
    notes.forEach(note => playNote(ctx, note.midi, timbre, start + note.at, 1, note.seconds));
    return Math.max(...notes.map(note => note.at + note.seconds));
  }

  root.ReferenceTone = Object.freeze({ play, playSequence, stop, preload, SECONDS });
})(window);
