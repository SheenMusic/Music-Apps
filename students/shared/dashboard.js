/* Course-centric shared rendering. Progress, billing, dates and access remain independent. */
(() => {
  'use strict';
  const L=DashboardLogic;
  const text=(tag,value,className)=>{
    const node=document.createElement(tag);node.textContent=value;
    if(className)node.className=className;
    return node;
  };
  const lessonRange=numbers=>{
    const values=[...new Set(numbers)].sort((a,b)=>a-b);
    const lesson=n=>`Lesson ${String(n).padStart(2,'0')}`;
    return values.length>1 && values.every((n,i)=>!i || n===values[i-1]+1)
      ? `${lesson(values[0])}–${String(values.at(-1)).padStart(2,'0')}` : values.map(lesson).join('、');
  };
  const dateFormatter=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  const displayDate=(date,withTime=true)=>{
    const parts=dateFormatter.formatToParts(new Date(date)),get=type=>parts.find(p=>p.type===type).value;
    return `${get('year')}.${get('month')}.${get('day')}${withTime ? ` ${get('hour')}:${get('minute')}` : ''}`;
  };
  const sessionTime=session=>Date.parse(session.start || `${session.date}T00:00:00+08:00`);
  const courseTitle=course=>course.type==='private-lesson' ? '一对一课' : L.getCourseTitle(course,courseCatalog);
  const isWeChat=/MicroMessenger/i.test(navigator.userAgent);
  const canDownload=typeof Blob==='function' && typeof TextEncoder==='function' && typeof URL.createObjectURL==='function' && typeof URL.revokeObjectURL==='function' && 'download' in document.createElement('a');
  const entries=[];
  document.title=`${studentData.studentName} · Learning Dashboard`;
  document.getElementById('studentName').textContent=studentData.studentName;

  function disclosure(label,panel,id) {
    panel.id=id;panel.hidden=true;
    const button=text('button','','course-toggle');button.type='button';
    button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls',id);
    const arrow=text('span','','course-toggle-arrow');arrow.setAttribute('aria-hidden','true');
    button.append(arrow,text('span',label));
    const close=()=>{
      button.setAttribute('aria-expanded','false');panel.hidden=true;
      panel.querySelectorAll('.record-toggle').forEach(toggle=>{
        toggle.setAttribute('aria-expanded','false');document.getElementById(toggle.getAttribute('aria-controls')).hidden=true;
      });
    };
    button.addEventListener('click',()=>{
      if(button.getAttribute('aria-expanded')==='true') close();
      else {button.setAttribute('aria-expanded','true');panel.hidden=false;}
    });
    panel.append(courseResourceUI.collapseButton(()=>{close();button.focus();},`收起${label}`));
    return button;
  }
  function privateRecords(course,index) {
    const summary=L.summarizePrivateLesson(course);
    const panel=text('div','','course-resources');
    const records=text('ol','','resource-list session-list');
    // Stable reverse order makes the latest appended record first on the same date.
    [...summary.sessions].reverse().sort((a,b)=>sessionTime(b)-sessionTime(a)).forEach((session,i)=>{
      const row=text('li','','resource-row session-row');
      const hasNotes=['content','homework','advice'].some(key=>session[key]?.length);
      const heading=document.createElement(hasNotes ? 'button' : 'div');heading.className='record-heading';
      if(hasNotes){heading.type='button';heading.classList.add('record-toggle');}
      heading.append(text('span',session.date ? session.date.replace(/-/g,'.') : displayDate(session.start,false),'record-date'),text('span',L.formatLessonMinutes(session.durationMinutes),'record-duration'));
      if(session.title)heading.append(text('span',session.title,'record-title'));
      row.append(heading);
      if(hasNotes){
        const notes=text('div','','record-notes');notes.id=`record-${index}-${i}`;notes.hidden=true;
        heading.setAttribute('aria-expanded','false');heading.setAttribute('aria-controls',notes.id);
        const arrow=text('span','','course-toggle-arrow');arrow.setAttribute('aria-hidden','true');heading.prepend(arrow);
        for(const [key,label] of [['content','本次内容'],['homework','课后任务'],['advice','学习建议']]){
          if(!session[key]?.length)continue;
          notes.append(text('h5',label));const list=document.createElement('ul');session[key].forEach(item=>list.append(text('li',item)));notes.append(list);
        }
        heading.addEventListener('click',()=>{
          const expanded=heading.getAttribute('aria-expanded')!=='true';heading.setAttribute('aria-expanded',String(expanded));notes.hidden=!expanded;
        });
        row.append(notes);
      }
      records.append(row);
    });
    panel.append(records);
    return {summary,panel};
  }
  function systemResources(course){
    if(!course.accessEnabled)return null;
    const resources=courseCatalog.courses[course.id] || (course.id==='interval-theory' ? intervalTheoryResources : null);
    const supplements=courseCatalog.supplementaryExercises.filter(item=>item.isSupplementary && (course.accessibleSupplementary || []).includes(item.id));
    if(!(course.accessibleLessons?.length || supplements.length))return null;
    const panel=text('div','','course-resources'),list=text('ul','','resource-list');
    for(const number of course.accessibleLessons || []){
      const resource=resources?.lessons.find(item=>item.number===number && item.isFormal);
      list.append(resource ? courseResourceUI.lessonRow(resource) : text('li',`Lesson ${String(number).padStart(2,'0')} · 资源待补充`,'resource-row'));
    }
    panel.append(list);
    if(supplements.length){
      const group=text('section','','supplementary-access');group.append(text('h5','补充训练'));
      const extra=text('ul','','resource-list');supplements.forEach(item=>extra.append(courseResourceUI.supplementaryRow(item)));group.append(extra);panel.append(group);
    }
    return panel;
  }
  studentData.courses.forEach((course,index)=>{
    const row=text('li','','course-row');row.dataset.course=course.id;
    const content=text('div','','course-content');
    content.append(text('h4',courseTitle(course),'course-title'));
    const status=text('span','','status course-status');
    row.append(text('p',`Course ${String(index+1).padStart(2,'0')}`,'course-number'),content,status);
    const deadline=text('p','','course-deadline');deadline.hidden=true;
    const deadlineText=text('span');
    const calendar=text('button','添加到日历','calendar-button');calendar.type='button';calendar.hidden=true;
    const calendarNotice=text('span','请在系统浏览器中打开本页后再添加到日历','calendar-notice');calendarNotice.hidden=true;
    deadline.append(deadlineText,calendar,calendarNotice);
    try {
      let panel;
      if(course.type==='private-lesson'){
        const result=privateRecords(course,index);
        content.append(text('p',`剩余 ${L.formatLessonMinutes(result.summary.remainingMinutes)}`,'course-balance'));
        panel=result.summary.sessions.length ? result.panel : null;
      } else panel=systemResources(course);
      content.append(deadline);
      if(panel){
        row.classList.add('with-resources');
        const label=course.type==='private-lesson' ? '当前进度' : course.status==='completed' || !course.currentLessons?.length ? '课程资料' : `当前进度：${lessonRange(course.currentLessons)}`;
        content.append(disclosure(label,panel,`course-access-${index}`));row.append(panel);
      } else if(course.type!=='private-lesson' && course.currentLessons?.length){
        content.append(text('p',`当前进度：${lessonRange(course.currentLessons)}`,'course-current'));
      }
    } catch(error){
      content.append(text('p','课时记录暂不可用，请联系老师核对。','muted'));console.error('课时记录无效：',error.message);
    }
    const association=L.resolveCoursePeriod(studentData,course,Date.now());
    if(association.reason)console.warn(`课程有效期未显示：${course.id}（${association.reason}）`);
    calendar.addEventListener('click',()=>{
      const now=Date.now(),{period}=L.resolveCoursePeriod(studentData,course,now);
      if(course.status==='completed' || !period || Date.parse(period.end)<=now || isWeChat || !canDownload)return;
      const ics=L.buildIcs({studentName:studentData.studentName,period,now,courseId:course.id,courseTitle:courseTitle(course)});
      const url=URL.createObjectURL(new Blob([ics],{type:'text/calendar;charset=utf-8'}));
      const link=document.createElement('a');link.href=url;link.download='learning-period-end.ics';link.hidden=true;document.body.append(link);
      try{link.click();}finally{link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
    });
    entries.push({course,status,deadline,deadlineText,calendar,calendarNotice});
    document.getElementById('courseList').append(row);
  });
  function updateStatus(){
    const now=Date.now();document.getElementById('learningStatus').textContent=L.computeStudentStatus(studentData,now);
    for(const entry of entries){
      const {course,status,deadline,deadlineText,calendar,calendarNotice}=entry;
      status.textContent=L.computeCourseStatus(studentData,course,now);
      const {period}=L.resolveCoursePeriod(studentData,course,now);
      const show=course.status!=='completed' && period!==null;
      deadline.hidden=!show;
      if(show)deadlineText.textContent=`有效期至 ${displayDate(period.end)}`;
      const future=show && Date.parse(period.end)>now;
      calendar.hidden=!future || isWeChat || !canDownload;
      calendarNotice.hidden=!future || !isWeChat;
    }
  }
  updateStatus();setInterval(updateStatus,60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateStatus();});
  window.addEventListener('pageshow',updateStatus);
})();
