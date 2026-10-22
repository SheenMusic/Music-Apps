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
assert.equal(L.formatLessonMinutes(212),'3小时32分钟');assert.equal(L.formatLessonMinutes(388),'6小时28分钟');
assert.equal(L.formatLessonMinutes(0),'0分钟');assert.equal(L.formatLessonMinutes(600),'10小时');
const change=fields=>({...pack,lessonPackage:{...pack.lessonPackage,...fields}});
assert.equal(L.summarizePrivateLesson(change({sessions:[]})).remainingMinutes,600);
assert.equal(L.summarizePrivateLesson(change({purchasedMinutes:212})).remainingMinutes,0);
assert.equal(L.summarizePrivateLesson(change({purchasedMinutes:200})).remainingMinutes,-12);
assert.equal(L.formatLessonMinutes(-12),'超用 12分钟');
for(const invalid of [
 change({purchasedMinutes:0}),change({purchasedMinutes:1.5}),change({start:'2026-10-06T15:00:00'}),change({end:pack.lessonPackage.start}),
 change({sessions:[pack.lessonPackage.sessions[0],pack.lessonPackage.sessions[0]]}),
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

// Confirmed duration without invented timestamps. Deduct each meeting after rounding.
const arun={...pack,lessonPackage:{purchasedMinutes:600,start:'2026-10-22T00:00:00+08:00',end:'2027-01-22T00:00:00+08:00',sessions:[{id:'one',date:'2026-10-22',durationSeconds:4644,title:'课程',content:['内容']}]}};
const arunBefore=JSON.stringify(arun), arunSum=L.summarizePrivateLesson(arun);
assert.deepEqual([arunSum.purchasedMinutes,arunSum.usedMinutes,arunSum.remainingMinutes],[600,77,523]);
assert.equal(JSON.stringify(arun),arunBefore);
assert.equal('start' in arunSum.sessions[0],false);
const secondsCourse=seconds=>({...arun,lessonPackage:{...arun.lessonPackage,sessions:[{id:'round',date:'2026-10-22',durationSeconds:seconds}]}});
for(const [seconds,minutes] of [[20,0],[29,0],[30,1],[59,1],[3599,60],[4644,77],[4650,78],[7231,121]]) assert.equal(L.summarizePrivateLesson(secondsCourse(seconds)).usedMinutes,minutes);
const exactSeconds={...arun,lessonPackage:{...arun.lessonPackage,sessions:[{id:'exact',start:'2026-10-22T10:00:00+08:00',end:'2026-10-22T11:17:24+08:00'}]}};
assert.equal(L.summarizePrivateLesson(exactSeconds).usedMinutes,77);
for(const entry of [
 {id:'bad',date:'2026-10-22',durationSeconds:-1},
 {id:'bad',date:'2026-10-22',durationSeconds:1.5},
 {id:'bad',date:'2026-02-30',durationSeconds:60},
 {id:'bad',date:'2027-01-22',durationSeconds:60},
 {id:'bad',date:'2026-10-21',durationSeconds:60},
 {id:'bad',date:'2026-10-22',durationSeconds:60,start:'2026-10-22T10:00:00+08:00',end:'2026-10-22T11:00:00+08:00'},
 {id:'bad',date:'2026-10-22',durationSeconds:60,content:'not an array'}
]) assert.equal(L.validatePrivateLesson({...arun,lessonPackage:{...arun.lessonPackage,sessions:[entry]}}).valid,false);
assert.equal(L.computeStudentStatus({courses:[arun],learningPeriods:[]},'2026-10-21T15:59:59Z'),'尚未开始');
assert.equal(L.computeStudentStatus({courses:[arun],learningPeriods:[]},'2026-10-21T16:00:00Z'),'学习中');
assert.equal(L.computeStudentStatus({courses:[arun],learningPeriods:[]},'2027-01-21T16:00:00Z'),'已过期');
console.log('PASS confirmed-duration sessions, per-meeting minute rounding, no invented times, package boundaries and unchanged legacy balances.');

// Each lesson is rounded independently, not after summing raw seconds.
for(const [seconds,minutes] of [[3569,59],[3570,60],[3620,60],[3629,60],[3630,61],[3635,61],[4644,77]]) {
 assert.equal(L.roundLessonSeconds(seconds),minutes);
 assert.equal(L.calculateSessionMinutes({durationSeconds:seconds}),minutes);
}
const individuallyRounded={...arun,lessonPackage:{...arun.lessonPackage,sessions:[
 {id:'a',date:'2026-10-22',durationSeconds:3570},
 {id:'b',date:'2026-10-23',durationSeconds:3570}
]}};
assert.equal(L.summarizePrivateLesson(individuallyRounded).usedMinutes,120);
assert.equal(Math.round((3570+3570)/60),119);
for(const [minutes,label] of [[45,'45分钟'],[60,'1小时'],[77,'1小时17分钟'],[120,'2小时'],[523,'8小时43分钟']])assert.equal(L.formatLessonMinutes(minutes),label);
const confirmed={id:'confirmed',start:'2026-10-22T10:00:00+08:00',end:'2026-10-22T11:00:35+08:00',billedMinutes:60};
const retained=JSON.stringify(confirmed);
assert.equal(L.calculateSessionMinutes(confirmed),60);
assert.equal(JSON.stringify(confirmed),retained);
const oldConfirmed={...confirmed};delete oldConfirmed.billedMinutes;oldConfirmed.durationMinutes=59;
assert.equal(L.calculateSessionMinutes(oldConfirmed),59);
assert.equal(L.summarizePrivateLesson({...arun,lessonPackage:{...arun.lessonPackage,sessions:[confirmed]}}).remainingMinutes,540);
assert.equal(L.calculateSessionMinutes({date:'2026-10-22',billedMinutes:77}),77);
assert.equal(L.validatePrivateLesson({...arun,lessonPackage:{...arun.lessonPackage,sessions:[{id:'minutes',date:'2026-10-22',billedMinutes:77}]}}).valid,true);
assert.throws(()=>L.calculateSessionMinutes({billedMinutes:77,durationMinutes:77}),RangeError);
assert.throws(()=>L.calculateSessionMinutes({billedMinutes:1.5}),RangeError);
assert.throws(()=>L.calculateSessionMinutes({durationSeconds:60,start:confirmed.start,end:confirmed.end}),RangeError);
console.log('PASS minute thresholds, independent rounding, confirmed historical billing precedence, raw timestamp preservation and compact duration formatting.');

assert.throws(()=>L.calculateSessionMinutes({billedMinutes:null,durationSeconds:4644}),RangeError);
