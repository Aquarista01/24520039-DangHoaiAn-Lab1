// Final review copy of verification/hw2-step4/model-check.mjs; adaptations documented in prepare.py.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRecorder} from '../../homework/drum-kit/recorder.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const checks = [];
const check = (name, passed, detail) => checks.push({name, passed: Boolean(passed), ...(detail === undefined ? {} : {detail})});
function fixture() {
  let time = 1000, id = 0;
  const tasks = new Map(), history = [], hits = [], changes = [];
  const schedule = (callback, delay) => {const task = {id: ++id, callback, due: time + delay}; tasks.set(task.id, task); history.push(task); return task.id;};
  const tick = amount => {
    const until = time + amount;
    while (true) {
      const task = [...tasks.values()].sort((a, b) => a.due - b.due || a.id - b.id).find(task => task.due <= until);
      if (!task) break;
      tasks.delete(task.id); time = task.due; task.callback();
    }
    time = until;
  };
  const recorder = createRecorder({keys: ['a', 's', 'h'], now: () => time, schedule, cancel: timer => tasks.delete(timer), onChange: value => changes.push(value), onReplayHit: key => hits.push({key, at: time})});
  return {recorder, tasks, history, hits, changes, tick, now: () => time, elapseWithoutCallbacks: amount => {time += amount;}};
}

const f = fixture(), r = f.recorder;
check('initial idle/empty and empty replay rejected', r.snapshot().state === 'idle' && r.snapshot().beats.length === 0 && r.replay() === false);
check('start recording and invalid transitions rejected', r.start() && !r.start() && !r.clear() && !r.replay() && r.snapshot().state === 'recording');
f.tick(30); r.capture('a'); f.tick(150); r.capture('s'); f.tick(80); r.capture('a');
const tape = r.snapshot().beats;
check('FIFO A-S-A with relative millisecond timestamps', JSON.stringify(tape) === JSON.stringify([{key: 'a', at: 30}, {key: 's', at: 180}, {key: 'a', at: 260}]), tape);
check('stop retains take and cancels the recording timer', r.stop() && r.snapshot().state === 'idle' && JSON.stringify(r.snapshot().beats) === JSON.stringify(tape) && f.tasks.size === 0 && !r.stop());
const external = r.snapshot(); external.beats[0].key = 'h'; external.beats.push({key: 'h', at: 999});
check('snapshot mutation cannot change internal queue', JSON.stringify(r.snapshot().beats) === JSON.stringify(tape));
const replayOrigin = f.now();
check('replay starts and guards mutation/re-entry', r.replay() && !r.start() && !r.clear() && !r.replay() && !r.capture('h') && r.snapshot().state === 'replaying');
f.tick(29); check('initial recorded silence is retained', f.hits.length === 0);
f.tick(1); f.tick(149); check('no early second hit', f.hits.length === 1);
f.tick(1); f.tick(80);
const replayed = f.hits.map(hit => ({key: hit.key, at: hit.at - replayOrigin}));
check('replay preserves exact offsets/order and does not self-record', JSON.stringify(replayed) === JSON.stringify(tape) && JSON.stringify(r.snapshot().beats) === JSON.stringify(tape) && r.snapshot().state === 'idle' && f.tasks.size === 0, replayed);

r.replay(); const stale = [...f.tasks.values()].map(task => task.callback); r.stop(); r.start();
for (const callback of stale) callback();
check('cancel token blocks old replay callbacks after a new session', f.hits.length === 3 && r.snapshot().state === 'recording' && r.snapshot().beats.length === 0);
r.capture('h'); r.stop(); r.clear();
check('clear resets tape in idle', r.snapshot().state === 'idle' && r.snapshot().beats.length === 0 && !r.replay() && f.tasks.size === 0);

const equal = fixture(); equal.recorder.start();
for (const key of ['a', 's', 'a']) equal.recorder.capture(key);
equal.recorder.stop(); equal.recorder.replay(); equal.tick(0);
check('equal timestamps retain FIFO insertion order', equal.hits.map(hit => hit.key).join(',') === 'a,s,a' && equal.recorder.snapshot().state === 'idle');

