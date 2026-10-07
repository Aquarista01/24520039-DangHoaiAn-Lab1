import '../shared/theme.js';
import { createAudioEngine } from './audio-engine.js';
import { createBeatRecorder, replayBeats } from './recorder.js';

const pads = new Map([...document.querySelectorAll('.drum-pad')].map((pad) => [pad.dataset.key, pad]));
const feedback = document.querySelector('#audio-status');
const flashes = new Map();
const audio = createAudioEngine({ onError: () => { feedback.textContent = 'Sound could not play. Tap a pad to try again and check your audio output.'; } });
audio.preload([...pads.values()].map((pad) => pad.dataset.sound));

function trigger(key, capture = true) {
  const pad = pads.get(key.toLowerCase());
  if (!pad) return false;
  audio.play(pad.dataset.sound);
  if (capture) recorder.add(pad.dataset.key);
  pad.classList.add('active');
  clearTimeout(flashes.get(pad));
  flashes.set(pad, setTimeout(() => { pad.classList.remove('active'); flashes.delete(pad); }, 130));
  return true;
}
function stopSounds() {
  audio.stopAll();
  flashes.forEach(clearTimeout);
  flashes.clear();
  pads.forEach((pad) => pad.classList.remove('active'));
}
pads.forEach((pad, key) => pad.addEventListener('click', () => trigger(key)));
window.addEventListener('keydown', (event) => {
  if (event.repeat || event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return;
  if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  if (event.key === ' ' && !event.target.closest('button, a, summary')) {
    event.preventDefault();
    stopEverything();
    return;
  }
  trigger(event.key);
});
const recordButton = document.querySelector('#record-btn');
const stopButton = document.querySelector('#stop-btn');
const replayButton = document.querySelector('#replay-btn');
const clearButton = document.querySelector('#clear-btn');
const recordStatus = document.querySelector('#record-status');
const stateBadge = document.querySelector('#tape-state');
let playing = false;
let cancelReplay = () => {};

function updateRecorder({ recording, beats }) {
  document.querySelector('#beat-count').textContent = String(beats.length);
  recordButton.disabled = recording;
  replayButton.disabled = recording || playing || beats.length === 0;
  clearButton.disabled = recording || playing || beats.length === 0;
  stateBadge.textContent = recording ? 'RECORDING' : playing ? 'REPLAYING' : 'IDLE';
  stateBadge.dataset.state = recording ? 'recording' : playing ? 'replaying' : 'idle';
  const list = document.querySelector('#beat-list');
  list.replaceChildren(...beats.map((beat) => {
    const row = document.createElement('li');
    row.textContent = `${beat.key.toUpperCase()} / ${beat.at} ms`;
    return row;
  }));
  if (recording) recordStatus.textContent = 'Recording. Play the pads, then press Stop.';
}
const recorder = createBeatRecorder({ onChange: (state) => {
  updateRecorder(state);
  if (!state.recording && state.beats.length) recordStatus.textContent = 'Tape ready. Replay keeps the original beat timing.';
} });
function stopEverything() {
  cancelReplay();
  playing = false;
  recorder.stop();
  stopSounds();
  recordStatus.textContent = 'Stopped. Your recorded beats are kept.';
}
recordButton.addEventListener('click', () => {
  cancelReplay(); playing = false; stopSounds(); recorder.start();
});
stopButton.addEventListener('click', stopEverything);
clearButton.addEventListener('click', () => {
  stopEverything(); recorder.clear();
  recordStatus.textContent = 'Tape cleared. Ready for a new pattern.';
});
replayButton.addEventListener('click', () => {
  const beats = recorder.snapshot();
  if (!beats.length || recorder.isRecording || playing) return;
  stopSounds(); playing = true;
  updateRecorder({ recording: false, beats });
  recordStatus.textContent = 'Replaying your recorded pattern.';
  cancelReplay = replayBeats(beats, (key) => trigger(key, false), () => {
    playing = false;
    updateRecorder({ recording: false, beats: recorder.snapshot() });
    recordStatus.textContent = 'Pattern replayed. Replay it again or record something new.';
  });
});
window.addEventListener('pagehide', stopEverything);
document.addEventListener('visibilitychange', () => { if (document.hidden) stopEverything(); });
