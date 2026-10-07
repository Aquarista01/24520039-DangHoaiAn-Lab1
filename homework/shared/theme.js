const button = document.querySelector('#theme-toggle');
const system = matchMedia('(prefers-color-scheme: dark)');
let selected = null;
try {
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') selected = saved;
} catch { /* Storage is optional. */ }
function update() {
  const dark = (selected || (system.matches ? 'dark' : 'light')) === 'dark';
  if (selected) document.documentElement.dataset.theme = selected;
  else delete document.documentElement.dataset.theme;
  button.setAttribute('aria-pressed', String(dark));
  button.textContent = dark ? 'Light theme' : 'Dark theme';
}
update();
system.addEventListener('change', update);
button.addEventListener('click', () => {
  selected = button.getAttribute('aria-pressed') === 'true' ? 'light' : 'dark';
  update();
  try { localStorage.setItem('theme', selected); } catch { /* Retain this session's choice. */ }
});
document.querySelector('.skip-link').addEventListener('click', () => {
  document.querySelector('#main').focus({ preventScroll: true });
});
