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
  function computeLearningStatus(courses,period,now) {
    const list = Array.isArray(courses) ? courses : [];
    if (list.length && list.every(course=>course.status==='completed')) return '已完成';
    if (!list.some(course=>course.status==='active')) return '暂无进行中课程';
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
    const title = catalog?.courses?.[course.id]?.title;
    return typeof title === 'string' && title.trim() ? title : course.title;
  }
  const DashboardLogic = {validatePeriod,pickLatestPeriod,computeLearningStatus,formatDuration,computePeriodState,getCourseTitle};
  globalThis.DashboardLogic = DashboardLogic;
  if (typeof module !== 'undefined') module.exports = DashboardLogic;
})();
