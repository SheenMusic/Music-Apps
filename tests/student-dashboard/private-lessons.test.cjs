const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {chromium} = require('playwright');
const {serve} = require('../course-baseline/harness.cjs');
const student = '3c820ccd9a030c21dd9a0ef348d153d6';
const read = id => vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,`../../students/${id}/student-data.js`),'utf8')+';JSON.stringify(studentData)');

test('private lesson summary, content, disclosures, timezones and existing dashboards', async () => {
  const server=await serve();
  const browser=await chromium.launch({executablePath:process.env.COURSE_CHROMIUM || '/usr/bin/chromium',args:['--no-sandbox']});
  try {
    for (const viewport of [{width:390,height:844},{width:820,height:1180},{width:1180,height:820},{width:1440,height:900}]) {
      for (const colorScheme of ['light','dark']) for (const timezoneId of ['Asia/Shanghai','America/Los_Angeles']) {
        const page=await browser.newPage({viewport,colorScheme,timezoneId});const errors=[],missing=[];
        page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push(r.url())});
        await page.goto(`${server.url}/students/${student}/index.html`);
        assert.equal(await page.locator('#studentName').textContent(),'阿润');
        assert.equal(await page.locator('.private-balance').textContent(),'8小时43分钟');
        assert.equal(await page.locator('.private-validity dd').textContent(),'2026.10.22 — 2027.01.22');
        assert.equal(await page.locator('.private-ledger').evaluate(e=>e.open),false);
        assert.equal(await page.locator('.private-record').evaluate(e=>e.open),true);
        assert.equal(await page.locator('main > section:visible').count(),3);
        const visible=await page.locator('body').innerText();
        for(const forbidden of ['Arun','Private Lesson','523分钟','600分钟','购买总时长','尚未开始','00:00','Session History','学习进度与课程资料'])assert.ok(!visible.includes(forbidden),forbidden);
        assert.equal(visible.split('2026.10.22 — 2027.01.22').length-1,1);
        assert.equal(await page.locator('.learning-focus h3').count(),3);
        assert.equal(await page.locator('.private-record h3').count(),3);
        assert.match(await page.locator('.private-record summary').textContent(),/1小时17分钟$/);
        assert.ok(!/\d+:\d{2}:\d{2}|\d+秒/.test(await page.locator('body').innerText()));
        await page.locator('.private-ledger summary').click();
        assert.deepEqual(await page.locator('.private-ledger .session-details dd').allTextContents(),['10小时','1小时17分钟']);
        assert.equal(await page.locator('.private-ledger-list li').innerText(),'2026.10.22\n1小时17分钟');
        await page.locator('.private-ledger summary').press('Enter');
        assert.equal(await page.locator('.private-ledger').evaluate(e=>e.open),false);
        await page.locator('.private-record summary').press('Enter');
        assert.equal(await page.locator('.private-record').evaluate(e=>e.open),false);
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
        assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);await page.close();
      }
    }
    // Future sessions are appended to data, not copied into a new page or component.
    const data=JSON.parse(read(student));delete data.learningFocus;
    data.courses[0].lessonPackage.sessions.push({id:'next',date:'2026-10-22',durationSeconds:3600,title:'第二次课程',homework:['一项任务']});
    const page=await browser.newPage();
    await page.route('**/student-data.js?*',route=>route.fulfill({contentType:'application/javascript',body:'const studentData = '+JSON.stringify(data)+';'}));
    await page.goto(`${server.url}/students/${student}/index.html`);
    assert.equal(await page.locator('.private-balance').textContent(),'7小时43分钟');
    assert.equal(await page.locator('.learning-focus').count(),0);
    assert.equal(await page.locator('.private-record').count(),2);
    assert.equal(await page.locator('.private-record[open]').count(),1);
    assert.match(await page.locator('.private-record[open] summary').textContent(),/第二次课程/);
    assert.deepEqual(await page.locator('.private-record[open] h3').allTextContents(),['课后任务']);
    assert.equal(await page.locator('.private-record details').count(),0);
    await page.unroute('**/student-data.js?*');
    // Raw second-precision timestamps remain in data while confirmed billing is displayed.
    const historical=JSON.parse(read(student));
    historical.courses[0].lessonPackage.sessions=[{id:'confirmed',start:'2026-10-22T10:00:00+08:00',end:'2026-10-22T11:00:35+08:00',billedMinutes:60,title:'历史记录'}];
    await page.route('**/student-data.js?*',route=>route.fulfill({contentType:'application/javascript',body:'const studentData = '+JSON.stringify(historical)+';'}));
    await page.goto(`${server.url}/students/${student}/index.html`);
    assert.equal(await page.locator('.private-balance').textContent(),'9小时');
    assert.match(await page.locator('.private-record summary').textContent(),/1小时$/);
    await page.locator('.private-ledger summary').click();
    assert.equal(await page.locator('.private-ledger-list li span:last-child').textContent(),'1小时');
    assert.ok(!/\d+:\d{2}:\d{2}|\d+秒/.test(await page.locator('body').innerText()));
    assert.equal(await page.evaluate(()=>studentData.courses[0].lessonPackage.sessions[0].end),'2026-10-22T11:00:35+08:00');
    await page.unroute('**/student-data.js?*');
    // All existing student configurations still load through the same template.
    for(const [id,count] of [['samuel-b5def80cdaa55d42',7],['470c56f6f65407f2cc3ce5e33be8ef2d',12],['xiaoyu-d8bfbdb6f0b01b40',18],['d1d8e0bc370afd6ebfea47a334a1eb4e',7]]) {
      await page.goto(`${server.url}/students/${id}/index.html`);
      const configured=JSON.parse(read(id)).courses.filter(c=>c.accessEnabled).reduce((sum,c)=>sum+(c.accessibleLessons?.length||0),0);
      await page.locator('.course-toggle').click();
      assert.equal(await page.locator('[data-lesson]').count(),configured);
      await page.locator('.resource-collapse').click();
      assert.equal(await page.locator('.course-toggle').getAttribute('aria-expanded'),'false');
    }
    await page.goto(`${server.url}/students/2a4cce9a2401e10eab7d346241deec9a/index.html`);
    assert.equal(await page.locator('.private-balance').textContent(),'6小时28分钟');
    assert.equal(await page.locator('.learning-focus').count(),0);
    await page.locator('.private-ledger summary').click();
    assert.equal(await page.locator('.private-ledger-list li').count(),2);
    assert.deepEqual(await page.locator('.private-ledger-list li span:last-child').allTextContents(),['1小时52分钟','1小时40分钟']);
    assert.ok(!/\d+:\d{2}:\d{2}|\d+秒/.test(await page.locator('body').innerText()));
    await page.goto(`${server.url}/teacher/index.html`);
    assert.equal(await page.locator(`#studentLinks a[href="/students/${student}/"]`).textContent(),'阿润 ↗');
    await page.close();
  } finally {await browser.close();await server.close();}
});
