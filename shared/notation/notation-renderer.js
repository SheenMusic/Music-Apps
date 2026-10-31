(function (root) {
  'use strict';
  const VF = () => root.Vex?.Flow || root.VexFlow;
  function createRenderer(element, {scale = root.NotationConfig.defaultScale} = {}) {
    const v = VF();
    if (!v) throw new Error('VexFlow unavailable');
    const renderer = new v.Renderer(element, v.Renderer.Backends.SVG);
    if (scale !== 1) {
      const resize = renderer.resize.bind(renderer);
      renderer.resize = (width, height) => {resize(width * scale, height * scale); renderer.getContext().scale(scale, scale); return renderer;};
    }
    return renderer;
  }
  // Learning may retain its specialized voices, annotations and meaningful
  // internal barlines. All renderer/stave creation still passes this policy.
  // options 省略 = 单独的演示谱表：按 showFinalBarline 去掉结束小节线。
  // 传入 options（如 {initial:false}）= 多个谱表拼接的一部分：保留各自的边界线。
  function createStave(x, y, width, options) {
    const {initial = true} = options || {};
    const v = VF(), c = root.NotationConfig;
    const stave = new v.Stave(x, y, width, {num_lines: c.staffLineCount});
    if (initial) stave.setBegBarType(c.showInitialBarline ? v.Barline.type.SINGLE : v.Barline.type.NONE);
    if (!options && c.showFinalBarline === false) {
      // 画之前才判断：带拍号的是真实音乐片段，保留结束线（N03）；其余开放。
      const draw = stave.draw.bind(stave);
      stave.draw = () => {
        const metered = stave.getModifiers().some(m => m.getCategory?.() === 'TimeSignature');
        stave.setEndBarType(metered ? v.Barline.type.SINGLE : v.Barline.type.NONE);
        return draw();
      };
    }
    stave.setStyle({strokeStyle: c.staffLineColor, fillStyle: c.staffLineColor, lineWidth: c.staffLineWidth});
    stave.setDefaultLedgerLineStyle({strokeStyle: c.staffLineColor, lineWidth: c.ledgerLineWidth});
    return stave;
  }
  function createFormatter() {return new (VF().Formatter)(root.NotationConfig.formatterOptions);}
  function formatAndDraw(context, stave, notes, options = {}) {
    const v = VF(), settings = {auto_beam: false, align_rests: false, ...options};
    const voice = new v.Voice({num_beats: 4, beat_value: 4}).setMode(v.Voice.Mode.SOFT).addTickables(notes);
    const beams = settings.auto_beam ? v.Beam.applyAndGetBeams(voice) : [];
    createFormatter().joinVoices([voice]).formatToStave([voice], stave, {align_rests: settings.align_rests, stave});
    voice.setStave(stave).draw(context, stave);
    beams.forEach(beam => beam.setContext(context).draw());
    return voice.getBoundingBox();
  }
  function width(element, maxWidth = root.NotationConfig.maxWidth) {
    return root.NotationConfig.responsive ? Math.max(180, Math.min(maxWidth, element.clientWidth || maxWidth)) : maxWidth;
  }
  function parseNote(name) {
    const m = String(name).match(/^([a-gA-G])([s#b♯♭𝄪𝄫nx]*)(-?\d+)$/u);
    if (!m) throw new Error('Unsupported note: ' + name);
    return {key: m[1].toLowerCase() + '/' + m[3], accidental: m[2].replaceAll('s','#').replaceAll('♯','#').replaceAll('♭','b').replaceAll('𝄪','##').replaceAll('𝄫','bb').replaceAll('x','##')};
  }
  function render(element, score, options = {}) {
    const c = {...root.NotationConfig, ...options}, v = VF();
    element.replaceChildren();
    if (!v) {
      const message = document.createElement('p'); message.className = 'staff-load-note';
      message.textContent = '五线谱组件未载入，请检查网络连接后刷新页面。'; element.append(message); return null;
    }
    const scale = c.scale || c.defaultScale;
    const width = c.responsive ? Math.max(160, Math.min(c.maxWidth, element.clientWidth || c.maxWidth)) : c.maxWidth;
    const renderer = createRenderer(element, {scale: 1}); renderer.resize(width, c.height * scale);
    const context = renderer.getContext(); context.scale(scale, scale);
    const stave = createStave(c.padding, c.staveY, width / scale - c.padding * 2);
    const clef = score.clef || c.defaultClef;
    stave.addClef(clef).setContext(context).draw();
    // notes: sequential strings, chord arrays, or {keys, duration}; no data lives
    // only in SVG. A future multi-measure adapter can build on the same factories.
    const events = score.harmonic ? [score.notes] : score.notes;
    const notes = events.map(event => {
      const keys = Array.isArray(event) ? event : (typeof event === 'string' ? [event] : event.keys);
      const parsed = keys.map(parseNote);
      const note = new v.StaveNote({clef, keys: parsed.map(p => p.key), duration: event.duration || 'q', auto_stem: true});
      parsed.forEach((p, i) => {if (p.accidental) note.addModifier(new v.Accidental(p.accidental), i);});
      return note;
    });
    formatAndDraw(context, stave, notes);
    const svg = element.querySelector('svg');
    // Ledger lines/accidentals in high or low registers must remain accessible.
    const bounds = svg.getBBox(), top = Math.min(0, bounds.y - 4);
    const bottom = Math.max(c.height * scale, bounds.y + bounds.height + 4);
    svg.setAttribute('viewBox', `0 ${top} ${width} ${bottom - top}`);
    svg.setAttribute('height', String(bottom - top));
    svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', score.label || '五线谱谱例');
    return {renderer, stave, notes};
  }
  // A single observer per mounted notation, re-used across question changes.
  function mount(element) {
    let score = null, lastWidth = 0;
    const draw = () => {if (score && element.clientWidth) {lastWidth = element.clientWidth; render(element, score);}};
    const observer = new ResizeObserver(() => {if (element.clientWidth !== lastWidth) draw();});
    observer.observe(element);
    return {set(value) {score = value; element.hidden = !score; if (score) draw(); else element.replaceChildren();}, destroy() {observer.disconnect();}};
  }
  root.NotationRenderer = Object.freeze({VF, createRenderer, createStave, createFormatter, formatAndDraw, width, parseNote, render, mount});
})(window);
