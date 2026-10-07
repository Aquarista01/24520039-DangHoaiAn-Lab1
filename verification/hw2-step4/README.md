# HW2 Step 4 — Timestamped FIFO beat recorder

Starting commit: `18fc999`. Application scope: new recorder.js, shared activation/UI integration in app.js, recorder help/state attributes in HTML and state/feedback CSS. Audio.js, keyboard.js and all WAVs are unchanged. Earlier evidence is preserved.

The production recorder appends `{key, at}` in input arrival order. `at` is performance.now relative to recording start, captured synchronously before the audio play promise. Equal timestamps retain insertion order. The queue records input intent, so a blocked sound still appears as a hit while pad-status separately reports playback failure.

Replay schedules a cloned take against one time origin. It uses the shared activation path with source=replay and does not append to the recording queue. Timer cancellation plus a generation token prevent callbacks from a stopped replay affecting a later session. Snapshots are copies, not mutable access to the internal tape.

| State | Controls available | Tape behavior |
| --- | --- | --- |
| Idle, empty | Record | Cannot replay |
| Idle, saved take | Record, Replay, Clear | Record begins a fresh take; Clear empties it |
| Recording | Stop | Append live input; automatic stop at 256 hits or 120 seconds |
| Replaying | Stop | Retain take; manual pad hits may sound without being appended |

Stop during replay cancels future scheduled hits. Already-started sound tails finish naturally. Replay returns to Idle after dispatching the last scheduled hit, rather than waiting for the last WAV tail. Reload begins an empty in-memory session. Controls move focus to an enabled action when the focused control becomes disabled. The bounded ordered list is focusable and keyboard-scrollable when populated; rendering uses DOM nodes/textContent, never innerHTML.

## Actual verification

| Suite | Result | Environment |
| --- | --- | --- |
| Recorder contract/model | 22/22 | Production module with an injected deterministic clock/scheduler |
| Native browser, 375px light | 23/23 | Chromium 153.0.8010.0 with enforced CSP |
| Native browser, 375px dark | 23/23 | Same |
| Native browser, 1440px light | 23/23 | Same |
| Native browser, 1440px dark | 23/23 | Same |
| Additional integration | 6/6 | Delayed/denied play cases, capped DOM/list and reload |

`model-result.json` records exact FIFO offsets, initial silence, equal timestamps, no early hits, immutable snapshots, transition guards, stop/new-session stale callback rejection, clear/reset, invalid input, 255/256-hit boundaries, the 120-second timer, delayed-timer input rejection, 30 rapid sessions, scheduler-overhead compensation and a throwing replay adapter. Virtual time explicitly avoids waiting 120 real seconds; it is not a real-time laptop test.

`result.json` records fresh local assistant browser checks with real native Audio objects and trusted keyboard/click input. Mixed keyboard/click A-S-A, recorded offsets, replay order, queue preservation, live hits during replay, Stop cancellation, Clear, keyboard controls/focus, five rapid sessions and semantic/CSP checks all passed in four configurations. No normal page/console/network/CSP error or unhandled rejection occurred.

Timing tolerance was fixed at ±100ms in the audit. Audio constructor dispatch timestamps are compared to recorded input offsets from the trusted Replay click; native playing/ended events are retained separately. Maximum measured absolute dispatch error was 85.50ms during the audit workload. This does not measure acoustic output latency or promise identical timing in every browser/device.

Axe ran in initial, recording, saved, replaying and cleared states for each configuration, plus the capped-list scenario: 21 audits, zero violations. State observations before/after each run are recorded. The assistant visually inspected 375px/dark screenshots of the empty and 256-hit states; the list stayed bounded, labels fit and no horizontal overflow appeared.

Additional integration checks deliberately delay a native play promise by 320ms to show the queue/timestamp exist before resolution; inject denied play to show input intent survives failure; then use denied play during 257 activations to verify the 256-hit cap without a 257-voice playback stress test. The capped list remains keyboard-scrollable, accessible and bounded. These injected cases are labeled separately from normal native playback.

## Actual defect and test corrections

- `initial-check.json`: first browser harness aborted because `[data-key="a"]` also matched a recorded list item. Scoping pad lookups to `.drum-pad[data-key]` fixed the test. Production adapters already used the pad collection.
- `before-feedback-fix.json`: the first completed browser audit found a real transient contrast defect during Recording. Pad text switched to button-text immediately, while background-color was still transitioning through the old soft background. Axe measured 1.20:1 in light and 1.48:1 in dark instead of 4.5:1. Removed only the background-color transition; text/background now switch together, retaining the transform feedback and reduced-motion behavior. This feedback-state CSS fix belongs to the current recorder/a11y verification package.
- That run also read scrollTop immediately after End, before Chromium's native scroll animation advanced. The final test waits for observed nonzero scrollTop; no app scrolling change was required.
- The final full audit passed after the real CSS fix and test correction. The deterministic model passed before that feedback fix and is unaffected by CSS.

## Reproduce and student check

With Node, Playwright and axe-core available:

```sh
node verification/hw2-step4/model-check.mjs
node verification/hw2-step4/audit.mjs
```

Optional paths: QA_NODE_MODULES, CODEX_PRIMARY_RUNTIME_NODE_MODULES, CHROMIUM_PATH, SCREENSHOTS_DIR. The browser script owns its HTTP server and writes result.json; the model writes model-result.json. Both exit nonzero on failure.

On the new Preview: Record → A, pause briefly, S, pause longer, A → Stop → Replay. Confirm the list is A-S-A, the spacing is retained and the hit count stays 3 after Replay. Replay again and press Stop before all hits occur; confirm later hits are cancelled. Clear should return Hits to 0. Test controls with Tab/Enter/Space as well.

Student update before this package: on 7 October at 14:44 Asia/Ho_Chi_Minh, the user reported all requested prior Preview checks OK. This is a student-reported result, not assistant access to the user's speakers, a detailed listening capture or a timed key-rebinding defense. No student recorder test is claimed. Main/production and old history remain preserved.
