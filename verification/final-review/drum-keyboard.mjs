// Final review copy of verification/hw2-step3/audit.mjs; adaptations documented in prepare.py.
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
const headers = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8')).headers[0].headers;
const mime = {'.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.wav': 'audio/wav'};
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep) && file !== root) {res.writeHead(403).end(); return;}
  try {
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    for (const header of headers) res.setHeader(header.key, header.value);
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  } catch {res.writeHead(404).end();}
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/homework/drum-kit/`;
const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--autoplay-policy=user-gesture-required']});
const cases = [], rebindings = [];
const observe = async page => {
  const errors = [], badResponses = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {if (message.type() === 'error') errors.push(message.text());});
  page.on('response', response => {if (response.status() >= 400) badResponses.push({url: response.url(), status: response.status()});});
  await page.addInitScript(() => {
    window.__voices = []; window.__mediaEvents = []; window.__keys = []; window.__violations = []; window.__unhandled = [];
    window.addEventListener('unhandledrejection', event => window.__unhandled.push(String(event.reason)));
    document.addEventListener('securitypolicyviolation', event => window.__violations.push(event.effectiveDirective));
    window.addEventListener('keydown', event => window.__keys.push({key: event.key, repeat: event.repeat, composing: event.isComposing, ctrl: event.ctrlKey, alt: event.altKey, meta: event.metaKey, shift: event.shiftKey, prevented: event.defaultPrevented, trusted: event.isTrusted, target: event.target.id || event.target.tagName}));
    const NativeAudio = window.Audio;
    window.Audio = function (...args) {
      const voice = new NativeAudio(...args);
      const id = window.__voices.push(voice) - 1;
      for (const type of ['playing', 'ended', 'error']) voice.addEventListener(type, () => window.__mediaEvents.push({id, type, at: performance.now(), source: voice.src, active: window.__voices.filter(item => !item.paused && !item.ended).length}));
      return voice;
    };
    window.Audio.prototype = NativeAudio.prototype;
  });
  return {errors, badResponses};
};
const count = page => page.evaluate(() => window.__voices.length);
const ready = page => page.waitForFunction(() => performance.getEntriesByType('resource').some(item => item.name.endsWith('/keyboard.js')));
const finish = page => page.waitForFunction(() => window.__voices.every(voice => voice.ended || voice.error), undefined, {timeout: 6000});
const started = (page, id) => page.waitForFunction(id => window.__mediaEvents.some(event => event.id === id && event.type === 'playing'), id);
try {
  for (const width of [375, 1440]) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({viewport: {width, height: 900}, colorScheme: theme});
    const page = await context.newPage();
    const runtime = await observe(page);
    const checks = [];
    const check = (name, passed, detail) => checks.push({name, passed: Boolean(passed), ...(detail === undefined ? {} : {detail})});
    await page.goto(url); await ready(page);
    await page.locator('h1').click();
    for (const key of ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l']) {
      for (const upper of [false, true]) {
        const before = await count(page);
        await page.keyboard.press(upper ? `Shift+${key.toUpperCase()}` : key);
        await started(page, before);
        const state = await page.evaluate(() => ({count: window.__voices.length, source: window.__voices.at(-1).src, event: window.__keys.at(-1), native: window.__voices.at(-1) instanceof HTMLAudioElement}));
        const sound = await page.locator(`[data-key="${key}"]`).getAttribute('data-sound');
        check(`${upper ? 'upper' : 'lower'}case ${key} creates exactly one native voice from HTML`, state.count === before + 1 && state.native && state.source === new URL(sound, url).href && state.event.key === (upper ? key.toUpperCase() : key) && state.event.prevented && state.event.trusted, state);
      }
    }
    await finish(page);
    const heldStart = await count(page);
    await page.keyboard.down('a');
    await page.keyboard.down('a');
    await page.keyboard.down('a');
    await page.keyboard.up('a');
    await started(page, heldStart);
    const held = await page.evaluate(() => ({count: window.__voices.length, events: window.__keys.slice(-3)}));
    check('held mapped key: one voice, two real repeat keydowns ignored', held.count === heldStart + 1 && held.events.map(event => event.repeat).join(',') === 'false,true,true' && held.events.every(event => event.trusted), held);
    await page.keyboard.press('a');
    check('release then press creates a new voice', await count(page) === heldStart + 2);
    for (const shortcut of ['q', 'ArrowLeft', 'Escape', 'Control+a', 'Alt+a', 'Meta+a', 'Control+Alt+a']) {
      const before = await count(page);
      await page.keyboard.press(shortcut);
      const event = await page.evaluate(() => window.__keys.at(-1));
      check(`${shortcut}: no voice and no default prevented`, await count(page) === before && !event.prevented, event);
    }
    for (const kind of ['composition', 'already-prevented']) {
      const before = await count(page);
      const dispatched = await page.evaluate(kind => {
        const event = new KeyboardEvent('keydown', {key: 'a', bubbles: true, cancelable: true, isComposing: kind === 'composition'});
        if (kind === 'already-prevented') event.preventDefault();
        document.body.dispatchEvent(event);
        return {prevented: event.defaultPrevented, last: window.__keys.at(-1)};
      }, kind);
      check(`${kind}: synthetic guard event creates no voice`, await count(page) === before && (kind === 'already-prevented' || !dispatched.prevented), dispatched);
    }
    // Temporary native/editable fixtures exercise guards without adding inputs to the app.
    await page.evaluate(() => {
      const fixture = document.createElement('section'); fixture.id = 'qa-editables';
      for (const tag of ['input', 'textarea', 'select']) {
        const element = document.createElement(tag); element.id = `qa-${tag}`; element.setAttribute('aria-label', `Test ${tag}`);
        if (tag === 'select') {
          for (const [value, text] of [['beta', 'Beta'], ['alpha', 'Alpha']]) {const option = document.createElement('option'); option.value = value; option.textContent = text; element.append(option);}
        }
        fixture.append(element);
      }
      const editable = document.createElement('p'); editable.contentEditable = 'true'; editable.setAttribute('aria-label', 'Test editor');
      const nested = document.createElement('span'); nested.id = 'qa-nested-editor'; nested.tabIndex = 0; editable.append(nested); fixture.append(editable);
      const custom = document.createElement('p'); custom.setAttribute('role', 'textbox'); custom.setAttribute('aria-label', 'Test custom textbox');
      const child = document.createElement('span'); child.id = 'qa-custom-editor'; child.tabIndex = 0; child.textContent = 'Custom editor'; custom.append(child); fixture.append(custom);
      document.querySelector('main').append(fixture);
    });
    for (const id of ['qa-input', 'qa-textarea', 'qa-select', 'qa-nested-editor', 'qa-custom-editor']) {
      const before = await count(page);
      await page.locator(`#${id}`).focus();
      await page.keyboard.press('a');
      const state = await page.evaluate(id => ({event: window.__keys.at(-1), value: document.getElementById(id).value ?? document.getElementById(id).parentElement.textContent}), id);
      const inputWorks = id === 'qa-input' || id === 'qa-textarea' ? state.value === 'a' : true;
      check(`${id}: letter preserved for editable/native control`, await count(page) === before && !state.event.prevented && inputWorks, state);
      if (id === 'qa-select') {
        await page.keyboard.press('ArrowDown');
        check('native select ArrowDown changes selection without a hit', await page.locator('#qa-select').inputValue() === 'alpha' && await count(page) === before);
      }
    }
    await page.locator('#qa-editables').evaluate(element => element.remove());
    await finish(page);
    await page.locator('h1').click();
    const overlapStart = await count(page);
    for (const key of ['a', 's', 'a']) await page.keyboard.press(key);
    await started(page, overlapStart + 2);
    const overlap = await page.evaluate(start => ({voices: window.__voices.slice(start).map(voice => ({source: voice.src, paused: voice.paused, ended: voice.ended})), events: window.__mediaEvents.filter(event => event.id >= start && event.type === 'playing')}), overlapStart);
    check('rapid A-S-A uses shared polyphonic activation', overlap.voices.length === 3 && overlap.voices.every(voice => !voice.paused && !voice.ended) && overlap.events.some(event => event.active >= 3), overlap);
    await finish(page);
    await page.locator('[data-key="h"]').focus();
    const nativeStart = await count(page);
    await page.keyboard.press('Enter'); await started(page, nativeStart);
    await page.keyboard.press('Space'); await started(page, nativeStart + 1);
    check('focused pad Enter/Space still produce exactly one click hit each', await count(page) === nativeStart + 2);
    await finish(page);
    await page.locator('.help summary').focus(); await page.keyboard.press('Enter');
    check('Enter still opens native help', await page.locator('.help').evaluate(element => element.open));
    await page.keyboard.press('Space');
    check('Space still closes native help', await page.locator('.help').evaluate(element => !element.open));
    await page.goto(url + '?tab-check=1'); await ready(page);
    const selectors = ['.skip-link', '.back-link', ...['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'].map(key => `[data-key="${key}"]`), '.help summary', '#record-btn'];
    const focus = [];
    for (const selector of selectors) {
      await page.keyboard.press('Tab');
      focus.push({direction: 'forward', selector, ...(await page.locator(selector).evaluate(element => ({focused: element === document.activeElement, outline: getComputedStyle(element).outlineStyle, width: getComputedStyle(element).outlineWidth})))});
    }
    for (const selector of selectors.slice(0, -1).reverse()) {
      await page.keyboard.press('Shift+Tab');
      focus.push({direction: 'reverse', selector, ...(await page.locator(selector).evaluate(element => ({focused: element === document.activeElement, outline: getComputedStyle(element).outlineStyle, width: getComputedStyle(element).outlineWidth})))});
    }
    check('Tab in both directions preserves native order and visible focus', focus.every(state => state.focused && state.outline !== 'none' && parseFloat(state.width) >= 3), focus);
    check('Tab navigation triggers no voices', await count(page) === 0);
    await page.keyboard.press('Enter');
    check('skip link still focuses main', await page.locator('main').evaluate(element => element === document.activeElement));
    await page.locator('#record-btn').click();
    const state = await page.evaluate(() => ({tape: document.querySelector('#tape-state').textContent, hits: document.querySelector('#beat-count').textContent, list: document.querySelector('#beat-list').children.length, h1: document.querySelectorAll('h1').length, divs: document.querySelectorAll('div').length, overflow: document.documentElement.scrollWidth > innerWidth, violations: window.__violations, unhandled: window.__unhandled}));
    check('completed recorder enters Recording; semantic structure and width preserved', state.tape === 'Recording' && state.hits === '0' && state.list === 0 && state.h1 === 1 && state.divs === 0 && !state.overflow, state);
    check('no runtime/network/CSP errors or unhandled rejection', runtime.errors.length === 0 && runtime.badResponses.length === 0 && state.violations.length === 0 && state.unhandled.length === 0, runtime);
    await page.evaluate(axeSource);
    const axe = await page.evaluate(async () => window.axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']}}));
    check('axe has zero violations', axe.violations.length === 0, {violations: axe.violations, incomplete: axe.incomplete});
    cases.push({width, theme, checks, passed: checks.every(item => item.passed)});
    await context.close();
  }

  // Serve a changed HTML response, then reload. Module responses remain byte-identical.
  for (const width of [375, 1440]) {
    const context = await browser.newContext({viewport: {width, height: 900}});
    const page = await context.newPage(); const runtime = await observe(page);
    await page.goto(url); await ready(page);
    const start = performance.now();
    const original = fs.readFileSync(path.join(root, 'homework/drum-kit/index.html'), 'utf8');
    const rebound = original.replace('data-key="a"', 'data-key="q"').replace('<kbd>A</kbd>', '<kbd>Q</kbd>');
    const moduleBodies = {};
    for (const name of ['app.js', 'audio.js', 'keyboard.js']) moduleBodies[name] = fs.readFileSync(path.join(root, 'homework/drum-kit', name), 'utf8');
    await page.route(url, route => route.fulfill({status: 200, contentType: 'text/html', headers: Object.fromEntries(headers.map(header => [header.key, header.value])), body: rebound}));
    await page.reload(); await ready(page); await page.locator('h1').click();
    const observations = [];
    await page.keyboard.press('a'); observations.push({key: 'a', count: await count(page)});
    await page.keyboard.press('q'); await started(page, 0); observations.push({key: 'q', count: await count(page)});
    await page.keyboard.press('Shift+Q'); await started(page, 1); observations.push({key: 'Q', count: await count(page), actualEvent: await page.evaluate(() => window.__keys.at(-1))});
    const sources = await page.evaluate(() => window.__voices.map(voice => voice.src));
    const label = await page.locator('[data-key="q"] kbd').textContent();
    const modulesIdentical = Object.entries(moduleBodies).every(([name, source]) => fs.readFileSync(path.join(root, 'homework/drum-kit', name), 'utf8') === source);
    await page.unroute(url); await page.reload(); await ready(page); await page.locator('h1').click();
    await page.keyboard.press('q'); const restoredQCount = await count(page);
    await page.keyboard.press('a'); await started(page, 0);
    const restoredACount = await count(page);
    const elapsedMs = performance.now() - start;
    rebindings.push({width, method: 'Temporary HTTP HTML response changes only data-key a→q and kbd A→Q; reload unchanged JS, test both cases, restore original HTML and reload', elapsedMs, label, observations, sources, modulesIdentical, restoredQCount, restoredACount, runtime, passed: label === 'Q' && observations.map(item => item.count).join(',') === '0,1,2' && observations[2].actualEvent.key === 'Q' && sources.every(source => source === new URL('sounds/kick.wav', url).href) && modulesIdentical && restoredQCount === 0 && restoredACount === 1 && elapsedMs < 180000 && runtime.errors.length === 0 && runtime.badResponses.length === 0});
    await context.close();
  }
  const report = {date: new Date().toISOString(), tester: 'Assistant: fresh local keyboard adapter checks with native Chromium audio', browser: browser.version(), baseline: '7ac14abdd9be04d2fa80b0ac4b65a5fbf37a8e00', delivery: 'Local HTTP with repository CSP response header and page meta', instrumentation: 'Normal keys are trusted Playwright keyboard input and return real native Audio objects. Composition/default-prevented branch probes and editable fixtures are explicitly test-only.', limits: ['Headless audio does not establish laptop audibility; student reported Preview OK; no raw listening capture was supplied.', 'Automated HTML-response rebinding time is not a timed student/live instructor defense.', 'Recorder behavior is checked by separate final suites.'], cases, rebindings, passed: cases.every(item => item.passed) && rebindings.every(item => item.passed)};
  fs.writeFileSync(path.join(root, 'verification/final-review/drum-keyboard.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({passed: report.passed, cases: cases.map(item => ({width: item.width, theme: item.theme, checks: item.checks.length, failures: item.checks.filter(check => !check.passed).map(check => check.name)})), rebindings: rebindings.map(item => ({width: item.width, elapsedMs: item.elapsedMs, passed: item.passed}))}, null, 2));
  if (!report.passed) process.exitCode = 1;
} finally {await browser.close(); server.close();}
