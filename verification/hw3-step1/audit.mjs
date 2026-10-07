import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const roots = [process.env.QA_NODE_MODULES, process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean);
const resolveModule = name => roots.map(root => path.join(root, name)).find(file => fs.existsSync(file)) || name;
const {chromium} = require(resolveModule('playwright'));
const axeSource = fs.readFileSync(require.resolve(resolveModule('axe-core')), 'utf8');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const appDirectory = path.join(root, 'homework/event-hub');
const headers = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8')).headers[0].headers;
const files = fs.readdirSync(appDirectory).sort();
const source = fs.readFileSync(path.join(appDirectory, 'index.html'), 'utf8');
const mime = {'.html': 'text/html; charset=utf-8', '.css': 'text/css', '.svg': 'image/svg+xml'};
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403).end(); return; }
  try {
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    for (const header of headers) res.setHeader(header.key, header.value);
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/homework/event-hub/`;
const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']});
const cases = [];
try {
  for (const width of [375, 1440]) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({viewport: {width, height: 900}, colorScheme: theme});
    const page = await context.newPage();
    const errors = [], failedResponses = [], requests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400) failedResponses.push({url: response.url(), status: response.status()}); });
    page.on('request', request => requests.push({url: request.url(), method: request.method(), type: request.resourceType()}));
    await page.addInitScript(() => {
      window.__violations = [];
      document.addEventListener('securitypolicyviolation', event => window.__violations.push(event.effectiveDirective));
    });
    const response = await page.goto(url);
    const checks = [];
    const check = (name, passed, detail) => checks.push({name, passed: Boolean(passed), ...(detail === undefined ? {} : {detail})});
    const dom = await page.evaluate(() => {
      const form = document.querySelector('#registration-form');
      const selectors = ['#attendee-name', '#attendee-email', '#attendee-interest', '#attendee-note', '#simulate-error'];
      const rect = element => { const r = element.getBoundingClientRect(); return {x: r.x, y: r.y, width: r.width, height: r.height}; };
      return {
        h1: document.querySelectorAll('h1').length, titleID: document.querySelector('h1').id,
        divs: document.querySelectorAll('div').length, scripts: document.querySelectorAll('script').length,
        inline: [...document.querySelectorAll('*')].flatMap(element => [...element.attributes].filter(attribute => attribute.name === 'style' || /^on/i.test(attribute.name)).map(attribute => attribute.name)),
        ids: [...document.querySelectorAll('[id]')].map(element => element.id),
        definitions: [...document.querySelectorAll('dl')].map(list => ({tags: [...list.children].map(element => element.tagName), count: list.children.length})),
        target: document.querySelector('#event-start').getAttribute('datetime'), targetTag: document.querySelector('#event-start').tagName,
        displayTime: document.querySelector('#event-start').textContent, displayZone: document.querySelector('#event-start').nextElementSibling.textContent,
        countdown: ['days', 'hours', 'minutes', 'seconds'].map(id => ({id, text: document.getElementById(id).textContent, live: document.getElementById(id).closest('[aria-live]')?.getAttribute('aria-live')})),
        countdownPairs: [...document.querySelectorAll('.countdown dt')].map((label, i) => ({label: rect(label), number: rect(document.querySelectorAll('.countdown dd')[i])})),
        fields: selectors.map(selector => { const field = document.querySelector(selector); return {id: field.id, tag: field.tagName, type: field.type, name: field.name, required: field.required, min: field.minLength, max: field.maxLength, autocomplete: field.autocomplete, labels: [...field.labels].map(label => label.textContent.trim()), descriptions: (field.getAttribute('aria-describedby') || '').split(' ').map(id => ({id, exists: Boolean(document.getElementById(id))})), rect: rect(field)}; }),
        options: [...document.querySelector('#attendee-interest').options].map(option => option.value),
        buttons: ['submit-btn', 'cancel-btn', 'reset-btn'].map(id => { const button = document.getElementById(id); return {id, type: button.type, disabled: button.disabled, rect: rect(button)}; }),
        form: {state: form.dataset.state, busy: form.getAttribute('aria-busy'), label: document.querySelector('#form-state').textContent, method: form.method, valid: form.checkValidity()},
        statuses: ['countdown-status', 'registration-status'].map(id => { const status = document.getElementById(id); return {id, role: status.getAttribute('role'), live: status.getAttribute('aria-live'), atomic: status.getAttribute('aria-atomic'), text: status.textContent}; }),
        receipt: {hidden: document.querySelector('#registration-summary').hidden, display: getComputedStyle(document.querySelector('#registration-summary')).display, values: ['receipt-name', 'receipt-email', 'receipt-interest', 'receipt-note'].map(id => document.getElementById(id).textContent)},
        disclaimer: document.querySelector('.demo-note').textContent, privacy: document.querySelector('#privacy-note').textContent,
        panels: ['.event-panel', '.registration-panel'].map(selector => rect(document.querySelector(selector))),
        overflow: document.documentElement.scrollWidth > innerWidth,
        stylesheet: [...document.styleSheets].map(sheet => sheet.href),
        colors: ['--bg', '--surface', '--soft', '--ink', '--muted', '--accent', '--control-line', '--focus', '--button', '--button-text'].map(name => [name, getComputedStyle(document.documentElement).getPropertyValue(name).trim()])
      };
    });
    check('one h1 event-title and zero divs', dom.h1 === 1 && dom.titleID === 'event-title' && dom.divs === 0);
    check('no application scripts or inline handlers/styles', dom.scripts === 0 && dom.inline.length === 0);
    check('only two static application files', JSON.stringify(files) === JSON.stringify(['index.html', 'styles.css']), files);
    check('unique IDs', dom.ids.length === new Set(dom.ids).size);
    check('all definition lists contain alternating dt/dd pairs', dom.definitions.every(list => list.count > 0 && list.count % 2 === 0 && list.tags.every((tag, i) => tag === (i % 2 === 0 ? 'DT' : 'DD'))), dom.definitions);
    check('single time source has exact UTC datetime', dom.targetTag === 'TIME' && dom.target === '2026-11-21T02:00:00Z');
    check('event displays exact Vietnam date/time and explicit zone', dom.displayTime === '21 November 2026 · 09:00' && dom.displayZone.includes('Asia/Ho_Chi_Minh') && dom.displayZone.includes('UTC+07:00'));
    check('four non-live countdown placeholders', dom.countdown.length === 4 && dom.countdown.every(slot => slot.text === '--' && !slot.live));
    check('countdown labels align below corresponding numbers', dom.countdownPairs.every(pair => Math.abs(pair.label.x - pair.number.x) < 1 && pair.label.y >= pair.number.y + pair.number.height - 1));
    check('all five form controls have visible native labels', dom.fields.length === 5 && dom.fields.every(field => field.labels.length === 1 && field.labels[0].length > 0), dom.fields);
    check('field descriptions and error nodes resolve', dom.fields.every(field => field.descriptions.length > 0 && field.descriptions.every(description => description.exists)));
    const [name, email, interest, note, simulate] = dom.fields;
    check('name native constraints and autofill', name.name === 'name' && name.type === 'text' && name.required && name.min === 2 && name.max === 80 && name.autocomplete === 'name');
    check('email native constraints and autofill', email.name === 'email' && email.type === 'email' && email.required && email.max === 120 && email.autocomplete === 'email');
    check('interest native requirement and exact option contract', interest.name === 'interest' && interest.required && JSON.stringify(dom.options) === JSON.stringify(['', 'design', 'code', 'both']));
    check('optional note bound and local error checkbox', !note.required && note.max === 300 && note.name === 'note' && simulate.type === 'checkbox' && !simulate.required);
    check('three disabled static controls and native button types', dom.buttons.every(button => button.disabled) && JSON.stringify(dom.buttons.map(button => button.type)) === JSON.stringify(['submit', 'button', 'reset']));
    check('idle form is not busy and initially invalid', dom.form.state === 'idle' && dom.form.label === 'Idle' && dom.form.busy === 'false' && !dom.form.valid);
    check('independent polite atomic statuses', dom.statuses.every(status => status.role === 'status' && status.live === 'polite' && status.atomic === 'true' && status.text.length > 0));
    check('receipt initially hidden and empty', dom.receipt.hidden && dom.receipt.display === 'none' && dom.receipt.values.every(value => value === ''));
    check('visible sample event and local-only privacy disclosures', dom.disclaimer.includes('not an actual UIT booking') && dom.privacy.includes('No email is sent') && dom.privacy.includes('not saved'));
    check('external local stylesheet is loaded', dom.stylesheet.length === 1 && dom.stylesheet[0] === new URL('styles.css', url).href);
    check('no horizontal overflow', !dom.overflow);
    check('mobile stacked / desktop adjacent panels', width < 760 ? dom.panels[1].y >= dom.panels[0].y + dom.panels[0].height : Math.abs(dom.panels[0].y - dom.panels[1].y) < 1 && dom.panels[1].x > dom.panels[0].x);
    check('text/select targets and buttons at least 44px high', dom.fields.slice(0, 4).every(field => field.rect.height >= 44) && dom.buttons.every(button => button.rect.height >= 44));
    const colors = Object.fromEntries(dom.colors);
    const luminance = color => color.match(/\w\w/g).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0);
    const ratios = [['--ink', '--surface', 4.5], ['--ink', '--soft', 4.5], ['--muted', '--surface', 4.5], ['--muted', '--bg', 4.5], ['--accent', '--bg', 4.5], ['--accent', '--surface', 4.5], ['--button-text', '--button', 4.5], ['--control-line', '--surface', 3], ['--control-line', '--soft', 3], ['--focus', '--surface', 3], ['--focus', '--bg', 3]].map(([foreground, background, minimum]) => { const a = luminance(colors[foreground]), b = luminance(colors[background]); return {foreground, background, minimum, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05)}; });
    check('text, border and focus contrast', ratios.every(result => result.ratio >= result.minimum), ratios);
    await page.keyboard.press('Tab');
    check('first Tab reveals skip link', await page.locator('.skip-link').evaluate(element => element === document.activeElement && element.getBoundingClientRect().top >= 0));
    await page.keyboard.press('Enter');
    check('skip link focuses main', await page.locator('main').evaluate(element => element === document.activeElement));
    await page.goto(url + '?keyboard-check=1');
    const selectors = ['.skip-link', '.back-link', '#attendee-name', '#attendee-email', '#attendee-interest', '#attendee-note', '#simulate-error'];
    const keyboard = [];
    for (const selector of selectors) {
      await page.keyboard.press('Tab');
      keyboard.push({direction: 'forward', selector, ...await page.locator(selector).evaluate(element => ({focused: element === document.activeElement, outline: getComputedStyle(element).outlineStyle, width: getComputedStyle(element).outlineWidth}))});
    }
    for (const selector of selectors.slice(0, -1).reverse()) {
      await page.keyboard.press('Shift+Tab');
      keyboard.push({direction: 'reverse', selector, ...await page.locator(selector).evaluate(element => ({focused: element === document.activeElement, outline: getComputedStyle(element).outlineStyle, width: getComputedStyle(element).outlineWidth}))});
    }
    check('forward/reverse keyboard order and 3px focus outline', keyboard.every(state => state.focused && state.outline !== 'none' && parseFloat(state.width) >= 3), keyboard);
    await page.locator('#attendee-name').fill('A');
    check('one-character typed name fails native minlength', await page.locator('#attendee-name').evaluate(element => element.validity.tooShort));
    await page.locator('#attendee-name').fill('Đặng Hoài An');
    await page.locator('#attendee-email').fill('invalid-address');
    check('malformed email fails native type=email', await page.locator('#attendee-email').evaluate(element => element.validity.typeMismatch));
    await page.locator('#attendee-email').fill('an@example.com');
    await page.locator('#attendee-interest').selectOption('both');
    await page.locator('#attendee-note').fill('Sample note');
    check('valid sample fields satisfy native constraints', await page.locator('form').evaluate(form => form.checkValidity()));
    await page.locator('#simulate-error').focus();
    await page.keyboard.press('Space');
    check('native error checkbox works with Space', await page.locator('#simulate-error').isChecked());
    const requestsBeforeEnter = requests.length, urlBeforeEnter = page.url();
    await page.locator('#attendee-email').focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
    check('disabled submit prevents implicit Enter navigation/request', page.url() === urlBeforeEnter && requests.length === requestsBeforeEnter && await page.locator('#attendee-name').inputValue() === 'Đặng Hoài An');
    await page.emulateMedia({reducedMotion: 'reduce'});
    check('reduced-motion page has no animation or smooth scrolling', await page.evaluate(() => [...document.querySelectorAll('*')].every(element => { const style = getComputedStyle(element); return style.animationName === 'none' && style.transitionDuration === '0s' && style.scrollBehavior !== 'smooth'; })));
    await page.emulateMedia({reducedMotion: 'no-preference'});
    const violations = await page.evaluate(() => window.__violations);
    check('normal navigation has no runtime/network/CSP error or data request', errors.length === 0 && failedResponses.length === 0 && violations.length === 0 && requests.every(request => request.method === 'GET' && new URL(request.url).origin === new URL(url).origin && !['fetch', 'xhr', 'script'].includes(request.type)), {errors, failedResponses, violations, requests});
    check('local response applies exact repository CSP', response.headers()['content-security-policy'] === headers.find(header => header.key === 'Content-Security-Policy').value);
    // Automation injects axe as test instrumentation; the static app has no script.
    await page.evaluate(axeSource);
    const axe = await page.evaluate(async () => window.axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']}}));
    check('axe WCAG through 2.2 AA and best-practice: zero violations', axe.violations.length === 0);
    if (process.env.SCREENSHOTS_DIR) {
      fs.mkdirSync(process.env.SCREENSHOTS_DIR, {recursive: true});
      await page.locator('h1').click();
      await page.screenshot({path: path.join(process.env.SCREENSHOTS_DIR, `${width}-${theme}.png`), fullPage: true});
    }
    cases.push({width, theme, checks, axe: {version: axe.testEngine.version, violations: axe.violations, incomplete: axe.incomplete, passes: axe.passes.map(result => result.id)}, passed: checks.every(check => check.passed)});
    await context.close();
  }
  const report = {date: new Date().toISOString(), tester: 'Assistant: fresh local Chromium checks for HW3 Step 1', browser: browser.version(), baseline: '45307349a1762c209604737cb3d1e9ad104b9a37', delivery: 'Local HTTP with repository CSP response header and page CSP meta', sourceChecks: {noScriptTag: !/<script\b/i.test(source), files}, limits: ['Static HTML/CSS only; no countdown or form controller exists yet.', 'No student, Vercel header, live-defense, clock drift, submission or XSS result is claimed.', 'Axe and token contrast checks do not by themselves prove full WCAG conformance.'], cases, passed: cases.every(result => result.passed)};
  fs.writeFileSync(path.join(root, 'verification/hw3-step1/result.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({passed: report.passed, browser: report.browser, cases: cases.map(result => ({width: result.width, theme: result.theme, checks: result.checks.length, failures: result.checks.filter(check => !check.passed).map(check => check.name), axeViolations: result.axe.violations.length, axeIncomplete: result.axe.incomplete.length}))}, null, 2));
  if (!report.passed) process.exitCode = 1;
} finally { await browser.close(); server.close(); }
