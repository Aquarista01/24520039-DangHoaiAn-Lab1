import { initializeEventHub } from './events.js';

const themeToggle = document.querySelector('#theme-toggle');
const themeIcon = document.querySelector('#theme-icon');
const contactForm = document.querySelector('#contact-form');
const formFeedback = document.querySelector('#form-feedback');
const storedTheme = readStoredTheme();

function readStoredTheme() {
  try {
    const value = localStorage.getItem('theme');
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    // Theme persistence is optional; blocked storage must not stop initialization.
    return null;
  }
}

function updateThemeButton(isDark) {
  themeToggle.setAttribute('aria-pressed', String(isDark));
  themeToggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} theme`);
  themeIcon.textContent = isDark ? '☀' : '☾';
}

if (storedTheme === 'light' || storedTheme === 'dark') {
  document.documentElement.dataset.theme = storedTheme;
}
updateThemeButton((storedTheme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark');

themeToggle.addEventListener('click', () => {
  const nextTheme = themeToggle.getAttribute('aria-pressed') === 'true' ? 'light' : 'dark';
  document.documentElement.dataset.theme = nextTheme;
  updateThemeButton(nextTheme === 'dark');
  try {
    localStorage.setItem('theme', nextTheme);
  } catch {
    // Keep the current theme and accessible button state when saving is unavailable.
  }
});

contactForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  formFeedback.textContent = 'Form validated. This local demo did not send a message.';
  contactForm.reset();
});

initializeEventHub();
