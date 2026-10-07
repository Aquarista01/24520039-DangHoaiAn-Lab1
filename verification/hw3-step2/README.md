# HW3 Step 2 — Absolute UTC countdown

Starting commit: `6b8a607`. Application scope: new `countdown.js` and `app.js`, plus the external module tag and countdown fallback text in `index.html`. Event/form markup and CSS are otherwise unchanged. No form controller, service or validator is introduced.

`startCountdown({targetISO, onTick, onStatus, now, schedule, cancel})` returns an idempotent stop function. It accepts explicit UTC timestamps ending in Z, with optional three-digit milliseconds, and validates a UTC round-trip to reject normalized invalid dates. Each update uses the target epoch minus the current clock, rounds positive seconds upward and clamps at zero. The next timeout follows the absolute boundary of the value emitted, accounting for rendering overhead. Numeric slots are not live regions; status changes announce running/start/error, not every second.

The adapter reads only `time#event-start[datetime]`, updates text with textContent, stops its timer/removes its visibility listener on pagehide, and reinitializes on pageshow. A visible signal immediately recomputes the clock and replaces the old timer. Repeated lifecycle events do not duplicate timers/listeners. Invalid metadata has useful feedback, no timer and does not throw or disable the unrelated static form. Terminal events own no countdown timeout; the adapter retains its visibility listener until pagehide so a corrected clock/target can be re-read on restoration.

## Actual assistant checks

| Check group | Passed | Clock/environment |
| --- | --- | --- |
| Production-module contract | 47/47 | Injected virtual clock and queued scheduler |
| 375px light | 17/17 | Chromium 153.0.8010.0, native Date.now/setTimeout |
| 375px dark | 17/17 | Same native browser clock |
| 1440px light | 17/17 | Same native browser clock |
| 1440px dark | 17/17 | Same native browser clock |
| Browser integration | 21/21 | Labeled virtual-clock, metadata fault and no-JavaScript cases |

`model-result.json` and `result.json` preserve the actual timestamps, setup and observations. Module checks cover ceil/decomposition boundaries, exact/past start, valid leap-year/millisecond/year-zero timestamps, malformed/zone-less/rollover dates, delayed/backward/nonfinite clock, cancellation including timer ID zero, blocked stale callbacks, 50 repeated sessions and rendering overhead. These are virtual advances, not real multi-minute waits.

The four normal browser cases measured actual waits of 3158, 3156, 3156 and 3155ms. The countdown advanced and matched the current absolute clock within one displayed second, without changing its polite status on ordinary ticks. All four axe 4.14.0 audits had zero violations and zero incomplete items for WCAG A/AA tags through 2.2 and best-practice. Native skip-link/focus access, one h1/zero divs, external module/CSP, no overflow and unchanged disabled form passed. No normal page/console/network/CSP error occurred. The assistant inspected 375px light and 1440px dark screenshots; active numbers fit their columns and labels remained aligned.

Integration froze the same epoch under Asia/Ho_Chi_Minh, UTC and America/Los_Angeles: all yielded 86462 seconds and the same explicit Vietnam event display. Virtual browser tests exercised 1250ms/1000ms/1ms/exact-start boundaries, past start, a 23750ms timer skip, restored-page elapsed time and visibility resynchronization after a clock correction. Three invalid HTML timestamps displayed useful feedback without a timer and left the form editable; corrected metadata reload recovered. The JavaScript-disabled page retains its event time, explanatory fallback and disabled form.

Lifecycle tests dispatch synthetic pagehide/pageshow events, including persisted=true, and synthetic visibility signals through the actual adapter. Twenty cycles in each native configuration leave exactly one timer/listener while active and zero while paused. These prove the event-handler behavior, not actual browser BFCache entry or operating-system background suspension. Timezone/boundary/clamping tests use Playwright's virtual clock, explicitly distinct from the four native elapsed waits.

## Actual defect found and fixed in this package

The first module run passed 45/46 checks. With 1250ms remaining, a 300ms render crossed the next second boundary. The initial scheduler recomputed ceil after rendering and scheduled 950ms until zero, leaving the already-emitted value of 2 stale instead of immediately showing 1. `before-boundary-fix.json` contains that actual failed result and the exact failing module source plus SHA-256.

The fix schedules against the next boundary of the value actually emitted, clamped to 0..1000ms. If rendering has crossed it, the delay is zero and the next callback recomputes immediately. The final 47/47 run also verifies the resulting one-second correction. This was an AI-assisted implementation defect discovered during testing, not an intentionally unsafe stage or test-harness error. It can be reviewed in the later mandatory audit report; that report is not authored in this package.

## Reproduce

```sh
node verification/hw3-step2/model-check.mjs
node verification/hw3-step2/audit.mjs
```

The browser script needs Playwright and axe-core, with optional `QA_NODE_MODULES`/`CODEX_PRIMARY_RUNTIME_NODE_MODULES` dependency roots and `CHROMIUM_PATH`. It starts/closes its own CSP-enabled local HTTP server and browser. Optional `SCREENSHOTS_DIR` writes inspection images outside the repository. Both scripts write their reports and exit nonzero on failure. Timer/listener observers and axe are test instrumentation, not product counters or application scripts.

Limits: assistant local verification, not a student or hosted-header result. No live-defense timing, actual BFCache/background suspension, real registration, double-submit or XSS claim is made. Absolute countdown accuracy depends on the device clock; no server time synchronization is introduced. Existing main/production and all earlier historical evidence are preserved.
