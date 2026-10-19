/* Common MT05 presentation, course copy populated from questions.js. */
(function () {
  'use strict';
  const data = window.practiceData;
  document.getElementById('practiceApp').innerHTML = `<main class="app-container">
    <!-- Persistent Header -->
    <header class="app-header">
      <div class="header-top-bar">
        <span class="header-title-left">MUSIC THEORY · INTERVAL</span>
        <div class="header-right-group">
          <span class="question-counter hidden" id="questionCounter"></span>
          <span class="header-title-right">LESSON 05</span>
          <button class="history-toggle-btn" id="historyToggleBtn">历史记录</button>
        </div>
      </div>
      <div class="progress-bar-container" id="progressBarContainer">
        <div class="progress-bar" id="progressBar"></div>
      </div>
    </header>

    <!-- 1. Start Screen / Home -->
    <section class="card-container" id="startScreen">
      <div class="start-header">
        <p class="subtitle">音程理论基础 · 第五课</p>
        <h1 class="main-title">原位音程与转位音程</h1>
      </div>
      <div class="start-info">
        <p>• 本测试共包含 <strong>20 个题目</strong>，刷新或关闭页面后，本次练习进度将不会保留。</p>
        <p>• 答题过程将记录您的总用时、尝试次数及选择历史。</p>
        <p>• 全部完成后，可复制测验结果发送给老师获取本课评价。</p>
      </div>
      <button class="primary-btn start-btn" id="startPracticeBtn">开始练习</button>
    </section>

    <!-- 2. Question Card -->
    <section class="card-container hidden" id="questionCard">
      <div class="question-nav-wrapper" id="questionNavWrapper">
        <button class="question-nav-toggle" id="questionNavToggle" type="button" aria-expanded="false" aria-controls="questionNav">
          <span>题目导航</span>
          <span class="question-nav-toggle-icon" aria-hidden="true">⌄</span>
        </button>
        <nav class="question-nav" id="questionNav" aria-label="题目导航"></nav>
      </div>

      <div class="type-badge-wrapper">
        <span class="type-badge" id="typeBadge">判断题</span>
      </div>

      <h2 class="question-prompt" id="questionPrompt">题目载入中...</h2>
      <div class="staff-question" data-notation hidden id="staffQuestion" aria-label="五线谱谱例"></div>

      <!-- Options Grid -->
      <div class="options-grid" id="optionsGrid"></div>

      <!-- Feedback / Explanation Box -->
      <div role="status" aria-live="polite" class="feedback-box hidden" id="feedbackBox">
        <div class="feedback-header">
          <span class="feedback-status-icon" id="feedbackIcon">✓</span>
          <span class="feedback-title" id="feedbackTitle">回答正确</span>
        </div>
        <p class="explanation-text" id="explanationText"></p>
      </div>

      <button class="secondary-btn hidden" id="backToResultBtn" type="button">返回结果</button>
      <!-- Navigation & Action Buttons Inside Card -->
      <div class="card-actions-grid">
        <button class="secondary-btn" id="prevBtn" disabled>上一题</button>
        <button class="primary-btn" id="confirmBtn" disabled>确认</button>
        <button class="primary-btn hidden" id="nextBtn">下一题</button>
      </div>
    </section>

    <!-- 3. Result Screen -->
    <section class="card-container hidden" id="resultScreen">
      <h2 class="result-title">🎉 测验完成</h2>

      <div class="question-nav-wrapper expanded" id="resultQuestionNavWrapper">
        <button class="question-nav-toggle" id="resultQuestionNavToggle" type="button" aria-expanded="true" aria-controls="resultQuestionNav">
          <span>题目导航 · 点击题号回看</span>
          <span class="question-nav-toggle-icon" aria-hidden="true">⌄</span>
        </button>
        <nav class="question-nav" id="resultQuestionNav" aria-label="完成后的题目导航"></nav>
      </div>

      <div class="result-stats-grid">
        <div class="stat-card">
          <span class="stat-value" id="resAccuracy">100%</span>
          <span class="stat-label">作答准确率</span>
        </div>
        <div class="stat-card">
          <span class="stat-value" id="resTotalTime">00:00</span>
          <span class="stat-label">答题总时长</span>
        </div>
        <div class="stat-card">
          <span class="stat-value" id="resTotalAttempts">15次</span>
          <span class="stat-label">总尝试次数</span>
        </div>
      </div>

      <div class="detail-list-wrapper">
        <h3>逐题答题记录（含错误尝试）</h3>
        <div class="detail-list" id="detailList"></div>
      </div>

      <div class="result-actions">
        <button class="primary-btn copy-btn" id="copyResultBtn">复制结果</button>
        <button class="secondary-btn" id="restartBtn">重新练习</button>
      </div>
    </section>

    <!-- 4. History Modal / Panel -->
    <div class="modal-overlay hidden" id="historyModal" role="dialog" aria-modal="true" aria-labelledby="historyTitle">
      <div class="modal-card">
        <div class="modal-header">
          <h2 id="historyTitle">会话历史练习记录</h2>
          <button class="close-btn" id="closeHistoryBtn" aria-label="关闭历史记录">✕</button>
        </div>
        <p class="modal-tip">💡 只要不关闭/刷新页面，您本次会话中的所有练习记录都会自动保存在这里。</p>
        <div class="history-list" id="historyList"></div>
      </div>
    </div>

    <div class="return-home-wrap">
      <button class="return-home-link" id="returnHomeBtn" type="button">← 返回课程首页</button>
    </div>

    <!-- Persistent Global Footer -->
    <footer class="app-footer">
      ©Sheen · Music Theory
    </footer>
  </main>`;
  const byId = id => document.getElementById(id);
  const show = (id, visible) => byId(id).classList.toggle('hidden', !visible);
  const text = (id, value) => {byId(id).textContent = value;};
  const engine = PracticeEngine.create(data);
  let selected = [];
  const staff = NotationRenderer.mount(byId('staffQuestion'));
  document.querySelector('.header-title-left').textContent = data.brand || 'MUSIC THEORY · INTERVAL';
  document.querySelector('.header-title-right').textContent = 'LESSON ' + data.code.slice(-2);
  document.querySelector('.main-title').textContent = data.title;
  document.querySelector('.subtitle').textContent = data.subtitle;
  document.querySelector('.start-info strong').textContent = data.questions.length + ' 个题目';

  function buttonNav(id, state, result = false) {
    const nav = byId(id); nav.replaceChildren();
    state.stats.forEach((stat, index) => {
      const button = document.createElement('button'); button.type = 'button';
      const status = PracticeEngine.questionStatus(stat);
      button.className = 'question-nav-btn ' + status;
      button.textContent = String(index + 1).padStart(2, '0');
      const label = {unanswered:'未作答',attempted:'已尝试',solved:'一次答对','needs-review':'需要复习'}[status];
      button.setAttribute('aria-label', `${result ? '回看' : '跳转到'}第 ${index + 1} 题，${label}`);
      if (!result && index === state.index) {button.classList.add('current'); button.setAttribute('aria-current', 'step');}
      button.onclick = () => {if (!result && index === state.index) return; result ? engine.review(index) : engine.goTo(index); render();};
      nav.append(button);
    });
  }
  function feedback(correct, message) {
    show('feedbackBox', true);
    byId('feedbackBox').classList.toggle('correct-bg', correct);
    byId('feedbackBox').classList.toggle('wrong-bg', !correct);
    text('feedbackIcon', correct ? '✓' : '✕');
    text('feedbackTitle', correct ? '回答正确！' : '回答错误，请再试一次！');
    text('explanationText', message);
  }
  function render() {
    selected = [];
    const s = engine.state(), playing = s.mode === 'practice', review = s.mode === 'review';
    show('startScreen', s.mode === 'start'); show('questionCard', playing || review);
    show('resultScreen', s.mode === 'result'); show('questionCounter', playing || review);
    byId('progressBar').style.width = `${s.total ? s.solved / s.total * 100 : 0}%`;
    if (s.mode === 'result') {renderResults(s); return;}
    if (!playing && !review) {staff.set(null); return;}
    const q = data.questions[s.index], stat = s.stats[s.index];
    text('questionCounter', `${s.index + 1} / ${s.total}`);
    byId('prevBtn').disabled = s.index === 0;
    const badge = {'boolean':['判断题','boolean'],'single-choice':['单选题','single'],'multiple-choice':['多选题','multiple']}[q.type];
    text('typeBadge', badge[0]); byId('typeBadge').className = 'type-badge ' + badge[1];
    byId('questionPrompt').replaceChildren();
    q.prompt.split(/(正确|错误)/g).forEach(part => {
      const node = document.createElement('span'); node.textContent = part;
      if (/^(正确|错误)$/.test(part)) node.className = 'question-keyword';
      byId('questionPrompt').append(node);
    });
    staff.set(q.staff || null);
    const options = byId('optionsGrid'); options.replaceChildren();
    q.options.forEach(opt => {
      const button = document.createElement('button'); button.type = 'button';
      button.className = 'option-btn' + (q.type === 'boolean' ? ' boolean-option' : '');
      button.dataset.value = opt.value; button.setAttribute('aria-pressed', 'false');
      const label = document.createElement('span'); label.textContent = opt.label;
      const indicator = document.createElement('span'); indicator.className = 'indicator'; indicator.textContent = '✓'; indicator.setAttribute('aria-hidden','true');
      button.append(label, indicator);
      if (stat.isSolved || review) {
        button.disabled = true; button.classList.add('disabled');
        if (q.correctAnswer.includes(opt.value)) button.classList.add('correct');
      } else button.onclick = () => {
        if (q.type === 'multiple-choice') selected = selected.includes(opt.value) ? selected.filter(v => v !== opt.value) : [...selected, opt.value];
        else selected = [opt.value];
        options.querySelectorAll('button').forEach(b => {b.classList.toggle('selected', selected.includes(b.dataset.value)); b.setAttribute('aria-pressed', String(selected.includes(b.dataset.value)));});
        byId('confirmBtn').disabled = selected.length === 0;
      };
      options.append(button);
    });
    show('feedbackBox', stat.isSolved);
    if (stat.isSolved) feedback(true, q.explanation);
    show('confirmBtn', !stat.isSolved && !review); byId('confirmBtn').disabled = true;
    show('nextBtn', stat.isSolved && (!review || s.index < s.total - 1));
    text('nextBtn', review ? '下一题' : s.solved === s.total ? '结束练习' : '下一题');
    show('backToResultBtn', review);
    buttonNav('questionNav', s);
  }
  function renderResults(s) {
    text('resAccuracy', s.accuracy + '%'); text('resTotalTime', MTFormatTime(s.seconds)); text('resTotalAttempts', s.totalAttempts + '次');
    buttonNav('resultQuestionNav', s, true);
    byId('detailList').replaceChildren();
    s.stats.forEach((stat, index) => {
      const item = document.createElement('div'); item.className = 'detail-item';
      const top = document.createElement('div'); top.className = 'detail-item-top';
      const label = document.createElement('span'); label.textContent = '第 ' + (index + 1) + ' 题';
      const detail = document.createElement('span'); detail.textContent = `尝试 ${stat.attempts} 次 | 用时 ${stat.timeSpent} 秒`;
      top.append(label, detail);
      const wrong = document.createElement('div'); wrong.className = stat.wrongChoices.length ? 'detail-item-wrong-choices' : 'detail-item-first-pass';
      wrong.textContent = stat.wrongChoices.length ? '❌ 错误尝试：' + stat.wrongChoices.map(c => `[${c.join(',')}]`).join(', ') : '✓ 一次通过';
      item.append(top, wrong); byId('detailList').append(item);
    });
  }
  byId('confirmBtn').onclick = () => {
    const correct = engine.submit(selected);
    if (correct === null) return;
    const wrong = [...selected];
    render();
    if (!correct) feedback(false, `错选解析：已尝试 [${wrong.join(', ')}]，仔细思考后重新选择提交。`);
  };
  byId('startPracticeBtn').onclick = () => {engine.start(); render();};
  byId('prevBtn').onclick = () => {engine.goTo(engine.state().index - 1); render();};
  byId('nextBtn').onclick = () => {engine.next(); render();};
  byId('backToResultBtn').onclick = () => {engine.backToResults(); render();};
  byId('restartBtn').onclick = () => {engine.reset(); render();};
  byId('returnHomeBtn').onclick = () => {
    if (engine.state().mode === 'practice' && !confirm('确定返回课程首页吗？\n\n当前练习尚未完成。返回后，本次答题进度和计时将不会保留。')) return;
    window.location.href = '../index.html';
  };
  for (const prefix of ['questionNav', 'resultQuestionNav']) {
    byId(prefix + 'Toggle').onclick = () => {
      const expanded = byId(prefix + 'Wrapper').classList.toggle('expanded');
      byId(prefix + 'Toggle').setAttribute('aria-expanded', String(expanded));
    };
  }
  function closeHistory() {show('historyModal', false); byId('historyToggleBtn').focus();}
  byId('historyToggleBtn').onclick = () => {
    const list = byId('historyList'), history = engine.state().history; list.replaceChildren();
    if (!history.length) {const p = document.createElement('p'); p.textContent = '暂无历史记录，完成一次练习后会自动保存在这里。'; list.append(p);}
    history.forEach((rec, i) => {
      const item = document.createElement('div'); item.className = 'history-card-item';
      const title = document.createElement('div'); title.className = 'history-card-header';
      title.textContent = `记录 #${history.length - i} (${rec.timestamp}) · 准确率: ${rec.accuracy}%`;
      const meta = document.createElement('div'); meta.className = 'history-card-meta';
      meta.textContent = `用时: ${rec.totalTime} | 总尝试: ${rec.totalAttempts} 次`;
      item.append(title, meta); list.append(item);
    });
    show('historyModal', true); byId('closeHistoryBtn').focus();
  };
  byId('closeHistoryBtn').onclick = closeHistory;
  byId('historyModal').onclick = e => {if (e.target === byId('historyModal')) closeHistory();};
  document.addEventListener('keydown', e => {
    if (byId('historyModal').classList.contains('hidden')) return;
    if (e.key === 'Escape') closeHistory();
    // Modal currently has one interactive control; keep focus inside the dialog.
    if (e.key === 'Tab') {e.preventDefault(); byId('closeHistoryBtn').focus();}
  });
  // Preserve the existing report core and clipboard fallback, not its own format.
  function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise((resolve, reject) => {
      const area = document.createElement('textarea'); area.value = text; area.readOnly = true;
      area.style.position = 'fixed'; area.style.opacity = '0'; document.body.append(area); area.select(); area.setSelectionRange(0, area.value.length);
      try {document.execCommand('copy') ? resolve() : reject(new Error('Fallback copy failed'));} catch (e) {reject(e);} finally {area.remove();}
    });
  }
  byId('copyResultBtn').onclick = () => {
    copyTextToClipboard(PracticeReport.generate(engine.reportInput()))
      .then(() => alert('答题结果已成功复制到剪贴板，快去分享给你的老师吧！'))
      .catch(() => alert('复制失败，请手动截图发送。'));
  };
  render();
})();
