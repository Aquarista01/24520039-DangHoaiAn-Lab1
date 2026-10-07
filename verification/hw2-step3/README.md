# HW2 Step 3 — Repeat-safe keyboard adapter

Starting commit: `c7d1abc`. Application scope: new `keyboard.js` and integration in `app.js` only. Step 1 HTML/CSS, Step 2 audio engine/WAVs and all earlier evidence remain unchanged. Recorder behavior is not implemented.

The adapter builds its key→pad bindings from the HTML elements supplied by app.js. It listens to keydown and normalizes event.key to lowercase. It ignores repeat, composing, already-prevented, Control/Alt/Meta events and input/textarea/select/contenteditable/custom textbox targets. Shift is allowed for uppercase letters. Only a recognized noneditable letter hit is prevented and dispatched to the same activatePad function used by click. There is no duplicate sound-path table, keyCode, keypress or switch-case mapping. Unmapped Tab/Enter/Space retain their native behavior.

## Actual assistant checks

Fresh local Chromium 153.0.8010.0 under the repository's enforced CSP response header plus page meta. Constructor instrumentation returns real native HTMLAudioElement objects; normal keyboard inputs are trusted browser events. `result.json` contains the actual timestamp, assertions and observed key/media properties.

| Width | Theme | Assertions | axe violations |
| --- | --- | --- | --- |
| 375px | Light | 45/45 | 0 |
| 375px | Dark | 45/45 | 0 |
| 1440px | Light | 45/45 | 0 |
| 1440px | Dark | 45/45 | 0 |

Checks cover all nine lower/uppercase bindings, correct HTML-owned sound paths, one voice for a held mapped key with two real repeat events, a fresh hit after release, unknown/navigation/modifier keys, editable targets, rapid A-S-A polyphony, native focused-pad Enter/Space, native details activation, Tab/Shift+Tab order and visible focus, skip-link focus, static recorder state, semantic structure, no overflow and axe. Normal operation had no page/console/network/CSP errors or unhandled rejection.

Composition and already-prevented probes are explicitly synthetic KeyboardEvents to exercise those guards; no real operating-system IME session is claimed. Temporary editable fixtures are test-only and removed before axe. Native input/textarea retained the letter, select retained normal ArrowDown selection, and nested contenteditable/custom textbox targets did not trigger sounds or have their key default cancelled.

## HTML-only rebinding

The test serves a temporary HTML response changing only Kick's data-key `a→q` and visible kbd `A→Q`, reloads the page with unchanged JS, checks that a no longer activates and q/Q both play Kick, then restores the original response and reloads. Original repository HTML is never edited by this test. All three module files remain byte-identical before/after.

| Width | Result | Automated elapsed time, including restoration |
| --- | --- | --- |
| 375px | Passed | 361.56ms |
| 1440px | Passed | 291.76ms |

These are measured automated checks, not a timed student/instructor live defense. A student still needs to rehearse the slide's three-minute demonstration.

## Initial test correction

`initial-check.json` retains the first full run. Its uppercase assertions failed because Playwright's `Shift+a` input actually delivered key=`a`, shift=true in this environment. Sounds activated correctly, but it did not test uppercase normalization. The corrected input explicitly sends `Shift+A` (and the other uppercase letters) and asserts the observed uppercase key. The rebinding check now also asserts an actual Q event.

The first select assertion assumed letter typeahead would choose Alpha; Chromium left Beta selected although the key was not cancelled and no sound fired. The final check verifies the application's guard directly and adds native ArrowDown selection, which changes to Alpha. No application code was changed for either test-tool assumption. The corrected audit was then run fully and passed all four configurations plus both rebindings.

## Reproduce

With Node, Playwright and axe-core available:

```sh
node verification/hw2-step3/audit.mjs
```

Optional dependency/executable paths: QA_NODE_MODULES, CODEX_PRIMARY_RUNTIME_NODE_MODULES, CHROMIUM_PATH. The script serves the repository itself, writes result.json and exits nonzero on failure.

Student live-defense rehearsal:
1. In `homework/drum-kit/index.html`, change Kick's `data-key="a"` to `data-key="q"` and `<kbd>A</kbd>` to `<kbd>Q</kbd>`.
2. Save and reload the page, then click the heading/blank area to focus the page.
3. Verify a no longer plays Kick; q and Shift+Q play Kick. No JavaScript change is needed.
4. Restore a/A, save/reload and verify the original binding. Keep this temporary rehearsal out of the final committed mapping.
5. Measure your own elapsed time; do not present the automated milliseconds as your live-defense time.

Limits: headless playback does not prove student laptop audibility. The Step 2 Kick/Low tom listening check is still pending. No authenticated Vercel keyboard check, student timed defense or recorder behavior is claimed. Main/production remain preserved.
