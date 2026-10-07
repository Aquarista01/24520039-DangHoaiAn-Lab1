// Recompute from the absolute deadline on every render; timers are only wakeups.
export function remainingParts(target, now = Date.now()) {
  const seconds = Math.max(0, Math.ceil((target - now) / 1000));
  return { days: Math.floor(seconds / 86400), hours: Math.floor(seconds / 3600) % 24, minutes: Math.floor(seconds / 60) % 60, seconds: seconds % 60, ended: now >= target };
}
export function startCountdown(isoTimestamp, render) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(isoTimestamp)) throw new TypeError('Use an explicit UTC ISO timestamp.');
  const target = Date.parse(isoTimestamp);
  if (!Number.isFinite(target)) throw new TypeError('Invalid event date.');
  let timer;
  let active = true;
  function tick() {
    clearTimeout(timer);
    if (!active) return;
    const parts = remainingParts(target);
    render(parts);
    if (!parts.ended) timer = setTimeout(tick, 1000 - (Date.now() % 1000));
  }
  function onVisibility() { if (!document.hidden) tick(); }
  function cleanup() { active = false; clearTimeout(timer); document.removeEventListener('visibilitychange', onVisibility); }
  document.addEventListener('visibilitychange', onVisibility);
  tick();
  return cleanup;
}
