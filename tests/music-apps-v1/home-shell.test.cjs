const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), cp = require('node:child_process'), path = require('node:path');
const {chromium} = require('playwright');
const {serve, scripts} = require('../course-baseline/harness.cjs');
const protection = require('../header-footer/protection.cjs');
const BASE = '6d94058e24a2f7c458a78df370426b37ed956470';
const OUT = process.env.MT_SHELL_ARTIFACT_DIR || '/tmp/music-apps-mt-home-shell';
const git = file => cp.execFileSync('git',['show',BASE+':'+file]);
const sizes = [[390,844],[844,390],[768,1024],[1024,768],[1280,900]];
const cache = new Map();
const mime = {'.html':'text/html','.css':'text/css','.js':'application/javascript','.mp3':'audio/mpeg'};
async function open(browser,url,file,{before=false,width=390,height=844,theme='light'}={}) {
 const context = await browser.newContext({viewport:{width,height},colorScheme:theme,reducedMotion:'reduce'});
 await context.addInitScript(()=>{Date.now=()=>1000000;window.alert=()=>{};window.confirm=()=>true;});
 await context.route('**/*',route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='cdn.jsdelivr.net')return route.fulfill({path:'/tmp/vexflow.js',contentType:'application/javascript'});
  if(u.origin!==url)return route.fulfill({body:'',contentType:'application/javascript'});
  if(!before)return route.continue();
  const p=decodeURIComponent(u.pathname).slice(1);
  try{if(!cache.has(p))cache.set(p,git(p));return route.fulfill({body:cache.get(p),contentType:mime[path.extname(p)]||'application/octet-stream'});}catch{return route.fulfill({status:404,body:''});}
 });
 const page=await context.newPage(), errors=[], missing=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(url)&&r.status()>=400)missing.push(r.url());});
 await page.goto(url+'/'+file);await page.evaluate(()=>document.fonts.ready);
 return {page,context,errors,missing};
}
async function complete(page) {
 await page.locator('#startPracticeBtn').click();
 await page.evaluate(()=>{
  for(const q of practiceData.questions){
   for(const b of document.querySelectorAll('#optionsGrid button'))if(q.correctAnswer.includes(b.dataset.value))b.click();
   document.getElementById('confirmBtn').click();document.getElementById('nextBtn').click();
  }
 });
 assert(await page.locator('#resultScreen').isVisible());
}
function resultSnapshot() {
 const card=document.getElementById('resultScreen'),origin=card.getBoundingClientRect();
 // The outer card can grow/move with the page frame. Every internal element's
 // full computed style, order, spacing and geometry must remain identical.
 return {html:card.innerHTML,children:[...card.querySelectorAll('*')].map(e=>{
  const c=getComputedStyle(e),r=e.getBoundingClientRect();
  return {tag:e.tagName,id:e.id,rect:[r.x-origin.x,r.y-origin.y,r.width,r.height],style:[...c].filter(p=>!p.startsWith('--')).map(p=>[p,c.getPropertyValue(p)])};
 })};
}
function shell() {
 const css=selector=>{const e=document.querySelector(selector),s=getComputedStyle(e);return Object.fromEntries(['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','color','padding','borderRadius'].map(k=>[k,s[k]]));};
 const learning=!!document.querySelector('.topbar');
 const top=document.querySelector(learning?'.topbar':'.header-top-bar');
 const header=top.parentElement,bar=document.querySelector(learning?'.progress-wrap':'.progress-bar-container');
 const overlap=(a,b)=>{const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return x.right>y.left+.5&&y.right>x.left+.5&&x.bottom>y.top+.5&&y.bottom>x.top+.5;};
 const left=top.firstElementChild,right=top.lastElementChild;
 return {brand:css(learning?'.topbar-brand':'.header-title-left'),badge:css(learning?'.lesson-badge':'.header-title-right'),footer:css(learning?'.footer':'.app-footer'),
  rightGap:getComputedStyle(right).gap,topToBar:bar.getBoundingClientRect().top-top.getBoundingClientRect().bottom,
  headerGap:getComputedStyle(header).marginBottom,bodyPadding:getComputedStyle(document.body).padding,
  width:document.querySelector(learning?'.app':'.app-container').getBoundingClientRect().width,
  overlap:overlap(left,right)||[...right.children].some((e,i,a)=>i&&overlap(a[i-1],e)),
  overflow:document.documentElement.scrollWidth>innerWidth+1};
}
test('scope: engines, notation, all question files, result DOM/styles and non-target modules remain unchanged',()=>{
 const immutable=['shared/practice/practice-engine.js','shared/practice/practice-ui.js','shared/styles/practice-base.css','shared/notation/notation-config.js','shared/notation/notation-renderer.js','shared/notation/notation-styles.css','assets/practice-report.js','MT-Intervals/shared/utils/format-time.js','MT-Intervals/shared/learning/theory-lesson.js','MT-Intervals/shared/styles/learning-base.css','MT-Intervals/shared/styles/learning-components.css'];
 for(let i=1;i<=5;i++)immutable.push(`MT-Intervals/lesson0${i}/practice/questions.js`);
 for(const f of immutable)assert.equal(f==='shared/practice/practice-ui.js'?protection.practice(fs.readFileSync(f,'utf8')):fs.readFileSync(f,'utf8'),f==='shared/practice/practice-ui.js'?protection.practice(git(f).toString()):git(f).toString(),f);
 for(let i=1;i<=2;i++){
  const f=`MT-Intervals/lesson0${i}/index.html`,before=git(f.replace('index.html','learning/index.html')).toString(),now=fs.readFileSync(f,'utf8');
  assert.deepEqual(scripts(now).map(protection.learningJS),scripts(before).map(s=>protection.learningJS(s.replaceAll("file:'../assets/","file:'assets/"))),'Teaching JavaScript beyond resource rebasing');
  const normalize=s=>s.slice(s.indexOf('<body>')).replace(/<script[\s\S]*$/,'').replace('    <a class="ghost btn-link" href="../index.html">← 课程首页</a>\n','').replaceAll('href="../practice/','href="practice/').replaceAll('href="../assets/','href="assets/');
  assert.equal(protection.learningDOM(normalize(now)),protection.learningDOM(normalize(before)),'Teaching DOM beyond removed self-link');
 }
 const allowed=f=>/^MT-Intervals\/lesson0[1-5]\/(?:index.html|learning\/index.html|practice\/index.html)$/.test(f)||f==='shared/styles/course-shell.css'||f.startsWith('tests/music-apps-v1/')||f==='tests/theory-learning/learning.test.cjs'||f==='shared/README.md'||f==='docs/course-design-system.md';
 const changes=cp.execFileSync('git',['diff','--name-only',BASE],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 const newFiles=cp.execFileSync('git',['ls-files','--others','--exclude-standard'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 for(const f of [...changes,...newFiles])assert(allowed(f)||protection.allowed.has(f),'Out of scope: '+f);
 for(let i=1;i<=5;i++)assert(!fs.existsSync(`MT-Intervals/lesson0${i}/learning`));
});
test('Chromium: all five homes and Practice share chrome in 50 viewport/theme pairs',async t=>{
 const s=await serve(),b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});fs.mkdirSync(OUT,{recursive:true});const measurements=[];
 try{for(let i=1;i<=5;i++)for(const [width,height]of sizes)for(const theme of ['light','dark'])await t.test(`MT0${i}-${width}x${height}-${theme}`,async()=>{
  const opts={width,height,theme},home=await open(b,s.url,`MT-Intervals/lesson0${i}/index.html`,opts),practice=await open(b,s.url,`MT-Intervals/lesson0${i}/practice/index.html`,opts);
  const hs=await home.page.evaluate(shell),ps=await practice.page.evaluate(shell);
  assert.equal(hs.overlap,false);assert.equal(ps.overlap,false);assert.equal(hs.overflow,false);assert.equal(ps.overflow,false);
  for(const k of ['brand','badge','footer','rightGap','topToBar','headerGap','bodyPadding','width'])assert.deepEqual(ps[k],hs[k],k);
  assert.equal(ps.brand.fontSize,'12px');assert.equal(ps.footer.fontSize,'12px');assert.equal(ps.footer.lineHeight,'18px');assert.equal(ps.rightGap,'10px');
  const buttons=home.page.locator('#home .home-actions > *');assert((await buttons.allTextContents())[0].includes('开始学习'));
  if(i>=3){assert.equal(await buttons.count(),3);assert.equal(await buttons.nth(0).isDisabled(),true);assert.equal(await buttons.nth(2).isDisabled(),true);}
  await practice.page.locator('#historyToggleBtn').click();assert(await practice.page.locator('#historyModal').isVisible());await practice.page.keyboard.press('Escape');
  if(i===1||i===3||i===5){await home.page.screenshot({path:path.join(OUT,`MT0${i}-${width}-${theme}-home.png`),fullPage:true});await practice.page.screenshot({path:path.join(OUT,`MT0${i}-${width}-${theme}-practice.png`),fullPage:true});}
  const hrefs=await home.page.locator('a[href]').evaluateAll(es=>es.map(e=>e.href).filter(u=>new URL(u).origin===location.origin));
  for(const u of hrefs){const p=decodeURIComponent(new URL(u).pathname).slice(1);assert(fs.existsSync(p),'broken home link '+p);}
  assert.deepEqual(home.errors,[]);assert.deepEqual(home.missing,[]);assert.deepEqual(practice.errors,[]);assert.deepEqual(practice.missing,[]);
  measurements.push({course:i,width,height,theme,home:hs,practice:ps});await home.context.close();await practice.context.close();
 });}finally{fs.writeFileSync(path.join(OUT,'shell-measurements.json'),JSON.stringify(measurements,null,2));await b.close();await s.close();}
});
test('result internals retain exact computed styles, DOM and relative geometry across all viewport/theme pairs',async()=>{
 const s=await serve(),b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const [width,height]of sizes)for(const theme of ['light','dark']){
  const file='MT-Intervals/lesson05/practice/index.html',opts={width,height,theme},before=await open(b,s.url,file,{...opts,before:true}),after=await open(b,s.url,file,opts);
  for(const c of [before,after])await complete(c.page);
  assert.deepEqual(await after.page.evaluate(resultSnapshot),await before.page.evaluate(resultSnapshot),`${width} ${theme}: result internals`);
  await after.page.screenshot({path:path.join(OUT,`MT05-${width}-${theme}-result-after.png`),fullPage:true});
  await before.page.screenshot({path:path.join(OUT,`MT05-${width}-${theme}-result-before.png`),fullPage:true});
  await before.context.close();await after.context.close();
 }}finally{await b.close();await s.close();}
});
test('five homes navigate to their own Practice and return directly; shell selectors stay opt-in',async()=>{
 const s=await serve(),b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(let i=1;i<=5;i++){
  const file=`MT-Intervals/lesson0${i}/index.html`,c=await open(b,s.url,file);
  await c.page.locator('#home a[href="practice/index.html"]').click();
  await c.page.waitForSelector('#startPracticeBtn');assert(c.page.url().endsWith(`/lesson0${i}/practice/index.html`));
  await c.page.locator('#returnHomeBtn').click();await c.page.waitForURL(s.url+'/'+file);assert(await c.page.locator('#home').isVisible());
  const selectors=await c.page.evaluate(()=>{
   const sheet=[...document.styleSheets].find(s=>s.href?.endsWith('/shared/styles/course-shell.css')),out=[];
   const walk=rules=>{for(const r of rules){if(r.selectorText)out.push(r.selectorText);if(r.cssRules)walk(r.cssRules);}};walk(sheet.cssRules);return out;
  });
  assert(selectors.length>0);for(const selector of selectors)assert(selector.includes('[data-mt-shell]'),selector);
  assert.deepEqual(c.errors,[]);assert.deepEqual(c.missing,[]);await c.context.close();
 }}finally{await b.close();await s.close();}
});
