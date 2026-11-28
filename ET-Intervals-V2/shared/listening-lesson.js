/* 听辨课共用练习程序（音程听力训练 V2.1，第 1、2 课，2026-11-25）
   与模唱 / 构唱课同一套规则，不再分「练习模式 / 测验模式」两个入口：
   - 测试模式（「音高提示」收起，默认）：随机出题，答对累计；答错连续数清零。连续答对 10 题达标，
     出现「查看练习报告」，但不停，学生可以一直练，想结束时自己点报告。
   - 练习模式（「音高提示」展开）：一展开连续数立刻清零、不计时、不进报告；展开时能看到这题播放的音高，
     答完也会标出正确答案。收起后从下一题开始重新计数（看过提示的这一题不算）。
   - 答完后点「下一题 →」才换题，并自动播放下一题。
   每课在 index.html 里先定义 window.LISTENING_LESSON（题库、选项、播放按钮、报告名称），再加载本文件。
   声音（2026-11-25）：原版的 WAV 录音是纯正弦波；现在由页面按题库里的音高直接发声（shared/reference-tone.js），
   默认钢琴，菜单可换正弦波。节奏同原录音：每个音约 0.62 秒，两个音之间停约 0.18 秒；第 2 课 A、B 组之间停 0.5 秒。
   全局变量名（consecutivePassCount、questionHistory、practiceStartTime、generateQuestion、restartPractice、
   finishPractice）与模唱课相同，「继续上次练习」（ET-Intervals/shared/et-session.js）按同一方式保存、恢复。 */
const LESSON = window.LISTENING_LESSON;
const NOTE_SECONDS = 0.62, NOTE_GAP = 0.18, GROUP_GAP = 0.5;
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteName = midi => formatPitchLabel(`${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`);

let currentIndex = -1;
let answered = false;
let hintUsedThisQuestion = false;
let questionStartTime = 0;
let practiceStartTime = 0;
let consecutivePassCount = 0;
let questionHistory = [];
let playTimers = [];

const $ = id => document.getElementById(id);
const inPracticeMode = () => $('pitchDetails').open;
const currentQuestion = () => LESSON.questions[currentIndex];

/* ---------- 声音 ---------- */
function stopAudio() {
  ReferenceTone.stop();
  playTimers.forEach(clearTimeout);
  playTimers = [];
  document.querySelectorAll('.tone').forEach(button => button.classList.remove('playing'));
}

// 播放这一题的某个部分：LESSON.parts(q, part) 返回 [[音高数组, 按钮的 part], …]，一组一组依次播放
function playPart(part) {
  stopAudio();
  const notes = [];
  let at = 0;
  for (const [midis, buttonPart] of LESSON.parts(currentQuestion(), part)) {
    const button = document.querySelector(`.tone[data-part="${buttonPart}"]`);
    const groupStart = at;
    midis.forEach((midi, i) => notes.push({ midi, at: at + i * (NOTE_SECONDS + NOTE_GAP), seconds: NOTE_SECONDS }));
    at += midis.length * NOTE_SECONDS + (midis.length - 1) * NOTE_GAP;
    const groupEnd = at;
    playTimers.push(setTimeout(() => button?.classList.add('playing'), groupStart * 1000));
    playTimers.push(setTimeout(() => button?.classList.remove('playing'), groupEnd * 1000));
    at += GROUP_GAP;
  }
  ReferenceTone.playSequence(notes, $('timbreSelect').value);
  if (!answered) setCoaching('ready', '听完后选择答案');
}

/* ---------- 显示 ---------- */
function setCoaching(phase, text) {
  $('feedbackPanel').dataset.phase = phase;
  $('coaching').textContent = text;
}

function updateProgress() {
  $('passCountText').textContent = consecutivePassCount;
  const practice = inPracticeMode();
  const ready = consecutivePassCount >= 10 && !practice;
  $('finishBtn').disabled = !ready;
  document.body.classList.toggle('practice-mode', practice);
  $('hintNote').textContent = practice ? '练习模式 · 不计数' : '展开后进入练习模式，不计数';
  $('modeNote').textContent = practice ? '收起音高提示后，从下一题开始计数'
    : consecutivePassCount >= 10 ? `已连续答对 ${consecutivePassCount} 题 · 可以继续练，也可以查看报告` : '';
}

// 展开「显示答案」→ 练习模式：连续数清零、不计时；收起 → 下一题开始重新计数
function onHintToggle() {
  if (inPracticeMode()) {
    hintUsedThisQuestion = true;
    consecutivePassCount = 0;
    questionHistory = [];
    practiceStartTime = 0;
    if (answered) markAnswer();
  }
  updateProgress();
}

