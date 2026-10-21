import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const L=createRequire(import.meta.url)('../students/shared/dashboard-logic.js');
const pack={id:'private-test',type:'private-lesson',title:'Private Lesson',status:'active',accessEnabled:false,lessonPackage:{purchasedMinutes:600,start:'2026-10-06T15:00:00+08:00',end:'2027-01-06T15:00:00+08:00',sessions:[
 {id:'second',start:'2026-10-19T20:03:00+08:00',end:'2026-10-19T21:43:00+08:00'},
 {id:'first',start:'2026-10-06T15:00:00+08:00',end:'2026-10-06T16:52:00+08:00'}
]}};
const before=JSON.stringify(pack), sum=L.summarizePrivateLesson(pack);
assert.equal(sum.usedMinutes,212);assert.equal(sum.remainingMinutes,388);
assert.deepEqual(sum.sessions.map(s=>[s.id,s.durationMinutes,s.remainingMinutes]),[['first',112,488],['second',100,388]]);
assert.equal(JSON.stringify(pack),before);
assert.equal(L.formatLessonMinutes(212),'3 小时 32 分钟');assert.equal(L.formatLessonMinutes(388),'6 小时 28 分钟');
assert.equal(L.formatLessonMinutes(0),'0 分钟');assert.equal(L.formatLessonMinutes(600),'10 小时');
const change=fields=>({...pack,lessonPackage:{...pack.lessonPackage,...fields}});
assert.equal(L.summarizePrivateLesson(change({sessions:[]})).remainingMinutes,600);
assert.equal(L.summarizePrivateLesson(change({purchasedMinutes:212})).remainingMinutes,0);
assert.equal(L.summarizePrivateLesson(change({purchasedMinutes:200})).remainingMinutes,-12);
assert.equal(L.formatLessonMinutes(-12),'超用 12 分钟');
for(const invalid of [
 change({purchasedMinutes:0}),change({purchasedMinutes:1.5}),change({start:'2026-10-06T15:00:00'}),change({end:pack.lessonPackage.start}),
 change({sessions:[pack.lessonPackage.sessions[0],pack.lessonPackage.sessions[0]]}),
 change({sessions:[{id:'bad',start:'2026-10-06T15:00:01+08:00',end:'2026-10-06T16:00:00+08:00'}]}),
 change({sessions:[{id:'bad',start:'2026-10-06T14:59:00+08:00',end:'2026-10-06T16:00:00+08:00'}]}),
 change({sessions:[{id:'bad',start:'2026-10-06T16:00:00+08:00',end:'2026-10-06T15:00:00+08:00'}]}),
 change({sessions:[{id:'a',start:'2026-10-06T15:00:00+08:00',end:'2026-10-06T17:00:00+08:00'},{id:'b',start:'2026-10-06T16:00:00+08:00',end:'2026-10-06T18:00:00+08:00'}]}),
 {...pack,accessEnabled:true},{...pack,accessibleSupplementary:['extra']}
]) {assert.equal(L.validatePrivateLesson(invalid).valid,false);assert.throws(()=>L.summarizePrivateLesson(invalid),RangeError);}
// Crossing midnight and explicit timezone offsets use actual elapsed time.
assert.equal(L.summarizePrivateLesson(change({sessions:[{id:'overnight',start:'2026-10-07T23:30:00+08:00',end:'2026-10-08T01:15:00+08:00'}]})).usedMinutes,105);
assert.equal(L.summarizePrivateLesson(change({sessions:[{id:'zone',start:'2026-10-06T07:00:00Z',end:'2026-10-06T16:52:00+08:00'}]})).usedMinutes,112);
const data={courses:[pack],learningPeriods:[]};
assert.equal(L.computeStudentStatus(data,'2026-10-06T14:59:00+08:00'),'尚未开始');
assert.equal(L.computeStudentStatus(data,'2026-10-06T15:00:00+08:00'),'学习中');
assert.equal(L.computeStudentStatus(data,'2027-01-06T15:00:00+08:00'),'已过期');
assert.equal(L.computeStudentStatus({...data,learningState:'paused'},'2026-10-20T00:00:00Z'),'暂停中');
const legacy={courses:[{id:'ear',status:'active'}],learningPeriods:[{start:'2026-09-01T00:00:00Z',end:'2026-10-01T00:00:00Z'}]};
assert.equal(L.computeStudentStatus(legacy,'2026-10-20T00:00:00Z'),'已过期');
assert.equal(L.computeStudentStatus({...legacy,courses:[...legacy.courses,pack]},'2026-10-20T00:00:00Z'),'学习中');
assert.equal(L.summarizePrivateLesson(pack).remainingMinutes,388); // Expiry never erases the balance.
console.log('PASS Private Lesson: minute balances, chronological records, invalid/overlapping sessions, overuse, timezones and mixed-course status.');
