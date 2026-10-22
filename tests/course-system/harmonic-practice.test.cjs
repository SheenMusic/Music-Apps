const {test, before, after} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {chromium} = require('playwright');
const H = require('../course-baseline/harness.cjs');
const BASE = 'e38b41b732a1fe5ea78265d133bf0259df1a59af';
const courses = fs.readdirSync(path.join(H.ROOT, 'ET-Intervals')).filter(n => /^(0[3-9]|1[0-8])-/.test(n)).sort();
const harmonics = courses.filter(n => Number(n.slice(0, 2)) >= 6 && Number(n.slice(0, 2)) % 2 === 0);
let browser, server;
before(async () => {
  server = await H.serve();
  browser = await chromium.launch({executablePath: '/usr/bin/chromium', args: ['--no-sandbox']});
});
after(async () => {await browser?.close(); await server?.close();});

function mockGraph() {
  const Base = window.AudioContext;
  window.__nodes = []; window.__timers = new Map(); let timer = 0;
  window.setTimeout = (callback, delay) => {const id = ++timer; __timers.set(id, {callback, delay}); return id;};
  window.clearTimeout = id => __timers.delete(id);
  const param = () => ({value: 0, events: [], pending: [],
    setValueAtTime(v, t) {this.events.push(['value', v, t]); this.value = v;},
    setTargetAtTime(v, t, tau) {this.events.push(['target', v, t, tau]);},
    linearRampToValueAtTime(v, t) {this.events.push(['ramp', v, t]); this.pending.push([v,t]);},
    cancelScheduledValues(t) {this.events.push(['cancel', t]); this.pending = [];}
  });
  window.AudioContext = class extends Base {
    createOscillator() {
      const n = super.createOscillator(); delete n.gain; n.detune = param(); n.frequency = param(); n.connections = []; n.stops = [];
      n.connect = target => n.connections.push(target); n.disconnect = () => {n.disconnected = true;};
      n.stop = time => n.stops.push(time ?? 'now'); __nodes.push(n); return n;
    }
    createGain() {
      const n = super.createGain(); n.gain = param(); n.connections = [];
      n.connect = target => n.connections.push(target); n.disconnect = () => {n.disconnected = true;};
      __nodes.push(n); return n;
    }
  };
}
async function open(course, options = {}, mocks = true) {
  const context = await browser.newContext({viewport: {width: 1280, height: 900}, ...options});
  await context.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
  if (mocks) {await context.addInitScript(H.installMocks); await context.addInitScript(mockGraph);}
  const page = await context.newPage(), errors = [], bad = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => {if (r.status() >= 400) bad.push(r.url());});
  await page.goto(`${server.url}/ET-Intervals/${course}/index.html`);
  return {context, page, errors, bad};
}
async function pass(page) {
  await page.evaluate(async () => {
    stopTargetTone(); await startMic('low');
    function sing(midi, voice) {
      pitchBuffer = []; activeCaptureTarget = voice; isListening = true; __mockPitch = midiToFreq(midi);
      for (let i = 0; i < 8; i++) processAudio();
      __clock += 250; processAudio();
    }
    sing(currentLowMidi, 'low'); sing(currentHighMidi, 'high');
  });
  assert.equal(await page.locator('#nextBtn').isEnabled(), true, 'original detector must lock both voices');
}
function normalized(text) {
  return text.replace(/播放示范音高/g, '播放示范音').replace(/实时捕获演唱音高|实时音高捕获与偏差指示/g, '实时音高')
    .replace(/✓ 双音模唱正确！点击进入下一题|✓ 模唱正确！点击进入下一题|双音模唱正确，进入下一题|模唱正确，进入下一题/g, '正确，下一题');
}

