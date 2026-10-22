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
  document.getElementById('learningStatus').textContent = DashboardLogic.computeStudentStatus(studentData,Date.now());
  const privateOnly = studentData.courses.length>0 && studentData.courses.every(course=>course.type==='private-lesson');
  if (privateOnly) {
    document.title = `${studentData.studentName} · 学习记录`;
    document.querySelector('.dashboard-heading .eyebrow').textContent='一对一音乐课';
    document.querySelector('.dashboard-heading .muted').hidden=true;
    document.getElementById('learningStatus').hidden=true;
    document.querySelector('[aria-labelledby="progressHeading"]').hidden=true;
  }
  const list = document.getElementById('courseList');
  const coursePanels = new Map();
  studentData.courses.forEach((course,index)=>{
    if (course.type==='private-lesson') return;
    const row = text('li','','course-row');
    const content = document.createElement('div');
    content.append(text('p',`Course ${String(index+1).padStart(2,'0')}`,'course-number'),text('h3',DashboardLogic.getCourseTitle(course,courseCatalog)));
    const current = course.currentLessons?.length ? `当前进度：${lessonRange(course.currentLessons)}` : '课程资料';
    row.append(content,text('span',({completed:'已完成 ✓',active:'进行中',previous:'曾参加',paused:'暂停中',pending:'待开课'})[course.status] || '状态待确认','status'));
    if (course.accessEnabled && course.type!=='private-lesson') {
      row.classList.add('with-resources');
      const panel = document.createElement('div');panel.className = 'course-resources';
      panel.id = `course-access-${course.id}`;panel.hidden = true;
      const toggle = text('button','','course-current course-toggle');toggle.type = 'button';
      toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls',panel.id);
      const arrow = text('span','','course-toggle-arrow');arrow.setAttribute('aria-hidden','true');
      toggle.append(arrow,text('span',current));
      toggle.addEventListener('click',()=>{
        const expanded = toggle.getAttribute('aria-expanded')!=='true';
        toggle.setAttribute('aria-expanded',String(expanded));panel.hidden = !expanded;
      });
      content.append(toggle);row.append(panel);coursePanels.set(course.id,panel);
    } else if (course.status==='active' && course.currentLessons?.length) content.append(text('p',current,'course-current'));
    list.append(row);
  });
  studentData.courses.filter(c=>c.accessEnabled && c.type!=='private-lesson').forEach(course=>{
    const access = coursePanels.get(course.id);
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
    const toggle = document.querySelector(`[aria-controls="${access.id}"]`);
    access.append(courseResourceUI.collapseButton(()=>{
      access.hidden = true;toggle.setAttribute('aria-expanded','false');toggle.focus();
    },`收起${DashboardLogic.getCourseTitle(course,courseCatalog)}课程资料`));
  });
  const reasonMessages = {
    'missing-dates':'未设置周期（包括日期为空的历史记录）',
    'invalid-date':'日期无法解析',
    'invalid-range':'周期结束时间不晚于开始时间',
    'missing-timezone':'缺少明确时区'
  };
  const format = date => new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(date));
  const displayDate = (date,includeTime) => {
    const parts = format(date), value = type => parts.find(p=>p.type===type)?.value;
    return `${value('year')}.${value('month')}.${value('day')}${includeTime ? ` ${value('hour')}:${value('minute')}` : ''}`;
  };
  const definitionList = (items,className) => {
    const dl=text('dl','',className);
    for (const [label,value] of items) {
      const group=document.createElement('div');group.append(text('dt',label),text('dd',value));dl.append(group);
    }
    return dl;
  };
  const courseRecords=[];
  const duration = DashboardLogic.formatLessonMinutes;
  const recordDate = session => session.date ? session.date.replace(/-/g,'.') : displayDate(session.start,false);
  const periodAnchor=document.querySelector('[aria-labelledby="periodHeading"]');
  studentData.courses.filter(course=>course.type==='private-lesson').forEach((course,index)=>{
    const panel=text('section','','dashboard-section private-lesson-panel');
    const heading=text('h2','剩余课时','public-section');
    heading.id=`private-lesson-heading-${index}`;panel.setAttribute('aria-labelledby',heading.id);panel.append(heading);
    periodAnchor.before(panel);
    try {
      const summary=DashboardLogic.summarizePrivateLesson(course), pack=course.lessonPackage;
      panel.append(text('p',duration(summary.remainingMinutes),'private-balance'));
      panel.append(definitionList([['有效期',`${displayDate(pack.start,false)} — ${displayDate(pack.end,false)}`]],'private-validity'));
      const ledger=document.createElement('details');ledger.className='private-ledger';
      ledger.append(text('summary','查看销课记录'));
      ledger.append(definitionList([
        ['购买时长',duration(summary.purchasedMinutes)],['累计消耗',duration(summary.usedMinutes)]
      ],'session-details'));
      const records=text('ol','','private-ledger-list');
      summary.sessions.forEach(session=>{
        const row=text('li');row.append(text('span',recordDate(session)),text('span',duration(session.durationMinutes)));records.append(row);
        if (session.title || ['content','homework','advice'].some(key=>session[key]?.length)) courseRecords.push(session);
      });
      if (summary.sessions.length) ledger.append(records);
      panel.append(ledger);
    } catch (error) {
      panel.append(text('p','课时记录暂不可用，请联系老师核对。','period-note'));
      console.error('一对一课时配置无效：',error.message);
    }
  });
  if (studentData.learningFocus?.length) {
    const section=text('section','','dashboard-section learning-focus');
    const heading=text('h2','学习方向','public-section');heading.id='focusHeading';section.setAttribute('aria-labelledby',heading.id);section.append(heading);
    studentData.learningFocus.forEach(item=>{
      const entry=document.createElement('div');entry.append(text('h3',item.title),text('p',item.description,'muted'));section.append(entry);
    });
    periodAnchor.before(section);
  }
  if (courseRecords.length) {
    const section=text('section','','dashboard-section private-course-records');
    const heading=text('h2','课程记录','public-section');heading.id='recordsHeading';section.setAttribute('aria-labelledby',heading.id);section.append(heading);
    courseRecords.reverse().sort((a,b)=>Date.parse(b.start || `${b.date}T00:00:00+08:00`)-Date.parse(a.start || `${a.date}T00:00:00+08:00`));
    courseRecords.forEach((session,index)=>{
      const record=document.createElement('details');record.className='private-record';record.open=index===0;
      record.append(text('summary',`${recordDate(session)} · ${session.title || '一对一课程'} · ${duration(session.durationMinutes)}`));
      for (const [key,label] of [['content','本次内容'],['homework','课后任务'],['advice','学习建议']]) {
        if (!session[key]?.length) continue;
        record.append(text('h3',label));const items=document.createElement('ul');session[key].forEach(item=>items.append(text('li',item)));record.append(items);
      }
      section.append(record);
    });
    periodAnchor.before(section);
  }
  const calendarButton = text('button','添加到日历','calendar-button');
  calendarButton.type='button';calendarButton.hidden=true;
  const calendarNotice = text('p','请在系统浏览器中打开本页后再添加到日历','period-note');calendarNotice.hidden=true;
  document.querySelector('[aria-labelledby="periodHeading"] > .period-note:last-child').before(calendarButton,calendarNotice);
  const isWeChat = /MicroMessenger/i.test(navigator.userAgent);
  const canDownload = typeof Blob==='function' && typeof TextEncoder==='function' && typeof URL!=='undefined' && typeof URL.createObjectURL==='function' && typeof URL.revokeObjectURL==='function' && 'download' in document.createElement('a');
  calendarButton.addEventListener('click',()=>{
    const now=Date.now(), period=DashboardLogic.pickLatestPeriod(studentData.learningPeriods,now);
    if (!period || !DashboardLogic.computePeriodState(period,now).notExpired || isWeChat || !canDownload) {updatePeriod();return;}
    const ics=DashboardLogic.buildIcs({studentName:studentData.studentName,period,now});
    const url=URL.createObjectURL(new Blob([ics],{type:'text/calendar;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='learning-period-end.ics';link.hidden=true;
    document.body.append(link);
    try {link.click();} finally {link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  });
  let missingWarned = false;
  function updatePeriod() {
    const now = Date.now();
    const period = DashboardLogic.pickLatestPeriod(studentData.learningPeriods,now);
    document.getElementById('learningStatus').textContent = DashboardLogic.computeStudentStatus(studentData,now);
    const panel = document.querySelector('[aria-labelledby="periodHeading"]');panel.hidden = !period;
    if (!period) {
      calendarButton.hidden=true;calendarNotice.hidden=true;
      if (!missingWarned && !studentData.courses.some(course=>course.type==='private-lesson')) {
        const reasons = studentData.learningPeriods.length ? studentData.learningPeriods.map(item=>DashboardLogic.validatePeriod(item).reason) : ['missing-dates'];
        console.warn('学习周期未显示：', [...new Set(reasons)].map(reason=>reasonMessages[reason] || reason).join('；'));
        missingWarned = true;
      }
      return;
    }
    missingWarned = false;
    document.getElementById('periodRange').textContent = `${displayDate(period.start,false)} — ${displayDate(period.end,false)}`;
    document.getElementById('periodStart').textContent = displayDate(period.start,true);
    document.getElementById('periodEnd').textContent = displayDate(period.end,true);
    const duration = document.getElementById('periodDuration');duration.hidden = !studentData.showPeriodDuration;
    if (studentData.showPeriodDuration) duration.textContent = DashboardLogic.formatDuration(period.start,period.end);
    const state = DashboardLogic.computePeriodState(period,now);
    const expired = state.status==='本期已到期';
    document.getElementById('periodStatus').textContent = state.status;
    document.getElementById('periodStatus').hidden = expired;
    document.getElementById('remainingTime').textContent = expired ? '本期到期' : state.remainingText;
    calendarButton.hidden = !state.notExpired || isWeChat || !canDownload;
    calendarNotice.hidden = !state.notExpired || !isWeChat;
  }
  updatePeriod();setInterval(updatePeriod,60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden) updatePeriod()});
  window.addEventListener('pageshow',updatePeriod);
})();
