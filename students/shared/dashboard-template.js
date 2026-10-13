/* Shared static layout, with identity supplied by only this page's student data. */
(() => {
  'use strict';
  const template = document.createElement('template');
  template.innerHTML = `
<main class="dashboard">
  <header class="dashboard-heading">
    <div><p class="eyebrow">Learning Dashboard</p><h1 class="public-title" id="studentName"></h1><p class="muted">你的学习进度与课程资料</p></div>
    <span class="status" id="learningStatus">学习中</span>
  </header>
  <section class="dashboard-section" aria-labelledby="progressHeading">
    <h2 class="public-section" id="progressHeading">学习进度</h2>
    <ol class="course-list" id="courseList"></ol>
  </section>
  <section class="dashboard-section period-panel" aria-labelledby="periodHeading">
    <h2 class="public-section" id="periodHeading">本期学习有效期</h2>
    <p class="period-range" id="periodRange"></p>
    <dl class="period-dates"><div><dt>开始时间</dt><dd id="periodStart"></dd></div><div><dt>截止时间</dt><dd id="periodEnd"></dd></div></dl>
    <p class="period-note" id="periodDuration" hidden></p>
    <div class="period-summary"><p id="remainingTime"></p><span class="status" id="periodStatus"></span></div>
    <label class="muted" for="timeProgress">学习有效期的时间消耗（非课程完成进度）</label>
    <progress id="timeProgress" max="100" value="0"></progress>
    <p class="period-note">所有时间均以北京时间（UTC+8）为准</p>
  </section>
  <noscript><p>请启用 JavaScript 以显示最新学习进度、课程资料与有效期。</p></noscript>
</main>
`;
  template.content.querySelector('#studentName').textContent = studentData.studentName;
  document.body.append(template.content);
})();
