const normalize = (value) => value.normalize('NFC').trim();
const unsafeControls = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u;

export function collectRegistration(form) {
  const { name, email, interest, note } = form.elements;
  const data = { name: normalize(name.value), email: normalize(email.value), interest: interest.value, note: normalize(note.value) };
  name.value = data.name;
  email.value = data.email;
  note.value = data.note;
  name.setCustomValidity(data.name.length < 2 || data.name.length > 80 || unsafeControls.test(data.name) ? 'Enter a name of 2-80 characters, not just spaces.' : '');
  email.setCustomValidity(data.email.length > 120 || unsafeControls.test(data.email) ? 'Enter a valid email address of at most 120 characters.' : '');
  note.setCustomValidity(data.note.length > 300 || unsafeControls.test(data.note) ? 'Use at most 300 characters without control characters.' : '');
  interest.setCustomValidity(['design', 'code', 'both'].includes(data.interest) ? '' : 'Choose an interest.');
  if (!form.reportValidity()) return null;
  // Validation defines the allowed data; textContent is the output XSS boundary.
  return Object.freeze(data);
}
