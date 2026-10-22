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
  function buildIcs({studentName,period,now,courseId,courseTitle}) {
    const validation = validatePeriod(period), time = timestamp(now);
    if (!validation.valid || !Number.isFinite(time) || typeof studentName!=='string') throw new RangeError('Invalid calendar data');
    const end = Date.parse(period.end);
    const utc = value => new Date(value).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
    // A short deterministic UTF-8 hash is only a UID discriminator, never a credential.
    let hash=2166136261;
    for (const byte of new TextEncoder().encode(studentName)) hash=Math.imul(hash^byte,16777619)>>>0;
    const uid = `${courseId ? `${courseId}-` : ''}${period.id || 'period'}-${end}-${hash.toString(16).padStart(8,'0')}@student-dashboard`;
    const parts = new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(end));
    const part = type => parts.find(item=>item.type===type).value;
    const deadline = `${part('year')}.${part('month')}.${part('day')} ${part('hour')}:${part('minute')}`;
    const lines = [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Student Dashboard//Learning Period//ZH','CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',`UID:${escapeIcsText(uid)}`,`DTSTAMP:${utc(time)}`,`DTSTART:${utc(end)}`,`DTEND:${utc(end+30*60000)}`,
      `SUMMARY:${escapeIcsText(courseTitle ? `${courseTitle}有效期截止` : '学习有效期截止')}`,`DESCRIPTION:${escapeIcsText(`${studentName} 的${courseTitle || '学习'}有效期于北京时间 ${deadline} 截止`)}`,
      'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:学习有效期即将截止','TRIGGER:-P3D','END:VALARM',
      'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:学习有效期即将截止','TRIGGER:-P1D','END:VALARM',
      'END:VEVENT','END:VCALENDAR'
    ];
    return lines.map(foldIcsLine).join('\r\n')+'\r\n';
  }
  // One source of duration per record: exact timestamps OR confirmed seconds + date.
  const sessionTime = session => Date.parse(session.start || `${session.date}T00:00:00+08:00`);
  function roundLessonSeconds(seconds) {
    if (!Number.isSafeInteger(seconds) || seconds<=0) throw new RangeError('实际时长须为正整数秒');
    return Math.round(seconds/60);
  }
  // Explicit confirmed billing wins over raw precision; never overwrite raw timestamps.
  // durationMinutes is accepted only as a pre-existing confirmed-minutes field.
  function calculateSessionMinutes(session) {
    if (session.durationSeconds!==undefined && (session.start!==undefined || session.end!==undefined)) throw new RangeError('实际时长来源重复');
    if (session.billedMinutes!==undefined && session.durationMinutes!==undefined) throw new RangeError('不要重复填写计费分钟');
    const confirmed=session.billedMinutes!==undefined ? session.billedMinutes : session.durationMinutes;
    if (confirmed!==undefined) {
      if (!Number.isSafeInteger(confirmed) || confirmed<0) throw new RangeError('确认计费分钟须为非负整数');
      return confirmed;
    }
    if (session.durationSeconds!==undefined) {
      return roundLessonSeconds(session.durationSeconds);
    }
    if (!validatePeriod(session).valid) throw new RangeError('授课起止时间无效');
    return roundLessonSeconds((Date.parse(session.end)-Date.parse(session.start))/1000);
  }
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
      if (session.durationSeconds!==undefined && (!Number.isSafeInteger(session.durationSeconds) || session.durationSeconds<=0)) return invalid('确认授课秒数须为正整数');
      const hasTimes=session.start!==undefined || session.end!==undefined;
      if (session.durationSeconds!==undefined && hasTimes) return invalid('实际时长与起止时间不能重复填写');
      try {calculateSessionMinutes(session);} catch(error) {return invalid(error.message);}
      if (!hasTimes) {
        if (typeof session.date!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(session.date)
          || !Number.isFinite(Date.parse(session.date)) || new Date(session.date).toISOString().slice(0,10)!==session.date) return invalid('授课日期无效');
        const day=sessionTime(session);
        // A date-only record can only be checked at day granularity; never invent its time.
        if (day>=Date.parse(pack.end) || day+86400000<=Date.parse(pack.start)) return invalid('授课日期超出课时包有效期');
      } else {
        if (session.date!==undefined || !validatePeriod(session).valid) return invalid('上课起止时间无效或缺少时区');
        const start=Date.parse(session.start), end=Date.parse(session.end);
        if (start%1000 || end%1000) return invalid('上课时间须为整秒');
        if (start<Date.parse(pack.start) || end>Date.parse(pack.end)) return invalid('上课时间超出课时包有效期');
        ranges.push({start,end});
      }
      if (session.title!==undefined && (typeof session.title!=='string' || !session.title.trim())) return invalid('课程记录标题无效');
      for (const key of ['content','homework','advice']) {
        if (session[key]!==undefined && (!Array.isArray(session[key]) || session[key].some(item=>typeof item!=='string' || !item.trim()))) return invalid('课程记录内容须为文字数组');
      }
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
    const sessions=[...pack.sessions].sort((a,b)=>sessionTime(a)-sessionTime(b)).map(session=>{
      const durationMinutes=calculateSessionMinutes(session);
      usedMinutes+=durationMinutes;
      return {...session,durationMinutes,usedMinutes,remainingMinutes:pack.purchasedMinutes-usedMinutes};
    });
    return {purchasedMinutes:pack.purchasedMinutes,usedMinutes,remainingMinutes:pack.purchasedMinutes-usedMinutes,sessions};
  }
  function formatLessonMinutes(minutes) {
    if (!Number.isSafeInteger(minutes)) throw new RangeError('Invalid lesson minutes');
    const value=Math.abs(minutes), hours=Math.floor(value/60), rest=value%60;
    return `${minutes<0 ? '超用 ' : ''}${hours ? `${hours}小时` : ''}${rest || !hours ? `${rest}分钟` : ''}`;
  }
  // Existing student-level periods are safe only for a single unfinished system course.
  // Multiple unfinished courses require an explicit period.courseId; never copy a deadline.
  function resolveCoursePeriod(data,course,now) {
    if (course.type==='private-lesson') return {
      period:validatePeriod(course.lessonPackage).valid ? course.lessonPackage : null,
      reason:validatePeriod(course.lessonPackage).valid ? null : 'invalid-private-period'
    };
    const periods=Array.isArray(data.learningPeriods) ? data.learningPeriods : [];
    const explicit=periods.filter(period=>period && period.courseId===course.id);
    if (explicit.length) return {period:pickLatestPeriod(explicit,now),reason:null};
    const unscoped=periods.filter(period=>period && period.courseId==null && validatePeriod(period).valid);
    const unfinished=(data.courses || []).filter(item=>item && item.type!=='private-lesson' && ['active','pending','paused'].includes(item.status));
    if (unscoped.length && unfinished.length===1 && unfinished[0].id===course.id && course.status==='active') return {period:pickLatestPeriod(unscoped,now),reason:null};
    return {period:null,reason:unscoped.length && unfinished.length>1 && unfinished.some(item=>item.id===course.id) ? 'ambiguous-course-period' : null};
  }
  function computeCourseStatus(data,course,now) {
    const fixed={completed:'已完成',paused:'暂停中',pending:'待开课',previous:'曾参加'};
    if (fixed[course.status]) return fixed[course.status];
    if (course.status!=='active') return '状态待确认';
    const {period}=resolveCoursePeriod(data,course,now);
    if (!period) return '进行中';
    const time=timestamp(now);
    if (time<Date.parse(period.start)) return '尚未开始';
    return time>=Date.parse(period.end) ? '已过期' : '进行中';
  }
  function computeStudentStatus(data,now) {
    if (data.learningState==='paused') return '暂停中';
    const courses=data.courses || [];
    if (courses.length && courses.every(course=>course.status==='completed')) return '已完成';
    const statuses=courses.map(course=>computeCourseStatus(data,course,now));
    if (statuses.includes('进行中')) return '学习中';
    if (statuses.some(status=>['尚未开始','待开课'].includes(status))) return '尚未开始';
    if (statuses.includes('暂停中')) return '暂停中';
    if (statuses.includes('已过期')) return '已过期';
    return '暂无进行中课程';
  }
  const DashboardLogic = {validatePeriod,pickLatestPeriod,computeLearningStatus,formatDuration,computePeriodState,getCourseTitle,buildIcs,validatePrivateLesson,summarizePrivateLesson,formatLessonMinutes,computeStudentStatus,roundLessonSeconds,calculateSessionMinutes,resolveCoursePeriod,computeCourseStatus};
  globalThis.DashboardLogic = DashboardLogic;
  if (typeof module !== 'undefined') module.exports = DashboardLogic;
})();
