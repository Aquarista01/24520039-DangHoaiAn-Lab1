import {playPad} from './audio.js';
import {bindKeyboard} from './keyboard.js';
import {createRecorder} from './recorder.js';

const feedbackTimers = new WeakMap();
const pads = document.querySelectorAll('.drum-pad');
const padByKey = new Map(Array.from(pads, pad => [pad.dataset.key, pad]));
const panel = document.querySelector('.tape-panel');
const recordButton = document.querySelector('#record-btn');
const stopButton = document.querySelector('#stop-btn');
const replayButton = document.querySelector('#replay-btn');
const clearButton = document.querySelector('#clear-btn');
const beatList = document.querySelector('#beat-list');
const recorder = createRecorder({
  keys: padByKey.keys(),
  onChange: renderTape,
  onReplayHit: key => { void activatePad(padByKey.get(key), 'replay'); }
});

export function activatePad(pad, source = 'live') {
  const at = performance.now();
  if (source === 'live') recorder.capture(pad.dataset.key, at);
  clearTimeout(feedbackTimers.get(pad));
  pad.classList.add('is-hit');
  feedbackTimers.set(pad, setTimeout(() => {
    pad.classList.remove('is-hit');
    feedbackTimers.delete(pad);
  }, 120));
  return playPad(pad);
}

function renderTape({state, beats, message}) {
  const active = document.activeElement;
  panel.dataset.state = state;
  document.querySelector('#tape-state').textContent = {idle: 'Idle', recording: 'Recording', replaying: 'Replaying'}[state];
  document.querySelector('#beat-count').textContent = String(beats.length);
  document.querySelector('#record-status').textContent = message;
  recordButton.disabled = state !== 'idle';
  stopButton.disabled = state === 'idle';
  replayButton.disabled = state !== 'idle' || beats.length === 0;
  clearButton.disabled = state !== 'idle' || beats.length === 0;
  const items = document.createDocumentFragment();
  for (const beat of beats) {
    const item = document.createElement('li');
    item.dataset.key = beat.key;
    item.dataset.at = String(beat.at);
    item.textContent = `${beat.key.toUpperCase()} — ${(beat.at / 1000).toFixed(3)} s`;
    items.append(item);
  }
  beatList.replaceChildren(items);
  beatList.tabIndex = beats.length ? 0 : -1;
  if ([recordButton, stopButton, replayButton, clearButton].includes(active) && active.disabled) {
    (state === 'idle' ? recordButton : stopButton).focus();
  }
}

for (const pad of pads) {
  pad.addEventListener('click', () => { void activatePad(pad); });
}

bindKeyboard(pads, activatePad);

recordButton.addEventListener('click', recorder.start);
stopButton.addEventListener('click', recorder.stop);
replayButton.addEventListener('click', recorder.replay);
clearButton.addEventListener('click', recorder.clear);
