# HW2 Step 2 — Independent polyphonic audio

Starting commit: `6ed1d97`. Application changes: new `audio.js`, new click adapter `app.js`, nine WAV files and one external module tag in the Step 1 HTML. CSS and the nine pad contracts are unchanged. No letter-key adapter or recorder implementation is included.

`playPad(pad)` reads the current `data-sound`, creates a fresh native Audio voice for each hit, calls play in the activation window and resolves a boolean. Active voices are retained until their ended/error event, then released. Denial, missing paths and playback failures update the existing polite status through textContent. The click adapter supplies transient pad feedback and a shared activation function for later steps. Native Enter/Space still produce a button click; that is not the future letter-key adapter.

## Actual asset checks

Only the nine WAV assets were selectively copied from frozen main `66fe05a243cdc936c427179d445cfb6bfb148642`; no previous app implementation or report was copied as new code/evidence. `assets.py` measures those actual files and verifies byte equality against that source. `assets.json` records Git blob/SHA256, size, PCM properties, duration, peak, RMS, clipped-sample count and FFT band energy for each file.

- 9/9 assets match the frozen source, decode as mono PCM16 at 22,050 Hz, contain nonzero signal and have zero clipped samples.
- Kick: 0.42 seconds, RMS 0.1464, peak 0.9200; 22.82% of whole-file FFT energy is in 250–4000 Hz.
- Low tom: 0.40 seconds, RMS 0.1681, peak 0.9200; 38.01% of energy is in that band.
- The first asset assertion incorrectly assumed 44,100 Hz. `initial-assets-check.json` retains that failed run. Inspecting the actual headers established 22,050 Hz; the check was corrected without resampling or modifying any WAV.

The measurements establish valid signal content, not audibility on a particular speaker. A real student laptop listening check is pending.

## Actual browser checks

Fresh local Chromium 153.0.8010.0 with the repository's enforced CSP response header plus page meta. The constructor observer returns real native HTMLAudioElement objects; normal playback is not mocked. Browser Web Audio decoding is test instrumentation, not the application engine. `result.json` records the actual timestamp and all assertions/media events.

| Width | Theme | Normal assertions | axe violations |
| --- | --- | --- | --- |
| 375px | Light | 21/21 | 0 |
| 375px | Dark | 21/21 | 0 |
| 1440px | Light | 21/21 | 0 |
| 1440px | Dark | 21/21 | 0 |

Normal checks: all nine files load/decode, each pad starts its own native voice using its HTML path, three repeated Kick hits overlap, Crash/Snare/Low tom overlap, all voices finish naturally, transient feedback clears, a direct independent playPad call resolves true and reads a temporarily changed DOM sound path, native Enter/Space work, letter keys and recorder behavior remain absent, semantic structure/CSP remain valid and the page does not overflow. Normal loading/playback had no page/console errors, failed responses, unhandled rejections or CSP violations.

The first browser run failed the simultaneous-three-Kicks assertion in three configurations: Locator.click waited for the transient pad transform to stabilize, spacing hits about 365ms apart. A 420ms Kick can finish before the third slow test click. `initial-browser-check.json` retains that run and its events. The corrected test sends real trusted mouse clicks at the pad centers without the actionability delay, then verifies three simultaneously playing native voices. It also permits currentTime to be zero at the instant a new voice starts; natural completion later proves time progression. Application code was unchanged. After adding the direct engine/DOM-path assertion, the final full audit again passed all four configurations.

## Failure and recovery checks

All six cases passed with polite feedback, no uncaught page error/unhandled rejection, and successful real playback after recovery:

| Case | Method |
| --- | --- |
| Denied playback | Injected NotAllowedError rejection from play; restore native play for recovery |
| Missing file | Real HTTP 404 for a temporary absent path |
| Invalid WAV | HTTP route supplies corrupt data; native decoder rejects |
| Constructor failure | Injected constructor throw; restore native Audio for recovery |
| Missing contract field | Temporarily remove data-sound; restore it for recovery |
| Error after playback starts | Inject an error event after native playback has begun; next hit recovers |

Pre-start failures were also called through the independent engine and resolved false. The post-start event case cannot retroactively change an already-resolved successful play promise; it tests the later error feedback/cleanup path. Expected fault-case network/decoder console messages are retained separately from normal runtime results. Injected policy/constructor/error-event tests are not labeled naturally occurring browser failures.

## Reproduce and student listening

With Python/numpy and Node/Playwright/axe-core available:

```sh
python verification/hw2-step2/assets.py
node verification/hw2-step2/audit.mjs
```

Optional dependency/executable paths: QA_NODE_MODULES, CODEX_PRIMARY_RUNTIME_NODE_MODULES, CHROMIUM_PATH. The browser script starts/closes its own local HTTP server, writes result.json and fails on an unsuccessful assertion.

Student check: open the Vercel Preview for the rebuild branch, visit `/homework/drum-kit/`, allow sound, and use the mouse to click every pad. Confirm especially Kick and Low tom on laptop speakers, then click Kick repeatedly and several different pads quickly. Report what was actually heard and any blocked/missing sound. Do not use the letter shortcuts or recorder to judge this stage; those are Steps 3 and 4.

Limits: these are fresh assistant local checks, not student listening results or authenticated Vercel playback tests. No claim of laptop audibility is made. Main/production and Step 1 evidence remain preserved.
