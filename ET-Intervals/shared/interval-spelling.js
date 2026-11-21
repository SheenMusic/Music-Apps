/* ET 音程题的音名规则（ET05–18 共用，规则说明见 docs/project-handover.md 5.3）
 *
 * 1. 题目只用 17 个常用音名：7 个自然音，加上 5 个黑键的升、降两种写法
 *    （C#/Db、D#/Eb、F#/Gb、G#/Ab、A#/Bb）。
 *    不出现 Cb、B#、Fb、E# 和任何重升重降。
 * 2. 两个音的字母距离严格等于音程度数（度数从音程名称读取，不从半音数推断）。
 * 3. 起始音是黑键时，升、降两种写法都试，在能让目标音也合规的写法里随机选一种。
 * 4. 先列出音区内所有合规的题目，再随机抽取；不靠「重试 N 次」，所以不会漏出怪写法。
 * 5. 八度号按字母计算（与科学音高记法一致）。
 */
(function (root) {
  'use strict';

  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const NATURAL_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const DEGREES = {
    一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10,
    十一: 11, 十二: 12, 十三: 13, 十四: 14
  };

  function pitchClass(midi) {
    return ((midi % 12) + 12) % 12;
  }

  function accSuffix(acc) {
    if (acc === 1) return '#';
    if (acc === -1) return 'b';
    if (acc === 2) return '##';
    if (acc === -2) return 'bb';
    return '';
  }

  // 规则 1：只允许自然音和 C#/Db、D#/Eb、F#/Gb、G#/Ab、A#/Bb
  function isCommonSpelling(letter, acc) {
    if (acc === 0) return true;
    if (acc === 1) return letter !== 'E' && letter !== 'B';
    if (acc === -1) return letter !== 'C' && letter !== 'F';
    return false;
  }

  // 某个音级的所有常用写法（白键 1 种，黑键 2 种）
  function commonSpellings(pc) {
    return LETTERS.flatMap(letter => {
      let acc = pc - NATURAL_PC[letter];
      if (acc > 6) acc -= 12;
      if (acc < -6) acc += 12;
      return isCommonSpelling(letter, acc) ? [{ letter, acc }] : [];
    });
  }

  // 规则 5：八度号按字母计算，例如 B#3 = MIDI 60、Cb4 = MIDI 59
  function noteName(letter, acc, midi) {
    const octave = Math.round((midi - acc - NATURAL_PC[letter]) / 12) - 1;
    return `${letter}${accSuffix(acc)}${octave}`;
  }

  // 从音程名称读度数：「上方小三度」→ 3，「减十二度」→ 12
  function degreeOf(name) {
    const match = String(name).match(/(十四|十三|十二|十一|十|九|八|七|六|五|四|三|二|一)度/);
    if (!match) throw new Error(`无法从音程名称读出度数：${name}`);
    return DEGREES[match[1]];
  }

  // 规则 2：从起始音的写法出发，按度数数字母，得出目标音的写法
  function spellTarget(ref, delta, degree, targetPc) {
    const steps = (degree - 1) * Math.sign(delta);
    const letter = LETTERS[(((LETTERS.indexOf(ref.letter) + steps) % 7) + 7) % 7];
    let acc = targetPc - NATURAL_PC[letter];
    while (acc > 6) acc -= 12;
    while (acc < -6) acc += 12;
    return { letter, acc };
  }

  function candidatesFor(refMidi, delta, degree) {
    const targetMidi = refMidi + delta;
    const targetPc = pitchClass(targetMidi);
    const spellings = commonSpellings(pitchClass(refMidi))
      .map(ref => ({ ref, target: spellTarget(ref, delta, degree, targetPc) }))
      .filter(option => isCommonSpelling(option.target.letter, option.target.acc));
    return spellings.length ? { refMidi, targetMidi, spellings } : null;
  }

  function randomItem(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function describe(letter, acc, midi) {
    return { letter, acc, name: letter + accSuffix(acc), display: noteName(letter, acc, midi) };
  }

  /* 出一道题。
   * refMin / refMax：起始音（构唱的参考音、和声的低音）可选的 MIDI 范围，由各课自己决定
   * delta：目标音减起始音的半音数，向上为正、向下为负
   * degree：音程度数（1–14）
   * avoidTargetClass：尽量避开的目标音音级（构唱课避免连续两题目标音相同），可省略
   */
  function pickQuestion({ refMin, refMax, delta, degree, avoidTargetClass = -1 }) {
    let low = refMin;
    let high = Math.max(refMin, refMax);
    let candidates = [];
    // 音区太窄、里面没有合规题目时，向两边各扩 1 个半音再找（最多 12 次，必定能找到）
    for (let widen = 0; widen <= 12 && !candidates.length; widen++) {
      candidates = [];
      for (let midi = low; midi <= high; midi++) {
        const candidate = candidatesFor(midi, delta, degree);
        if (candidate) candidates.push(candidate);
      }
      low -= 1;
      high += 1;
    }
    const fresh = candidates.filter(c => pitchClass(c.targetMidi) !== avoidTargetClass);
    const chosen = randomItem(fresh.length ? fresh : candidates);
    const spelling = randomItem(chosen.spellings);
    return {
      refMidi: chosen.refMidi,
      targetMidi: chosen.targetMidi,
      ref: describe(spelling.ref.letter, spelling.ref.acc, chosen.refMidi),
      target: describe(spelling.target.letter, spelling.target.acc, chosen.targetMidi)
    };
  }

  root.IntervalSpelling = Object.freeze({
    isCommonSpelling, commonSpellings, noteName, degreeOf, pickQuestion
  });
})(typeof window === 'undefined' ? globalThis : window);
