const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const cp = require('node:child_process');
const vm = require('node:vm');
const courses = require('./courses.json');
const protection = require('../header-footer/protection.cjs');
// Published report implementation is immutable. Later authorized UI work may
// edit styles; it must preserve all report scripts, markup, handlers and data.
const BASE = '70c9f0cc6d46f2f14e2b27ff2347881c58cf3e38';
const git = (...args) => cp.execFileSync('git', args, {encoding:'utf8'});
const withoutStyles = text => protection.earHTML(text).replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
// MT is now protected by the 90-question baseline + shared-engine and report
// snapshot tests in tests/music-apps-v1; ET remains byte-protected below.
test('ET practice report scripts, DOM, data/history and clipboard handlers match the published implementation', () => {
  for (const course of courses.filter(c => c.type !== 'mt')) {
    for (const path of [course.path, ...(course.type === 'listening' ? [course.path.replace('index.html','script.js')] : [])]) {
      const previous = git('show', BASE + ':' + path);
      const current = fs.readFileSync(path, 'utf8');
      assert.equal(withoutStyles(current), withoutStyles(previous), path);
      if (path.endsWith('.js')) new vm.Script(current);
      else for (const m of current.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) if (!/\bsrc\s*=/.test(m[1])) new vm.Script(m[2]);
    }
  }
});
test('published report core and existing time utility remain byte-identical', () => {
  for (const path of ['assets/practice-report.js','MT-Intervals/shared/utils/format-time.js']) assert.equal(fs.readFileSync(path,'utf8'),git('show',BASE+':'+path),path);
  assert.equal(courses.length, 23);
});
