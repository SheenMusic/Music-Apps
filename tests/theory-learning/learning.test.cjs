const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const {chromium} = require('playwright');
const {serve,scripts} = require('../course-baseline/harness.cjs');
const ROOT=path.resolve(__dirname,'../..');
const BASE='3eae716095bd2941f4508184ff074d5df51dd18b';
// Music/content stays fixed to BASE; only this change's scope uses current main.
const SCOPE_BASE='a5829af3d148932c403c8f60c6d73737e98c0eb5';
const OUT=process.env.THEORY_ARTIFACT_DIR || '/tmp/music-apps-theory-learning';
const VEX=process.env.VEXFLOW_TEST_FILE || '/tmp/vexflow.js';
const original=file=>cp.execFileSync('git',['show',`${BASE}:${file}`],{cwd:ROOT,maxBuffer:8*1024*1024});
const files=['MT-Intervals/lesson01/index.html','MT-Intervals/lesson02/index.html','MT-Intervals/lesson06/index.html'];
const cache=new Map();
async function open(browser,url,file,{before=false,width=390,height=844,theme='light',motion='reduce',audioMock=true,touch=false}={}) {
 const context=await browser.newContext({viewport:{width,height},colorScheme:theme,reducedMotion:motion,hasTouch:touch,isMobile:touch});
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
// Normalize only the authorized initial bar and display-coordinate/callout
// adaptation; note generation, voices, pitches and course handlers remain exact.
const withoutStartBar = s => s
 .replace('      const align=()=>{','      requestAnimationFrame(()=>{')
 .replace("      };\n      el.dataset.theoryLayout='';\n      el.addEventListener('theory-board-layout',align);\n      requestAnimationFrame(align);",'      });')
 .replaceAll('.setBegBarType(VF.Barline.type.NONE)','')
 .replace("if(bb){const point=new DOMPoint(bb.getX()+bb.getW()/2,bb.getY()+bb.getH()/2).matrixTransform(svg.getScreenCTM());return {x:point.x-wr.left,y:point.y-wr.top};}","if(bb)return {x:sr.left-wr.left+bb.getX()+bb.getW()/2,y:sr.top-wr.top+bb.getY()+bb.getH()/2};")
 .replace("  board.querySelector('.melodic-board-wrap').classList.toggle('with-callouts',mode==='both');\n",'');
function syntax(source,name){new (require('node:vm').Script)(source,{filename:name});}
function musicGeometry() {
 const board=document.querySelector('#lessonBoard'),frame=board.querySelector('.theory-board-content'),b=board.getBoundingClientRect(),rects=[];
 const visible=e=>{for(let n=e;n&&n!==board;n=n.parentElement){const s=getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return false;}return true;};
 const paint=c=>c!=='none'&&c!=='transparent'&&!/rgba\(.*,[ ]*0\)$/.test(c);
 for(const node of frame.querySelectorAll('svg path,svg line,svg rect,svg circle,svg ellipse,svg polygon,svg polyline,svg text,svg use')){
  if(node.closest('defs,clipPath,mask')||!visible(node))continue;
  const s=getComputedStyle(node),fill=node.tagName.toLowerCase()!=='line'&&paint(s.fill)&&Number(s.fillOpacity)>0,stroke=paint(s.stroke)&&Number(s.strokeOpacity)>0&&parseFloat(s.strokeWidth)>0;
  if(fill||stroke)rects.push(node.getBoundingClientRect());
 }
 const walker=document.createTreeWalker(frame,NodeFilter.SHOW_TEXT);
 for(let text;text=walker.nextNode();){if(!text.textContent.trim()||text.parentElement.closest('svg')||!visible(text.parentElement))continue;const range=document.createRange();range.selectNodeContents(text);rects.push(...range.getClientRects());}
 for(const node of frame.querySelectorAll('button,.white-key,.black-key,.melodic-leader,.board-divider'))if(visible(node)){const s=getComputedStyle(node);if(paint(s.backgroundColor)||node.tagName==='BUTTON')rects.push(node.getBoundingClientRect());}
 const boxes=rects.filter(r=>r.width||r.height),top=Math.min(...boxes.map(r=>r.top)),bottom=Math.max(...boxes.map(r=>r.bottom));
 return {top,bottom,height:bottom-top,center:(top+bottom)/2,boardCenter:b.top+b.height/2,delta:(top+bottom)/2-b.top-b.height/2,usable:board.clientHeight-parseFloat(getComputedStyle(board).paddingTop)-parseFloat(getComputedStyle(board).paddingBottom),scroll:board.scrollTop,max:board.scrollHeight-board.clientHeight,boardTop:b.top,boardBottom:b.bottom};
}
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
  for(const name of names){const a=extractFunctions(scripts(old).join('\n'),[name])[name],b=extractFunctions(scripts(now).join('\n'),[name])[name];assert.equal(withoutStartBar(b),withoutStartBar(a),f+' protected function '+name);}
 }
 for(const f of ['MT-Intervals/shared/learning/theory-lesson.js','MT-Intervals/lesson06/lesson.js'])syntax(fs.readFileSync(path.join(ROOT,f),'utf8'),f);
 const changed=cp.execFileSync('git',['diff',SCOPE_BASE,'--name-only'],{cwd:ROOT}).toString().trim().split('\n').filter(Boolean);
 const allowed=new Set(['MT-Intervals/shared/learning/theory-lesson.js','MT-Intervals/shared/styles/learning-base.css',
  'docs/interactive-theory-lesson-standard.md','docs/course-design-system.md','tests/theory-learning/learning.test.cjs','tests/theory-learning/README.md']);
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
  await p.evaluate(()=>{window.__first=document.querySelector('#stepExplanation').firstElementChild;});
  await p.locator('#nextBtn').click();await settle(p);
  assert.equal(await p.evaluate(()=>__first===document.querySelector('#stepExplanation').firstElementChild),true,'keep existing paragraph node');
  assert.equal(await p.locator('#stepBody p').count(),2);
  await p.locator('#prevBtn').click();assert.equal(await p.locator('#stepBody p').count(),1,'no unrevealed future text');
  await p.evaluate(()=>showStep(9,false));await settle(p);
  await p.evaluate(()=>{window.__svg=document.querySelector('#lessonBoard svg');window.__first=document.querySelector('#stepExplanation').firstElementChild;});
  await p.locator('#nextBtn').click();await settle(p);
  assert.equal(await p.evaluate(()=>__svg===document.querySelector('#lessonBoard svg')),true,'text-only continuation must retain VexFlow');
  assert.equal(await p.evaluate(()=>__first===document.querySelector('#stepExplanation').firstElementChild),true);
  // Explicit knowledge switch resets the cumulative text, not every Next.
  await p.evaluate(()=>showStep(14,false));assert.equal(await p.locator('#stepBody p').count(),1);
  const geometry=await p.locator('#lessonBoard').boundingBox();
  await p.evaluate(()=>{window.__scrollCalls=[];const e=document.querySelector('#stepBody');e.scrollTo=function(o){__scrollCalls.push(o);HTMLElement.prototype.scrollTo.call(this,o)};});
  for(let i=15;i<=20;i++){await p.locator('#nextBtn').click();await settle(p);}
  const result=await p.evaluate(()=>{
   const e=document.querySelector('#stepBody'),last=e.firstElementChild.lastElementChild,r=last.getBoundingClientRect(),v=e.getBoundingClientRect();
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
     mode:getComputedStyle(exp.parentElement).display,inner:r(exp.firstElementChild),scroll:exp.scrollTop,client:exp.clientHeight,height:innerHeight,boardScroll:board.scrollHeight,boardClient:board.clientHeight};
   });
   assert(d.pageWidth<=width,JSON.stringify(d));assert(d.exp.height>=60,'reading area too short '+JSON.stringify(d));
   assert(d.nav.bottom<=height&&d.nav.y>=d.exp.bottom-1,'navigation overlaps explanation '+JSON.stringify(d));
   assert(d.expWidth<=d.exp.width+1,'explanation horizontal overflow '+JSON.stringify(d));
   if(d.mode==='grid'&&d.inner.height<=d.client+.5)assert(Math.abs(d.inner.y+d.inner.height/2-d.exp.y-d.exp.height/2)<1,'short content must be vertically centered '+JSON.stringify(d));
   else {const start=d.inner.y-d.exp.y+d.scroll;assert(Math.abs(start)<1,'overflow must start at reachable offset zero '+JSON.stringify(d));}
   assert.equal(d.bodySize,'16px');assert.equal(d.cardRadius,'14px');assert.equal(d.window,0);assert.equal(d.bodyPad,'10px');
   assert(!/谱例暂时无法显示|五线谱组件未载入/.test(await p.locator('#lessonBoard').textContent()),'notation renderer fallback');
   const header=await p.locator('.topbar').evaluate(e=>{const a=e.firstElementChild.getBoundingClientRect(),b=e.lastElementChild.getBoundingClientRect();return {left:a.right,right:b.left};});
   assert(header.left<=header.right+1,'header overlap');
   const music=await p.evaluate(musicGeometry);
   if(music.height<=music.usable+.5)assert(Math.abs(music.delta)<=8,'painted music must be centered '+JSON.stringify({lesson:l,width,height,music}));
   return {...d,music};
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
test('preview feedback: hierarchy tokens and stable centered reading regions across continuation and scrollbar states',async()=>{
 const server=await serve(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const l of [0,1,2])for(const [width,height] of [[390,844],[844,390],[768,1024],[1024,768],[1280,900]]){
  const c=await open(browser,server.url,files[l],{width,height,touch:width<1100}),p=c.page;
  try{
   await p.locator(l===2?'#startReview':'#startLearning').click();await settle(p);
   const box=()=>p.locator('.lesson-content').evaluate(e=>{
    const r=e.getBoundingClientRect(),parent=e.parentElement,s=getComputedStyle(parent),b=parent.getBoundingClientRect(),cols=s.display==='grid'?2:1;
    const left=b.left+parseFloat(s.paddingLeft),right=b.right-parseFloat(s.paddingRight),gap=parseFloat(s.columnGap)||0;
    const cellLeft=cols===2?left+(right-left-gap)/2+gap:left;
    const st=getComputedStyle(e);return {center:r.left+r.width/2,expected:(cellLeft+right)/2,width:r.width,align:st.textAlign,gutter:st.scrollbarGutter,body:st.fontSize};
   });
   const start=await box();assert(Math.abs(start.center-start.expected)<.6,JSON.stringify(start));assert.equal(start.align,'left');assert.equal(start.gutter,'stable both-edges');assert.equal(start.body,'16px');
   fs.mkdirSync(OUT,{recursive:true});await p.screenshot({path:path.join(OUT,`hierarchy-mt${l===2?'06':'0'+(l+1)}-${width}.png`),caret:'initial'});
   if(l<2){for(const i of l===0?[1,4,8,12,20]:[1,2,6,13,22]){await p.evaluate(i=>showStep(i),i);await settle(p);const next=await box();assert(Math.abs(next.center-start.center)<.6,'horizontal reading center moved');assert.equal(next.width,start.width);}}
   else{
    const sizes=await p.evaluate(()=>Object.fromEntries(['#moduleTitle','#moduleCopy h2','#moduleCopy ul','#moduleCopy p','.theory-note','.board-label','.reference-caption'].map(sel=>{const e=document.querySelector(sel),s=getComputedStyle(e);return [sel,{size:s.fontSize,leading:s.lineHeight}];})));
    assert.equal(sizes['#moduleTitle'].size,height<=500?'21px':'24px');assert.equal(sizes['#moduleCopy h2'].size,'17px');assert.equal(sizes['#moduleCopy ul'].size,'15px');assert.equal(sizes['#moduleCopy p'].size,'16px');assert.equal(sizes['.theory-note'].size,'13px');assert.equal(sizes['.board-label'].size,'13px');assert.equal(sizes['.reference-caption'].size,'14px');
    const content=p.locator('.lesson-content');await content.evaluate(e=>e.scrollTop=e.scrollHeight);const end=await content.evaluate(e=>({max:e.scrollHeight-e.clientHeight,top:e.scrollTop}));assert(Math.abs(end.max-end.top)<1);
    // Short landscape boards may scroll internally; all original controls and
    // their captions must remain reachable without moving the page/navigation.
    await p.locator('#nextBtn').click();await p.locator('#nextBtn').click();await p.locator('#nextBtn').click();
    const nav=await p.locator('.lesson-nav').boundingBox();
    for(const n of [15,9]){await p.locator(`[data-degree="${n}"]`).click();assert.equal(await p.locator(`[data-degree="${n}"]`).getAttribute('aria-pressed'),'true');}
    assert.equal(await p.evaluate(()=>scrollY),0);assert.deepEqual(await p.locator('.lesson-nav').boundingBox(),nav);

   }
  }finally{await c.context.close();}
 }}finally{await browser.close();await server.close();}
});
test('preview feedback: actual smooth continuation, manual takeover, cached return and reduced motion',async()=>{
 fs.mkdirSync(OUT,{recursive:true});const evidence=[];const server=await serve(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const [l,start,end] of [[0,14,20],[1,18,22]]){
  const c=await open(browser,server.url,files[l],{width:390,height:640,motion:'no-preference'}),p=c.page;
  try{
   await p.evaluate(i=>showStep(i,false),start);await settle(p);
   const fixed=await p.locator('#lessonBoard').boundingBox(),center=await p.locator('.lesson-content').boundingBox();
   const frames=await p.evaluate(async({start,end})=>{
    const e=document.querySelector('.lesson-content'),samples=[];
    for(let i=start+1;i<=end;i++){
     showStep(i);const step=[];
     for(let j=0;j<35;j++){await new Promise(r=>requestAnimationFrame(r));const last=e.firstElementChild.lastElementChild;step.push({time:performance.now(),scroll:e.scrollTop,firstTop:e.firstElementChild.firstElementChild.getBoundingClientRect().top,opacity:getComputedStyle(last).opacity,pending:last.classList.contains('theory-pending'),lastBottom:last.getBoundingClientRect().bottom,regionBottom:e.getBoundingClientRect().bottom,window:scrollY});}
     samples.push(step);
    }
    return samples;
   },{start,end});
   evidence.push({lesson:l+1,frames});
   assert(frames.flat().some(f=>Number(f.opacity)>0&&Number(f.opacity)<1),'must observe real reveal frames');
   assert(frames.some(step=>new Set(step.map(s=>s.scroll.toFixed(1))).size>3),'must observe multiple intermediate scroll positions');
   assert(frames.flat().every(f=>f.window===0));assert.deepEqual(await p.locator('#lessonBoard').boundingBox(),fixed);assert.deepEqual(await p.locator('.lesson-content').boundingBox(),center);
   for(const step of frames){
    assert(step.at(-1).lastBottom<=step.at(-1).regionBottom+1,'new paragraph remains clipped after smooth motion');
    for(let i=1;i<step.length;i++){
     assert(step[i].scroll>=step[i-1].scroll-1,'scroll should move continuously forward');
     assert(step[i].firstTop<=step[i-1].firstTop+1,'old text must move continuously upward with centering and scrolling');
    }
   }
   await p.screenshot({path:path.join(OUT,`feedback-mt0${l+1}-smooth-end.png`),caret:'initial'});
   // A wheel gesture before the queued positioning runs must expose the new
   // text, cancel auto-positioning and leave the reader's chosen offset alone.
   await p.reload();await settle(p);
   await p.evaluate(({start,end})=>{showStep(start,false);const e=document.querySelector('.lesson-content');e.scrollTop=0;showStep(end-1,false);showStep(end);e.dispatchEvent(new WheelEvent('wheel'));e.scrollTop=19;window.__manualTop=e.scrollTop;},{start,end});
   await p.waitForTimeout(650);
   assert.equal(await p.locator('.lesson-content').evaluate(e=>e.scrollTop),await p.evaluate(()=>__manualTop));assert.equal(await p.locator('.theory-pending').count(),0);
   await p.locator('#prevBtn').click();await p.locator('#nextBtn').click();await settle(p);assert.equal(await p.locator('.lesson-content').evaluate(e=>e.scrollTop),await p.evaluate(()=>__manualTop));
   // An actual wheel event also cancels smooth motion already in flight.
   await p.reload();await settle(p);
   await p.evaluate(end=>{showStep(end-1,false);showStep(end);},end);
   await p.waitForFunction(()=>document.querySelector('.lesson-content').scrollTop>3);
   await p.locator('.lesson-content').hover();await p.mouse.wheel(0,-35);await settle(p);
   const wheelTop=await p.locator('.lesson-content').evaluate(e=>e.scrollTop);
   await p.waitForTimeout(650);assert.equal(await p.locator('.lesson-content').evaluate(e=>e.scrollTop),wheelTop,'wheel takeover must stop ongoing smooth motion');

  }finally{await c.context.close();}
 }}finally{fs.writeFileSync(path.join(OUT,'smooth-motion.json'),JSON.stringify(evidence,null,2));await browser.close();await server.close();}
});
test('shared arrow navigation, native button hover hints and native control exclusions',async()=>{
 const server=await serve(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const l of [0,1,2])for(const touch of [false,true]){
  const c=await open(browser,server.url,files[l],{touch}),p=c.page;
  try{
   assert.equal(await p.locator('.theory-keyboard-hint').count(),0,'no footer hint or reserved row');
   assert.equal(await p.locator('#prevBtn').getAttribute('aria-keyshortcuts'),'ArrowLeft ArrowUp');
   assert.equal(await p.locator('#nextBtn').getAttribute('aria-keyshortcuts'),'ArrowRight ArrowDown');
   await p.locator(l===2?'#startReview':'#startLearning').click();await p.locator('body').click({position:{x:1,y:1}});
   const id=()=>p.locator('.lesson-content').getAttribute('data-step-id');const first=await id();const nav=await p.locator('.lesson-nav').boundingBox();
   const verifyTitles=async()=>{
    for(const [selector,arrows] of [['#prevBtn','← / ↑'],['#nextBtn','→ / ↓']]){
     const button=p.locator(selector),label=(await button.textContent()).replace(/[←↑→↓]/g,'').replace(/\s+/g,' ').trim();
     assert.equal(await button.getAttribute('title'),`${label}（键盘：${arrows}）`);
    }
   };
   await verifyTitles();await p.locator('#nextBtn').hover();assert.deepEqual(await p.locator('.lesson-nav').boundingBox(),nav,'native hover title must not alter layout');
   await p.keyboard.press('ArrowRight');assert.notEqual(await id(),first);await verifyTitles();assert.equal(await p.locator('.theory-keyboard-hint').count(),0);assert.deepEqual(await p.locator('.lesson-nav').boundingBox(),nav,'keyboard use must not add a footer row');
   await p.keyboard.press('ArrowUp');assert.equal(await id(),first);
   await p.keyboard.press('ArrowDown');assert.notEqual(await id(),first);await p.keyboard.press('ArrowLeft');assert.equal(await id(),first);
   await p.locator('.lesson-content').focus();await p.keyboard.press('ArrowRight');assert.notEqual(await id(),first,'focused reading region must retain left/right step navigation');await p.keyboard.press('ArrowLeft');assert.equal(await id(),first);
   if(l<2){await p.evaluate(l=>showStep(l===0?13:3,false),l);const quiz=await id();await p.locator('.quiz-option').first().focus();await p.keyboard.press('ArrowRight');assert.equal(await id(),quiz);assert.equal(await p.locator('#nextBtn').isDisabled(),true);}
   else{await p.locator('#nextBtn').click();await p.locator('#nextBtn').click();const stage=await id();await p.locator('#invertButton').focus();await p.keyboard.press('ArrowLeft');assert.equal(await id(),stage);await p.keyboard.press('Space');assert.equal(await p.locator('#invertButton').getAttribute('aria-pressed'),'true');}
   await p.evaluate(()=>{const x=document.createElement('input');x.id='key-test-input';document.querySelector('.lesson-content').append(x);x.focus();});const before=await id();await p.keyboard.press('ArrowRight');assert.equal(await id(),before);await p.keyboard.type('text');assert.equal(await p.locator('#key-test-input').inputValue(),'text');
   if(l<2)await p.evaluate(i=>showStep(i,false),l===0?22:25);else {await p.locator('#key-test-input').evaluate(e=>e.remove());await p.locator('#nextBtn').click();}
   await settle(p);await verifyTitles();assert.equal(await p.locator('.theory-keyboard-hint').count(),0);
   assert.deepEqual(c.errors,[]);
  }finally{await c.context.close();}
 }}finally{await browser.close();await server.close();}
});
test('preview feedback: real VexFlow standalone start bars hidden, meaningful internal/end bars preserved',async()=>{
 const server=await serve(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(let l=0;l<2;l++){
  const c=await open(browser,server.url,files[l]),p=c.page;
  try{
   await p.evaluate(()=>{window.__barTypes=[];const VF=vf(),draw=VF.Stave.prototype.draw;VF.Stave.prototype.draw=function(...args){const m=this.getModifiers();__barTypes.push({begin:m.find(x=>x.getCategory()==='Barline'&&x.getPosition()===VF.StaveModifier.Position.BEGIN)?.getType(),end:m.find(x=>x.getCategory()==='Barline'&&x.getPosition()===VF.StaveModifier.Position.END)?.getType()});return draw.apply(this,args);};});
   for(let i=0;i<(l===0?23:26);i++){await p.evaluate(i=>showStep(i,false),i);await settle(p);}
   const bars=await p.evaluate(()=>__barTypes);assert(bars.length>5);assert(bars.every(b=>b.begin===7),'standalone staves must use Barline.NONE at start');assert(bars.every(b=>b.end===1),'meaningful end bars retain original SINGLE type');
   await p.evaluate(()=>showStep(5,false));assert(await p.locator('#lessonBoard .vf-barnote').count()>0,'internal VexFlow BarNotes must remain');
   await p.evaluate(i=>showStep(i,false),l===0?20:9);await settle(p);
   const dividers=await p.locator('#lessonBoard svg line').evaluateAll(lines=>lines.filter(e=>e.getAttribute('x1')===e.getAttribute('x2')).length);assert(l===0?dividers>0:await p.locator('#lessonBoard .vf-barnote').count()>0,'course-specific structural measure divider remains');
   await p.screenshot({path:path.join(OUT,`feedback-mt0${l+1}-structural-bars.png`),caret:'initial'});
   assert.deepEqual(c.errors,[]);
  }finally{await c.context.close();}
 }}finally{await browser.close();await server.close();}
});

