const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), http = require('node:http');
const {chromium} = require('playwright');
const {installMocks} = require('../course-baseline/harness.cjs');
const ROOT = path.resolve(__dirname,'../..'), BASE = '70c9f0cc6d46f2f14e2b27ff2347881c58cf3e38';
const OUT = process.env.UI_ARTIFACT_DIR || '/tmp/music-apps-ui-unification';
const git = (...args) => cp.execFileSync('git',args,{cwd:ROOT,maxBuffer:64*1024*1024});
const tracked = git('ls-files').toString().trim().split('\n');
const pages = tracked.filter(p => p.endsWith('.html') && !/^(tests|docs)\//.test(p) && !p.includes('.template.') && (!process.env.UI_SMOKE_PAGE || p === process.env.UI_SMOKE_PAGE));
const stripUI = s => s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(' class="site-collapse-arrow" aria-hidden="true">⌄',' aria-hidden="true">⌄');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.pdf':'application/pdf'};
async function startServer() {
 const server=http.createServer((req,res)=>{try{let p=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'');if(p.endsWith('/')||!p)p+='index.html';if(p.split('/').includes('..'))throw Error();const body=fs.readFileSync(path.join(ROOT,p));res.writeHead(200,{'Content-Type':types[path.extname(p)]||'application/octet-stream'});res.end(body)}catch{res.writeHead(404).end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));return {server,url:`http://127.0.0.1:${server.address().port}`};
}
async function open(browser,url,file,{before=false,width=390,height=844,theme='light',mocks=false}={}) {
 const context=await browser.newContext({viewport:{width,height},colorScheme:theme,reducedMotion:'reduce'});
 if(mocks)await context.addInitScript(installMocks);
 const cache=new Map();
 await context.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.origin!==url)return route.fulfill({status:200,body:'',contentType:'application/javascript'});
  if(!before)return route.continue();
  let p=decodeURIComponent(u.pathname).slice(1);if(!p||p.endsWith('/'))p+='index.html';
  try{if(!cache.has(p))cache.set(p,git('show',BASE+':'+p));return route.fulfill({status:200,body:cache.get(p),contentType:types[path.extname(p)]||'application/octet-stream'})}catch{return route.fulfill({status:404,body:''})}
 });
 const page=await context.newPage();const errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(url)&&r.status()>=400)missing.push(r.url())});
 await page.goto(`${url}/${file}`);return {context,page,errors,missing};
}
const cases=[
 ['courses','courses/index.html','native','.training-card > summary'],
 ['works','works/index.html','native','.works-category > summary'],
 ['scores','scores/index.html','native','.score-category > summary'],
 ['teacher','teacher/index.html','teacher','.resource-group > summary'],
 ['student','students/samuel-b5def80cdaa55d42/index.html','student','.course-toggle'],
 ['practice','MT-Intervals/lesson03/index.html','practice','#questionNavToggle'],
 ['settings','ET-Intervals/05-2nd-d7wzes/index.html','settings','.settings-summary'],
 ['pdf','works/before-the-scream/index.html','pdf','[data-score-src]'],
 ['menu','index.html','menu','#menuButton'],
 ['purchase','scores/pusa-man/index.html','purchase','#buyScore']
];
async function selectors(page){return page.evaluate(()=>{
 const result={};let inline=0;
 for(const sheet of document.styleSheets){const key=sheet.href?new URL(sheet.href).pathname:'inline-'+inline++;const values=[];function walk(rules){for(const r of rules){if(r.selectorText)values.push(r.selectorText);if(r.cssRules)walk(r.cssRules)}}walk(sheet.cssRules);result[key]=values}
 return result;
})}
async function shot(page,name){await page.screenshot({path:path.join(OUT,name+'.png'),caret:'initial'});}
async function mask(page,selector,pseudo){return page.locator(selector).first().evaluate((e,p)=>getComputedStyle(e,p||null).maskImage,pseudo)}
function direction(value){return decodeURIComponent(value).includes('M2 4l4 4 4-4')?'down':decodeURIComponent(value).includes('M4 2l4 4-4 4')?'right':'other'}
test('production JavaScript/data/URLs and HTML outside styles/decorative PDF arrow class are unchanged',()=>{
 for(const file of tracked){
  if(/^(tests|docs)\//.test(file))continue;
  if(file.endsWith('.js')||file.endsWith('.json')||file.endsWith('.yml')||file.endsWith('.html')){
   const old=git('show',BASE+':'+file).toString(),now=fs.readFileSync(path.join(ROOT,file),'utf8');
   assert.equal(file.endsWith('.html')?stripUI(now):now,file.endsWith('.html')?stripUI(old):old,file);
  }
 }
});
test('all published entries load; no new page errors, 404s or horizontal overflow', async()=>{
 const {server,url}=await startServer(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const evidence=[];
 try{for(const file of pages){
  const current=await open(browser,url,file);const before=await open(browser,url,file,{before:true});
  const dims=await current.page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
  const oldDims=await before.page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
  const currentSelectors=await selectors(current.page),oldSelectors=await selectors(before.page);
  for(const [sheet,list]of Object.entries(currentSelectors)){
   if(sheet.endsWith('/assets/site-visual.css'))continue;
   const ignore=s=>/(?:settings-summary::after|question-nav-toggle-icon|training-indicator|category-indicator|course-toggle-arrow|resource-collapse-arrow)/.test(s);
   assert.deepEqual(list.filter(s=>!ignore(s)),(oldSelectors[sheet]||[]).filter(s=>!ignore(s)),file+' CSS selectors '+sheet);
  }
  assert.deepEqual(current.errors,before.errors,file+' script errors');assert.deepEqual(current.missing,before.missing,file+' resources');
  assert(dims.scroll<=Math.max(dims.width,oldDims.scroll),file+' introduced overflow '+JSON.stringify({dims,oldDims}));
  evidence.push({file,errors:current.errors,missing:current.missing,dimensions:dims,baseline:oldDims,components:await current.page.evaluate(()=>({details:document.querySelectorAll('details').length,open:document.querySelectorAll('details[open]').length,ariaExpanded:document.querySelectorAll('[aria-expanded]').length,student:document.querySelectorAll('.course-toggle').length}))});
  await current.context.close();await before.context.close();
 }}finally{fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,'smoke.json'),JSON.stringify(evidence,null,2));await browser.close();await new Promise(r=>server.close(r))}
});
test('desktop/mobile, light/dark, initial/open/closed, keyboard and focus contracts with before/after evidence',async t=>{
 fs.mkdirSync(OUT,{recursive:true});const {server,url}=await startServer();const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const evidence=[];
 try{for(const width of [390,1280])for(const theme of ['light','dark'])for(const [id,file,kind,selector]of cases.filter(c=>!process.env.UI_CASES||process.env.UI_CASES.split(',').includes(c[0])))await t.test(`${id}-${width}-${theme}`,async()=>{
  for(const before of [true,false]){
   const c=await open(browser,url,file,{before,width,height:width===390?844:900,theme,mocks:kind==='practice'||kind==='settings'});const {page}=c;
   try{
    if(kind==='practice'){await page.locator('#startPracticeBtn').click();assert.equal(await page.locator('#questionNav').evaluate(e=>getComputedStyle(e).display),'none')}
    const button=page.locator(selector).first();await button.scrollIntoViewIfNeeded();
    let stateBefore;
    if(kind==='settings'){await page.locator('#minNoteSelect').selectOption('49');stateBefore=await page.locator('#minNoteSelect').inputValue();if(await page.locator('details').first().getAttribute('open')!==null)await button.click()}
    await shot(page,`${id}-${width}-${theme}-${before?'before':'after'}-closed`);
    await button.focus();await page.keyboard.press('Enter');
    if(kind==='purchase'){
     await page.locator('#purchaseDialog').waitFor({state:'visible'});
     const summary=page.locator('.checkout-tracks summary');await summary.click();
     assert.equal(await page.locator('.checkout-tracks').evaluate(e=>e.open),true);
     await page.locator('#buyerEmail').fill('ui-test@example.invalid');
     await summary.click();await summary.focus();await page.keyboard.press('Space');
     assert.equal(await page.locator('#buyerEmail').inputValue(),'ui-test@example.invalid');
     if(!before){assert.equal(await page.locator('#purchaseDialog').evaluate(e=>getComputedStyle(e).borderTopLeftRadius),'18px');assert.equal(direction(await mask(page,'.checkout-tracks summary','::after')),'down')}
     await page.locator('#checkoutEmailForm button[type=submit]').click();
     await page.locator('.score-consent').waitFor({state:'visible'});
     assert.equal(await page.locator('.consent-continue').isDisabled(),true);
     await shot(page,`${id}-${width}-${theme}-${before?'before':'after'}-consent`);
     await page.locator('.consent-check input').check();await page.locator('.consent-continue').click();
     await page.locator('#checkoutPayment').waitFor({state:'visible'});
     assert.equal(await page.locator('#emailShow').textContent(),'ui-test@example.invalid');
     await page.locator('[data-method=微信]').click();assert.equal(await page.locator('[data-method=微信]').getAttribute('aria-pressed'),'true');
    }else if(kind==='menu'){assert.equal(await button.getAttribute('aria-expanded'),'true');assert.equal(await page.locator('#menuPanel').getAttribute('aria-hidden'),'false')}
    else if(kind==='native'||kind==='teacher'||kind==='settings'){
     assert.equal(await button.evaluate(e=>e.parentElement.open),true);
     if(!before){const icon=kind==='settings'||kind==='teacher'?null:(id==='courses'?'.training-indicator':id==='works'?'.category-indicator':'.score-category-indicator');assert.equal(direction(icon?await mask(page,selector+' '+icon):await mask(page,selector,'::after')),'down')}
    }else{assert.equal(await button.getAttribute('aria-expanded'),'true');if(kind==='practice')assert.equal(await page.locator('#questionNav').evaluate(e=>getComputedStyle(e).display),'grid');if(!before){const icon=kind==='student'?'.course-toggle-arrow':kind==='practice'?'.question-nav-toggle-icon':'.site-collapse-arrow';assert.equal(direction(await mask(page,selector+' '+icon)),'down')}}
    if(!before&&kind!=='menu')assert((await button.boundingBox()).height>=44,'touch target');
    await shot(page,`${id}-${width}-${theme}-${before?'before':'after'}-open`);
    if(kind==='teacher'){
     const others=await page.locator('.resource-group').evaluateAll(es=>es.slice(1).map(e=>e.open));assert(others.every(x=>!x));
     await page.locator('.resource-group').first().locator('.resource-collapse').click();assert.equal(await button.evaluate(e=>document.activeElement===e),true);
    }else if(kind==='student'){
     const target=await button.getAttribute('aria-controls');await page.locator('#'+target+' .resource-collapse').click();assert.equal(await button.evaluate(e=>document.activeElement===e),true);assert.equal(await page.locator('#'+target).evaluate(e=>e.hidden),true);
    }else if(kind==='purchase'){
     await page.locator('#closeDialog').click();assert.equal(await button.evaluate(e=>document.activeElement===e),true);
    }else if(kind==='menu'){
     await page.keyboard.press('Escape');assert.equal(await button.getAttribute('aria-expanded'),'false');assert.equal(await button.evaluate(e=>document.activeElement===e),true);
    }else{await button.focus();await page.keyboard.press('Space')}
    if(kind==='practice')assert.equal(await page.locator('#questionNav').evaluate(e=>getComputedStyle(e).display),'none');
    if(kind==='settings'){await button.click();assert.equal(await page.locator('#minNoteSelect').inputValue(),stateBefore)}
    assert.deepEqual(c.errors,[]);assert.deepEqual(c.missing,[]);
    evidence.push({id,width,theme,before,errors:c.errors,missing:c.missing});
   }finally{await c.context.close()}
  }
 });}finally{fs.writeFileSync(path.join(OUT,'interactions.json'),JSON.stringify(evidence,null,2));await browser.close();await new Promise(r=>server.close(r))}
});
test('Learning phone/iPad layout, independently scrollable long text, pinned board/navigation and teaching radii',async t=>{
 fs.mkdirSync(OUT,{recursive:true});const {server,url}=await startServer(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const results=[];
 try{for(const lesson of ['01','02','06'])for(const [width,height]of [[320,568],[390,844],[768,1024],[1024,768]])for(const theme of ['light','dark'])await t.test(`${lesson}-${width}-${theme}`,async()=>{
  const comparisons=[];
  for(const before of [true,false]){
   const c=await open(browser,url,`MT-Intervals/lesson${lesson}/index.html`,{before,width,height,theme});
   try{
    await c.page.locator(lesson==='06'?'#startReview':'#startLearning').click();
    const result=await c.page.evaluate(lesson=>{
     const content=document.querySelector(lesson==='06'?'#lessonContent':'#stepBody'),board=document.querySelector('#lessonBoard'),nav=document.querySelector(lesson==='06'?'#lessonNav':'.lesson-footer-zone');
     const probe=document.createElement('p');probe.textContent='长正文滚动末尾';probe.style.height='1600px';content.append(probe);
     content.scrollTo({top:0,behavior:'instant'});
     const box=e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height].map(n=>Math.round(n*1000)/1000)};
     const start={board:box(board),nav:box(nav)};
     content.scrollTo({top:content.scrollHeight,behavior:'instant'});
     return {start,end:{board:box(board),nav:box(nav)},scrollTop:content.scrollTop,maxScroll:content.scrollHeight-content.clientHeight,navBottom:nav.getBoundingClientRect().bottom,height:innerHeight,overflow:document.documentElement.scrollWidth-innerWidth,teachingRadii:[...document.querySelectorAll('.white-key,.black-key,.staff,.stage,.lesson-board')].map(e=>getComputedStyle(e).borderRadius)};
    },lesson);
    assert.deepEqual(result.start,result.end,'scroll must not move board/navigation');assert(result.scrollTop>0);assert.equal(Math.round(result.scrollTop),Math.round(result.maxScroll));assert(result.navBottom<=height+1);assert(result.overflow<=0);
    assert.deepEqual(c.errors,[]);comparisons.push(result);await c.context.close();
   }finally{await c.context.close()}
  }
  assert.deepEqual(comparisons[0],comparisons[1],'new UI must preserve the teaching layout geometry and radii');results.push({lesson,width,height,theme,...comparisons[1]});
 });}finally{fs.writeFileSync(path.join(OUT,'learning-layouts.json'),JSON.stringify(results,null,2));await browser.close();await new Promise(r=>server.close(r))}
});
test('five live radius tiers, all student disclosure rows and teacher drawer groups',async()=>{
 const {server,url}=await startServer(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const theme of ['light','dark']){
  const c=await open(browser,url,'MT-Intervals/lesson03/index.html',{theme,mocks:true});
  for(const [selector,expected]of [['.history-toggle-btn','6px'],['.primary-btn','10px'],['.card-container','14px'],['.modal-card','18px'],['.progress-bar','999px']])assert.equal(await c.page.locator(selector).first().evaluate(e=>getComputedStyle(e).borderTopLeftRadius),expected,selector);
  await c.context.close();
 }
 for(const file of pages.filter(p=>p.startsWith('students/'))){const c=await open(browser,url,file);const b=c.page.locator('.course-toggle').first();await b.focus();await c.page.keyboard.press('Enter');const target=await b.getAttribute('aria-controls');assert.equal(await c.page.locator('#'+target).evaluate(e=>e.hidden),false);await c.page.locator('#'+target+' .resource-collapse').click();assert.equal(await b.evaluate(e=>document.activeElement===e),true);assert.deepEqual(c.errors,[]);await c.context.close()}
 const c=await open(browser,url,'teacher/index.html');await c.page.locator('#menuButton').click();const b=c.page.locator('.teacher-menu summary').first();await b.focus();await c.page.keyboard.press('Enter');assert.equal(await b.evaluate(e=>e.parentElement.open),true);assert.equal(direction(await mask(c.page,'.teacher-menu summary','::after')),'down');await c.page.locator('.teacher-menu details').first().locator('.resource-collapse').click();assert.equal(await b.evaluate(e=>document.activeElement===e),true);await c.page.keyboard.press('Escape');assert.equal(await c.page.locator('#menuButton').getAttribute('aria-expanded'),'false');assert.deepEqual(c.errors,[]);await c.context.close();
 }finally{await browser.close();await new Promise(r=>server.close(r))}
});