test('all 16 lessons preserve question generation, parameter options, IDs, microphone and judging algorithms', () => {
  for (const course of courses) {
    const file = `ET-Intervals/${course}/index.html`, current = fs.readFileSync(path.join(H.ROOT, file), 'utf8');
    const old = execFileSync('git', ['show', `${BASE}:${file}`], {cwd: H.ROOT}).toString();
    const teachingPrefix = text => H.scripts(normalized(text)).join('\n').split('  let audioCtx = null;')[0];
    assert.equal(teachingPrefix(current), teachingPrefix(old), course + ' interval tables and spelling helpers');
    if (!harmonics.includes(course)) assert.deepEqual(H.scripts(normalized(current)), H.scripts(normalized(old)), course + ' all original non-harmonic logic');
    const ids = text => [...text.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]).sort();
    assert.deepEqual(ids(current), ids(old), course + ' IDs');
    assert.deepEqual([...current.matchAll(/<select\b[^]*?<\/select>/g)].map(m => m[0]), [...old.matchAll(/<select\b[^]*?<\/select>/g)].map(m => m[0]), course + ' options');
    const source = (text, name) => text.match(new RegExp(`  (?:async )?function ${name}\\([^]*?\\n  }`))?.[0];
    for (const name of ['startMic','stopMic','toggleMic','toggleCaptureMic','processAudio','autoCorrelate','checkPassCondition','updateStatusUI','updateCaptureButtonUI','updateToleranceZone','resetStatusDisplay','populateNoteSelects','spellTarget','spellWithOctave','onConfigChange']) {
      assert.equal(normalized(source(current, name) || ''), normalized(source(old, name) || ''), course + ' ' + name);
    }
    const stripReset = s => normalized(s).replace("    document.getElementById('pitchDetails').open = false;\n", '').replace('    resetHarmonicQuestion();\n', '').replace('    stopTargetTone();\n', '');
    assert.equal(stripReset(source(current, 'generateQuestion')), stripReset(source(old, 'generateQuestion')), course + ' random question generation');
  }
});

test('all 16 lessons render concise shared rules and controls on desktop/mobile, Light/Dark', async () => {
  const expected = {
    basic: '聆听示范音，模唱相同音高。连续正确 10 题即可完成。',
    octave: '聆听示范音，在指定八度模唱目标音高。本课严格判定八度，连续正确 10 题即可完成。',
    construct: '聆听参考音，根据指定音程关系构唱目标音高。连续正确 10 题即可完成。'
  };
  for (const course of courses) for (const width of [320, 390, 1280]) for (const colorScheme of ['light', 'dark']) {
    const {context, page, errors, bad} = await open(course, {viewport: {width, height: 900}, colorScheme, hasTouch: width < 768});
    try {
      const panel = page.locator('[data-practice-rules]'), type = await panel.getAttribute('data-practice-rules');
      const text = await panel.textContent();
      if (type === 'harmonic') {assert.match(text, /连续完成 10 道无辅助正确题/); assert.match(text, /短暂振荡两次/);}
      else assert.equal(text, expected[type]);
      assert.equal(await page.locator('#finishBtn').textContent(), '完成练习');
      assert.equal(await page.locator('#nextBtn').textContent(), '正确，下一题');
      const settings = page.locator('.settings-details');
      await settings.evaluate(e => {e.open = true;});
      assert.ok(await page.locator('select').count() >= 3);
      if (type === 'harmonic') {
        const details = page.locator('#pitchDetails'), summary = details.locator('summary');
        assert.equal(await details.getAttribute('open'), null);
        assert.equal(await summary.evaluate(e => getComputedStyle(e).position), 'static');
        assert.equal(await summary.evaluate(e => getComputedStyle(e).display), 'flex');
        assert.equal(await page.locator('#toneBtn').evaluate(e => getComputedStyle(e).borderRadius), '999px');
        await page.locator('#toneBtn').click();
        assert.equal(await page.evaluate(() => assistanceUsed), false);
        assert.equal(await details.getAttribute('open'), null);
        await summary.focus(); await page.keyboard.press('Enter');
        assert.equal(await page.evaluate(() => assistanceUsed), true);
        assert.deepEqual(await page.locator('.assist-listen-label').allTextContents(), ['点击触发音高振荡','点击触发音高振荡']);
        const card = page.locator('.target-half-box').first();
        if (width < 768) await card.tap(); else {await card.focus(); await page.keyboard.press('Space');}
        assert.equal(await card.evaluate(e => e.classList.contains('oscillating')), true);
        if (process.env.HARMONIC_SCREENSHOTS && width === 390) {
          fs.mkdirSync(process.env.HARMONIC_SCREENSHOTS, {recursive: true});
          await page.locator('.harmonic-pitch').screenshot({path: path.join(process.env.HARMONIC_SCREENSHOTS, `${course}-${colorScheme}-expanded.png`)});
        }
        await summary.focus(); await page.keyboard.press('Enter');
        assert.equal(await page.evaluate(() => isTonePlaying), true);
        if (process.env.HARMONIC_SCREENSHOTS && [390,1280].includes(width)) {
          fs.mkdirSync(process.env.HARMONIC_SCREENSHOTS, {recursive: true});
          await page.locator('.harmonic-pitch').screenshot({path: path.join(process.env.HARMONIC_SCREENSHOTS, `${course}-${width}-${colorScheme}.png`)});
        }
        await page.reload();
        assert.equal(await page.evaluate(() => assistanceUsed), false);
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 1, course + ' overflow');
      assert.deepEqual(errors, []); assert.deepEqual(bad, []);
    } finally {await context.close();}
  }
});

