/* Read only this student's configuration; never infer progress from access or dates. */
(() => {
  'use strict';
  const text = (tag, value, className) => {
    const node = document.createElement(tag);node.textContent = value;
    if (className) node.className = className;
    return node;
  };
  const lesson = number => `Lesson ${String(number).padStart(2,'0')}`;
  const lessonRange = numbers => {
    const values = [...new Set(numbers)].sort((a,b)=>a-b);
    if (values.length > 1 && values.every((n,i)=>!i || n===values[i-1]+1)) {
      return `${lesson(values[0])}–${String(values.at(-1)).padStart(2,'0')}`;
    }
    return values.map(lesson).join('、');
  };
  document.getElementById('studentName').textContent = studentData.studentName;
  document.title = `${studentData.studentName} · Learning Dashboard`;
  document.getElementById('learningStatus').textContent = studentData.courses.some(c=>c.status==='active') ? '学习中' : '已完成';
  const list = document.getElementById('courseList');
  studentData.courses.forEach((course,index)=>{
    const row = text('li','','course-row');
    const content = document.createElement('div');
    content.append(text('p',`Course ${String(index+1).padStart(2,'0')}`,'course-number'),text('h3',course.title));
    if (course.status==='active' && course.currentLessons?.length) content.append(text('p',`当前进度：${lessonRange(course.currentLessons)}`,'course-current'));
    row.append(content,text('span',course.status==='completed' ? '已完成 ✓' : '进行中','status'));list.append(row);
  });
  const access = document.getElementById('courseAccess');
  studentData.courses.filter(c=>c.accessEnabled && c.status!=='completed').forEach(course=>{
    access.append(text('p',course.title,'access-course'));
    const resources = courseCatalog.courses[course.id];
    const links = text('ul','','resource-list');
    for (const number of course.accessibleLessons || []) {
      const resource = resources?.lessons.find(item=>item.number===number && item.isFormal);
      if (resource) links.append(courseResourceUI.lessonRow(resource));
      else links.append(text('li',`${lesson(number)} · 资源待补充`,'resource-row'));
    }
    access.append(links);
    const supplements = courseCatalog.supplementaryExercises.filter(item=>
      item.isSupplementary && (course.accessibleSupplementary || []).includes(item.id));
    if (supplements.length) {
      const section = document.createElement('section');section.className = 'supplementary-access';
      section.append(text('h3','补充训练'));
      const extra = text('ul','','resource-list');
      supplements.forEach(item=>extra.append(courseResourceUI.supplementaryRow(item)));
      section.append(extra);access.append(section);
    }
  });
  // Historical periods with unknown dates remain in configuration without invented dates.
  const period = studentData.learningPeriods.filter(p=>p.start && p.end).at(-1);
  const format = (date, includeTime) => {
    const parts = new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',...(includeTime ? {hour:'2-digit',minute:'2-digit',hourCycle:'h23'} : {})}).formatToParts(date);
    const value = type => parts.find(p=>p.type===type)?.value;
    return `${value('year')}.${value('month')}.${value('day')}${includeTime ? ` ${value('hour')}:${value('minute')}` : ''}`;
  };
  if (!period) {
    document.getElementById('periodStatus').textContent = '尚未设置有效期';return;
  }
  const start = new Date(period.start), end = new Date(period.end);
  if (!Number.isFinite(+start) || !Number.isFinite(+end) || end<=start) {
    document.getElementById('periodStatus').textContent = '有效期配置需要确认';return;
  }
  document.getElementById('periodRange').textContent = `${format(start,false)} — ${format(end,false)}`;
  document.getElementById('periodStart').textContent = format(start,true);
  document.getElementById('periodEnd').textContent = format(end,true);
  function updatePeriod() {
    const now = Date.now(), remaining = +end-now;
    const state = remaining<=0 ? '本期已到期' : now<+start ? '尚未开始' : remaining<=72*3600000 ? '即将到期' : '有效期内';
    document.getElementById('periodStatus').textContent = state;
    const hours = Math.ceil(Math.max(remaining,0)/3600000);
    document.getElementById('remainingTime').textContent = remaining<=0 ? '本期已到期' : now<+start ? '本期尚未开始' : `剩余 ${Math.floor(hours/24)}天 ${hours%24}小时`;
    document.getElementById('timeProgress').value = Math.min(100,Math.max(0,(now-start)/(end-start)*100));
  }
  updatePeriod();setInterval(updatePeriod,60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden) updatePeriod()});
  window.addEventListener('pageshow',updatePeriod);
})();
