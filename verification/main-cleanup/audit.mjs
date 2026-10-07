import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
const {chromium} = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'));
const checks = [], cases = [];
const check = (name, passed, detail) => checks.push({name, passed: Boolean(passed), ...(detail === undefined ? {} : {detail})});
const git = (...args) => execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();
for (const file of ['index.html', 'styles.css', 'app.js', 'events.js', 'assets/favicon.svg', 'assets/portrait.svg']) {
  check(`${file}: exact Lab baseline blob`, git('hash-object', file) === git('rev-parse', `8aa4676:${file}`));
}
check('current main candidate has no Homework application paths or audit', !fs.existsSync(path.join(root, 'homework')) && !fs.existsSync(path.join(root, 'AI_FAILURE_AUDIT.md')));
check('README points to separate Homework branch', fs.readFileSync(path.join(root, 'README.md'), 'utf8').includes('https://github.com/Aquarista01/24520039-DangHoaiAn-Lab1/tree/hw-atomic-rebuild'));
check('local Homework ref preserved at agreed commit', git('rev-parse', 'hw-atomic-rebuild') === '7ac14abdd9be04d2fa80b0ac4b65a5fbf37a8e00');
const mime = {'.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml'};
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep) && file !== root) {res.writeHead(403).end();return;}
  try {
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  } catch {res.writeHead(404).end();}
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({headless: true, executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']});
try {
  for (const width of [375, 1440]) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({viewport: {width, height: 900}, colorScheme: theme});
    const page = await context.newPage(), errors = [], failed = [], subset = [];
    const item = (name, passed, detail) => subset.push({name, passed: Boolean(passed), ...(detail === undefined ? {} : {detail})});
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
    page.on('response', r => {if (r.status() >= 400) failed.push({url: r.url(), status: r.status()});});
    const response = await page.goto(url);
    await page.waitForFunction(() => document.querySelector('#event-status').textContent.includes('3 upcoming events'));
    item('root and Lab event initialization load', response.status() === 200 && await page.locator('#event-status .event-list > li').count() === 3);
    item('one h1/zero divs/overflow-free Lab layout', await page.evaluate(() => document.querySelectorAll('h1').length === 1 && document.querySelectorAll('div').length === 0 && document.documentElement.scrollWidth <= innerWidth));
    item('no Homework link or section in Lab DOM', await page.evaluate(() => !document.querySelector('a[href*="homework/"], #homework')));
    await page.keyboard.press('Tab');
    item('first Tab shows native skip link and focus outline', await page.locator('.skip-link').evaluate(e => e === document.activeElement && getComputedStyle(e).outlineStyle !== 'none'));
    await page.keyboard.press('Enter');
    item('Enter skip link focuses main', await page.locator('main').evaluate(e => e === document.activeElement));
    for (const state of ['empty', 'error', 'ready']) {
      await page.locator(`.demo-controls [data-state="${state}"]`).click();
      item(`Lab ${state} state renders and marks selected control`, await page.locator(`.demo-controls [data-state="${state}"]`).getAttribute('aria-pressed') === 'true' && await page.locator('#event-status h3').count() === 1 && (state !== 'ready' || await page.locator('#event-status .event-list > li').count() === 3));
    }
    await page.locator('.demo-controls [data-state="error"]').click();
    await page.locator('.retry-button').focus(); await page.keyboard.press('Enter');
    item('Retry enters busy Loading', await page.locator('#event-status').getAttribute('aria-busy') === 'true');
    await page.waitForFunction(() => document.querySelector('#event-status').textContent.includes('3 upcoming events'));
    item('Retry recovers three Lab events', await page.locator('#event-status .event-list > li').count() === 3);
    const before = await page.locator('#theme-toggle').getAttribute('aria-pressed');
    await page.locator('#theme-toggle').focus(); await page.keyboard.press('Enter');
    const first = await page.locator('#theme-toggle').getAttribute('aria-pressed');
    await page.keyboard.press('Space');
    item('ordinary keyboard theme toggles both ways', first !== before && await page.locator('#theme-toggle').getAttribute('aria-pressed') === before);
    await page.locator('#contact-name').fill('An Sample'); await page.locator('#contact-email').fill('an@example.com'); await page.locator('#contact-message').fill('This is a local Lab test.');
    await page.locator('#contact-form button').click();
    item('native contact form completes locally and resets', (await page.locator('#form-feedback').textContent()).includes('did not send') && await page.locator('#contact-name').inputValue() === '' && page.url().split('#')[0] === url);
    item('no normal runtime/asset failure', !errors.length && !failed.length, {errors, failed});
    for (const route of ['homework/drum-kit/', 'homework/event-hub/']) {
      const result = await context.request.get(url + route);
      item(`${route}: absent Lab route returns 404`, result.status() === 404);
    }
    cases.push({width, theme, checks: subset, passed: subset.every(c => c.passed)});
    await context.close();
  }
  const result = {date: new Date().toISOString(), tester: 'Assistant: fresh baseline equality and local restored-Lab smoke check', previousMain: '66fe05a243cdc936c427179d445cfb6bfb148642', restoredBaseline: git('rev-parse', '8aa4676'), preservedHomework: '7ac14abdd9be04d2fa80b0ac4b65a5fbf37a8e00', browser: browser.version(), checks, cases, passed: checks.every(c => c.passed) && cases.every(c => c.passed), limits: ['Restored exact baseline behavior, not a fresh HW1 accessibility/CSP/Lighthouse certification.', 'Known baseline label/storage defects are fixed on the separate Homework branch, not silently mixed into this Lab restore.', 'No student laptop, hosted deployment/header or shared-chat verification claimed by this local report.']};
  fs.writeFileSync(path.join(root, 'verification/main-cleanup/result.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({passed: result.passed, checks: checks.length + cases.reduce((n,c)=>n+c.checks.length,0), failures: [...checks.filter(c=>!c.passed), ...cases.flatMap(c=>c.checks.filter(x=>!x.passed).map(x=>({width:c.width,theme:c.theme,...x})))]}, null, 2));
  if (!result.passed) process.exitCode = 1;
} finally {await browser.close(); server.close();}