for (const course of harmonics) test(`${course}: independent two-cycle modulation never restarts sources/envelopes/deadline`, async () => {
  const {context, page, errors} = await open(course);
  try {
    assert.equal(await page.evaluate(() => triggerPitchOscillation('low')), false);
    assert.equal(await page.evaluate(() => __audio.oscillators.length), 0);
    const graph = await page.evaluate(async () => {
      await startTargetTone();
      const sources = __audio.oscillators.length, deadline = toneEndTime, timer = toneStopTimer;
      const gains = [...pianoNodesLow, ...pianoNodesHigh].filter(n => n.gain);
      const envelope = JSON.stringify(gains.map(n => n.gain.events));
      triggerPitchOscillation('low');
      const low = pianoNodesLow.filter(n => n.detune), high = pianoNodesHigh.filter(n => n.detune);
      const curves = low.map(n => n.detune.events.filter(e => e[0] === 'ramp'));
      const untouched = high.every(n => !n.detune.events.some(e => e[0] === 'ramp'));
      const stale = __timers.get(oscillationTimer).callback;
      triggerPitchOscillation('high'); stale();
      const highActive = document.querySelectorAll('.target-half-box')[1].classList.contains('oscillating');
      const lowReset = low.every(n => n.detune.pending.length === 0 && n.detune.value === 0);
      for (let i = 0; i < 20; i++) triggerPitchOscillation(i % 2 ? 'low' : 'high');
      audioCtx.currentTime = 4.9; triggerPitchOscillation('low');
      const result = {sources, nowSources: __audio.oscillators.length, deadline, nowDeadline: toneEndTime, timer, nowTimer: toneStopTimer,
        curves, untouched, highActive, lowReset, sameEnvelope: envelope === JSON.stringify(gains.map(n => n.gain.events)),
        targets: gains.filter(n => n.gain.events.some(e => e[0] === 'target')).map(n => n.gain.events),
        stops: __audio.oscillators.map(n => n.stops[0])};
      const active = [...pianoNodesLow,...pianoNodesHigh];
      __timers.get(toneStopTimer).callback();
      result.cleaned = active.every(n => n.disconnected) && !isTonePlaying && __timers.size === 0;
      result.silentTap = !triggerPitchOscillation('high');
      return result;
    });
    assert.equal(graph.sources, 10); assert.equal(graph.nowSources, 10); assert.equal(graph.deadline, 5); assert.equal(graph.nowDeadline, 5);
    assert.equal(graph.timer, graph.nowTimer); assert.equal(graph.sameEnvelope, true); assert.equal(graph.untouched, true); assert.equal(graph.highActive, true); assert.equal(graph.lowReset, true);
    assert.equal(graph.curves.length, 5);
    for (const curve of graph.curves) {
      assert.equal(curve.length, 256); assert.equal(curve.at(-1)[2], 2/3.5);
      const values=curve.map(e=>e[1]);
      assert.equal(values.at(-1), 0);
      assert.equal(Math.max(...values), 25); assert.equal(Math.min(...values), -25);
      assert.ok(Math.abs(values[63]) < .0001); assert.ok(Math.abs(values[127]) < .0001); assert.ok(Math.abs(values[191]) < .0001);
    }
    assert.deepEqual(graph.targets, [[['value',.35,0],['target',0,0,2]],[['value',.35,0],['target',0,0,2]]]);
    assert.deepEqual(graph.stops, Array(10).fill(5)); assert.equal(graph.cleaned, true); assert.equal(graph.silentTap, true);
    // A stale automatic stop cannot stop a replacement demonstration.
    assert.equal(await page.evaluate(async () => {
      await startTargetTone(); const stale = __timers.get(toneStopTimer).callback;
      await startTargetTone(); stale(); return isTonePlaying;
    }), true);
    await page.evaluate(async () => {stopTargetTone(); await startMic('high'); await startTargetTone();});
    assert.equal(await page.evaluate(() => isListening), false);
    await page.evaluate(() => __timers.get(toneStopTimer).callback());
    assert.equal(await page.evaluate(() => isListening && activeCaptureTarget === 'high'), true);
    assert.deepEqual(errors, []);
  } finally {await context.close();}
});

