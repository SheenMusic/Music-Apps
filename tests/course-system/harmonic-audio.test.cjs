const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const H=require('../course-baseline/harness.cjs');
const courses=fs.readdirSync(path.join(H.ROOT,'ET-Intervals')).filter(n=>/^(06|08|10|12|14|16|18)-/.test(n)).sort();
let browser,server;
before(async()=>{server=await H.serve();browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});});
after(async()=>{await browser?.close();await server?.close();});
function mocks(){
  const Base=window.AudioContext;window.__timers=new Map();let timer=0;
  window.setTimeout=(callback,delay)=>{const id=++timer;__timers.set(id,{callback,delay});return id;};window.clearTimeout=id=>__timers.delete(id);
  const param=()=>({value:0,events:[],setValueAtTime(v,t){this.value=v;this.events.push(['value',v,t]);},setTargetAtTime(v,t,tau){this.events.push(['target',v,t,tau]);},linearRampToValueAtTime(v,t){this.events.push(['ramp',v,t]);},cancelScheduledValues(t){this.events.push(['cancel',t]);}});
  window.AudioContext=class extends Base{
    createOscillator(){const n=super.createOscillator();delete n.gain;n.detune=param();n.frequency=param();n.connections=[];n.stops=[];n.connect=t=>n.connections.push(t);n.disconnect=()=>n.disconnected=true;n.stop=t=>n.stops.push(t??'now');return n;}
    createGain(){const n=super.createGain();n.gain=param();n.connections=[];n.connect=t=>n.connections.push(t);n.disconnect=()=>n.disconnected=true;return n;}
  };
}
async function open(course,real=false){
  const context=await browser.newContext();await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  if(!real){await context.addInitScript(H.installMocks);await context.addInitScript(mocks);}
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${server.url}/ET-Intervals/${course}/index.html`);return{context,page,errors};
}
test('deployed course HTML, rules, eligibility and reports stay byte-identical',()=>{
  const base='7410d9daa972610b0fc9e8bf196fdd4885a6d0b4';
  for(const course of courses){const file=`ET-Intervals/${course}/index.html`;assert.equal(fs.readFileSync(path.join(H.ROOT,file),'utf8'),execFileSync('git',['show',`${base}:${file}`],{cwd:H.ROOT}).toString());}
  const file='ET-Intervals/shared/course-rules.js';assert.equal(fs.readFileSync(path.join(H.ROOT,file),'utf8'),execFileSync('git',['show',`${base}:${file}`],{cwd:H.ROOT}).toString());
  const original=execFileSync('git',['show',`${base}:ET-Intervals/shared/harmonic-practice.js`],{cwd:H.ROOT}).toString();
  assert.equal(fs.readFileSync(path.join(H.ROOT,'ET-Intervals/shared/harmonic-practice.js'),'utf8').split('const HARMONIC_AUDIO')[0],original.split('const HARMONIC_AUDIO')[0]);
});
for(const course of courses)test(`${course}: five one-sided shrinking pulses, independent +30% gain, seamless retrigger and fixed envelope`,async()=>{
  const {context,page,errors}=await open(course);
  try{
    assert.equal(await page.evaluate(()=>triggerPitchOscillation('low')),false);
    const r=await page.evaluate(async()=>{
      await startTargetTone();
      const deadline=toneEndTime,timer=toneStopTimer,count=__audio.oscillators.length;
      const envelope=JSON.stringify([pianoNodesLow[0].gain.events,pianoNodesHigh[0].gain.events,pianoNodesLow.fadeGain.gain.events,pianoNodesHigh.fadeGain.gain.events]);
      const highBefore=JSON.stringify(pianoNodesHigh.map(n=>n.detune?.events??n.gain?.events));
      triggerPitchOscillation('low');
      const lowCurve={pitch:[...pianoNodesLow.modulation.pitch],gain:[...pianoNodesLow.modulation.gain],duration:pianoNodesLow.modulation.duration};
      const untouched=highBefore===JSON.stringify(pianoNodesHigh.map(n=>n.detune?.events??n.gain?.events));
      const sameHarmonics=pianoNodesLow.filter(n=>n.detune).every(n=>JSON.stringify(n.detune.events)===JSON.stringify(pianoNodesLow.find(n=>n.detune).detune.events));
      audioCtx.currentTime=.04;const before=modulationAt(pianoNodesLow,.04);triggerPitchOscillation('low');
      const restart={pitch:pianoNodesLow.modulation.pitch[0],gain:pianoNodesLow.modulation.gain[0]};
      const lowBefore=JSON.stringify(pianoNodesLow.map(n=>n.detune?.events??n.gain?.events));
      triggerPitchOscillation('high');
      const highCurve={pitch:[...pianoNodesHigh.modulation.pitch],gain:[...pianoNodesHigh.modulation.gain]};
      const lowUntouched=lowBefore===JSON.stringify(pianoNodesLow.map(n=>n.detune?.events??n.gain?.events));
      const stale=__timers.get(oscillationTimers.high).callback;triggerPitchOscillation('high');stale();
      const stillRipple=document.querySelectorAll('.target-half-box')[1].classList.contains('oscillating');
      for(let i=0;i<30;i++){audioCtx.currentTime+=.005;triggerPitchOscillation(i%2?'low':'high');}
      audioCtx.currentTime=5.49;triggerPitchOscillation('high');
      const result={lowCurve,highCurve,untouched,lowUntouched,sameHarmonics,before,restart,stillRipple,count,nowCount:__audio.oscillators.length,deadline,nowDeadline:toneEndTime,timer,nowTimer:toneStopTimer,
        sameEnvelope:envelope===JSON.stringify([pianoNodesLow[0].gain.events,pianoNodesHigh[0].gain.events,pianoNodesLow.fadeGain.gain.events,pianoNodesHigh.fadeGain.gain.events]),
        natural:pianoNodesLow[0].gain.events,fade:pianoNodesLow.fadeGain.gain.events,stops:__audio.oscillators.map(n=>n.stops[0]),
        types:[pianoNodesLow,pianoNodesHigh].map(ns=>ns.filter(n=>n.detune).map(n=>n.type)),weights:[pianoNodesLow,pianoNodesHigh].map(ns=>ns.filter(n=>n.gain).slice(3).map(n=>n.gain.value))};
      const active=[...pianoNodesLow,...pianoNodesHigh];__timers.get(toneStopTimer).callback();
      result.cleaned=!isTonePlaying&&active.every(n=>n.disconnected)&&__timers.size===0;
      result.silent=!triggerPitchOscillation('low');
      await startTargetTone();const old=__timers.get(toneStopTimer).callback;await startTargetTone();old();result.oldTimerSafe=isTonePlaying;
      stopTargetTone();await startMic('high');await startTargetTone();result.micPaused=!isListening;
      __timers.get(toneStopTimer).callback();result.micResumed=isListening&&activeCaptureTarget==='high';
      return result;
    });
    assert.equal(r.count,10);assert.equal(r.nowCount,10);assert.equal(r.deadline,5.5);assert.equal(r.nowDeadline,5.5);assert.equal(r.timer,r.nowTimer);
    for(const k of ['untouched','lowUntouched','sameHarmonics','sameEnvelope','stillRipple','cleaned','silent','oldTimerSafe','micPaused','micResumed'])assert.equal(r[k],true,k);
    assert.deepEqual(r.natural,[['value',.32,0],['target',0,0,2],['value',.32*Math.exp(-4.5/2),4.5]]);assert.deepEqual(r.stops,Array(10).fill(5.5));
    assert.deepEqual(r.fade[1],['value',1,4.5]);assert.deepEqual(r.fade.at(-1),['ramp',0,5.5]);
    assert.deepEqual(r.types,Array(2).fill(['sine','triangle','triangle','triangle','triangle']));
    assert.deepEqual(r.weights,Array(2).fill([.6,.3,.15,.08,.04]));
    assert.ok(Math.abs(r.restart.pitch-r.before.cents)<1e-6);assert.ok(Math.abs(r.restart.gain-r.before.gain)<1e-6);
    for(const [name,sign]of[['lowCurve',-1],['highCurve',1]]){
      const c=r[name];assert.equal(c.pitch.length,641);assert.equal(c.pitch[0],0);assert.equal(c.pitch.at(-1),0);assert.equal(c.gain.at(-1),1);
      for(let cycle=0;cycle<5;cycle++){
        assert.ok(Math.abs(c.pitch[cycle*128])<1e-5);
        const peak=Math.max(...c.pitch.slice(cycle*128,(cycle+1)*128+1).map(v=>v*sign));
        if(cycle===0) assert.ok(Math.abs(peak-15)<1e-5);
        else assert.ok(peak<Math.max(...c.pitch.slice((cycle-1)*128,cycle*128+1).map(v=>v*sign)));
      }
      assert.ok(c.pitch.every(v=>v*sign>=0));assert.ok(c.gain.every(v=>v>=1&&v<=1.300001));
      assert.ok(Math.abs(Math.max(...c.gain)-1.3)<1e-6);
      assert.ok(c.gain.slice(10).every((v,i,a)=>i===0||v<=a[i-1]));
    }
    assert.equal(r.lowCurve.duration,5/6.5);assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test('real offline rendering verifies one-sided pitch, relative AM and exact natural/fade envelope',async()=>{
  const{context,page,errors}=await open(courses[0],true);
  try{for(const voice of['low','high']){
    const r=await page.evaluate(async voice=>{
      const rate=48000;audioCtx=new OfflineAudioContext(4,rate*5.7,rate);
      const merger=audioCtx.createChannelMerger(4);merger.connect(audioCtx.destination);
      const bundles=[playPianoNote(440),playPianoNote(660)];
      bundles.forEach((nodes,ch)=>{
        // Feed DC through the actual envelope/assist/fade chain to measure its gain.
        nodes.filter(n=>n.gain&&!nodes.slice(0,3).includes(n)).forEach(n=>n.disconnect());
        nodes.find(n=>n instanceof OscillatorNode).connect(merger,0,ch);
        nodes.fadeGain.disconnect();nodes.fadeGain.connect(merger,0,ch+2);
        const dc=audioCtx.createConstantSource();dc.offset.value=1;dc.connect(nodes[0]);dc.start(0);dc.stop(5.5);
      });
      schedulePitchOscillation(bundles[voice==='low'?0:1],1,voice);
      const b=await audioCtx.startRendering(),result=[];
      const duration=5/6.5,attack=duration*10/640;
      const raw=u=>(1-Math.cos(2*Math.PI*5*u))/2*Math.pow(1-u,1.15);
      let peak=0;for(let i=0;i<=128;i++)peak=Math.max(peak,raw(i/640));
      const pulse=t=>{const u=(t-1)/duration;if(u<0||u>=1)return 0;const x=Math.min(1,(t-1)/attack);return raw(u)/peak*x*x*(3-2*x);};
      const boost=t=>{const v=t-1;if(v<0||v>=duration)return 1;if(v<=attack){const x=v/attack;return 1+.3*x*x*(3-2*x);}return 1+.3*Math.pow(1-(v-attack)/(duration-attack),1.15);};
      // Compare the rendered gain to the independently interpolated ramp samples,
      // rather than treating a piecewise-linear approximation as an analytic curve.
      const sampledBoost=t=>{if(t<1||t>=1+duration)return 1;const p=(t-1)/duration*640,i=Math.floor(p),f=p-i;return Math.fround(boost(1+duration*i/640))*(1-f)+Math.fround(boost(1+duration*(i+1)/640))*f;};
      for(let ch=0;ch<2;ch++){
        const a=b.getChannelData(ch),env=b.getChannelData(ch+2),freq=ch?660:440,cross=[];const selected=ch===(voice==='low'?0:1),sign=ch?1:-1;
        for(let i=1;i<rate*5.4;i++)if(a[i-1]<0&&a[i]>=0)cross.push((i-1-a[i-1]/(a[i]-a[i-1]))/rate);
        const samples=cross.slice(1).map((t,i)=>({t:(t+cross[i])/2,c:1200*Math.log2(1/((t-cross[i])*freq))}));
        const pitchError=Math.max(...samples.filter(x=>x.t>.1).map(x=>Math.abs(x.c-(selected?sign*15*pulse(x.t):0))));
        let envError=0,amError=0;for(let i=1;i<rate*5.5;i+=37){const t=i/rate,fade=t<=4.5?1:(1+Math.cos(Math.PI*(t-4.5)))/2;
          const baseline=.32*Math.exp(-Math.min(t,4.5)/2)*fade;const am=selected?sampledBoost(t):1;envError=Math.max(envError,Math.abs(env[i]-baseline*am));
          if(t<4.4)amError=Math.max(amError,Math.abs(env[i]/(.32*Math.exp(-t/2))-am));}
        const after=Math.max(...samples.filter(x=>x.t>1+5/6.5+.02).map(x=>Math.abs(x.c)));
        const at=t=>env[Math.round(t*rate)];
        result.push({pitchError,envError,amError,after,min:Math.min(...samples.map(x=>x.c)),max:Math.max(...samples.map(x=>x.c)),fade:[at(4.5),at(5),at(5.49),at(5.5)],tail:Math.max(...env.slice(rate*5.51).map(Math.abs))});
      }return result;
    },voice);
    for(let ch=0;ch<2;ch++){
      assert.ok(r[ch].pitchError<1.6,JSON.stringify(r));assert.ok(r[ch].after<.03);assert.ok(r[ch].envError<.0001,JSON.stringify(r));assert.ok(r[ch].amError<.001,JSON.stringify(r));
      assert.ok(r[ch].fade[0]>r[ch].fade[1]);assert.ok(r[ch].fade[1]>r[ch].fade[2]);assert.equal(r[ch].fade[3],0);assert.equal(r[ch].tail,0);
    }
    if(voice==='low'){assert.ok(r[0].min< -14.8);assert.ok(r[0].max<.03);}else{assert.ok(r[1].max>14.8);assert.ok(r[1].min>-.03);}
  }assert.deepEqual(errors,[]);}finally{await context.close();}
});

test('real offline simultaneous AM/retriggers retain continuity and stay below clipping',async()=>{
  const{context,page,errors}=await open(courses[0],true);
  try{
    const r=await page.evaluate(async()=>{
      const rate=48000;audioCtx=new OfflineAudioContext(1,rate*5.7,rate);
      const low=playPianoNote(440),high=playPianoNote(466.1637615);
      schedulePitchOscillation(low,.01,'low');schedulePitchOscillation(high,.01,'high');
      const before=modulationAt(low,.053);schedulePitchOscillation(low,.053,'low');
      const difference=[low.modulation.pitch[0]-before.cents,low.modulation.gain[0]-before.gain];
      schedulePitchOscillation(high,5.4,'high');
      const b=await audioCtx.startRendering(),a=b.getChannelData(0);let peak=0,delta=0,tail=0;
      for(let i=1;i<a.length;i++){peak=Math.max(peak,Math.abs(a[i]));delta=Math.max(delta,Math.abs(a[i]-a[i-1]));if(i>rate*5.5)tail=Math.max(tail,Math.abs(a[i]));}
      return{peak,delta,tail,difference,finite:a.every(Number.isFinite)};
    });
    assert.equal(r.finite,true);assert.ok(r.peak<.98,JSON.stringify(r));assert.ok(r.delta<.1,JSON.stringify(r));assert.equal(r.tail,0);assert.ok(r.difference.every(v=>Math.abs(v)<1e-6));assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test('real AudioContext rapid retriggers and replay finish cleanly at 5.5 seconds',async()=>{
  const{context,page,errors}=await open(courses[0],true);const warnings=[];page.on('console',m=>{if(m.type()==='warning')warnings.push(m.text());});
  try{
    await page.evaluate(()=>{window.__sources=0;const create=AudioContext.prototype.createOscillator;AudioContext.prototype.createOscillator=function(){__sources++;return create.call(this);};});
    await page.locator('#toneBtn').click();await page.waitForFunction(()=>pianoNodesLow.length>0);await page.evaluate(()=>pitchDetails.open=true);
    for(let i=0;i<12;i++){await page.locator('.target-half-box').nth(i%2).click();await page.waitForTimeout(15);}
    assert.ok(Math.abs(await page.locator('.target-half-box').last().evaluate(e=>parseFloat(getComputedStyle(e,'::after').animationDuration))-5/6.5)<1e-6);
    assert.equal(await page.evaluate(()=>__sources),10);
    await page.waitForFunction(()=>!isTonePlaying,{},{timeout:7500});
    assert.deepEqual(await page.evaluate(()=>[pianoNodesLow.length,pianoNodesHigh.length,toneStopTimer,oscillationTimers.low,oscillationTimers.high]),[0,0,null,null,null]);
    await page.locator('#toneBtn').click();await page.waitForFunction(()=>pianoNodesLow.length>0);assert.equal(await page.evaluate(()=>__sources),20);
    await page.evaluate(()=>stopTargetTone());assert.deepEqual(errors,[]);assert.deepEqual(warnings,[]);
  }finally{await context.close();}
});
