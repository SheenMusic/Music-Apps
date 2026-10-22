const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const {chromium} = require('playwright');
const {serve} = require('../course-baseline/harness.cjs');
const L = require('../../students/shared/dashboard-logic.js');
const root=path.resolve(__dirname,'../..');
const read=id=>JSON.parse(vm.runInNewContext(fs.readFileSync(path.join(root,'students',id,'student-data.js'),'utf8')+';JSON.stringify(studentData)'));
const ids=fs.readdirSync(path.join(root,'students')).filter(id=>id!=='shared');
const arun='3c820ccd9a030c21dd9a0ef348d153d6';
const now=new Date('2026-10-22T04:00:00Z');
const row=(page,id)=>page.locator(`.course-row[data-course="${id}"]`);
const load=async(page,url,data)=>{
 await page.unroute('**/student-data.js?*');
 if(data)await page.route('**/student-data.js?*',r=>r.fulfill({contentType:'application/javascript',body:'const studentData = '+JSON.stringify(data)+';'}));
 await page.goto(url);
};

test('one dashboard layout, course deadlines, records, resource access and calendar',async()=>{
 const server=await serve(),browser=await chromium.launch({executablePath:process.env.COURSE_CHROMIUM || '/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const viewport of [{width:390,height:844},{width:820,height:1180},{width:1180,height:820},{width:1440,height:900}]){
   for(const colorScheme of ['light','dark'])for(const timezoneId of ['Asia/Shanghai','America/Los_Angeles']){
    const page=await browser.newPage({viewport,colorScheme,timezoneId,reducedMotion:'reduce'}),errors=[],missing=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push(r.url())});await page.clock.install({time:now});
    for(const id of ids){
     const data=read(id);await page.goto(`${server.url}/students/${id}/index.html`);
     assert.equal(await page.locator('h1').textContent(),'Learning Dashboard');
     assert.equal(await page.locator('#studentName').textContent(),data.studentName);
     // Match the typography before the unified-layout change, at every viewport.
     assert.deepEqual(await page.locator('.dashboard-label').evaluate(e=>{
       const s=getComputedStyle(e);return [s.fontSize,s.fontWeight,s.letterSpacing];
     }),['12px','400','0.6px']);
     const nameStyle=await page.locator('#studentName').evaluate(e=>{const s=getComputedStyle(e);return {size:parseFloat(s.fontSize),weight:s.fontWeight,line:parseFloat(s.lineHeight)};});
     const originalSize=Math.max(40,Math.min(64,viewport.width*.06));
     assert.ok(Math.abs(nameStyle.size-originalSize)<.02);assert.equal(nameStyle.weight,'700');assert.ok(Math.abs(nameStyle.line-originalSize*1.25)<.03);
     assert.ok(await page.locator('#learningStatus').isVisible());
     assert.equal(await page.locator('#learningHeading').textContent(),'学习进度与课程资料');
     assert.equal(await page.locator('#progressHeading').textContent(),'学习进度');
     assert.equal(await page.locator('.course-row').count(),data.courses.length);
     assert.equal(await page.locator('.period-panel,.private-ledger,.private-course-records,.learning-focus,.private-lesson-panel').count(),0);
     const statusBox=await page.locator('#learningStatus').boundingBox(),nameBox=await page.locator('#studentName').boundingBox();assert.ok(statusBox.y<nameBox.y);
     for(const course of data.courses){
      const item=row(page,course.id),label=await item.locator('.course-title').textContent();
      assert.equal(label,course.type==='private-lesson'?'一对一课':await page.evaluate(c=>DashboardLogic.getCourseTitle(c,courseCatalog),course));
      if(course.status==='completed')assert.ok(!(await item.locator('.course-deadline').isVisible()));
      if(course.type==='private-lesson'){
       assert.ok(!(await item.locator('.course-resources').isVisible()));
       const toggle=item.locator('.course-toggle');assert.equal(await toggle.textContent(),'当前进度');await toggle.click();
       assert.equal(await item.locator('.session-row').count(),course.lessonPackage.sessions.length);
       assert.equal(await item.locator('.record-notes:visible').count(),0);
       if(id==='2a4cce9a2401e10eab7d346241deec9a')assert.equal(await item.locator('.course-balance').textContent(),'剩余 6小时28分钟');
       if(id===arun){
        assert.equal(await item.locator('.course-balance').textContent(),'剩余 8小时43分钟');
        assert.equal(await item.locator('.course-deadline>span').first().textContent(),'有效期至 2027.01.22 00:00');
        await item.locator('.record-toggle').click();assert.equal(await item.locator('.record-notes h5').count(),2);
        assert.equal(await item.locator('.record-notes:visible').count(),1);
        assert.deepEqual(await item.locator('.record-notes h5').allTextContents(),['本次主题','课后任务']);
        assert.deepEqual(await item.locator('.record-notes li').allTextContents(),[
          '视频视觉升级｜动态乐谱｜Sibelius与AI制谱｜乐理学习规划',
          '视频制作（优先）：准备Sibelius；梳理视频视觉需求，借助AI探索制作方案并整理问题。',
          '乐理自评（中期）：借助AI了解乐理知识体系，诊断自身薄弱环节，形成初步学习计划并反馈。'
        ]);
        const original=page.url();assert.equal(page.url(),original);assert.equal(page.context().pages().length,1);
       }
       await item.locator('.resource-collapse').click();assert.equal(await toggle.getAttribute('aria-expanded'),'false');
       assert.ok(await toggle.evaluate(e=>document.activeElement===e));
       await toggle.press('Enter');assert.equal(await item.locator('.record-notes:visible').count(),0);await toggle.press('Enter');
      }else if(course.accessEnabled && course.accessibleLessons?.length){
       const toggle=item.locator('.course-toggle');await toggle.click();assert.equal(await item.locator('[data-lesson]').count(),course.accessibleLessons.length);
       assert.equal(await item.locator('[data-resource]').count(),course.accessibleSupplementary?.length||0);
       await item.locator('.resource-collapse').click();assert.equal(await toggle.getAttribute('aria-expanded'),'false');
      }
     }
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    }
    assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);await page.close();
   }
  }
  // The public virtual account itself is a reusable mixed-course fixture.
  const fixturePage=await browser.newPage({viewport:{width:390,height:844}});await fixturePage.clock.install({time:now});
  await fixturePage.goto(`${server.url}/students/d1d8e0bc370afd6ebfea47a334a1eb4e/index.html`);
  const virtualData=read('d1d8e0bc370afd6ebfea47a334a1eb4e');
  assert.deepEqual(await fixturePage.locator('.course-status').allTextContents(),virtualData.courses.map(c=>L.computeCourseStatus(virtualData,c,now)));
  assert.equal(await fixturePage.locator('#learningStatus').textContent(),L.computeStudentStatus(virtualData,now));
  const virtualPeriods=virtualData.courses.filter(c=>c.status!=='completed').map(c=>L.resolveCoursePeriod(virtualData,c,now).period).filter(Boolean);
  assert.equal(await fixturePage.locator('.course-deadline:visible').count(),virtualPeriods.length);
  assert.equal(await fixturePage.locator('.calendar-button:visible').count(),virtualPeriods.filter(p=>Date.parse(p.end)>now.getTime()).length);
  const virtualPrivate=row(fixturePage,'private-lesson-example');
  const virtualSummary=L.summarizePrivateLesson(virtualData.courses.find(c=>c.type==='private-lesson'));
  assert.equal(await virtualPrivate.locator('.course-balance').textContent(),'剩余 '+L.formatLessonMinutes(virtualSummary.remainingMinutes));
  await virtualPrivate.locator('.course-toggle').click();assert.equal(await virtualPrivate.locator('.session-row').count(),virtualSummary.sessions.length);
  assert.equal(await virtualPrivate.locator('.record-notes:visible').count(),0);
  await virtualPrivate.locator('.record-toggle').first().click();assert.equal(await virtualPrivate.locator('.record-notes:visible h5').count(),2);
  await fixturePage.close();
  const privateCourse=read(arun).courses[0];privateCourse.lessonPackage.sessions.push({id:'second',date:'2026-10-22',durationSeconds:3600,title:'第二次课程',homework:['任务']});
  const theory={id:'interval-theory',title:'音程理论训练',status:'completed',accessEnabled:true,accessibleLessons:[1,2,3]};
  const ear={id:'interval-ear-training',title:'音程听力训练',status:'active',accessEnabled:true,currentLessons:[6],accessibleLessons:[1,2,3,4,5,6]};
  const mixed={studentName:'混合测试',courses:[ear,privateCourse,theory],learningPeriods:[
   {id:'ear-term',courseId:ear.id,start:'2026-10-01T00:00:00+08:00',end:'2026-11-05T18:00:00+08:00'},
   {id:'theory-term',courseId:theory.id,start:'2026-09-01T00:00:00+08:00',end:'2026-10-01T16:07:00+08:00'}
  ]};
  const page=await browser.newPage({viewport:{width:390,height:844},timezoneId:'Pacific/Honolulu'});await page.clock.install({time:now});
  const url=`${server.url}/students/${arun}/index.html`;await load(page,url,mixed);
  assert.equal(await page.locator('#learningStatus').textContent(),'学习中');
  assert.deepEqual(await page.locator('.course-number').allTextContents(),['Course 01','Course 02','Course 03']);
  assert.match(await row(page,ear.id).locator('.course-deadline').innerText(),/2026.11.05 18:00/);
  assert.match(await row(page,privateCourse.id).locator('.course-deadline').innerText(),/2027.01.22 00:00/);
  assert.ok(!(await row(page,theory.id).locator('.course-deadline').isVisible()));
  await row(page,theory.id).locator('.course-toggle').click();assert.equal(await row(page,theory.id).locator('[data-lesson] a').count(),3);
  const piano=row(page,privateCourse.id);await piano.locator('.course-toggle').click();
  assert.equal(await piano.locator('.session-row').count(),2);assert.equal(await piano.locator('.record-notes:visible').count(),0);
  assert.match(await piano.locator('.session-row').first().innerText(),/第二次课程/);
  await piano.locator('.record-toggle').first().click();assert.deepEqual(await piano.locator('.record-notes:visible h5').allTextContents(),['课后任务']);
  await piano.locator('.record-toggle').last().click();assert.equal(await piano.locator('.record-notes:visible').count(),2);
  assert.equal(await piano.locator('details').count(),0);assert.equal(await piano.locator('.course-balance').textContent(),'剩余 7小时43分钟');
  const calendars=[];
  for(const course of [ear,privateCourse]){
   const downloadPromise=page.waitForEvent('download');await row(page,course.id).locator('.calendar-button').click();const download=await downloadPromise;calendars.push(fs.readFileSync(await download.path(),'utf8'));
  }
  assert.match(calendars[0],/DTSTART:20261105T100000Z/);assert.match(calendars[1],/DTSTART:20270121T160000Z/);
  assert.notEqual(calendars[0].match(/UID:([^\r]+)/)[1],calendars[1].match(/UID:([^\r]+)/)[1]);
  mixed.learningPeriods[0].end='2026-10-21T18:00:00+08:00';await load(page,url,mixed);
  assert.equal(await page.locator('#learningStatus').textContent(),'学习中');
  assert.equal(await row(page,ear.id).locator('.course-status').textContent(),'已过期');
  assert.ok(!(await row(page,ear.id).locator('.calendar-button').isVisible()));
  await row(page,ear.id).locator('.course-toggle').click();assert.equal(await row(page,ear.id).locator('[data-lesson]').count(),6);
  for(const course of mixed.courses)course.status='completed';await load(page,url,mixed);
  assert.equal(await page.locator('#learningStatus').textContent(),'已完成');assert.equal(await page.locator('.course-deadline:visible').count(),0);
  const ambiguous={studentName:'多课测试',courses:[{...ear,status:'active'},{...theory,status:'active'}],learningPeriods:[{id:'unknown-owner',start:'2026-10-01T00:00:00+08:00',end:'2026-11-05T18:00:00+08:00'}]};
  await load(page,url,ambiguous);assert.equal(await page.locator('.course-deadline:visible').count(),0);
  const empty=read(arun);empty.courses[0].lessonPackage.sessions=[];await load(page,url,empty);assert.equal(await page.locator('.course-toggle').count(),0);
  const wechat=await browser.newPage({userAgent:'MicroMessenger',viewport:{width:390,height:844}});await wechat.clock.install({time:now});await load(wechat,url,read(arun));
  assert.equal(await wechat.locator('.calendar-button:visible').count(),0);assert.equal(await wechat.locator('.calendar-notice:visible').count(),1);await wechat.close();
  await page.unroute('**/student-data.js?*');await page.goto(`${server.url}/teacher/index.html`);assert.equal(await page.locator('#studentLinks a').count(),ids.length);
  await page.close();
  for(const id of ids){
    if(id==='d1d8e0bc370afd6ebfea47a334a1eb4e')continue;
    const file=`students/${id}/student-data.js`;
    const before=JSON.parse(vm.runInNewContext(execFileSync('git',['show',`HEAD:${file}`],{cwd:root,encoding:'utf8'})+';JSON.stringify(studentData)'));
    const after=read(id);
    if(id===arun){
      // This task intentionally replaces only Arun's first-session notes.
      for(const data of [before,after])for(const key of ['topics','content','homework','advice'])delete data.courses[0].lessonPackage.sessions[0][key];
    }
    assert.deepEqual(after,before,'Other student records or billing values changed');
  }
 }finally{await browser.close();await server.close();}
});