test('vertical reading: requested screenshots and continuous real-time FLIP frames',async()=>{
 fs.mkdirSync(OUT,{recursive:true});const server=await serve(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const evidence=[];
 try{
  for(const [l,width,height,indices] of [[0,1280,900,[0,4,8]],[1,1280,900,[0,2]],[0,390,844,[0]],[0,844,390,[0]]]){
   const c=await open(browser,server.url,files[l],{width,height,touch:width<1100}),p=c.page;
   try{for(const i of indices){await p.evaluate(i=>showStep(i,false),i);await settle(p);await p.screenshot({path:path.join(OUT,`vertical-mt0${l+1}-step${i+1}-${width}x${height}.png`),caret:'initial'});}}finally{await c.context.close();}
  }
  for(const l of [0,1]){
   const c=await open(browser,server.url,files[l],{width:1280,height:900,motion:'no-preference'}),p=c.page;
   try{
    const begin=l===0?5:0,end=l===0?8:2;
    await p.evaluate(i=>showStep(i,false),begin);await settle(p);
    const framesDir=path.join(OUT,`mt0${l+1}-continuous-frames`);fs.mkdirSync(framesDir,{recursive:true});
    const client=await c.context.newCDPSession(p),captures=[];
    client.on('Page.screencastFrame',event=>{
     const file=path.join(framesDir,`${String(captures.length).padStart(4,'0')}.png`);
     fs.writeFileSync(file,Buffer.from(event.data,'base64'));captures.push({file,time:event.metadata.timestamp});
     void client.send('Page.screencastFrameAck',{sessionId:event.sessionId});
    });
    await client.send('Page.startScreencast',{format:'png',maxWidth:1280,maxHeight:900,everyNthFrame:1});
    const samples=await p.evaluate(async({begin,end})=>{
     const viewport=document.querySelector('.lesson-content'),inner=viewport.firstElementChild,results=[];
     for(let i=begin+1;i<=end;i++){
      const retained=inner.firstElementChild,previousY=retained.getBoundingClientRect().top;showStep(i);const initialY=retained.getBoundingClientRect().top,frames=[];
      for(let n=0;n<32;n++){await new Promise(r=>requestAnimationFrame(r));frames.push({time:performance.now(),top:retained.getBoundingClientRect().top,scroll:viewport.scrollTop,opacity:getComputedStyle(inner.lastElementChild).opacity,page:scrollY});}
      results.push({step:i+1,previousY,initialY,frames});
     }return results;
    },{begin,end});
    await client.send('Page.stopScreencast');await client.detach();
    evidence.push({lesson:l+1,samples,captures});
    for(const step of samples){
     const ys=step.frames.map(f=>f.top),last=ys.at(-1);
     assert(Math.abs(step.initialY-step.previousY)<.6,'layout commit must preserve old text position before motion');
     assert(step.previousY-last>10,'old text must actually move upward');
     assert(new Set(ys.filter(y=>y>last+.5&&y<step.previousY-.5).map(y=>y.toFixed(1))).size>=4,'must observe multiple intermediate FLIP positions');
     assert(step.frames.every(f=>f.scroll===0&&f.page===0),'fitting paragraphs must move without scrolling either viewport or page');
     assert(step.frames.some(f=>Number(f.opacity)>0&&Number(f.opacity)<1));
    }
    assert(captures.length>8,'capture actual animation frames');
    const concat=captures.map((f,i)=>`file '${f.file}'\nduration ${Math.max(.001,(captures[i+1]?.time||f.time+.04)-f.time)}`).join('\n');
    const manifest=path.join(framesDir,'timing.txt');fs.writeFileSync(manifest,concat+'\n');
    cp.execFileSync('/usr/bin/ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',manifest,'-vsync','vfr','-c:v','libvpx-vp9','-pix_fmt','yuv420p',path.join(OUT,`mt0${l+1}-continuous.webm`)]);
    assert.deepEqual(c.errors,[]);assert.deepEqual(c.missing,[]);
   }finally{await c.context.close();}
  }
 }finally{fs.writeFileSync(path.join(OUT,'vertical-motion.json'),JSON.stringify(evidence,null,2));await browser.close();await server.close();}
});
test('vertical reading: threshold, oversized paragraph, snapshot return, keyboard takeover and reduced motion',async()=>{
 const server=await serve(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const motion of ['no-preference','reduce']){
  const c=await open(browser,server.url,files[0],{width:1280,height:900,motion}),p=c.page;
  try{
   await p.locator('#startLearning').click();
   // Deterministic test-only content: fixed viewport, exact fit, slight overflow,
   // then a paragraph taller than the viewport. Production course text is untouched.
   await p.evaluate(()=>{
    const viewport=document.querySelector('.lesson-content'),inner=viewport.firstElementChild;
    viewport.style.height='220px';viewport.style.flex='none';viewport.style.alignSelf='center';
    window.__view=TheoryLesson.create({board:document.querySelector('#lessonBoard'),explanation:inner,viewport});
    const paragraph=(n,height)=>`<p data-fixture="${n}" style="height:${height}px;margin:0">测试段落 ${n}</p>`;
    window.__fixtureSteps=[
     {id:'short',kind:'new-concept',explanation:()=>paragraph(1,80)},
     {id:'fit',kind:'continuation',explanation:()=>paragraph(1,80)+paragraph(2,120)},
     {id:'overflow',kind:'continuation',explanation:()=>paragraph(1,80)+paragraph(2,120)+paragraph(3,45)},
     {id:'long',kind:'continuation',explanation:()=>paragraph(1,80)+paragraph(2,120)+paragraph(3,45)+paragraph(4,400)}
    ].map(s=>({...s,groupId:'test',boardKey:'test',size:'compact'}));
    __view.show(__fixtureSteps[0]);
   });
   const measurements=()=>p.locator('.lesson-content').evaluate(e=>({top:e.firstElementChild.getBoundingClientRect().top-e.getBoundingClientRect().top,height:e.firstElementChild.getBoundingClientRect().height,viewport:e.clientHeight,scroll:e.scrollTop,max:e.scrollHeight-e.clientHeight}));
   assert.equal((await measurements()).top,70);
   const frames=await p.evaluate(async()=>{
    const e=document.querySelector('.lesson-content'),inner=e.firstElementChild,frames=[];
    __view.show(__fixtureSteps[1],{forward:true});await new Promise(r=>setTimeout(r,500));
    const previous=inner.firstElementChild.getBoundingClientRect().top;
    __view.show(__fixtureSteps[2],{forward:true});const initial=inner.firstElementChild.getBoundingClientRect().top;
    for(let i=0;i<36;i++){await new Promise(r=>requestAnimationFrame(r));frames.push({top:inner.firstElementChild.getBoundingClientRect().top,previous,initial,scroll:e.scrollTop});}return frames;
   });
   if(motion==='no-preference'){
    assert(Math.abs(frames[0].initial-frames[0].previous)<.6,'threshold must preserve old text before motion '+JSON.stringify(frames[0]));
    assert(new Set(frames.map(f=>f.top.toFixed(2))).size>5,'threshold must animate continuously');
   }else assert.equal(await p.locator('.theory-explanation').evaluate(e=>e.getAnimations().length),0);
   let m=await measurements();assert.equal(m.height,245);assert.equal(m.max,25);assert(Math.abs(m.top+m.scroll)<1);
   // A real reader chooses an offset, moves back twice into centered content,
   // then forward again. Snapshots must retain both node count and scroll.
   await p.locator('.lesson-content').evaluate(e=>e.scrollTop=12);
   await p.evaluate(()=>__view.show(__fixtureSteps[1]));m=await measurements();assert.equal(m.top,10);assert.equal(m.scroll,0);
   await p.evaluate(()=>__view.show(__fixtureSteps[0]));assert.equal((await measurements()).top,70);assert.equal(await p.locator('[data-fixture]').count(),1);
   await p.evaluate(()=>__view.show(__fixtureSteps[1],{forward:true}));assert.equal((await measurements()).top,10);
   await p.evaluate(()=>__view.show(__fixtureSteps[2],{forward:true}));assert.equal((await measurements()).scroll,12);assert.equal(await p.locator('[data-fixture]').count(),3);
   await p.evaluate(()=>__view.show(__fixtureSteps[3],{forward:true}));await p.waitForTimeout(650);
   const long=await p.locator('[data-fixture="4"]').boundingBox(),viewport=await p.locator('.lesson-content').boundingBox();
   assert(long.y>=viewport.y-1&&long.y<=viewport.y+7,'oversized paragraph must start at its top, not its bottom');
   await p.locator('.lesson-content').evaluate(e=>e.scrollTop=e.scrollHeight);m=await measurements();assert.equal(m.scroll,m.max);
   await p.locator('.lesson-content').focus();const id=await p.locator('.lesson-content').getAttribute('data-step-id');
   await p.keyboard.press('Home');await p.waitForTimeout(400);assert.equal((await measurements()).scroll,0);assert.equal(await p.locator('.lesson-content').getAttribute('data-step-id'),id,'reading keys must not navigate');
   await p.evaluate(()=>{__view.show({...__fixtureSteps[3],id:'fresh-long'},{forward:true});document.querySelector('.lesson-content').dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}));document.querySelector('.lesson-content').scrollTop=19;});
   await p.waitForTimeout(650);assert.equal((await measurements()).scroll,19,'keyboard takeover must cancel queued auto-positioning');
   assert.deepEqual(c.errors,[]);assert.deepEqual(c.missing,[]);
  }finally{await c.context.close();}
 }}finally{await browser.close();await server.close();}
});

