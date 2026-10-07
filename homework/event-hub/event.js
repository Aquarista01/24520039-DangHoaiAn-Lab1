import '../shared/theme.js';
import { EVENT } from './event-data.js';
import { startCountdown } from './countdown.js';

const countdownStatus = document.querySelector('#countdown-status');
const stopCountdown = startCountdown(EVENT.startsAt, (parts) => {
  ['days', 'hours', 'minutes', 'seconds'].forEach((key) => {
    document.querySelector(`#${key}`).textContent = String(parts[key]).padStart(2, '0');
  });
  // Only announce the transition once; do not read four digits every second.
  if (parts.ended && countdownStatus.dataset.ended !== 'true') {
    countdownStatus.textContent = 'The sample workshop has started. Registration preview remains available.';
    countdownStatus.dataset.ended = 'true';
  }
});
window.addEventListener('pagehide', stopCountdown);
