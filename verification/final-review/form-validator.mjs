// Final review copy of verification/hw3-step5/validation-check.mjs; adaptations documented in prepare.py.
import fs from 'node:fs';
import {validateRegistration} from '../../homework/event-hub/validation.js';
const base = {name: 'Đặng Hoài An', email: 'An@example.com', interest: 'both', note: ''};
const checks = [];
const check = (name, passed, detail) => checks.push({name, passed: Boolean(passed), detail});
const valid = (name, patch, expected = patch) => {
  const input = {...base, ...patch}, before = JSON.stringify(input);
  const result = validateRegistration(input);
  check(name, result.ok && Object.entries(expected).every(([key, value]) => result.data[key] === value) && Object.keys(result.errors).length === 0 && JSON.stringify(input) === before, result);
};
const invalid = (name, patch, field) => {
  const result = validateRegistration({...base, ...patch});
  check(name, !result.ok && result.data === null && Boolean(result.errors[field]), result);
};
valid('Vietnamese NFC and collapsed name whitespace', {name: '  Đặng\t  Hoài  An  '}, {name: 'Đặng Hoài An'});
for (const name of ["O’Connor", "Jean-Luc", '李小龍', 'محمد علي', 'D’Arcy', "Anne O'Brien"]) valid(`ordinary Unicode name: ${name}`, {name});
valid('name removes non-whitespace controls', {name: '\u0000Đặng\u0007 Hoài\u007F An\u0085'}, {name: 'Đặng Hoài An'});
valid('name line breaks separate words', {name: 'An\r\nNguyễn'}, {name: 'An Nguyễn'});
for (const name of ['', ' \t\n ', 'A', '\u0000A\u0007', "'--", '12', '😀😀', '\u0301\u0300']) invalid(`meaningless/short name ${JSON.stringify(name)}`, {name}, 'name');
valid('name lower boundary 2', {name: 'An'});
valid('name upper boundary 80', {name: 'A'.repeat(80)});
invalid('name 81 rejected without truncation', {name: 'A'.repeat(81)}, 'name');
valid('name UTF-16 80 boundary', {name: 'A' + '😀'.repeat(39) + 'B'});
invalid('name UTF-16 81 rejected', {name: 'A' + '😀'.repeat(40)}, 'name');
valid('email outer spaces trimmed, local case preserved', {email: '  An.Smith+Demo@Example.COM  '}, {email: 'An.Smith+Demo@Example.COM'});
valid('single-label domain matches practical native grammar', {email: 'an@localhost'});
valid('email 120 boundary', {email: 'A'.repeat(115) + '@a.co'});
invalid('email 121 rejected', {email: 'A'.repeat(116) + '@a.co'}, 'email');
for (const email of ['', 'missing-at', 'an@@example.com', 'an @example.com', 'an@example .com', 'an\n@example.com', '\ran@example.com', 'an@example.com\n', 'an\u0000@example.com', 'an\u007F@example.com', 'an\u0085@example.com', 'an@-example.com', 'an@example-.com', 'an@example..com', 'an@例子.com']) invalid(`bad email ${JSON.stringify(email)}`, {email}, 'email');
for (const interest of ['design', 'code', 'both']) valid(`interest allowlist ${interest}`, {interest});
for (const interest of ['', 'Design', 'both ', '<script>', 'other']) invalid(`unknown interest ${interest}`, {interest}, 'interest');
valid('optional empty note', {note: ''});
valid('note NFC/line endings/control removal', {note: '  Hoài\r\nAn\rOK\t\u0000\u0007\u007F  '}, {note: 'Hoài\nAn\nOK'});
valid('note internal tab and line break retained', {note: 'A\tB\nC'});
valid('note exact 300', {note: 'x'.repeat(300)});
invalid('note 301 rejected without truncation', {note: 'x'.repeat(301)}, 'note');
valid('note UTF-16 300', {note: '😀'.repeat(150)});
invalid('note UTF-16 302', {note: '😀'.repeat(151)}, 'note');
for (const note of ['<img src=x onerror="window.__xss++">', '<svg onload="window.__xss++"></svg>', '<script>window.__xss++</script>', '"><button onclick="window.__xss++">Click</button>', '<a href="javascript:window.__xss++">Link</a>', '&lt;img&gt; & " \' < >']) valid(`literal markup ${note}`, {note});
for (const key of Object.keys(base)) for (const value of [null, 42, {}, undefined]) invalid(`non-string ${key}: ${String(value)}`, {[key]: value}, key);
for (const raw of [null, undefined, 42, {}, []]) {
  const result = validateRegistration(raw);
  check(`invalid raw container ${String(raw)}`, !result.ok && result.data === null && Object.keys(result.errors).length === 4);
}
const snapshot = validateRegistration(base);
check('result, snapshot and error map immutable', Object.isFrozen(snapshot) && Object.isFrozen(snapshot.data) && Object.isFrozen(snapshot.errors));
let refused = false;
try {snapshot.data.name = 'Changed';} catch {refused = true;}
check('attempted snapshot mutation rejected', refused && snapshot.data.name === base.name);
const normalized = validateRegistration({name: '  Đặng\tHoài  An ', email: ' An@Example.com ', interest: 'both', note: ' Hi\r\nthere\u0000 '});
check('normalization is idempotent', normalized.ok && JSON.stringify(validateRegistration(normalized.data).data) === JSON.stringify(normalized.data));
const report = {date: new Date().toISOString(), tester: 'Assistant: independent validator golden cases in Node', baseline: '7ac14abdd9be04d2fa80b0ac4b65a5fbf37a8e00', node: process.version, checks, passed: checks.every(item => item.passed), policy: 'UTF-16 lengths; NFC; trim; name whitespace collapse/control removal and at least one Unicode letter; note CRLF/CR to LF, trim and C0/C1 removal except LF/tab; practical ASCII HTML-email grammar, no full RFC claim; exact interest allowlist. Golden cases are not a claim of universal email/name acceptance.'};
fs.writeFileSync(new URL('./form-validator.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({passed: report.passed, checks: checks.length, failures: checks.filter(item => !item.passed)}, null, 2));
if (!report.passed) process.exitCode = 1;
