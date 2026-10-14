const {test,before,after} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {chromium} = require('playwright');
const H = require('./harness.cjs');
let browser, server, comparisons=0, screenshotComparisons=0;
const output=process.env.COURSE_VISUAL_OUTPUT || path.join(os.tmpdir(),'music-apps-course-baseline');
const views = [
  [1280,900], [320,812], [375,812], [390,844], [430,932], [768,1024], [1024,768]
];
const properties = `display position top right bottom left width height min-width max-width min-height max-height
margin-top margin-right margin-bottom margin-left padding-top padding-right padding-bottom padding-left
box-sizing flex-direction flex-grow flex-shrink flex-basis align-items justify-content gap row-gap column-gap
grid-template-columns grid-template-rows overflow-x overflow-y color background-color background-image
border-top-color border-top-style border-top-width border-right-color border-right-width border-bottom-color
border-bottom-width border-left-color border-left-width border-top-left-radius border-top-right-radius
border-bottom-left-radius border-bottom-right-radius box-shadow font-family font-size font-weight line-height
letter-spacing text-align text-transform text-decoration-line opacity visibility transform transform-origin
cursor appearance accent-color outline-color outline-style outline-width outline-offset animation-name
animation-duration animation-timing-function transition-property transition-duration transition-timing-function
z-index backdrop-filter content white-space`.split(/\s+/);
before(async () => {
  fs.mkdirSync(output,{recursive:true}); server=await H.serve();
  browser=await chromium.launch({executablePath:process.env.COURSE_CHROMIUM || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
});
after(async () => {
  if(browser) fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify({baseline:H.BASE,browser:browser.version(),comparisons,screenshotComparisons,viewportCount:views.length,themes:['light','dark'],computedProperties:properties.length,realDevices:false,audioDevices:'mocked'},null,2));
  await browser?.close(); await server?.close();
});
async function snapshot(page) {
  await page.evaluate(() => {for(const a of document.getAnimations()) {try{a.finish();}catch{}} window.scrollTo(0,0);});
  return page.evaluate(properties => {
    const sample=(el,pseudo=null) => {
      const s=getComputedStyle(el,pseudo); return Object.fromEntries(properties.map(p=>[p,s.getPropertyValue(p)]));
    };
    return [document.documentElement,...document.body.querySelectorAll('*'),document.body].map(el=>{
      const r=el.getBoundingClientRect();
      return {tag:el.tagName,id:el.id,classes:el.className,disabled:el.disabled,hidden:el.hidden,
        text:el.children.length ? null : el.textContent,
        rect:[r.x,r.y,r.width,r.height].map(v=>Math.round(v*1000)/1000),
        style:sample(el),before:sample(el,'::before'),after:sample(el,'::after')};
    });
  },properties);
}
async function capture(pair,course,view,theme,state) {
  const [reference,current]=pair;
  const expected=await snapshot(reference.page), actual=await snapshot(current.page);
  assert.deepEqual(actual,expected,`${course} ${view.join('x')} ${theme} ${state}: computed styles/geometry/state differ`);
  // All states receive style/geometry checks; initial and completed pages also receive pixel comparisons.
  // COURSE_FULL_SCREENSHOTS=1 optionally records every state, without changing test coverage of styles.
  if (process.env.COURSE_FULL_SCREENSHOTS === '1' || ['initial','report','result'].includes(state)) {
    const pngs=[];
    for(const run of pair) pngs.push(await run.page.screenshot({fullPage:true,animations:'disabled'}));
    const name=`${course}-${view.join('x')}-${theme}-${state}`;
    fs.writeFileSync(path.join(output,`${name}-before.png`),pngs[0]);
    fs.writeFileSync(path.join(output,`${name}-after.png`),pngs[1]);
    assert.equal(H.sha(pngs[1]),H.sha(pngs[0]),`${name}: screenshot pixels differ (inspect ${output})`);
    screenshotComparisons++;
  }
  for(const run of pair) {assert.deepEqual(run.errors,[]);assert.deepEqual(run.cssFailures,[]);}
  comparisons++;
}
async function each(pair,fn) {for(const run of pair) await fn(run.page);}
for(const course of Object.keys(H.COURSES)) for(const view of views) for(const theme of ['light','dark']) {
  test(`${course}: ${view.join('x')} ${theme}, reference/live style and screenshot regression`,async()=>{
    const options={viewport:{width:view[0],height:view[1]},theme};
    const pair=[await H.open(browser,server.url,course,{...options,reference:true}),await H.open(browser,server.url,course,options)];
    const check=state=>capture(pair,course,view,theme,state);
    try {
      await check('initial');
      if(course.startsWith('ET')) {
        await each(pair,p=>p.evaluate(()=>startTargetTone())); await check('playing');
        await each(pair,p=>p.evaluate(()=>stopTargetTone()));
        await each(pair,p=>p.evaluate(course=>course==='ET05'?startMic():startMic('low'),course));
        await check('recording');
        await each(pair,p=>p.evaluate(()=>{__mockPitch=440;processAudio();})); await check('wrong-pitch');
        await each(pair,p=>p.evaluate(()=>{__mockPitch=0;processAudio();}));
        if(course==='ET06') {
          await each(pair,p=>p.evaluate(()=>{__mockPitch=midiToFreq(currentLowMidi);for(let i=0;i<8;i++)processAudio();__clock+=250;processAudio();}));
          await check('low-locked');
          await each(pair,p=>p.evaluate(()=>{__mockPitch=0;return startMic('high');})); await check('high-recording');
          await each(pair,p=>p.evaluate(()=>{__mockPitch=midiToFreq(currentHighMidi);for(let i=0;i<8;i++)processAudio();__clock+=250;processAudio();}));
        } else await each(pair,p=>H.passET(p,course,1));
        await check('correct-unlocked');
        await each(pair,p=>p.evaluate(()=>{restartPractice();__mockPitch=0;}));
        await each(pair,p=>p.evaluate(course=>course==='ET05'?startMic():startMic('low'),course));
        // Detection and both stable gates are exercised above and by baseline.test.cjs.
        // Drive the original success handlers for the report fixture, avoiding 10 redundant audio analyses per viewport.
        await each(pair,p=>p.evaluate(course=>{
          for(let i=0;i<10;i++) {
            generateQuestion();
            if(course==='ET05') {
              const pc=((currentTargetMidi%12)+12)%12;
              checkPassCondition(midiToNoteName(currentTargetMidi),midiToFreq(currentTargetMidi),0,pc,pc);
              __clock+=250;
              checkPassCondition(midiToNoteName(currentTargetMidi),midiToFreq(currentTargetMidi),0,pc,pc);
            } else {
              document.getElementById('lowPitchText').textContent=`${midiToNoteName(currentLowMidi)} (${midiToFreq(currentLowMidi).toFixed(1)}Hz)`;
              document.getElementById('highPitchText').textContent=`${midiToNoteName(currentHighMidi)} (${midiToFreq(currentHighMidi).toFixed(1)}Hz)`;
              lowCaptured=true;highCaptured=true;__clock+=500;checkAllPassed();
            }
          }
        },course)); await check('ten-complete');
        await each(pair,p=>p.evaluate(()=>finishPractice())); await check('report');
      } else {
        await each(pair,p=>p.locator('#startPracticeBtn').click());
        await each(pair,p=>p.locator('#questionNavToggle').click()); await check('question-disabled');
        await each(pair,p=>p.locator('[data-value="正确"]').click()); await check('selected-enabled');
        await each(pair,p=>p.locator('#confirmBtn').click()); await check('wrong-feedback');
        await each(pair,p=>p.locator('[data-value="错误"]').click());
        await each(pair,p=>p.locator('#confirmBtn').click()); await check('correct-feedback');
        await each(pair,p=>p.locator('#nextBtn').click()); await check('solved-navigation');
        await each(pair,p=>p.locator('.question-nav-btn').nth(11).click());
        await each(pair,p=>p.locator('[data-value="A"]').click()); await check('multiple-selected');
        await each(pair,p=>p.locator('[data-value="D"]').click());
        await each(pair,p=>p.locator('#confirmBtn').click()); await check('multiple-correct');
        // Finish remaining questions using the original DOM handlers; keep the two solved questions locked.
        await each(pair,async p=>{
          const qs=await p.evaluate(()=>practiceData.questions);
          for(let i=0;i<qs.length;i++) {
            if(i===0||i===11)continue;
            await p.locator('.question-nav-btn').nth(i).click();
            await p.locator('#optionsGrid .option-btn').evaluateAll((bs,ans)=>{for(const b of bs)if(ans.includes(b.dataset.value))b.click();},qs[i].correctAnswer);
            await p.locator('#confirmBtn').click();
          }
          await p.locator('#nextBtn').click();
        });
        await check('result');
        await each(pair,p=>p.locator('#historyToggleBtn').click()); await check('history');
        await each(pair,p=>p.locator('#closeHistoryBtn').click());
        await each(pair,p=>p.locator('#restartBtn').click()); await check('restart');
      }
    } finally {for(const run of pair)await run.context.close();}
  });
}
// Ordinary animation settings are compared separately; screenshots above finish active animations to remove timing noise.
test('Motion and theme CSS contracts remain unchanged under no-preference',async()=>{
  for(const course of Object.keys(H.COURSES)) {
    const pair=[await H.open(browser,server.url,course,{reference:true}),await H.open(browser,server.url,course)];
    try {
      for(const run of pair)await run.page.emulateMedia({reducedMotion:'no-preference'});
      const collect=p=>p.evaluate(()=>{
        const s=getComputedStyle(document.body);return [s.animationName,s.animationDuration,s.animationTimingFunction,getComputedStyle(document.querySelector('button')).transitionProperty];
      });
      assert.deepEqual(await collect(pair[1].page),await collect(pair[0].page));
    } finally {for(const run of pair)await run.context.close();}
  }
});
