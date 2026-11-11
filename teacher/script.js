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
  const chord = document.getElementById('teacherChord');
  courseCatalog.courses['chord-theory'].lessons.filter(item=>item.isFormal)
    .forEach(item=>chord.append(courseResourceUI.lessonRow(item)));
  // 补充训练按 courseId 放到各自课程下面
  for (const [courseId,id] of [['interval-ear-training','teacherSupplementary'],['interval-theory','teacherTheorySupplementary']]) {
    const extra = document.getElementById(id);
    courseCatalog.supplementaryExercises.filter(item=>item.isSupplementary && item.courseId===courseId)
      .forEach(item=>extra.append(courseResourceUI.supplementaryRow(item)));
  }
  // Students come from the generated teacher-roster.js; statuses use the same logic as student pages.
  const L = DashboardLogic, now = Date.now();
  const studentLink = student=>{
    const link = document.createElement('a');link.className = 'training-link';
    link.textContent = `${student.name} ↗`;link.href = student.url;
    link.target = '_blank';link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label',`${student.name} 学习页，在新标签页打开`);
    return link;
  };
  const meta = value=>{
    const node = document.createElement('span');node.className = 'student-meta';node.textContent = value;return node;
  };
  const day = value=>value ? value.replace(/-/g,'.') : '未记录日期';
  const lessonText = course=>course.status!=='completed' && course.currentLessons?.length
    ? 'Lesson '+course.currentLessons.map(n=>String(n).padStart(2,'0')).join('、') : '';
  const enrolled = [];
  teacherRoster.students.filter(student=>!student.test).forEach(student=>student.courses.forEach(course=>{
    enrolled.push({student,course,status:L.computeCourseStatus(student,course,now)});
  }));
  // One row per cohort (same first-class date), newest first; undated history last.
  const row = (label,items)=>{
    const item = document.createElement('li');item.className = 'resource-row student-cohort';
    const number = document.createElement('p');number.className = 'resource-number';number.textContent = label;
    const names = document.createElement('div');names.className = 'cohort-students';
    items.forEach(({student,course,status})=>{
      const entry = document.createElement('p');entry.className = 'cohort-student';
      const details = course.type==='private-lesson'
        ? [status,course.legacyBilling || course.remainingMinutes===undefined ? '' : `剩余 ${L.formatLessonMinutes(course.remainingMinutes)}`]
        : [status,lessonText(course)];
      entry.append(studentLink(student),meta(details.filter(Boolean).join(' · ')));
      names.append(entry);
    });
    item.append(number,names);return item;
  };
  document.querySelectorAll('.resource-group[data-course]').forEach(group=>{
    const id = group.dataset.course;
    const list = enrolled.filter(({course})=>id==='private-lesson' ? course.type==='private-lesson' : course.id===id);
    const section = document.createElement('section');section.className = 'supplementary-access course-students';
    const heading = document.createElement('h3');heading.textContent = `学员（${new Set(list.map(item=>item.student)).size}）`;
    const rows = document.createElement('ul');rows.className = 'resource-list';
    const cohorts = new Map();
    list.forEach(item=>{
      const key = item.course.startDay || '';
      if (!cohorts.has(key)) cohorts.set(key,[]);
      cohorts.get(key).push(item);
    });
    cohorts.forEach(items=>items.sort((a,b)=>a.student.nameRank-b.student.nameRank));
    [...cohorts.keys()].sort((a,b)=>!a-!b || b.localeCompare(a)).forEach(key=>rows.append(row(day(key),cohorts.get(key))));
    if (!list.length) {
      const empty = document.createElement('p');empty.className = 'section-note';empty.textContent = '暂无学员';
      section.append(heading,empty);
    } else section.append(heading,rows);
    group.append(section);
  });
  const students = document.getElementById('studentLinks');
  teacherRoster.students.forEach(student=>{
    const item = document.createElement('li');item.className = 'resource-row supplementary-row';
    item.append(studentLink(student));students.append(item);
  });
  // Independent teacher menu HTML, populated from the same rendered resources.
  for (const [source,target] of [
    ['teacherLessons','menuEarLessons'],['teacherTheory','menuTheoryLessons'],
    ['teacherSupplementary','menuSupplementary'],['teacherTheorySupplementary','menuTheorySupplementary'],['teacherChord','menuChordLessons'],['studentLinks','menuStudents']
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
