const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const {chromium} = require('playwright');
const {serve,scripts} = require('../course-baseline/harness.cjs');
const ROOT=path.resolve(__dirname,'../..');
const BASE='3eae716095bd2941f4508184ff074d5df51dd18b';
const OUT=process.env.THEORY_ARTIFACT_DIR || '/tmp/music-apps-theory-learning';
const VEX=process.env.VEXFLOW_TEST_FILE || '/tmp/vexflow.js';
const original=file=>cp.execFileSync('git',['show',`${BASE}:${file}`],{cwd:ROOT,maxBuffer:8*1024*1024});
const files=['MT-Intervals/lesson01/index.html','MT-Intervals/lesson02/index.html','MT-Intervals/lesson06/index.html'];
const cache=new Map();
async function open(browser,url,file,{before=false,width=390,height=844,theme='light',motion='reduce',audioMock=true}={}) {
 const context=await browser.newContext({viewport:{width,height},colorScheme:theme,reducedMotion:motion});
 if(audioMock)await context.addInitScript(()=>{
  window.__plays=[];
  window.Audio=class extends EventTarget {
   constructor(src){super();this.src=src;this.paused=true;this.currentTime=0;}
   getAttribute(n){return n==='src'?this.src:null;}
   setAttribute(n,v){this[n]=v;}
   play(){this.paused=false;window.__plays.push(this.src);this.dispatchEvent(new Event('play'));return Promise.resolve();}
   pause(){this.paused=true;}
   load(){}
  };
 });
 await context.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='cdn.jsdelivr.net')return route.fulfill({path:VEX,contentType:'application/javascript'});
  if(u.origin!==url)return route.fulfill({status:200,body:'',contentType:'application/javascript'});
  if(before){
   const p=decodeURIComponent(u.pathname).slice(1);
   try{if(!cache.has(p))cache.set(p,original(p));return route.fulfill({body:cache.get(p),contentType:p.endsWith('.css')?'text/css':p.endsWith('.js')?'application/javascript':p.endsWith('.html')?'text/html':'application/octet-stream'});}catch{return route.fulfill({status:404,body:''});}
  }
  return route.continue();
 });
 const page=await context.newPage(),errors=[],missing=[],warnings=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='warning')warnings.push(m.text());});
 page.on('response',r=>{if(r.url().startsWith(url)&&r.status()>=400)missing.push(r.url());});
 await page.goto(`${url}/${file}`);await page.evaluate(()=>document.fonts.ready);await settle(page);
 return {context,page,errors,missing,warnings};
}
async function settle(page){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
async function state(page){return page.evaluate(()=>({
 text:(document.querySelector('#stepBody')||document.querySelector('#lessonContent')).textContent.replace(/\s+/g,' ').trim(),
 boardText:document.querySelector('#lessonBoard').textContent.replace(/\s+/g,' ').trim(),
 svg:document.querySelectorAll('#lessonBoard svg').length,
 notes:document.querySelectorAll('#lessonBoard .vf-stavenote').length,
 active:[...document.querySelectorAll('.compact-keyboard .active')].map(n=>n.textContent),
 progress:document.querySelector('#progress').style.width,
 disabled:document.querySelector('#nextBtn').disabled
}));}
async function choose(page,lesson,i,wrong=false){
 const answers=lesson===1?{13:'#quizCorrect',21:'[data-tone-answer="4"]',22:'[data-degree-answer="6"]'}:{3:'M',4:'m',7:'m',8:'M',14:'A',15:'d'};
 if(lesson===2&&i>=23){
  const correct={23:['P','A'],24:['d','P','A'],25:['d','m','M','A']}[i];
  if(wrong){await page.locator('.quiz-option[data-a="M"]').click();await page.locator('#nextBtn').click();assert.equal(await page.locator('#summary').isVisible(),false);await page.locator('.quiz-option[data-a="M"]').click();}
  for(const a of correct)await page.locator(`.quiz-option[data-a="${a}"]`).click();
  await page.locator('#nextBtn').click();return;
 }
 if(!(i in answers))return;
 if(wrong){
  const wrongButton=lesson===1?(i===13?'#quizWrong':i===21?'[data-tone-answer="5"]':'[data-degree-answer="4"]'):'.quiz-option:not(:disabled):not([data-a="'+answers[i]+'"])';
  await page.locator(wrongButton).first().click();assert.equal(await page.locator('#nextBtn').isDisabled(),true,'wrong answer must not unlock');
 }
 await page.locator(lesson===1?answers[i]:`.quiz-option[data-a="${answers[i]}"]`).first().click();
}
function syntax(source,name){new (require('node:vm').Script)(source,{filename:name});}
test('syntax, fixed baseline teaching/rendering/check/audio code, links and unrelated files protected',()=>{
 for(const f of files.slice(0,2)){
  const now=fs.readFileSync(path.join(ROOT,f),'utf8'),old=original(f).toString();
  for(const s of scripts(now))syntax(s,f);
  const urls=s=>[...s.matchAll(/(?:href|src)=["']([^"']+)["']/g)].map(m=>m[1]).filter(s=>!s.includes('../shared/')).sort();
  assert.deepEqual(urls(now),urls(old),f+' resource URLs');
  assert.equal(now.match(/const LESSON_AUDIO=\{[\s\S]*?\n\};/)[0],old.match(/const LESSON_AUDIO=\{[\s\S]*?\n\};/)[0],f+' original audio map');
  // The full contents of all original render/check/audio functions remain in
  // place except documented navigation/audio-button integration functions.
  const names=[...old.matchAll(/function ((?:draw|render|bind|parseNote|play|stop|l2|confirmL2)\w*)\(/g)].map(m=>m[1]).filter(n=>!['renderOpening'].includes(n));
  for(const name of names){const a=extractFunctions(scripts(old).join('\n'),[name])[name],b=extractFunctions(scripts(now).join('\n'),[name])[name];assert.equal(b,a,f+' protected function '+name);}
 }
 for(const f of ['MT-Intervals/shared/learning/theory-lesson.js','MT-Intervals/lesson06/lesson.js'])syntax(fs.readFileSync(path.join(ROOT,f),'utf8'),f);
 const changed=cp.execFileSync('git',['diff',BASE,'--name-only'],{cwd:ROOT}).toString().trim().split('\n').filter(Boolean);
 const allowed=new Set([...files,'MT-Intervals/lesson06/lesson.css','MT-Intervals/lesson06/lesson.js',
  'MT-Intervals/shared/learning/theory-lesson.js','MT-Intervals/shared/styles/learning-base.css','MT-Intervals/shared/styles/learning-components.css',
  'docs/course-design-system.md','docs/interactive-theory-lesson-standard.md','docs/course-visual-unification-results.md','docs/course-phase1-visual-risk-review.md',
  'tests/theory-learning/learning.test.cjs','tests/theory-learning/README.md']);
 for(const f of changed)assert(allowed.has(f),'unexpected changed file '+f);
 const now=fs.readFileSync(path.join(ROOT,'MT-Intervals/lesson06/lesson.js'),'utf8'),old=original('MT-Intervals/lesson06/lesson.js').toString();
 assert.equal(now.slice(now.indexOf('  const exercises'),now.indexOf('  const byID')),old.slice(old.indexOf('  const exercises'),old.indexOf('  const byID')),'review copy and exercise configurations');
});
// Parser-backed function extraction: top-level course functions are declared
// at column 0; compile each prefix in a lazy factory, then read toString().
function extractFunctions(source,names){
 const end=source.indexOf('const steps=['),prefix=source.slice(0,end);
 const factory=new Function('document','TheoryLesson',prefix+'\nreturn {'+names.join(',')+'};');
 const stub={querySelector:()=>({style:{},setAttribute(){}}),getElementById:()=>({style:{},setAttribute(){}})};
 const result=factory(stub,{});return Object.fromEntries(names.map(n=>[n,result[n].toString().replaceAll('class="theory-note"','class="tiny"')]));
}
test('all teaching steps match original text, notation, keyboard highlights, gating and audio maps',async()=>{
 assert(fs.existsSync(VEX),'Set VEXFLOW_TEST_FILE to the unchanged VexFlow 4.2.5 CDN build');
 assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(VEX)).digest('hex'),'e99d9f8d7ebcb88fe2f4dae3d0c22427493d17f217c2dfac2483bd39b23f3fcf','VexFlow 4.2.5 test resource');
 const server=await serve(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const [n,total] of [[1,23],[2,26]]){
  const file=files[n-1],now=await open(browser,server.url,file),before=await open(browser,server.url,file,{before:true});
  for(let i=0;i<total;i++){
   for(const c of [before,now]){await c.page.evaluate(i=>showStep(i,false),i);await settle(c.page);}
   assert.deepEqual(await state(now.page),await state(before.page),`MT0${n} step ${i+1}`);
  }
  assert.deepEqual(now.errors,[]);assert.deepEqual(now.missing,[]);assert.deepEqual(now.warnings.filter(s=>s.includes('谱')||s.includes('Vex')),[]);
  await now.context.close();await before.context.close();
 }}finally{await browser.close();await server.close();}
});
test('complete click flows, wrong answers, quiz restoration, progress, home and completion',async t=>{
 const server=await serve(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const [n,total] of [[1,23],[2,26]])await t.test(`MT0${n}`,async()=>{
  const c=await open(browser,server.url,files[n-1]),p=c.page;
  try{
   assert.equal(await p.locator('#home').isVisible(),true);
   await p.locator('#startLearning').click();await settle(p);
   for(let i=0;i<total;i++){
    assert.equal(await p.locator('#stepBody').getAttribute('data-step-id'),`mt0${n}-${String(i+1).padStart(2,'0')}`);
    assert.equal(await p.locator('.progress-wrap').getAttribute('aria-valuenow'),String(i+1));
    await choose(p,n,i,true);
    if((n===1&&i===13)||(n===2&&i===3)){
     const feedback=await p.locator('#stepBody').innerHTML();
     await p.locator('#prevBtn').click();await settle(p);
     const plays=await p.evaluate(()=>__plays.length);
     await p.locator('#nextBtn').click();await settle(p);
     assert.equal(await p.locator('#stepBody').innerHTML(),feedback,'answered quiz DOM must restore');
     assert.equal(await p.locator('#nextBtn').isDisabled(),false);
     assert.equal(await p.evaluate(()=>__plays.length),plays,'restoration must not replay audio');
    }
    await p.locator('#nextBtn').click();await settle(p);
   }
   assert.equal(await p.locator('#summary').isVisible(),true);
   assert.equal(await p.locator('.progress-wrap').getAttribute('aria-valuenow'),String(total));
   assert.equal(await p.locator('#lessonFooterZone').isVisible(),false);
   await p.locator('#backHome').click();assert.equal(await p.locator('#home').isVisible(),true);
   assert.equal(await p.locator('.progress-wrap').getAttribute('aria-valuenow'),'0');
   assert.deepEqual(c.errors,[]);assert.deepEqual(c.missing,[]);
  }finally{await c.context.close();}
 });
 await t.test('MT06 modules, SVG, inversion/compound controls and restored scroll/state',async()=>{
  const c=await open(browser,server.url,files[2]),p=c.page;
  try{
   await p.locator('#startReview').click();
   for(let i=0;i<4;i++){
    assert.equal(await p.locator('.progress-wrap').getAttribute('aria-valuenow'),String(i));
    assert.equal(await p.locator('#lessonContent').getAttribute('data-step-kind'),'new-concept');
    if(i===1)assert.equal(await p.locator('.staff-example').count(),2);
    if(i===2){await p.locator('#invertButton').click();assert.equal(await p.locator('#invertButton').getAttribute('aria-pressed'),'true');}
    if(i===3){
     await p.locator('[data-degree="15"]').click();assert.match(await p.locator('#compoundPair').textContent(),/八度/);
     await p.locator('#prevBtn').click();assert.equal(await p.locator('#invertButton').getAttribute('aria-pressed'),'true');
     await p.locator('#nextBtn').click();assert.equal(await p.locator('[data-degree="15"]').getAttribute('aria-pressed'),'true');
    }
    await p.locator('#nextBtn').click();
   }
   assert.equal(await p.locator('#summary').isVisible(),true);assert.equal(await p.locator('.progress-wrap').getAttribute('aria-valuenow'),'4');
   await p.locator('#backHome').click();assert.equal(await p.locator('#home').isVisible(),true);
   assert.deepEqual(c.errors,[]);assert.deepEqual(c.missing,[]);
  }finally{await c.context.close();}
 });
 }finally{await browser.close();await server.close();}
});
test('explicit continuation appends existing nodes; text-only steps retain board; minimal scroll/back/reduced-motion',async()=>{
 const server=await serve(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const c=await open(browser,server.url,files[0]),p=c.page;
  await p.locator('#startLearning').click();
  await p.evaluate(()=>{window.__first=document.querySelector('#stepBody').firstElementChild;});
  await p.locator('#nextBtn').click();await settle(p);
  assert.equal(await p.evaluate(()=>__first===document.querySelector('#stepBody').firstElementChild),true,'keep existing paragraph node');
  assert.equal(await p.locator('#stepBody p').count(),2);
  await p.locator('#prevBtn').click();assert.equal(await p.locator('#stepBody p').count(),1,'no unrevealed future text');
  await p.evaluate(()=>showStep(9,false));await settle(p);
  await p.evaluate(()=>{window.__svg=document.querySelector('#lessonBoard svg');window.__first=document.querySelector('#stepBody').firstElementChild;});
  await p.locator('#nextBtn').click();await settle(p);
  assert.equal(await p.evaluate(()=>__svg===document.querySelector('#lessonBoard svg')),true,'text-only continuation must retain VexFlow');
  assert.equal(await p.evaluate(()=>__first===document.querySelector('#stepBody').firstElementChild),true);
  // Explicit knowledge switch resets the cumulative text, not every Next.
  await p.evaluate(()=>showStep(14,false));assert.equal(await p.locator('#stepBody p').count(),1);
  const geometry=await p.locator('#lessonBoard').boundingBox();
  await p.evaluate(()=>{window.__scrollCalls=[];const e=document.querySelector('#stepBody');e.scrollTo=function(o){__scrollCalls.push(o);HTMLElement.prototype.scrollTo.call(this,o)};});
  for(let i=15;i<=20;i++){await p.locator('#nextBtn').click();await settle(p);}
  const result=await p.evaluate(()=>{
   const e=document.querySelector('#stepBody'),last=e.lastElementChild,r=last.getBoundingClientRect(),v=e.getBoundingClientRect();
   return {top:e.scrollTop,calls:__scrollCalls,bottom:r.bottom,visibleBottom:v.bottom,window:scrollY,animation:getComputedStyle(last).animationName};
  });
  assert(result.top>0);assert(result.calls.every(c=>c.behavior==='instant'));assert(result.bottom<=result.visibleBottom+1);assert.equal(result.window,0);assert.equal(result.animation,'none');
  assert.deepEqual(await p.locator('#lessonBoard').boundingBox(),geometry,'scroll must not move board');
  await p.locator('#stepBody').evaluate(e=>e.scrollTop=35);const saved=await p.locator('#stepBody').evaluate(e=>e.scrollTop);
  await p.locator('#prevBtn').click();await p.locator('#nextBtn').click();await settle(p);
  assert.equal(await p.locator('#stepBody').evaluate(e=>e.scrollTop),saved,'restore manual reading position');
  await c.context.close();
  const spacious=await open(browser,server.url,files[0],{width:768,height:1300,motion:'no-preference'});
  await spacious.page.locator('#startLearning').click();await spacious.page.locator('#nextBtn').click();await settle(spacious.page);
  assert.equal(await spacious.page.locator('#stepBody').evaluate(e=>e.scrollTop),0,'no scroll while content fits');
  await spacious.context.close();
 }finally{await browser.close();await server.close();}
});
test('responsive full content, fixed regions, typography, themes, real VexFlow and screenshot evidence',async t=>{
 fs.mkdirSync(OUT,{recursive:true});const evidence=[];
 const server=await serve(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const [width,height] of [[320,568],[390,844],[430,932],[844,390],[768,1024],[1024,768],[1280,900]])for(const theme of ['light','dark'])for(let l=0;l<3;l++)await t.test(`${l===2?'06':'0'+(l+1)}-${width}x${height}-${theme}`,async()=>{
  const c=await open(browser,server.url,files[l],{width,height,theme}),p=c.page;
  const check=async()=>{
   const d=await p.evaluate(()=>{
    const r=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom}};
    const exp=document.querySelector('.lesson-content'),board=document.querySelector('#lessonBoard'),nav=document.querySelector('.lesson-nav');
    return {pageWidth:document.documentElement.scrollWidth,viewport:innerWidth,window:scrollY,board:r(board),exp:r(exp),nav:r(nav),expWidth:exp.scrollWidth,bodySize:getComputedStyle(exp).fontSize,leading:getComputedStyle(exp).lineHeight,
     bg:getComputedStyle(document.body).backgroundColor,text:getComputedStyle(exp).color,cardRadius:getComputedStyle(document.querySelector('#lesson')).borderRadius,bodyPad:getComputedStyle(document.body).paddingTop,
     height:innerHeight,boardScroll:board.scrollHeight,boardClient:board.clientHeight};
   });
   assert(d.pageWidth<=width,JSON.stringify(d));assert(d.exp.height>=60,'reading area too short '+JSON.stringify(d));
   assert(d.nav.bottom<=height&&d.nav.y>=d.exp.bottom-1,'navigation overlaps explanation '+JSON.stringify(d));
   assert(d.expWidth<=d.exp.width+1,'explanation horizontal overflow '+JSON.stringify(d));
   assert.equal(d.bodySize,'17.92px');assert.equal(d.cardRadius,'14px');assert.equal(d.window,0);assert.equal(d.bodyPad,'10px');
   assert(!/谱例暂时无法显示|五线谱组件未载入/.test(await p.locator('#lessonBoard').textContent()),'notation renderer fallback');
   const header=await p.locator('.topbar').evaluate(e=>{const a=e.firstElementChild.getBoundingClientRect(),b=e.lastElementChild.getBoundingClientRect();return {left:a.right,right:b.left};});
   assert(header.left<=header.right+1,'header overlap');
   return d;
  };
  try{
   await p.screenshot({path:path.join(OUT,`mt${l===2?'06':'0'+(l+1)}-${width}-${theme}-home.png`),fullPage:true,caret:'initial'});
   await p.locator(l===2?'#startReview':'#startLearning').click();await settle(p);
   const initial=await check();
   await p.screenshot({path:path.join(OUT,`mt${l===2?'06':'0'+(l+1)}-${width}-${theme}-initial.png`),caret:'initial'});
   if(l<2){
    const total=l===0?23:26;
    for(let i=1;i<total;i++){await p.evaluate(i=>showStep(i,false),i);await settle(p);await check();}
    await p.evaluate(()=>showStep(20,false));
   }else{
    for(let i=1;i<4;i++){await p.locator('#nextBtn').click();await settle(p);await check();}
   }
   const content=p.locator('.lesson-content');const max=await content.evaluate(e=>{e.scrollTop=e.scrollHeight;return e.scrollHeight-e.clientHeight;});
   assert(Math.abs(await content.evaluate(e=>e.scrollTop)-max)<=1,'long content must be fully scrollable');
   await p.screenshot({path:path.join(OUT,`mt${l===2?'06':'0'+(l+1)}-${width}-${theme}-reading.png`),caret:'initial'});
   assert.deepEqual(c.errors,[]);assert.deepEqual(c.missing,[]);
   evidence.push({file:files[l],width,height,theme,initial,errors:c.errors,missing:c.missing});
  }finally{await c.context.close();}
 });}finally{fs.writeFileSync(path.join(OUT,'responsive.json'),JSON.stringify(evidence,null,2));await browser.close();await server.close();}
});
test('real HTML audio resource decoding/playback, keyboard scrolling and native keyboard controls',async()=>{
 const server=await serve(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--mute-audio']});
 try{
  for(const n of [1,2]){
   const c=await open(browser,server.url,files[n-1],{audioMock:false}),p=c.page;
   try{
    await p.locator('#startLearning').click();await settle(p);
    await p.locator('.lesson-audio-btn').click();
    await p.waitForFunction(()=>lessonAudio&&!lessonAudio.paused&&lessonAudio.currentTime>0&&lessonAudio.readyState>=2);
    assert.equal(await p.locator('.lesson-audio-btn').count(),1);
    await p.evaluate(n=>showStep(n===1?14:3,false),n);await settle(p);
    const scroller=p.locator('.compact-keyboard-scroll');
    await scroller.evaluate(e=>e.scrollLeft=e.scrollWidth);
    assert(await scroller.evaluate(e=>e.scrollLeft)>0,'narrow keyboard scrolls without shrinking keys');
    assert.equal(await p.locator('.white-key').count(),15);
    assert.equal(await p.locator('.black-key').count(),10);
    assert.deepEqual(c.errors,[]);assert.deepEqual(c.missing,[]);
   }finally{await c.context.close();}
  }
  const c=await open(browser,server.url,files[2]),p=c.page;
  await p.locator('#startReview').focus();await p.keyboard.press('Enter');
  await p.locator('#nextBtn').click();await p.locator('#nextBtn').click();
  await p.locator('#invertButton').focus();await p.keyboard.press('Space');
  assert.equal(await p.locator('#invertButton').getAttribute('aria-pressed'),'true');
  await p.locator('#nextBtn').click();await p.locator('[data-degree="14"]').focus();await p.keyboard.press('Enter');
  assert.equal(await p.locator('[data-degree="14"]').getAttribute('aria-pressed'),'true');
  await c.context.close();
 }finally{await browser.close();await server.close();}
});
test('representative original/new screenshots and local PDF/exercise targets remain valid',async()=>{
 fs.mkdirSync(OUT,{recursive:true});const server=await serve(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(let l=0;l<3;l++)for(const before of [true,false])for(const width of [390,1280]){
  const c=await open(browser,server.url,files[l],{before,width,height:width===390?844:900,theme:width===390?'dark':'light'}),p=c.page;
  try{
   await p.locator(l===2?'#startReview':'#startLearning').click();await settle(p);
   await p.screenshot({path:path.join(OUT,`comparison-mt${l===2?'06':'0'+(l+1)}-${width}-${before?'before':'after'}.png`),caret:'initial'});
   const hrefs=await p.locator('a[href]').evaluateAll(nodes=>nodes.map(a=>a.getAttribute('href')));
   for(const href of hrefs){if(!/^https?:/.test(href)&&!href.startsWith('#'))assert(fs.existsSync(path.resolve(ROOT,path.dirname(files[l]),href)),href);}
   if(l===2)for(let i=0;i<3;i++){const links=await p.locator('#exerciseLinks a').evaluateAll(nodes=>nodes.map(a=>({url:a.href,target:a.target,rel:a.rel})));for(const a of links){assert.match(a.url,/^https:\/\/www\.musictheory\.net\/exercises\/interval\//);assert.equal(a.target,'_blank');assert.match(a.rel,/noopener/);}await p.locator('#nextBtn').click();}
  }finally{await c.context.close();}
 }}finally{await browser.close();await server.close();}
});
test('shared styles are isolated from Practice, ET, Dashboard and Catalog',async()=>{
 const server=await serve(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const styles=['MT-Intervals/shared/styles/learning-base.css','MT-Intervals/shared/styles/learning-components.css','MT-Intervals/lesson06/lesson.css'].map(f=>fs.readFileSync(path.join(ROOT,f),'utf8')).join('\n');
 const targets=['MT-Intervals/lesson03/index.html','ET-Intervals/05-2nd-d7wzes/index.html','students/samuel-b5def80cdaa55d42/index.html','teacher/index.html','courses/index.html'];
 const snapshot=page=>page.evaluate(()=>[...document.body.querySelectorAll('*')].filter(e=>e.tagName!=='STYLE').map(e=>{
  const c=getComputedStyle(e),r=e.getBoundingClientRect();return [e.tagName,e.id,c.display,c.color,c.backgroundColor,c.borderRadius,c.fontSize,c.lineHeight,r.x,r.y,r.width,r.height];
 }));
 try{for(const f of targets)for(const theme of ['light','dark']){
  const c=await open(browser,server.url,f,{theme});
  try{const before=await snapshot(c.page);await c.page.addStyleTag({content:styles});assert.deepEqual(await snapshot(c.page),before,f+' '+theme+' CSS isolation');}finally{await c.context.close();}
 }}finally{await browser.close();await server.close();}
});
