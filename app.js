import { initializeEventHub } from './events.js';

const themeToggle = document.querySelector('#theme-toggle');
const themeIcon = document.querySelector('#theme-icon');
const contactForm = document.querySelector('#contact-form');
const formFeedback = document.querySelector('#form-feedback');
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
let selectedTheme = null;

// Private browsing policies can reject storage. The rest of the page must work.
try {
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') selectedTheme = saved;
} catch {
  selectedTheme = null;
}

function applyTheme() {
  const isDark = (selectedTheme || (systemTheme.matches ? 'dark' : 'light')) === 'dark';
  if (selectedTheme) document.documentElement.dataset.theme = selectedTheme;
  else delete document.documentElement.dataset.theme;
  themeToggle.setAttribute('aria-pressed', String(isDark));
  themeToggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} theme`);
  themeIcon.textContent = isDark ? '☀' : '☾';
}
applyTheme();
systemTheme.addEventListener('change', applyTheme);
themeToggle.addEventListener('click', () => {
  selectedTheme = themeToggle.getAttribute('aria-pressed') === 'true' ? 'light' : 'dark';
  applyTheme();
  try { localStorage.setItem('theme', selectedTheme); } catch { /* Keep the session choice. */ }
});

const nameInput = document.querySelector('#contact-name');
const messageInput = document.querySelector('#contact-message');
[nameInput, messageInput].forEach((input) => {
  input.addEventListener('input', () => input.setCustomValidity(''));
});
contactForm.addEventListener('submit', (event) => {
  event.preventDefault();
  nameInput.value = nameInput.value.normalize('NFC').trim();
  messageInput.value = messageInput.value.normalize('NFC').trim();
  nameInput.setCustomValidity(nameInput.value.length < 2 ? 'Enter at least two non-space characters.' : '');
  messageInput.setCustomValidity(messageInput.value.length < 10 ? 'Enter at least ten non-space characters.' : '');
  if (!contactForm.reportValidity()) return;
  formFeedback.textContent = 'Form validated. This local demo did not send a message.';
  contactForm.reset();
});

// Explicit focus transfer also works when the hash is already #main.
document.querySelector('.skip-link').addEventListener('click', () => {
  document.querySelector('#main').focus({ preventScroll: true });
});
initializeEventHub();
