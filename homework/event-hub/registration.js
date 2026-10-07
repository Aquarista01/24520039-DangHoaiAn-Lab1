import { previewRegistration } from './registration-service.js';
import { collectRegistration } from './validation.js';

const form = document.querySelector('#registration-form');
const button = document.querySelector('#submit-btn');
const status = document.querySelector('#registration-status');
const badge = document.querySelector('#form-state');
const fields = [...form.querySelectorAll('input, select, textarea')];
const allowed = { idle: ['submitting'], submitting: ['success', 'error'], success: ['idle', 'submitting'], error: ['idle', 'submitting'] };
let state = 'idle';
let pending;

function transition(next, message) {
  if (!allowed[state].includes(next)) return;
  state = next;
  const submitting = state === 'submitting';
  form.setAttribute('aria-busy', String(submitting));
  // Keep the focused submit button in the Tab sequence while rejecting repeats.
  button.setAttribute('aria-disabled', String(submitting));
  fields.forEach((field) => { field.disabled = submitting; });
  button.textContent = submitting ? 'Submitting…' : state === 'error' ? 'Try again' : 'Preview registration';
  badge.textContent = state.toUpperCase();
  badge.dataset.state = state;
  status.textContent = message;
}
form.addEventListener('input', (event) => {
  if (typeof event.target.setCustomValidity === 'function') event.target.setCustomValidity('');
  if (state === 'success' || state === 'error') transition('idle', 'Ready for a new preview.');
});
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (state === 'submitting') return;
  const data = collectRegistration(form);
  if (!data) return;
  const fail = document.querySelector('#simulate-error').checked;
  transition('submitting', 'Submitting your local preview. Please wait.');
  pending = new AbortController();
  try {
    const result = await previewRegistration(data, { fail, signal: pending.signal });
    transition('success', `Thanks, ${result.name}. Your preview is complete. No registration was sent or saved.`);
    form.reset();
  } catch (error) {
    transition('error', error.name === 'AbortError'
      ? 'The preview was interrupted. Your details are kept; please try again.'
      : 'The preview service is unavailable. Your details are kept here; uncheck the error preview and try again.');
  }
});
window.addEventListener('pagehide', () => pending?.abort());
