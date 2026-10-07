// Every hit owns a voice; neither a pad nor a URL owns a reusable player.
const voices = new Set();

function report(message) {
  const status = document.querySelector('#pad-status');
  if (status) status.textContent = message;
}

export async function playPad(pad) {
  const name = pad?.querySelector('span')?.textContent.trim() || 'this sound';
  let voice;
  let release = () => {};
  try {
    const sound = pad?.dataset.sound;
    if (!sound) throw new Error('Missing sound path');
    const url = new URL(sound, document.baseURI);
    if (url.origin !== location.origin) throw new Error('Sound must be local');

    voice = new Audio(url.href);
    voice.preload = 'auto';
    voices.add(voice);
    release = () => {
      voices.delete(voice);
      voice.removeEventListener('ended', release);
      voice.removeEventListener('error', failed);
    };
    const failed = () => {
      release();
      report(`Could not play ${name}. Check the sound file and try again.`);
    };
    voice.addEventListener('ended', release, {once: true});
    voice.addEventListener('error', failed, {once: true});
    // Call play synchronously in the click's user-activation window.
    await voice.play();
    report(`Playing ${name}.`);
    return true;
  } catch (error) {
    release();
    if (error.name === 'NotAllowedError') {
      report(`Playback blocked for ${name}. Allow sound in your browser and click the pad again.`);
    } else {
      report(`Could not play ${name}. Check the sound file and try again.`);
    }
    return false;
  }
}
