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
const appDirectory = path.join(root, 'homework/drum-kit');
const headers = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8')).headers[0].headers;
const expected = [
  ['a', 'Kick', 'kick.wav'], ['s', 'Snare', 'snare.wav'], ['d', 'Clap', 'clap.wav'],
  ['f', 'Closed hat', 'hat.wav'], ['g', 'Open hat', 'open-hat.wav'], ['h', 'Low tom', 'tom.wav'],
  ['j', 'Rimshot', 'rim.wav'], ['k', 'Shaker', 'shaker.wav'], ['l', 'Crash', 'crash.wav']
];
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
const url = `http://127.0.0.1:${server.address().port}/homework/drum-kit/`;
const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']});
const cases = [];
try {
  for (const width of [375, 1440]) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({viewport: {width, height: 900}, colorScheme: theme});
    const page = await context.newPage();
    const errors = [], failedResponses = [], audioRequests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400) failedResponses.push({url: response.url(), status: response.status()}); });
    page.on('request', request => { if (request.url().endsWith('.wav')) audioRequests.push(request.url()); });
    await page.addInitScript(() => {
      window.__violations = [];
      document.addEventListener('securitypolicyviolation', event => window.__violations.push(event.effectiveDirective));
    });
    await page.goto(url);
    const checks = [];
    const check = (name, passed, detail) => checks.push({name, passed: Boolean(passed), ...(detail === undefined ? {} : {detail})});
    const dom = await page.evaluate(() => ({
      h1: document.querySelectorAll('h1').length,
      divs: document.querySelectorAll('div').length,
      scripts: document.querySelectorAll('script').length,
      inline: [...document.querySelectorAll('*')].flatMap(element => [...element.attributes].filter(attribute => attribute.name === 'style' || /^on/i.test(attribute.name)).map(attribute => attribute.name)),
      ids: [...document.querySelectorAll('[id]')].map(element => element.id),
      pads: [...document.querySelectorAll('.drum-pad')].map(element => ({tag: element.tagName, type: element.type, key: element.dataset.key, sound: element.dataset.sound, kbd: element.querySelector('kbd')?.textContent, name: element.querySelector('span')?.textContent, ariaLabel: element.getAttribute('aria-label'), absoluteSound: new URL(element.dataset.sound, location.href).href, width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height})),
      overflow: document.documentElement.scrollWidth > innerWidth,
      stylesheet: [...document.styleSheets].map(sheet => sheet.href),
      recorder: {recordDisabled: document.querySelector('#record-btn').disabled, stopDisabled: document.querySelector('#stop-btn').disabled, replayDisabled: document.querySelector('#replay-btn').disabled, clearDisabled: document.querySelector('#clear-btn').disabled, state: document.querySelector('#tape-state').textContent, count: document.querySelector('#beat-count').textContent, listTag: document.querySelector('#beat-list').tagName, hits: document.querySelector('#beat-list').children.length, live: document.querySelector('#record-status').getAttribute('aria-live')},
      padStatus: document.querySelector('#pad-status').getAttribute('aria-live'),
      colors: ['--bg', '--surface', '--soft', '--ink', '--muted', '--accent', '--control-line', '--focus', '--button', '--button-text'].map(name => [name, getComputedStyle(document.documentElement).getPropertyValue(name).trim()])
    }));
    check('one h1, zero divs', dom.h1 === 1 && dom.divs === 0);
    check('no application script or inline handler/style', dom.scripts === 0 && dom.inline.length === 0);
    check('application contains only HTML and CSS', JSON.stringify(files) === JSON.stringify(['index.html', 'styles.css']), files);
    check('nine unique lowercase bindings', dom.pads.length === 9 && new Set(dom.pads.map(pad => pad.key)).size === 9 && dom.pads.every(pad => /^[a-z]$/.test(pad.key)));
    for (const [index, [key, name, file]] of expected.entries()) {
      const pad = dom.pads[index];
      check(`pad ${key}: native button, visible name/key and relative sound`, pad?.tag === 'BUTTON' && pad.type === 'button' && pad.key === key && pad.name === name && pad.kbd === key.toUpperCase() && !pad.ariaLabel && pad.sound === `sounds/${file}` && pad.absoluteSound === new URL(`sounds/${file}`, url).href, pad);
    }
    check('all pad targets at least 44 by 44 CSS pixels', dom.pads.every(pad => pad.width >= 44 && pad.height >= 44));
    check('unique DOM IDs', new Set(dom.ids).size === dom.ids.length);
    check('external local stylesheet loaded', dom.stylesheet.length === 1 && dom.stylesheet[0] === new URL('styles.css', url).href);
    check('recorder initial DOM contract', !dom.recorder.recordDisabled && dom.recorder.stopDisabled && dom.recorder.replayDisabled && dom.recorder.clearDisabled && dom.recorder.state === 'Idle' && dom.recorder.count === '0' && dom.recorder.listTag === 'OL' && dom.recorder.hits === 0 && dom.recorder.live === 'polite', dom.recorder);
    check('polite pad feedback exists', dom.padStatus === 'polite');
    check('no horizontal overflow', !dom.overflow);

    const colors = Object.fromEntries(dom.colors);
    const luminance = color => {
      const components = color.match(/\w\w/g).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
      return .2126 * components[0] + .7152 * components[1] + .0722 * components[2];
    };
    const contrast = (foreground, background) => { const a = luminance(colors[foreground]), b = luminance(colors[background]); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05); };
    const ratios = [['--ink', '--soft', 4.5], ['--muted', '--surface', 4.5], ['--accent', '--bg', 4.5], ['--accent', '--surface', 4.5], ['--button-text', '--button', 4.5], ['--control-line', '--soft', 3], ['--control-line', '--surface', 3], ['--focus', '--surface', 3], ['--focus', '--bg', 3]].map(([foreground, background, minimum]) => ({foreground, background, minimum, ratio: contrast(foreground, background)}));
    check('text, control borders and focus contrast', ratios.every(ratio => ratio.ratio >= ratio.minimum), ratios);
    await page.keyboard.press('Tab');
    check('first Tab reveals skip link', await page.locator('.skip-link').evaluate(element => element === document.activeElement && element.getBoundingClientRect().top >= 0));
    await page.keyboard.press('Enter');
    check('skip link focuses main', await page.locator('main').evaluate(element => element === document.activeElement));
    // Start the independent full Tab sweep on a fresh document without #main.
    // Reload after the skip-link test preserves the fragment/navigation position.
    await page.goto(url + '?keyboard-check=1');
    const selectors = ['.skip-link', '.back-link', ...expected.map(([key]) => `[data-key="${key}"]`), '.help summary', '#record-btn'];
    const keyboard = [];
    for (const selector of selectors) {
      await page.keyboard.press('Tab');
      const state = await page.locator(selector).evaluate(element => ({focused: document.activeElement === element, outline: getComputedStyle(element).outlineStyle, width: getComputedStyle(element).outlineWidth}));
      keyboard.push({direction: 'forward', selector, ...state});
    }
    for (const selector of selectors.slice(0, -1).reverse()) {
      await page.keyboard.press('Shift+Tab');
      const state = await page.locator(selector).evaluate(element => ({focused: document.activeElement === element, outline: getComputedStyle(element).outlineStyle, width: getComputedStyle(element).outlineWidth}));
      keyboard.push({direction: 'reverse', selector, ...state});
    }
    check('forward/reverse Tab order and visible focus', keyboard.every(state => state.focused && state.outline !== 'none' && parseFloat(state.width) >= 3), keyboard);
    await page.locator('.help summary').focus();
    await page.keyboard.press('Enter');
    check('native help opens with Enter without overflow', await page.locator('.help').evaluate(element => element.open && document.documentElement.scrollWidth <= innerWidth));
    await page.keyboard.press('Space');
    check('native help closes with Space', await page.locator('.help').evaluate(element => !element.open));
    await page.emulateMedia({reducedMotion: 'reduce'});
    check('reduced motion disables pad transition', await page.locator('.drum-pad').first().evaluate(element => getComputedStyle(element).transitionDuration === '0s'));
    await page.emulateMedia({reducedMotion: 'no-preference'});
    const normalRuntime = await page.evaluate(() => window.__violations);
    check('normal page has no errors, failed requests, audio requests or CSP violations', errors.length === 0 && failedResponses.length === 0 && audioRequests.length === 0 && normalRuntime.length === 0, {errors, failedResponses, audioRequests, violations: normalRuntime});
    // CDP evaluation injects test instrumentation; the HTML still has no script tag.
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
  const report = {date: new Date().toISOString(), tester: 'Assistant: fresh local Chromium checks for HW2 Step 1', browser: browser.version(), baseline: '005894016998bb031877b873cd3318e2a61a752c', delivery: 'Local HTTP with the repository CSP response header and page CSP meta', sourceChecks: {noScriptTag: !/<script\b/i.test(source), files}, limits: ['Static HTML/CSS only; no audio, keyboard adapter or recorder behavior exists yet.', 'data-sound paths are contract values; WAV files will be supplied in Step 2.', 'Local assistant verification; not a student or Vercel preview check.'], cases, passed: cases.every(result => result.passed)};
  fs.writeFileSync(path.join(root, 'verification/hw2-step1/result.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({passed: report.passed, browser: report.browser, cases: cases.map(result => ({width: result.width, theme: result.theme, checks: result.checks.length, failures: result.checks.filter(check => !check.passed).map(check => check.name), axeViolations: result.axe.violations.length, axeIncomplete: result.axe.incomplete.length}))}, null, 2));
  if (!report.passed) process.exitCode = 1;
} finally { await browser.close(); server.close(); }
