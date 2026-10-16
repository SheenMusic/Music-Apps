const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync('assets/practice-report.js', 'utf8'), context);
const report = context.PracticeReport;
const fixtures = require('./snapshots.json');
for (const fixture of fixtures) test(fixture.name, () => {
  const input = JSON.stringify(fixture.input);
  assert.equal(report.generate(fixture.input), fixture.expected);
  assert.equal(JSON.stringify(fixture.input), input, 'report must not mutate source records');
});
test('time boundaries and original interval spelling', () => {
  for (const [s, expected] of [[0,'0分00秒'],[59,'0分59秒'],[60,'1分00秒'],[169,'2分49秒'],[3600,'60分00秒']]) assert.equal(report.time(s), expected);
  for (const [name, expected] of [['上方大三度','M3'],['下方小七度','m7'],['纯四度','P4'],['增四度','A4'],['减五度','d5'],['增十一度','A11'],['减十二度','d12'],['大十四度','M14'],['特殊音程','特殊音程']]) assert.equal(report.interval(name), expected);
  for (const value of ['Bb3','A#2','F𝄪4','G𝄫3','C♭4','B#3']) assert.equal(report.pitch(value + ' (123.4Hz)'), value);
  assert.equal(report.cents('12.0'), '+12¢'); assert.equal(report.cents('-8.0'), '-8¢'); assert.equal(report.cents('0.0'), '0¢');
});
test('MT incomplete/attempt boundaries retain original accuracy input', () => {
  assert.equal(report.generate({type:'mt',code:'MT03',title:'测试',seconds:0,accuracy:'66.7',records:[{attempts:1,isSolved:true},{attempts:1,isSolved:false},{attempts:0,isSolved:false}]}), '【MT03 · 测试】\n\n完成：1/3题 · 用时：0分00秒\n准确率：66.7% · 一次通过：1题\n\n© Sheen · Music Theory');
});
test('listening all-correct and zero-correct snapshots', () => {
  assert.equal(report.generate({type:'listening',code:'ET02',title:'音程宽窄听辨',seconds:0,correct:2,total:2,accuracy:100,records:[{correct:true},{correct:true}]}), '【ET02 · 音程宽窄听辨】\n\n完成：2题 · 用时：0分00秒\n正确：2/2 · 正确率：100%\n\n✓ 全部正确\n\n© Sheen · Ear Training');
  assert.equal(report.generate({type:'listening',code:'ET01',title:'音高方向听辨',seconds:59,correct:0,total:2,accuracy:0,records:[{correct:false},{correct:false}]}), '【ET01 · 音高方向听辨】\n\n完成：2题 · 用时：0分59秒\n正确：0/2 · 正确率：0%\n\n需要关注：01、02\n\n© Sheen · Ear Training');
});