const cap = fixture(); cap.recorder.start();
for (let i = 0; i < 255; i++) cap.recorder.capture('a');
check('255 hits still recording', cap.recorder.snapshot().beats.length === 255 && cap.recorder.snapshot().state === 'recording');
cap.recorder.capture('s');
check('256th hit retained, automatic stop and overflow rejected', cap.recorder.snapshot().beats.length === 256 && cap.recorder.snapshot().beats.at(-1).key === 's' && cap.recorder.snapshot().state === 'idle' && /256-hit/.test(cap.recorder.snapshot().message) && !cap.recorder.capture('h') && cap.tasks.size === 0);

const duration = fixture(); duration.recorder.start(); duration.recorder.capture('s'); duration.tick(119999);
check('recording remains open before 120 seconds', duration.recorder.snapshot().state === 'recording');
duration.tick(1);
check('120-second timer stops and retains queue', duration.recorder.snapshot().state === 'idle' && duration.recorder.snapshot().beats.length === 1 && /120-second/.test(duration.recorder.snapshot().message) && duration.tasks.size === 0);
const delayed = fixture(); delayed.recorder.start(); delayed.recorder.capture('a'); delayed.elapseWithoutCallbacks(120000);
check('late input at duration bound is rejected even if timer was delayed', !delayed.recorder.capture('s') && delayed.recorder.snapshot().state === 'idle' && delayed.recorder.snapshot().beats.length === 1 && delayed.tasks.size === 0);

const invalid = fixture(); invalid.recorder.start(); invalid.tick(10); invalid.recorder.capture('a');
check('invalid keys, nonfinite and backwards timestamps are ignored', !invalid.recorder.capture('x') && !invalid.recorder.capture('a', NaN) && !invalid.recorder.capture('a', 999) && !invalid.recorder.capture('a', 1009) && invalid.recorder.snapshot().beats.length === 1);
invalid.recorder.stop(); invalid.recorder.start();
check('new recording clears prior take and resets time origin', invalid.recorder.snapshot().beats.length === 0 && invalid.recorder.capture('h') && invalid.recorder.snapshot().beats[0].at === 0);

for (let i = 0; i < 30; i++) {invalid.recorder.stop(); invalid.recorder.clear(); invalid.recorder.start(); invalid.recorder.capture('a'); invalid.recorder.stop(); invalid.recorder.replay(); invalid.recorder.stop();}
invalid.tick(130000);
check('30 rapid sessions leave no stale timers/hits', invalid.tasks.size === 0 && invalid.hits.length === 0 && invalid.recorder.snapshot().state === 'idle');

let clock = 0, timerId = 0;
const costlyTasks = [], costlyHits = [];
const costly = createRecorder({keys: ['a'], now: () => clock, schedule: (callback, delay) => {const task = {id: ++timerId, due: clock + delay, callback, cancelled: false}; costlyTasks.push(task); clock += 7; return task.id;}, cancel: id => {costlyTasks.find(task => task.id === id).cancelled = true;}, onChange: () => {}, onReplayHit: key => costlyHits.push(key)});
costly.start(); costly.capture('a', 50); costly.capture('a', 150); costly.stop();
const origin = clock; costly.replay();
check('scheduler overhead does not accumulate drift', costlyTasks.filter(task => !task.cancelled).map(task => task.due - origin).join(',') === '50,150');

let callback;
const throwing = createRecorder({keys: ['a'], now: () => 0, schedule: fn => {callback = fn; return 1;}, cancel: () => {}, onChange: () => {}, onReplayHit: () => {throw new Error('Injected activation failure');}});
throwing.start(); throwing.capture('a'); throwing.stop(); throwing.replay(); callback();
check('throwing replay adapter returns to idle and retains take', throwing.snapshot().state === 'idle' && throwing.snapshot().beats.length === 1 && /could not be activated/.test(throwing.snapshot().message));

const report = {date: new Date().toISOString(), tester: 'Assistant: deterministic recorder contract checks', baseline: '7ac14abdd9be04d2fa80b0ac4b65a5fbf37a8e00', method: 'Injected virtual clock/scheduler exercise the production recorder module without waiting 120 real seconds. Native browser timing is checked separately.', checks, passed: checks.every(item => item.passed)};
fs.writeFileSync(path.join(root, 'verification/final-review/recorder-model.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({passed: report.passed, checks: checks.length, failures: checks.filter(item => !item.passed)}, null, 2));
if (!report.passed) process.exitCode = 1;
