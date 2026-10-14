const {test}=require('node:test'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const H=require('./harness.cjs'),{snapshot,referenceRasters}=require('./visual-state.cjs'),{comparePNG}=require('./raster-comparison.cjs');
test('Native-caret screenshots preserve strict DOM, checkbox state and visible course content',async()=>{
 const s=await H.serve(),b=await chromium.launch({executablePath:process.env.COURSE_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const course of Object.keys(H.COURSES)){const r=await H.open(b,s.url,course,{reference:true,viewport:{width:390,height:844},theme:'dark'});try{
 const before=await snapshot(r.page),controls=()=>r.page.evaluate(()=>[...document.querySelectorAll('input,textarea,[contenteditable]')].map(e=>({id:e.id,style:e.getAttribute('style'),checked:e.checked,disabled:e.disabled,value:e.value,focus:e===document.activeElement}))),c=await controls();
 // Reject this technique for focused editable controls with a visible text caret.
 assert.equal(await r.page.evaluate(()=>document.activeElement.matches('input:not([type=checkbox]):not([type=radio]),textarea,[contenteditable]')),false);
 const native=await r.page.screenshot({fullPage:true,animations:'disabled',caret:'initial'});assert.deepEqual(await snapshot(r.page),before);assert.deepEqual(await controls(),c);
 const hidden=await r.page.screenshot({fullPage:true,animations:'disabled'});
 const result=comparePNG(native,hidden,{structureEqual:true,cards:before.nodes,scale:before.dpr});assert.ok(['PASS','REVIEW_REQUIRED','PASS_WITH_RASTER_VARIANCE'].includes(result.status),'caret must not change visible content except bounded existing raster microvariance');
 if(course==='ET05'){assert.equal(await r.page.locator('#headphoneCheckbox').getAttribute('style'),'');assert.equal(c.find(x=>x.id==='headphoneCheckbox').style,null);}
 }finally{await r.context.close();}}
 const r=await H.open(b,s.url,'ET05',{reference:true,viewport:{width:390,height:844},theme:'dark'});try{const expected=await snapshot(r.page);await r.page.screenshot({fullPage:true,animations:'disabled',caret:'initial'});const evidence=await referenceRasters(b,s.url,'ET05',r.page,expected,{viewport:{width:390,height:844},theme:'dark'});assert.equal(evidence.valid,true);assert.equal(evidence.rasters.length,8);}finally{await r.context.close();}
 }finally{await b.close();await s.close();}
});
