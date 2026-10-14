// New-design acceptance. No historical PNG comparison or raster approval gate.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{execFileSync}=require('node:child_process'),{chromium}=require('playwright');
const H=require('../course-baseline/harness.cjs');
const BASE='9a4ae6b260feb4f25605bbf2ba335b116241d52a';
const courses=JSON.parse(fs.readFileSync(path.join(__dirname,'../course-baseline/baseline.json'))).visualUnification.courses;
const views=[[320,812],[390,844],[430,932],[768,1024],[1024,768],[1280,900]];
const output=process.env.COURSE_DESIGN_OUTPUT||'/tmp/course-unification/visual';
let browser,server;const results=[];
before(async()=>{fs.mkdirSync(output,{recursive:true});server=await H.serve();browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});});
after(async()=>{fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify({baseline:BASE,pages:courses.length,views,themes:['light','dark'],results},null,2));await browser?.close();await server?.close();});
function original(f){return execFileSync('git',['show',BASE+':'+f],{cwd:H.ROOT}).toString();}
test('All course URLs, teaching DOM, question data and every JavaScript source are immutable',()=>{
 for(const c of courses){const current=fs.readFileSync(path.join(H.ROOT,c.path),'utf8'),old=original(c.path);assert.equal(current.slice(current.indexOf('<body')),old.slice(old.indexOf('<body')),c.path);assert.deepEqual(H.scripts(current),H.scripts(old));for(const js of H.scripts(current))new vm.Script(js);assert.equal((current.match(/<html[^>]*>/)[0].match(/data-course=/g)||[]).length,1,c.path);}
 const files=execFileSync('git',['ls-tree','-r','--name-only',BASE,'ET-Intervals','MT-Intervals'],{cwd:H.ROOT}).toString().split('\n').filter(f=>f.endsWith('.js'));
 for(const f of files)assert.equal(fs.readFileSync(path.join(H.ROOT,f),'utf8'),original(f),f);
});
async function check(page,label){
 await page.evaluate(()=>{for(const a of document.getAnimations()){try{a.finish();}catch{}}});
 const r=await page.evaluate(()=>{
  const root=document.documentElement;const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0';};
  const buttons=[...document.querySelectorAll('button')].filter(visible).filter(e=>!e.closest('.lesson-board,.keyboard,.compact-keyboard,.staff-question,.staff,.stage'));
  const painted=e=>{let r=e.getBoundingClientRect();let x=Math.max(0,r.left),y=Math.max(0,r.top),right=Math.min(innerWidth,r.right),bottom=Math.min(innerHeight,r.bottom);if(getComputedStyle(e).position!=='fixed')for(let p=e.parentElement;p;p=p.parentElement){const s=getComputedStyle(p),b=p.getBoundingClientRect();if(/hidden|auto|scroll|clip/.test(s.overflowX)){x=Math.max(x,b.left+p.clientLeft);right=Math.min(right,b.left+p.clientLeft+p.clientWidth);}if(/hidden|auto|scroll|clip/.test(s.overflowY)){y=Math.max(y,b.top+p.clientTop);bottom=Math.min(bottom,b.top+p.clientTop+p.clientHeight);}}return {left:x,top:y,right,bottom};};
  const overlap=[];for(let i=0;i<buttons.length;i++)for(let j=i+1;j<buttons.length;j++){const a=painted(buttons[i]),b=painted(buttons[j]);if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)overlap.push([buttons[i].id||buttons[i].className,buttons[j].id||buttons[j].className]);}
  const clipped=buttons.filter(e=>e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2).map(e=>({id:e.id,class:e.className,scroll:[e.scrollWidth,e.scrollHeight],client:[e.clientWidth,e.clientHeight]}));
  const expectedAccent=document.createElement('span');expectedAccent.style.color='var(--site-on-accent)';document.body.append(expectedAccent);const onAccent=getComputedStyle(expectedAccent).color;expectedAccent.remove();const badPrimary=buttons.filter(e=>e.matches('.primary,.primary-btn,.next')&&!e.disabled).filter(e=>getComputedStyle(e).color!==onAccent).map(e=>e.id||e.className);
  const unreadable=buttons.filter(e=>!e.disabled&&e.textContent.trim()).filter(e=>{const s=getComputedStyle(e),rgba=v=>(v.match(/[\d.]+/g)||[]).map(Number),a=rgba(s.color),b=rgba(s.backgroundColor);return b.length>=3&&(!b[3]||b[3]===1)&&Math.max(...a.slice(0,3).map((v,i)=>Math.abs(v-b[i])))<12;}).map(e=>e.id||e.className);
  const cards=[...document.querySelectorAll('.card,.card-container')].filter(visible).map(e=>({radius:getComputedStyle(e).borderTopLeftRadius,padding:getComputedStyle(e).paddingTop,width:e.getBoundingClientRect().width}));
  return {width:innerWidth,overflow:Math.max(root.scrollWidth,document.body.scrollWidth)-innerWidth,background:getComputedStyle(document.body).backgroundColor,theme:getComputedStyle(root).getPropertyValue('--site-bg').trim(),cards,overlap,clipped,unreadable,badPrimary,minButtons:buttons.filter(e=>e.getBoundingClientRect().height<43).map(e=>e.id||e.className)};
 });
 assert.ok(r.overflow<=1,label+' horizontal overflow '+JSON.stringify(r));assert.deepEqual(r.overlap,[],label+' overlapping buttons');assert.deepEqual(r.clipped,[],label+' clipped button text');assert.deepEqual(r.minButtons,[],label+' small touch target');assert.deepEqual(r.unreadable,[],label+' unreadable control colors');assert.deepEqual(r.badPrimary,[],label+' primary foreground theme');for(const c of r.cards)assert.equal(c.radius,'8px',label+' card radius');
 assert.equal(r.background,await page.evaluate(()=>{const e=document.createElement('span');e.style.background='var(--site-bg)';document.body.append(e);const v=getComputedStyle(e).backgroundColor;e.remove();return v;}),label+' theme background');
 return r;
}
for(const course of courses)test(course.path+' new design / responsive / teaching interactions',async()=>{
 for(const [width,height] of views)for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height},colorScheme:theme,reducedMotion:'reduce'});await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());await context.addInitScript(H.installMocks);
  const page=await context.newPage(),errors=[],bad=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.request().resourceType()!=='other')bad.push(r.url());});
  const label=course.path+' '+width+' '+theme;const states=[];
  try{
   assert.equal((await page.goto(server.url+'/'+course.path,{waitUntil:'load'})).status(),200);states.push({state:'initial',layout:await check(page,label+' initial')});
   if(course.type==='et-sing'){
    await page.evaluate(()=>startTargetTone());states.push({state:'playing',layout:await check(page,label+' playing')});await page.evaluate(()=>stopTargetTone());
    await page.evaluate(()=>{if(document.getElementById('lowMicBtn'))return startMic('low');return startMic();});states.push({state:'recording',layout:await check(page,label+' recording')});await page.evaluate(()=>stopMic());
    await page.evaluate(()=>{let seed=1729;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};restartPractice();for(let i=0;i<10;i++){generateQuestion();if(typeof lowCaptured!=='undefined'){lowCaptured=true;highCaptured=true;checkAllPassed();}else{const pc=((currentTargetMidi%12)+12)%12;checkPassCondition(midiToNoteName(currentTargetMidi),midiToFreq(currentTargetMidi),0,pc,pc);__clock+=250;checkPassCondition(midiToNoteName(currentTargetMidi),midiToFreq(currentTargetMidi),0,pc,pc);}__clock+=250;}finishPractice();});states.push({state:'report',layout:await check(page,label+' report')});
   }else if(course.type==='et-quiz'){
    await page.evaluate(()=>startTest());states.push({state:'question',layout:await check(page,label+' question')});
   }else if(course.type==='mt-practice'){
    const qs=await page.evaluate(()=>practiceData.questions);assert.ok(qs.length>0);for(const q of qs){assert.ok(q.correctAnswer.every(a=>q.options.some(o=>o.value===a)));assert.equal(new Set(q.options.map(o=>o.value)).size,q.options.length);}
    await page.locator('#startPracticeBtn').click();await page.locator('#questionNavToggle').click();states.push({state:'question',layout:await check(page,label+' question')});
    if(width===1280&&theme==='light'){
     for(let i=0;i<qs.length;i++){await page.locator('.question-nav-btn').nth(i).click();await page.locator('#optionsGrid .option-btn').evaluateAll((bs,ans)=>{for(const b of bs)if(ans.includes(b.dataset.value))b.click();},qs[i].correctAnswer);await page.locator('#confirmBtn').click();}await page.locator('#nextBtn').click();states.push({state:'result',layout:await check(page,label+' result')});
    }
   }else if(course.path.includes('lesson06')){
    await page.locator('#startReview').click();for(let i=0;i<4;i++){states.push({state:'module-'+i,layout:await check(page,label+' module '+i)});await page.locator('#nextBtn').click();}states.push({state:'complete',layout:await check(page,label+' complete')});
   }else{
    await page.evaluate(()=>startLesson());const n=await page.evaluate(()=>steps.length);for(let i=0;i<n;i++){await page.evaluate(i=>showStep(i,false),i);states.push({state:'step-'+i,layout:await check(page,label+' step '+i)});}if(width===390||width===1024)await page.screenshot({path:path.join(output,course.path.replaceAll('/','_')+'-'+width+'-'+theme+'-lesson.png'),fullPage:true,caret:'initial',animations:'disabled'});await page.evaluate(()=>showSummary());states.push({state:'complete',layout:await check(page,label+' complete')});
   }
   assert.deepEqual(errors,[],label+' page errors');assert.deepEqual(bad,[],label+' resources');
   if(width===390||width===1024)await page.screenshot({path:path.join(output,course.path.replaceAll('/','_')+'-'+width+'-'+theme+'.png'),fullPage:true,caret:'initial',animations:'disabled'});
   results.push({course:course.path,width,height,theme,status:'PASS',states:states.map(s=>s.state)});
  }catch(e){results.push({course:course.path,width,height,theme,status:'FAIL',error:e.message});throw e;}finally{await context.close();}
 }
});

test('All ordinary primary controls use the shared Light/Dark foreground',async()=>{
 for(const course of courses)for(const colorScheme of ['light','dark']){
  const context=await browser.newContext({viewport:{width:1024,height:768},colorScheme,reducedMotion:'reduce'});await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());await context.addInitScript(H.installMocks);
  try{const page=await context.newPage();await page.goto(server.url+'/'+course.path,{waitUntil:'load'});
   if(course.type==='mt-learning'&&!course.path.includes('lesson06'))await page.evaluate(()=>{startLesson();showStep(steps.length-1,false)});
   const mismatches=await page.evaluate(()=>{const probe=document.createElement('span');probe.style.color='var(--site-on-accent)';document.body.append(probe);const expected=getComputedStyle(probe).color;probe.remove();return [...document.querySelectorAll('.primary,.primary-btn,.next')].filter(e=>!e.disabled&&!e.closest('.lesson-board,.staff,.stage')&&e.getBoundingClientRect().width>0).filter(e=>getComputedStyle(e).color!==expected).map(e=>({id:e.id,color:getComputedStyle(e).color,expected}));});assert.deepEqual(mismatches,[],course.path+' '+colorScheme);
  }finally{await context.close();}
 }
});