for (const course of harmonics) test(`${course}: irreversible assistance, idempotent completion and final-ten-only report`, async () => {
  const {context, page, errors} = await open(course);
  try {
    for (let i=0; i<3; i++) {await pass(page); if (i<2) await page.evaluate(() => nextQuestion());}
    assert.equal(await page.evaluate(() => consecutivePassCount), 3);
    await page.evaluate(() => {pitchDetails.open=true; pitchDetails.open=false; checkAllPassed(); finishPractice();});
    assert.deepEqual(await page.evaluate(() => [assistanceUsed,consecutivePassCount,questionHistory.length]), [true,0,0]);
    assert.equal(await page.locator('#reportCard').isVisible(), false);
    await page.evaluate(() => nextQuestion());
    await page.evaluate(() => {pitchDetails.open=true;});
    await pass(page);
    assert.equal(await page.locator('#nextBtn').isEnabled(), true);
    assert.equal(await page.evaluate(() => consecutivePassCount), 0);
    await page.evaluate(() => nextQuestion());
    for (let i=0; i<10; i++) {
      await pass(page); await page.evaluate(() => {checkAllPassed(); checkAllPassed();});
      assert.equal(await page.evaluate(() => consecutivePassCount), i+1);
      if (i<9) {assert.equal(await page.locator('#finishBtn').isEnabled(), false); await page.evaluate(() => nextQuestion());}
    }
    await page.evaluate(() => {pitchDetails.open=true; finishPractice();});
    assert.equal(await page.locator('#finishBtn').isEnabled(), false);
    assert.equal(await page.locator('#reportCard').isVisible(), false);
    await page.evaluate(() => {__clock+=50000; nextQuestion();});
    const expected=[];
    for (let i=0; i<10; i++) {
      await pass(page); expected.push(await page.evaluate(() => [currentLowSpell,currentHighSpell]));
      if(i<9) await page.evaluate(i => {__random=(i+1)/12; nextQuestion();},i);
    }
    await page.locator('#finishBtn').click();
    assert.equal(await page.locator('#reportTableBody tr').count(), 10);
    assert.deepEqual(await page.locator('#reportTableBody tr').evaluateAll(rows => rows.map(r => [r.cells[2].textContent.trim(),r.cells[3].textContent.trim()])), expected);
    assert.equal(await page.locator('#totalTimeText').textContent(), '5');
    await page.evaluate(() => copyReport()); assert.match(await page.evaluate(() => __audio.clipboard), /ET\d+/);
    await page.evaluate(() => restartPractice());
    assert.deepEqual(await page.evaluate(() => [assistanceUsed,consecutivePassCount,questionHistory.length]), [false,0,0]);
    assert.deepEqual(errors, []);
  } finally {await context.close();}
});

test('real offline audio: selected voice oscillates twice then stabilizes, other voice and two-second decay stay intact', async () => {
  const {context,page,errors} = await open(harmonics[0],{},false);
  try {
    for (const voice of ['low','high']) {
      const r=await page.evaluate(async voice => {
        const rate=48000; audioCtx=new OfflineAudioContext(4,rate*5.2,rate);
        const merger=audioCtx.createChannelMerger(4); merger.connect(audioCtx.destination);
        const low=playPianoNote(440),high=playPianoNote(660);
        low[0].disconnect(); low[0].connect(merger,0,2);
        high[0].disconnect(); high[0].connect(merger,0,3);
        low.find(n=>n instanceof OscillatorNode).connect(merger,0,0);
        high.find(n=>n instanceof OscillatorNode).connect(merger,0,1);
        schedulePitchOscillation((voice==='low'?low:high).filter(n=>n instanceof OscillatorNode),1);
        const b=await audioCtx.startRendering();
        const result=[];
        for(let channel=0;channel<2;channel++) {
          const data=b.getChannelData(channel),freq=channel?660:440,cross=[];
          for(let i=1;i<rate*4.9;i++)if(data[i-1]<0&&data[i]>=0)cross.push((i-1-data[i-1]/(data[i]-data[i-1]))/rate);
          const samples=cross.slice(1).map((t,i)=>({t:(t+cross[i])/2,c:1200*Math.log2(1/((t-cross[i])*freq))}));
          const selected=(voice==='low'?0:1)===channel;
          const error=Math.max(...samples.filter(x=>x.t>.1).map(x=>Math.abs(x.c-(selected&&x.t>=1&&x.t<1+2/3.5?25*Math.sin(2*Math.PI*3.5*(x.t-1)):0))));
          const after=Math.max(...samples.filter(x=>x.t>1.6).map(x=>Math.abs(x.c)));
          const env=b.getChannelData(channel+2),rms=(a,start,end)=>Math.sqrt(a.slice(start*rate,end*rate).reduce((s,x)=>s+x*x,0)/((end-start)*rate));
          result.push({error,after,ratio:rms(env,2.1,2.3)/rms(env,.1,.3),tail:Math.max(...data.slice(rate*5.01).map(Math.abs)),min:Math.min(...samples.map(x=>x.c)),max:Math.max(...samples.map(x=>x.c))});
        }
        return result;
      },voice);
      for(let channel=0;channel<2;channel++) {
        assert.ok(r[channel].error<2,JSON.stringify(r)); assert.ok(r[channel].after<.03); assert.equal(r[channel].tail,0);
        assert.ok(Math.abs(r[channel].ratio-Math.exp(-1))<.002,JSON.stringify(r));
      }
      const selected=r[voice==='low'?0:1]; assert.ok(selected.min< -24); assert.ok(selected.max>24);
    }
    assert.deepEqual(errors,[]);
  } finally {await context.close();}
});

