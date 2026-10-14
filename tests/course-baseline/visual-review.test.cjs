const {test}=require('node:test'),assert=require('node:assert/strict');
const {validateApproval,gate}=require('./visual-review.cjs');
test('Human approval is explicit, evidence-bound, revocable and never exempts a real failure',()=>{
 const q={runEvidenceSHA256:'run',caseName:'fixture',phase0Commit:'base',integrationCommit:'head',sourceAndRulesSHA256:'rules',beforeSHA256:'before',afterSHA256:'after',diagnosticSHA256:'diagnostic',originalDiagnostic:{status:'REVIEW_REQUIRED'}};
 // Synthetic unit fixture only; never written as an actual human decision.
 const r={...q,conclusion:'APPROVED',reviewer:'unit-test actor',reviewedAt:'2026-01-01T00:00:00Z',reason:'synthetic validator fixture'};
 assert.equal(validateApproval(q,r),true);for(const k of ['runEvidenceSHA256','caseName','phase0Commit','integrationCommit','sourceAndRulesSHA256','beforeSHA256','afterSHA256','diagnosticSHA256'])assert.equal(validateApproval(q,{...r,[k]:'changed'}),false,k);
 for(const patch of [{conclusion:'REJECTED'},{conclusion:'PASS'},{reviewer:''},{reason:''},{reviewedAt:'invalid'},{reviewedAt:'2099-01-01T00:00:00Z'},{originalDiagnostic:{status:'PASS'}}])assert.equal(validateApproval(q,{...r,...patch}),false);
 const s={comparisons:378,screenshotComparisons:84,rasterCounts:{FAIL:0}};
 assert.equal(gate(s,[q],[]).status,'BLOCKED');assert.equal(gate(s,[q],[{...r,conclusion:'REJECTED'}]).status,'BLOCKED');assert.equal(gate({...s,rasterCounts:{FAIL:1}},[q],[r]).status,'BLOCKED');assert.equal(gate({...s,comparisons:377},[q],[r]).status,'BLOCKED');assert.equal(gate(s,[q],[r]).status,'VISUAL_GATE_SATISFIED');
});


test('An approval-only commit preserves candidate identity; rule/evidence changes invalidate it',()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'course-approval-identity-')),git=args=>execFileSync('git',args,{cwd:dir,stdio:['ignore','pipe','pipe']}).toString().trim();
 try{git(['init']);git(['config','user.email','fixture@example.invalid']);git(['config','user.name','Synthetic fixture']);fs.mkdirSync(path.join(dir,'tests/course-baseline'),{recursive:true});fs.writeFileSync(path.join(dir,'rules.cjs'),'rule');git(['add','.']);git(['commit','-m','candidate']);const base=git(['rev-parse','HEAD']);
 fs.writeFileSync(path.join(dir,'tests/course-baseline/visual-review-decisions.json'),'{}');git(['add','.']);git(['commit','-m','decision only']);assert.equal(require('./visual-review.cjs').candidateCommit(dir),base);
 fs.writeFileSync(path.join(dir,'rules.cjs'),'changed');git(['add','.']);git(['commit','-m','rule change']);assert.notEqual(require('./visual-review.cjs').candidateCommit(dir),base);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
