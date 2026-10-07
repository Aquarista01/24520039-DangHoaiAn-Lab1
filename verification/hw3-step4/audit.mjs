import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {instrument} from './instrument.mjs';

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
const mime = {'.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml'};
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
const snapshot = page => page.evaluate(() => ({
  state: document.querySelector('form').dataset.state,
  label: document.querySelector('#form-state').textContent,
  busy: document.querySelector('form').getAttribute('aria-busy'),
  fields: [...document.querySelectorAll('form input, form select, form textarea')].map(field => ({id: field.id, value: field.value, checked: field.checked, disabled: field.disabled, invalid: field.getAttribute('aria-invalid')})),
  submitDisabled: document.querySelector('#submit-btn').disabled,
  submitText: document.querySelector('#submit-btn').textContent,
  resetDisabled: document.querySelector('#reset-btn').disabled,
  cancelDisabled: document.querySelector('#cancel-btn').disabled,
  status: document.querySelector('#registration-status').textContent,
  statusOutsideBusy: !document.querySelector('#registration-status').closest('[aria-busy="true"]'),
  summaryHidden: document.querySelector('#registration-summary').hidden,
  receipt: ['name', 'email', 'interest', 'note'].map(key => document.getElementById(`receipt-${key}`).textContent),
  focus: document.activeElement.id,
  focusInViewport: document.activeElement.getBoundingClientRect().top >= 0 && document.activeElement.getBoundingClientRect().bottom <= innerHeight,
  overflow: document.documentElement.scrollWidth > innerWidth,
  formErrors: [...document.querySelectorAll('.field-error')].map(element => element.textContent),
  violations: window.__violations || []
}));
const ready = page => page.waitForFunction(() => !document.querySelector('#submit-btn').disabled);
const waitState = (page, state) => page.waitForFunction(expected => document.querySelector('form').dataset.state === expected, state);
const fill = async page => {
  await page.locator('#attendee-name').fill('Đặng Hoài An');
  await page.locator('#attendee-email').fill('an@example.com');
  await page.locator('#attendee-interest').selectOption('both');
  await page.locator('#attendee-note').fill('I <3 code\nLet’s learn together.');
};
try {
  for (const width of [375, 1440]) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({viewport: {width, height: 900}, colorScheme: theme});
    const page = await context.newPage(), errors = [], failed = [], requests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {if (message.type() === 'error') errors.push(message.text());});
    page.on('response', response => {if (response.status() >= 400) failed.push({url: response.url(), status: response.status()});});
    page.on('request', request => requests.push({url: request.url(), method: request.method(), type: request.resourceType()}));
    await page.addInitScript(() => {
      window.__violations = []; window.__unhandled = [];
      document.addEventListener('securitypolicyviolation', event => window.__violations.push(event.effectiveDirective));
      window.addEventListener('unhandledrejection', event => window.__unhandled.push(String(event.reason)));
    });
    await instrument(page);
    await page.route('**/registration-service.js', async route => {const response = await route.fetch(); await route.fulfill({response, body: (await response.text()).replace("  const keys =", "  window.__serviceCalls += 1; window.__serviceSignals.push(signal);\n  const keys =")});});
    await page.goto(url); await ready(page);
    const initialURL = page.url();
    const initialStorage = await page.evaluate(() => ({local: {...localStorage}, session: {...sessionStorage}}));
    const checks = [], audits = [];
    const check = (name, passed, detail) => checks.push({name, passed: Boolean(passed), ...(detail === undefined ? {} : {detail})});
    await page.evaluate(axeSource);
    const audit = async state => {
      const result = await page.evaluate(async () => window.axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']}}));
      audits.push({state, observedState: (await snapshot(page)).state, version: result.testEngine.version, violations: result.violations, incomplete: result.incomplete, passes: result.passes.map(item => item.id)});
      check(`${state}: axe zero violations`, result.violations.length === 0);
    };
    const idle = await snapshot(page);
    check('initial idle, enabled fields/Register/Reset and disabled Cancel', idle.state === 'idle' && idle.label === 'Idle' && idle.busy === 'false' && idle.fields.every(field => !field.disabled) && !idle.submitDisabled && !idle.resetDisabled && idle.cancelDisabled && idle.summaryHidden);
    check('one h1/zero divs and strict local module wiring', await page.evaluate(() => document.querySelectorAll('h1').length === 1 && document.querySelectorAll('div').length === 0 && document.scripts.length === 1 && document.scripts[0].type === 'module' && document.scripts[0].getAttribute('src') === 'app.js' && [...document.querySelectorAll('*')].every(element => [...element.attributes].every(attribute => attribute.name !== 'style' && !/^on/i.test(attribute.name)))));
    check('independent polite atomic feedback outside busy form', idle.statusOutsideBusy && await page.locator('#registration-status').evaluate(element => element.getAttribute('aria-live') === 'polite' && element.getAttribute('aria-atomic') === 'true'));
    check('countdown remains active alongside idle form', /^\d+$/.test(await page.locator('#seconds').textContent()));
    await audit('idle');
    const selectors = ['.skip-link', '.back-link', '#attendee-name', '#attendee-email', '#attendee-interest', '#attendee-note', '#simulate-error', '#submit-btn', '#reset-btn'];
    const keyboard = [];
    for (const selector of selectors) {
      await page.keyboard.press('Tab');
      keyboard.push({direction: 'forward', selector, ...await page.locator(selector).evaluate(element => ({focused: element === document.activeElement, outline: getComputedStyle(element).outlineStyle, width: getComputedStyle(element).outlineWidth}))});
    }
    for (const selector of selectors.slice(0, -1).reverse()) {
      await page.keyboard.press('Shift+Tab');
      keyboard.push({direction: 'reverse', selector, ...await page.locator(selector).evaluate(element => ({focused: element === document.activeElement, outline: getComputedStyle(element).outlineStyle, width: getComputedStyle(element).outlineWidth}))});
    }
    check('forward/reverse Tab order and visible focus', keyboard.every(item => item.focused && item.outline !== 'none' && parseFloat(item.width) >= 3), keyboard);
    await page.keyboard.press('Enter');
    check('skip link focuses main', await page.locator('main').evaluate(element => element === document.activeElement));
    await page.locator('#submit-btn').click();
    const invalid = await snapshot(page);
    check('empty native validation stays idle, focuses name and shows messages', invalid.state === 'idle' && invalid.focus === 'attendee-name' && invalid.formErrors.slice(0, 3).every(Boolean) && invalid.fields.slice(0, 3).every(field => field.invalid === 'true') && invalid.summaryHidden);
    check('native invalid submission does not navigate', page.url().split('#')[0] === initialURL);
    await audit('invalid');
    await page.locator('#attendee-name').fill('A');
    await page.locator('#attendee-email').fill('wrong-address');
    await page.locator('#submit-btn').click();
    check('short typed name and malformed email fail native constraints', await page.evaluate(() => document.querySelector('#attendee-name').validity.tooShort && document.querySelector('#attendee-email').validity.typeMismatch && document.querySelector('form').dataset.state === 'idle'));
    await fill(page);
    const corrected = await snapshot(page);
    check('valid correction clears field errors and invalid attributes', corrected.formErrors.every(text => text === '') && corrected.fields.every(field => field.invalid === null));
    const submittedAt = Date.now();
    await page.locator('#submit-btn').click();
    const pending = await snapshot(page);
    check('valid submit synchronously enters Submitting/busy', pending.state === 'submitting' && pending.label === 'Submitting' && pending.busy === 'true');
    check('pending fields/Register/Reset disabled and Cancel enabled', pending.fields.every(field => field.disabled) && pending.submitDisabled && pending.resetDisabled && !pending.cancelDisabled && pending.submitText === 'Working…');
    check('pending focus moves to enabled visible Cancel with independent status', pending.focus === 'cancel-btn' && pending.statusOutsideBusy && await page.locator('#cancel-btn').evaluate(element => element === document.activeElement && !element.disabled));
    await audit('submitting');
    check('submitting audit completed during actual pending state', audits.at(-1).observedState === 'submitting');
    await waitState(page, 'success');
    const success = await snapshot(page), elapsed = Date.now() - submittedAt;
    check('real local service success after expected 600ms timer', success.state === 'success' && success.label === 'Success' && success.busy === 'false' && elapsed >= 550 && elapsed <= 3000, {elapsedMs: elapsed});
    check('success shows exact text-only receipt and interest label', !success.summaryHidden && JSON.stringify(success.receipt) === JSON.stringify(['Đặng Hoài An', 'an@example.com', 'Design and code', 'I <3 code\nLet’s learn together.']), success.receipt);
    check('success disables repeat registration, enables/focuses Reset', success.submitDisabled && !success.resetDisabled && success.focus === 'reset-btn' && success.fields.every(field => field.disabled));
    check('success feedback explicitly discloses no send/save', success.status.includes('Nothing was sent or saved'));
    check('success has no horizontal overflow', !success.overflow);
    await audit('success');
    if (process.env.SCREENSHOTS_DIR) {
      fs.mkdirSync(process.env.SCREENSHOTS_DIR, {recursive: true});
      await page.screenshot({path: path.join(process.env.SCREENSHOTS_DIR, `${width}-${theme}-success.png`), fullPage: true});
    }
    await page.locator('#reset-btn').click();
    const reset = await snapshot(page);
    check('Reset returns Idle, clears input/receipt and focuses visible name', reset.state === 'idle' && reset.focus === 'attendee-name' && reset.focusInViewport && reset.fields.slice(0, 4).every(field => field.value === '' && !field.disabled) && !reset.fields[4].checked && reset.summaryHidden && reset.receipt.every(text => text === '') && !reset.submitDisabled, reset);
    await fill(page); await page.locator('#submit-btn').click();
    const beforeCancel = await snapshot(page);
    await page.keyboard.press('Enter');
    const cancelled = await snapshot(page);
    check('keyboard Enter on focused Cancel returns Idle and retains input', beforeCancel.focus === 'cancel-btn' && cancelled.state === 'idle' && cancelled.fields[0].value === 'Đặng Hoài An' && cancelled.focus === 'submit-btn' && cancelled.cancelDisabled && !cancelled.submitDisabled);
    check('Cancel aborts actual service and clears both owned timers/listener', await page.evaluate(() => window.__serviceSignals.at(-1).aborted && window.__ownedTimers.size === 0 && window.__abortListenerCount() === 0));
    await page.waitForTimeout(700);
    check('cancelled real service never produces a late receipt', (await snapshot(page)).state === 'idle' && (await snapshot(page)).summaryHidden);
    await audit('cancelled');
    const rapid = await page.evaluate(() => {
      const before = window.__serviceCalls, form = document.querySelector('form'), button = document.querySelector('#submit-btn');
      button.click(); button.click(); form.requestSubmit(); form.dispatchEvent(new SubmitEvent('submit', {cancelable: true, bubbles: true}));
      return {calls: window.__serviceCalls - before, state: form.dataset.state};
    });
    check('rapid double click/requestSubmit/submit event invokes one real service', rapid.calls === 1 && rapid.state === 'submitting', rapid);
    await waitState(page, 'success'); await page.locator('#reset-btn').click();
    await fill(page); await page.locator('#simulate-error').check();
    await page.locator('#submit-btn').click(); await waitState(page, 'error');
    const fault = await snapshot(page);
    check('selected simulation reaches Error with retryable feedback', fault.state === 'error' && fault.label === 'Error' && fault.busy === 'false' && fault.submitText === 'Try again' && fault.status.includes('Your entries are kept'));
    check('Error retains entered values and checked simulation', fault.fields[0].value === 'Đặng Hoài An' && fault.fields[1].value === 'an@example.com' && fault.fields[2].value === 'both' && fault.fields[3].value === 'I <3 code\nLet’s learn together.' && fault.fields[4].checked);
    check('Error re-enables fields/Retry/Reset and focuses Retry', fault.fields.every(field => !field.disabled) && !fault.submitDisabled && !fault.resetDisabled && fault.focus === 'submit-btn' && fault.summaryHidden);
    await audit('error');
    if (process.env.SCREENSHOTS_DIR) await page.screenshot({path: path.join(process.env.SCREENSHOTS_DIR, `${width}-${theme}-error.png`), fullPage: true});
    await page.locator('#simulate-error').uncheck();
    await page.locator('#attendee-email').focus();
    await page.evaluate(() => window.scrollTo(0, document.querySelector('#attendee-email').getBoundingClientRect().top + scrollY - 50));
    await page.keyboard.press('Enter');
    check('keyboard Enter brings pending focus target into viewport', (await snapshot(page)).focusInViewport, await snapshot(page));
    await waitState(page, 'success');
    check('native Enter retry succeeds after unchecking fault without retyping', (await snapshot(page)).receipt[0] === 'Đặng Hoài An' && (await snapshot(page)).focus === 'reset-btn');
    check('keyboard retry completion keeps Reset focus in viewport', (await snapshot(page)).focusInViewport);
    await page.locator('#reset-btn').click();
    check('second Reset remains usable after error/retry cycle', (await snapshot(page)).state === 'idle' && (await snapshot(page)).fields[0].value === '');
    await fill(page); await page.locator('#submit-btn').click();
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', {persisted: true})));
    const suspended = await snapshot(page);
    check('pagehide aborts pending service and leaves preserved retryable Error', suspended.state === 'error' && suspended.busy === 'false' && suspended.status.includes('interrupted') && suspended.fields[0].value === 'Đặng Hoài An' && suspended.submitDisabled);
    check('pagehide detaches all form listeners and cancels owned timers', await page.evaluate(() => window.__ownedTimers.size === 0 && window.__formListenerCount() === 0 && window.__abortListenerCount() === 0));
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true})));
    check('pageshow restores six form listeners and enabled Retry', (await snapshot(page)).state === 'error' && !(await snapshot(page)).submitDisabled && await page.evaluate(() => window.__formListenerCount() === 6));
    await page.locator('#submit-btn').click(); await waitState(page, 'success');
    check('restored interrupted form can retry successfully', (await snapshot(page)).receipt[0] === 'Đặng Hoài An');
    const cycles = await page.evaluate(() => {
      const counts = [];
      for (let i = 0; i < 20; i++) {
        window.dispatchEvent(new PageTransitionEvent('pagehide', {persisted: true})); counts.push(window.__formListenerCount());
        window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true})); counts.push(window.__formListenerCount());
        window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true})); counts.push(window.__formListenerCount());
      }
      return counts;
    });
    check('20 repeated lifecycle cycles preserve receipt and never duplicate listeners', cycles.every((count, i) => count === (i % 3 === 0 ? 0 : 6)) && !(await snapshot(page)).summaryHidden, cycles);
    await page.locator('#reset-btn').click();
    check('all settled normal sessions leave no owned timers/abort listeners', await page.evaluate(() => window.__ownedTimers.size === 0 && window.__abortListenerCount() === 0));
    check('countdown still active after all form states', /^\d+$/.test(await page.locator('#seconds').textContent()));
    check('normal workflow makes no outgoing registration request or navigation', page.url().split('#')[0] === initialURL && requests.every(request => request.method === 'GET' && new URL(request.url).origin === new URL(url).origin && !['fetch', 'xhr'].includes(request.type)), requests);
    check('normal workflow does not persist form entries', JSON.stringify(initialStorage) === JSON.stringify(await page.evaluate(() => ({local: {...localStorage}, session: {...sessionStorage}}))));
    const final = await snapshot(page);
    check('normal page has no runtime/failed request/CSP/unhandled rejection', errors.length === 0 && failed.length === 0 && final.violations.length === 0 && (await page.evaluate(() => window.__unhandled)).length === 0, {errors, failed, violations: final.violations});
    cases.push({width, theme, clock: 'Native Date.now/setTimeout and real local service; no normal transport mocks', checks, audits, passed: checks.every(item => item.passed)});
    await context.close();
  }

  const report = {date: new Date().toISOString(), tester: 'Assistant: fresh native browser checks for HW3 Step 4', baseline: 'd97b7e38616413af3b1fd181e5aaf9750b99aee1', browser: browser.version(), method: 'Actual 600ms local service with a test-only call/signal observer inserted into its served module; timer/listener observers and axe are QA instrumentation. Synthetic page lifecycle signals are explicitly labeled.', cases, passed: cases.every(item => item.passed), limits: ['Pagehide/pageshow persisted signals are synthetic, not actual BFCache navigation.', 'Fault/timeout/token cases are recorded separately in contract-result.json.', 'No student, hosted-header, live-defense or independent normalization/XSS check is claimed.']};
  fs.writeFileSync(path.join(root, 'verification/hw3-step4/result.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({passed: report.passed, cases: cases.map(item => ({width: item.width, theme: item.theme, checks: item.checks.length, failures: item.checks.filter(check => !check.passed).map(check => check.name), axeViolations: item.audits.reduce((sum, audit) => sum + audit.violations.length, 0), axeIncomplete: item.audits.reduce((sum, audit) => sum + audit.incomplete.length, 0)}))}, null, 2));
  if (!report.passed) process.exitCode = 1;
} finally { await browser.close(); server.close(); }
