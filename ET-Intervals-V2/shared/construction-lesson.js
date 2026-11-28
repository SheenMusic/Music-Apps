/* 构唱课共用练习程序（音程听力训练 V2.1，第 5、7、9、11、13、15、17 课）
   每课在自己的 index.html 里先定义 window.CONSTRUCTION_LESSON（课号、题目、音区、报告名称等），再加载本文件。
   判定：音名正确且偏差在 ±15 音分内（2026-11-25 由 ±20 收紧），保持 0.2 秒即通过；连续唱准 10 题完成。
   流程（2026-11-24）：
   - 参考音默认钢琴（菜单可换正弦波），每次固定约 2 秒；按钮可随时再听一遍。
   - 麦克风开一次就一直收音：播放参考音时暂停（戴耳机时不暂停），播完自动继续；
     学生随时可以点按钮关闭；切到别的 App、锁屏或离开页面时自动关闭（连浏览器的麦克风占用一起释放）。
   两种模式（2026-11-25）：
   - 两种模式唱准后都停止检测，「再听一遍」变成「下一题 →」，学生自己点才换题（与原版一致，2026-11-25）。
   - 测试模式（「音高提示」收起）：连续数累计，满 10 题出现「查看练习报告」，但不会停下，
     学生可以一直练，想结束时自己点报告。
   - 练习模式（「音高提示」展开）：一展开连续数立刻清零、不计时、不进报告；提示一直展开。
   - 收起提示回到测试模式：从下一题开始重新计数（看过提示的这一题不算）。
   - 没勾选「已佩戴耳机」时，播放参考音和收音互相冲突（与原版一致）：
     点「播放参考音」→ 麦克风关闭，按钮变回「开启麦克风」，参考音播完后自动重新开启；
     点「开启麦克风」→ 正在播放的参考音立刻截断。勾选耳机后两者可以同时进行。 */
const PITCH_TOLERANCE_CENTS = 15;
const LESSON = window.CONSTRUCTION_LESSON;
/* 一般的课（第 5–15 课）只写 modes、minGap、widenTo 和 fullRange，这里补齐共用的做法：
   modes：{ up_maj: { name: '上方大七度', delta: 11 }, … }，菜单选项写成「↑M7 上方大七度」，混合模式在四种里随机。
   minGap / widenTo：最低音和最高音相差不到 minGap 个半音时，最高音放宽到最低音 + widenTo。
   fullRange：参考音可以用到最高音（第 5 课原版如此）；否则参考音最高到「最高音 − 音程」。
   第 17 课自己写 settings、nextInterval、widenRange、refRange。
   模唱课（第 3、4 课，2026-11-25）自己写 makeQuestion(read, previousTargetClass)，返回
   { name, refMidi, targetMidi, ref, target, prompt, promptName }（ref / target 为 IntervalSpelling 的 describe 格式）；
   另有 octaveTag（题目下方标签）、strictOctave（必须唱在指定八度）、reportType: 'singing'、
   reportRef: false（报告不写参考音）、hideRange（不显示音区设置，例如第 4 课按声部出题）。
   和声模唱课（第 6–18 偶数课，2026-11-25）写 harmonic: true：参考音同时播放低音和高音；
   两个声部都唱准才算这一题唱准。题目卡里有「低音」「高音」两个小卡片（2026-11-25）：
   默认先唱低音；点卡片可以改成先唱这个声部，唱准一个后自动切到另一个，顺序不影响计数。
   练习模式（展开音高提示）下点卡片，还会重新播放两个音、突出这个声部、压低另一个声部
   （代替原版的「点卡片振荡」）。 */
if (LESSON.modes) {
  const keys = Object.keys(LESSON.modes);
  LESSON.settings = LESSON.settings || [{
    id: 'exerciseSelect',
    label: '练习模式',
    options: [['random', '混合模式'], ...keys.map(key => {
      const mode = LESSON.modes[key];
      return [key, `${window.PracticeReport.interval(mode.name)} ${mode.name}`];
    })]
  }];
  LESSON.nextInterval = LESSON.nextInterval || (read => {
    const chosen = read('exerciseSelect');
    return LESSON.modes[chosen === 'random' ? keys[Math.floor(Math.random() * keys.length)] : chosen];
  });
  LESSON.widenRange = LESSON.widenRange || ((min, max) => min >= max - LESSON.minGap ? Math.min(84, min + LESSON.widenTo) : max);
  LESSON.refRange = LESSON.refRange || ((min, max, delta) => {
    const top = LESSON.widenRange(min, max);
    return [min, LESSON.fullRange ? top : top - Math.abs(delta)];
  });
}
const HOLD_SECONDS = 0.2;
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];


