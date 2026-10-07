import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {submitRegistration} from '../../homework/event-hub/registration-service.js';

const checks = [], check = (name, passed, detail) => checks.push({name, passed: Boolean(passed), ...(detail === undefined ? {} : {detail})});
const originalSchedule = globalThis.setTimeout, originalCancel = globalThis.clearTimeout;
const tasks = new Map();
let id = 0;
globalThis.setTimeout = (callback, delay) => { tasks.set(++id, {callback, delay}); return id; };
globalThis.clearTimeout = timer => tasks.delete(timer);
const fixture = () => {
  const controller = new AbortController(), listeners = new Set();
  const add = controller.signal.addEventListener.bind(controller.signal), remove = controller.signal.removeEventListener.bind(controller.signal);
  controller.signal.addEventListener = (type, listener, options) => { if (type === 'abort') listeners.add(listener); add(type, listener, options); };
  controller.signal.removeEventListener = (type, listener, options) => { if (type === 'abort') listeners.delete(listener); remove(type, listener, options); };
  return {controller, listeners};
};
const runTimer = () => {const [timer, task] = [...tasks][0]; tasks.delete(timer); task.callback();};
const data = {name: 'Đặng Hoài An', email: 'an@example.com', interest: 'both', note: 'I <3 code'};
try {
  const normal = fixture(), input = {...data};
  const promise = submitRegistration(input, {signal: normal.controller.signal});
  check('service schedules exactly one 600ms local attempt', tasks.size === 1 && [...tasks.values()][0].delay === 600 && normal.listeners.size === 1);
  input.name = 'Changed later'; runTimer(); const receipt = await promise;
  check('success returns frozen entry-time snapshot', Object.isFrozen(receipt) && JSON.stringify(receipt) === JSON.stringify(data), receipt);
  check('success releases timer and abort listener', tasks.size === 0 && normal.listeners.size === 0);
  normal.controller.abort();
  check('abort after success cannot alter settled receipt', receipt.name === data.name && tasks.size === 0);

  const fault = fixture();
  const failure = submitRegistration(data, {simulateError: true, signal: fault.controller.signal}).then(() => null, error => error);
  runTimer(); const error = await failure;
  check('selected simulation gives deterministic rejection', error?.message === 'Simulated registration failure.');
  check('error releases timer and abort listener', tasks.size === 0 && fault.listeners.size === 0);

  const preAborted = fixture(); preAborted.controller.abort();
  const early = await submitRegistration(data, {signal: preAborted.controller.signal}).then(() => null, error => error);
  check('pre-aborted signal rejects without scheduling/listening', early?.name === 'AbortError' && tasks.size === 0 && preAborted.listeners.size === 0);

  const pending = fixture();
  const cancelled = submitRegistration(data, {signal: pending.controller.signal}).then(() => null, error => error);
  const stale = [...tasks.values()][0].callback;
  pending.controller.abort(); const aborted = await cancelled;
  check('in-flight service abort cancels timer and removes listener', aborted?.name === 'AbortError' && tasks.size === 0 && pending.listeners.size === 0);
  stale();
  check('obsolete callback cannot settle an already rejected service', (await cancelled)?.name === 'AbortError' && tasks.size === 0);

  for (const payload of [null, {}, {...data, note: 123}]) {
    const rejected = await submitRegistration(payload).then(() => null, error => error);
    check(`invalid payload type ${JSON.stringify(payload)} rejects without timer`, rejected instanceof TypeError && tasks.size === 0);
  }
  const noSignal = submitRegistration(data); runTimer();
  check('optional signal omitted still completes safely', (await noSignal).email === data.email && tasks.size === 0);
} finally {
  globalThis.setTimeout = originalSchedule;
  globalThis.clearTimeout = originalCancel;
}
const report = {date: new Date().toISOString(), tester: 'Assistant: production local service contract checks', baseline: 'd9766945b3983b199a7a737d9f38e8b6b5e46651', method: 'Native Promise/AbortController with replaced global timeout scheduler, restored after tests. Virtual dispatch, not real elapsed 600ms.', checks, passed: checks.every(item => item.passed)};
fs.writeFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'service-result.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({passed: report.passed, checks: checks.length, failures: checks.filter(item => !item.passed)}, null, 2));
if (!report.passed) process.exitCode = 1;
