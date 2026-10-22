// Shared harmonic playback and assistance eligibility; each lesson retains its own targets and detector.
  let toneStopTimer = null;
  let tonePlaybackId = 0;
  let pausedCaptureTarget = null;
  let assistanceUsed = false;
  let questionCompleted = false;
  let questionInitialized = false;
  const pitchDetails = document.getElementById('pitchDetails');
  // Mutation records catch even a programmatic open/close in a single task.
  const pitchObserver = new MutationObserver(records => {
    if (records.some(record => record.oldValue === null)) markAssistanceUsed();
  });
  pitchObserver.observe(pitchDetails, {attributes: true, attributeFilter: ['open'], attributeOldValue: true});
  pitchDetails.querySelector('summary').addEventListener('click', event => {
    if (!event.target.closest('button') && !pitchDetails.open) markAssistanceUsed();
  });
  pitchDetails.addEventListener('toggle', () => {
    if (pitchDetails.open) markAssistanceUsed();
  });

  function updateStreakUI() {
    document.getElementById('passCountText').textContent = consecutivePassCount;
    const eligible = consecutivePassCount >= 10 && questionHistory.length >= 10 && questionCompleted && !assistanceUsed;
    const finishBtn = document.getElementById('finishBtn');
    finishBtn.disabled = !eligible;
    finishBtn.classList.toggle('unlocked', eligible);
  }

  function markAssistanceUsed() {
    assistanceUsed = true;
    consecutivePassCount = 0;
    questionHistory = [];
    updateStreakUI();
    // A post-answer reveal must also revoke a previously generated report.
    if (!document.getElementById('reportCard').classList.contains('hidden')) {
      document.getElementById('reportCard').classList.add('hidden');
      document.getElementById('practiceCard').classList.remove('hidden');
      document.getElementById('reportTableBody').innerHTML = '';
    }
  }

  function syncAssistance() {
    const records = pitchObserver.takeRecords();
    if (pitchDetails.open || records.some(record => record.oldValue === null)) markAssistanceUsed();
  }

  function checkAllPassed() {
    syncAssistance();
    updateCaptureButtonUI();
    if (lowCaptured && highCaptured && !questionCompleted) {
      questionCompleted = true;
      if (isTonePlaying) stopTargetTone();
      const nextBtn = document.getElementById('nextBtn');
      nextBtn.disabled = false;
      nextBtn.classList.add('unlocked');
      nextBtn.textContent = "正确，下一题";
      
      if (assistanceUsed) {
        updateStreakUI();
        return;
      }
      consecutivePassCount++;
      const duration = ((Date.now() - questionStartTime) / 1000).toFixed(1);
      
      questionHistory.push({
        id: consecutivePassCount,
        type: currentIntervalName,
        lowTarget: currentLowSpell,
        highTarget: currentHighSpell,
        lowCapturedText: document.getElementById('lowPitchText').textContent,
        highCapturedText: document.getElementById('highPitchText').textContent,
        time: duration
      });

      questionHistory = questionHistory.slice(-10);
      updateStreakUI();
    }
  }

function resetHarmonicQuestion() {
  syncAssistance();
  if (questionInitialized && !questionCompleted) {
    consecutivePassCount = 0;
    questionHistory = [];
  }
  pitchDetails.open = false;
  pitchObserver.takeRecords();
  assistanceUsed = false;
  questionCompleted = false;
  questionInitialized = true;
  updateStreakUI();
  stopTargetTone();
}
function canFinishHarmonicPractice() {
  syncAssistance();
  return !assistanceUsed && questionCompleted && consecutivePassCount >= 10 && questionHistory.length === 10;
}

const HARMONIC_AUDIO = Object.freeze({rate: 3.5, cents: 25, cycles: 1, seconds: 5, decay: 2});
let toneEndTime = 0;
let oscillationTimer = null;
let oscillationId = 0;

function releasePianoNodes(nodes) {
  nodes.forEach(node => {
    try { if (node.stop) node.stop(); } catch (error) {}
    try { node.disconnect(); } catch (error) {}
  });
}

function playPianoNote(freq, startTime = null) {
  if (!audioCtx) return [];
  const nodes = [];
  try {
    const start = startTime ?? audioCtx.currentTime;
    const masterGain = audioCtx.createGain();
    nodes.push(masterGain);
    masterGain.gain.setValueAtTime(0.35, start);
    masterGain.gain.setTargetAtTime(0, start, HARMONIC_AUDIO.decay);
    masterGain.connect(audioCtx.destination);
    const harmonics = [{mult: 1, gain: .6}, {mult: 2, gain: .3}, {mult: 3, gain: .15}, {mult: 4, gain: .08}, {mult: 5, gain: .04}];
    harmonics.forEach(h => {
      if (freq * h.mult > 20000) return;
      const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
      nodes.push(osc, gain);
      osc.type = h.mult === 1 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq * h.mult, start);
      gain.gain.setValueAtTime(h.gain, start);
      osc.connect(gain); gain.connect(masterGain);
      osc.start(start); osc.stop(start + HARMONIC_AUDIO.seconds);
    });
    return nodes;
  } catch (error) { releasePianoNodes(nodes); throw error; }
}

