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
// Migration aliases are checked against their Phase 0 meanings, never ignored.
async function snapshot(page, details=false) {
  await page.evaluate(() => {for(const a of document.getAnimations()){try{a.finish();}catch{}}scrollTo(0,0);});
  return page.evaluate(async details=>{
    const family=document.documentElement.dataset.visual;
    const aliases={
      '--course-font':'--site-font','--course-focus':'--site-focus',
      '--course-success-text':'--site-success','--course-error-text':'--site-error','--course-border':'--site-border'
    };
    const sizes=family==='ear'?{'--course-content-width':'480px','--course-card-radius':'18px','--course-button-radius':'11px','--course-button-min-height':'46px'}:
      {'--course-content-width':'520px','--course-card-radius':'16px','--course-button-radius':'16px','--course-option-radius':'10px'};
    const sample=(el,pseudo)=>{
      const s=getComputedStyle(el,pseudo),result=Object.fromEntries([...s].map(p=>[p,s.getPropertyValue(p)]));
      for(const [alias,site] of Object.entries(aliases))if(!(alias in result))result[alias]=s.getPropertyValue(site);
      for(const [alias,value] of Object.entries(sizes))if(!(alias in result))result[alias]=value;
      return result;
    };
    const nodes=[],computed=[];
    for(const el of [document.documentElement,...document.body.querySelectorAll('*'),document.body]) {
      const r=el.getBoundingClientRect(),style=sample(el),before=sample(el,'::before'),after=sample(el,'::after');
      const card=String(el.className).split(/\s+/).includes('card');
      for(const value of [style,before,after])computed.push(Object.keys(value).sort().map(k=>[k,value[k]]));
      nodes.push({tag:el.tagName,id:el.id,classes:el.className,disabled:el.disabled,hidden:el.hidden,
        text:el.children.length?null:el.textContent,rect:[r.x,r.y,r.width,r.height],
        style:details||card?style:null,before:details?before:null,after:details?after:null});
    }
    // Compare ALL properties/variables exactly via canonical SHA-256, without
    // moving hundreds of thousands of repeated strings over the browser pipe.
    const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(computed)));
    const computedStylesHash=Array.from(new Uint8Array(bytes)).map(n=>n.toString(16).padStart(2,'0')).join('');
    return {dom:document.body.outerHTML,htmlAttributes:[...document.documentElement.attributes].map(a=>[a.name,a.value]).sort(),dpr:devicePixelRatio,viewport:[innerWidth,innerHeight],nodes,computedStylesHash};

  },details);
}
// Fixed-size, same-source evidence batch. Never seed it with the current raster,
// never retry until green, and never alter a course's source or reference CSS.
async function referenceRasters(browser,url,course,reference,expected,options) {
  const H=require('./harness.cjs'),{isDeepStrictEqual}=require('node:util');
  const body=await reference.evaluate(()=>document.body.innerHTML);const rasters=[];
  for(let i=0;i<8;i++) {
    const run=await H.open(browser,url,course,{...options,reference:true});
    try {
      await run.page.evaluate(html=>{document.body.innerHTML=html;},body);
      const state=await snapshot(run.page);
      if(!isDeepStrictEqual(state,expected))return {rasters,valid:false,reason:'same-source replay changed DOM/style/variables/geometry/state'};
      if(run.errors.length||run.cssFailures.length)return {rasters,valid:false,reason:'same-source replay had loading errors'};
      rasters.push(await run.page.screenshot({fullPage:true,animations:'disabled',caret:'initial'}));
    } finally {await run.context.close();}
  }
  return {rasters,valid:true};
}
module.exports={properties,snapshot,referenceRasters};
