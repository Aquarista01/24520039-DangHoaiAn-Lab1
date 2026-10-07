# WBS 10 — final cross-homework review

Reviewed application commit: `7ac14abdd9be04d2fa80b0ac4b65a5fbf37a8e00` on `hw-atomic-rebuild`. This package reruns the relevant suites against the integrated pages, records actual new measurements and preserves earlier milestone evidence. It makes no application change.

[summary.json](summary.json) is the final aggregate. [run-manifest.json](run-manifest.json) records each script hash, start time, elapsed time, exit code and console output. [suite-sources.json](suite-sources.json) records hashes of the original and derived suites. [branches-and-host.json](branches-and-host.json) records branch/source integrity and the actual hosted access observations. Original reports keep their original dates.

## Checks

| Area | Fresh report | Method |
| --- | --- | --- |
| Portfolio accessibility/contrast | [portfolio-a11y.json](portfolio-a11y.json) | Four themes/width combinations × four Lab states; semantic structure, overflow, axe and computed contrast |
| Portfolio keyboard/storage | [portfolio-keyboard.json](portfolio-keyboard.json) | Trusted Tab/Shift+Tab/Enter/Space; 25 focus targets; normal/denied/invalid optional storage |
| Portfolio CSP | [portfolio-csp.json](portfolio-csp.json) | Eight header/meta configurations; separate intentional inline/external/frame probes |
| Portfolio performance | [after-summary.json](after-summary.json), [mobile LHR](after-mobile.json), [desktop LHR](after-desktop.json) | Fresh Lighthouse 13.5.0 mobile and official desktop profiles; all four categories, no skipped audit; complete JSON retained |
| Actual WAV assets | [audio-assets.json](audio-assets.json) | Nine PCM/FFT checks, frozen-source equality, nonzero signal/no clipping; not a listening test |
| Audio engine | [audio-browser.json](audio-browser.json) | Real native Audio/play/decode/polyphony; six explicitly labeled failure/recovery cases |
| Drum keyboard | [drum-keyboard.json](drum-keyboard.json) | Trusted upper/lowercase/modifier/editable/button inputs; HTML-only temporary A→Q rebinding |
| Recorder | [recorder-model.json](recorder-model.json), [recorder-browser.json](recorder-browser.json) | Virtual boundary model separately from native FIFO/replay/timing/UI/axe checks |
| Countdown | [countdown-model.json](countdown-model.json), [countdown-browser.json](countdown-browser.json) | Native elapsed waits separately from virtual UTC/timezone/boundary/clamping and synthetic lifecycle checks |
| Form service/validator | [form-service.json](form-service.json), [form-validator.json](form-validator.json) | Virtual service scheduler; independent exact validator golden cases |
| Form input/output | [form-input.json](form-input.json) | Real typed hostile strings/native local service; separate injected native-validation bypass fixture |
| Form states/lifecycle | [form-native.json](form-native.json), [form-lifecycle.json](form-lifecycle.json) | Native success/error/retry/Cancel/Reset; separately labeled virtual/injected deadlines/obsolete responses/lifecycle |
| Navigation | [navigation.json](navigation.json) | Trusted links/back links at 375/1440px light/dark; separate JavaScript-disabled round trip |
| Audit evidence | [audit-evidence.json](audit-evidence.json) | Fresh read of historical report links, counts, dates, SHA-256 and Git source/ancestry; not a new historical failure run |

## Reproduction and suite adaptations

Prerequisites: Node 24, Python with NumPy, Chromium and Playwright/axe-core/Lighthouse/chrome-launcher. Set `CODEX_PRIMARY_RUNTIME_NODE`, `CODEX_PRIMARY_RUNTIME_PYTHON`, `CODEX_PRIMARY_RUNTIME_NODE_MODULES`, `QA_NODE_MODULES` and `CHROMIUM_PATH` to the installed runtimes/packages/browser. From the repository root:

```sh
python verification/final-review/prepare.py
python verification/final-review/run.py
python verification/final-review/branches-and-host.py
python verification/final-review/summarize.py
```

The runner executes suites sequentially to avoid fixed-port collisions and timing/performance contention. It stops on a failure; `--resume` reuses only earlier passing executions whose exact script hash still matches. Each browser suite owns its server/browser in the same process. The hosted checker records the contemporaneous expected branch heads; a later checkout/ref must update those explicit expectations rather than treating current refs as historical measurements.

`prepare.py` exposes every adaptation: fresh output destinations/baseline metadata, preserving imported QA helpers, new portfolio navigation target order, completed form/keyboard/recorder expectations and accurate current-stage limits. Production modules and original milestone scripts/reports are unchanged. Complete LHR JSON uses compact whitespace; no audit/data is removed.

The first audio run still assumed no letter-key adapter: its later voice-count wait timed out. The first keyboard run still expected the recorder to remain Idle after Record, producing four failed checks. Both were stale QA assumptions from their original milestones. Their exact script/output evidence is retained in [run-manifest-initial.json](run-manifest-initial.json), [audio-suite-initial.mjs](audio-suite-initial.mjs), [run-manifest-audio-retry.json](run-manifest-audio-retry.json), [keyboard-suite-initial.json](keyboard-suite-initial.json) and [keyboard-suite-initial.mjs](keyboard-suite-initial.mjs). They are excluded from the passing final aggregate. [host-probe-initial.json](host-probe-initial.json) preserves a separate checker path error (`avatar.svg`; actual baseline asset is `portrait.svg`). No application fix or additional AI application defect is claimed for these harness errors.

## Source separation

`main` is `712f494`: the student-authorized cleanup restored the original Lab runtime in its current tree while preserving prior history. The reviewed Homework branch stays separate, with HW1 at the root and HW2/HW3 in independent directories. This review does not merge, rewrite history or modify main. Production `24520039.vercel.app` returned the original Lab HTML, so it is not the HW1 assessment page.

The reviewed Homework Preview returned HTTP 302 to Vercel SSO for an anonymous request. Its application response headers and unauthenticated assessor access remain unverified; redirect/sign-in headers are not recorded as HW CSP evidence. Local CSP checks enforce the repository header/meta policy. User-reported Preview OK at 18:38 on 7 October is recorded separately, without raw listening/recorder/form/Lighthouse/header captures.

Root icon/glyph contrast incomplete items remain explicit; zero axe violations is not full WCAG certification. Native Audio events/PCM checks do not establish laptop audibility. Virtual clocks/synthetic lifecycle are not real background suspension/BFCache or a timed instructor defense.
