// Final review copy of verification/hw3-step2/model-check.mjs; adaptations documented in prepare.py.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startCountdown} from '../../homework/event-hub/countdown.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
const target = Date.parse('2026-11-21T02:00:00Z');
const checks = [];
const check = (name, passed, detail) => checks.push({name, passed: Boolean(passed), ...(detail === undefined ? {} : {detail})});
function fixture({time = target - 1250, targetISO = '2026-11-21T02:00:00Z', renderCost = 0} = {}) {
  let clock = time, id = -1;
  const tasks = new Map(), history = [], ticks = [], statuses = [];
  const now = () => clock;
  const schedule = (callback, delay) => { const task = {id: ++id, due: clock + delay, callback, delay}; tasks.set(task.id, task); history.push(task); return task.id; };
  const start = () => startCountdown({targetISO, now, schedule, cancel: timer => tasks.delete(timer), onTick: value => {ticks.push({at: clock, ...value}); clock += renderCost;}, onStatus: value => statuses.push(value)});
  const advance = amount => {
    const until = clock + amount;
    let count = 0;
    while (true) {
      const task = [...tasks.values()].sort((a, b) => a.due - b.due || a.id - b.id).find(task => task.due <= until);
      if (!task) break;
      if (++count > 10000) throw new Error('Virtual scheduler failed to settle');
      tasks.delete(task.id); clock = Math.max(clock, task.due); task.callback();
    }
    clock = Math.max(clock, until);
  };
  const stop = start();
  return {tasks, history, ticks, statuses, start, stop, now, advance, elapseWithoutCallbacks: amount => {clock += amount;}, setTime: value => {clock = value;}};
}

const f = fixture();
check('1250ms rounds upward to two seconds without early start', f.ticks[0].totalSeconds === 2 && f.statuses.join(',') === 'running');
check('first timeout is the exact 250ms absolute boundary', [...f.tasks.values()][0].delay === 250);
f.advance(249);
check('before fractional boundary no premature tick', f.ticks.length === 1);
f.advance(1);
check('at fractional boundary displays one second', f.ticks.at(-1).totalSeconds === 1 && f.ticks.at(-1).at === target - 1000);
f.advance(999);
check('one millisecond before target is still running', f.ticks.at(-1).totalSeconds === 1 && !f.statuses.includes('started'));
f.advance(1);
check('exact target yields zero, terminal status and no timer', f.ticks.at(-1).totalSeconds === 0 && f.statuses.join(',') === 'running,started' && f.tasks.size === 0);
const terminalCount = f.ticks.length;
f.advance(60000);
check('terminal event never continues scheduling', f.ticks.length === terminalCount && f.tasks.size === 0);

for (const remaining of [1, 999, 1000, 1001, 59999, 60000, 3600000, 86400000, 90061000]) {
  const sample = fixture({time: target - remaining});
  const tick = sample.ticks[0], total = Math.ceil(remaining / 1000);
  check(`decomposition and ceil boundary at ${remaining}ms`, tick.totalSeconds === total && tick.days * 86400 + tick.hours * 3600 + tick.minutes * 60 + tick.seconds === total && tick.hours < 24 && tick.minutes < 60 && tick.seconds < 60);
  sample.stop();
}
for (const offset of [0, 1, 86400000]) {
  const past = fixture({time: target + offset});
  check(`target/past ${offset}ms clamps to zero and stops`, past.ticks[0].totalSeconds === 0 && past.statuses.join(',') === 'started' && past.tasks.size === 0);
}

const invalid = [null, '', 'bad date', '2026-11-21T02:00:00', '2026-11-21T09:00:00+07:00', '2026-02-30T02:00:00Z', '2026-02-29T02:00:00Z', '2026-13-21T02:00:00Z', '2026-11-21T24:00:00Z', '2026-11-21T02:60:00Z', '2026-11-21T02:00:60Z', '2026-11-21T02:00:00.1Z', ' 2026-11-21T02:00:00Z'];
for (const targetISO of invalid) {
  const bad = fixture({targetISO});
  check(`invalid target ${JSON.stringify(targetISO)} is reported without ticks/timers`, bad.statuses.join(',') === 'invalid' && bad.ticks.length === 0 && bad.tasks.size === 0);
  bad.stop(); bad.stop();
}
for (const targetISO of ['2028-02-29T02:00:00Z', '2026-11-21T02:00:00.250Z', '0000-01-01T00:00:00Z']) {
  const valid = fixture({targetISO, time: Date.parse(targetISO) - 1250});
  check(`valid round-trip UTC ${targetISO}`, valid.statuses[0] === 'running' && valid.ticks[0].totalSeconds === 2 && valid.tasks.size === 1);
  valid.stop();
}

