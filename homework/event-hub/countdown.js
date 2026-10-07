const UTC_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

function parseUTC(value) {
  if (typeof value !== 'string' || !UTC_ISO.test(value)) return NaN;
  const epoch = Date.parse(value);
  if (!Number.isFinite(epoch)) return NaN;
  const canonical = value.includes('.') ? value : value.replace('Z', '.000Z');
  return new Date(epoch).toISOString() === canonical ? epoch : NaN;
}

export function startCountdown({
  targetISO,
  onTick = () => {},
  onStatus = () => {},
  now = Date.now,
  schedule = setTimeout,
  cancel = clearTimeout
}) {
  const target = parseUTC(targetISO);
  let timer = null;
  let stopped = false;
  let status = '';

  const stop = () => {
    stopped = true;
    if (timer !== null) cancel(timer);
    timer = null;
  };
  const announce = next => {
    if (next === status) return;
    status = next;
    onStatus(next);
  };
  const tick = () => {
    if (stopped) return;
    timer = null;
    const clock = now();
    if (!Number.isFinite(clock)) {
      announce('unavailable');
      stop();
      return;
    }
    const totalSeconds = Math.ceil(Math.max(target - clock, 0) / 1000);
    onTick({
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor(totalSeconds / 3600) % 24,
      minutes: Math.floor(totalSeconds / 60) % 60,
      seconds: totalSeconds % 60,
      totalSeconds
    });
    announce(totalSeconds > 0 ? 'running' : 'started');
    if (totalSeconds === 0) {
      stop();
      return;
    }
    if (stopped) return;
    // Account for rendering overhead before finding the next absolute boundary.
    const remaining = target - now();
    if (!Number.isFinite(remaining)) {
      announce('unavailable');
      stop();
      return;
    }
    const delay = Math.max(0, Math.min(1000, remaining - (totalSeconds - 1) * 1000));
    timer = schedule(tick, delay);
  };

  if (!Number.isFinite(target)) {
    announce('invalid');
    stop();
  } else {
    tick();
  }
  return stop;
}
