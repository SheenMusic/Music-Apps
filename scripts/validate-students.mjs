import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {root,readConfig,studentDirectories} from './student-config.mjs';
const L = createRequire(import.meta.url)('../students/shared/dashboard-logic.js');
const args=process.argv.slice(2);
if (args.some(arg=>arg!=='--allow-legacy-directories')) {console.error('Unknown argument');process.exit(1);}
const legacy=args.includes('--allow-legacy-directories');
let errors=0,warnings=0,catalog;
const report=(level,file,message)=>{console[level==='ERROR'?'error':'warn'](`${level} ${file}: ${message}`);level==='ERROR'?errors++:warnings++;};
try {catalog=readConfig(path.join(root,'learning-resources/course-catalog.js'),'courseCatalog');}
catch(error) {report('WARNING','Catalog',`无法加载，跳过 Catalog 检查：${error.message}`);}
// Enrollment courses are not identical to online resource collections.
// These are current teaching products: PDF-based chord theory and the MT app.
const enrollmentIDs = new Set(['chord-theory','interval-theory']);
let theoryResources;
try {theoryResources=readConfig(path.join(root,'learning-resources/interval-theory.js'),'intervalTheoryResources');}
catch(error) {report('WARNING','MT resources',`资源映射未加载：${error.message}`);}
const now=Date.now();
for (const directory of studentDirectories()) {
  const relative=path.relative(root,directory), name=path.basename(directory);
  if (!/^[0-9a-f]{32}$/.test(name) && !legacy) report('ERROR',relative,'目录必须为32位随机十六进制字符串');
  let data;
  try {data=readConfig(path.join(directory,'student-data.js'),'studentData');}
  catch(error) {report('ERROR',relative,error.message);continue;}
  if (typeof data.studentName!=='string' || !data.studentName.trim()) report('ERROR',relative,'studentName 必须为非空字符串');
  if (data.showPeriodDuration!==undefined && typeof data.showPeriodDuration!=='boolean') report('ERROR',relative,'showPeriodDuration 必须为布尔值');
  if (!Array.isArray(data.courses) || !Array.isArray(data.learningPeriods)) {report('ERROR',relative,'courses 和 learningPeriods 必须为数组');continue;}
  const ids=new Set();
  for (const course of data.courses) {
    if (!course || typeof course!=='object' || typeof course.id!=='string' || !course.id.trim()) {report('ERROR',relative,'课程结构或 ID 无效');continue;}
    if (ids.has(course.id)) report('ERROR',relative,`课程 ID 重复：${course.id}`);ids.add(course.id);
    if (!['completed','active','previous'].includes(course.status)) report('ERROR',relative,`status 无效：${course.id}`);
    if (typeof course.title!=='string' || !course.title.trim()) report('ERROR',relative,`title 无效：${course.id}`);
    if (typeof course.accessEnabled!=='boolean') report('ERROR',relative,`accessEnabled 无效：${course.id}`);
    for (const field of ['currentLessons','accessibleLessons']) {
      if (course[field]!==undefined && (!Array.isArray(course[field]) || course[field].some(n=>!Number.isInteger(n) || n<1))) report('ERROR',relative,`${field} 必须为正整数数组`);
    }
    const current=Array.isArray(course.currentLessons)?course.currentLessons:[],accessible=Array.isArray(course.accessibleLessons)?course.accessibleLessons:[];
    if (current.some(n=>!accessible.includes(n))) report('ERROR',relative,`currentLessons 不是 accessibleLessons 的子集：${course.id}`);
    const catalogResource=catalog?.courses?.[course.id];
    const resource=catalogResource || (course.id==='interval-theory' ? theoryResources : undefined);
    if (catalog && !catalogResource && !enrollmentIDs.has(course.id)) report('ERROR',relative,`课程 ID 不存在于 Catalog：${course.id}`);
    if (resource) {
      if (!catalogResource && course.accessEnabled && accessible.length) report('WARNING',relative,`在线资源存在，但现有 Dashboard 不映射此报名课程，将显示资源待补充：${course.id}`);
      if (catalogResource?.title && course.title!==catalogResource.title) report('WARNING',relative,`课程标题与 Catalog 不一致：${course.id}`);
      for (const number of accessible) {
        const lesson=resource.lessons?.find(item=>item.number===number);
        if (!lesson) report('WARNING',relative,`正式课时不存在，将显示资源待补充：${course.id}/${number}`);
        else if (!lesson.isFormal) report('WARNING',relative,`非正式课时，将显示资源待补充：${course.id}/${number}`);
        else if (typeof lesson.practiceURL!=='string' || !lesson.practiceURL.trim()) report('WARNING',relative,`课时缺少资源入口：${course.id}/${number}`);
      }
    }
    if (!resource && enrollmentIDs.has(course.id) && accessible.length) report('WARNING',relative,`配置了尚无在线资料的课时，将显示资源待补充：${course.id}`);
    if (course.accessibleSupplementary!==undefined && (!Array.isArray(course.accessibleSupplementary) || course.accessibleSupplementary.some(id=>typeof id!=='string'))) report('ERROR',relative,'accessibleSupplementary 必须为字符串数组');
    else if (catalog) for (const id of course.accessibleSupplementary || []) {
      if (!catalog.supplementaryExercises?.some(item=>item.id===id && item.isSupplementary)) report('ERROR',relative,`补充练习 ID 不存在或不是补充练习：${id}`);
    }
  }
  const periodIDs=new Set();
  for (const period of data.learningPeriods) {
    if (!period || typeof period!=='object' || typeof period.id!=='string' || !period.id.trim()) {report('ERROR',relative,'周期结构或 ID 无效');continue;}
    if (periodIDs.has(period.id)) report('ERROR',relative,`周期 ID 重复：${period.id}`);periodIDs.add(period.id);
    if (period.start===null && period.end===null) continue;
    const validation=L.validatePeriod(period);
    if (!validation.valid) report('ERROR',relative,`周期 ${period.id}：${validation.reason}`);
  }
  const selected=L.pickLatestPeriod(data.learningPeriods,now);
  if (selected && Date.parse(selected.end)<=now) report('WARNING',relative,`最近历史有效期已过期 ${Math.floor((now-Date.parse(selected.end))/86400000)} 天（不影响资源访问）`);
}
console.log(`Validation: ${errors} Error, ${warnings} Warning${legacy?' (legacy directory migration mode)':''}`);
process.exitCode=errors ? 1 : 0;
