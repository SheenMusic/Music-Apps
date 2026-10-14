const {test:nodeTest,before,after} = require('node:test');
let automaticFailures=0;
const test=(name,fn)=>nodeTest(name,async t=>{try{await fn(t);}catch(e){automaticFailures++;throw e;}});
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
const {properties,snapshot,referenceRasters}=require('./visual-state.cjs');
const {comparePNG}=require('./raster-comparison.cjs');
const {isDeepStrictEqual}=require('node:util');
const rasterCounts={PASS:0,PASS_WITH_RASTER_VARIANCE:0,REVIEW_REQUIRED:0,FAIL:0};
const diagnostics=[];
before(async () => {
  fs.mkdirSync(output,{recursive:true}); server=await H.serve();
  browser=await chromium.launch({executablePath:process.env.COURSE_CHROMIUM || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
});
after(async () => {
  if(browser) fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify({baseline:H.BASE,browser:browser.version(),automaticFailures,comparisons,screenshotComparisons,viewportCount:views.length,themes:['light','dark'],computedProperties:"ALL native properties and custom variables",legacyPropertiesCovered:properties.length,rasterCounts,diagnostics,realDevices:false,audioDevices:'mocked'},null,2));
  await browser?.close(); await server?.close();
  if(rasterCounts.REVIEW_REQUIRED){console.log('DEPLOYMENT_BLOCKED: unapproved REVIEW_REQUIRED');process.exitCode=1;}
});
async function capture(pair,course,view,theme,state) {
  const [reference,current]=pair;
  const expected=await snapshot(reference.page), actual=await snapshot(current.page);
  let structureEqual=isDeepStrictEqual(actual,expected);
  const name=`${course}-${view.join('x')}-${theme}-${state}`;
  // All states receive style/geometry checks; initial and completed pages also receive pixel comparisons.
  // COURSE_FULL_SCREENSHOTS=1 optionally records every state, without changing test coverage of styles.
  if (process.env.COURSE_FULL_SCREENSHOTS === '1' || ['initial','report','result'].includes(state)) {
    const pngs=[];
    for(const run of pair)assert.equal(await run.page.evaluate(()=>document.activeElement.matches('input:not([type=checkbox]):not([type=radio]),textarea,[contenteditable]')),false,'Focused editable caret requires a separate visual contract');
    for(const run of pair) pngs.push(await run.page.screenshot({fullPage:true,animations:'disabled',caret:'initial'}));
    fs.writeFileSync(path.join(output,`${name}-before.png`),pngs[0]);
    fs.writeFileSync(path.join(output,`${name}-after.png`),pngs[1]);
    const options={name,structureEqual,cards:expected.nodes,scale:expected.dpr};
    let diagnostic=comparePNG(pngs[0],pngs[1],options);
    if(diagnostic.rasterCandidate && structureEqual) {
      const evidence=await referenceRasters(browser,server.url,course,reference.page,expected,{viewport:{width:view[0],height:view[1]},theme});
      for(let i=0;i<evidence.rasters.length;i++)fs.writeFileSync(path.join(output,`${name}-same-source-${i}.png`),evidence.rasters[i]);
      diagnostic=comparePNG(pngs[0],pngs[1],{...options,referenceRasters:evidence.valid?evidence.rasters:[]});
      diagnostic.evidenceCount=evidence.rasters.length;
      diagnostic.evidenceValid=evidence.valid;
      if(!evidence.valid){diagnostic.status='FAIL';diagnostic.reason=evidence.reason;}
    }
    diagnostic.beforeSHA256=H.sha(pngs[0]);diagnostic.afterSHA256=H.sha(pngs[1]);
    diagnostics.push(diagnostic);rasterCounts[diagnostic.status]++;
    fs.writeFileSync(path.join(output,`${name}-diagnostic.json`),JSON.stringify(diagnostic,null,2));
    console.log(JSON.stringify({name,status:diagnostic.status,strictDifferentPixels:diagnostic.strictDifferentPixels,
      maxRGBDifference:diagnostic.maxRGBDifference,maxAlphaDifference:diagnostic.maxAlphaDifference,
      boundingBox:diagnostic.boundingBox,variancePassed:diagnostic.variancePassed,structureChanged:diagnostic.structureChanged}));
    assert.notEqual(diagnostic.status,'FAIL',`${name}: ${diagnostic.reason} (inspect ${output})`);
    screenshotComparisons++;
  }
  assert.deepEqual(actual,expected,`${name}: computed styles/geometry/DOM/state differ`);
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
