import {playPad} from './audio.js';
import {bindKeyboard} from './keyboard.js';

const feedbackTimers = new WeakMap();
const pads = document.querySelectorAll('.drum-pad');

export function activatePad(pad) {
  clearTimeout(feedbackTimers.get(pad));
  pad.classList.add('is-hit');
  feedbackTimers.set(pad, setTimeout(() => {
    pad.classList.remove('is-hit');
    feedbackTimers.delete(pad);
  }, 120));
  return playPad(pad);
}

for (const pad of pads) {
  pad.addEventListener('click', () => { void activatePad(pad); });
}

bindKeyboard(pads, activatePad);
