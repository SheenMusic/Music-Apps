/* One shared layout for resource courses, private lessons and mixed enrolments. */
(() => {
  const template=document.createElement('template');
  template.innerHTML=`
<main class="dashboard">
  <header class="dashboard-heading">
    <h1 class="public-title">Learning Dashboard</h1>
    <span class="status" id="learningStatus" role="status"></span>
    <p class="student-name" id="studentName"></p>
  </header>
  <section class="dashboard-section" aria-labelledby="learningHeading">
    <h2 class="public-section" id="learningHeading">学习进度与课程资料</h2>
    <h3 class="progress-heading" id="progressHeading">学习进度</h3>
    <ol class="course-list" id="courseList"></ol>
  </section>
  <noscript><p>请启用 JavaScript 以显示学习进度与课程资料。</p></noscript>
</main>`;
  template.content.querySelector('#studentName').textContent=studentData.studentName;
  document.body.append(template.content);
})();
