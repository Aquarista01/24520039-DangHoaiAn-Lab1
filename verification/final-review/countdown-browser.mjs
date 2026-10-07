// Final review copy of verification/hw3-step2/audit.mjs; adaptations documented in prepare.py.
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
const instrument = async page => {
  await page.addInitScript(() => {
    window.__timers = new Map();
    window.__visibilityListeners = new Set();
    window.__statusChanges = [];
    window.__violations = [];
    const schedule = window.setTimeout.bind(window), cancel = window.clearTimeout.bind(window);
    window.setTimeout = (callback, delay, ...args) => {
      const id = schedule(() => { window.__timers.delete(id); callback(...args); }, delay);
      window.__timers.set(id, {delay});
      return id;
    };
    window.clearTimeout = id => { window.__timers.delete(id); cancel(id); };
    const add = document.addEventListener.bind(document), remove = document.removeEventListener.bind(document);
    document.addEventListener = (type, listener, options) => { if (type === 'visibilitychange') window.__visibilityListeners.add(listener); add(type, listener, options); };
    document.removeEventListener = (type, listener, options) => { if (type === 'visibilitychange') window.__visibilityListeners.delete(listener); remove(type, listener, options); };
    document.addEventListener('securitypolicyviolation', event => window.__violations.push(event.effectiveDirective));
    new MutationObserver(records => {
      for (const record of records) if ((record.target.nodeType === 1 ? record.target : record.target.parentElement)?.closest('#countdown-status')) window.__statusChanges.push(document.querySelector('#countdown-status').textContent);
    }).observe(document, {subtree: true, childList: true, characterData: true});
  });
};
const observe = page => page.evaluate(() => {
  const values = ['days', 'hours', 'minutes', 'seconds'].map(id => document.getElementById(id).textContent);
  return {values, total: Number(values[0]) * 86400 + Number(values[1]) * 3600 + Number(values[2]) * 60 + Number(values[3]), now: Date.now(), target: Date.parse(document.querySelector('#event-start').getAttribute('datetime')), status: document.querySelector('#countdown-status').textContent, timers: window.__timers?.size, listeners: window.__visibilityListeners?.size, changes: window.__statusChanges?.length};
});
try {
  for (const width of [375, 1440]) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({viewport: {width, height: 900}, colorScheme: theme});
    const page = await context.newPage(), errors = [], failed = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400) failed.push({url: response.url(), status: response.status()}); });
    await instrument(page);
    await page.goto(url);
    await page.waitForFunction(() => /^\d+$/.test(document.querySelector('#seconds').textContent));
    const checks = [], check = (name, passed, detail) => checks.push({name, passed: Boolean(passed), ...(detail === undefined ? {} : {detail})});
    const initial = await observe(page);
    check('native clock uses absolute HTML UTC epoch within one displayed second', Math.abs(initial.total - Math.ceil((initial.target - initial.now) / 1000)) <= 1, initial);
    check('one owned timer and one visibility listener', initial.timers === 1 && initial.listeners === 1);
    check('running status is useful and not a numeric live announcement', initial.status.includes('Counting down') && await page.locator('.countdown').evaluate(element => !element.closest('[aria-live]')));
    const startedAt = Date.now();
    await page.waitForTimeout(3150);
    const progressed = await observe(page), elapsed = Date.now() - startedAt;
    check('native timeout advances countdown over actual elapsed wait', progressed.total < initial.total && Math.abs(progressed.total - Math.ceil((progressed.target - progressed.now) / 1000)) <= 1, {elapsedMs: elapsed, initial: initial.total, ...progressed});
    check('ordinary ticks do not mutate polite countdown status', progressed.changes === initial.changes);
    const dom = await page.evaluate(() => ({h1: document.querySelectorAll('h1').length, divs: document.querySelectorAll('div').length, scripts: [...document.scripts].map(script => ({type: script.type, src: script.getAttribute('src'), text: script.textContent})), inline: [...document.querySelectorAll('*')].some(element => [...element.attributes].some(attribute => attribute.name === 'style' || /^on/i.test(attribute.name))), overflow: document.documentElement.scrollWidth > innerWidth, formState: document.querySelector('form').dataset.state, buttons: ['submit-btn', 'cancel-btn', 'reset-btn'].map(id => document.getElementById(id).disabled), receiptHidden: document.querySelector('#registration-summary').hidden}));
    check('one h1/zero divs and only external local app module', dom.h1 === 1 && dom.divs === 0 && dom.scripts.length === 1 && dom.scripts[0].type === 'module' && dom.scripts[0].src === 'app.js' && dom.scripts[0].text === '' && !dom.inline, dom);
    check('completed form initializes idle with Submit/Reset enabled, Cancel disabled and receipt hidden', dom.formState === 'idle' && !dom.buttons[0] && dom.buttons[1] && !dom.buttons[2] && dom.receiptHidden);
    check('no horizontal overflow', !dom.overflow);
    await page.keyboard.press('Tab');
    check('first Tab reveals skip link with visible focus', await page.locator('.skip-link').evaluate(element => element === document.activeElement && element.getBoundingClientRect().top >= 0 && getComputedStyle(element).outlineStyle !== 'none'));
    await page.keyboard.press('Enter');
    check('skip link focuses main', await page.locator('main').evaluate(element => element === document.activeElement));
    // Synthetic page lifecycle signals exercise the actual handlers; no real BFCache claim.
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', {persisted: true})));
    const hidden = await observe(page);
    check('pagehide cancels owned timeout and visibility listener', hidden.timers === 0 && hidden.listeners === 0);
    await page.waitForTimeout(1150);
    const paused = await observe(page);
    check('pagehide has no future numeric update', paused.total === hidden.total && paused.timers === 0);
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true})));
    const restored = await observe(page);
    check('pageshow immediately recomputes and restores exactly one timer/listener', restored.timers === 1 && restored.listeners === 1 && Math.abs(restored.total - Math.ceil((restored.target - restored.now) / 1000)) <= 1);
    const lifecycle = await page.evaluate(() => {
      const snapshots = [];
      for (let i = 0; i < 20; i++) {
        window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true}));
        document.dispatchEvent(new Event('visibilitychange'));
        snapshots.push({timers: window.__timers.size, listeners: window.__visibilityListeners.size});
        window.dispatchEvent(new PageTransitionEvent('pagehide', {persisted: true}));
        snapshots.push({timers: window.__timers.size, listeners: window.__visibilityListeners.size});
        window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true}));
      }
      return snapshots;
    });
    check('20 restore/visibility cycles never duplicate timers/listeners', lifecycle.every((sample, i) => sample.timers === (i % 2 === 0 ? 1 : 0) && sample.listeners === (i % 2 === 0 ? 1 : 0)), lifecycle);
    check('lifecycle recovery does not repeat status announcement', (await observe(page)).changes === initial.changes);
    check('normal page has no console/page/network/CSP errors', errors.length === 0 && failed.length === 0 && (await page.evaluate(() => window.__violations)).length === 0, {errors, failed});
    await page.evaluate(axeSource);
    const axe = await page.evaluate(async () => window.axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']}}));
    check('axe WCAG through 2.2 AA/best-practice: zero violations', axe.violations.length === 0);
    if (process.env.SCREENSHOTS_DIR) {
      fs.mkdirSync(process.env.SCREENSHOTS_DIR, {recursive: true});
      await page.locator('h1').click();
      await page.screenshot({path: path.join(process.env.SCREENSHOTS_DIR, `${width}-${theme}.png`), fullPage: true});
    }
    cases.push({width, theme, clock: 'Native Date.now and real setTimeout, with actual recorded waits; synthetic lifecycle events explicitly labeled', checks, axe: {version: axe.testEngine.version, violations: axe.violations, incomplete: axe.incomplete, passes: axe.passes.map(result => result.id)}, passed: checks.every(item => item.passed)});
    await context.close();
  }

  const check = (name, passed, detail) => integration.push({name, passed: Boolean(passed), ...(detail === undefined ? {} : {detail})});
  const zones = [];
  const fixedTime = new Date('2026-11-20T01:58:58.750Z');
  for (const timezoneId of ['Asia/Ho_Chi_Minh', 'UTC', 'America/Los_Angeles']) {
    const context = await browser.newContext({viewport: {width: 375, height: 900}, timezoneId});
    const page = await context.newPage();
    await page.clock.install({time: fixedTime}); await page.clock.pauseAt(fixedTime);
    await instrument(page); await page.goto(url);
    const sample = await observe(page);
    const display = await page.locator('#event-start').textContent();
    check(`fixed virtual clock under ${timezoneId} gives same 86462 seconds`, sample.total === 86462 && sample.target === Date.parse('2026-11-21T02:00:00Z') && display === '21 November 2026 · 09:00', sample);
    zones.push({timezoneId, ...sample, display});
    await context.close();
  }
  check('three browser timezones are invariant at the same epoch', new Set(zones.map(sample => sample.total)).size === 1 && new Set(zones.map(sample => sample.target)).size === 1, zones);

  const context = await browser.newContext(), page = await context.newPage();
  const target = Date.parse('2026-11-21T02:00:00Z');
  await page.clock.install({time: new Date(target - 1250)}); await page.clock.pauseAt(new Date(target - 1250));
  await instrument(page); await page.goto(url);
  check('browser at 1250ms remaining shows 2 seconds', (await observe(page)).total === 2);
  await page.clock.runFor(249);
  check('browser before 250ms boundary remains at 2', (await observe(page)).total === 2);
  await page.clock.runFor(1);
  check('browser at 1000ms remaining shows 1 second', (await observe(page)).total === 1);
  await page.clock.runFor(999);
  check('browser one millisecond before start still shows 1', (await observe(page)).total === 1 && !(await observe(page)).status.includes('arrived'));
  await page.clock.runFor(1);
  const terminal = await observe(page);
  check('browser exact start shows zero, announces once and stops timer', terminal.total === 0 && terminal.timers === 0 && terminal.status.includes('arrived'), terminal);
  await page.clock.runFor(60000);
  check('browser past event stays at zero without numeric/status churn', (await observe(page)).total === 0 && (await observe(page)).timers === 0 && (await observe(page)).changes === terminal.changes);
  await context.close();

  const delayedContext = await browser.newContext(), delayedPage = await delayedContext.newPage();
  await delayedPage.clock.install({time: new Date(target - 60000)}); await delayedPage.clock.pauseAt(new Date(target - 60000));
  await instrument(delayedPage); await delayedPage.goto(url);
  await delayedPage.clock.fastForward(23750);
  const delayed = await observe(delayedPage);
  check('virtual browser timer clamping recomputes 37s after 23750ms skip', delayed.total === 37 && delayed.timers === 1, delayed);
  await delayedPage.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', {persisted: true})));
  await delayedPage.clock.fastForward(12500);
  await delayedPage.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true})));
  check('restored virtual page immediately accounts for time while paused', (await observe(delayedPage)).total === 24 && (await observe(delayedPage)).timers === 1);
  await delayedPage.evaluate(() => {
    window.__visible = 'hidden';
    Object.defineProperty(document, 'visibilityState', {configurable: true, get: () => window.__visible});
    document.dispatchEvent(new Event('visibilitychange'));
    const nativeNow = Date.now;
    Date.now = () => nativeNow() + 7250;
    window.__visible = 'visible'; document.dispatchEvent(new Event('visibilitychange'));
  });
  check('synthetic visible signal immediately resynchronizes corrected clock', (await observe(delayedPage)).total === 17 && (await observe(delayedPage)).timers === 1 && (await observe(delayedPage)).listeners === 1);
  await delayedContext.close();

  const badContext = await browser.newContext(), badPage = await badContext.newPage();
  await instrument(badPage);
  const badErrors = []; badPage.on('pageerror', error => badErrors.push(error.message));
  for (const value of ['2026-02-30T02:00:00Z', '2026-11-21T02:00:00', 'nonsense']) {
    await badPage.route('**/homework/event-hub/', async route => {
      const response = await route.fetch();
      await route.fulfill({response, body: (await response.text()).replace('datetime="2026-11-21T02:00:00Z"', `datetime="${value}"`)});
    });
    await badPage.goto(url);
    await badPage.waitForFunction(() => document.querySelector('#countdown-status').textContent.includes('unavailable'));
    const sample = await observe(badPage);
    check(`invalid HTML target ${value} gives useful status and no timer`, sample.values.every(text => text === '--') && sample.timers === 0 && sample.status.includes('unavailable'), sample);
    await badPage.locator('#attendee-name').fill('Đặng Hoài An');
    check(`invalid target ${value} leaves unrelated form usable`, await badPage.locator('#attendee-name').inputValue() === 'Đặng Hoài An' && await badPage.locator('#submit-btn').isEnabled());
    await badPage.unroute('**/homework/event-hub/');
  }
  await badPage.goto(url);
  await badPage.waitForFunction(() => /^\d+$/.test(document.querySelector('#seconds').textContent));
  check('corrected HTML target reload recovers without module error', (await observe(badPage)).timers === 1 && badErrors.length === 0 && (await badPage.evaluate(() => window.__violations)).length === 0);
  await badContext.close();

  const noJS = await browser.newContext({javaScriptEnabled: false}), fallback = await noJS.newPage();
  await fallback.goto(url);
  check('JavaScript-disabled fallback shows event time/help and disabled form', (await fallback.locator('#countdown-status').textContent()).includes('Enable JavaScript') && await fallback.locator('#seconds').textContent() === '--' && await fallback.locator('#event-start').getAttribute('datetime') === '2026-11-21T02:00:00Z' && await fallback.locator('#submit-btn').isDisabled());
  await noJS.close();

  const report = {date: new Date().toISOString(), tester: 'Assistant: fresh local browser checks for HW3 Step 2', baseline: '7ac14abdd9be04d2fa80b0ac4b65a5fbf37a8e00', browser: browser.version(), delivery: 'Local HTTP with repository CSP header and page CSP meta', sourceChecks: {files, noInlineScript: !/<script(?![^>]*\bsrc=)[^>]*>/i.test(source)}, cases, integration, passed: cases.every(result => result.passed) && integration.every(item => item.passed), limits: ['Native clock/waits apply only to the four normal cases.', 'Timezone/boundary/clamping checks use Playwright virtual clock; lifecycle and visibility events are synthetic, not actual browser suspension or BFCache navigation.', 'Local assistant checks; no student live defense or Vercel header check.', 'Completed form behavior is checked by the separate final form suites.']};
  fs.writeFileSync(path.join(root, 'verification/final-review/countdown-browser.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({passed: report.passed, browser: report.browser, cases: cases.map(result => ({width: result.width, theme: result.theme, checks: result.checks.length, failures: result.checks.filter(item => !item.passed).map(item => item.name), axeViolations: result.axe.violations.length, axeIncomplete: result.axe.incomplete.length})), integrationChecks: integration.length, integrationFailures: integration.filter(item => !item.passed)}, null, 2));
  if (!report.passed) process.exitCode = 1;
} finally { await browser.close(); server.close(); }
