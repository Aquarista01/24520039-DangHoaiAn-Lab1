import {playPad} from './audio.js';

const feedbackTimers = new WeakMap();

export function activatePad(pad) {
  clearTimeout(feedbackTimers.get(pad));
  pad.classList.add('is-hit');
  feedbackTimers.set(pad, setTimeout(() => {
    pad.classList.remove('is-hit');
    feedbackTimers.delete(pad);
  }, 120));
  return playPad(pad);
}

for (const pad of document.querySelectorAll('.drum-pad')) {
  pad.addEventListener('click', () => { void activatePad(pad); });
}
