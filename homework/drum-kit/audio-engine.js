// No DOM knowledge: each trigger owns one voice, allowing overlapping hits.
export function createAudioEngine({ onError = () => {}, maxVoices = 48 } = {}) {
  const active = new Set();
  const cached = new Map();
  let stopped = 0;

  function preload(sources) {
    new Set(sources).forEach((src) => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.load();
      cached.set(src, audio);
    });
  }
  function stopAll() {
    stopped += 1;
    active.forEach((voice) => { voice.pause(); voice.currentTime = 0; });
    active.clear();
  }
  async function play(src) {
    if (!src) return false;
    if (active.size >= maxVoices) {
      const oldest = active.values().next().value;
      oldest.pause();
      active.delete(oldest);
    }
    const voice = cached.has(src) ? cached.get(src).cloneNode(true) : new Audio(src);
    voice.volume = 0.65;
    const generation = stopped;
    active.add(voice);
    const cleanup = () => active.delete(voice);
    voice.addEventListener('ended', cleanup, { once: true });
    voice.addEventListener('error', cleanup, { once: true });
    try {
      await voice.play();
      if (generation !== stopped) { voice.pause(); cleanup(); return false; }
      return true;
    } catch (error) {
      cleanup();
      if (generation === stopped) onError(error);
      return false;
    }
  }
  return { preload, play, stopAll, get activeCount() { return active.size; } };
}