const delayed = fixture({time: target - 60000});
delayed.elapseWithoutCallbacks(23750);
const lateTask = [...delayed.tasks.values()][0]; delayed.tasks.delete(lateTask.id); lateTask.callback();
check('delayed callback recomputes 37s instead of subtracting one', delayed.ticks.at(-1).totalSeconds === 37 && delayed.statuses.join(',') === 'running');
check('delayed callback reschedules on the next absolute 250ms boundary', [...delayed.tasks.values()][0].delay === 250);
delayed.advance(250);
check('after delayed recovery next value is 36s on target boundary', delayed.ticks.at(-1).totalSeconds === 36);
delayed.setTime(target + 5000); const overdue = [...delayed.tasks.values()][0]; delayed.tasks.delete(overdue.id); overdue.callback();
check('callback delayed past start immediately reaches terminal zero', delayed.ticks.at(-1).totalSeconds === 0 && delayed.tasks.size === 0 && delayed.statuses.at(-1) === 'started');

const backward = fixture({time: target - 5000}); backward.setTime(target - 8000);
const reverseTask = [...backward.tasks.values()][0]; backward.tasks.delete(reverseTask.id); reverseTask.callback();
check('device-clock correction backward is recomputed', backward.ticks.at(-1).totalSeconds === 8 && backward.tasks.size === 1); backward.stop();

const stopped = fixture(); const stale = [...stopped.tasks.values()][0].callback;
stopped.stop(); stopped.stop(); stale();
check('idempotent stop cancels timer ID zero and blocks stale callbacks', stopped.tasks.size === 0 && stopped.ticks.length === 1 && stopped.statuses.join(',') === 'running');
for (let i = 0; i < 50; i++) { const stop = stopped.start(); const callback = [...stopped.tasks.values()][0].callback; stop(); callback(); }
check('50 start/stop sessions leave no timers or obsolete updates', stopped.tasks.size === 0 && stopped.ticks.length === 51);

const overhead = fixture({time: target - 10000, renderCost: 7}); overhead.advance(8993);
check('7ms render overhead does not accumulate timer drift', overhead.ticks.every(tick => (target - tick.at) % 1000 === 0) && overhead.ticks.at(-1).totalSeconds === 1, overhead.ticks.map(tick => ({remaining: target - tick.at, seconds: tick.totalSeconds})));
overhead.stop();
const crossing = fixture({time: target - 1250, renderCost: 300});
check('render overhead crossing a second boundary schedules immediate correction', [...crossing.tasks.values()][0].delay === 0, {scheduledDelay: [...crossing.tasks.values()][0].delay});
crossing.advance(0);
check('immediate overhead correction emits current one-second value', crossing.ticks.at(-1).totalSeconds === 1 && crossing.ticks.at(-1).at === target - 950);
crossing.stop();

const noClock = fixture({time: NaN});
check('nonfinite clock reports unavailable and owns no timer', noClock.statuses.join(',') === 'unavailable' && noClock.tasks.size === 0 && noClock.ticks.length === 0);
const brokenClock = fixture(); brokenClock.setTime(Infinity);
const clockTask = [...brokenClock.tasks.values()][0]; brokenClock.tasks.delete(clockTask.id); clockTask.callback();
check('later nonfinite clock cleans up instead of rescheduling forever', brokenClock.statuses.at(-1) === 'unavailable' && brokenClock.tasks.size === 0);

const report = {date: new Date().toISOString(), tester: 'Assistant: deterministic production countdown checks', baseline: '7ac14abdd9be04d2fa80b0ac4b65a5fbf37a8e00', method: 'Injected virtual clock and asynchronous-equivalent queued timeout scheduler; not real elapsed waits or student checks.', checks, passed: checks.every(item => item.passed)};
fs.writeFileSync(path.join(directory, 'countdown-model.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({passed: report.passed, checks: checks.length, failures: checks.filter(item => !item.passed)}, null, 2));
if (!report.passed) process.exitCode = 1;
