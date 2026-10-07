export function createBeatRecorder({ clock = () => performance.now(), onChange = () => {}, maxBeats = 256, maxDuration = 120000 } = {}) {
  let beats = [];
  let recording = false;
  let startedAt = 0;
  let deadline;
  const snapshot = () => beats.map((beat) => ({ ...beat }));
  function notify() { onChange({ recording, beats: snapshot() }); }
  function stop() {
    clearTimeout(deadline);
    recording = false;
    notify();
  }
  function start() {
    clearTimeout(deadline);
    beats = [];
    startedAt = clock();
    recording = true;
    deadline = setTimeout(stop, maxDuration);
    notify();
  }
  function add(key) {
    if (!recording) return false;
    const at = Math.max(0, clock() - startedAt);
    if (at >= maxDuration) { stop(); return false; }
    beats.push({ key, at: Math.round(at) });
    if (beats.length >= maxBeats) stop();
    else notify();
    return true;
  }
  function clear() { clearTimeout(deadline); recording = false; beats = []; notify(); }
  return { start, stop, add, clear, snapshot, get isRecording() { return recording; } };
}

export function replayBeats(beats, onBeat, onDone) {
  let cancelled = false;
  const timers = beats.map((beat) => setTimeout(() => { if (!cancelled) onBeat(beat.key); }, beat.at));
  const last = beats.at(-1)?.at ?? 0;
  timers.push(setTimeout(() => { if (!cancelled) onDone(); }, last + 150));
  return () => { cancelled = true; timers.forEach(clearTimeout); };
}
