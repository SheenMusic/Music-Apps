/* 音程听力训练 · 练习的临时记录（2026-11-14）
   做到一半关闭页面、iPhone 回收后台页面、不小心刷新：下次打开同一课，可以选择「继续上次的练习」或「重新开始」。
   记录只存在这台设备的浏览器里，7 天内有效（shared/practice/practice-session.js）。
   放在页面所有脚本之后加载；按页面里已有的全局变量判断是哪一类练习，不改各课自己的答题流程：
   - 构唱 / 模唱（第 3–18 课）：练习设置、连续通过数、通过的题目记录、已用时间、是否已经生成报告。
     恢复时先填回设置、按设置出一道新题，再填回进度（当前这道题重新出，不恢复）。
   - 听辨测验（第 1、2 课的「测验模式」）：做到第几题、每题对错、用时、结果页。训练模式没有成绩，不保存。
   - 综合测验（Interval-Test）：整套考题与每题的作答、做到第几题、用时、成绩页。
   每 2 秒检查一次，有变化才保存；切到后台、关闭页面时也保存。主动「重新开始 / 退出 / 再测一次」时清除。 */
(function () {
  'use strict';
  if (!window.PracticeSession) return;
  const store = PracticeSession.create();
  const $ = id => document.getElementById(id);
  const visible = id => { const el = $(id); return !!el && !el.classList.contains('hidden'); };
  const active = id => { const el = $(id); return !!el && el.classList.contains('active'); };
  // 包一层全局函数（页面里 onclick="restartPractice()" 这类写法会用到新的函数）
  function wrap(name, before) {
    const original = window[name];
    if (typeof original !== 'function') return;
    window[name] = function (...args) { before(); return original.apply(this, args); };
  }
  // 绑定在按钮上的处理函数（$('testBtn').onclick = startTest 这类写法）：另外加一个监听
  const onClick = (id, fn) => $(id)?.addEventListener('click', fn);

  const kind =
    typeof consecutivePassCount !== 'undefined' && typeof restartPractice === 'function' ? 'sing' :
    typeof testResults !== 'undefined' && typeof startTest === 'function' ? 'quiz' :
    typeof examRunning !== 'undefined' && typeof startExam === 'function' ? 'exam' : null;
  if (!kind) return;

  /* ---------- 构唱 / 模唱（第 3–18 课） ---------- */
  const SING = {
    // 页面上所有有 id 的下拉框与勾选框（练习模式、音区、容差、耳机等）
    controls: () => [...document.querySelectorAll('select[id], input[type="checkbox"][id]')],
    read() {
      const finished = visible('reportCard');
      if (!finished && consecutivePassCount === 0 && questionHistory.length === 0) return null;
      const settings = {};
      SING.controls().forEach(el => { settings[el.id] = el.type === 'checkbox' ? el.checked : el.value; });
      // 报告出来后用时不再增加：取报告上的总用时
      const elapsed = finished ? Number($('totalTimeText')?.textContent || 0) * 1000 : practiceStartTime ? Date.now() - practiceStartTime : 0;
      return {kind, settings, passCount: consecutivePassCount, history: questionHistory, elapsed, finished};
    },
    restore(saved) {
      SING.controls().forEach(el => {
        if (!(el.id in saved.settings)) return;
        if (el.type === 'checkbox') el.checked = !!saved.settings[el.id];
        else if ([...el.options].some(o => o.value === String(saved.settings[el.id]))) el.value = saved.settings[el.id];
      });
      if (typeof updateRegisterLine === 'function') updateRegisterLine();
      if (typeof updateToleranceZone === 'function') updateToleranceZone();
      generateQuestion();  // 按恢复的设置出一道新题（模唱课会先清零连续数，所以进度在后面填回）
      consecutivePassCount = saved.passCount || 0;
      questionHistory = Array.isArray(saved.history) ? saved.history : [];
      practiceStartTime = saved.elapsed ? Date.now() - saved.elapsed : 0;
      $('passCountText').textContent = consecutivePassCount;
      if (typeof updateStreakUI === 'function') updateStreakUI();  // 模唱课：按它自己的规则决定能不能完成
      else {
        const finishBtn = $('finishBtn'), ready = consecutivePassCount >= 10;
        finishBtn.disabled = !ready;
        finishBtn.classList.toggle('unlocked', ready);
      }
      if (saved.finished) {
        if (typeof questionCompleted !== 'undefined') questionCompleted = true;  // 模唱课的报告要求「当前题已完成」
        finishPractice();
      }
    },
    describe(saved) {
      return saved.finished
        ? {title: '上次的练习已经完成', text: `已连续通过 ${saved.passCount} 题。\n可以查看报告、复制给老师，也可以重新练习。`, resumeLabel: '查看上次的报告', restartLabel: '重新练习'}
        : {title: '继续上次的练习？', text: `上次已连续通过 ${saved.passCount} 题。\n继续的话，通过记录、练习设置和用时都会保留（当前这道题会重新出）。`};
    },
    hooks() { wrap('restartPractice', () => store.clear()); }
  };

  /* ---------- 听辨测验（第 1、2 课的测验模式） ---------- */
  const showResultScreen = () => (typeof showResult === 'function' ? showResult : result)();
  const QUIZ = {
    read() {
      const finished = active('result');
      if (mode !== 'test' || !(active('quiz') || finished)) return null;
      return {kind, current, testResults, elapsed: performance.now() - testStart, finished};
    },
    restore(saved) {
      mode = 'test';
      testResults = Array.isArray(saved.testResults) ? saved.testResults : [];
      score = testResults.filter(r => r && r.correct).length;
      current = saved.current || 0;
      testStart = performance.now() - (saved.elapsed || 0);
      const total = typeof questions !== 'undefined' ? questions.length : 20;
      // 这一题已经答了、还没点「下一题」：从下一题接着做
      if (!saved.finished && testResults[current] && current < total - 1) current++;
      if (saved.finished || testResults.length >= total) { showResultScreen(); return; }
      screen('quiz');
      load();
    },
    describe(saved) {
      const done = (saved.testResults || []).filter(Boolean).length;
      return saved.finished
        ? {title: '上次的测验已经完成', text: '可以查看结果、复制给老师，也可以重新测验。', resumeLabel: '查看上次的结果', restartLabel: '回到模式选择'}
        : {title: '继续上次的测验？', text: `上次已答 ${done} / 20 题。\n继续的话，做过的题和用时都会保留。`};
    },
    hooks() {
      onClick('testBtn', () => store.clear());   // 开始新的测验
      onClick('again', () => store.clear());     // 再测一次
      onClick('quit', () => store.clear());      // 主动退出测验
      onClick('back', () => store.clear());      // 结果页「返回模式选择」
    }
  };

  /* ---------- 综合测验（Interval-Test） ---------- */
  const EXAM = {
    read() {
      const finished = visible('resultScreen');
      if (!(examRunning && visible('quizScreen')) && !finished) return null;
      return {kind, questions, current, elapsed: finished ? examSeconds * 1000 : Date.now() - examStart, finished, examSeconds};
    },
    restore(saved) {
      questions = saved.questions;
      current = Math.min(saved.current || 0, questions.length - 1);
      buildDegreeGrid();
      buildQualityGrid();
      $('navGrid').replaceChildren();
      $('navPanel').classList.add('hidden');
      if (saved.finished) {
        examSeconds = saved.examSeconds || 0;
        examRunning = false;
        show('resultScreen');
        finishExam();
        return;
      }
      if (typeof preloadPiano === 'function') preloadPiano();
      examStart = Date.now() - (saved.elapsed || 0);
      examRunning = true;
      show('quizScreen');
      loadQuestion();
    },
    describe(saved) {
      const answered = (saved.questions || []).filter(q => q.part === 1 ? q.draft?.degree != null && q.draft?.quality != null : q.draft?.midi != null).length;
      return saved.finished
        ? {title: '上次的测验已经完成', text: '可以查看成绩、复制报告给老师，也可以重新开始。', resumeLabel: '查看上次的成绩', restartLabel: '重新开始'}
        : {title: '继续上次的测验？', text: `上次已答 ${answered} / ${(saved.questions || []).length} 题，做到第 ${(saved.current || 0) + 1} 题。\n继续的话，作答和用时都会保留。`};
    },
    hooks() {
      wrap('startExam', () => store.clear());
      wrap('backToStart', () => store.clear());
      // 主动退出：页面先确认（「退出后本次作答不保存」）；确认后考试结束，记录也清除
      const quit = window.quitExam;
      if (typeof quit === 'function') window.quitExam = function (...args) { const r = quit.apply(this, args); if (!examRunning) store.clear(); return r; };
    }
  };

  const adapter = {sing: SING, quiz: QUIZ, exam: EXAM}[kind];
  adapter.hooks();

  let last = '';
  function save() {
    let state;
    try { state = adapter.read(); } catch { return; }
    if (!state) return;
    const json = JSON.stringify(state);
    if (json === last) return;
    last = json;
    store.save(state);
  }
  setInterval(save, 2000);
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });

  // 页面自己的 onload 之后再询问（音区下拉框等要先建好）
  window.addEventListener('load', () => {
    const saved = store.load();
    if (!saved || saved.kind !== kind) return;
    const text = adapter.describe(saved);
    PracticeSession.offer({...text,
      onResume: () => {
        try { adapter.restore(saved); last = JSON.stringify(adapter.read()); }
        catch (error) { console.error(error); store.clear(); }
      },
      onRestart: () => store.clear()});
  });
})();
