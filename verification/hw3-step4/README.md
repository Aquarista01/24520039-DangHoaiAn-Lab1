# HW3 Step 4 — Concurrency and request lifecycle

Starting commit: `d97b7e3`. Application scope: registration controller, lifecycle wiring in app.js and Cancel/Reset hint wiring in HTML. The actual service, countdown, CSS and earlier evidence are unchanged.

The controller acquires an explicit in-flight lock before native validation or callbacks, assigns a generation token and snapshots valid data/simulation choice. Each request owns an AbortController and a 5000ms deadline. Disabled UI and DOM state labels are not the guard. Only the current token can render a result or release the lock; cancellation races the transport so the submit Promise settles even if that transport ignores AbortSignal. Late success/rejection/finally/deadline callbacks cannot alter a newer attempt. The monotonic elapsed deadline is checked at result time as well as by timeout, so a delayed timer cannot admit an overdue response.

Cancel is enabled/focused while pending, aborts the request, retains entries and returns to Idle. Native Reset remains disabled while pending, while programmatic Reset invalidates/aborts any pending work and clears the form. Timeout gives a retryable Error and preserves input. Settlement/abort/dispose cancel owned deadlines; the unchanged real service also cancels its 600ms timer and removes its abort listener. The polite status stays outside aria-busy. Focus goes to enabled Cancel/Retry/Reset/name controls with native scrolling.

The app suspends registration on pagehide and resumes it on pageshow independently of countdown. Suspend aborts pending work, detaches the six form/control listeners, keeps input and records a retryable interrupted Error. Resume attaches once and restores enabled controls. Nonpending state and a successful receipt survive this lifecycle. Dispose is idempotent, aborts/settles work, detaches listeners and blocks further entry.

## Actual assistant verification

| Check group | Passed | axe audits / violations / incomplete |
| --- | --- | --- |
| 375px light, actual local service | 47/47 | 6 / 0 / 0 |
| 375px dark, actual local service | 47/47 | 6 / 0 / 0 |
| 1440px light, actual local service | 47/47 | 6 / 0 / 0 |
| 1440px dark, actual local service | 47/47 | 6 / 0 / 0 |
| Controller request/lifecycle contract | 25/25 | Virtual clock and injected transports |

`result.json` records fresh native Chromium 153.0.8010.0 under repository CSP header/meta. All 188 native UI assertions and 24 axe 4.14.0 audits passed. Normal cases execute the real 600ms service; a test-only call/signal observer is inserted into the served service module to count attempts without adding counters to product code. Timer/listener observers live only in instrument.mjs. The measured initial success waits were 647/642/643/640ms. Checks also rerun native validation, keyboard access, success/error/retry/Reset, exact text-only receipt, no navigation/request/storage, countdown independence and viewport focus. Axe checks WCAG A/AA tags through 2.2 and best-practice, not a full certification.

New native cases prove keyboard Enter on Cancel retains input, aborts the real service and leaves no owned timer/abort listener; a 700ms subsequent wait produces no old receipt. Rapid double click/requestSubmit/submit-event dispatch invokes exactly one service. Pagehide interrupts a real pending service, removes listeners/timers and preserves input; pageshow enables retry and succeeds. Twenty repeated synthetic lifecycle cycles per configuration preserve success receipt and maintain zero/six listeners while suspended/active. No normal console/page/failed request/CSP error or unhandled rejection occurred. Mobile light success/dark error screenshots were inspected; no clipped/overlapping controls or receipt were seen.

`contract-result.json` contains 25 fresh tests against the actual controller in an isolated browser fixture, with Playwright's virtual timer/performance clock and labeled injected transports. Covered cases include validation-time re-entry, DOM-enabled submit and falsified data-state bypass attempts, immutable payload/simulation choice, non-cooperating cancellation, immediate retry, obsolete success/rejection/finally, programmatic pending Reset, synchronous throw/rejection/re-entry, 4999/5000ms deadline boundaries, stale timeout callback and retry at 4999ms. Separate performance.now offsets simulate an overdue response/rejection before any timer dispatch; both become timeout Error. Suspend/resume/dispose settle old submit Promises, abort signals and clean deadlines/listeners. Fifty suspend/resume cycles preserve the receipt without duplicate listeners. All injected late rejections are handled.

## Reproduce

```sh
node verification/hw3-step4/audit.mjs
node verification/hw3-step4/contract-check.mjs
```

Use Node with Playwright and axe-core. Optional module roots: QA_NODE_MODULES/CODEX_PRIMARY_RUNTIME_NODE_MODULES; CHROMIUM_PATH selects an existing browser. Each script owns/closes its local CSP HTTP server/browser, writes its report and exits nonzero on failure. SCREENSHOTS_DIR optionally saves inspection images outside the repository. Native and fixture checks run in separate scripts with their clock/transport boundaries recorded.

Limits: virtual 5-second boundaries are not real elapsed waits. Pagehide/pageshow persisted signals are synthetic, not proof of actual BFCache entry or operating-system suspension. The non-cooperating transport is deliberately injected QA, not an actual defect or a real registration backend. No student, hosted-header or live-defense check is claimed. Independent normalization/bounds and hostile-payload DOM execution tests remain Step 5. Main/production and historical reports are preserved.