let audioCtx = null;
let analyser = null;
let mediaStream = null;
let animationId = null;

let resumeMicAfterTone = false;   // 没戴耳机：播放参考音时关掉的麦克风，播完自动重新开启
let micWanted = false;          // 学生打开了麦克风（播放参考音时会暂时停止收音）
let isListening = false;        // 正在收音分析
let isTonePlaying = false;
let toneTimer = null;
let hasPlayedQuestion = false;
let hintUsedThisQuestion = false;
// 和声模唱：这一题的两个音、正在唱哪个声部、低音唱准时记下的实际音高
let harmonicQuestion = null;
let harmonicVoice = 'low';
let voicesDone = new Set();            // 已唱准的声部
let sungTexts = { low: '', high: '' }; // 各声部唱准时的实际音高（写进报告）
let voiceSwitchedAt = 0;               // 切换声部的时间（之后 1.2 秒不提示「不是这个音」）
const FOCUS_VOLUMES = { low: [1, 0.25], high: [0.25, 1] };
const inPracticeMode = () => $('pitchDetails').open;

let currentRefMidi = 60;
let currentTargetMidi = 60;
let currentIntervalName = "";
let currentTargetLetter = "C";
let currentTargetAcc = 0;
let currentTargetSpell = "C";
let currentRefDisplay = "C4";
let currentTargetDisplay = "C4";
let previousTargetClass = -1;

let inRangeStartTime = null;
let isPassedCurrentQuestion = false;
let questionStartTime = 0;
let practiceStartTime = 0;
let consecutivePassCount = 0;
let questionHistory = [];
let pitchBuffer = [];

const $ = id => document.getElementById(id);

