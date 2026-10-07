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
const cases = [], integrationChecks = [];
const observe = async page => {
  const errors = [], badResponses = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {if (message.type() === 'error') errors.push(message.text());});
  page.on('response', response => {if (response.status() >= 400) badResponses.push({url: response.url(), status: response.status()});});
  await page.addInitScript(() => {
    window.__voices = []; window.__mediaEvents = []; window.__violations = []; window.__unhandled = []; window.__replayOrigin = 0;
    window.addEventListener('unhandledrejection', event => window.__unhandled.push(String(event.reason)));
    document.addEventListener('securitypolicyviolation', event => window.__violations.push(event.effectiveDirective));
    document.addEventListener('click', event => {if (event.target.closest('#replay-btn')) window.__replayOrigin = performance.now();}, true);
    const NativeAudio = window.Audio;
    window.Audio = function (...args) {
      const voice = new NativeAudio(...args);
      const id = window.__voices.push({voice, createdAt: performance.now()}) - 1;
      for (const type of ['playing', 'ended', 'error']) voice.addEventListener(type, () => window.__mediaEvents.push({id, type, at: performance.now(), source: voice.src}));
      return voice;
    };
    window.Audio.prototype = NativeAudio.prototype;
  });
  return {errors, badResponses};
};
const ready = page => page.waitForFunction(() => performance.getEntriesByType('resource').some(item => item.name.endsWith('/recorder.js')));
const count = page => page.evaluate(() => window.__voices.length);
const tape = page => page.evaluate(() => ({state: document.querySelector('.tape-panel').dataset.state, label: document.querySelector('#tape-state').textContent, count: Number(document.querySelector('#beat-count').textContent), beats: [...document.querySelectorAll('#beat-list li')].map(item => ({key: item.dataset.key, at: Number(item.dataset.at), text: item.textContent})), buttons: Object.fromEntries(['record', 'stop', 'replay', 'clear'].map(name => [name, document.getElementById(`${name}-btn`).disabled])), message: document.querySelector('#record-status').textContent, focused: document.activeElement.id}));
const finish = page => page.waitForFunction(() => window.__voices.every(({voice}) => voice.ended || voice.error), undefined, {timeout: 6000});
try {
  for (const width of [375, 1440]) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({viewport: {width, height: 900}, colorScheme: theme});
    const page = await context.newPage(), runtime = await observe(page), checks = [], axeResults = [];
    const check = (name, passed, detail) => checks.push({name, passed: Boolean(passed), ...(detail === undefined ? {} : {detail})});
    await page.goto(url); await ready(page); await page.evaluate(axeSource);
    const auditState = async name => {
      const result = await page.evaluate(async () => ({before: document.querySelector('.tape-panel').dataset.state, axe: await window.axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']}}), after: document.querySelector('.tape-panel').dataset.state}));
      axeResults.push({name, before: result.before, after: result.after, violations: result.axe.violations, incomplete: result.axe.incomplete});
      check(`axe ${name}: zero violations`, result.axe.violations.length === 0);
    };
    const initial = await tape(page);
    check('idle empty tape and initial control states', initial.state === 'idle' && initial.label === 'Idle' && initial.count === 0 && !initial.buttons.record && initial.buttons.stop && initial.buttons.replay && initial.buttons.clear, initial);
    await auditState('initial');
    await page.locator('#record-btn').click();
    await page.waitForTimeout(150); await page.keyboard.press('a');
    await page.waitForTimeout(200); await page.keyboard.press('s');
    await page.waitForTimeout(300); await page.locator('.drum-pad[data-key="a"]').click();
    const recorded = await tape(page);
    check('mixed keyboard/click A-S-A recorded in FIFO arrival order', recorded.state === 'recording' && recorded.count === 3 && recorded.beats.map(beat => beat.key).join(',') === 'a,s,a' && recorded.beats.every((beat, index) => beat.at >= 0 && (!index || beat.at > recorded.beats[index - 1].at)), recorded);
    check('recording locks Record/Replay/Clear and enables Stop', recorded.buttons.record && !recorded.buttons.stop && recorded.buttons.replay && recorded.buttons.clear);
    await auditState('recording');
    await page.locator('#stop-btn').click();
    const stopped = await tape(page);
    check('Stop retains tape and enables idle actions', stopped.state === 'idle' && stopped.count === 3 && !stopped.buttons.record && stopped.buttons.stop && !stopped.buttons.replay && !stopped.buttons.clear && JSON.stringify(stopped.beats) === JSON.stringify(recorded.beats), stopped);
    await auditState('saved'); await finish(page);
    const replayStart = await count(page);
    await page.locator('#replay-btn').click();
    const replaying = await tape(page);
    check('Replay locks mutation controls and makes Stop available', replaying.state === 'replaying' && replaying.buttons.record && !replaying.buttons.stop && replaying.buttons.replay && replaying.buttons.clear && replaying.focused === 'stop-btn', replaying);
    await auditState('replaying');
    await page.waitForFunction(() => document.querySelector('.tape-panel').dataset.state === 'idle');
    const replayed = await page.evaluate(start => ({origin: window.__replayOrigin, voices: window.__voices.slice(start).map(({voice, createdAt}) => ({source: voice.src, createdAt, native: voice instanceof HTMLAudioElement}))}), replayStart);
    const timing = replayed.voices.map((voice, index) => ({key: recorded.beats[index]?.key, expectedMs: recorded.beats[index]?.at, actualMs: voice.createdAt - replayed.origin, errorMs: voice.createdAt - replayed.origin - recorded.beats[index]?.at}));
    check('replay dispatch order and offsets within 100ms tolerance', replayed.voices.length === 3 && replayed.voices.every((voice, index) => voice.native && voice.source === new URL(index === 1 ? 'sounds/snare.wav' : 'sounds/kick.wav', url).href) && timing.every(hit => Math.abs(hit.errorMs) <= 100), timing);
    const afterReplay = await tape(page);
    check('replay does not append hits or alter the queue', afterReplay.count === 3 && JSON.stringify(afterReplay.beats) === JSON.stringify(recorded.beats) && /finished/.test(afterReplay.message));
    await finish(page);

    // A manual live hit during replay sounds, but leaves the saved take untouched.
    const manualStart = await count(page);
    await page.locator('#replay-btn').click(); await page.keyboard.press('h');
    await page.waitForFunction(() => document.querySelector('.tape-panel').dataset.state === 'idle');
    check('manual live hit during replay sounds without recording itself', await count(page) === manualStart + 4 && JSON.stringify((await tape(page)).beats) === JSON.stringify(recorded.beats));
    await finish(page);

    const cancelStart = await count(page);
    await page.locator('#replay-btn').click();
    await page.waitForFunction(start => window.__voices.length > start, cancelStart);
    await page.locator('#stop-btn').click();
    const stoppedCount = await count(page);
    await page.waitForTimeout(recorded.beats.at(-1).at + 150);
    check('Stop replay cancels all remaining callbacks and retains tape', stoppedCount === cancelStart + 1 && await count(page) === stoppedCount && (await tape(page)).state === 'idle' && JSON.stringify((await tape(page)).beats) === JSON.stringify(recorded.beats));
    await page.locator('#clear-btn').click();
    const cleared = await tape(page);
    check('Clear resets count/list and disables empty actions', cleared.count === 0 && cleared.beats.length === 0 && cleared.buttons.replay && cleared.buttons.clear && cleared.focused === 'record-btn', cleared);
    await auditState('cleared');

    await page.locator('#record-btn').focus(); await page.keyboard.press('Enter');
    check('keyboard Record moves focus to enabled Stop', (await tape(page)).state === 'recording' && (await tape(page)).focused === 'stop-btn');
    await page.waitForTimeout(180); await page.keyboard.press('a'); await page.keyboard.press('Enter');
    check('keyboard Stop retains the hit and returns focus to Record', (await tape(page)).state === 'idle' && (await tape(page)).count === 1 && (await tape(page)).focused === 'record-btn');
    await page.keyboard.press('Tab');
    check('Tab reaches Replay, skipping disabled Stop', await page.locator('#replay-btn').evaluate(element => element === document.activeElement));
    await page.keyboard.press('Space');
    check('keyboard Space starts Replay and focuses Stop', (await tape(page)).state === 'replaying' && (await tape(page)).focused === 'stop-btn');
    await page.keyboard.press('Enter');
    await page.locator('#clear-btn').focus(); await page.keyboard.press('Space');
    check('keyboard Clear empties tape and returns focus to Record', (await tape(page)).count === 0 && (await tape(page)).focused === 'record-btn');

    for (let session = 0; session < 5; session++) {
      await page.locator('#record-btn').click(); await page.keyboard.press('s');
      await page.locator('#stop-btn').click(); await page.locator('#clear-btn').click();
    }
    check('five rapid Record/Stop/Clear sessions leave idle empty state', (await tape(page)).state === 'idle' && (await tape(page)).count === 0);
    await finish(page);
    const structure = await page.evaluate(() => ({h1: document.querySelectorAll('h1').length, divs: document.querySelectorAll('div').length, overflow: document.documentElement.scrollWidth > innerWidth, inline: [...document.querySelectorAll('*')].some(element => [...element.attributes].some(attribute => attribute.name === 'style' || /^on/i.test(attribute.name))), violations: window.__violations, unhandled: window.__unhandled, live: document.querySelector('#record-status').getAttribute('aria-live')}));
    check('semantic structure, polite status and no horizontal overflow', structure.h1 === 1 && structure.divs === 0 && !structure.overflow && !structure.inline && structure.live === 'polite', structure);
    check('normal recording/replay has no runtime/network/CSP errors', runtime.errors.length === 0 && runtime.badResponses.length === 0 && structure.violations.length === 0 && structure.unhandled.length === 0, runtime);
    cases.push({width, theme, checks, axeResults, timing, mediaEvents: await page.evaluate(() => window.__mediaEvents), passed: checks.every(item => item.passed)});
    await context.close();
  }

  const context = await browser.newContext({viewport: {width: 375, height: 900}, colorScheme: 'dark'});
  const page = await context.newPage(), runtime = await observe(page);
  await page.goto(url); await ready(page); await page.locator('#record-btn').click();
  await page.evaluate(() => {window.__nativePlay = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () {return window.__nativePlay.call(this).then(() => new Promise(resolve => setTimeout(resolve, 320)));};});
  const immediate = await page.evaluate(async () => {
    const {activatePad} = await import('./app.js');
    window.__resolved = false;
    void activatePad(document.querySelector('.drum-pad[data-key="a"]')).then(() => {window.__resolved = true;});
    return {resolved: window.__resolved, count: Number(document.querySelector('#beat-count').textContent), at: Number(document.querySelector('#beat-list li').dataset.at)};
  });
  await page.waitForFunction(() => window.__resolved);
  integrationChecks.push({name: 'input timestamp/queue precedes a delayed 320ms play promise', method: 'Native play starts normally; only promise resolution is deliberately delayed', immediate, passed: !immediate.resolved && immediate.count === 1 && (await tape(page)).beats[0].at === immediate.at});
  await page.evaluate(() => {HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException('Injected denied playback', 'NotAllowedError'));});
  const failedHit = await page.evaluate(async () => {const {activatePad} = await import('./app.js'); return activatePad(document.querySelector('.drum-pad[data-key="s"]'));});
  integrationChecks.push({name: 'failed audio remains an input-intent hit with separate failure feedback', method: 'Injected play denial; actual native audio was tested in normal cases', passed: failedHit === false && (await tape(page)).beats.map(beat => beat.key).join(',') === 'a,s' && /Playback blocked/.test(await page.locator('#pad-status').textContent())});
  await page.locator('#stop-btn').click(); await page.locator('#clear-btn').click(); await page.locator('#record-btn').click();
  await page.evaluate(async () => {const {activatePad} = await import('./app.js'); for (let hit = 0; hit < 257; hit++) void activatePad(document.querySelector('.drum-pad[data-key="a"]'));});
  const capped = await tape(page);
  integrationChecks.push({name: 'UI retains exactly 256 input hits, auto-stops and ignores hit 257', method: 'Injected denied audio avoids a 257-voice playback stress test; exercises real activation/recorder/DOM', passed: capped.count === 256 && capped.beats.length === 256 && capped.state === 'idle' && /256-hit/.test(capped.message), count: capped.count, state: capped.state});
  await page.locator('#beat-list').focus(); await page.keyboard.press('End');
  await page.waitForFunction(() => document.querySelector('#beat-list').scrollTop > 0, undefined, {timeout: 1500});
  const scroll = await page.locator('#beat-list').evaluate(element => ({scrollTop: element.scrollTop, height: element.clientHeight, total: element.scrollHeight, focused: document.activeElement === element}));
  integrationChecks.push({name: 'populated capped list is bounded and keyboard-scrollable at 375px', passed: scroll.focused && scroll.total > scroll.height && scroll.scrollTop > 0 && await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), scroll});
  await page.evaluate(axeSource);
  const axe = await page.evaluate(async () => window.axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']}}));
  integrationChecks.push({name: 'capped-list axe and error handling', passed: axe.violations.length === 0 && runtime.errors.length === 0 && await page.evaluate(() => window.__unhandled.length === 0 && window.__violations.length === 0), violations: axe.violations, runtime});
  if (process.env.SCREENSHOTS_DIR) {fs.mkdirSync(process.env.SCREENSHOTS_DIR, {recursive: true}); await page.screenshot({path: path.join(process.env.SCREENSHOTS_DIR, '375-dark-cap.png'), fullPage: true});}
  await page.evaluate(() => {HTMLMediaElement.prototype.play = window.__nativePlay;});
  await page.reload(); await ready(page);
  integrationChecks.push({name: 'reload starts a fresh in-memory session', passed: (await tape(page)).count === 0 && (await tape(page)).state === 'idle'});
  if (process.env.SCREENSHOTS_DIR) await page.screenshot({path: path.join(process.env.SCREENSHOTS_DIR, '375-dark-empty.png'), fullPage: true});
  await context.close();

  const report = {date: new Date().toISOString(), tester: 'Assistant: fresh local native Chromium recorder integration', browser: browser.version(), baseline: '18fc999ddeccb695c521e33a89287fd063e1446e', timingToleranceMs: 100, timingMethod: 'Compare native Audio constructor dispatch times to recorded input offsets from the trusted Replay click; audio output/decoding latency is not measured as beat timing', limits: ['Normal native playback is observed, not mocked; delayed/denied integration cases are labeled.', '120-second and stale-callback boundaries use the separate deterministic virtual-clock model checks.', 'Student reported prior Preview checks OK; no student recorder test or timed live defense is claimed.'], cases, integrationChecks, passed: cases.every(item => item.passed) && integrationChecks.every(item => item.passed)};
  fs.writeFileSync(path.join(root, 'verification/hw2-step4/result.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({passed: report.passed, cases: cases.map(item => ({width: item.width, theme: item.theme, checks: item.checks.length, failures: item.checks.filter(check => !check.passed).map(check => check.name)})), integrationChecks: integrationChecks.map(item => ({name: item.name, passed: item.passed}))}, null, 2));
  if (!report.passed) process.exitCode = 1;
} finally {await browser.close(); server.close();}
