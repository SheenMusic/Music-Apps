/* DOM-free practice state. Answers stay in course-owned data; history remains
   in memory for this page session, with the original MT record format. */
(function (root) {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const equalAnswers = (a, b) => a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);
  function create(data, {now = () => Date.now(), formatTime = root.MTFormatTime} = {}) {
    const questions = data.questions;
    if (!questions?.length || typeof formatTime !== 'function') throw new Error('Practice data/time utility missing');
    let mode = 'start', index = 0, started = 0, ended = null, questionStarted = null, stats = [], attempts = 0;
    const history = [];
    const solvedCount = () => stats.filter(s => s.isSolved).length;
    function accrue() {
      if (mode === 'practice' && questionStarted !== null && !stats[index].isSolved) {
        stats[index].timeSpent += Math.round((now() - questionStarted) / 1000);
      }
      questionStarted = null;
    }
    function summary() {
      const seconds = ended !== null ? Math.round((ended - started) / 1000) : 0;
      return {seconds, accuracy: attempts ? ((solvedCount() / attempts) * 100).toFixed(1) : '0.0',
        totalAttempts: attempts, solved: solvedCount(), total: questions.length};
    }
    const api = {
      start() {
        mode = 'practice'; index = 0; started = now(); ended = null; attempts = 0;
        stats = questions.map(() => ({attempts: 0, timeSpent: 0, isSolved: false, wrongChoices: [], wrongAnswers: []}));
        questionStarted = now();
      },
      // answerText：这次作答的可读文字（报告用）；省略时用选项的 label。
      submit(values, answerText) {
        if (mode !== 'practice' || stats[index].isSolved || !Array.isArray(values) || !values.length) return null;
        const q = questions[index], unique = [...new Set(values)];
        if (unique.length !== values.length || unique.some(v => !q.options.some(o => o.value === v)) || (q.type !== 'multiple-choice' && unique.length !== 1)) return null;
        const stat = stats[index];
        stat.attempts++; attempts++;
        const correct = equalAnswers(values, q.correctAnswer);
        if (correct) {accrue(); stat.isSolved = true;}
        else {
          stat.wrongChoices.push([...values]);
          stat.wrongAnswers.push(answerText ?? values.map(v => q.options.find(o => o.value === v)?.label ?? v).join('、'));
        }
        return correct;
      },
      goTo(next) {
        if (!['practice', 'review'].includes(mode) || !Number.isInteger(next) || next < 0 || next >= questions.length || next === index) return;
        accrue(); index = next;
        questionStarted = mode === 'practice' && !stats[index].isSolved ? now() : null;
      },
      next() {
        if (mode === 'review') {api.goTo(Math.min(index + 1, questions.length - 1)); return;}
        if (mode !== 'practice' || !stats[index].isSolved) return;
        if (solvedCount() === questions.length) {api.finish(); return;}
        for (let offset = 1; offset <= questions.length; offset++) {
          const next = (index + offset) % questions.length;
          if (!stats[next].isSolved) {api.goTo(next); return;}
        }
      },
      finish() {
        if (mode !== 'practice' || solvedCount() !== questions.length) return false;
        accrue(); ended = now(); mode = 'result';
        const s = summary();
        history.unshift({timestamp: new Date(now()).toLocaleTimeString(), accuracy: s.accuracy,
          totalTime: formatTime(s.seconds), totalAttempts: attempts, stats: clone(stats)});
        return true;
      },
      review(next) {
        if (mode !== 'result' || !Number.isInteger(next) || next < 0 || next >= questions.length) return;
        mode = 'review'; index = next; questionStarted = null;
      },
      backToResults() {if (mode === 'review') mode = 'result';},
      reset() {mode = 'start'; index = 0; started = 0; ended = null; questionStarted = null; stats = []; attempts = 0;},
      state() {return {mode, index, stats: clone(stats), history: clone(history), ...summary()};},
      reportInput() {const s = summary(); return {type: data.reportType || 'mt', code: data.code, title: data.reportTitle || data.title, seconds: s.seconds, accuracy: s.accuracy, records: clone(stats)};}
    };
    return Object.freeze(api);
  }
  function questionStatus(stat) {
    if (stat.isSolved) return stat.attempts === 1 ? 'solved' : 'needs-review';
    return stat.attempts > 0 ? 'attempted' : 'unanswered';
  }
  root.PracticeEngine = Object.freeze({create, questionStatus});
})(typeof window !== 'undefined' ? window : globalThis);
