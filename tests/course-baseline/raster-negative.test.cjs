const {test}=require('node:test');
const assert=require('node:assert/strict');
const {isDeepStrictEqual}=require('node:util');
const {chromium}=require('playwright');
const {PNG}=require('pngjs');
const H=require('./harness.cjs');
const {snapshot}=require('./visual-state.cjs');
const {comparePNG}=require('./raster-comparison.cjs');

test('Real UI changes remain failures, including one-channel color changes',async()=>{
  const server=await H.serve();const browser=await chromium.launch({executablePath:process.env.COURSE_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  try {
    const mutations=[
      ['card width 1px',()=>{const e=document.querySelector('#practiceCard'),s=document.createElement('style');s.textContent='#practiceCard{width:'+(e.getBoundingClientRect().width-1)+'px}';document.head.appendChild(s);}],
      ['card height 1px',()=>{const e=document.querySelector('#practiceCard'),s=document.createElement('style');s.textContent='#practiceCard{height:'+(e.getBoundingClientRect().height+1)+'px}';document.head.appendChild(s);}],
      ['card radius 1px',()=>{const s=document.createElement('style');s.textContent='#practiceCard{border-top-right-radius:19px}';document.head.appendChild(s);}],
      ['button background RGB 1',()=>{const s=document.createElement('style');s.textContent='#toneBtn{background-color:rgb(37,42,49)}';document.head.appendChild(s);}],
      ['text color RGB 1',()=>{const s=document.createElement('style');s.textContent='#practiceCard .main-title{color:rgb(233,235,239)}';document.head.appendChild(s);}],
      ['position 1px',()=>{const s=document.createElement('style');s.textContent='#practiceCard{transform:translateX(1px)}';document.head.appendChild(s);}],
      ['text content',()=>document.querySelector('.main-title').textContent+=' 改'],
      ['button state',()=>document.querySelector('#toneBtn').disabled=true],
      ['card background RGB 1',()=>{const s=document.createElement('style');s.textContent='#practiceCard{background-color:rgb(29,32,37)}';document.head.appendChild(s);}],
      ['corner overlay color',()=>{const s=document.createElement('style');s.textContent='#practiceCard::after{content:" ";position:fixed;right:0;top:54px;width:2px;height:2px;background:rgb(55,63,72)}';document.head.appendChild(s);}],
      ['CSS variable only',()=>{const s=document.createElement('style');s.textContent='html{--course-border:#38404a}';document.head.appendChild(s);}]

    ];
    for(const [name,mutate] of mutations) {
      const pair=[await H.open(browser,server.url,'ET05',{reference:true,viewport:{width:390,height:844},theme:'dark'}),await H.open(browser,server.url,'ET05',{viewport:{width:390,height:844},theme:'dark'})];
      try {
        await pair[1].page.evaluate(mutate);
        const a=await snapshot(pair[0].page),b=await snapshot(pair[1].page);
        assert.equal(isDeepStrictEqual(a,b),false,name+' must change structural guard');
        if(!['text content','button state'].includes(name)){assert.equal(a.dom,b.dom,name+' keeps body DOM intact');assert.ok(a.computedStylesHash!==b.computedStylesHash||!isDeepStrictEqual(a.nodes,b.nodes),name+' must change computed style/geometry');}
        const pngs=[];for(const run of pair)pngs.push(await run.page.screenshot({fullPage:true,animations:'disabled'}));
        const result=comparePNG(...pngs,{name:'ET05-390x844-dark-initial',structureEqual:isDeepStrictEqual(a,b),cards:a.nodes,scale:a.dpr});
        assert.equal(result.status,'FAIL',name);assert.equal(result.structureChanged,true,name);
        console.log('NEGATIVE_REJECTED: '+name);
      } finally {for(const run of pair)await run.context.close();}
    }
  } finally {await browser.close();await server.close();}
});

test('Pixel-only fabricated changes need same-source proof and cannot enter card interiors',()=>{
  const a=new PNG({width:48,height:48});
  const inside=(x,y,inset)=>{const r=10-inset,l=4+inset,t=4+inset,h=44-inset;
    if(x<l||x>h||y<t||y>h)return false;
    const cx=Math.max(l+r,Math.min(h-r,x)),cy=Math.max(t+r,Math.min(h-r,y));return Math.hypot(x-cx,y-cy)<=r;};
  // Supersampled rounded-card fixture. No course PNG/baseline is updated.
  for(let y=0;y<48;y++)for(let x=0;x<48;x++) {
    const sum=[0,0,0];for(let sy=0;sy<16;sy++)for(let sx=0;sx<16;sx++) {
      const xx=x+(sx+.5)/16,yy=y+(sy+.5)/16;
      const color=inside(xx,yy,1)?[28,32,37]:inside(xx,yy,0)?[56,64,73]:[18,21,24];
      for(let c=0;c<3;c++)sum[c]+=color[c];
    }
    a.data.set([...sum.map(v=>Math.round(v/256)),255],(y*48+x)*4);
  }
  const card={id:'sample',classes:'card',rect:[4,4,40,40],style:{transform:'none'}};
  for(const side of ['top','right','bottom','left'])card.style[`border-${side}-width`]='1px';
  for(const corner of ['top-left','top-right','bottom-left','bottom-right'])card.style[`border-${corner}-radius`]='10px';
  const b=new PNG({width:48,height:48});a.data.copy(b.data);const offset=(10*48+43)*4;b.data[offset]++;
  const options={name:'arbitrary geometry, no coordinate whitelist',structureEqual:true,cards:[card],scale:1};
  const run=(extra={})=>comparePNG(PNG.sync.write(a),PNG.sync.write(b),{...options,...extra});
  assert.equal(run().rasterCandidate,true,'fixture intersects real circular AA boundary');
  assert.equal(run().status,'FAIL','fabricated corner color without independently reproduced source must fail');
  // Mock trusted replay evidence to test classification, not to bypass the production browser guard.
  assert.equal(run({referenceRasters:[PNG.sync.write(b)]}).status,'PASS_WITH_RASTER_VARIANCE');
  b.data[offset]=a.data[offset]+3;assert.equal(run({referenceRasters:[PNG.sync.write(b)]}).status,'FAIL');
  b.data[offset]=a.data[offset]+1;b.data[offset+3]=254;assert.equal(run({referenceRasters:[PNG.sync.write(b)]}).status,'FAIL');
  b.data[offset+3]=255;b.data[(24*48+24)*4]++;assert.equal(run({referenceRasters:[PNG.sync.write(b)]}).status,'FAIL','card interior never tolerated');
  b.data[(24*48+24)*4]--;assert.equal(run({structureEqual:false,referenceRasters:[PNG.sync.write(b)]}).status,'FAIL');
});
