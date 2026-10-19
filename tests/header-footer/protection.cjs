// Normalize only the explicitly authorized header changes. Everything else in
// Learning and Practice remains protected against the fixed published source.
const fs = require('node:fs');
const path = require('node:path');
const BASE = '406abcc8b2c8b93cad31c30fb7e4da7cbc0dae21';
const earPages = fs.readdirSync('ET-Intervals').filter(n => /^\d\d-/.test(n)).sort().map(n => path.posix.join('ET-Intervals',n,'index.html'));
function practice(source) {
  return source.replace(/<header class="app-header">[\s\S]*?<\/header>/,'<header class="app-header"></header>')
    .replace("  text('lessonTag', data.code);\n",'')
    .replace("  text('questionCounter', '1 / ' + data.questions.length);\n",'')
    .replace("show('headerMeta', playing || review)","show('questionCounter', playing || review)");
}
function learningJS(source) {
  return source.replace(/function updateHeaderLessonCount\(i\)\{[\s\S]*?\n\}/,'function updateHeaderLessonCount(i){}')
    .replaceAll('updateHeaderLessonCount(-1);','');
}
function learningDOM(source) {
  return source.replace(/<span class="lesson-count" id="headerLessonCount"(?: hidden)?>[^<]*<\/span>/,'<span class="lesson-count" id="headerLessonCount"></span>');
}
function earHTML(source) {
  return source.replace(/\n  <link rel="stylesheet" href="\.\.\/shared\/styles\/chrome-typography.css">/,'');
}
function earSimpleCSS(source) {
  return source.replace(/([^{}]+)\{([^{}]*)\}/g,(all,selector,declarations)=>
    ['.topbar','footer','.topbar div'].includes(selector.trim())
      ? selector+'{'+declarations.replace(/(?:font-family|font-size|font-weight|line-height|letter-spacing|color):[^;}]+;?/g,'')+'}' : all);
}

const allowed = new Set([
  ...earPages.slice(2), ...earPages.slice(0,2).map(p=>p.replace('index.html','style.css')),
  ...Array.from({length:5},(_,i)=>`MT-Intervals/lesson0${i+1}/index.html`),
  'shared/practice/practice-ui.js','shared/styles/course-shell.css',
  'ET-Intervals/shared/styles/chrome-typography.css',
  'tests/header-footer/protection.cjs','tests/header-footer/header-footer.test.cjs',
  'tests/music-apps-v1/home-shell.test.cjs','tests/music-apps-v1/system.test.cjs',
  'tests/theory-learning/learning.test.cjs','tests/practice-report/scope.test.cjs'
]);
module.exports = {BASE,earPages,practice,learningJS,learningDOM,earHTML,earSimpleCSS,allowed};
