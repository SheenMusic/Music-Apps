/* V1 is read-only navigation; it neither imports nor edits student records. */
(() => {
  'use strict';
  const groups = document.querySelectorAll('.resource-group');
  window.addEventListener('pageshow',()=>groups.forEach(group=>{group.open=false}));
  const list = document.getElementById('teacherLessons');
  courseCatalog.courses['interval-ear-training'].lessons.filter(item=>item.isFormal)
    .forEach(item=>list.append(courseResourceUI.lessonRow(item)));
  const theory = document.getElementById('teacherTheory');
  intervalTheoryResources.lessons.forEach(item=>theory.append(courseResourceUI.lessonRow(item)));
  const extra = document.getElementById('teacherSupplementary');
  courseCatalog.supplementaryExercises.filter(item=>item.isSupplementary)
    .forEach(item=>extra.append(courseResourceUI.supplementaryRow(item)));
  const students = document.getElementById('studentLinks');
  teacherDirectory.students.forEach(student=>{
    const row = document.createElement('li');row.className = 'resource-row supplementary-row';
    if (!student.dashboardURL) {
      const pending = document.createElement('p');pending.className = 'section-note';
      pending.textContent = `${student.displayName} · 专属入口待权限接入`;
      row.append(pending);students.append(row);return;
    }
    const link = document.createElement('a');link.className = 'training-link';
    link.textContent = `${student.displayName} ↗`;link.href = student.dashboardURL;
    link.target = '_blank';link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label',`${student.displayName} 学习页，在新标签页打开`);
    row.append(link);students.append(row);
  });
  // Independent teacher menu HTML, populated from the same rendered resources.
  for (const [source,target] of [
    ['teacherLessons','menuEarLessons'],['teacherTheory','menuTheoryLessons'],
    ['teacherSupplementary','menuSupplementary'],['studentLinks','menuStudents']
  ]) {
    document.getElementById(target).append(...Array.from(document.getElementById(source).children,row=>row.cloneNode(true)));
  }
  // Add after resource population/cloning, so each disclosure owns its close action.
  document.querySelectorAll('.resource-group, .teacher-menu details').forEach(group=>{
    if (!group.querySelector('[data-lesson]')) return;
    const summary = group.querySelector(':scope > summary');
    group.append(courseResourceUI.collapseButton(()=>{
      group.open=false;summary.focus();
    },`收起${summary.textContent}课程资料`));
  });
})();
