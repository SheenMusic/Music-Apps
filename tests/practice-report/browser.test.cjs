const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium} = require('playwright');
const {serve, installMocks} = require('../course-baseline/harness.cjs');
const fixtures = require('./courses.json');
const selected = fixtures.filter(f => !process.env.REPORT_COURSES || process.env.REPORT_COURSES.split(',').includes(f.code));
test('course adapters, actual clipboard, resources and loading order', async t => {
  const server = await serve();
  const browser = await chromium.launch({executablePath:process.env.COURSE_CHROMIUM || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  try {
    for (const f of selected) await t.test(f.code, async () => {
      const page = await browser.newPage();
      const errors = [], missing = [], loaded = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', r => {if (r.url().startsWith(server.url) && r.status() >= 400) missing.push(r.url()); if (r.url().endsWith('/assets/practice-report.js')) loaded.push(r.status());});
      // Exercise dependencies are isolated; notation uses its existing CDN-failure fallback.
      await page.route('**/*', r => r.request().url().startsWith(server.url) ? r.continue() : r.fulfill({status:200,body:'',contentType:'application/javascript'}));
      await page.addInitScript(installMocks);
      await page.goto(server.url + '/' + f.path);
      assert.equal(await page.evaluate(() => typeof window.PracticeReport.generate), 'function');
      if (f.type === 'mt') {
        await page.locator('#startPracticeBtn').evaluate(b => b.click());
        const questions = await page.evaluate(() => practiceData.questions);
        assert.equal(questions.length, f.count);
        await page.evaluate(() => window.__clock += 123000);
        for (let i=0; i<questions.length; i++) {
          const q = questions[i];
          if (i === 2) {
            await page.locator('#optionsGrid .option-btn').evaluateAll((buttons, answers) => buttons.find(b => !answers.includes(b.dataset.value)).click(), q.correctAnswer);
            await page.locator('#confirmBtn').evaluate(b => b.click());
          }
          await page.locator('#optionsGrid .option-btn').evaluateAll((buttons, answers) => {for (const b of buttons) if (answers.includes(b.dataset.value)) b.click();}, q.correctAnswer);
          await page.locator('#confirmBtn').evaluate(b => b.click());
          await page.locator('#nextBtn').evaluate(b => b.click());
        }
        const before = await page.locator('#historyList').innerHTML();
        await page.locator('#copyResultBtn').evaluate(b => b.click());
        assert.equal(await page.locator('#historyList').innerHTML(), before);
        assert.equal(await page.locator('#resTotalTime').textContent(), '02分03秒');
      } else if (f.type === 'listening') {
        await page.evaluate(f => {
          testResults = f.records;
          score = 17;
          testStart = performance.now() - 135000;
          if (f.code === 'ET01') showResult(); else result();
        }, f);
        await page.locator('#copy').evaluate(b => b.click());
      } else {
        await page.evaluate(f => {
          questionHistory = f.records;
          consecutivePassCount = 10;
          practiceStartTime = Date.now() - 60000;
          if (f.code === 'ET04') {
            document.getElementById('voicePartSelect').value = 'tenor';
            document.getElementById('exerciseSelect').value = 'high_down';
          } else {
            document.getElementById('minNoteSelect').value = '48';
            document.getElementById('maxNoteSelect').value = '72';
            const select = document.getElementById('exerciseSelect');
            if (select) select.selectedIndex = 0;
          }
          finishPractice();
        }, f);
        const before = await page.evaluate(() => JSON.stringify(questionHistory));
        await page.evaluate(() => copyReport());
        assert.equal(await page.evaluate(() => JSON.stringify(questionHistory)), before);
        assert.equal(await page.locator('#reportTableBody tr').count(), 10);
      }
      assert.equal(await page.evaluate(() => window.__audio.clipboard), f.expected);
      assert.deepEqual(loaded, [200]); assert.deepEqual(missing, []); assert.deepEqual(errors, []);
      await page.close();
    });
  } finally {await browser.close(); await server.close();}
});
