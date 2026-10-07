import fs from 'node:fs';
import path from 'node:path';
import {browser, url, root, axeSource, close} from '../hw3-step5/browser-fixture.mjs';
const base = new URL('/', url).href;
const cases = [];
const snapshots = async page => page.evaluate(() => ({
  h1: document.querySelectorAll('h1').length, divs: document.querySelectorAll('div').length,
  duplicateIds: [...document.querySelectorAll('[id]')].map(e => e.id).filter((id, i, all) => all.indexOf(id) !== i),
  overflow: document.documentElement.scrollWidth > innerWidth,
  unsafe: [...document.querySelectorAll('*')].some(e => [...e.attributes].some(a => a.name === 'style' || /^on/i.test(a.name))),
  css: [...document.querySelectorAll('link[rel="stylesheet"]')].map(e => e.href),
  scripts: [...document.scripts].map(e => ({url: e.src, type: e.type})),
  focus: document.activeElement.tagName + ':' + document.activeElement.textContent.trim(),
  csp: window.__csp || [], unhandled: window.__unhandled || []
}));
const tabTo = async (page, selector, max = 50) => {
  const trace = [];
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    const observed = await page.evaluate(selector => {
      const element = document.activeElement, style = getComputedStyle(element);
      return {text: element.textContent.trim(), tag: element.tagName, href: element.getAttribute('href'), target: element.matches(selector), outline: style.outlineStyle, width: style.outlineWidth};
    }, selector);
    trace.push(observed);
    if (observed.target) return {found: true, visibleFocus: observed.outline !== 'none' && parseFloat(observed.width) >= 3, trace};
  }
  return {found: false, trace};
};
try {
  for (const width of [375, 1440]) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({viewport: {width, height: 900}, colorScheme: theme});
    const page = await context.newPage(), checks = [], audits = [], errors = [], failures = [], requests = [], popups = [];
    const check = (name, passed, detail) => checks.push({name, passed: Boolean(passed), ...(detail === undefined ? {} : {detail})});
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
    page.on('response', r => {if (r.status() >= 400) failures.push({url: r.url(), status: r.status()});});
    page.on('requestfailed', r => failures.push({url: r.url(), error: r.failure()?.errorText}));
    page.on('request', r => requests.push({url: r.url(), type: r.resourceType()}));
    page.on('popup', p => popups.push(p.url()));
    await page.addInitScript(() => {
      window.__csp = []; window.__unhandled = [];
      document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.effectiveDirective));
      window.addEventListener('unhandledrejection', e => window.__unhandled.push(String(e.reason)));
    });
    const audit = async name => {
      await page.evaluate(axeSource);
      const result = await page.evaluate(async () => window.axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']}}));
      audits.push({name, version: result.testEngine.version, violations: result.violations, incomplete: result.incomplete});
      check(`${name}: axe zero violations`, result.violations.length === 0);
    };
    const response = await page.goto(base);
    await page.waitForFunction(() => document.querySelector('#event-status').textContent.includes('3 upcoming events'));
    check('portfolio response 200 with expected CSP header', response.status() === 200 && response.headers()['content-security-policy'].includes("script-src 'self'") && response.headers()['content-security-policy'].includes("frame-ancestors 'none'"));
    let state = await snapshots(page);
    check('portfolio structure: one h1, no div/duplicate IDs/inline code/overflow', state.h1 === 1 && state.divs === 0 && !state.duplicateIds.length && !state.unsafe && !state.overflow, state);
    check('Homework nav/region and visible HW1 identity exist once', await page.evaluate(() => document.querySelectorAll('nav a[href="#homework"]').length === 1 && document.querySelector('#homework').getAttribute('aria-labelledby') === 'homework-heading' && document.querySelector('#homework p:last-child').textContent.includes('HW1')));
    check('two relative homework links stay in the same tab', await page.evaluate(() => [...document.querySelectorAll('#homework .card-footer a')].map(e => e.getAttribute('href')).join('|') === 'homework/drum-kit/|homework/event-hub/' && [...document.querySelectorAll('#homework a')].every(e => !e.target)));
    await audit('portfolio');
    if (process.env.SCREENSHOTS_DIR) {
      fs.mkdirSync(process.env.SCREENSHOTS_DIR, {recursive: true});
      await page.locator('#homework').screenshot({path: path.join(process.env.SCREENSHOTS_DIR, `${width}-${theme}-homework.png`)});
    }
    const nav = await tabTo(page, 'nav a[href="#homework"]');
    check('native Tab reaches Homework nav with visible focus', nav.found && nav.visibleFocus, nav);
    await page.keyboard.press('Enter');
    check('Enter activates native Homework hash', new URL(page.url()).hash === '#homework');
    await page.keyboard.press('Tab');
    check('Tab after anchor jump reaches first homework card link', await page.locator('#homework a[href="homework/drum-kit/"]').evaluate(e => e === document.activeElement));
    await page.keyboard.press('Enter'); await page.waitForURL('**/homework/drum-kit/');
    await page.waitForFunction(() => document.querySelector('#tape-state')?.textContent === 'Idle');
    state = await snapshots(page);
    check('HW2 loads its independent page and source module', state.scripts.length === 1 && state.scripts[0].url.endsWith('/homework/drum-kit/app.js') && await page.locator('.drum-pad').count() === 9 && !await page.locator('#record-btn').isDisabled(), state);
    check('HW2 initial layout/CSP/semantic constraints', state.h1 === 1 && state.divs === 0 && !state.overflow && !state.duplicateIds.length && !state.csp.length && !state.unsafe);
    await audit('drum-initial');
    const drumBack = await tabTo(page, '.back-link');
    check('HW2 native Tab reaches back link with visible focus', drumBack.found && drumBack.visibleFocus, drumBack);
    await page.keyboard.press('Enter'); await page.waitForURL('**/index.html');
    await page.waitForFunction(() => document.querySelector('#event-status').textContent.includes('3 upcoming events'));
    check('HW2 back link restores portfolio Homework section', await page.locator('#homework').count() === 1 && !await page.locator('#theme-toggle').isDisabled());
    const workshop = await tabTo(page, '#homework a[href="homework/event-hub/"]');
    check('native Tab reaches workshop card with visible focus', workshop.found && workshop.visibleFocus, workshop);
    await page.keyboard.press('Enter'); await page.waitForURL('**/homework/event-hub/');
    await page.waitForFunction(() => document.querySelector('#seconds')?.textContent.match(/^\d+$/) && !document.querySelector('#submit-btn').disabled);
    state = await snapshots(page);
    check('HW3 loads its independent module/countdown/Idle form', state.scripts.length === 1 && state.scripts[0].url.endsWith('/homework/event-hub/app.js') && await page.locator('#registration-form').getAttribute('data-state') === 'idle', state);
    check('HW3 initial layout/CSP/semantic constraints', state.h1 === 1 && state.divs === 0 && !state.overflow && !state.duplicateIds.length && !state.csp.length && !state.unsafe);
    await audit('workshop-initial');
    const eventBack = await tabTo(page, '.back-link');
    check('HW3 native Tab reaches back link with visible focus', eventBack.found && eventBack.visibleFocus, eventBack);
    await page.keyboard.press('Enter'); await page.waitForURL('**/index.html');
    check('HW3 back link restores portfolio', await page.locator('#homework').count() === 1 && await page.locator('h1').count() === 1);
    check('round trip opens no popup and uses only same-origin asset requests', popups.length === 0 && requests.every(r => r.url.startsWith(base)), requests);
    check('round trip has no failed response/request/runtime/CSP/unhandled', errors.length === 0 && failures.length === 0 && !(await snapshots(page)).csp.length && !(await snapshots(page)).unhandled.length, {errors, failures});
    cases.push({width, theme, mode: 'native JavaScript', checks, audits, passed: checks.every(c => c.passed)});
    await context.close();
  }
  const context = await browser.newContext({viewport: {width: 375, height: 900}, javaScriptEnabled: false});
  const page = await context.newPage(), checks = [];
  const check = (name, passed) => checks.push({name, passed: Boolean(passed)});
  await page.goto(base);
  check('no-JS portfolio Homework links remain visible', await page.locator('#homework a').count() === 2 && await page.locator('#homework').isVisible());
  await page.locator('#homework a[href="homework/drum-kit/"]').click(); await page.waitForURL('**/homework/drum-kit/');
  check('no-JS native link opens HW2 semantic page', await page.locator('h1').textContent() === 'Find your rhythm.');
  await page.locator('.back-link').click(); await page.waitForURL('**/index.html');
  check('no-JS HW2 back link returns portfolio', await page.locator('#homework').count() === 1);
  await page.locator('#homework a[href="homework/event-hub/"]').click(); await page.waitForURL('**/homework/event-hub/');
  check('no-JS HW3 native link exposes safe fallback', await page.locator('#submit-btn').isDisabled() && (await page.locator('#registration-status').textContent()).includes('Enable JavaScript'));
  await page.locator('.back-link').click(); await page.waitForURL('**/index.html');
  check('no-JS HW3 back link returns portfolio', await page.locator('#homework').count() === 1 && !await page.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  cases.push({width: 375, theme: 'light', mode: 'JavaScript disabled', checks, audits: [], passed: checks.every(c => c.passed)});
  await context.close();
  const report = {date: new Date().toISOString(), tester: 'Assistant: fresh local native navigation/initialization checks', baseline: 'b470cccf7826da1fe7e16ec9338ce73387060d85', browser: browser.version(), method: 'Actual pages under repository CSP; trusted Tab/Enter for both links/back links in four configurations; separate JS-disabled click round trip. No injected transport or virtual clock.', cases, passed: cases.every(c => c.passed), limits: ['Navigation and initial state only, not a full drum/audio/recorder/registration regression.', 'No fresh Lighthouse, hosted-header, student laptop/listening or live-defense result.', 'Root axe incomplete icon/glyph items remain explicit, not a full WCAG certification.']};
  fs.writeFileSync(path.join(root, 'verification/homework-navigation/result.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({passed: report.passed, checks: cases.reduce((s,c) => s+c.checks.length,0), audits: cases.reduce((s,c) => s+c.audits.length,0), failures: cases.flatMap(c => c.checks.filter(x => !x.passed).map(x => ({width: c.width, theme: c.theme, ...x})))}, null, 2));
  if (!report.passed) process.exitCode = 1;
} finally {await close();}
