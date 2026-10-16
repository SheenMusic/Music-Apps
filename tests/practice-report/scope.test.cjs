const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const cp = require('node:child_process');
const vm = require('node:vm');
const courses = require('./courses.json');
const BASE = 'b646194a31eace69143421ff72a6f84c95b4cbae';
const git = (...args) => cp.execFileSync('git', args, {encoding:'utf8'});
function withoutReport(source, course, script = false) {
  let text = source.replace(/<script src="(?:\.\.\/)+assets\/practice-report\.js"><\/script>\n?/g, '');
  if (course.type === 'listening') {
    if (script) text = text.replace(/window\.lastTestText=[\s\S]*?;/, '/* report text */');
  } else if (course.type === 'mt') {
    text = text.replace(/    const (?:problemItems|reportText) =[\s\S]*?(?=    copyTextToClipboard\(reportText\))/, '/* report text */\n');
  } else {
    text = text.replace(/    (?:let text|const text) =[\s\S]*?(?=    navigator.clipboard.writeText\(text\))/, '/* report text */\n');
  }
  return text;
}
test('all original teaching code, DOM, CSS, records/history and clipboard handlers are unchanged outside text adapters', () => {
  for (const course of courses) {
    for (const path of [course.path, ...(course.type === 'listening' ? [course.path.replace('index.html','script.js')] : [])]) {
      const previous = git('show', BASE + ':' + path);
      const current = fs.readFileSync(path, 'utf8');
      assert.equal(withoutReport(current, course, path.endsWith('.js')), withoutReport(previous, course, path.endsWith('.js')), path);
      if (path.endsWith('.js')) new vm.Script(current);
      else for (const m of current.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) if (!/\bsrc\s*=/.test(m[1])) new vm.Script(m[2]);
    }
  }
});
test('existing file changes are limited to 23 practice entries and ET01/02 report assignments', () => {
  const allowed = new Set(courses.flatMap(c => [c.path, ...(c.type === 'listening' ? [c.path.replace('index.html','script.js')] : [])]));
  for (const path of git('diff', '--name-only', BASE, '--').trim().split('\n').filter(Boolean)) {
    if (path === 'assets/practice-report.js' || path.startsWith('tests/practice-report/')) continue;
    assert(allowed.has(path), 'Unexpected existing file modification: ' + path);
  }
  assert.equal(courses.length, 23);
});
