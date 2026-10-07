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
const cases = [], integration = [];
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
    check('pending fields/Register/Reset disabled, Cancel reserved for next slice', pending.fields.every(field => field.disabled) && pending.submitDisabled && pending.resetDisabled && pending.cancelDisabled && pending.submitText === 'Working…');
    check('pending focus moves to visible status outside busy form', pending.focus === 'registration-status' && pending.statusOutsideBusy && await page.locator('#registration-status').evaluate(element => getComputedStyle(element).outlineStyle !== 'none'));
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
    check('countdown still active after all form states', /^\d+$/.test(await page.locator('#seconds').textContent()));
    check('normal workflow makes no outgoing registration request or navigation', page.url().split('#')[0] === initialURL && requests.every(request => request.method === 'GET' && new URL(request.url).origin === new URL(url).origin && !['fetch', 'xhr'].includes(request.type)), requests);
    check('normal workflow does not persist form entries', JSON.stringify(initialStorage) === JSON.stringify(await page.evaluate(() => ({local: {...localStorage}, session: {...sessionStorage}}))));
    const final = await snapshot(page);
    check('normal page has no runtime/failed request/CSP/unhandled rejection', errors.length === 0 && failed.length === 0 && final.violations.length === 0 && (await page.evaluate(() => window.__unhandled)).length === 0, {errors, failed, violations: final.violations});
    cases.push({width, theme, clock: 'Native Date.now/setTimeout and real local service; no normal transport mocks', checks, audits, passed: checks.every(item => item.passed)});
    await context.close();
  }

  const check = (name, passed, detail) => integration.push({name, passed: Boolean(passed), ...(detail === undefined ? {} : {detail})});
  const context = await browser.newContext(), page = await context.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  // Isolated fixture: suppress only the app bootstrap, then create the actual controller
  // with a deliberately injected transport. No QA counter is added to product code.
  await page.route('**/app.js', route => route.fulfill({status: 200, contentType: 'text/javascript', body: 'export {};'}));
  await page.goto(url);
  await page.evaluate(async () => {
    window.__unhandled = []; window.addEventListener('unhandledrejection', event => window.__unhandled.push(String(event.reason)));
    const {createRegistration} = await import('/homework/event-hub/registration.js');
    window.__calls = []; window.__mode = 'deferred'; window.__resolvers = [];
    window.__controller = createRegistration({form: document.querySelector('form'), summary: document.querySelector('#registration-summary'), service: (payload, options) => {
      window.__calls.push({payload, options, frozen: Object.isFrozen(payload)});
      if (window.__mode === 'throw') throw new Error('Injected synchronous fault');
      if (window.__mode === 'reject') return Promise.reject(new Error('Injected rejection'));
      if (window.__mode === 'reenter') {window.__reentry = window.__controller.submit(); return Promise.resolve(payload);}
      return new Promise(resolve => window.__resolvers.push(() => resolve(payload)));
    }});
  });
  check('isolated invalid direct submit calls no transport', await page.evaluate(async () => !(await window.__controller.submit()) && window.__calls.length === 0 && window.__controller.getState() === 'idle'));
  await fill(page);
  const guard = await page.evaluate(async () => {
    window.__first = window.__controller.submit();
    const second = await window.__controller.submit();
    return {second, calls: window.__calls.length, state: window.__controller.getState(), frozen: window.__calls[0].frozen};
  });
  check('basic synchronous Submitting guard rejects direct second call', !guard.second && guard.calls === 1 && guard.state === 'submitting' && guard.frozen, guard);
  const snapshotProtected = await page.evaluate(() => {
    const result = window.__controller.reset();
    document.querySelector('form').reset();
    const retained = document.querySelector('#attendee-name').value;
    document.querySelector('#attendee-name').value = 'Changed after submit';
    document.querySelector('#simulate-error').checked = true;
    return {result, retained, pendingName: window.__calls[0].payload.name, simulation: window.__calls[0].options.simulateError};
  });
  check('pending Reset is rejected and entry-time payload/error choice is retained', !snapshotProtected.result && snapshotProtected.retained === 'Đặng Hoài An' && snapshotProtected.pendingName === 'Đặng Hoài An' && !snapshotProtected.simulation, snapshotProtected);
  await page.evaluate(async () => {window.__resolvers.shift()(); await window.__first;});
  check('deferred success renders original snapshot despite later DOM edit', (await snapshot(page)).receipt[0] === 'Đặng Hoài An');
  check('Success guards direct repeat submit until Reset', await page.evaluate(async () => !(await window.__controller.submit()) && window.__calls.length === 1));
  await page.evaluate(() => window.__controller.reset()); await fill(page);
  await page.evaluate(async () => {window.__mode = 'throw'; await window.__controller.submit();});
  check('synchronous transport throw becomes useful retryable Error', (await snapshot(page)).state === 'error' && !(await snapshot(page)).submitDisabled && !(await snapshot(page)).status.includes('Injected synchronous'));
  await page.evaluate(async () => {window.__mode = 'reject'; await window.__controller.submit();});
  check('rejected Promise is handled and keeps input for retry', (await snapshot(page)).state === 'error' && (await snapshot(page)).fields[0].value === 'Đặng Hoài An');
  await page.evaluate(async () => {window.__mode = 'reenter'; window.__priorCalls = window.__calls.length; await window.__controller.submit();});
  check('synchronous service re-entry hits existing state guard', await page.evaluate(async () => !(await window.__reentry) && window.__calls.length === window.__priorCalls + 1 && window.__controller.getState() === 'success'));
  await page.evaluate(() => window.__controller.reset()); await fill(page);
  await page.evaluate(() => {window.__mode = 'deferred'; window.__ignored = window.__controller.submit(); window.__controller.dispose(); window.__controller.dispose();});
  const beforeDisposeResolve = await snapshot(page);
  await page.evaluate(async () => {window.__resolvers.shift()(); await window.__ignored;});
  check('basic idempotent dispose ignores future completion and blocks new submit', (await snapshot(page)).summaryHidden && (await snapshot(page)).state === beforeDisposeResolve.state && await page.evaluate(async () => !(await window.__controller.submit())));
  await page.waitForTimeout(20);
  check('isolated faults/re-entry have no page error or unhandled rejection', errors.length === 0 && (await page.evaluate(() => window.__unhandled)).length === 0, errors);
  await context.close();

  const badContext = await browser.newContext(), badPage = await badContext.newPage();
  await badPage.route('**/homework/event-hub/', async route => {const response = await route.fetch(); await route.fulfill({response, body: (await response.text()).replace('datetime="2026-11-21T02:00:00Z"', 'datetime="invalid"')});});
  await badPage.goto(url); await ready(badPage); await fill(badPage);
  await badPage.locator('#submit-btn').click(); await waitState(badPage, 'success');
  check('invalid countdown metadata does not prevent actual form success', (await badPage.locator('#countdown-status').textContent()).includes('unavailable') && (await snapshot(badPage)).state === 'success');
  await badContext.close();
  const noJS = await browser.newContext({javaScriptEnabled: false}), fallback = await noJS.newPage();
  await fallback.goto(url);
  check('no-JavaScript fallback retains local privacy/help and disabled Submit', (await fallback.locator('#registration-status').textContent()).includes('Enable JavaScript') && await fallback.locator('#submit-btn').isDisabled() && (await fallback.locator('#privacy-note').textContent()).includes('No email is sent'));
  await noJS.close();

  const report = {date: new Date().toISOString(), tester: 'Assistant: fresh local browser checks for HW3 Step 3', baseline: 'd9766945b3983b199a7a737d9f38e8b6b5e46651', browser: browser.version(), delivery: 'Local HTTP under repository CSP header/meta; four native-service UI configurations and labeled isolated injected-service cases', cases, integration, passed: cases.every(item => item.passed) && integration.every(item => item.passed), limits: ['Cancel, request token/abort/timeout/pagehide recovery are the next package.', 'Independent normalization and hostile-payload execution checks are a later package.', 'No student, hosted-header or live-defense check is claimed.']};
  fs.writeFileSync(path.join(root, 'verification/hw3-step3/result.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({passed: report.passed, browser: report.browser, cases: cases.map(result => ({width: result.width, theme: result.theme, checks: result.checks.length, failures: result.checks.filter(item => !item.passed).map(item => item.name), audits: result.audits.map(item => ({state: item.state, observed: item.observedState, violations: item.violations.length, incomplete: item.incomplete.length}))})), integrationChecks: integration.length, integrationFailures: integration.filter(item => !item.passed)}, null, 2));
  if (!report.passed) process.exitCode = 1;
} finally { await browser.close(); server.close(); }
