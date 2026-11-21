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

const HARMONIC_AUDIO = Object.freeze({
  rate: 6.5, cents: 15, cycles: 5, boost: .30, burstDecay: 1.15,
  seconds: 5.5, naturalSeconds: 4.5, decay: 2, baseGain: .32, samplesPerCycle: 128, transition: .012
});
let toneEndTime = 0;
const oscillationTimers = {low: null, high: null};
const oscillationVersions = {low: 0, high: 0};

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
    const assistGain = audioCtx.createGain(), fadeGain = audioCtx.createGain();
    nodes.push(masterGain, assistGain, fadeGain);
    nodes.assistGain = assistGain;
    nodes.fadeGain = fadeGain;
    nodes.modulation = null;
    // Headroom for BOTH voices at +30%: 2 * .32 * 1.17 * 1.3 < 1.
    masterGain.gain.setValueAtTime(HARMONIC_AUDIO.baseGain, start);
    masterGain.gain.setTargetAtTime(0, start, HARMONIC_AUDIO.decay);
    masterGain.gain.setValueAtTime(HARMONIC_AUDIO.baseGain * Math.exp(-HARMONIC_AUDIO.naturalSeconds / HARMONIC_AUDIO.decay), start + HARMONIC_AUDIO.naturalSeconds);
    assistGain.gain.setValueAtTime(1, start);
    fadeGain.gain.setValueAtTime(1, start);
    fadeGain.gain.setValueAtTime(1, start + HARMONIC_AUDIO.naturalSeconds);
    // Raised-cosine fade reaches exact silence with zero endpoint slope.
    for (let i = 1; i <= 128; i++) {
      fadeGain.gain.linearRampToValueAtTime((1 + Math.cos(Math.PI * i / 128)) / 2,
        start + HARMONIC_AUDIO.naturalSeconds + (HARMONIC_AUDIO.seconds - HARMONIC_AUDIO.naturalSeconds) * i / 128);
    }
    masterGain.connect(assistGain); assistGain.connect(fadeGain); fadeGain.connect(audioCtx.destination);
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
  ['low', 'high'].forEach(voice => {
    oscillationVersions[voice]++;
    clearTimeout(oscillationTimers[voice]); oscillationTimers[voice] = null;
  });
  // Called only when the sound is being stopped, never to switch cards.
  document.querySelectorAll('.harmonic-pitch .oscillating').forEach(card => card.classList.remove('oscillating'));
}

function triggerPitchOscillation(voice) {
  if (voice !== 'low' && voice !== 'high') return false;
  if (!isTonePlaying || !audioCtx || audioCtx.state !== 'running' || audioCtx.currentTime >= toneEndTime) return false;
  const nodes = voice === 'low' ? pianoNodesLow : pianoNodesHigh;
  if (!nodes.assistGain) return false; // AudioContext resume may still be pending.
  syncAssistance(); markAssistanceUsed();
  clearTimeout(oscillationTimers[voice]);
  const burst = ++oscillationVersions[voice];
  const now = audioCtx.currentTime;
  const duration = schedulePitchOscillation(nodes, now, voice);
  const card = document.querySelectorAll('.harmonic-pitch .target-half-box')[voice === 'low' ? 0 : 1];
  card.classList.remove('oscillating');
  void card.offsetWidth; // Restart only the small ripple, never the sound.
  card.classList.add('oscillating');
  const playback = tonePlaybackId;
  // A late tap never extends the original playback deadline.
  oscillationTimers[voice] = setTimeout(() => {
    if (playback !== tonePlaybackId || burst !== oscillationVersions[voice]) return;
    card.classList.remove('oscillating'); oscillationTimers[voice] = null;
  }, Math.min(duration, toneEndTime - now) * 1000);
  return true;
}

function modulationAt(nodes, time) {
  const curve = nodes.modulation;
  if (!curve || time >= curve.start + curve.duration) return {cents: 0, gain: 1};
  const position = Math.max(0, (time - curve.start) / curve.duration) * (curve.pitch.length - 1);
  const i = Math.min(Math.floor(position), curve.pitch.length - 2), f = position - i;
  return {
    cents: curve.pitch[i] + (curve.pitch[i + 1] - curve.pitch[i]) * f,
    gain: curve.gain[i] + (curve.gain[i + 1] - curve.gain[i]) * f
  };
}

function schedulePitchOscillation(nodes, now, voice) {
  const duration = HARMONIC_AUDIO.cycles / HARMONIC_AUDIO.rate;
  const current = modulationAt(nodes, now);
  const count = HARMONIC_AUDIO.cycles * HARMONIC_AUDIO.samplesPerCycle + 1;
  const pitch = new Float32Array(count), gain = new Float32Array(count);
  const sign = voice === 'low' ? -1 : 1;
  const attackSamples = Math.ceil(HARMONIC_AUDIO.transition / duration * (count - 1));
  const attack = duration * attackSamples / (count - 1);
  // From interval_fm_lab_ripple_am.html: raised-cosine ripples times (1-u)^1.15.
  // Normalize the first ripple so "15 cents" is its actual maximum, not its input depth.
  const pulseAt = u => (1 - Math.cos(2 * Math.PI * HARMONIC_AUDIO.cycles * u)) / 2 * Math.pow(1 - u, HARMONIC_AUDIO.burstDecay);
  let firstPeak = 0;
  for (let i = 0; i <= HARMONIC_AUDIO.samplesPerCycle; i++) firstPeak = Math.max(firstPeak, pulseAt(i / (count - 1)));
  for (let i = 0; i < count; i++) {
    const u = i / (count - 1), t = duration * u, x = Math.min(1, t / attack);
    const blend = x * x * (3 - 2 * x);
    pitch[i] = current.cents * (1 - blend) + sign * HARMONIC_AUDIO.cents * pulseAt(u) / firstPeak * blend;
    // Lab-style relative boost with a smooth attack, then polynomial release.
    gain[i] = i <= attackSamples ? current.gain + (1 + HARMONIC_AUDIO.boost - current.gain) * blend :
      1 + HARMONIC_AUDIO.boost * Math.pow(1 - (t - attack) / (duration - attack), HARMONIC_AUDIO.burstDecay);
  }
  pitch[count - 1] = 0; gain[count - 1] = 1;
  function automate(param, values) {
    param.cancelScheduledValues(now);
    // Re-anchor the interpolated value before cancelling/replacing future ramps.
    param.linearRampToValueAtTime(values[0], now);
    for (let i = 1; i < count; i++) {
      param.linearRampToValueAtTime(values[i], now + duration * i / (count - 1));
    }
  }
  nodes.filter(node => node.detune).forEach(node => automate(node.detune, pitch));
  automate(nodes.assistGain.gain, gain);
  nodes.modulation = {start: now, duration, pitch, gain};
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
