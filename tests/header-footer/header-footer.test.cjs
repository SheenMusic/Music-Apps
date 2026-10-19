const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), cp = require('node:child_process'), path = require('node:path'), vm = require('node:vm');
const {chromium} = require('playwright');
const {serve,scripts} = require('../course-baseline/harness.cjs');
const P = require('./protection.cjs');
const old = p => cp.execFileSync('git',['show',P.BASE+':'+p],{maxBuffer:8*1024*1024});
const OUT = process.env.CHROME_ARTIFACT_DIR || '/tmp/music-apps-header-footer';
const sizes = [[320,700],[375,812],[390,844],[844,390],[768,1024],[1280,900]];
const themes = ['light','dark'];
const representative = new Set([1,2,5,6,7,18]);
const cache = new Map();
async function open(browser,url,file,{before=false,width=390,height=844,theme='light'}={}) {
 const context=await browser.newContext({viewport:{width,height},colorScheme:theme,reducedMotion:'reduce'});
 await context.addInitScript(()=>{
  Math.random=()=>.5;Date.now=()=>1000000;window.alert=()=>{};window.confirm=()=>true;window.__copy='';
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async s=>{window.__copy=s;}}});
 });
 await context.route('**/*',r=>{
  const u=new URL(r.request().url());
  if(u.hostname==='cdn.jsdelivr.net')return r.fulfill({path:'/tmp/vexflow.js',contentType:'application/javascript'});
  if(u.origin!==url)return r.fulfill({body:'',contentType:'application/javascript'});
  if(!before)return r.continue();
  const p=decodeURIComponent(u.pathname).slice(1);
  try{if(!cache.has(p))cache.set(p,old(p));return r.fulfill({body:cache.get(p),contentType:({'.html':'text/html','.js':'application/javascript','.css':'text/css','.mp3':'audio/mpeg'})[path.extname(p)]||'application/octet-stream'});}catch{return r.fulfill({status:404,body:''});}
 });
 const page=await context.newPage(),errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(url)&&r.status()>=400)missing.push(r.url());});
 await page.goto(url+'/'+file);await page.evaluate(()=>document.fonts.ready);
 return {page,context,errors,missing};
}
function measure(selector) {
 const e=document.querySelector(selector),s=getComputedStyle(e),r=e.getBoundingClientRect();
 return {text:e.textContent.trim(),font:s.fontFamily,size:s.fontSize,weight:s.fontWeight,line:s.lineHeight,spacing:s.letterSpacing,color:s.color,
  muted:getComputedStyle(document.documentElement).getPropertyValue('--site-muted').trim(),rect:{x:r.x,y:r.y,width:r.width,height:r.height},padding:s.padding,bg:s.backgroundColor};
}
function noOverlap() {
 const bar=document.querySelector('.header-top-bar')||document.querySelector('.topbar')||document.querySelector('.top-header');
 const visible=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0;};
 const elements=[...bar.children].flatMap(e=>e.classList.contains('header-right-group')||e.classList.contains('topbar-right')?[...e.children]:[e]).filter(visible);
 const overlaps=[];for(let i=0;i<elements.length;i++)for(let j=i+1;j<elements.length;j++){
  const a=elements[i].getBoundingClientRect(),b=elements[j].getBoundingClientRect();
  if(a.right>b.left+.5&&b.right>a.left+.5&&a.bottom>b.top+.5&&b.bottom>a.top+.5)overlaps.push([elements[i].textContent,elements[j].textContent]);
 }
 const outside=elements.filter(e=>{const r=e.getBoundingClientRect();return r.left<-.5||r.right>innerWidth+.5;}).map(e=>e.textContent);
 return {overlaps,outside,overflow:document.documentElement.scrollWidth>innerWidth+1};
}
const ordinaryProperties=['font-family','font-size','font-weight','font-style','line-height','letter-spacing','color','background-color','background-image','border-color','border-width','border-radius','padding','margin','display','position','overflow','gap','max-width','box-sizing','flex-direction'];
function earBody(properties) {
 return [...document.body.querySelectorAll('*')].filter(e=>!e.closest('.topbar,.top-header,footer,.footer-bar')&&!['SCRIPT','STYLE'].includes(e.tagName)).map(e=>{
  const s=getComputedStyle(e);return {tag:e.tagName,id:e.id,text:e.childElementCount?null:e.textContent,styles:properties.map(p=>[p,s.getPropertyValue(p)])};
 });
}
async function complete(page) {
 await page.evaluate(()=>{
  for(const q of practiceData.questions){
   for(const b of document.querySelectorAll('#optionsGrid button'))if(q.correctAnswer.includes(b.dataset.value))b.click();
   document.getElementById('confirmBtn').click();document.getElementById('nextBtn').click();
  }
 });
 assert(await page.locator('#resultScreen').isVisible());
}
test('exact source scope: only headers/typography change, with teaching, reports, data and all unrelated modules protected',()=>{
 assert.equal(P.earPages.length,18);
 for(const p of P.earPages){
  const current=fs.readFileSync(p,'utf8'),before=old(p).toString();assert.equal(P.earHTML(current),before,p);
  if(p.includes('/01-')||p.includes('/02-')){const css=p.replace('index.html','style.css');assert.equal(P.earSimpleCSS(fs.readFileSync(css,'utf8')),P.earSimpleCSS(old(css).toString()),css+' non-font declarations');assert.equal(fs.readFileSync(p.replace('index.html','script.js'),'utf8'),old(p.replace('index.html','script.js')).toString());}
 }
 assert.equal(P.practice(fs.readFileSync('shared/practice/practice-ui.js','utf8')),P.practice(old('shared/practice/practice-ui.js').toString()));
 for(let i=1;i<=5;i++){
  const p=`MT-Intervals/lesson0${i}/index.html`,now=fs.readFileSync(p,'utf8'),before=old(p).toString();
  assert.deepEqual(scripts(now).map(P.learningJS),scripts(before).map(P.learningJS),p+' teaching JS');
  const html=s=>P.learningDOM(s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace('<span class="lesson-count">开始</span>',''));
  assert.equal(html(now),html(before),p+' teaching DOM');
  assert.equal(fs.readFileSync(p.replace('index.html','practice/questions.js'),'utf8'),old(p.replace('index.html','practice/questions.js')).toString());
 }
 for(const p of ['shared/practice/practice-engine.js','shared/styles/practice-base.css','shared/notation/notation-config.js','shared/notation/notation-renderer.js','shared/notation/notation-styles.css','assets/practice-report.js','ET-Intervals/shared/styles/base.css'])assert.equal(fs.readFileSync(p,'utf8'),old(p).toString(),p);
 const changed=cp.execFileSync('git',['diff','--name-only','--no-renames',P.BASE],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 const untracked=cp.execFileSync('git',['ls-files','--others','--exclude-standard'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 for(const f of [...changed,...untracked])assert(P.allowed.has(f),'Unexpected source: '+f);
 for(const f of [...changed,...untracked].filter(f=>f.endsWith('.js')||f.endsWith('.cjs')))new vm.Script(fs.readFileSync(f,'utf8'),{filename:f});
});
test('ET01–18: actual header/footer typography and layout at six sizes in both themes',async t=>{
 const s=await serve(),b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});fs.mkdirSync(OUT,{recursive:true});const evidence=[];
 try{for(const file of P.earPages){const n=Number(path.basename(path.dirname(file)).slice(0,2));for(const [width,height]of sizes)for(const theme of themes)await t.test(`ET${n}-${width}x${height}-${theme}`,async()=>{
  const c=await open(b,s.url,file,{width,height,theme}),p=c.page;
  const header=await p.evaluate(measure,n<=2?'.topbar':'.top-header'),footer=await p.evaluate(measure,'footer');
  for(const x of [header,footer]){assert.equal(x.size,'12px');assert.equal(x.weight,'300');assert.equal(x.line,'18px');assert(x.font.includes('PingFang SC'));}
  assert.equal(header.spacing,'0.3px');assert.equal(footer.spacing,'normal');assert(header.text.startsWith('EAR TRAINING'));assert.equal(footer.text,'©Sheen · Ear Training');
  const colors=await p.evaluate(()=>{const e=document.createElement('span');e.style.color='var(--site-muted)';document.body.append(e);const value=getComputedStyle(e).color;e.remove();return value;});
  assert.equal(header.color,colors);assert.equal(footer.color,colors);
  assert.deepEqual(await p.evaluate(noOverlap),{overlaps:[],outside:[],overflow:false});
  if(representative.has(n)&&[390,1280].includes(width)){
   const before=await open(b,s.url,file,{width,height,theme,before:true});
   const selector=n<=2?'main':'.main-wrapper';
   assert.deepEqual(await p.evaluate(earBody,ordinaryProperties),await before.page.evaluate(earBody,ordinaryProperties),file+' body styles');
   for(const [label,x]of [['before',before],['after',c]]){
    await x.page.screenshot({path:path.join(OUT,`ET${n}-${width}-${theme}-${label}.png`),fullPage:true,caret:'initial'});
    await x.page.locator(selector).screenshot({path:path.join(OUT,`ET${n}-${width}-${theme}-${label}-body.png`),caret:'initial'});
   }
   // Only the permitted type metrics can change on the chrome; preserve its
   // padding/background and all brand/copyright copy.
   const bh=await before.page.evaluate(measure,n<=2?'.topbar':'.top-header'),bf=await before.page.evaluate(measure,'footer');
   for(const [a,z]of [[header,bh],[footer,bf]]){assert.equal(a.padding,z.padding);assert.equal(a.bg,z.bg);assert.equal(a.text,z.text);}
   assert.deepEqual(c.errors,[]);assert.deepEqual(before.errors,[]);assert.deepEqual(before.missing,[]);await before.context.close();
  }
  evidence.push({file,width,height,theme,header,footer});assert.deepEqual(c.errors,[]);assert.deepEqual(c.missing,[]);await c.context.close();
 });}}finally{fs.writeFileSync(path.join(OUT,'et-computed-styles.json'),JSON.stringify(evidence,null,2));await b.close();await s.close();}
});
test('MT Learning: no home counter, live step count before LESSON, and no counter on home/completion',async t=>{
 const s=await serve(),b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(let i=1;i<=5;i++)await t.test(`MT0${i}`,async()=>{
  const c=await open(b,s.url,`MT-Intervals/lesson0${i}/index.html`),p=c.page;
  assert.equal(await p.locator('.topbar').innerText().then(s=>s.includes('开始')),false);
  assert.equal(await p.locator('#home .home-actions > *').first().textContent(),'开始学习');
  if(i<=2){
   assert(await p.locator('#headerLessonCount').isHidden());await p.locator('#startLearning').click();
   const total=i===1?23:26;assert.equal(await p.locator('#headerLessonCount').textContent(),`1 / ${total}`);assert(await p.locator('#headerLessonCount').isVisible());
   await p.locator('#nextBtn').click();assert.equal(await p.locator('#headerLessonCount').textContent(),`2 / ${total}`);await p.locator('#prevBtn').click();assert.equal(await p.locator('#headerLessonCount').textContent(),`1 / ${total}`);
   await p.locator('#prevBtn').click();assert(await p.locator('#headerLessonCount').isHidden());
   await p.locator('#startLearning').click();await p.evaluate(()=>showSummary());assert(await p.locator('#headerLessonCount').isHidden());assert.equal(await p.locator('#progress').evaluate(e=>e.style.width),'100%');
   await p.locator('#backHome').click();assert(await p.locator('#headerLessonCount').isHidden());
  }else{assert.equal(await p.locator('.lesson-count').count(),0);assert.equal(await p.locator('#home button:disabled').count(),2);}
  assert.deepEqual(c.errors,[]);assert.deepEqual(c.missing,[]);await c.context.close();
 });}finally{await b.close();await s.close();}
});
test('MT Practice: all header modes/navigation/history with no extra row or source/grade mutation',async t=>{
 const s=await serve(),b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(let i=1;i<=5;i++)for(const [width,height]of sizes)for(const theme of themes)await t.test(`MT0${i}-${width}-${theme}`,async()=>{
  const c=await open(b,s.url,`MT-Intervals/lesson0${i}/practice/index.html`,{width,height,theme}),p=c.page,total=i===1||i===3?15:20;
  assert.equal(await p.locator('#headerMeta,#lessonTag').count(),0);assert(await p.locator('#questionCounter').isHidden());
  assert.deepEqual(await p.locator('.header-right-group > *').evaluateAll(es=>es.map(e=>e.id||e.className)),['questionCounter','header-title-right','historyToggleBtn']);
  await p.locator('#startPracticeBtn').click();assert.equal(await p.locator('#questionCounter').textContent(),`1 / ${total}`);assert(await p.locator('#questionCounter').isVisible());
  assert.deepEqual(await p.evaluate(noOverlap),{overlaps:[],outside:[],overflow:false});
  const cs=await p.evaluate(measure,'#questionCounter');assert.equal(cs.size,'12px');assert.equal(cs.weight,'300');assert.equal(cs.line,'18px');
  await p.locator('#questionNavToggle').click();await p.locator('#questionNav button').nth(1).click();assert.equal(await p.locator('#questionCounter').textContent(),`2 / ${total}`);
  await p.locator('#prevBtn').click();assert.equal(await p.locator('#questionCounter').textContent(),`1 / ${total}`);
  const originalData=await p.evaluate(()=>JSON.stringify(practiceData));await complete(p);assert(await p.locator('#questionCounter').isHidden());
  const statistics=await p.locator('#resultScreen').textContent();await p.locator('#resultQuestionNav button').nth(1).click();assert.equal(await p.locator('#questionCounter').textContent(),`2 / ${total}`);assert(await p.locator('#confirmBtn').isHidden());
  await p.locator('#backToResultBtn').click();assert(await p.locator('#questionCounter').isHidden());assert.equal(await p.locator('#resultScreen').textContent(),statistics);
  await p.locator('#copyResultBtn').click();assert((await p.evaluate(()=>__copy)).includes(`完成：${total}/${total}题`));
  await p.locator('#historyToggleBtn').click();assert.equal(await p.locator('.history-card-item').count(),1);await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'closeHistoryBtn');await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>document.activeElement.id),'historyToggleBtn');
  assert.equal(await p.evaluate(()=>JSON.stringify(practiceData)),originalData);
  await p.locator('#restartBtn').click();assert(await p.locator('#questionCounter').isHidden());
  if(i===2&&[320,375,390].includes(width)){
   await p.locator('#startPracticeBtn').click();await p.screenshot({path:path.join(OUT,`MT02-${width}-${theme}-practice.png`),fullPage:true,caret:'initial'});
  }
  assert.deepEqual(c.errors,[]);assert.deepEqual(c.missing,[]);await c.context.close();
 });}finally{await b.close();await s.close();}
});
