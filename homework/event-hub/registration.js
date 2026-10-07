import {submitRegistration} from './registration-service.js';

export function createRegistration({form, summary, service = submitRegistration}) {
  const fields = [...form.querySelectorAll('input, select, textarea')];
  const submitButton = form.querySelector('#submit-btn');
  const cancelButton = form.querySelector('#cancel-btn');
  const resetButton = form.querySelector('#reset-btn');
  const status = form.parentElement.querySelector('#registration-status');
  const stateLabel = form.querySelector('#form-state');
  const interestLabels = new Map([...form.elements.interest.options].map(option => [option.value, option.textContent]));
  const receiptFields = ['name', 'email', 'interest', 'note'];
  let state = 'idle';
  let disposed = false;

  const clearReceipt = () => {
    summary.hidden = true;
    for (const key of receiptFields) summary.querySelector(`#receipt-${key}`).textContent = '';
  };
  const clearError = field => {
    field.removeAttribute('aria-invalid');
    const error = form.querySelector(`#${field.name}-error`);
    if (error) error.textContent = '';
  };
  const render = (next, message) => {
    const hadFocus = form.contains(document.activeElement) || document.activeElement === status;
    state = next;
    form.dataset.state = state;
    stateLabel.textContent = state[0].toUpperCase() + state.slice(1);
    const pending = state === 'submitting', completed = state === 'success';
    form.setAttribute('aria-busy', String(pending));
    for (const field of fields) field.disabled = pending || completed;
    submitButton.disabled = pending || completed;
    resetButton.disabled = pending;
    // Cancel is wired together with request cancellation in the next package.
    cancelButton.disabled = true;
    submitButton.textContent = pending ? 'Working…' : state === 'error' ? 'Try again' : 'Register';
    status.textContent = message;
    if (!completed) summary.hidden = true;
    if (hadFocus) (pending ? status : completed ? resetButton : submitButton).focus({preventScroll: true});
  };
  const onInvalid = event => {
    const field = event.target;
    field.setAttribute('aria-invalid', 'true');
    const error = form.querySelector(`#${field.name}-error`);
    if (error) error.textContent = field.validationMessage;
    status.textContent = 'Please check the required fields and their messages.';
  };
  const onInput = event => {
    if (event.target.validity?.valid) clearError(event.target);
    if (state === 'idle' && fields.every(field => field.validity.valid)) status.textContent = 'Ready to try a local demo registration.';
  };
  const submit = async event => {
    event?.preventDefault();
    if (disposed || (state !== 'idle' && state !== 'error')) return false;
    if (!form.reportValidity()) return false;
    const payload = Object.freeze(Object.fromEntries(receiptFields.map(key => [key, form.elements[key].value])));
    const simulateError = form.querySelector('#simulate-error').checked;
    for (const field of fields) clearError(field);
    clearReceipt();
    // The state guard is synchronous, before invoking or awaiting the service.
    render('submitting', 'Trying your local demo registration…');
    try {
      const receipt = await service(payload, {simulateError});
      if (disposed) return false;
      for (const key of receiptFields) {
        const value = key === 'interest' ? interestLabels.get(receipt[key]) ?? receipt[key] : receipt[key];
        summary.querySelector(`#receipt-${key}`).textContent = value || (key === 'note' ? 'No note added.' : '');
      }
      summary.hidden = false;
      render('success', 'Demo registration complete. Nothing was sent or saved. Use Reset to try another.');
      return true;
    } catch {
      if (!disposed) render('error', 'Demo registration failed. Your entries are kept. Try again, or turn off the simulated error.');
      return false;
    }
  };
  const onReset = event => {
    if (disposed || state === 'submitting') {
      event.preventDefault();
      return;
    }
    for (const field of fields) clearError(field);
    clearReceipt();
    render('idle', 'Ready to try a local demo registration.');
    form.elements.name.focus({preventScroll: true});
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    form.removeEventListener('submit', submit);
    form.removeEventListener('reset', onReset);
    form.removeEventListener('invalid', onInvalid, true);
    form.removeEventListener('input', onInput);
    form.removeEventListener('change', onInput);
    for (const button of [submitButton, cancelButton, resetButton]) button.disabled = true;
  };

  form.addEventListener('submit', submit);
  form.addEventListener('reset', onReset);
  form.addEventListener('invalid', onInvalid, true);
  form.addEventListener('input', onInput);
  form.addEventListener('change', onInput);
  render('idle', 'Ready to try a local demo registration.');
  return {submit, reset: () => { if (disposed || state === 'submitting') return false; form.reset(); return true; }, dispose, getState: () => state};
}
