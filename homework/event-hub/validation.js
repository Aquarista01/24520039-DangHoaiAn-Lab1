const keys = ['name', 'email', 'interest', 'note'];
const interests = new Set(['design', 'code', 'both']);
const controls = /[\u0000-\u001F\u007F-\u009F]/gu;
const noteControls = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/gu;
// Practical HTML email grammar: ASCII local part and dot-separated DNS labels.
// Single-label domains are accepted, as with type=email; this is not full RFC validation.
const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/u;

export function validateRegistration(raw) {
  const errors = {};
  for (const key of keys) {
    if (typeof raw?.[key] !== 'string') errors[key] = 'Please enter a text value.';
  }
  const finish = data => Object.freeze({ok: Object.keys(errors).length === 0, data, errors: Object.freeze(errors)});
  if (Object.keys(errors).length) return finish(null);

  const name = raw.name.normalize('NFC').replace(/\s+/gu, ' ').replace(controls, '').trim();
  const email = raw.email.normalize('NFC').trim();
  const interest = raw.interest;
  const note = raw.note.normalize('NFC').replace(/\r\n?/gu, '\n').replace(noteControls, '').trim();
  // JS length uses UTF-16 code units, matching the HTML minlength/maxlength limits.
  if (name.length < 2 || !/\p{L}/u.test(name)) errors.name = 'Enter a name with at least 2 characters and a letter.';
  else if (name.length > 80) errors.name = 'Keep your name within 80 characters.';
  if (!email || email.length > 120 || /[\u0000-\u001F\u007F-\u009F]/u.test(raw.email) || /\s/u.test(email) || !emailPattern.test(email)) {
    errors.email = 'Enter a valid email address within 120 characters, without spaces or control characters.';
  }
  if (!interests.has(interest)) errors.interest = 'Choose Design, Code, or Design and code.';
  if (note.length > 300) errors.note = 'Keep your note within 300 characters.';
  return finish(Object.keys(errors).length ? null : Object.freeze({name, email, interest, note}));
}
