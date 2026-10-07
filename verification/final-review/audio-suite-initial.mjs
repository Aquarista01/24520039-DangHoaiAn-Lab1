// Final review copy of verification/hw2-step2/audit.mjs; adaptations documented in prepare.py.
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
const cases = [], failureCases = [];
const observe = async page => {
  const errors = [], consoleErrors = [], badResponses = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {if (message.type() === 'error') consoleErrors.push(message.text());});
  page.on('response', response => {if (response.status() >= 400) badResponses.push({url: response.url(), status: response.status()});});
  await page.addInitScript(() => {
    window.__voices = []; window.__events = []; window.__violations = []; window.__unhandled = [];
    window.addEventListener('unhandledrejection', event => window.__unhandled.push(String(event.reason)));
    document.addEventListener('securitypolicyviolation', event => window.__violations.push(event.effectiveDirective));
    const NativeAudio = window.Audio;
    window.Audio = function (...args) {
      const voice = new NativeAudio(...args);
      const id = window.__voices.push(voice) - 1;
      for (const type of ['playing', 'ended', 'error']) voice.addEventListener(type, () => window.__events.push({id, type, at: performance.now(), source: voice.src, active: window.__voices.filter(item => !item.paused && !item.ended).length}));
      return voice;
    };
    window.Audio.prototype = NativeAudio.prototype;
  });
  return {errors, consoleErrors, badResponses};
};
const voices = page => page.evaluate(() => window.__voices.map(voice => ({source: voice.src, paused: voice.paused, ended: voice.ended, currentTime: voice.currentTime, duration: voice.duration, readyState: voice.readyState, native: voice instanceof HTMLAudioElement})));
const finish = async page => {
  await page.waitForFunction(() => window.__voices.every(voice => voice.ended || voice.error), undefined, {timeout: 6000});
};
const rapidClick = async (page, keys) => {
  // Locator.click waits for the pad's transient transform to become stable.
  // Mouse clicks at each pad's center deliver real trusted hits without that delay.
  const centers = [];
  for (const key of keys) {
    const box = await page.locator(`[data-key="${key}"]`).boundingBox();
    centers.push({x: box.x + box.width / 2, y: box.y + box.height / 2});
  }
  for (const center of centers) await page.mouse.click(center.x, center.y);
};
try {
  for (const width of [375, 1440]) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({viewport: {width, height: 900}, colorScheme: theme});
    const page = await context.newPage();
    const runtime = await observe(page);
    const checks = [];
    const check = (name, passed, detail) => checks.push({name, passed: Boolean(passed), ...(detail === undefined ? {} : {detail})});
    await page.goto(url);
    await page.waitForFunction(() => performance.getEntriesByType('resource').some(item => item.name.endsWith('/audio.js')));
    const decoded = await page.evaluate(async () => {
      const audio = new AudioContext();
      try {
        const results = [];
        for (const pad of document.querySelectorAll('.drum-pad')) {
          const response = await fetch(pad.dataset.sound);
          const buffer = await audio.decodeAudioData(await response.arrayBuffer());
          results.push({key: pad.dataset.key, source: pad.dataset.sound, status: response.status, channels: buffer.numberOfChannels, duration: buffer.duration, sampleRate: buffer.sampleRate, nonzero: buffer.getChannelData(0).some(value => value !== 0)});
        }
        return results;
      } finally {await audio.close();}
    });
    check('nine WAV files load and decode in Chromium', decoded.length === 9 && decoded.every(item => item.status === 200 && item.channels === 1 && item.duration > .05 && item.nonzero), decoded);
    for (const key of ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l']) {
      const before = await page.evaluate(() => window.__voices.length);
      const pad = page.locator(`[data-key="${key}"]`);
      const name = await pad.locator('span').textContent();
      await pad.click();
      await page.waitForFunction(expected => document.querySelector('#pad-status').textContent === expected, `Playing ${name}.`);
      const created = await voices(page);
      check(`click ${key} starts a new native Audio with its HTML path`, created.length === before + 1 && created.at(-1).native && created.at(-1).source === new URL(await pad.getAttribute('data-sound'), url).href && await page.evaluate(id => window.__events.some(event => event.id === id && event.type === 'playing'), before), created.at(-1));
    }
    await finish(page);
    const sameStart = await page.evaluate(() => window.__voices.length);
    await rapidClick(page, ['a', 'a', 'a']);
    await page.waitForFunction(start => window.__events.filter(event => event.id >= start && event.type === 'playing').length === 3, sameStart);
    const same = (await voices(page)).slice(sameStart);
    const sameEvents = await page.evaluate(start => window.__events.filter(event => event.id >= start && event.type === 'playing'), sameStart);
    check('three repeated Kick hits overlap as distinct voices', same.length === 3 && same.every(voice => !voice.paused && !voice.ended && voice.native) && sameEvents.some(event => event.active >= 3), {voices: same, playingEvents: sameEvents});
    await finish(page);
    const mixedStart = await page.evaluate(() => window.__voices.length);
    await rapidClick(page, ['l', 's', 'h']);
    await page.waitForFunction(start => window.__events.filter(event => event.id >= start && event.type === 'playing').length === 3, mixedStart);
    const mixed = (await voices(page)).slice(mixedStart);
    check('Crash, Snare and Low tom overlap', mixed.length === 3 && new Set(mixed.map(voice => voice.source)).size === 3 && mixed.every(voice => !voice.paused && !voice.ended), mixed);
    await finish(page);
    const endState = await voices(page);
    check('all normal voices finish naturally', endState.every(voice => voice.ended && voice.paused && voice.currentTime > 0));
    check('transient visual feedback clears', await page.locator('.is-hit').count() === 0);
    const direct = await page.evaluate(async () => {
      const {playPad} = await import('./audio.js');
      const pad = document.querySelector('[data-key="a"]');
      const original = pad.dataset.sound;
      try {
        pad.dataset.sound = 'sounds/snare.wav';
        const result = await playPad(pad);
        return {result, source: window.__voices.at(-1).src, count: window.__voices.length};
      } finally {pad.dataset.sound = original;}
    });
    check('independent playPad resolves true and reads the current DOM sound path', direct.result === true && direct.count === endState.length + 1 && direct.source === new URL('sounds/snare.wav', url).href, direct);
    await finish(page);
    const keyStart = direct.count;
    await page.locator('h1').click();
    await page.keyboard.press('a');
    check('letter key has no adapter at this stage', await page.evaluate(() => window.__voices.length) === keyStart);
    await page.locator('[data-key="a"]').focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(start => window.__voices.length === start + 1, keyStart);
    await page.keyboard.press('Space');
    await page.waitForFunction(start => window.__voices.length === start + 2, keyStart);
    check('native focused button Enter/Space activates click adapter', (await voices(page)).slice(keyStart).length === 2);
    await finish(page);
    await page.locator('#record-btn').click();
    check('recorder contract remains static', await page.evaluate(() => document.querySelector('#tape-state').textContent === 'Idle' && document.querySelector('#beat-count').textContent === '0' && document.querySelector('#beat-list').children.length === 0 && ['stop-btn', 'replay-btn', 'clear-btn'].every(id => document.getElementById(id).disabled)));
    const structure = await page.evaluate(() => ({h1: document.querySelectorAll('h1').length, divs: document.querySelectorAll('div').length, overflow: document.documentElement.scrollWidth > innerWidth, scripts: [...document.scripts].map(script => ({type: script.type, src: script.getAttribute('src'), text: script.textContent})), inline: [...document.querySelectorAll('*')].some(element => [...element.attributes].some(attribute => attribute.name === 'style' || /^on/i.test(attribute.name))), live: document.querySelector('#pad-status').getAttribute('aria-live'), violations: window.__violations, unhandled: window.__unhandled}));
    check('semantic structure, local external module and no overflow', structure.h1 === 1 && structure.divs === 0 && !structure.overflow && !structure.inline && structure.scripts.length === 1 && structure.scripts[0].type === 'module' && structure.scripts[0].src === 'app.js' && structure.scripts[0].text === '' && structure.live === 'polite', structure);
    check('normal playback has no runtime errors, HTTP failures or CSP violations', runtime.errors.length === 0 && runtime.consoleErrors.length === 0 && runtime.badResponses.length === 0 && structure.violations.length === 0 && structure.unhandled.length === 0, runtime);
    await page.evaluate(axeSource);
    const axe = await page.evaluate(async () => window.axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']}}));
    check('zero axe violations after playback', axe.violations.length === 0, {violations: axe.violations, incomplete: axe.incomplete});
    cases.push({width, theme, checks, mediaEvents: await page.evaluate(() => window.__events), passed: checks.every(item => item.passed)});
    await context.close();
  }

  for (const kind of ['denied', 'missing', 'corrupt', 'constructor', 'missing-contract', 'late-error']) {
    const context = await browser.newContext({viewport: {width: 375, height: 900}});
    const page = await context.newPage();
    const runtime = await observe(page);
    await page.goto(url);
    await page.waitForFunction(() => performance.getEntriesByType('resource').some(item => item.name.endsWith('/audio.js')));
    const pad = page.locator('[data-key="a"]');
    if (kind === 'denied') await page.evaluate(() => {window.__nativePlay = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException('Injected policy denial', 'NotAllowedError'));});
    if (kind === 'missing') await pad.evaluate(element => {element.dataset.sound = 'sounds/absent.wav';});
    if (kind === 'corrupt') await page.route('**/sounds/kick.wav', route => route.fulfill({status: 200, contentType: 'audio/wav', body: 'invalid wav data'}));
    if (kind === 'constructor') await page.evaluate(() => {window.__observedAudio = window.Audio; window.Audio = function () {throw new Error('Injected constructor failure');};});
    if (kind === 'missing-contract') await pad.evaluate(element => {delete element.dataset.sound;});
    if (kind === 'late-error') {
      await pad.click();
      await page.waitForFunction(() => document.querySelector('#pad-status').textContent === 'Playing Kick.');
      // Exercise the explicit post-start error-event branch; this is injected, not a natural network failure.
      await page.evaluate(() => window.__voices.at(-1).dispatchEvent(new Event('error')));
    } else await pad.click();
    await page.waitForFunction(() => /Playback blocked|Could not play/.test(document.querySelector('#pad-status').textContent));
    const failure = await page.evaluate(() => ({status: document.querySelector('#pad-status').textContent, live: document.querySelector('#pad-status').getAttribute('aria-live'), unhandled: window.__unhandled, violations: window.__violations}));
    // Also verify the independent engine's boolean result for failures before playback starts.
    const result = kind === 'late-error' ? null : await page.evaluate(async () => {const {playPad} = await import('./audio.js'); return playPad(document.querySelector('[data-key="a"]'));});
    if (kind === 'denied') await page.evaluate(() => {HTMLMediaElement.prototype.play = window.__nativePlay;});
    if (kind === 'constructor') await page.evaluate(() => {window.Audio = window.__observedAudio;});
    if (kind === 'corrupt') await page.unroute('**/sounds/kick.wav');
    await pad.evaluate(element => {element.dataset.sound = 'sounds/kick.wav';});
    await pad.click();
    await page.waitForFunction(() => document.querySelector('#pad-status').textContent === 'Playing Kick.');
    const recovery = await page.evaluate(() => ({unhandled: window.__unhandled, violations: window.__violations, status: document.querySelector('#pad-status').textContent}));
    failureCases.push({kind, method: ['denied', 'constructor', 'late-error'].includes(kind) ? 'Injected failure branch; real native playback restored for recovery' : kind === 'corrupt' ? 'HTTP route returns invalid WAV; native decoder rejects' : kind === 'missing' ? 'Real missing-file HTTP 404' : 'DOM contract field removed', result, failure, recovery, runtime, passed: failure.live === 'polite' && /Playback blocked|Could not play/.test(failure.status) && (kind === 'late-error' || result === false) && failure.unhandled.length === 0 && recovery.unhandled.length === 0 && recovery.violations.length === 0 && runtime.errors.length === 0 && recovery.status === 'Playing Kick.'});
    await context.close();
  }
  const report = {date: new Date().toISOString(), tester: 'Assistant: fresh local native Chromium audio and fault checks', browser: browser.version(), baseline: '7ac14abdd9be04d2fa80b0ac4b65a5fbf37a8e00', delivery: 'Local HTTP with enforced repository CSP header and page meta', instrumentation: 'Constructor observer returns real native HTMLAudioElement objects. Normal play/decode is not mocked. Fault injection is labeled separately.', limits: ['Headless playback events/decoded signal do not prove audibility on student speakers; student reported Preview OK; no raw listening capture was supplied.', 'Keyboard and recorder behavior are checked by separate final suites.'], cases, failureCases, passed: cases.every(item => item.passed) && failureCases.every(item => item.passed)};
  fs.writeFileSync(path.join(root, 'verification/final-review/audio-browser.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({passed: report.passed, cases: cases.map(item => ({width: item.width, theme: item.theme, checks: item.checks.length, failures: item.checks.filter(check => !check.passed).map(check => check.name)})), failureCases: failureCases.map(item => ({kind: item.kind, passed: item.passed, result: item.result, failure: item.failure.status}))}, null, 2));
  if (!report.passed) process.exitCode = 1;
} finally {await browser.close(); server.close();}
