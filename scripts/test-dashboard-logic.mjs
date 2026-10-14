import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const L = require('../students/shared/dashboard-logic.js');
const now = Date.parse('2026-10-15T08:07:00Z');
const period = {id:'current',start:'2026-10-13T16:07:00+08:00',end:'2026-10-27T16:07:00+08:00'};
const future = {id:'future',start:'2026-11-01T00:00:00Z',end:'2026-11-15T00:00:00Z'};
const history = {id:'history',start:'2026-09-16T17:15:00+08:00',end:'2026-09-30T17:15:00+08:00'};
let count=0;
function test(name,fn){fn();count++;console.log(`PASS ${name}`);}
test('period validation and explicit zones',()=>{
 assert.equal(L.validatePeriod(period).valid,true);
 assert.equal(L.validatePeriod(future).valid,true);
 assert.equal(L.validatePeriod({start:'2026-10-13T16:07:00',end:period.end}).reason,'missing-timezone');
 assert.equal(L.validatePeriod({start:'invalid',end:period.end}).reason,'invalid-date');
 assert.equal(L.validatePeriod({...period,end:period.start}).reason,'invalid-range');
 assert.equal(L.validatePeriod({start:null,end:null}).reason,'missing-dates');
 assert.equal(L.validatePeriod({...period,start:'2026-99-99T00:00:00Z'}).reason,'invalid-date');
});
test('all learning status branches, independent of access',()=>{
 const active=[{status:'active'}];
 assert.equal(L.computeLearningStatus(active,period,now),'学习中');
 assert.equal(L.computeLearningStatus(active,future,now),'尚未开始');
 assert.equal(L.computeLearningStatus(active,history,now),'已过期');
 assert.equal(L.computeLearningStatus([{status:'completed'}],period,now),'已完成');
 assert.equal(L.computeLearningStatus([{status:'completed'}],history,now),'已完成');
 assert.equal(L.computeLearningStatus([{status:'previous'}],period,now),'暂无进行中课程');
 assert.equal(L.computeLearningStatus([],period,now),'暂无进行中课程');
 assert.equal(L.computeLearningStatus(active,null,now),'学习中');
});
test('period priorities, unsorted arrays, ties and invalid records',()=>{
 const longer={...period,id:'longer',end:'2026-10-30T00:00:00Z'};
 const nearest={...future,id:'near',start:'2026-10-20T00:00:00Z'};
 const recent={...history,id:'recent',end:'2026-10-10T00:00:00Z'};
 assert.equal(L.pickLatestPeriod([future,history,period],now),period);
 assert.equal(L.pickLatestPeriod([period,longer,future],now),longer);
 assert.equal(L.pickLatestPeriod([history,future],now),future);
 assert.equal(L.pickLatestPeriod([future,nearest,history],now),nearest);
 assert.equal(L.pickLatestPeriod([recent,history],now),recent);
 assert.equal(L.pickLatestPeriod([{start:null,end:null},{start:'bad',end:'bad'},{...period,end:period.start},period],now),period);
 assert.equal(L.pickLatestPeriod([],now),null);
 assert.equal(L.pickLatestPeriod([{start:null,end:null}],now),null);
 assert.equal(L.pickLatestPeriod([period],Date.parse(period.end)),period);
});
test('duration formatting, rounding and invalid inputs',()=>{
 const start=Date.parse(period.start);
 assert.equal(L.formatDuration(start,start+14*86400000),'学习周期：14天');
 assert.equal(L.formatDuration(start,start+(14*24+3)*3600000),'学习周期：14天 3小时');
 assert.equal(L.formatDuration(start,start+8*3600000),'学习周期：8小时');
 assert.equal(L.formatDuration(start,start+20*60000),'学习周期：0小时');
 assert.equal(L.formatDuration('bad',start),null);
 assert.equal(L.formatDuration(start,start-1),null);
});
test('period transitions and immutability',()=>{
 const snapshot=JSON.stringify(period);
 assert.equal(L.computePeriodState(period,Date.parse(period.start)-1).status,'尚未开始');
 assert.equal(L.computePeriodState(period,Date.parse(period.start)).status,'有效期内');
 assert.equal(L.computePeriodState(period,Date.parse(period.end)-72*3600000).status,'即将到期');
 assert.equal(L.computePeriodState(period,Date.parse(period.end)).status,'本期已到期');
 assert.equal(L.computePeriodState(period,Date.parse(period.end)+1).progress,100);
 assert.equal(JSON.stringify(period),snapshot);
});
test('catalog title with student-data fallback',()=>{
 assert.equal(L.getCourseTitle({id:'x',title:'legacy'},{courses:{x:{title:'catalog'}}}),'catalog');
 assert.equal(L.getCourseTitle({id:'x',title:'legacy'},{courses:{}}),'legacy');
});


test('ICS UTC event, 30-minute duration, alarms and stable UID',()=>{
 const options={studentName:'Test',period,now};
 const ics=L.buildIcs(options), unfolded=ics.replace(/\r\n[ \t]/g,'');
 assert.ok(unfolded.includes('DTSTART:20261027T080700Z'));
 assert.ok(unfolded.includes('DTEND:20261027T083700Z'));
 for (const line of ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:','DTSTAMP:','SUMMARY:学习有效期截止','TRIGGER:-P3D','TRIGGER:-P1D','END:VEVENT','END:VCALENDAR']) assert.ok(unfolded.includes(line),line);
 const uid=text=>text.replace(/\r\n[ \t]/g,'').match(/UID:([^\r]+)\r\n/)[1];
 assert.equal(uid(ics),uid(L.buildIcs({...options,now:now+10000})));
 assert.notEqual(uid(ics),uid(L.buildIcs({...options,period:{...period,id:'other'}})));
 assert.notEqual(uid(ics),uid(L.buildIcs({...options,studentName:'Other'})));
 assert.throws(()=>L.buildIcs({...options,period:{start:null,end:null}}));
});
test('ICS escaping and UTF-8 75-byte folding',()=>{
 const name='中文姓名;逗号,反斜杠\\换行\n'+ '很长的中文名字😀'.repeat(20);
 const ics=L.buildIcs({studentName:name,period,now});
 assert.equal(ics.replace(/\r\n/g,'').includes('\n'),false);
 const lines=ics.split('\r\n');
 for(const line of lines) {assert.ok(Buffer.byteLength(line,'utf8')<=75);assert.equal(Buffer.from(line,'utf8').toString('utf8'),line);assert.ok(!line.includes('�'));}
 assert.ok(lines.some(line=>line.startsWith(' ')));
 const unfolded=ics.replace(/\r\n[ \t]/g,'');
 const escaped=name.replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
 assert.ok(unfolded.includes(`DESCRIPTION:${escaped} 的学习有效期于北京时间 2026.10.27 16:07 截止\r\n`));
 assert.ok(ics.endsWith('\r\n'));
});
console.log(`PASS ${count} groups`);
test('paid pending enrollment is not active and formal enrollment title is optional',()=>{
 const pending={id:'chord-theory',status:'pending',paymentStatus:'paid',accessEnabled:false};
 assert.equal(L.computeLearningStatus([{status:'completed'},pending],null,now),'尚未开始');
 const catalog={courses:{ear:{title:'音程听力训练'}}};
 assert.equal(L.getCourseTitle({id:'ear',title:'旧名称'},catalog),'音程听力训练');
 assert.equal(L.getCourseTitle({id:'ear',title:'旧名称',enrollmentTitle:'音程听力训练课'},catalog),'音程听力训练课');
});