test('independent alignment: actual painted bounds, requested screenshots and orientation restoration',async()=>{
 fs.mkdirSync(OUT,{recursive:true});const records=[],server=await serve(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const targets=[[0,0,1280,900],[0,8,1280,900],[1,0,1280,900],[1,2,1280,900],[0,0,390,844],[1,0,390,844],[0,0,844,390],[0,0,768,1024],[0,0,1024,768]];
 try{
  for(const [l,i,width,height] of targets){
   const c=await open(browser,server.url,files[l],{width,height,touch:width<1100}),p=c.page;
   try{
    await p.evaluate(i=>showStep(i,false),i);await settle(p);
    const music=await p.evaluate(musicGeometry),text=await p.locator('.lesson-content').evaluate(e=>{const r=e.getBoundingClientRect(),n=e.firstElementChild.getBoundingClientRect();return {mode:getComputedStyle(e.parentElement).display,top:n.top-r.top,delta:n.top+n.height/2-r.top-r.height/2,overflow:n.height>e.clientHeight};});
    assert(Math.abs(music.delta)<=8,JSON.stringify(music));assert.equal(music.scroll,0);
    if(text.mode==='grid'&&!text.overflow)assert(Math.abs(text.delta)<1);else assert(Math.abs(text.top)<1);
    const name=`mt0${l+1}-step${i+1}-${width}x${height}.png`;await p.screenshot({path:path.join(OUT,name),caret:'initial'});
    records.push({lesson:l+1,step:i+1,width,height,music,text,screenshot:name});
    // Layout changes reflow the same drawing/content nodes, never recreate the
    // notation to achieve centering. Portrait always reads from its own top.
    await p.evaluate(()=>{window.__score=document.querySelector('.theory-board-content svg');window.__copy=document.querySelector('.theory-explanation').firstElementChild;});
    for(const size of [{width:390,height:844},{width:844,height:390},{width,height}]){
     await p.setViewportSize(size);await settle(p);
     assert.equal(await p.evaluate(()=>__score===document.querySelector('.theory-board-content svg')&&__copy===document.querySelector('.theory-explanation').firstElementChild),true);
     const g=await p.evaluate(musicGeometry);if(g.height<=g.usable+.5)assert(Math.abs(g.delta)<=8,JSON.stringify(g));
     const a=await p.locator('.lesson-content').evaluate(e=>({mode:getComputedStyle(e.parentElement).display,top:e.firstElementChild.getBoundingClientRect().top-e.getBoundingClientRect().top+e.scrollTop}));
     if(a.mode!=='grid')assert(Math.abs(a.top)<1,'stacked explanation must stay top-aligned after rotation');
    }
    assert.deepEqual(c.errors,[]);assert.deepEqual(c.missing,[]);
   }finally{await c.context.close();}
  }
  // Absolute role labels and melodic leaders belong to the music group too.
  const c=await open(browser,server.url,files[0],{width:1280,height:900}),p=c.page;
  try{
   for(const i of [1,11]){
    await p.evaluate(i=>showStep(i,false),i);await settle(p);
    const anchor=await p.evaluate(()=>{const line=document.querySelector('.melodic-leader');if(!line)return null;const wrap=line.parentElement.getBoundingClientRect(),svg=document.querySelector('#melodicStaff svg');return new DOMPoint(wrap.left+parseFloat(line.style.left),wrap.top+parseFloat(line.style.top)+5).matrixTransform(svg.getScreenCTM().inverse()).toJSON();});
    for(const size of [{width:390,height:844},{width:844,height:390},{width:1280,height:900}]){
     await p.setViewportSize(size);await settle(p);const g=await p.evaluate(musicGeometry);if(g.height<=g.usable+.5)assert(Math.abs(g.delta)<=8,'labels/leaders must share centered bounds after rotation '+JSON.stringify(g));
     const delta=await p.evaluate(anchor=>{
      if(anchor){const line=document.querySelector('.melodic-leader'),wrap=line.parentElement.getBoundingClientRect(),svg=document.querySelector('#melodicStaff svg'),expected=new DOMPoint(anchor.x,anchor.y).matrixTransform(svg.getScreenCTM());return Math.max(Math.abs(parseFloat(line.style.left)+wrap.left-expected.x),Math.abs(parseFloat(line.style.top)+wrap.top+5-expected.y));}
      const labels=[...document.querySelectorAll('.board-note-role.visible')],notes=[...document.querySelectorAll('#mainBoardStaff .vf-stavenote')];return Math.max(...labels.map((label,n)=>{const a=label.getBoundingClientRect(),b=notes[n?notes.length-1:0].getBoundingClientRect();return Math.abs(a.left+a.width/2-b.left-b.width/2);}));
     },anchor);assert(delta<1,'HTML annotations must remain attached to the music after rotation');
    }
   }
   await p.evaluate(()=>showStep(1,false));await settle(p);assert(Math.abs((await p.evaluate(musicGeometry)).delta)<=8,'cached label group must relayout on restore');
   await p.evaluate(()=>showStep(11,false));await settle(p);
   const frame=p.locator('.theory-board-content'),b=await p.locator('#lessonBoard').boundingBox();
   await frame.evaluate(e=>e.style.minHeight='950px');await frame.evaluate(e=>{const x=document.createElement('p');x.textContent='测试用溢出内容';x.style.marginTop='900px';e.append(x);});
   await p.locator('#lessonBoard').evaluate(e=>e.scrollTop=0);const start=await frame.boundingBox();assert(start.y>=b.y,'overflow must retain an accessible start');
   await p.locator('#lessonBoard').evaluate(e=>e.scrollTop=e.scrollHeight);const last=await frame.locator('p').last().boundingBox();assert(last.y+last.height<=b.y+b.height+1,'complex board bottom must be reachable');
  }finally{await c.context.close();}
 }finally{fs.writeFileSync(path.join(OUT,'alignment-targets.json'),JSON.stringify(records,null,2));await browser.close();await server.close();}
});
test('independent alignment: stacked continuations fade without moving retained text before overflow',async()=>{
 const server=await serve(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const l of [0,1]){
  const c=await open(browser,server.url,files[l],{width:768,height:1024,motion:'no-preference',touch:true}),p=c.page;
  try{
   await p.locator('#startLearning').click();await settle(p);
   const samples=await p.evaluate(async()=>{
    const inner=document.querySelector('.theory-explanation'),viewport=inner.parentElement,first=inner.firstElementChild,start=first.getBoundingClientRect().top;
    showStep(1);const frames=[];
    for(let i=0;i<30;i++){await new Promise(r=>requestAnimationFrame(r));frames.push({top:first.getBoundingClientRect().top,scroll:viewport.scrollTop,transform:getComputedStyle(inner).transform,opacity:getComputedStyle(inner.lastElementChild).opacity,page:scrollY});}
    return {start,frames};
   });
   assert(samples.frames.every(f=>Math.abs(f.top-samples.start)<1&&f.scroll===0&&f.page===0&&f.transform==='none'),'stacked content must not drift');
   assert(samples.frames.some(f=>Number(f.opacity)>0&&Number(f.opacity)<1),'new text must still fade in');
   const board=await p.evaluate(musicGeometry);await p.locator('#prevBtn').click();await p.locator('#nextBtn').click();await settle(p);const after=await p.evaluate(musicGeometry);assert(Math.abs(after.delta-board.delta)<1,'explanation navigation must not move the retained music');
  }finally{await c.context.close();}
 }}finally{await browser.close();await server.close();}
});
