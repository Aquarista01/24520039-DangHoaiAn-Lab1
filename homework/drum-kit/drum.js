import '../shared/theme.js';
import { createAudioEngine } from './audio-engine.js';

const pads = new Map([...document.querySelectorAll('.drum-pad')].map((pad) => [pad.dataset.key, pad]));
const feedback = document.querySelector('#audio-status');
const flashes = new Map();
const audio = createAudioEngine({ onError: () => { feedback.textContent = 'Sound could not play. Tap a pad to try again and check your audio output.'; } });
audio.preload([...pads.values()].map((pad) => pad.dataset.sound));

function trigger(key) {
  const pad = pads.get(key.toLowerCase());
  if (!pad) return false;
  audio.play(pad.dataset.sound);
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
    stopSounds();
    return;
  }
  trigger(event.key);
});
window.addEventListener('pagehide', stopSounds);
document.addEventListener('visibilitychange', () => { if (document.hidden) stopSounds(); });