test('real AudioContext supports repeated in-flight curve replacement and automatically cleans up at five seconds', async () => {
  const {context,page,errors}=await open(harmonics[0],{},false);
  const warnings=[];page.on('console',m=>{if(m.type()==='warning')warnings.push(m.text());});
  try {
    await page.evaluate(()=>{
      window.__realSources=0;
      const create=AudioContext.prototype.createOscillator;
      AudioContext.prototype.createOscillator=function(){__realSources++;return create.call(this);};
    });
    await page.locator('#toneBtn').click();
    await page.waitForFunction(()=>pianoNodesLow.length>0);
    assert.equal(await page.evaluate(()=>__realSources),10);
    await page.evaluate(()=>{pitchDetails.open=true;});
    for(let i=0;i<6;i++) {
      await page.locator('.target-half-box').nth(i%2).click();
      await page.waitForTimeout(30);
    }
    assert.equal(await page.evaluate(()=>__realSources),10);
    await page.waitForFunction(()=>!isTonePlaying,{},{timeout:6500});
    assert.deepEqual(await page.evaluate(()=>[pianoNodesLow.length,pianoNodesHigh.length,toneStopTimer,oscillationTimer]),[0,0,null,null]);
    assert.deepEqual(errors,[]);assert.deepEqual(warnings,[]);
  }finally{await context.close();}
});

test('ET04 still rejects an octave error; ET03 still completes normally',async()=>{
  for(const course of courses.slice(0,2)) {
    const {context,page,errors}=await open(course);
    try {
      await page.evaluate(async()=>{await startMic(); __mockPitch=midiToFreq(currentTargetMidi+12); for(let i=0;i<10;i++)processAudio(); __clock+=300; processAudio();});
      assert.equal(await page.evaluate(()=>isPassedCurrentQuestion),course.startsWith('03-'),course+' preserves original octave policy');
      if(course.startsWith('04-')) await page.evaluate(()=>{pitchBuffer=[];__mockPitch=midiToFreq(currentTargetMidi);for(let i=0;i<10;i++)processAudio();__clock+=300;processAudio();});
      assert.equal(await page.locator('#nextBtn').isEnabled(),true);
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});

test('ET17/18 retain every compound interval group and ET17 retains both direction modes', async()=>{
  const groups={'9th':[13,14],'10th':[15,16],'11th':[17,18],'12th':[18,19],'13th':[20,21],'14th':[22,23]};
  for(const course of courses.filter(c=>/^(17|18)-/.test(c))) {
    const {context,page,errors}=await open(course);
    try {
      for(const [group,allowed] of Object.entries(groups)) for(const random of [.25,.75]) {
        for(const direction of course.startsWith('17-')?['up','down']:['up']) {
          const delta=await page.evaluate(({group,random,direction})=>{
            __random=random;
            document.getElementById('minNoteSelect').value=36;
            document.getElementById('maxNoteSelect').value=84;
            if(document.getElementById('dirSelect')) {
              document.getElementById('dirSelect').value=direction;
              document.getElementById('intervalTypeSelect').value=group;
              onConfigChange();return currentTargetMidi-currentRefMidi;
            }
            document.getElementById('exerciseSelect').value=group;
            onConfigChange();return currentHighMidi-currentLowMidi;
          },{group,random,direction});
          assert.ok(allowed.includes(Math.abs(delta)),`${course} ${group}: ${delta}`);
          assert.equal(Math.sign(delta),direction==='up'?1:-1);
        }
      }
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});
