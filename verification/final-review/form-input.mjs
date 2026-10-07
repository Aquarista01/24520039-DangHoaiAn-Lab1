// Final review copy of verification/hw3-step5/browser-check.mjs; adaptations documented in prepare.py.
import fs from 'node:fs';
import path from 'node:path';
import {browser, url, root, axeSource, close} from '../hw3-step5/browser-fixture.mjs';
const checks = [], audits = [];
const check = (name, passed, detail) => checks.push({name, passed: Boolean(passed), ...(detail === undefined ? {} : {detail})});
const hostile = [
  '<img src=x onerror="window.__xss++">',
  '<svg onload="window.__xss++"></svg>',
  '<script>window.__xss++</script>',
  '"><button onclick="window.__xss++">Click</button>',
  '<a href="javascript:window.__xss++">Link</a>',
  '&lt;img&gt; & " \' < >'
];
const wait = (page, state) => page.waitForFunction(expected => document.querySelector('form').dataset.state === expected, state);
const fill = async (page, values = {}) => {
  const data = {name: 'Đặng Hoài An', email: 'An@example.com', interest: 'both', note: '', ...values};
  for (const key of ['name', 'email', 'note']) await page.locator(`#attendee-${key}`).fill(data[key]);
  await page.locator('#attendee-interest').selectOption(data.interest);
};
const view = page => page.evaluate(() => ({
  state: document.querySelector('form').dataset.state, focus: document.activeElement.id,
  errors: [...document.querySelectorAll('.field-error')].map(e => e.textContent),
  receipt: ['name', 'email', 'interest', 'note'].map(key => document.getElementById(`receipt-${key}`).textContent),
  hidden: document.querySelector('#registration-summary').hidden,
  unsafeNodes: document.querySelectorAll('#registration-summary img, #registration-summary svg, #registration-summary script, #registration-summary a, #registration-summary button').length,
  descendants: [...document.querySelectorAll('#registration-summary dd')].reduce((sum, e) => sum + e.children.length, 0),
  overflow: document.documentElement.scrollWidth > innerWidth,
  xss: window.__xss, unhandled: window.__unhandled, csp: window.__csp,
  status: document.querySelector('#registration-status').textContent
}));
try {
  for (const width of [375, 1440]) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({viewport: {width, height: 900}, colorScheme: theme});
    const page = await context.newPage(), errors = [], dialogs = [], requests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', async dialog => {dialogs.push(dialog.message()); await dialog.dismiss();});
    page.on('request', request => requests.push({url: request.url(), method: request.method(), type: request.resourceType()}));
    await page.addInitScript(() => {
      window.__xss = 0; window.__unhandled = []; window.__csp = [];
      window.addEventListener('unhandledrejection', e => window.__unhandled.push(String(e.reason)));
      document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.effectiveDirective));
    });
    await page.goto(url); await page.waitForFunction(() => !document.querySelector('#submit-btn').disabled);
    const beforeURL = page.url();
    const beforeStorage = await page.evaluate(() => JSON.stringify([{...localStorage}, {...sessionStorage}]));
    const label = `${width}-${theme}`;
    await page.evaluate(axeSource);
    const audit = async state => {
      const result = await page.evaluate(async () => window.axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']}}));
      audits.push({viewport: label, state, version: result.testEngine.version, violations: result.violations, incomplete: result.incomplete});
      check(`${label}: ${state} axe zero violations/incomplete`, result.violations.length === 0 && result.incomplete.length === 0);
    };
    await fill(page, {name: '   '}); await page.locator('#submit-btn').click();
    let s = await view(page);
    check(`${label}: whitespace name stays Idle and focuses custom error`, s.state === 'idle' && s.hidden && s.focus === 'attendee-name' && s.errors[0].includes('letter'), s);
    check(`${label}: custom error is described and native-validity linked`, await page.locator('#attendee-name').evaluate(e => !e.validity.valid && e.validity.customError && e.getAttribute('aria-invalid') === 'true' && e.getAttribute('aria-describedby').split(' ').includes('name-error')));
    await audit('name-error');
    await page.locator('#attendee-name').fill('Đặng Hoài An');
    check(`${label}: correction clears custom validity/error immediately`, await page.locator('#attendee-name').evaluate(e => e.validity.valid && e.getAttribute('aria-invalid') === null && !document.querySelector('#name-error').textContent));
    await page.locator('#submit-btn').focus(); await page.keyboard.press('Enter'); await wait(page, 'success');
    check(`${label}: keyboard retry succeeds after corrected custom error`, (await view(page)).receipt[0] === 'Đặng Hoài An');
    await page.locator('#reset-btn').click();
    await fill(page, {name: '  Đặng  Hoài  An  ', email: ' An.Smith+Demo@Example.COM ', note: '  Hoài\nAn\u0007  '});
    const started = Date.now(); await page.locator('#submit-btn').click(); await wait(page, 'success');
    s = await view(page);
    check(`${label}: real service renders exact normalized snapshot`, JSON.stringify(s.receipt) === JSON.stringify(['Đặng Hoài An', 'An.Smith+Demo@Example.COM', 'Design and code', 'Hoài\nAn']), {receipt: s.receipt, elapsedMs: Date.now() - started});
    check(`${label}: snapshot leaves entered values available until Reset`, await page.locator('#attendee-name').inputValue() === '  Đặng  Hoài  An  ');
    await audit('normalized-success');
    for (const note of hostile) {
      await page.locator('#reset-btn').click();
      await fill(page, {name: '<svg onload="window.__xss++">An</svg>', note});
      await page.locator('#submit-btn').click(); await wait(page, 'success');
      s = await view(page);
      check(`${label}: hostile name/note displayed literally ${note}`, s.receipt[0] === '<svg onload="window.__xss++">An</svg>' && s.receipt[3] === note && s.descendants === 0 && s.unsafeNodes === 0, s.receipt);
      await page.locator('#registration-summary').dispatchEvent('click');
      await page.locator('#registration-summary').dispatchEvent('mouseover');
      await page.waitForTimeout(50);
      s = await view(page);
      check(`${label}: no markup events/execution/dialog ${note}`, s.xss === 0 && dialogs.length === 0 && s.unhandled.length === 0 && s.csp.length === 0 && !s.overflow, s);
    }
    await audit('literal-hostile-success');
    if (process.env.SCREENSHOTS_DIR) {
      fs.mkdirSync(process.env.SCREENSHOTS_DIR, {recursive: true});
      await page.screenshot({path: path.join(process.env.SCREENSHOTS_DIR, `${label}-literal.png`), fullPage: true});
    }
    await page.locator('#reset-btn').click();
    // Programmatic values bypass browser minlength/maxlength user-edit tracking.
    await fill(page);
    await page.locator('#attendee-note').evaluate(e => {e.value = 'x'.repeat(301);});
    await page.locator('#submit-btn').click(); s = await view(page);
    check(`${label}: programmatic 301 note rejected with first-error focus`, s.state === 'idle' && s.focus === 'attendee-note' && s.errors[3].includes('300') && s.hidden, s);
    await audit('note-error');
    await page.locator('#attendee-note').fill('x'.repeat(300));
    check(`${label}: correction to 300 clears note error`, await page.locator('#attendee-note').evaluate(e => e.validity.valid && !document.querySelector('#note-error').textContent));
    await page.locator('#submit-btn').click(); await wait(page, 'success');
    check(`${label}: real exact 300 note accepted without truncation`, (await view(page)).receipt[3] === 'x'.repeat(300));
    await page.locator('#reset-btn').click();
    await fill(page, {name: 'A'.repeat(80), email: 'A'.repeat(115) + '@a.co', interest: 'design'});
    await page.locator('#submit-btn').click(); await wait(page, 'success');
    check(`${label}: native and JS exact name 80/email 120 succeed`, (await view(page)).receipt[0].length === 80 && (await view(page)).receipt[1].length === 120);
    s = await view(page);
    check(`${label}: normalized/hostile/boundary form has no overflow`, !s.overflow);
    check(`${label}: no navigation or registration requests`, page.url() === beforeURL && requests.every(r => r.method === 'GET' && ['document', 'stylesheet', 'script', 'image', 'other'].includes(r.type) && !/\/x(?:$|\?)/.test(r.url)), requests);
    check(`${label}: no persistence/runtime/CSP/unhandled/dialog`, beforeStorage === await page.evaluate(() => JSON.stringify([{...localStorage}, {...sessionStorage}])) && errors.length === 0 && dialogs.length === 0 && s.csp.length === 0 && s.unhandled.length === 0 && s.xss === 0, {errors, dialogs});
    await context.close();
  }
  // Independent-controller boundary: no native check/constraints, injected immediate service.
  const context = await browser.newContext({viewport: {width: 375, height: 900}});
  const page = await context.newPage();
  await page.route('**/app.js', r => r.fulfill({status: 200, contentType: 'text/javascript', body: 'export {};'}));
  await page.goto(url);
  await page.evaluate(async () => {
    const {createRegistration} = await import('/homework/event-hub/registration.js');
    const form = document.querySelector('form');
    form.noValidate = true; form.reportValidity = () => true;
    for (const e of form.querySelectorAll('input, select, textarea')) {e.removeAttribute('required'); e.removeAttribute('minlength'); e.removeAttribute('maxlength');}
    form.elements.email.type = 'text';
    form.elements.interest.append(new Option('Tampered option', 'evil'));
    window.__calls = []; window.__input = {name: 'Đặng Hoài An', email: 'An@example.com', interest: 'both', note: ''};
    window.__controller = createRegistration({form, summary: document.querySelector('#registration-summary'), service: payload => {
      window.__calls.push({payload, frozen: Object.isFrozen(payload)});
      // A transport cannot substitute unvalidated receipt text for the frozen input.
      return Promise.resolve({...payload, name: 'Substituted transport response'});
    }});
    window.__test = async patch => {
      window.__controller.reset();
      for (const [key, value] of Object.entries({...window.__input, ...patch})) form.elements[key].value = value;
      const before = window.__calls.length, result = await window.__controller.submit();
      return {result, calls: window.__calls.length - before, state: window.__controller.getState(), focus: document.activeElement.id, errors: [...document.querySelectorAll('.field-error')].map(e => e.textContent), receipt: document.querySelector('#receipt-name').textContent};
    };
  });
  for (const [name, patch, field] of [
    ['empty name', {name: ''}, 'name'], ['spaces name', {name: '   '}, 'name'], ['one-letter name', {name: 'A'}, 'name'],
    ['punctuation name', {name: "'--"}, 'name'], ['81 name', {name: 'A'.repeat(81)}, 'name'],
    ['blank email', {email: ''}, 'email'], ['malformed email', {email: 'an@example..com'}, 'email'],
    ['email newline', {email: 'An@example.com\nBcc:x@x.com'}, 'email'], ['121 email', {email: 'A'.repeat(116) + '@a.co'}, 'email'],
    ['tampered option', {interest: 'evil'}, 'interest'], ['empty interest', {interest: ''}, 'interest'],
    ['301 note', {note: 'x'.repeat(301)}, 'note']
  ]) {
    const result = await page.evaluate(patch => window.__test(patch), patch);
    check(`native bypass: ${name} cannot reach transport`, !result.result && result.calls === 0 && result.state === 'idle' && result.focus === `attendee-${field}` && result.errors[['name', 'email', 'interest', 'note'].indexOf(field)], result);
  }
  const corrected = await page.evaluate(() => window.__test({name: '  Đặng\tHoài  An  ', email: ' An@Example.COM ', note: ' Hi\r\nthere\u0000 '}));
  const payload = await page.evaluate(() => window.__calls.at(-1));
  check('bypassed correction succeeds with immutable normalized payload', corrected.result && corrected.calls === 1 && corrected.state === 'success' && payload.frozen && payload.payload.name === 'Đặng Hoài An' && payload.payload.email === 'An@Example.COM' && payload.payload.note === 'Hi\nthere', payload);
  check('render uses validated snapshot despite changed transport response', corrected.receipt === 'Đặng Hoài An' && corrected.errors.every(e => e === ''), corrected);
  await context.close();
  const report = {date: new Date().toISOString(), tester: 'Assistant: native input/hostile string browser checks plus isolated controller bypass checks', baseline: '7ac14abdd9be04d2fa80b0ac4b65a5fbf37a8e00', browser: browser.version(), method: 'Normal four-configuration cases use actual app and 600ms transport under strict repository CSP. Hostile strings typed and submitted, receipt DOM and triggered click/mouseover outcomes inspected. Separate bypass fixture removes native constraints/reportValidity and injects immediate altered receipt; it is explicitly synthetic.', checks, audits, passed: checks.every(c => c.passed), limits: ['This is not a full WCAG certification, full RFC email check, actual BFCache or student/hosted Preview check.']};
  fs.writeFileSync(path.join(root, 'verification/final-review/form-input.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({passed: report.passed, checks: checks.length, audits: audits.length, failures: checks.filter(c => !c.passed)}, null, 2));
  if (!report.passed) process.exitCode = 1;
} finally { await close(); }
