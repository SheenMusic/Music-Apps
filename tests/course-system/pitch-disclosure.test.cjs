const {test, before, after} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {chromium} = require('playwright');
const H = require('../course-baseline/harness.cjs');
const BASE = '6fccb4f8f3adf7409216dd9bfbb765f4852344b6';
const lessons = fs.readdirSync(path.join(H.ROOT, 'ET-Intervals')).filter(n => /^(0[5-9]|1[0-8])-/.test(n));
let browser, server;
before(async () => {
  server = await H.serve();
  browser = await chromium.launch({executablePath: '/usr/bin/chromium', args: ['--no-sandbox']});
});
after(async () => { await browser?.close(); await server?.close(); });

for (const lesson of lessons) test(`${lesson}: disclosure, responsive layout and original practice`, async () => {
  const file = `ET-Intervals/${lesson}/index.html`;
  const original = execFileSync('git', ['show', `${BASE}:${file}`], {cwd: H.ROOT}).toString();
  const current = fs.readFileSync(path.join(H.ROOT, file), 'utf8');
  assert.deepEqual(H.scripts(current).map(s => s.replace("    document.getElementById('pitchDetails').open = false;\n", '')), H.scripts(original), 'only disclosure reset may change inline teaching scripts');
  const construct = Number(lesson.slice(0, 2)) % 2 === 1;
  for (const width of [320, 390, 1280]) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({viewport: {width, height: 900}, colorScheme: theme, reducedMotion: 'reduce'});
    await context.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
    await context.addInitScript(H.installMocks);
    const page = await context.newPage(), errors = [], bad = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => {if (r.status() >= 400) bad.push(r.url());});
    try {
      await page.goto(`${server.url}/${file}`);
      const details = page.locator('#pitchDetails'), arrow = details.locator('summary'), button = page.locator('#toneBtn');
      assert.equal(await details.getAttribute('open'), null);
      assert.equal(await arrow.innerText(), '');
      assert.equal(await arrow.isVisible(), true);
      assert.equal(await page.locator('.target-note').first().isVisible(), false);
      assert.equal(await page.locator('#intervalText').isVisible(), construct);
      assert.equal(await button.evaluate(e => getComputedStyle(e).borderRadius), construct ? '999px' : '0px');
      const collapsedHeight = await page.locator('.pitch-disclosure').evaluate(e => e.getBoundingClientRect().height);
      if (!construct) assert.ok(collapsedHeight < 90, 'no empty information area');
      await button.click();
      const state = () => page.evaluate(() => ({playing: isTonePlaying, count: __audio.oscillators.length, stopped: __audio.oscillators.filter(o => o.stopped).length, notes: [...document.querySelectorAll('.target-note')].map(e => e.textContent)}));
      const playing = await state();
      assert.equal(playing.playing, true);
      await arrow.click();
      assert.deepEqual(await state(), playing, 'opening does not change question/audio');
      assert.equal(await page.locator('.target-note').first().isVisible(), true);
      assert.equal(await page.locator('#intervalText').isVisible(), true);
      assert.equal(await button.evaluate(e => getComputedStyle(e).borderRadius), '999px');
      assert.ok(await page.locator('.pitch-disclosure').evaluate(e => e.getBoundingClientRect().height) > collapsedHeight);
      await arrow.focus(); await page.keyboard.press('Enter');
      assert.equal(await details.getAttribute('open'), null);
      assert.deepEqual(await state(), playing, 'closing does not interrupt audio');
      for (const expanded of [false, true]) {
        await details.evaluate((e, open) => {e.open = open;}, expanded);
        const layout = await page.evaluate(() => {
          const a = document.querySelector('#pitchDetails summary').getBoundingClientRect(), b = document.querySelector('#toneBtn').getBoundingClientRect();
          return {overflow: document.documentElement.scrollWidth - innerWidth, arrow: [a.width, a.height], overlap: Math.min(a.right,b.right) - Math.max(a.left,b.left), clipped: document.querySelector('#toneBtn').scrollWidth > document.querySelector('#toneBtn').clientWidth};
        });
        assert.ok(layout.overflow <= 1); assert.ok(layout.arrow.every(n => n >= 44)); assert.ok(layout.overlap <= 0); assert.equal(layout.clipped, false);
      }
      if (process.env.PITCH_SCREENSHOTS && ['05', '06'].includes(lesson.slice(0, 2)) && theme === 'light') {
        fs.mkdirSync(process.env.PITCH_SCREENSHOTS, {recursive: true});
        for (const open of [false, true]) {
          await details.evaluate((e, open) => {e.open = open;}, open);
          await page.locator('.pitch-disclosure').screenshot({path: path.join(process.env.PITCH_SCREENSHOTS, `${lesson}-${width}-${open}.png`)});
        }
      }
      await page.evaluate(() => stopTargetTone());
      await page.evaluate(construct => construct ? startMic() : startMic('low'), construct);
      await H.passET(page, construct ? 'ET05' : 'ET06', 1);
      assert.equal(await page.locator('#nextBtn').isEnabled(), true);
      await details.evaluate(e => {e.open = true;});
      await page.locator('#nextBtn').click();
      assert.equal(await details.getAttribute('open'), null, 'next question folds');
      await details.evaluate(e => {e.open = true;});
      await page.reload();
      assert.equal(await details.getAttribute('open'), null, 'refresh folds');
      if (width === 1280 && theme === 'light') {
        await page.evaluate(construct => construct ? startMic() : startMic('low'), construct);
        await H.passET(page, construct ? 'ET05' : 'ET06', 10);
        assert.equal(await page.locator('#finishBtn').isEnabled(), true);
        await page.locator('#finishBtn').click();
        assert.equal(await page.locator('#reportTableBody tr').count(), 10);
        assert.equal(await page.locator('#reportCard').isVisible(), true);
      }
      assert.deepEqual(errors, []); assert.deepEqual(bad, []);
    } finally { await context.close(); }
  }
});
