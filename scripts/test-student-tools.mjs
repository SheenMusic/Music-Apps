/* Integration fixtures are generated locally in a temporary repository; no real student data. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'student-tools-test-'));
const run=(file,args=[],code=0)=>{
 const result=spawnSync(process.execPath,[path.join(temp,'scripts',file),...args],{cwd:temp,encoding:'utf8'});
 assert.equal(result.status,code,result.stdout+result.stderr);return result.stdout+result.stderr;
};
const writeData=(directory,data)=>fs.writeFileSync(path.join(directory,'student-data.js'),'const studentData = '+JSON.stringify(data)+';\n');
try {
 for(const file of ['scripts/student-config.mjs','scripts/generate-student-pages.mjs','scripts/validate-students.mjs','students/shared/index.template.html','students/shared/dashboard-logic.js','learning-resources/course-catalog.js','learning-resources/interval-theory.js']) {
  const target=path.join(temp,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,file),target);
 }
 const display='测试 <&"\'名字';
 run('generate-student-pages.mjs',['--new',display]);
 const names=fs.readdirSync(path.join(temp,'students')).filter(name=>name!=='shared');
 assert.equal(names.length,1);assert.match(names[0],/^[a-f0-9]{32}$/);
 const directory=path.join(temp,'students',names[0]),htmlFile=path.join(directory,'index.html'),dataFile=path.join(directory,'student-data.js');
 const original=fs.readFileSync(htmlFile,'utf8');
 assert.ok(original.includes('测试 &lt;&amp;&quot;&#39;名字 · Learning Dashboard'));
 const hash=crypto.createHash('sha1').update(fs.readFileSync(dataFile)).digest('hex').slice(0,8);
 assert.ok(original.includes('student-data.js?v='+hash));
 run('generate-student-pages.mjs',['--check']);run('validate-students.mjs');run('generate-student-pages.mjs');assert.equal(fs.readFileSync(htmlFile,'utf8'),original);
 fs.appendFileSync(htmlFile,'<!-- changed -->');const tampered=fs.readFileSync(htmlFile,'utf8');
 run('generate-student-pages.mjs',['--check'],1);assert.equal(fs.readFileSync(htmlFile,'utf8'),tampered);
 run('generate-student-pages.mjs');assert.equal(fs.readFileSync(htmlFile,'utf8'),original);
 fs.writeFileSync(htmlFile,'<!doctype html><p>Hand-maintained feature</p>');
 run('generate-student-pages.mjs',[],1);run('generate-student-pages.mjs',['--migrate'],1);
 assert.equal(fs.readFileSync(htmlFile,'utf8'),'<!doctype html><p>Hand-maintained feature</p>');fs.writeFileSync(htmlFile,original);
 const empty={studentName:'Test',courses:[],learningPeriods:[]};
 writeData(directory,{...empty,courses:[{id:'unknown',title:'Test',status:'active',accessEnabled:false}]});run('validate-students.mjs',[],1);
 const enrolled=[{id:'chord-theory',title:'Test',status:'completed',accessEnabled:false},{id:'interval-theory',title:'Test',status:'completed',accessEnabled:false}];
 writeData(directory,{...empty,courses:enrolled});run('validate-students.mjs');
 writeData(directory,{...empty,courses:[...enrolled,enrolled[0]]});run('validate-students.mjs',[],1);
 const active={id:'interval-ear-training',title:'音程听力训练',status:'active',accessEnabled:true,currentLessons:[1],accessibleLessons:[1],accessibleSupplementary:[]};
 writeData(directory,{...empty,courses:[{...active,currentLessons:[2]}]});run('validate-students.mjs',[],1);
 writeData(directory,{...empty,courses:[{...active,status:'wrong'}]});run('validate-students.mjs',[],1);
 writeData(directory,{...empty,courses:[{...active,accessibleSupplementary:['unknown']}]});run('validate-students.mjs',[],1);
 writeData(directory,{...empty,courses:[{...active,accessibleLessons:[1,999]}]});assert.match(run('validate-students.mjs'),/资源待补充/);
 writeData(directory,{...empty,learningPeriods:[{id:'p',start:'2026-01-01T00:00:00',end:'2026-01-10T00:00:00Z'}]});run('validate-students.mjs',[],1);
 writeData(directory,{...empty,learningPeriods:[{id:'p',start:'2026-01-10T00:00:00Z',end:'2026-01-01T00:00:00Z'}]});run('validate-students.mjs',[],1);
 writeData(directory,{...empty,learningPeriods:[{id:'p',start:null,end:null}]});run('validate-students.mjs');
 const historic={...empty,courses:[active],learningPeriods:[{id:'p',start:'2000-01-01T00:00:00Z',end:'2000-01-15T00:00:00Z'}]};
 writeData(directory,historic);assert.match(run('validate-students.mjs'),/已过期 \d+ 天/);
 writeData(directory,empty);const renamed=path.join(temp,'students','old-style-directory');fs.renameSync(directory,renamed);
 run('validate-students.mjs',[],1);run('validate-students.mjs',['--allow-legacy-directories']);
 console.log('PASS student tooling: stable generation, escaped names, content hashes, read-only check, overwrite protection, random --new, enrollment/resource validation and error branches');
} finally {fs.rmSync(temp,{recursive:true,force:true});}
