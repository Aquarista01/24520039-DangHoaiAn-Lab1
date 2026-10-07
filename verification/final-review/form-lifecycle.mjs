// Final review copy of verification/hw3-step5/lifecycle-check.mjs; adaptations documented in prepare.py.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {instrument} from '../hw3-step4/instrument.mjs';

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
const checks = [], check = (name, passed, detail) => checks.push({name, passed: Boolean(passed), ...(detail === undefined ? {} : {detail})});
const context = await browser.newContext({viewport: {width: 375, height: 900}});
const page = await context.newPage(), errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  await page.clock.install({time: new Date('2026-10-07T10:00:00Z')});
  await page.clock.pauseAt(new Date('2026-10-07T10:00:00Z'));
  await instrument(page);
  await page.route('**/app.js', route => route.fulfill({status: 200, contentType: 'text/javascript', body: 'export {};'}));
  await page.goto(url);
  await page.evaluate(async () => {
    const {createRegistration} = await import('/homework/event-hub/registration.js');
    window.__pending = []; window.__mode = 'deferred';
    window.__controller = createRegistration({form: document.querySelector('form'), summary: document.querySelector('#registration-summary'), service: (payload, options) => {
      const request = {payload, options}; window.__pending.push(request);
      if (window.__mode === 'throw') throw new Error('Injected synchronous fault');
      if (window.__mode === 'reject') return Promise.reject(new Error('Injected rejection'));
      if (window.__mode === 'reenter') {window.__reentry = window.__controller.submit(); return Promise.resolve(payload);}
      // Deliberately ignores AbortSignal, to verify the controller's own race/token.
      return new Promise((resolve, reject) => {request.resolve = resolve; request.reject = reject;});
    }});
    window.__start = name => {
      const form = document.querySelector('form');
      for (const [key, value] of Object.entries({name, email: 'an@example.com', interest: 'both', note: 'Sample note'})) form.elements[key].value = value;
      document.querySelector('#simulate-error').checked = false;
      const index = window.__pending.length;
      const run = window.__controller.submit();
      window.__pending[index].run = run;
      return index;
    };
    window.__view = () => ({state: window.__controller.getState(), status: document.querySelector('#registration-status').textContent, name: document.querySelector('#attendee-name').value, receipt: document.querySelector('#receipt-name').textContent, hidden: document.querySelector('#registration-summary').hidden, timers: window.__ownedTimers.size, listeners: window.__formListenerCount(), submitDisabled: document.querySelector('#submit-btn').disabled, resetDisabled: document.querySelector('#reset-btn').disabled, cancelDisabled: document.querySelector('#cancel-btn').disabled, focus: document.activeElement.id});
  });
  check('initial fixture owns six listeners and no request timer', await page.evaluate(() => window.__view().listeners === 6 && window.__view().timers === 0));
  const invalid = await page.evaluate(async () => {
    window.__nested = [];
    const listener = () => window.__nested.push(window.__controller.submit());
    document.querySelector('form').addEventListener('invalid', listener, true);
    const result = await window.__controller.submit();
    document.querySelector('form').removeEventListener('invalid', listener, true);
    return {result, nested: await Promise.all(window.__nested), requests: window.__pending.length, ...window.__view()};
  });
  check('lock precedes native invalid callbacks and rejects reentrant validation', !invalid.result && invalid.nested.length > 0 && invalid.nested.every(value => !value) && invalid.requests === 0 && invalid.state === 'idle', invalid);

  const bypass = await page.evaluate(async () => {
    window.__a = window.__start('Original A');
    const form = document.querySelector('form'), button = document.querySelector('#submit-btn');
    button.disabled = false; form.dataset.state = 'idle';
    button.click(); form.requestSubmit();
    const duplicate = await window.__controller.submit();
    return {duplicate, requests: window.__pending.length, frozen: Object.isFrozen(window.__pending[0].payload), ...window.__view()};
  });
  check('DOM-enabled Submit/false dataset/requestSubmit/direct entry cannot bypass lock', !bypass.duplicate && bypass.requests === 1 && bypass.frozen && bypass.state === 'submitting', bypass);
  const immutable = await page.evaluate(() => {
    document.querySelector('#attendee-name').value = 'Changed DOM'; document.querySelector('#simulate-error').checked = true;
    return {name: window.__pending[0].payload.name, simulation: window.__pending[0].options.simulateError};
  });
  check('pending payload and simulation are immutable entry-time values', immutable.name === 'Original A' && !immutable.simulation, immutable);

  const cancelled = await page.evaluate(async () => {
    const cancel = window.__controller.cancel();
    window.__b = window.__start('New B');
    const oldResult = await window.__pending[window.__a].run;
    return {cancel, oldResult, oldAborted: window.__pending[window.__a].options.signal.aborted, ...window.__view()};
  });
  check('Cancel settles an uncooperative old submit and permits immediate new attempt', cancelled.cancel && !cancelled.oldResult && cancelled.oldAborted && cancelled.state === 'submitting' && cancelled.timers === 1, cancelled);
  await page.evaluate(() => window.__pending[window.__a].resolve({...window.__pending[window.__a].payload, name: 'Obsolete A'}));
  const lateSuccess = await page.evaluate(async () => {await Promise.resolve(); return {duplicate: await window.__controller.submit(), ...window.__view()};});
  check('old success/finally cannot overwrite B or release its lock/deadline', lateSuccess.state === 'submitting' && lateSuccess.hidden && lateSuccess.timers === 1 && !lateSuccess.duplicate, lateSuccess);
  await page.evaluate(async () => {const request = window.__pending[window.__b]; request.resolve(request.payload); await request.run;});
  check('current B succeeds and releases owned deadline', await page.evaluate(() => window.__view().receipt === 'New B' && window.__view().state === 'success' && window.__view().timers === 0));

  await page.evaluate(async () => {
    window.__controller.reset(); window.__c = window.__start('Old C'); window.__controller.cancel(); window.__d = window.__start('New D');
    const request = window.__pending[window.__d]; request.resolve(request.payload); await request.run;
    window.__pending[window.__c].reject(new Error('Obsolete rejection')); await window.__pending[window.__c].run;
  });
  check('late old rejection cannot overwrite later D success', await page.evaluate(() => window.__view().state === 'success' && window.__view().receipt === 'New D' && window.__view().timers === 0));

  const resetPending = await page.evaluate(async () => {
    window.__controller.reset(); window.__e = window.__start('Old E');
    const reset = window.__controller.reset(), cleared = window.__view();
    window.__f = window.__start('New F');
    window.__pending[window.__e].resolve(window.__pending[window.__e].payload);
    await window.__pending[window.__e].run;
    return {reset, cleared, oldAborted: window.__pending[window.__e].options.signal.aborted, ...window.__view()};
  });
  check('programmatic pending Reset aborts/clears old session and protects new F', resetPending.reset && resetPending.cleared.state === 'idle' && resetPending.cleared.name === '' && resetPending.oldAborted && resetPending.state === 'submitting' && resetPending.hidden && resetPending.timers === 1, resetPending);
  await page.evaluate(async () => {const request = window.__pending[window.__f]; request.resolve(request.payload); await request.run; window.__controller.reset();});

  await page.evaluate(async () => {window.__mode = 'throw'; const index = window.__start('Throw'); await window.__pending[index].run;});
  check('synchronous throw releases lock/timer and leaves retryable Error', await page.evaluate(() => window.__view().state === 'error' && window.__view().timers === 0 && !window.__view().submitDisabled));
  await page.evaluate(async () => {window.__mode = 'reject'; const index = window.__start('Reject'); await window.__pending[index].run;});
  check('rejected service releases lock/timer without losing input', await page.evaluate(() => window.__view().state === 'error' && window.__view().name === 'Reject' && window.__view().timers === 0));
  await page.evaluate(async () => {window.__mode = 'reenter'; const index = window.__start('Reentry'); await window.__pending[index].run;});
  check('service synchronous re-entry rejects while original succeeds', await page.evaluate(async () => !(await window.__reentry) && window.__view().state === 'success' && window.__view().receipt === 'Reentry'));

  await page.evaluate(() => {window.__controller.reset(); window.__mode = 'deferred'; window.__timed = window.__start('Timeout'); window.__oldDeadline = window.__timerHistory.at(-1).callback;});
  await page.clock.runFor(4999);
  check('4999ms deadline boundary is still Submitting with one deadline', await page.evaluate(() => window.__view().state === 'submitting' && window.__view().timers === 1));
  await page.clock.runFor(1);
  const timed = await page.evaluate(async () => ({result: await window.__pending[window.__timed].run, aborted: window.__pending[window.__timed].options.signal.aborted, ...window.__view()}));
  check('exact 5000ms aborts, settles and gives preserved retryable timeout Error', !timed.result && timed.aborted && timed.state === 'error' && timed.status.includes('too long') && timed.name === 'Timeout' && timed.timers === 0 && !timed.submitDisabled && timed.focus === 'submit-btn', timed);
  await page.evaluate(() => window.__pending[window.__timed].reject(new Error('Late after timeout')));
  check('late rejection after timeout cannot change timeout message', await page.evaluate(() => window.__view().status.includes('too long') && window.__view().hidden));
  await page.evaluate(() => {window.__retry = window.__start('Timed retry'); window.__oldDeadline();});
  check('stale timeout callback cannot abort the new retry', await page.evaluate(() => window.__view().state === 'submitting' && !window.__pending[window.__retry].options.signal.aborted && window.__view().timers === 1));
  await page.clock.runFor(4999);
  await page.evaluate(async () => {const request = window.__pending[window.__retry]; request.resolve(request.payload); await request.run;});
  check('current response at 4999ms succeeds and clears timeout', await page.evaluate(() => window.__view().state === 'success' && window.__view().receipt === 'Timed retry' && window.__view().timers === 0));

  await page.evaluate(async () => {
    window.__controller.reset(); const index = window.__start('Late success');
    const now = performance.now.bind(performance); performance.now = () => now() + 5000;
    const request = window.__pending[index]; request.resolve(request.payload); await request.run;
    performance.now = now;
  });
  check('elapsed-deadline guard rejects success even before delayed timer dispatch', await page.evaluate(() => window.__view().state === 'error' && window.__view().status.includes('too long') && window.__view().hidden && window.__view().timers === 0));
  await page.evaluate(async () => {
    const index = window.__start('Late error'); const now = performance.now.bind(performance); performance.now = () => now() + 5000;
    const request = window.__pending[index]; request.reject(new Error('Delayed failure')); await request.run; performance.now = now;
  });
  check('elapsed-deadline guard gives timeout for late failure too', await page.evaluate(() => window.__view().state === 'error' && window.__view().status.includes('too long') && window.__view().timers === 0));

  const suspended = await page.evaluate(async () => {
    window.__life = window.__start('Interrupted');
    const first = window.__controller.suspend(), second = window.__controller.suspend();
    return {first, second, result: await window.__pending[window.__life].run, aborted: window.__pending[window.__life].options.signal.aborted, ...window.__view()};
  });
  check('suspend is idempotent and aborts/settles/detaches pending session', suspended.first && !suspended.second && !suspended.result && suspended.aborted && suspended.state === 'error' && suspended.status.includes('interrupted') && suspended.name === 'Interrupted' && suspended.timers === 0 && suspended.listeners === 0 && suspended.submitDisabled, suspended);
  const restored = await page.evaluate(() => ({first: window.__controller.resume(), second: window.__controller.resume(), ...window.__view()}));
  check('resume is idempotent and restores exactly six listeners/Retry', restored.first && !restored.second && restored.listeners === 6 && !restored.submitDisabled && restored.state === 'error', restored);
  await page.evaluate(async () => {
    window.__pending[window.__life].reject(new Error('Old page rejection'));
    const index = window.__start('Restored'); const request = window.__pending[index]; request.resolve(request.payload); await request.run;
  });
  check('restored page retries safely despite old page rejection', await page.evaluate(() => window.__view().state === 'success' && window.__view().receipt === 'Restored' && window.__view().timers === 0));
  const cycles = await page.evaluate(() => {
    const counts = [];
    for (let i = 0; i < 50; i++) {window.__controller.suspend(); counts.push(window.__formListenerCount()); window.__controller.resume(); counts.push(window.__formListenerCount());}
    return {counts, ...window.__view()};
  });
  check('50 suspend/resume cycles preserve success receipt without leaked listeners', cycles.counts.every((count, i) => count === (i % 2 ? 6 : 0)) && cycles.receipt === 'Restored' && !cycles.hidden && cycles.timers === 0, cycles.counts);

  const disposed = await page.evaluate(async () => {
    window.__controller.reset(); window.__disposeIndex = window.__start('Disposed');
    window.__controller.dispose(); window.__controller.dispose();
    return {result: await window.__pending[window.__disposeIndex].run, aborted: window.__pending[window.__disposeIndex].options.signal.aborted, reset: window.__controller.reset(), cancel: window.__controller.cancel(), submit: await window.__controller.submit(), resume: window.__controller.resume(), ...window.__view()};
  });
  check('dispose aborts/settles once and disables all entry paths with no timers/listeners', !disposed.result && disposed.aborted && !disposed.reset && !disposed.cancel && !disposed.submit && !disposed.resume && disposed.timers === 0 && disposed.listeners === 0 && disposed.submitDisabled && disposed.resetDisabled && disposed.cancelDisabled, disposed);
  await page.evaluate(() => window.__pending[window.__disposeIndex].reject(new Error('Late disposed failure')));
  await page.evaluate(async () => {await Promise.resolve(); await Promise.resolve();});
  check('late disposed failure creates no receipt, page error or unhandled rejection', await page.evaluate(() => window.__view().hidden && window.__unhandled.length === 0 && window.__violations.length === 0) && errors.length === 0, errors);

  const report = {date: new Date().toISOString(), tester: 'Assistant: production controller lifecycle contract in Chromium', baseline: '7ac14abdd9be04d2fa80b0ac4b65a5fbf37a8e00', browser: browser.version(), method: 'Playwright virtual timers/performance clock; actual controller with explicitly injected non-cooperating/deferred/throwing/rejected/reentrant transports and synthetic events. Deadline elapsed guards additionally use a labeled performance.now offset before any timer dispatch.', checks, passed: checks.every(item => item.passed), limits: ['Virtual 4999/5000ms advances are not real elapsed waits.', 'No actual BFCache, student or hosted-header check is claimed.', 'Input/hostile-payload checks are recorded separately.']};
  fs.writeFileSync(path.join(root, 'verification/final-review/form-lifecycle.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({passed: report.passed, checks: checks.length, failures: checks.filter(item => !item.passed)}, null, 2));
  if (!report.passed) process.exitCode = 1;
} finally { await context.close(); await browser.close(); server.close(); }