/* ---------- 出题与作答 ---------- */
function generateQuestion() {
  stopAudio();
  // 随机出题，不连续出同一题
  let next;
  do { next = Math.floor(Math.random() * LESSON.questions.length); }
  while (next === currentIndex && LESSON.questions.length > 1);
  currentIndex = next;
  const q = currentQuestion();
  answered = false;
  hintUsedThisQuestion = inPracticeMode();
  questionStartTime = Date.now();

  // 音高提示：这一题播放的音高
  $('answerText').textContent = LESSON.pitchText(q, noteName);
  const options = $('options');
  options.replaceChildren();
  for (const option of LESSON.options) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice';
    button.dataset.value = option.value;
    button.textContent = option.label;
    button.addEventListener('click', () => answer(option.value));
    options.append(button);
  }
  $('nextBtn').hidden = true;
  setCoaching('ready', LESSON.readyText);
}

function markAnswer() {
  const q = currentQuestion();
  document.querySelectorAll('#options .choice').forEach(button => {
    if (button.dataset.value === String(q.answer)) button.classList.add('is-answer');
  });
}

function answer(value) {
  if (answered) return;
  answered = true;
  const q = currentQuestion();
  const correct = value === String(q.answer);
  document.querySelectorAll('#options .choice').forEach(button => {
    button.disabled = true;
    if (button.dataset.value === value) button.classList.add(correct ? 'is-correct' : 'is-wrong');
  });
  if (inPracticeMode()) markAnswer();

  // 练习模式，或这一题看过答案：不计数
  if (inPracticeMode() || hintUsedThisQuestion) {
    setCoaching(correct ? 'passed' : 'wrong', correct ? '✓ 答对了' : `✗ 答错了 · 正确答案：${LESSON.answerText(q)}`);
  } else if (correct) {
    if (practiceStartTime === 0) practiceStartTime = questionStartTime;
    consecutivePassCount++;
    questionHistory.push({ text: LESSON.recordText(q), time: ((Date.now() - questionStartTime) / 1000).toFixed(1) });
    setCoaching(consecutivePassCount >= 10 ? 'done' : 'passed', consecutivePassCount === 10 ? '✓ 已连续答对 10 题' : '✓ 答对了');
  } else {
    // 测试模式答错：连续数清零，下一题重新开始
    const had = consecutivePassCount;
    consecutivePassCount = 0;
    questionHistory = [];
    practiceStartTime = 0;
    setCoaching('wrong', had ? `✗ 答错了 · 连续数从头开始` : '✗ 答错了');
  }
  updateProgress();
  $('nextBtn').hidden = false;
  $('nextBtn').focus({ preventScroll: true });
}

function nextQuestion() {
  generateQuestion();
  setTimeout(() => { if (!answered) playPart('all'); }, 180);
}

function restartPractice() {
  consecutivePassCount = 0;
  questionHistory = [];
  practiceStartTime = 0;
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
  stopAudio();
  $('practiceCard').classList.add('hidden');
  $('reportCard').classList.remove('hidden');
  const seconds = Math.max(0, Math.round((Date.now() - practiceStartTime) / 1000));
  $('totalTimeText').textContent = seconds;
  $('resultCount').textContent = `连续答对 ${consecutivePassCount} 题`;
  $('resultTime').textContent = `用时 ${durationText(seconds)}`;
  $('resultListTitle').textContent = consecutivePassCount > 10 ? '最近 10 题' : '练习记录';
  const list = $('reportList');
  list.replaceChildren();
  questionHistory.slice(-10).forEach((q, idx) => {
    const item = document.createElement('li');
    item.className = 'two-column';
    const number = document.createElement('span');
    number.className = 'result-number';
    number.textContent = String(idx + 1).padStart(2, '0');
    const text = document.createElement('span');
    text.className = 'result-notes';
    text.textContent = q.text;
    item.append(number, text);
    list.append(item);
  });
  $('reportTitle').tabIndex = -1;
  $('reportTitle').focus();
}

function copyReport() {
  const text = window.PracticeReport.generate({
    type: 'choice', code: LESSON.code, title: LESSON.reportTitle,
    seconds: Number($('totalTimeText').textContent), records: questionHistory.slice(-10)
  });
  navigator.clipboard.writeText(text).then(() => {
    alert('练习报告已复制，结果也会同步给老师。');
  }).catch(() => {
    alert('复制失败了，可能是浏览器没有开放剪贴板权限。结果仍会同步给老师；也可以检查浏览器权限后重试。');
  });
}

/* ---------- 开始 ---------- */
(function buildPlayers() {
  const controls = $('players');
  for (const player of LESSON.players) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tone';
    button.dataset.part = player.part;
    button.innerHTML = '<span class="play-icon" aria-hidden="true"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M5.3 2.4 13.4 7a1.15 1.15 0 0 1 0 2l-8.1 4.6A1.2 1.2 0 0 1 3.5 12.6V3.4a1.2 1.2 0 0 1 1.8-1Z"/></svg></span>';
    button.append(player.label);
    button.addEventListener('click', () => playPart(player.part));
    controls.append(button);
  }
})();

window.addEventListener('load', () => {
  $('timbreSelect').addEventListener('change', () => { if ($('timbreSelect').value === 'piano') ReferenceTone.preload(); });
  ReferenceTone.preload();
  $('pitchDetails').addEventListener('toggle', onHintToggle);
  $('nextBtn').addEventListener('click', nextQuestion);
  generateQuestion();
  updateProgress();
});
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') stopAudio(); });
