const {test} = require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const H=require('./harness.cjs');
const files=['assets/course-visual.css','ET-Intervals/shared/styles/base.css','MT-Intervals/shared/styles/practice-base.css'];
const ready=files.every(f=>fs.existsSync(path.join(H.ROOT,f)));
test('Phase 1: shared CSS selectors are course-scoped; public pages and both dashboards remain visually isolated',{skip:!ready},async()=>{
  const server=await H.serve();let browser;
  try {
    browser=await chromium.launch({executablePath:process.env.COURSE_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
    for(const file of ['index.html','scores/index.html','courses/index.html','student-profile/index.html','students/samuel-b5def80cdaa55d42/index.html','students/470c56f6f65407f2cc3ce5e33be8ef2d/index.html','teacher/index.html','teacher-preview-a2cb26a15aeec932/index.html']) {
      for(const colorScheme of ['light','dark']) {
        const context=await browser.newContext({javaScriptEnabled:true,viewport:{width:1024,height:768},colorScheme,reducedMotion:'reduce'});
        await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
        const page=await context.newPage();const response=await page.goto(`${server.url}/${file}`,{waitUntil:'load'});
        assert.equal(response.status(),200,file);
        if(file.startsWith('students/')) assert.equal(await page.locator('.dashboard').count(),1,`${file}: dynamic dashboard missing`);
        const snapshot=()=>page.evaluate(()=>[document.documentElement,document.body,...document.body.querySelectorAll('*')].map(el=>{
          const s=getComputedStyle(el),r=el.getBoundingClientRect();return {tag:el.tagName,id:el.id,rect:[r.x,r.y,r.width,r.height],style:[...s].filter(p=>!p.startsWith('--')).map(p=>[p,s.getPropertyValue(p)])};
        }));
        const expected=await snapshot();
        // Run the real dashboard template scripts before checking isolation.
        // Insert synchronously so the only change being measured is the shared CSS.
        await page.evaluate(contents=>{for(const css of contents){const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);}},files.map(css=>fs.readFileSync(path.join(H.ROOT,css),'utf8')));
        assert.deepEqual(await snapshot(),expected,`${file} ${colorScheme}: shared CSS leaked`);
        const selectors=await page.evaluate(()=>{
          const result=[];const visit=rules=>{for(const rule of rules){if(rule.selectorText)result.push(rule.selectorText);else if(rule.cssRules)visit(rule.cssRules);}};
          for(const style of [...document.querySelectorAll('style')].slice(-3))visit(style.sheet.cssRules);
          return result;
        });
        assert.ok(selectors.length>0);
        for(const selector of selectors)assert.ok(selector.includes('[data-visual="ear"]')||selector.includes('[data-visual="practice"]'),`Unscoped selector: ${selector}`);
        await context.close();
      }
    }
  } finally {await browser?.close();await server.close();}
});