function midiToNoteName(midi) {
  return `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}
function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/* ---------- 提示与显示 ---------- */
// phase：ready / playing / listening / close / wrong / high / low / holding / passed / done
function setCoaching(phase, text) {
  const panel = $('feedbackPanel');
  if (panel.dataset.phase !== phase) panel.dataset.phase = phase;
  if ($('coaching').textContent !== text) $('coaching').textContent = text;
}

function idleCoaching() {
  if (isPassedCurrentQuestion) return;
  if (isTonePlaying) setCoaching('playing', '听参考音…');
  else if (!hasPlayedQuestion) setCoaching('ready', '先听参考音');
  else if (!micWanted) setCoaching('ready', `开启麦克风，唱出${targetWord()}`);
  else setCoaching('listening', `唱出${targetWord()}`);
}

function targetWord() {
  if (!LESSON.harmonic) return '目标音';
  return harmonicVoice === 'low' ? '低音' : '高音';
}

// 和声模唱：「低音」「高音」两个小卡片显示进度，点卡片选择先唱哪个声部；
// 练习模式下点卡片还会突出这个声部重新播放
function updateVoiceCards() {
  if (!LESSON.harmonic) return;
  for (const card of document.querySelectorAll('.voice-card')) {
    const voice = card.dataset.voice;
    const done = isPassedCurrentQuestion || voicesDone.has(voice);
    card.classList.toggle('is-done', done);
    card.classList.toggle('is-active', !done && voice === harmonicVoice);
    card.disabled = done && !inPracticeMode();
    card.title = inPracticeMode() ? '突出这个声部再听一遍' : done ? '' : '先唱这个声部';
  }
}

// 和声模唱：把判定目标换成某个声部
function setTargetVoice(voice) {
  const note = voice === 'low' ? harmonicQuestion.ref : harmonicQuestion.target;
  harmonicVoice = voice;
  currentTargetMidi = voice === 'low' ? harmonicQuestion.refMidi : harmonicQuestion.targetMidi;
  currentTargetLetter = note.letter;
  currentTargetAcc = note.acc;
  currentTargetSpell = note.name;
  currentTargetDisplay = note.display;
  inRangeStartTime = null;
  pitchBuffer = [];
}

function setSignal(visible) {
  $('feedbackPanel').dataset.signal = String(visible);
}

function updateButtons() {
  // 唱准后（两种模式都一样）等学生自己点「下一题 →」
  const awaitingNext = isPassedCurrentQuestion;
  $('toneLabel').textContent = awaitingNext ? '下一题 →' : hasPlayedQuestion ? '再听一遍' : '播放参考音';
  $('toneBtn').classList.toggle('next', awaitingNext);
  $('toneBtn').classList.toggle('playing', isTonePlaying);
  const mic = $('micBtn');
  mic.classList.toggle('active', micWanted);
  mic.setAttribute('aria-pressed', String(micWanted));
  $('micLabel').textContent = micWanted ? '收音中' : '开启麦克风';
  mic.title = micWanted ? '点一下关闭麦克风' : '';
}

function updateProgress() {
  $('passCountText').textContent = consecutivePassCount;
  const practice = inPracticeMode();
  const ready = consecutivePassCount >= 10 && !practice;
  $('finishBtn').disabled = !ready;
  $('finishBtn').classList.toggle('unlocked', ready);
  document.body.classList.toggle('practice-mode', practice);
  $('hintNote').textContent = practice ? '练习模式 · 不计数' : '展开后进入练习模式，不计数';
  $('modeNote').textContent = practice ? '收起音高提示后，从下一题开始计数'
    : consecutivePassCount >= 10 ? `已连续唱准 ${consecutivePassCount} 题 · 可以继续练，也可以查看报告` : '';
}

// 展开音高提示 → 练习模式：连续数清零、不计时；收起 → 下一题开始重新计数
function onHintToggle() {
  if (inPracticeMode()) {
    hintUsedThisQuestion = true;
    consecutivePassCount = 0;
    questionHistory = [];
    practiceStartTime = 0;
  }
  updateProgress();
  updateButtons();
  updateVoiceCards();
}

/* ---------- 和声模唱的声部卡片 ---------- */
(function buildVoiceCards() {
  if (!LESSON.harmonic) return;
  const cards = document.createElement('div');
  cards.className = 'voice-cards';
  for (const [voice, label] of [['low', '低音'], ['high', '高音']]) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'voice-card';
    card.dataset.voice = voice;
    card.textContent = label;
    card.addEventListener('click', () => {
      if (!harmonicQuestion) return;
      // 还没唱准的声部：改成先唱它
      if (!isPassedCurrentQuestion && !voicesDone.has(voice) && voice !== harmonicVoice) {
        setTargetVoice(voice);
        voiceSwitchedAt = Date.now();
        idleCoaching();
      }
      updateVoiceCards();
      // 练习模式：突出这个声部、压低另一个，重新播放
      if (inPracticeMode()) playReference(undefined, voice);
    });
    cards.append(card);
  }
  document.querySelector('.octave-note').after(cards);
  // 音高提示：低音 / 高音
  const labels = document.querySelectorAll('.target-label');
  labels[0].textContent = '低音';
  labels[1].textContent = '高音';
})();

/* ---------- 设置 ---------- */
// 各课自己的选择框（练习模式；第 17 课另有方向），放进菜单「练习」一组。要在页面其他脚本之前建好，
// 「继续上次练习」才能按 id 恢复选项。
(function buildLessonSettings() {
  const group = $('lessonSettings');
  const hideGroup = box => { box.hidden = true; box.previousElementSibling.hidden = true; };
  if (!LESSON.settings.length) hideGroup(group);
  if (LESSON.hideRange) hideGroup($('minNoteSelect').closest('.settings-group'));
  for (const item of LESSON.settings) {
    const row = document.createElement('label');
    row.className = 'setting-row';
    const name = document.createElement('span');
    name.textContent = item.label;
    const value = document.createElement('span');
    value.className = 'setting-value';
    value.id = item.id + 'Value';
    const select = document.createElement('select');
    select.id = item.id;
    for (const [optionValue, text] of item.options) select.add(new Option(text, optionValue));
    select.addEventListener('change', onConfigChange);
    row.append(name, value, select);
    group.append(row);
  }
})();
function populateNoteSelects() {
  const minSel = $('minNoteSelect');
  const maxSel = $('maxNoteSelect');
  for (let m = 36; m <= 84; m++) {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = formatPitchLabel(midiToNoteName(m));
    minSel.appendChild(opt.cloneNode(true));
    maxSel.appendChild(opt);
  }
  minSel.value = LESSON.defaultRange[0];
  maxSel.value = LESSON.defaultRange[1];
}

function onConfigChange() {
  const minMidi = parseInt($('minNoteSelect').value);
  const maxMidi = parseInt($('maxNoteSelect').value);
  // 音区太窄时自动放宽最高音（各课的规则不同）
  const widened = LESSON.widenRange(minMidi, maxMidi);
  if (widened !== maxMidi) $('maxNoteSelect').value = widened;
  restartPractice();
}

function updateToleranceZone() {
  $('targetZone').style.width = `${(PITCH_TOLERANCE_CENTS / 50) * 100}%`;
}

/* ---------- 参考音 ---------- */
function playReference(onlyMidi, focusVoice) {
  clearTimeout(toneTimer);
  // 没戴耳机：播放参考音时关掉麦克风（按钮变回「开启麦克风」），播完再自动开启
  if (!$('headphoneCheckbox').checked && micWanted) {
    resumeMicAfterTone = true;
    micWanted = false;
    pauseCapture();
  }
  const notes = onlyMidi !== undefined ? onlyMidi
    : LESSON.harmonic ? [harmonicQuestion.refMidi, harmonicQuestion.targetMidi] : currentRefMidi;
  // focusVoice：突出这个声部、压低另一个（和声模唱练习模式）
  const seconds = ReferenceTone.play(notes, $('timbreSelect').value, focusVoice ? FOCUS_VOLUMES[focusVoice] : undefined);
  isTonePlaying = true;
  hasPlayedQuestion = true;
  updateButtons();
  idleCoaching();
  toneTimer = setTimeout(() => {
    isTonePlaying = false;
    updateButtons();
    if (resumeMicAfterTone) {
      resumeMicAfterTone = false;
      turnMicOn();
    } else if (micWanted && !isPassedCurrentQuestion && !isListening) startCapture();
    else idleCoaching();
  }, seconds * 1000);
}

function stopReference() {
  clearTimeout(toneTimer);
  resumeMicAfterTone = false;
  ReferenceTone.stop();
  isTonePlaying = false;
  updateButtons();
}

/* ---------- 麦克风 ---------- */
function toggleMic() {
  if (micWanted) turnMicOff();
  else turnMicOn();
}

function turnMicOn() {
  micWanted = true;
  // 没戴耳机：开启麦克风会截断正在播放的参考音
  if (isTonePlaying && !$('headphoneCheckbox').checked) stopReference();
  updateButtons();
  if (!isPassedCurrentQuestion) startCapture();
  else idleCoaching();
}

function turnMicOff() {
  micWanted = false;
  resumeMicAfterTone = false;
  pauseCapture();
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  updateButtons();
  idleCoaching();
}

async function startCapture() {
  if (isListening || isPassedCurrentQuestion) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    // iPhone Safari：「只播放」模式不能录音，开麦克风前先切到「播放 + 录音」
    if (navigator.audioSession && navigator.audioSession.type !== 'play-and-record') {
      try { navigator.audioSession.type = 'play-and-record'; } catch (e) {}
    }
    if (!mediaStream) {
      try { mediaStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true } }); }
      catch (e) { mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    }
    if (!micWanted || isListening) return;   // 等待授权期间又关掉了
    const source = audioCtx.createMediaStreamSource(mediaStream);
    const hpFilter = audioCtx.createBiquadFilter();
    hpFilter.type = "highpass";
    hpFilter.frequency.setValueAtTime(60, audioCtx.currentTime);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(hpFilter);
    hpFilter.connect(analyser);
    isListening = true;
    pitchBuffer = [];
    idleCoaching();
    processAudio();
  } catch (err) {
    micWanted = false;
    updateButtons();
    idleCoaching();
    // 只有真的被拒绝授权时才提示去改权限；其他原因如实显示，方便反馈给老师
    if (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
      alert("没有麦克风权限。请在浏览器设置里允许本网站使用麦克风，然后重新打开本页。");
    } else {
      alert("麦克风暂时无法启动，请关闭本页后重新打开再试。如果仍然不行，请把这条信息发给老师：" + (err && err.message ? err.message : err));
    }
  }
}

function pauseCapture() {
  isListening = false;
  if (animationId) cancelAnimationFrame(animationId);
  inRangeStartTime = null;
  setSignal(false);
}

// 切到别的 App、锁屏、离开页面：关掉麦克风和声音，不在后台继续收音
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'hidden') return;
  if (micWanted) turnMicOff();
  stopReference();
  idleCoaching();
});

/* ---------- 音高检测与判定（与原版相同） ---------- */
function processAudio() {
  if (!isListening) return;
  const buffer = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buffer);
  const rawPitch = autoCorrelate(buffer, audioCtx.sampleRate);

  if (rawPitch !== -1) {
    const PITCH_SMOOTH_WINDOW = 8;
    pitchBuffer.push(rawPitch);
    if (pitchBuffer.length > PITCH_SMOOTH_WINDOW) pitchBuffer.shift();
    const smoothPitch = pitchBuffer.reduce((a, b) => a + b) / pitchBuffer.length;

    const detectedMidiFloat = 69 + 12 * Math.log2(smoothPitch / 440);
    const detectedClass = ((Math.round(detectedMidiFloat) % 12) + 12) % 12;
    const targetClass = ((currentTargetMidi % 12) + 12) % 12;

    // 音分偏差：一般相对最近的目标八度（任意八度）；strictOctave 的课相对指定的那个音
    let nearestTargetMidi = targetClass + Math.floor(detectedMidiFloat / 12) * 12;
    const midiDiff = nearestTargetMidi - detectedMidiFloat;
    if (midiDiff > 6) nearestTargetMidi -= 12;
    else if (midiDiff < -6) nearestTargetMidi += 12;
    if (LESSON.strictOctave) nearestTargetMidi = currentTargetMidi;
    const centsError = (detectedMidiFloat - nearestTargetMidi) * 100;

    const noteStr = (detectedClass === targetClass)
      ? IntervalSpelling.noteName(currentTargetLetter, currentTargetAcc, Math.round(detectedMidiFloat))
      : midiToNoteName(Math.round(detectedMidiFloat));
    updateStatusUI(noteStr, smoothPitch, centsError, detectedClass, targetClass);
    checkPassCondition(noteStr, smoothPitch, centsError, detectedClass, targetClass);
  } else {
    pitchBuffer = [];
    inRangeStartTime = null;
    setSignal(false);
    idleCoaching();
  }

  if (isListening && !isPassedCurrentQuestion) animationId = requestAnimationFrame(processAudio);
}

function updateStatusUI(noteStr, freq, cents, detectedClass, targetClass) {
  $('currentPitchText').textContent = `${formatPitchLabel(noteStr)} (${freq.toFixed(1)} Hz)`;
  setSignal(true);
  const pos = 50 + (Math.max(-50, Math.min(50, cents)) / 50) * 50;
  $('pointer').style.left = `${pos}%`;
  // 和声模唱：低音刚唱准时，留 1.2 秒显示「再唱高音」，不立刻提示「不是这个音」
  if (Date.now() - voiceSwitchedAt < 1200) return;
  if (detectedClass !== targetClass) {
    $('centsDevText').textContent = `音名不符（应为 ${formatPitchLabel(currentTargetSpell)}）`;
    setCoaching('wrong', '不是这个音，再听一遍');
  } else if (LESSON.strictOctave && Math.abs(cents) > 600) {
    // 音名对了，八度不对
    $('centsDevText').textContent = `八度不对（应为 ${formatPitchLabel(currentTargetDisplay)}）`;
    setCoaching('wrong', cents > 0 ? '八度高了，往下唱一个八度' : '八度低了，往上唱一个八度');
  } else if (Math.abs(cents) <= PITCH_TOLERANCE_CENTS) {
    $('centsDevText').textContent = `音名正确 (${cents > 0 ? '+' : ''}${cents.toFixed(1)} Cents)`;
    setCoaching('holding', '保持住');
  } else {
    $('centsDevText').textContent = `${cents > 0 ? '偏高' : '偏低'} (${cents.toFixed(1)} Cents)`;
    setCoaching(cents > 0 ? 'high' : 'low', cents > 0 ? '高了一点' : '低了一点');
  }
}

function checkPassCondition(noteStr, freq, centsError, detectedClass, targetClass) {
  if (!(detectedClass === targetClass && Math.abs(centsError) <= PITCH_TOLERANCE_CENTS)) {
    inRangeStartTime = null;
    return;
  }
  if (!inRangeStartTime) { inRangeStartTime = Date.now(); return; }
  if ((Date.now() - inRangeStartTime) / 1000 < HOLD_SECONDS) return;

  // 和声模唱：一个声部唱准 → 记下来，接着唱另一个（继续收音）
  if (LESSON.harmonic) {
    sungTexts[harmonicVoice] = `${noteStr} (${freq.toFixed(1)}Hz)`;
    voicesDone.add(harmonicVoice);
    const other = harmonicVoice === 'low' ? 'high' : 'low';
    if (!voicesDone.has(other)) {
      const word = harmonicVoice === 'low' ? '低音' : '高音';
      setTargetVoice(other);
      voiceSwitchedAt = Date.now();
      setCoaching('passed', `✓ ${word}唱准了，再唱${targetWord()}`);
      updateVoiceCards();
      return;
    }
  }

  // 唱准：停止检测，等学生点「下一题 →」
  isPassedCurrentQuestion = true;
  updateVoiceCards();
  pauseCapture();
  setSignal(true);
  stopReference();
  // 练习模式，或这一题看过提示：不计数
  if (inPracticeMode() || hintUsedThisQuestion) {
    setCoaching('passed', '✓ 唱准了');
    updateButtons();
    return;
  }
  if (practiceStartTime === 0) practiceStartTime = questionStartTime;
  consecutivePassCount++;
  const duration = ((Date.now() - questionStartTime) / 1000).toFixed(1);
  if (LESSON.harmonic) {
    questionHistory.push({
      id: questionHistory.length + 1,
      type: currentIntervalName,
      lowTarget: harmonicQuestion.ref.display,
      highTarget: harmonicQuestion.target.display,
      lowCapturedText: sungTexts.low,
      highCapturedText: sungTexts.high,
      time: duration
    });
  } else questionHistory.push({
    id: questionHistory.length + 1,
    refNote: LESSON.reportRef === false ? undefined : currentRefDisplay,
    targetNote: currentTargetDisplay,
    interval: currentIntervalName,
    actualNote: `${noteStr} (${freq.toFixed(1)}Hz)`,
    cents: centsError.toFixed(1),
    time: duration
  });
  $('holdingProgress').textContent = '音名正确';
  updateProgress();
  setCoaching(consecutivePassCount >= 10 ? 'done' : 'passed', consecutivePassCount === 10 ? '✓ 已连续唱准 10 题' : '✓ 唱准了');
  updateButtons();
}

/* ---------- 出题 ---------- */
// 构唱课：按本课的音程出题（拼写规则见 ET-Intervals/shared/interval-spelling.js）
function intervalQuestion() {
  const minMidi = parseInt($('minNoteSelect').value);
  const interval = LESSON.nextInterval(id => $(id).value);
  const range = LESSON.refRange(minMidi, parseInt($('maxNoteSelect').value), interval.delta);
  const picked = IntervalSpelling.pickQuestion({
    refMin: range[0],
    refMax: range[1],
    delta: interval.delta,
    degree: IntervalSpelling.degreeOf(interval.name),
    avoidTargetClass: previousTargetClass
  });
  return { name: interval.name, refMidi: picked.refMidi, targetMidi: picked.targetMidi, ref: picked.ref, target: picked.target };
}
function generateQuestion() {
  // 不再每题收起音高提示：练习模式里提示一直展开
  stopReference();
  pauseCapture();
  // 模唱课自己出题；构唱课按音程出题
  let q = LESSON.makeQuestion
    ? LESSON.makeQuestion(id => $(id).value, previousTargetClass)
    : intervalQuestion();
  const delta = q.targetMidi - q.refMidi;
  // 和声模唱：先唱低音（判定目标先设为低音，唱准后切到高音）
  harmonicQuestion = LESSON.harmonic ? q : null;
  harmonicVoice = 'low';
  voicesDone = new Set();
  sungTexts = { low: '', high: '' };
  if (LESSON.harmonic) q = { ...q, targetMidi: q.refMidi, target: q.ref };
  currentRefMidi = q.refMidi;
  currentTargetMidi = q.targetMidi;
  // 避免连续两题目标音（和声模唱为高音）的音名相同
  const lastTarget = harmonicQuestion ? harmonicQuestion.targetMidi : currentTargetMidi;
  previousTargetClass = ((lastTarget % 12) + 12) % 12;
  currentIntervalName = q.name;
  currentTargetLetter = q.target.letter;
  currentTargetAcc = q.target.acc;
  currentTargetSpell = q.target.name;
  currentRefDisplay = q.ref.display;
  currentTargetDisplay = q.target.display;
  document.querySelector('.octave-note').textContent = LESSON.octaveTag || '任意八度';

  // 题目：大字写缩写和方向（↑ m2），下面一行小字写中文名
  $('prompt').textContent = q.prompt || window.PracticeReport.interval(currentIntervalName).replace(/^([↑↓])/, '$1 ');
  // promptName 为空字符串时不显示这一行（第 3 课）
  $('promptName').textContent = q.promptName ?? currentIntervalName;
  $('arrowIcon').textContent = LESSON.harmonic ? '+' : delta > 0 ? '↗' : delta < 0 ? '↘' : '=';
  $('refNoteName').textContent = formatPitchLabel(currentRefDisplay);
  $('refFreqText').textContent = `${midiToFreq(currentRefMidi).toFixed(1)} Hz`;
  // 音高提示：构唱课写参考音和目标音，和声模唱写低音和高音
  const shown = harmonicQuestion ? harmonicQuestion.target : { display: currentTargetDisplay };
  const shownMidi = harmonicQuestion ? harmonicQuestion.targetMidi : currentTargetMidi;
  $('targetNoteName').textContent = formatPitchLabel(shown.display);
  $('targetFreqText').textContent = `${midiToFreq(shownMidi).toFixed(1)} Hz`;
  $('currentPitchText').textContent = '--';

  isPassedCurrentQuestion = false;
  hintUsedThisQuestion = inPracticeMode();
  hasPlayedQuestion = false;
  updateVoiceCards();
  inRangeStartTime = null;
  questionStartTime = Date.now();
  pitchBuffer = [];
  $('holdingProgress').textContent = '';
  $('centsDevText').textContent = '';
  setSignal(false);
  updateButtons();
  idleCoaching();
}

function nextQuestion() {
  generateQuestion();
  playReference();   // 麦克风开着的话，参考音播完自动继续收音
}

function restartPractice() {
  consecutivePassCount = 0;
  questionHistory = [];
  practiceStartTime = 0;
  previousTargetClass = -1;
  updateProgress();
  $('reportCard').classList.add('hidden');
  $('practiceCard').classList.remove('hidden');
  generateQuestion();
}

/* ---------- 报告 ---------- */
function durationText(seconds) {
  const m = Math.floor(seconds / 60), r = seconds % 60;
  return m ? `${m} 分 ${r} 秒` : `${r} 秒`;
}

function finishPractice() {
  if (consecutivePassCount < 10) return;
  if (micWanted) turnMicOff();
  stopReference();
  $('practiceCard').classList.add('hidden');
  $('reportCard').classList.remove('hidden');
  // 「继续上次练习」恢复报告时，用保存的秒数（practiceStartTime 已按它倒推）
  const seconds = Math.max(0, Math.round((Date.now() - practiceStartTime) / 1000));
  $('totalTimeText').textContent = seconds;
  $('resultCount').textContent = `连续唱准 ${consecutivePassCount} 题`;
  $('resultTime').textContent = `用时 ${durationText(seconds)}`;
  const records = questionHistory.slice(-10);
  $('resultListTitle').textContent = consecutivePassCount > 10 ? '最近 10 题' : '练习记录';
  const list = $('reportList');
  list.replaceChildren();
  records.forEach((q, idx) => {
    // 一题一行：题号、音程（↓m2）、参考音 → 目标音；唱的八度和目标不同时，补一行小字
    const item = document.createElement('li');
    const number = document.createElement('span');
    number.className = 'result-number';
    number.textContent = String(idx + 1).padStart(2, '0');
    const interval = document.createElement('span');
    interval.className = 'result-interval';
    // 第 3 课（只唱同一个音）不写音程
    interval.textContent = LESSON.reportRef === false ? '' : window.PracticeReport.interval(q.interval || q.type);
    const notes = document.createElement('span');
    notes.className = 'result-notes';
    notes.textContent = q.lowTarget ? `${formatPitchLabel(q.lowTarget)} + ${formatPitchLabel(q.highTarget)}`
      : q.refNote ? `${formatPitchLabel(q.refNote)} → ${formatPitchLabel(q.targetNote)}` : formatPitchLabel(q.targetNote);
    item.append(number, interval, notes);
    if (q.lowTarget) { list.append(item); return; }
    const sung = window.PracticeReport.sung(q.actualNote, q.targetNote);
    if (sung !== window.PracticeReport.pitch(q.targetNote)) {
      const octave = document.createElement('span');
      octave.className = 'result-sung';
      octave.textContent = `唱 ${formatPitchLabel(sung)}`;
      item.append(octave);
    }
    list.append(item);
  });
  $('reportTitle').tabIndex = -1;
  $('reportTitle').focus();
}

function copyReport() {
  const totalTime = $('totalTimeText').textContent;
  const minMidi = parseInt($('minNoteSelect').value);
  const maxMidi = parseInt($('maxNoteSelect').value);
  // 报告里的练习设置：每个选择框显示当前选中的文字
  const modeLines = LESSON.settings.map(item => `${item.label}：${$(item.id).selectedOptions[0].textContent}`);
  const text = window.PracticeReport.generate({
    type: LESSON.harmonic ? 'harmonic' : LESSON.reportType || 'construction', code: LESSON.code, title: LESSON.reportTitle,
    settings: [...(LESSON.hideRange ? [] : [`练习音区：${formatPitchLabel(midiToNoteName(minMidi))}–${formatPitchLabel(midiToNoteName(maxMidi))}`]), ...modeLines],
    seconds: Number(totalTime), records: questionHistory.slice(-10)
  });
  navigator.clipboard.writeText(text).then(() => {
    alert("练习报告已复制，结果也会同步给老师。");
  }).catch(() => {
    alert("复制失败了，可能是浏览器没有开放剪贴板权限。结果仍会同步给老师；也可以检查浏览器权限后重试。");
  });
}

/* ---------- 音高检测（与原版相同） ---------- */
function autoCorrelate(buf, sampleRate) {
  let SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.008) return -1;
  let r1 = 0, r2 = SIZE - 1, thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) { if (Math.abs(buf[i]) < thres) { r1 = i; break; } }
  for (let i = 1; i < SIZE / 2; i++) { if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; } }
  buf = buf.slice(r1, r2);
  SIZE = buf.length;
  const c = new Array(SIZE).fill(0);
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE - i; j++) { c[i] = c[i] + buf[j] * buf[j + i]; }
  }
  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < SIZE; i++) { if (c[i] > maxval) { maxval = c[i]; maxpos = i; } }
  let T0 = maxpos;
  if (T0 <= 0) return -1;
  const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);
  return sampleRate / T0;
}

window.onload = () => {
  populateNoteSelects();
  updateToleranceZone();
  // 「再听一遍」；唱准后等学生换题时是「下一题 →」
  $('toneBtn').addEventListener('click', () => {
    if (isPassedCurrentQuestion) nextQuestion();
    else playReference();
  });
  $('pitchDetails').addEventListener('toggle', onHintToggle);
  // 取消「已佩戴耳机」时，如果参考音和收音正在同时进行，先截断参考音（与原版一致）
  $('headphoneCheckbox').addEventListener('change', () => {
    if (!$('headphoneCheckbox').checked && isTonePlaying && micWanted) stopReference();
  });
  $('micBtn').addEventListener('click', toggleMic);
  $('timbreSelect').addEventListener('change', () => { if ($('timbreSelect').value === 'piano') ReferenceTone.preload(); });
  ReferenceTone.preload();
  generateQuestion();
  updateProgress();
};
