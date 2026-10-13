/* V1 is read-only navigation; it neither imports nor edits student records. */
(() => {
  'use strict';
  const list = document.getElementById('teacherLessons');
  courseCatalog.courses['interval-ear-training'].lessons.filter(item=>item.isFormal)
    .forEach(item=>list.append(courseResourceUI.lessonRow(item,{showType:true})));
  const extra = document.getElementById('teacherSupplementary');
  courseCatalog.supplementaryExercises.filter(item=>item.isSupplementary)
    .forEach(item=>extra.append(courseResourceUI.supplementaryRow(item)));
  const students = document.getElementById('studentLinks');
  teacherDirectory.students.forEach(student=>{
    const row = document.createElement('li');row.className = 'resource-row supplementary-row';
    const link = document.createElement('a');link.className = 'training-link';
    link.textContent = `${student.displayName} ↗`;link.href = student.dashboardURL;
    link.target = '_blank';link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label',`${student.displayName} 学习页，在新标签页打开`);
    row.append(link);students.append(row);
  });
})();
