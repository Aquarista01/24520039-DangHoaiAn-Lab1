"""Measure the actual nine reused WAV files; this is not a listening test."""
import datetime
import hashlib
import json
from pathlib import Path
import subprocess
import wave

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
SOURCE = '66fe05a243cdc936c427179d445cfb6bfb148642'
names = ['kick', 'snare', 'clap', 'hat', 'open-hat', 'tom', 'rim', 'shaker', 'crash']
results = []
for name in names:
    relative = f'homework/drum-kit/sounds/{name}.wav'
    content = (ROOT / relative).read_bytes()
    original = subprocess.check_output(['git', 'show', f'{SOURCE}:{relative}'], cwd=ROOT)
    with wave.open(str(ROOT / relative), 'rb') as audio:
        channels, sample_width, rate, frames = audio.getnchannels(), audio.getsampwidth(), audio.getframerate(), audio.getnframes()
        pcm = audio.readframes(frames)
    if sample_width != 2:
        raise ValueError(f'{name}: expected PCM16, got {sample_width}')
    values = np.frombuffer(pcm, dtype='<i2').astype(float).reshape(-1, channels) / 32768
    mono = values.mean(axis=1)
    spectrum = np.abs(np.fft.rfft(mono)) ** 2
    frequencies = np.fft.rfftfreq(len(mono), 1 / rate)
    mid_fraction = float(spectrum[(frequencies >= 250) & (frequencies <= 4000)].sum() / spectrum.sum())
    peak = float(np.abs(values).max())
    rms = float(np.sqrt(np.mean(values ** 2)))
    clipped = int(np.sum(np.abs(values) >= 32767 / 32768))
    result = {'name': name, 'path': relative, 'bytes': len(content), 'gitBlob': subprocess.check_output(['git', 'hash-object', relative], cwd=ROOT, text=True).strip(), 'sha256': hashlib.sha256(content).hexdigest(), 'identicalToFrozenSource': content == original, 'channels': channels, 'sampleWidth': sample_width, 'sampleRate': rate, 'frames': frames, 'durationSeconds': frames / rate, 'peak': peak, 'rms': rms, 'clippedSamples': clipped, 'energyFraction250To4000Hz': mid_fraction}
    result['passed'] = content == original and channels == 1 and rate == 22050 and frames > 0 and .05 <= frames / rate <= 5 and peak > .1 and rms > .005 and clipped == 0
    # A signal-content check for the previously weak sounds, not an audibility threshold.
    if name in ['kick', 'tom']:
        result['passed'] = result['passed'] and mid_fraction > .05
    results.append(result)
report = {'date': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'tester': 'Assistant: actual PCM/FFT measurements', 'sourceCommit': SOURCE, 'method': 'PCM16 decode; RMS/peak; unwindowed whole-file FFT energy fraction from 250 to 4000 Hz', 'limits': 'Signal content and valid PCM do not prove audibility on the student laptop. Student listening remains pending.', 'assets': results, 'passed': all(result['passed'] for result in results)}
(ROOT / 'verification/hw2-step2/assets.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'passed': report['passed'], 'assets': [{key: result[key] for key in ['name', 'durationSeconds', 'rms', 'energyFraction250To4000Hz', 'passed']} for result in results]}, indent=2))
if not report['passed']:
    raise SystemExit(1)
