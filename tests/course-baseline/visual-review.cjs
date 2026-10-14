// An explicit human decision never changes the automatic PNG classification.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),{createHash}=require('node:crypto');
const H=require('./harness.cjs');
const {comparePNG}=require('./raster-comparison.cjs');
const hash=x=>createHash('sha256').update(x).digest('hex');
// Approval-only commits do not change the reviewed candidate and cannot self-reference their own SHA.
function candidateCommit(root=H.ROOT){
 const git=args=>execFileSync('git',args,{cwd:root}).toString().trim();let commit=git(['rev-parse','HEAD']);
 for(;;){let parent;try{parent=git(['rev-parse',commit+'^']);}catch{return commit;}
 const changes=git(['diff','--name-only',parent,commit]).split('\n').filter(Boolean);
 if(!changes.length||!changes.every(f=>f==='tests/course-baseline/visual-review-decisions.json'))return commit;commit=parent;}
}
function identity(summary,diagnostic,output,prefix=diagnostic.name){
 const files=execFileSync('git',['ls-files','-z'],{cwd:H.ROOT}).toString().split('\0').filter(f=>f&&(/^(ET-Intervals|MT-Intervals|assets)\//.test(f)||/^tests\/course-baseline\/.*\.(cjs|json)$/.test(f)));
 // Include new uncommitted test helpers, so changing a rule always invalidates approval.
 for(const file of fs.readdirSync(__dirname).filter(f=>/\.(cjs|json)$/.test(f)&&f!=='visual-review-decisions.json').map(f=>'tests/course-baseline/'+f))if(!files.includes(file))files.push(file);
 for(const f of fs.readdirSync(path.join(H.ROOT,'docs/course-phase1-visual-review')))files.push('docs/course-phase1-visual-review/'+f);files.push('docs/course-phase1-visual-risk-review.md');
 const fingerprint=hash(JSON.stringify(files.filter(f=>!f.endsWith('/visual-review-decisions.json')).sort().map(f=>[f,hash(fs.readFileSync(path.join(H.ROOT,f)))])));
 const rawDiagnostic=JSON.parse(fs.readFileSync(path.join(output,prefix+'-diagnostic.json')));
 if(prefix===diagnostic.name&&JSON.stringify(rawDiagnostic)!==JSON.stringify(diagnostic))throw Error('Diagnostic evidence changed: '+diagnostic.name);
 const before=fs.readFileSync(path.join(output,prefix+'-before.png')),after=fs.readFileSync(path.join(output,prefix+'-after.png'));
 if(hash(before)!==diagnostic.beforeSHA256||hash(after)!==diagnostic.afterSHA256)throw Error('Screenshot evidence changed: '+diagnostic.name);
 return {caseName:diagnostic.name,phase0Commit:summary.baseline,integrationCommit:candidateCommit(),sourceAndRulesSHA256:fingerprint,beforeSHA256:hash(before),afterSHA256:hash(after),diagnosticSHA256:hash(JSON.stringify(diagnostic)),originalDiagnostic:diagnostic};
}
// Historical failures remain independently pending; new strict images do not erase them.
function historicalRequests(){
 const folder=path.join(H.ROOT,'docs/course-phase1-visual-review'),manifest=JSON.parse(fs.readFileSync(path.join(folder,'manifest.json'))),summary={baseline:H.BASE};
 for(const [file,expected] of Object.entries(manifest.reviewArtifacts))if(hash(fs.readFileSync(path.join(folder,file)))!==expected)throw Error('Original review artifact changed: '+file);
 return ['et05','et06'].map(tag=>{
  for(const suffix of ['before.png','after.png','diagnostic.json']){const f=tag+'-'+suffix;if(hash(fs.readFileSync(path.join(folder,f)))!==manifest[f])throw Error('Original review evidence changed: '+f);}
  const raw=JSON.parse(fs.readFileSync(path.join(folder,tag+'-diagnostic.json')));
  if(raw.structureChanged||!raw.rasterCandidate||raw.status!=='FAIL')throw Error('Historical review is not an eligible preserved failure');
  let card;
  if(tag==='et06')card=JSON.parse(fs.readFileSync(path.join(folder,'et06-geometry.json'))).card;
  else{const g=JSON.parse(fs.readFileSync(path.join(folder,'caret-probe.json')))[0].before.card;card={id:'practiceCard',classes:'card',rect:g.rect,style:{transform:'none'}};for(const side of ['top','right','bottom','left'])card.style['border-'+side+'-width']='1px';for(const corner of ['top-left','top-right','bottom-left','bottom-right'])card.style['border-'+corner+'-radius']=g.radius;}
  const before=fs.readFileSync(path.join(folder,tag+'-before.png')),after=fs.readFileSync(path.join(folder,tag+'-after.png'));
  const bounded=comparePNG(before,after,{name:raw.name,structureEqual:true,cards:[card],scale:1});if(bounded.status!=='REVIEW_REQUIRED')throw Error('Historical pixels no longer satisfy unchanged rounded-edge bounds');
  const q=identity(summary,{...raw,beforeSHA256:hash(before),afterSHA256:hash(after)},folder,tag);
  return {...q,scope:'historical-preserved-failure',originalDiagnostic:raw,diagnosticSHA256:hash(JSON.stringify(raw))};
 });
}
function validateApproval(request,record){
 if(!record||record.conclusion!=='APPROVED'||!record.reviewer?.trim()||!record.reason?.trim()||!/^\d{4}-\d\d-\d\dT/.test(record.reviewedAt||'')||!Number.isFinite(Date.parse(record.reviewedAt))||Date.parse(record.reviewedAt)>Date.now())return false;
 return ['runEvidenceSHA256','scope','caseName','phase0Commit','integrationCommit','sourceAndRulesSHA256','beforeSHA256','afterSHA256','diagnosticSHA256'].every(k=>request[k]===record[k])&&JSON.stringify(request.originalDiagnostic)===JSON.stringify(record.originalDiagnostic);
}
function gate(summary,requests,records){
 if(summary.automaticFailures||summary.rasterCounts.FAIL||summary.comparisons!==378||summary.screenshotComparisons!==84)return {status:'BLOCKED',reason:'automatic failure or incomplete visual matrix'};
 if(requests.filter(q=>q.scope==='current-run').length!==(summary.rasterCounts.REVIEW_REQUIRED||0))return {status:'BLOCKED',reason:'missing current review requests'};
 if(requests.some(q=>!records.some(r=>validateApproval(q,r))))return {status:'BLOCKED',reason:'missing, rejected or stale explicit human approval'};
 return {status:'VISUAL_GATE_SATISFIED',reason:'strict/verified results and all required human approvals valid; deployment still requires authorization'};
}
if(require.main===module){
 try{const output=process.argv[2];if(!output)throw Error('Usage: node visual-review.cjs OUTPUT [APPROVALS_JSON]');const summary=JSON.parse(fs.readFileSync(path.join(output,'summary.json')));for(const d of summary.diagnostics){for(const suffix of ['before','after'])if(hash(fs.readFileSync(path.join(output,d.name+'-'+suffix+'.png')))!==d[suffix+'SHA256'])throw Error('Run PNG changed: '+d.name);if(JSON.stringify(JSON.parse(fs.readFileSync(path.join(output,d.name+'-diagnostic.json'))))!==JSON.stringify(d))throw Error('Run diagnostic changed: '+d.name);}
 if(summary.baseline!==H.BASE)throw Error('Phase 0 baseline changed');
 const requests=[...summary.diagnostics.filter(d=>d.status==='REVIEW_REQUIRED').map(d=>({...identity(summary,d,output),scope:'current-run'})),...historicalRequests()].map(q=>({...q,runEvidenceSHA256:hash(JSON.stringify(summary))}));fs.writeFileSync(path.join(output,'review-requests.json'),JSON.stringify({requests},null,2));const records=process.argv[3]?JSON.parse(fs.readFileSync(process.argv[3])).decisions:[];if(!Array.isArray(records)||records.some(r=>!['APPROVED','REJECTED'].includes(r.conclusion)||!['scope','caseName','phase0Commit','integrationCommit','sourceAndRulesSHA256','runEvidenceSHA256','beforeSHA256','afterSHA256','diagnosticSHA256','reviewer','reviewedAt','reason'].every(k=>typeof r[k]==='string'&&r[k].trim())||!r.originalDiagnostic||typeof r.originalDiagnostic!=='object'))throw Error('Decision records require every audit field and an explicit APPROVED/REJECTED conclusion');const result=gate(summary,requests,records||[]);console.log(JSON.stringify({...result,pending:requests.filter(q=>!(records||[]).some(r=>validateApproval(q,r))).length,requestsFile:path.join(output,'review-requests.json')}));if(result.status==='BLOCKED')process.exitCode=1;}catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={candidateCommit,identity,historicalRequests,validateApproval,gate};
