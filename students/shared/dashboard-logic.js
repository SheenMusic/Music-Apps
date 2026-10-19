/* Deterministic business rules. No DOM, browser clock, storage or resource gating. */
(() => {
  'use strict';
  function validatePeriod(period) {
    if (!period || period.start == null || period.end == null || period.start === '' || period.end === '') return {valid:false,reason:'missing-dates'};
    for (const value of [period.start,period.end]) {
      if (typeof value !== 'string') return {valid:false,reason:'invalid-date'};
      if (!/(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) {
        return {valid:false,reason:/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value) ? 'missing-timezone' : 'invalid-date'};
      }
      if (!Number.isFinite(Date.parse(value))) return {valid:false,reason:'invalid-date'};
    }
    if (Date.parse(period.end) <= Date.parse(period.start)) return {valid:false,reason:'invalid-range'};
    return {valid:true,reason:null};
  }
  function timestamp(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    if (value instanceof Date) return value.getTime();
    return typeof value === 'string' && /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? Date.parse(value) : NaN;
  }
  function pickLatestPeriod(periods,now) {
    // Most relevant period: current first, then nearest future, then latest history.
    // This deliberately does not simply choose the record with the greatest end.
    const time = timestamp(now);
    if (!Array.isArray(periods) || !Number.isFinite(time)) return null;
    const valid = periods.filter(period=>validatePeriod(period).valid).map(period=>({period,start:Date.parse(period.start),end:Date.parse(period.end)}));
    const active = valid.filter(item=>item.start<=time && time<item.end).sort((a,b)=>b.end-a.end);
    if (active.length) return active[0].period;
    const future = valid.filter(item=>time<item.start).sort((a,b)=>a.start-b.start);
    if (future.length) return future[0].period;
    return valid.sort((a,b)=>b.end-a.end)[0]?.period || null;
  }
  function computeLearningStatus(courses,period,now,learningState) {
    if (learningState==='paused') return '暂停中';
    const list = Array.isArray(courses) ? courses : [];
    if (list.length && list.every(course=>course.status==='completed')) return '已完成';
    if (!list.some(course=>course.status==='active')) return list.some(course=>course.status==='pending') ? '尚未开始' : '暂无进行中课程';
    if (!validatePeriod(period).valid) return '学习中';
    const time = timestamp(now);
    if (time<Date.parse(period.start)) return '尚未开始';
    if (time>=Date.parse(period.end)) return '已过期';
    return '学习中';
  }
  function formatDuration(start,end) {
    const first = timestamp(start), last = timestamp(end);
    if (!Number.isFinite(first) || !Number.isFinite(last) || last<=first) return null;
    const totalHours = Math.round((last-first)/3600000);
    const days = Math.floor(totalHours/24), hours = totalHours%24;
    return `学习周期：${days ? `${days}天${hours ? ` ${hours}小时` : ''}` : `${hours}小时`}`;
  }
  function computePeriodState(period,now) {
    if (!validatePeriod(period).valid) return null;
    const start = Date.parse(period.start), end = Date.parse(period.end), time = timestamp(now);
    if (!Number.isFinite(time)) return null;
    const remaining = end-time, hours = Math.ceil(Math.max(remaining,0)/3600000);
    return {
      status:remaining<=0 ? '本期已到期' : time<start ? '尚未开始' : remaining<=72*3600000 ? '即将到期' : '有效期内',
      remainingText:remaining<=0 ? '本期已到期' : time<start ? '本期尚未开始' : `剩余 ${Math.floor(hours/24)}天 ${hours%24}小时`,
      progress:Math.min(100,Math.max(0,(time-start)/(end-start)*100)),
      notExpired:time<end
    };
  }
  function getCourseTitle(course,catalog) {
    if (typeof course.enrollmentTitle === 'string' && course.enrollmentTitle.trim()) return course.enrollmentTitle;
    const title = catalog?.courses?.[course.id]?.title;
    return typeof title === 'string' && title.trim() ? title : course.title;
  }
  function escapeIcsText(value) {
    return String(value).replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
  }
  function foldIcsLine(line) {
    const encoder = new TextEncoder(), lines = [];let current='', bytes=0;
    for (const character of line) {
      const size = encoder.encode(character).length;
      if (bytes+size>75) {lines.push(current);current=' ';bytes=1;}
      current+=character;bytes+=size;
    }
    lines.push(current);return lines.join('\r\n');
  }
  function buildIcs({studentName,period,now}) {
    const validation = validatePeriod(period), time = timestamp(now);
    if (!validation.valid || !Number.isFinite(time) || typeof studentName!=='string') throw new RangeError('Invalid calendar data');
    const end = Date.parse(period.end);
    const utc = value => new Date(value).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
    // A short deterministic UTF-8 hash is only a UID discriminator, never a credential.
    let hash=2166136261;
    for (const byte of new TextEncoder().encode(studentName)) hash=Math.imul(hash^byte,16777619)>>>0;
    const uid = `${period.id || 'period'}-${end}-${hash.toString(16).padStart(8,'0')}@student-dashboard`;
    const parts = new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(end));
    const part = type => parts.find(item=>item.type===type).value;
    const deadline = `${part('year')}.${part('month')}.${part('day')} ${part('hour')}:${part('minute')}`;
    const lines = [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Student Dashboard//Learning Period//ZH','CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',`UID:${escapeIcsText(uid)}`,`DTSTAMP:${utc(time)}`,`DTSTART:${utc(end)}`,`DTEND:${utc(end+30*60000)}`,
      'SUMMARY:学习有效期截止',`DESCRIPTION:${escapeIcsText(`${studentName} 的学习有效期于北京时间 ${deadline} 截止`)}`,
      'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:学习有效期即将截止','TRIGGER:-P3D','END:VALARM',
      'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:学习有效期即将截止','TRIGGER:-P1D','END:VALARM',
      'END:VEVENT','END:VCALENDAR'
    ];
    return lines.map(foldIcsLine).join('\r\n')+'\r\n';
  }
  // One course entry represents one purchased package; renewals may add another entry.
  function validatePrivateLesson(course) {
    const pack = course?.lessonPackage;
    const invalid = reason => ({valid:false,reason});
    if (!pack || !Number.isSafeInteger(pack.purchasedMinutes) || pack.purchasedMinutes<=0) return invalid('购买时长必须为正整数分钟');
    if (!validatePeriod(pack).valid) return invalid('课时包有效期必须包含明确时区，且结束晚于开始');
    if (!Array.isArray(pack.sessions)) return invalid('上课记录必须为数组');
    if (course.accessEnabled || ['currentLessons','accessibleLessons','accessibleSupplementary'].some(key=>course[key]?.length)) return invalid('Private Lesson 不配置课时资料或补充训练');
    const ids = new Set(), ranges = [];
    for (const session of pack.sessions) {
      if (!session || typeof session.id!=='string' || !session.id.trim() || ids.has(session.id)) return invalid('上课记录 ID 缺失或重复');
      ids.add(session.id);
      if (!validatePeriod(session).valid) return invalid('上课起止时间无效或缺少时区');
      const start=Date.parse(session.start), end=Date.parse(session.end);
      if (start%60000 || end%60000) return invalid('上课时间须精确到分钟');
      if (start<Date.parse(pack.start) || end>Date.parse(pack.end)) return invalid('上课时间超出课时包有效期');
      ranges.push({start,end});
    }
    ranges.sort((a,b)=>a.start-b.start);
    if (ranges.some((item,i)=>i>0 && item.start<ranges[i-1].end)) return invalid('上课记录时间重叠');
    return {valid:true,reason:null};
  }
  function summarizePrivateLesson(course) {
    const check=validatePrivateLesson(course);
    if (!check.valid) throw new RangeError(check.reason);
    const pack=course.lessonPackage;
    let usedMinutes=0;
    const sessions=[...pack.sessions].sort((a,b)=>Date.parse(a.start)-Date.parse(b.start)).map(session=>{
      const durationMinutes=(Date.parse(session.end)-Date.parse(session.start))/60000;
      usedMinutes+=durationMinutes;
      return {...session,durationMinutes,usedMinutes,remainingMinutes:pack.purchasedMinutes-usedMinutes};
    });
    return {purchasedMinutes:pack.purchasedMinutes,usedMinutes,remainingMinutes:pack.purchasedMinutes-usedMinutes,sessions};
  }
  function formatLessonMinutes(minutes) {
    if (!Number.isSafeInteger(minutes)) throw new RangeError('Invalid lesson minutes');
    const value=Math.abs(minutes), hours=Math.floor(value/60), rest=value%60;
    return `${minutes<0 ? '超用 ' : ''}${hours ? `${hours} 小时${rest ? ' ' : ''}` : ''}${rest || !hours ? `${rest} 分钟` : ''}`;
  }
  function computeStudentStatus(data,now) {
    const courses=data.courses || [];
    const period=pickLatestPeriod(data.learningPeriods,now);
    const fallback=computeLearningStatus(courses,period,now,data.learningState);
    if (data.learningState==='paused' || !courses.some(c=>c.type==='private-lesson' && c.status==='active')) return fallback;
    const statuses=courses.filter(c=>c.status==='active').map(course=>computeLearningStatus([course],course.type==='private-lesson' ? course.lessonPackage : period,now));
    if (statuses.includes('学习中')) return '学习中';
    if (statuses.includes('尚未开始')) return '尚未开始';
    return '已过期';
  }
  const DashboardLogic = {validatePeriod,pickLatestPeriod,computeLearningStatus,formatDuration,computePeriodState,getCourseTitle,buildIcs,validatePrivateLesson,summarizePrivateLesson,formatLessonMinutes,computeStudentStatus};
  globalThis.DashboardLogic = DashboardLogic;
  if (typeof module !== 'undefined') module.exports = DashboardLogic;
})();
