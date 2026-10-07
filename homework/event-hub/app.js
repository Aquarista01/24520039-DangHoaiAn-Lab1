import {startCountdown} from './countdown.js';
import {createRegistration} from './registration.js';

const target = document.querySelector('#event-start');
const status = document.querySelector('#countdown-status');
const slots = ['days', 'hours', 'minutes', 'seconds'].map(id => document.getElementById(id));
const messages = {
  running: 'Counting down to the workshop. Event time is shown in Vietnam time.',
  started: 'The workshop start time has arrived.',
  invalid: 'The event time is unavailable. Please check the event details.',
  unavailable: 'The countdown is unavailable. Please check your device clock.'
};
let stopCountdown = () => {};
let active = false;

function pause() {
  active = false;
  stopCountdown();
  document.removeEventListener('visibilitychange', onVisibility);
}

function resume() {
  pause();
  if (!target || !status || slots.some(slot => !slot)) return;
  active = true;
  stopCountdown = startCountdown({
    targetISO: target.getAttribute('datetime'),
    onTick: values => {
      for (const slot of slots) {
        const text = String(values[slot.id]).padStart(2, '0');
        if (slot.textContent !== text) slot.textContent = text;
      }
    },
    onStatus: state => {
      if (state === 'invalid' || state === 'unavailable') {
        for (const slot of slots) slot.textContent = '--';
      }
      if (status.textContent !== messages[state]) status.textContent = messages[state];
    }
  });
  document.addEventListener('visibilitychange', onVisibility);
}

function onVisibility() {
  if (active && document.visibilityState === 'visible') resume();
}

window.addEventListener('pagehide', pause);
window.addEventListener('pageshow', () => { if (!active) resume(); });
resume();

const form = document.querySelector('#registration-form');
const summary = document.querySelector('#registration-summary');
if (form && summary) createRegistration({form, summary});
