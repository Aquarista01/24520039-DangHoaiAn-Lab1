# HW3 Step 3 — Local registration state machine

Starting commit: `d976694`. Application scope: new `registration.js`/`registration-service.js`, a form initializer in `app.js`, and form feedback/state wiring in HTML/CSS. Countdown code is unchanged.

The controller uses idle/submitting/success/error. Native validation blocks invalid input before transport; visible field messages and aria-invalid clear when corrected. A valid submit captures a frozen data snapshot and the simulation choice, then synchronously enters Submitting before calling the injectable service. The basic state guard rejects pending/success re-entry. Success shows a text-only receipt, with the interest's visible HTML option label, and enables Reset. Error retains input and enables retry; turning off the simulation allows the same entries to succeed. Reset clears input/errors/receipt and returns to Idle. Pending Reset is blocked.

The independent service resolves or rejects locally after 600ms, with no fetch, email, booking or storage. It snapshots data, handles an optional pre-existing/in-flight AbortSignal and removes its own timer/listener on settlement or abort. The controller will wire cancellation/abort/timeout in Step 4; Cancel remains disabled in this package. Its basic dispose detaches listeners and ignores future completion, but it does not yet abort the service or recover interrupted page sessions.

While pending, fields/Register/Reset are disabled and the form is aria-busy. The polite atomic status sits outside that busy region so feedback is not suppressed by it. Focus transfers to the status while pending, to Reset on success or Retry on error; Reset focuses the name field. Receipt text always uses textContent. No independent normalization module or full hostile-input test is claimed yet.

## Actual assistant verification

| Check group | Passed | axe audits / violations / incomplete |
| --- | --- | --- |
| Production local service | 13/13 | Not a DOM test |
| 375px light | 36/36 | 5 / 0 / 0 |
| 375px dark | 36/36 | 5 / 0 / 0 |
| 1440px light | 36/36 | 5 / 0 / 0 |
| 1440px dark | 36/36 | 5 / 0 / 0 |
| Isolated browser integration | 12/12 | Labeled fault/guard/fallback checks |

`service-result.json` contains the actual timestamp and 13 production-service assertions: 600ms scheduling, frozen snapshot, success/failure, optional signal, pre-abort/in-flight abort, timer/listener cleanup, obsolete callback settlement and type-invalid input. It uses native Promise/AbortController with replaced global timers restored after testing. This is virtual dispatch, not a real 600ms wait.

`result.json` contains fresh native Chromium 153.0.8010.0 observations under repository CSP header/meta. The four normal UI cases use the actual 600ms service without a transport mock, record the real elapsed waits and inspect all four FSM states plus native validation. All 144 assertions and 20 axe 4.14.0 audits passed. Axe checks WCAG A/AA tags through 2.2 and best-practice; it alone does not certify full conformance.

Normal checks cover initial control states, native required/minlength/type=email constraints, visible associated errors and valid corrections, forward/reverse Tab order/skip link, pending busy/disabled/focus state, exact text-only receipt with literal `<3` and multiline note, successful Reset, simulated error with preserved values, and native Enter retry without retyping. Additional viewport checks place email near the top before Enter and confirm pending/Reset focus is visible; Reset also returns to a visible name field. The submitting axe scans completed while the real form was still pending. Countdown remained active throughout. No outgoing registration request, navigation, local/session persistence, page/console/CSP error, failed response or unhandled rejection occurred.

The isolated browser fixture suppresses only the app bootstrap and creates the actual controller with labeled injected transports. It checks invalid/direct re-entry, pending Reset rejection, immutable entry-time data/error choice, deferred snapshot receipt, success re-entry, synchronous throw/rejection/retry, synchronous service re-entry and basic idempotent dispose. These are fault/guard tests, not normal production requests. Separate real-app checks show a bad countdown target does not stop form success and JavaScript-disabled fallback retains help/privacy with disabled Submit.

The assistant inspected 375px light success, 375px dark error, 1440px dark success and 1440px light error screenshots. Labels, receipt text and retry controls were readable and did not overlap or overflow. Screenshots contain synthetic sample entries; none are prefilled in the shipped HTML. The final focused viewport audit also passed; only the test assertions were expanded, with no extra application fix needed.

## Reproduce

```sh
node verification/hw3-step3/service-check.mjs
node verification/hw3-step3/audit.mjs
```

Browser dependencies: Playwright and axe-core, optionally located via `QA_NODE_MODULES`/`CODEX_PRIMARY_RUNTIME_NODE_MODULES`; set `CHROMIUM_PATH` for an installed browser. The audit owns and closes its CSP-enabled local HTTP server/browser, writes the report and exits nonzero on failure. Optional `SCREENSHOTS_DIR` saves visual QA outside the repository. The service check similarly writes its report and restores replaced globals. All observers, fixture counters and axe are test instrumentation, not application code.

Limits: local assistant checks, not student, Vercel header or live-defense evidence. Explicit in-flight lock/generation tokens, controller cancellation/deadline, pending-reset invalidation and page lifecycle recovery are Step 4. Independent bounds/normalization and actual hostile-payload DOM tests are Step 5. No such future checks are labeled passed here. Main/production and historical reports remain preserved.