function clearPitchOscillation() {
  oscillationId++;
  clearTimeout(oscillationTimer);
  oscillationTimer = null;
  [...pianoNodesLow, ...pianoNodesHigh].forEach(node => {
    if (!node.detune) return;
    // Cancel pending ramp events before another tap replaces the burst.
    node.detune.cancelScheduledValues(audioCtx.currentTime);
    node.detune.setValueAtTime(0, audioCtx.currentTime);
  });
  document.querySelectorAll('.harmonic-pitch .oscillating').forEach(card => card.classList.remove('oscillating'));
}

function triggerPitchOscillation(voice) {
  if (voice !== 'low' && voice !== 'high') return false;
  if (!isTonePlaying || !audioCtx || audioCtx.state !== 'running' || audioCtx.currentTime >= toneEndTime) return false;
  const notes = (voice === 'low' ? pianoNodesLow : pianoNodesHigh).filter(node => node.detune);
  if (!notes.length) return false; // AudioContext resume may still be pending.
  syncAssistance(); markAssistanceUsed();
  clearPitchOscillation();
  const now = audioCtx.currentTime;
  const duration = schedulePitchOscillation(notes, now);
  const card = document.querySelectorAll('.harmonic-pitch .target-half-box')[voice === 'low' ? 0 : 1];
  void card.offsetWidth; // Restart only the small ripple, never the sound.
  card.classList.add('oscillating');
  const playback = tonePlaybackId, burst = oscillationId;
  // A late tap never extends the original five-second playback deadline.
  oscillationTimer = setTimeout(() => {
    if (playback !== tonePlaybackId || burst !== oscillationId) return;
    card.classList.remove('oscillating'); oscillationTimer = null;
  }, Math.min(duration, toneEndTime - now) * 1000);
  return true;
}

function schedulePitchOscillation(notes, now) {
  const duration = HARMONIC_AUDIO.cycles / HARMONIC_AUDIO.rate;
  const curve = new Float32Array(257);
  for (let i = 0; i < curve.length; i++) curve[i] = HARMONIC_AUDIO.cents * Math.sin(2 * Math.PI * HARMONIC_AUDIO.cycles * i / (curve.length - 1));
  curve[0] = curve[curve.length - 1] = 0;
  notes.forEach(node => {
    node.detune.setValueAtTime(0, now);
    // Short linear segments approximate the sine while remaining cancellable.
    // Replacing a native setValueCurveAtTime mid-curve can throw in Chromium.
    for (let i = 1; i < curve.length; i++) {
      node.detune.linearRampToValueAtTime(curve[i], now + duration * i / (curve.length - 1));
    }
  });
  return duration;
}

function toggleTargetTone() {
  if (isTonePlaying) stopTargetTone(true);
  else return startTargetTone();
}

async function startTargetTone() {
  syncAssistance();
  const resumeTarget = micPausedForTone ? pausedCaptureTarget :
    (!document.getElementById('headphoneCheckbox').checked && isListening ? activeCaptureTarget : null);
  stopTargetTone(false);
  if (resumeTarget) {
    stopMic(); micPausedForTone = true; pausedCaptureTarget = resumeTarget;
  }
  const playback = tonePlaybackId;
  isTonePlaying = true;
  const button = document.getElementById('toneBtn');
  button.textContent = '停止播放示范音'; button.classList.add('playing');
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    if (playback !== tonePlaybackId) return;
    // Both voices share the same start time and original playback deadline.
    const start = audioCtx.currentTime;
    toneEndTime = start + HARMONIC_AUDIO.seconds;
    pianoNodesLow = playPianoNote(midiToFreq(currentLowMidi), start);
    pianoNodesHigh = playPianoNote(midiToFreq(currentHighMidi), start);
    const source = pianoNodesHigh.find(node => typeof node.stop === 'function');
    source.onended = () => { if (playback === tonePlaybackId) stopTargetTone(true); };
    toneStopTimer = setTimeout(() => { if (playback === tonePlaybackId) stopTargetTone(true); }, HARMONIC_AUDIO.seconds * 1000);
  } catch (error) {
    if (playback === tonePlaybackId) stopTargetTone(true);
    console.warn('示范音播放失败', error);
  }
}

function stopTargetTone(autoResumeMic = false) {
  tonePlaybackId++;
  clearTimeout(toneStopTimer); toneStopTimer = null;
  clearPitchOscillation();
  releasePianoNodes([...pianoNodesLow, ...pianoNodesHigh]);
  pianoNodesLow = []; pianoNodesHigh = []; isTonePlaying = false; toneEndTime = 0;
  const button = document.getElementById('toneBtn');
  button.textContent = '播放示范音'; button.classList.remove('playing');
  const resumeTarget = pausedCaptureTarget;
  micPausedForTone = false; pausedCaptureTarget = null;
  if (autoResumeMic && resumeTarget && !(resumeTarget === 'low' ? lowCaptured : highCaptured)) startMic(resumeTarget);
}

window.addEventListener('pagehide', () => stopTargetTone());
