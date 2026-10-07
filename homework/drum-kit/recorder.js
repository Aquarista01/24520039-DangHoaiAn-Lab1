const MAX_HITS = 256;
const MAX_DURATION_MS = 120_000;

export function createRecorder({keys, onChange, onReplayHit,
  now = () => performance.now(), schedule = setTimeout, cancel = clearTimeout}) {
  const validKeys = new Set(keys);
  const timers = new Set();
  let state = 'idle';
  let beats = [];
  let origin = 0;
  let generation = 0;
  let message = 'No take recorded yet.';

  const snapshot = () => ({state, beats: beats.map(beat => ({...beat})), message});
  const notify = text => {message = text; onChange(snapshot());};
  const invalidate = () => {
    generation += 1;
    for (const timer of timers) cancel(timer);
    timers.clear();
  };
  const later = (callback, delay) => {
    const token = generation;
    const timer = schedule(() => {
      timers.delete(timer);
      if (token === generation) callback();
    }, delay);
    timers.add(timer);
  };
  const end = text => {invalidate(); state = 'idle'; notify(text);};

  const start = () => {
    if (state !== 'idle') return false;
    invalidate(); beats = []; origin = now(); state = 'recording';
    later(() => end('Recording stopped at the 120-second limit. Your take is saved.'), MAX_DURATION_MS);
    notify('Recording. Up to 256 hits or 120 seconds.');
    return true;
  };
  const capture = (key, at = now()) => {
    if (state !== 'recording' || !validKeys.has(key) || !Number.isFinite(at)) return false;
    const offset = at - origin;
    if (offset >= MAX_DURATION_MS) {
      end('Recording stopped at the 120-second limit. Your take is saved.');
      return false;
    }
    if (offset < 0 || offset < (beats.at(-1)?.at ?? 0)) return false;
    beats.push({key, at: offset});
    if (beats.length === MAX_HITS) end('Recording stopped at the 256-hit limit. Your take is saved.');
    else notify(`Recording. ${beats.length} hit${beats.length === 1 ? '' : 's'}.`);
    return true;
  };
  const stop = () => {
    if (state === 'idle') return false;
    end(state === 'recording' ? 'Take saved. Replay it or record a new one.' : 'Replay stopped. Your take is saved.');
    return true;
  };
  const clear = () => {
    if (state !== 'idle') return false;
    invalidate(); beats = []; notify('Tape cleared. Ready for a new take.');
    return true;
  };
  const replay = () => {
    if (state !== 'idle' || beats.length === 0) return false;
    invalidate();
    const take = beats.map(beat => ({...beat}));
    const replayOrigin = now();
    state = 'replaying'; notify('Replaying. Stop cancels the remaining hits.');
    for (const [index, beat] of take.entries()) {
      later(() => {
        try {onReplayHit(beat.key);} catch {
          end('Replay stopped because a hit could not be activated.');
          return;
        }
        if (index === take.length - 1) end('Replay finished. Your take is saved.');
      }, Math.max(0, replayOrigin + beat.at - now()));
    }
    return true;
  };
  onChange(snapshot());
  return {start, capture, stop, clear, replay, snapshot};
}
