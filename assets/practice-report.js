/* Pure text only: callers own exercise state, timing, grading and clipboard. */
(function (root) {
  'use strict';
  const degrees = {一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 十一: 11, 十二: 12, 十三: 13, 十四: 14};
  const qualities = {大: 'M', 小: 'm', 纯: 'P', 增: 'A', 减: 'd'};
  const number = index => String(index + 1).padStart(2, '0');
  function time(seconds) {
    const value = Math.max(0, Math.round(Number(seconds)));
    return `${Math.floor(value / 60)}分${String(value % 60).padStart(2, '0')}秒`;
  }
  function interval(name) {
    // Read the recorded spelling, never infer quality/degree from semitones.
    const match = String(name).match(/([大小纯增减])(十四|十三|十二|十一|十|九|八|七|六|五|四|三|二|一)度/);
    return match ? qualities[match[1]] + degrees[match[2]] : String(name);
  }
  function pitch(value) {
    // Remove only the detector's frequency suffix; preserve octave and spelling.
    return String(value).replace(/\s*\([\d.]+\s*Hz\)\s*$/i, '');
  }
  function cents(value) {
    const n = Number(value);
    return `${n > 0 ? '+' : ''}${n}¢`;
  }
  function generate(data) {
    const {type, code, title, settings = [], seconds, records = []} = data;
    const sections = [`【${code} · ${title}】`];
    if (settings.length) sections.push(settings.join('\n'));
    let summary, details;
    if (type === 'mt') {
      const completed = records.filter(q => q.isSolved).length;
      const firstPass = records.filter(q => q.isSolved && q.attempts === 1).length;
      summary = `完成：${completed}/${records.length}题 · 用时：${time(seconds)}\n准确率：${data.accuracy}% · 一次通过：${firstPass}题`;
      const attention = records.flatMap((q, i) => q.attempts > 1 ? [number(i)] : []);
      details = completed === records.length && firstPass === records.length
        ? '✓ 全部一次通过' : (attention.length ? `需要关注：${attention.join('、')}` : '');
    } else if (type === 'listening') {
      summary = `完成：${records.length}题 · 用时：${time(seconds)}\n正确：${data.correct}/${data.total} · 正确率：${data.accuracy}%`;
      const attention = records.flatMap((q, i) => !q.correct ? [number(i)] : []);
      details = attention.length ? `需要关注：${attention.join('、')}` : '✓ 全部正确';
    } else {
      summary = `连续达标：${records.length}题 · 用时：${time(seconds)}`;
      details = records.map((q, i) => {
        if (type === 'singing') {
          const reference = q.refNote ? `${pitch(q.refNote)} → ` : '';
          return `${number(i)}  ${reference}${pitch(q.targetNote)} / ${pitch(q.actualNote)}  ${cents(q.cents)}`;
        }
        if (type === 'construction') return `${number(i)}  ${interval(q.interval)}  ${pitch(q.refNote)} → ${pitch(q.targetNote)} / ${pitch(q.actualNote)}  ${cents(q.cents)}`;
        if (type === 'harmonic') return `${number(i)}  ${interval(q.type)}  ${pitch(q.lowTarget)}–${pitch(q.highTarget)} → ${pitch(q.lowCapturedText)}–${pitch(q.highCapturedText)}`;
        throw new Error(`Unknown report type: ${type}`);
      }).join('\n');
      if (!['singing', 'construction', 'harmonic'].includes(type)) throw new Error(`Unknown report type: ${type}`);
    }
    sections.push(summary);
    if (details) sections.push(details);
    sections.push(`© Sheen · ${type === 'mt' ? 'Music Theory' : 'Ear Training'}`);
    return sections.join('\n\n');
  }
  root.PracticeReport = Object.freeze({generate, time, interval, pitch, cents});
})(typeof window === 'undefined' ? globalThis : window);
