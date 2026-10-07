import {submitRegistration} from './registration-service.js';
import {validateRegistration} from './validation.js';

export function createRegistration({form, summary, service = submitRegistration}) {
  const fields = [...form.querySelectorAll('input, select, textarea')];
  const submitButton = form.querySelector('#submit-btn');
  const cancelButton = form.querySelector('#cancel-btn');
  const resetButton = form.querySelector('#reset-btn');
  const status = form.parentElement.querySelector('#registration-status');
  const stateLabel = form.querySelector('#form-state');
  const interestLabels = new Map([...form.elements.interest.options].map(option => [option.value, option.textContent]));
  const receiptFields = ['name', 'email', 'interest', 'note'];
  const readInput = () => Object.fromEntries(receiptFields.map(key => [key, form.elements[key].value]));
  let state = 'idle';
  let disposed = false;
  let paused = false;
  let listening = false;
  let inFlight = false;
  let generation = 0;
  let current = null;
  const cancelled = Symbol('cancelled');

  const isCurrent = attempt => current === attempt && attempt.token === generation && !disposed && !paused;
  const clearDeadline = attempt => {
    if (attempt.timer !== null) clearTimeout(attempt.timer);
    attempt.timer = null;
  };
  const invalidate = () => {
    const previous = current;
    current = null;
    inFlight = false;
    generation += 1;
    if (!previous) return;
    clearDeadline(previous);
    previous.controller.abort();
    previous.finishCancelled(cancelled);
  };

  const clearReceipt = () => {
    summary.hidden = true;
    for (const key of receiptFields) summary.querySelector(`#receipt-${key}`).textContent = '';
  };
  const clearError = field => {
    field.setCustomValidity('');
    field.removeAttribute('aria-invalid');
    const error = form.querySelector(`#${field.name}-error`);
    if (error) error.textContent = '';
  };
  const render = (next, message, {focus = true} = {}) => {
    const hadFocus = form.contains(document.activeElement) || document.activeElement === status;
    state = next;
    form.dataset.state = state;
    stateLabel.textContent = state[0].toUpperCase() + state.slice(1);
    const pending = state === 'submitting', completed = state === 'success';
    form.setAttribute('aria-busy', String(pending));
    for (const field of fields) field.disabled = pending || completed || paused;
    submitButton.disabled = pending || completed || paused;
    resetButton.disabled = pending || paused;
    cancelButton.disabled = !pending || paused;
    submitButton.textContent = pending ? 'Working…' : state === 'error' ? 'Try again' : 'Register';
    status.textContent = message;
    if (!completed) summary.hidden = true;
    if (hadFocus && focus && !paused) (pending ? cancelButton : completed ? resetButton : submitButton).focus();
  };
  const expire = attempt => {
    if (!isCurrent(attempt)) return;
    invalidate();
    render('error', 'Registration took too long. Your entries are kept. Try again.');
  };
  const onInvalid = event => {
    const field = event.target;
    field.setAttribute('aria-invalid', 'true');
    const error = form.querySelector(`#${field.name}-error`);
    if (error) error.textContent = field.validationMessage;
    status.textContent = 'Please check the required fields and their messages.';
  };
  const onInput = event => {
    const field = event.target;
    if (!fields.includes(field)) return;
    field.setCustomValidity('');
    const message = validateRegistration(readInput()).errors[field.name];
    if (message && field.getAttribute('aria-invalid') === 'true') field.setCustomValidity(message);
    if (field.validity.valid) clearError(field);
    else if (field.getAttribute('aria-invalid') === 'true') onInvalid({target: field});
    if (state === 'idle' && fields.every(field => field.validity.valid)) status.textContent = 'Ready to try a local demo registration.';
  };
  const submit = async event => {
    event?.preventDefault();
    if (disposed || paused || inFlight || (state !== 'idle' && state !== 'error')) return false;
    // Acquire the lock before native validation, callbacks or the first await.
    inFlight = true;
    const token = ++generation;
    let attempt = null;
    try {
      for (const field of fields) field.setCustomValidity('');
      if (!form.reportValidity() || token !== generation || disposed || paused) return false;
      const validated = validateRegistration(readInput());
      if (!validated.ok) {
        for (const key of receiptFields) {
          const field = form.elements[key];
          clearError(field);
          if (validated.errors[key]) {
            field.setCustomValidity(validated.errors[key]);
            onInvalid({target: field});
          }
        }
        form.reportValidity();
        form.elements[receiptFields.find(key => validated.errors[key])].focus();
        return false;
      }
      const payload = validated.data;
      const simulateError = form.querySelector('#simulate-error').checked;
      for (const field of fields) clearError(field);
      clearReceipt();
      attempt = {token, controller: new AbortController(), timer: null, deadline: performance.now() + 5000};
      const cancellation = new Promise(resolve => { attempt.finishCancelled = resolve; });
      current = attempt;
      attempt.timer = setTimeout(() => expire(attempt), 5000);
      render('submitting', 'Trying your local demo registration…');
      if (!isCurrent(attempt)) return false;
      // A non-cooperating transport can outlive AbortSignal; racing cancellation
      // settles this submit call while the token still rejects its late result.
      const receipt = await Promise.race([service(payload, {simulateError, signal: attempt.controller.signal}), cancellation]);
      if (!isCurrent(attempt) || receipt === cancelled) return false;
      if (performance.now() >= attempt.deadline) { expire(attempt); return false; }
      for (const key of receiptFields) {
        const value = key === 'interest' ? interestLabels.get(payload[key]) ?? payload[key] : payload[key];
        summary.querySelector(`#receipt-${key}`).textContent = value || (key === 'note' ? 'No note added.' : '');
      }
      summary.hidden = false;
      render('success', 'Demo registration complete. Nothing was sent or saved. Use Reset to try another.');
      return true;
    } catch {
      if (attempt && isCurrent(attempt)) {
        if (performance.now() >= attempt.deadline) expire(attempt);
        else render('error', 'Demo registration failed. Your entries are kept. Try again, or turn off the simulated error.');
      }
      return false;
    } finally {
      if (attempt) clearDeadline(attempt);
      if (token === generation) { current = null; inFlight = false; }
    }
  };
  const cancel = () => {
    if (disposed || paused || !current) return false;
    invalidate();
    clearReceipt();
    render('idle', 'Demo registration cancelled. Your entries are kept. You can try again.');
    return true;
  };
  const onReset = event => {
    if (disposed || paused) {
      event.preventDefault();
      return;
    }
    invalidate();
    for (const field of fields) clearError(field);
    clearReceipt();
    render('idle', 'Ready to try a local demo registration.');
    form.elements.name.focus();
  };
  const detach = () => {
    if (!listening) return;
    listening = false;
    form.removeEventListener('submit', submit);
    form.removeEventListener('reset', onReset);
    form.removeEventListener('invalid', onInvalid, true);
    form.removeEventListener('input', onInput);
    form.removeEventListener('change', onInput);
    cancelButton.removeEventListener('click', cancel);
  };
  const attach = () => {
    if (listening) return;
    listening = true;
    form.addEventListener('submit', submit);
    form.addEventListener('reset', onReset);
    form.addEventListener('invalid', onInvalid, true);
    form.addEventListener('input', onInput);
    form.addEventListener('change', onInput);
    cancelButton.addEventListener('click', cancel);
  };
  const suspend = () => {
    if (disposed || paused) return false;
    const interrupted = inFlight;
    invalidate();
    paused = true;
    detach();
    render(interrupted ? 'error' : state, interrupted ? 'Registration was interrupted. Your entries are kept. Try again.' : status.textContent, {focus: false});
    return true;
  };
  const resume = () => {
    if (disposed || !paused) return false;
    paused = false;
    attach();
    render(state, status.textContent);
    return true;
  };
  const dispose = () => {
    if (disposed) return;
    invalidate();
    disposed = true;
    paused = true;
    detach();
    render(state === 'submitting' ? 'idle' : state, 'This demo form is inactive.', {focus: false});
  };

  attach();
  render('idle', 'Ready to try a local demo registration.');
  return {submit, cancel, reset: () => { if (disposed || paused) return false; form.reset(); return true; }, suspend, resume, dispose, getState: () => state};
}
