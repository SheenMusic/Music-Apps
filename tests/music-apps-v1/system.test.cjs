const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), cp = require('node:child_process');
const {chromium} = require('playwright');
const {serve} = require('../course-baseline/harness.cjs');
const baseline = require('./baseline.json');
const protection = require('../header-footer/protection.cjs');
const courses = baseline.courses.filter(c => !process.env.MT_COURSES || process.env.MT_COURSES.split(',').includes(c.code));
const out = process.env.MT_V1_ARTIFACT_DIR || '/tmp/music-apps-v1';
const old = p => cp.execFileSync('git',['show',baseline.commit+':'+p],{encoding:'utf8'});
function data(course) {
 const ctx=vm.createContext({window:{}});vm.runInContext(fs.readFileSync(course.path.replace('index.html','questions.js'),'utf8'),ctx);return JSON.parse(JSON.stringify(ctx.window.practiceData));
}
function createEngine(d) {
 let clock=1000000;
 const ctx=vm.createContext({window:{}});
 vm.runInContext(fs.readFileSync('MT-Intervals/shared/utils/format-time.js','utf8'),ctx);
 vm.runInContext(fs.readFileSync('shared/practice/practice-engine.js','utf8'),ctx);
 return {api:ctx.window.PracticeEngine.create(d,{now:()=>clock}),tick:s=>clock+=s*1000,status:ctx.window.PracticeEngine.questionStatus};
}
test('90 teaching questions, order, notation and full course data remain byte-equivalent after JSON parsing',()=>{
 assert.equal(baseline.courses.reduce((n,c)=>n+c.count,0),90);
 for(const c of courses){const before=JSON.parse(old(c.originalPath).match(/const practiceData = (\{[\s\S]*?\n\});/)[1]),now=data(c);
  for(const k of Object.keys(before))assert.deepEqual(now[k],before[k],c.code+' '+k);
  assert.equal(now.questions.length,c.count);
 }
});
test('shared engine: attempts/review/progress, clock, readonly result navigation, immutable history and restart',()=>{
 for(const c of courses){const d=data(c),{api,tick,status}=createEngine(d);api.start();
  assert.equal(api.finish(),false);
  const q=d.questions[0],wrong=q.options.find(o=>!q.correctAnswer.includes(o.value));
  tick(3);assert.equal(api.submit([wrong.value]),false);assert.equal(status(api.state().stats[0]),'attempted');
  tick(2);api.goTo(1);tick(4);api.goTo(0);assert.equal(api.state().stats[0].timeSpent,5);
  tick(1);assert.equal(api.submit(q.correctAnswer),true);assert.equal(status(api.state().stats[0]),'needs-review');assert.equal(api.state().solved,1);
  assert.equal(api.submit(q.correctAnswer),null);
  api.goTo(1);
  for(let i=1;i<d.questions.length;i++){tick(2);assert.equal(api.submit(d.questions[i].correctAnswer),true);api.next();}
  const result=JSON.parse(JSON.stringify(api.state()));assert.equal(result.mode,'result');assert.equal(result.solved,c.count);assert.equal(result.history.length,1);
  assert.equal(result.accuracy,(c.count/(c.count+1)*100).toFixed(1));assert.equal(result.stats[0].timeSpent,6);
  assert.equal(result.totalAttempts,c.count+1);
  for(let i=0;i<c.count;i++){api.review(i);tick(50);assert.equal(api.submit(d.questions[i].correctAnswer),null);api.goTo(Math.max(0,i-1));api.backToResults();assert.deepEqual({...JSON.parse(JSON.stringify(api.state())),index:result.index},result);}
  assert.equal(api.finish(),false);api.reset();assert.equal(api.state().history.length,1);api.start();assert.equal(api.state().totalAttempts,0);
 }
});
async function open(browser,url,c,opts={}) {
 const context=await browser.newContext({viewport:opts.viewport||{width:1280,height:900},colorScheme:opts.theme||'light',reducedMotion:'reduce'});
 await context.addInitScript(()=>{window.__copy='';window.__alerts=[];window.alert=s=>__alerts.push(s);window.confirm=()=>true;Object.defineProperty(navigator,'clipboard',{value:{writeText:async s=>{window.__copy=s;}}});});
 await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname==='cdn.jsdelivr.net')return r.fulfill({path:'/tmp/vexflow.js',contentType:'application/javascript'});if(u.origin!==url)return r.fulfill({body:'',contentType:'application/javascript'});return r.continue();});
 const page=await context.newPage(),errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(url)&&r.status()>=400)missing.push(r.url());});
 await page.goto(url+'/'+c.path);if(!opts.entry)await page.waitForSelector('#startPracticeBtn');
 return {context,page,errors,missing};
}
async function select(page,values){for(const v of values)await page.locator('#optionsGrid button').evaluateAll((buttons,v)=>buttons.find(b=>b.dataset.value===v).click(),v);await page.locator('#confirmBtn').click();}
async function noOverflow(page){const dims=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert(dims.scroll<=dims.width+1,JSON.stringify(dims));}
test('real Chromium: every question/type, wrong retry, jump/back, result review, report snapshot, history and restart',async t=>{
 const server=await serve(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});fs.mkdirSync(out,{recursive:true});
 try{for(const c of courses)await t.test(c.code,async()=>{
  const {page,context,errors,missing}=await open(browser,server.url,c),d=data(c);
  // Only clock is controlled, real Chromium DOM/notation/animation layout remains live.
  await page.evaluate(()=>{window.__now=1000000;Date.now=()=>window.__now;});
  await page.locator('#startPracticeBtn').click();await page.locator('#questionNavToggle').click();
  const wrong=d.questions[0].options.find(o=>!d.questions[0].correctAnswer.includes(o.value)).value;
  await select(page,[wrong]);await assert.equal(await page.locator('#questionNav button').first().getAttribute('class'),'question-nav-btn attempted current');
  await page.locator('#questionNav button').nth(1).click();await page.locator('#prevBtn').click();
  for(let i=0;i<c.count;i++){
   assert.equal(await page.locator('#questionPrompt').textContent(),d.questions[i].prompt);
   assert.deepEqual(await page.locator('#optionsGrid button > span:first-child').allTextContents(),d.questions[i].options.map(o=>o.label));
   assert(await page.locator('#confirmBtn').isDisabled());
   if(d.questions[i].staff){await page.waitForSelector('#staffQuestion svg .vf-stavenote');assert.equal(await page.locator('#staffQuestion .vf-stavenote').count(),d.questions[i].staff.notes.length);}
   await select(page,d.questions[i].correctAnswer);
   assert.equal(await page.locator('#explanationText').textContent(),d.questions[i].explanation);
   if(i===0)assert((await page.locator('#questionNav button').first().getAttribute('class')).includes('needs-review'));
   await page.locator('#nextBtn').click();
  }
  assert(await page.locator('#resultScreen').isVisible());
  assert.equal(await page.locator('#progressBar').evaluate(e=>e.style.width),'100%');
  assert.equal(await page.locator('#resAccuracy').textContent(),(c.count/(c.count+1)*100).toFixed(1)+'%');
  assert.equal(await page.locator('#detailList .detail-item').count(),c.count);
  await page.locator('#copyResultBtn').click();

  const expected=`【${c.code} · ${c.title}】\n\n完成：${c.count}/${c.count}题 · 用时：0分00秒\n准确率：${(c.count/(c.count+1)*100).toFixed(1)}% · 一次通过：${c.count-1}题\n\n需要关注：01\n\n© Sheen · Music Theory`;
  assert.equal(await page.evaluate(()=>__copy),expected);
  const before=await page.locator('#resultScreen').textContent();
  for(let i=0;i<c.count;i++){
   await page.locator('#resultQuestionNav button').nth(i).click();assert.equal(await page.locator('#questionPrompt').textContent(),d.questions[i].prompt);
   assert(await page.locator('#confirmBtn').isHidden());assert(await page.locator('#optionsGrid button').first().isDisabled());
   await page.locator('#backToResultBtn').click();assert.equal(await page.locator('#resultScreen').textContent(),before);
  }
  await page.locator('#historyToggleBtn').click();assert.equal(await page.locator('.history-card-item').count(),1);
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'historyToggleBtn');
  await page.screenshot({path:path.join(out,c.code+'-result.png'),fullPage:true});
  await page.locator('#restartBtn').click();await page.locator('#startPracticeBtn').click();assert.equal(await page.locator('#progressBar').evaluate(e=>e.style.width),'0%');
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);await context.close();
 });}finally{await browser.close();await server.close();}
});
test('real Chromium responsive: five courses, five sizes, Light/Dark, question/result/history states',async t=>{
 const server=await serve(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});fs.mkdirSync(out,{recursive:true});
 try{for(const c of courses)for(const [w,h]of [[390,844],[844,390],[768,1024],[1024,768],[1280,900]])for(const theme of ['light','dark'])await t.test(`${c.code}-${w}x${h}-${theme}`,async()=>{
  const {page,context,errors,missing}=await open(browser,server.url,c,{viewport:{width:w,height:h},theme});
  await noOverflow(page);await page.locator('#startPracticeBtn').click();await page.locator('#questionNavToggle').click();
  // Visit all notation questions in every viewport; no minimum-width SVG clipping.
  for(const [i,q]of data(c).questions.entries())if(q.staff){await page.locator('#questionNav button').nth(i).click();await page.waitForSelector('#staffQuestion .vf-stavenote');await noOverflow(page);}
  await noOverflow(page);await page.screenshot({path:path.join(out,`${c.code}-${w}-${theme}.png`),fullPage:true});
  await page.evaluate(() => {
    // Real rendered buttons exercise the complete UI/engine contract in each size.
    document.getElementById('questionNav').querySelector('button').click();
    for (const q of practiceData.questions) {
      for (const b of document.querySelectorAll('#optionsGrid button')) if(q.correctAnswer.includes(b.dataset.value)) b.click();
      document.getElementById('confirmBtn').click(); document.getElementById('nextBtn').click();
    }
  });
  assert(await page.locator('#resultScreen').isVisible());await noOverflow(page);
  await page.screenshot({path:path.join(out,`${c.code}-${w}-${theme}-result.png`),fullPage:true});
  await page.locator('#historyToggleBtn').click();await noOverflow(page);
  const r=await page.locator('.modal-card').boundingBox();assert(r.y>=0&&r.y+r.height<=h+1);await page.locator('#closeHistoryBtn').click();
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);await context.close();
 });}finally{await browser.close();await server.close();}
});
test('shared notation supports clefs, one note/interval/chord, accidentals and global initial barline policy',async()=>{
 const server=await serve(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{const {page,context}=await open(browser,server.url,courses[0]);await page.locator('#startPracticeBtn').click();
 for(const clef of ['treble','bass'])for(const notes of [['C4'],['C4','F#4'],[['C4','Eb4','G4','Bb4']]]){
  const count=await page.evaluate(({clef,notes})=>{const host=document.createElement('div');host.style.width='300px';document.body.append(host);const result=NotationRenderer.render(host,{clef,notes});const info={count:result.notes.length,bar:result.stave.getModifiers()[0].getType(),lines:result.stave.getNumLines()};host.remove();return info;},{clef,notes});
  assert.equal(count.count,notes.length);assert.equal(count.bar,7);assert.equal(count.lines,5);
 }
 const bar=await page.evaluate(()=>{const old=NotationConfig.showInitialBarline;NotationConfig.showInitialBarline=true;const bar=NotationRenderer.createStave(0,0,200).getModifiers()[0].getType();NotationConfig.showInitialBarline=old;return bar;});assert.equal(bar,1);
 await context.close();}finally{await browser.close();await server.close();}
});
test('production scope: student/teacher data, ET, MT06, business scripts and report/time tools unchanged',()=>{
 const changed=cp.execFileSync('git',['diff','--name-only','--no-renames',baseline.commit],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 for(const file of changed){
  const allowed=/^MT-Intervals\/lesson0[1-5][^/]*\//.test(file)||file==='MT-Intervals/shared/styles/practice-base.css'||file==='learning-resources/interval-theory.js'||file.startsWith('tests/')||file.startsWith('shared/')||file==='docs/course-design-system.md'||file==='docs/music-apps-v1.md';
  assert(allowed||protection.allowed.has(file),'Out of scope: '+file);
 }
 for(const file of ['assets/practice-report.js','MT-Intervals/shared/utils/format-time.js','MT-Intervals/shared/learning/theory-lesson.js','MT-Intervals/shared/styles/learning-base.css','MT-Intervals/shared/styles/learning-components.css'])assert.equal(fs.readFileSync(file,'utf8'),old(file),file);
 const before=old('learning-resources/interval-theory.js'),after=fs.readFileSync('learning-resources/interval-theory.js','utf8');
 assert.equal(after,before.replace('/lesson04-x3n6cu/','/lesson04/').replace('/lesson05-s2e2f4/','/lesson05/'));
});
test('all ten Learning-home/Practice pages, local resource paths and current Teacher/Student/Catalog links resolve',async()=>{
 const server=await serve(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const c of courses)for(const suffix of ['index.html','practice/index.html']){
   const f=c.path.replace('practice/index.html',suffix),{page,context,errors,missing}=await open(browser,server.url,{path:f},{entry:true});
   const urls=await page.locator('a[href],script[src],link[href]').evaluateAll(es=>es.map(e=>e.href||e.src).filter(u=>new URL(u).origin===location.origin));
   for(const u of urls){let p=decodeURIComponent(new URL(u).pathname).slice(1);if(p.endsWith('/'))p+='index.html';assert(fs.existsSync(p),f+' -> '+p);}
   if(suffix==='index.html'&&Number(c.code.slice(-2))>=3){assert.equal(await page.locator('.home-actions > *').count(),3);assert.equal(await page.locator('.home-actions button:disabled').count(),2);}
   assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);await context.close();
  }
  const ctx=vm.createContext({});vm.runInContext(fs.readFileSync('learning-resources/interval-theory.js','utf8')+';globalThis.resources=intervalTheoryResources;',ctx);
  for(const entry of ctx.resources.lessons){const p=entry.practiceURL.slice(1)+'index.html';assert(fs.existsSync(p),p);}
  const production=cp.execFileSync('git',['ls-files'],{encoding:'utf8'}).trim().split('\n').filter(f=>/\.(html|js|json)$/.test(f)&&!f.startsWith('tests/')&&!f.startsWith('docs/')&&fs.existsSync(f));
  for(const f of production)assert(!/MT-Intervals\/lesson0(?:4-x3n6cu|5-s2e2f4)/.test(fs.readFileSync(f,'utf8')),'old active link '+f);
 }finally{await browser.close();await server.close();}
});
test('shared Practice CSS cannot alter Dashboard, Catalog, homepage or ET when inserted',async()=>{
 const server=await serve(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const file of ['teacher/index.html','students/samuel-b5def80cdaa55d42/index.html','courses/index.html','index.html','ET-Intervals/05-2nd-d7wzes/index.html'])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width:390,height:844},colorScheme:theme,reducedMotion:'reduce'});
  await context.route('**/*',r=>r.request().url().startsWith(server.url)?r.continue():r.fulfill({body:''}));
  const page=await context.newPage();await page.goto(server.url+'/'+file);
  const snapshot=()=>page.evaluate(()=>[document.documentElement,document.body,...document.body.querySelectorAll('*')].map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {tag:e.tagName,rect:[r.x,r.y,r.width,r.height],styles:[...s].filter(p=>!p.startsWith('--')).map(p=>[p,s.getPropertyValue(p)])};}));
  const before=await snapshot();await page.addStyleTag({content:fs.readFileSync('shared/styles/practice-base.css','utf8')});assert.deepEqual(await snapshot(),before,file+' '+theme);await context.close();
 }}finally{await browser.close();await server.close();}
});
test('each course/type: no partial multi-answer credit, wrong retries remain attempted until solved, state copies and invalid inputs',()=>{
 for(const c of courses)for(const type of ['boolean','single-choice','multiple-choice']){
  const d=data(c),index=d.questions.findIndex(q=>q.type===type),q=d.questions[index],{api,status}=createEngine(d);api.start();api.goTo(index);
  assert.equal(api.submit([]),null);assert.equal(api.submit(['not-an-option']),null);
  let wrong=q.options.find(o=>!q.correctAnswer.includes(o.value));
  const values=type==='multiple-choice'?q.correctAnswer.slice(0,-1):(wrong?[wrong.value]:[]);
  assert.equal(api.submit(values),false);assert.equal(api.submit(values),false);
  assert.equal(status(api.state().stats[index]),'attempted');assert.equal(api.state().solved,0);
  assert.equal(api.submit([...q.correctAnswer].reverse()),true);assert.equal(status(api.state().stats[index]),'needs-review');assert.equal(api.state().solved,1);
  const state=api.state();state.stats[index].attempts=99;assert.equal(api.state().stats[index].attempts,3);
 }
});
test('all new/changed browser JavaScript compiles without a bundler',()=>{
 const files=cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard'],{encoding:'utf8'}).trim().split('\n');
 for(const f of files.filter(f=>/^(shared\/|MT-Intervals\/lesson0[1-5])/.test(f)&&fs.existsSync(f))){
  if(f.endsWith('.js'))new vm.Script(fs.readFileSync(f,'utf8'),{filename:f});
  if(f.endsWith('.html'))for(const script of fs.readFileSync(f,'utf8').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g))if(!script[1].includes('src='))new vm.Script(script[2],{filename:f});
 }
});
