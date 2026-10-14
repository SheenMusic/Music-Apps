const {test,before,after} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const {chromium} = require('playwright');
const H = require('./harness.cjs');
let browser, server;
before(async () => {server=await H.serve(); browser=await chromium.launch({executablePath:process.env.COURSE_CHROMIUM || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});});
after(async () => {await browser?.close(); await server?.close();});

test('Phase 1 scope: source scripts, DOM/content, URLs and all non-pilot tracked files unchanged', () => {
  for (const file of Object.values(H.COURSES)) {
    const current=fs.readFileSync(path.join(H.ROOT,file),'utf8'), baseline=H.original(file).toString();
    assert.equal(current.slice(current.indexOf('<body')),baseline.slice(baseline.indexOf('<body')), `${file}: body changed`);
    assert.deepEqual(H.scripts(current),H.scripts(baseline), `${file}: inline scripts changed`);
    for (const js of H.scripts(current)) new vm.Script(js);
    assert.equal(H.withoutCSS(current).replace(/\sdata-course="[^"]*"/,''),H.withoutCSS(baseline), `${file}: non-CSS markup changed`);
    const links=[...current.matchAll(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/g)].map(m=>m[1]);
    for (const link of links) assert.ok(fs.existsSync(path.resolve(H.ROOT,path.dirname(file),link)), `Missing CSS: ${link}`);
  }
  // Integration scope is separate from the immutable Phase 0 teaching/visual source.
  const metadata=JSON.parse(fs.readFileSync(path.join(__dirname,'baseline.json'),'utf8'));
  const scopeBase=metadata.visualUnification?.startingCommit || metadata.integration?.mainCommit || H.BASE;
  const allowed=new Set(metadata.visualUnification?.allowedChanges || metadata.integration?.allowedChanges || Object.values(H.COURSES));
  execFileSync('git',['merge-base','--is-ancestor',scopeBase,'HEAD'],{cwd:H.ROOT});
  const tree=execFileSync('git',['ls-tree','-r',scopeBase],{cwd:H.ROOT}).toString().trim().split('\n');
  const {createHash}=require('node:crypto');
  for (const entry of tree) {
    const [meta,file]=entry.split('\t');
    if (allowed.has(file)) continue;
    const bytes=fs.readFileSync(path.join(H.ROOT,file));
    const objectHash=createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
    assert.equal(objectHash,meta.split(' ')[2], `Out of scope: ${file}`);
  }
  // Include added/deleted paths and working-tree edits, not only files in the old tree.
  const changed=execFileSync('git',['diff','--name-only','--no-renames','-z',scopeBase],{cwd:H.ROOT}).toString().split('\0').filter(Boolean);
  const untracked=execFileSync('git',['ls-files','--others','--exclude-standard','-z'],{cwd:H.ROOT}).toString().split('\0').filter(Boolean);
  for (const file of [...changed,...untracked]) {
    if (file===metadata.auditReport && untracked.includes(file)) {
      assert.equal(createHash('sha256').update(fs.readFileSync(path.join(H.ROOT,file))).digest('hex'),metadata.auditReportSHA256,'Protected audit report changed');
      continue;
    }
    assert.ok(allowed.has(file), `Integration introduced out-of-scope path: ${file}`);
  }
});

test('ET05: four interval modes, spelling, reference-only audio, detector, 0.2s gate and 10-question report', async () => {
  const {page,context,errors}=await H.open(browser,server.url,'ET05');
  try {
    for (const [mode,delta] of [['up_maj',2],['up_min',1],['down_maj',-2],['down_min',-1]]) {
      const r=await page.evaluate(mode => {document.getElementById('exerciseSelect').value=mode;generateQuestion();return {delta:currentTargetMidi-currentRefMidi, ref:currentRefDisplay,target:currentTargetDisplay};},mode);
      assert.equal(r.delta,delta); assert.match(r.ref,/^[A-G][#b]?\d$/); assert.match(r.target,/^[A-G][#b]?\d$/);
    }
    assert.deepEqual(await page.evaluate(() => [spellSecondTarget('C',0,2,1).name,spellSecondTarget('E',4,1,1).name,spellSecondTarget('C',0,-1,-1).name]),['D','F','B']);
    assert.equal(await page.evaluate(() => {startTargetTone();return __audio.oscillators.at(-1).frequency.value === midiToFreq(currentRefMidi);}),true);
    assert.equal(await page.evaluate(() => __audio.oscillators.length),1);
    await page.evaluate(() => {stopTargetTone();restartPractice();});
    assert.equal(await page.locator('#nextBtn').isDisabled(),true);
    assert.equal(await page.locator('#finishBtn').isDisabled(),true);
    await page.evaluate(() => startMic());
    assert.equal(await page.evaluate(() => isListening),true);
    // Wrong note and silence cannot unlock a construction question.
    await page.evaluate(() => {__mockPitch=440;processAudio();});
    assert.equal(await page.evaluate(() => isPassedCurrentQuestion),false);
    await page.evaluate(() => {__mockPitch=0;processAudio();});
    assert.equal(await page.evaluate(() => inRangeStartTime),null);
    await H.passET(page,'ET05',1);
    assert.equal(await page.locator('#nextBtn').isDisabled(),false);
    assert.equal(await page.locator('#passCountText').textContent(),'1');
    assert.equal(await page.locator('#finishBtn').isDisabled(),true);
    await page.evaluate(() => {generateQuestion();});
    await H.passET(page,'ET05',9);
    assert.equal(await page.evaluate(() => questionHistory.length),10);
    assert.equal(await page.locator('#finishBtn').isDisabled(),false);
    await page.evaluate(() => finishPractice());
    assert.equal(await page.locator('#reportTableBody tr').count(),10);
    assert.equal(await page.locator('#reportCard').isVisible(),true);
    assert.equal(await page.evaluate(() => isListening),false);
    await page.evaluate(() => copyReport());
    assert.match(await page.evaluate(() => __audio.clipboard),/二度旋律音程构唱/);
    assert.deepEqual(errors,[]);
  } finally {await context.close();}
});

test('ET06: harmonic audio, independently locked low/high captures, state coordination and report', async () => {
  const {page,context,errors}=await H.open(browser,server.url,'ET06');
  try {
    for (const [mode,delta] of [['maj2',2],['min2',1]]) {
      assert.equal(await page.evaluate(mode=>{document.getElementById('exerciseSelect').value=mode;generateQuestion();return currentHighMidi-currentLowMidi;},mode),delta);
    }
    const sound=await page.evaluate(()=>{startTargetTone();return {count:__audio.oscillators.length, low:__audio.oscillators[0].frequency.value, high:__audio.oscillators[5].frequency.value, targets:[midiToFreq(currentLowMidi),midiToFreq(currentHighMidi)], started:__audio.oscillators.every(n=>n.started)};});
    assert.equal(sound.count,10); assert.equal(sound.started,true); assert.deepEqual([sound.low,sound.high],sound.targets);
    await page.evaluate(()=>{stopTargetTone();restartPractice();});
    await page.evaluate(()=>startMic('low'));
    assert.equal(await page.evaluate(()=>activeCaptureTarget),'low');
    await page.evaluate(()=>{__mockPitch=440;processAudio();});
    assert.equal(await page.evaluate(()=>lowCaptured),false);
    await page.evaluate(()=>{__mockPitch=midiToFreq(currentLowMidi);for(let i=0;i<8;i++)processAudio();__clock+=250;processAudio();});
    assert.deepEqual(await page.evaluate(()=>[lowCaptured,highCaptured,isListening]),[true,false,false]);
    assert.equal(await page.locator('#lowMicBtn').isDisabled(),true);
    assert.equal(await page.locator('#highMicBtn').isDisabled(),false);
    assert.equal(await page.locator('#nextBtn').isDisabled(),true);
    await page.evaluate(()=>{__mockPitch=0;});
    await page.evaluate(()=>startMic('high'));
    await page.evaluate(()=>{__mockPitch=midiToFreq(currentHighMidi);for(let i=0;i<8;i++)processAudio();__clock+=250;processAudio();});
    assert.deepEqual(await page.evaluate(()=>[lowCaptured,highCaptured,isListening,consecutivePassCount]),[true,true,false,1]);
    assert.equal(await page.locator('#nextBtn').isDisabled(),false);
    await page.evaluate(()=>{restartPractice();});
    await page.evaluate(()=>startMic('low'));
    // No headphones: starting a demonstration pauses active detection.
    await page.evaluate(()=>startTargetTone());
    assert.equal(await page.evaluate(()=>isListening),false);
    await page.evaluate(()=>{stopTargetTone();});
    await page.evaluate(()=>startMic('low'));
    await H.passET(page,'ET06',10);
    assert.equal(await page.locator('#finishBtn').isDisabled(),false);
    await page.evaluate(()=>finishPractice());
    assert.equal(await page.locator('#reportTableBody tr').count(),10);
    assert.equal(await page.locator('#reportTableBody tr').first().locator('td').count(),7);
    await page.evaluate(()=>copyReport());
    assert.match(await page.evaluate(()=>__audio.clipboard),/二度和声音程模唱/);
    assert.deepEqual(errors,[]);
  } finally {await context.close();}
});

test('MT03: all 15 questions, independent answer expectations, retries, navigation, timing, history and restart', async () => {
  const {page,context,errors}=await H.open(browser,server.url,'MT03');
  try {
    const data=await page.evaluate(()=>practiceData);
    const expected=[['错误'],['正确'],['错误'],['错误'],['正确'],['正确'],['错误'],['B'],['A'],['C'],['A'],['A','D'],['B','C'],['B','D'],['B','C']];
    assert.equal(data.questions.length,15);
    assert.deepEqual(data.questions.map(q=>q.correctAnswer),expected);
    assert.deepEqual(data.questions.map(q=>q.id),Array.from({length:15},(_,i)=>`q${String(i+1).padStart(2,'0')}`));
    assert.deepEqual(data.questions.reduce((a,q)=>{a[q.type]=(a[q.type]||0)+1;return a;},{}),{'boolean':7,'single-choice':4,'multiple-choice':4});
    for (const q of data.questions) {
      assert.equal(new Set(q.options.map(o=>o.value)).size,q.options.length);
      assert.ok(q.prompt && q.explanation);
      assert.equal(new Set(q.correctAnswer).size,q.correctAnswer.length);
      assert.ok(q.correctAnswer.every(a=>q.options.some(o=>o.value===a)));
    }
    await page.locator('#startPracticeBtn').click();
    await page.locator('#questionNavToggle').click();
    assert.equal(await page.locator('.question-nav-btn').count(),15);
    assert.equal(await page.locator('.question-nav-btn.current').textContent(),'01');
    await page.locator('[data-value="正确"]').click();
    await page.locator('#confirmBtn').click();
    assert.match(await page.locator('#feedbackTitle').textContent(),/错误/);
    assert.equal(await page.locator('#confirmBtn').isDisabled(),true);
    await page.locator('.question-nav-btn').nth(1).click();
    assert.equal(await page.locator('.question-nav-btn').first().evaluate(e=>e.classList.contains('attempted')),true);
    await page.locator('.question-nav-btn').first().click();
    await page.evaluate(()=>{__clock+=2000;});
    await page.locator('[data-value="错误"]').click(); await page.locator('#confirmBtn').click();
    assert.match(await page.locator('#feedbackTitle').textContent(),/正确/);
    assert.match(await page.locator('#progressBar').getAttribute('style'),/6\.666/);
    await page.locator('#nextBtn').click();
    assert.equal(await page.locator('.question-nav-btn').first().evaluate(e=>e.classList.contains('solved')),true);
    await page.locator('.question-nav-btn').first().click();
    assert.equal(await page.locator('#confirmBtn').isVisible(),false);
    await page.locator('#nextBtn').click();
    for (const q of data.questions.slice(1)) {
      await page.evaluate(()=>{__clock+=1000;});
      await page.locator('#optionsGrid .option-btn').evaluateAll((bs,ans)=>{for(const b of bs)if(ans.includes(b.dataset.value))b.click();},[...q.correctAnswer].reverse());
      await page.locator('#confirmBtn').click(); await page.locator('#nextBtn').click();
    }
    assert.equal(await page.locator('#resultScreen').isVisible(),true);
    assert.equal(await page.locator('#detailList .detail-item').count(),15);
    assert.equal(await page.locator('#resTotalAttempts').textContent(),'16次');
    assert.equal(await page.locator('#resAccuracy').textContent(),'93.8%');
    assert.equal(await page.locator('#resTotalTime').textContent(),'00分16秒');
    await page.locator('#copyResultBtn').click();
    assert.match(await page.evaluate(()=>__audio.clipboard),/93\.8%/);
    await page.locator('#historyToggleBtn').click();
    assert.equal(await page.locator('.history-card-item').count(),1);
    await page.locator('#closeHistoryBtn').click();
    await page.locator('#restartBtn').click();
    assert.equal(await page.locator('#startScreen').isVisible(),true);
    await page.locator('#startPracticeBtn').click();
    assert.equal(await page.locator('#questionCounter').textContent(),'1 / 15');
    assert.equal(await page.locator('#progressBar').evaluate(e=>e.style.width),'0%');
    assert.deepEqual(errors,[]);
  } finally {await context.close();}
});

test('Known defects: observe current behavior for this CSS-only migration, without endorsing it', async () => {
  const et=await H.open(browser,server.url,'ET05'), mt=await H.open(browser,server.url,'MT03');
  try {
    const outside=await et.page.evaluate(()=>{document.getElementById('minNoteSelect').value='84';document.getElementById('maxNoteSelect').value='84';document.getElementById('exerciseSelect').value='up_maj';generateQuestion();return currentTargetMidi>84;});
    assert.equal(outside,true,'Known B03 observation changed; reassess, do not silently refresh golden baseline');
    await et.page.evaluate(()=>startMic()); await et.page.evaluate(()=>stopMic());
    assert.equal(await et.page.evaluate(()=>__audio.stoppedTracks),0,'B01 observation: UI stop currently retains device stream');
    assert.ok(H.scripts(fs.readFileSync(path.join(H.ROOT,H.COURSES.MT03),'utf8')).join('\n').includes('window.location.href = "../index.html"'));
    assert.equal(fs.existsSync(path.join(H.ROOT,'MT-Intervals/index.html')),false);
  } finally {await et.context.close(); await mt.context.close();}
});
test.todo('Desired B03: every ET05 generated target respects the teacher-confirmed range policy');
test.todo('Desired B01: closing microphone releases device resources under an explicitly approved lifecycle policy');
test.todo('Desired B04: MT03 Return Home points to an existing teacher-confirmed destination');
