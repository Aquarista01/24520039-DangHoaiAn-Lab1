# Lab 1 - Work Breakdown Structure (WBS) and task decomposition

Student: Dang Hoai An (24520039)

The original task contracts were recorded in the first Git commit, before implementation. The table below makes the WBS, output, and verification for each slice explicit. Each code stage was committed separately.

## Work Breakdown Structure (WBS)

| WBS | Task | Work package and contract | Output | Isolated verification |
| --- | --- | --- | --- | --- |
| **1** | **Planning** | Define component contracts, state machine, and checks before coding. | `TASK_DECOMPOSITION.md`, `project-rules.md` | First `docs(spec)` commit precedes implementation commits. |
| **2** | **Exercise 1 / T-01** | Build semantic DOM: one `h1`, zero `div`, skip link to `#main`, header, nav, main, sections, footer. | `index.html` | Inspect DevTools landmarks; Tab to and activate the skip link. |
| **3** | **Exercise 2** | **Responsive portfolio and theme.** | **Portfolio interface** | **Check 375px, contrast, and theme persistence.** |
| 3.1 | T-02A | Define CSS custom properties in `:root`, universal border-box reset, and accessible color pairs. | `styles.css` | Inspect computed styles and verify text contrast of at least 4.5:1. |
| 3.2 | T-02B | Build responsive skills and project grids using `repeat(auto-fit, minmax(min(100%, 280px), 1fr))`. | `styles.css` | Check desktop and 375px viewport; no horizontal scrolling. |
| 3.3 | T-02C | Make `#theme-toggle` keyboard accessible with `aria-pressed`; persist `theme` as `light` or `dark`. | `app.js` | Toggle twice, reload, inspect localStorage and console. |
| **4** | **Exercise 3** | **Event Hub with four data states.** | **Loading, Live, Empty, and Error UI** | **Exercise every state and Retry.** |
| 4.1 | T-03A | Show a CSS shimmer skeleton in `#event-status`; respect reduced motion. | `styles.css` | Select Loading; inspect skeleton and live region. |
| 4.2 | T-03B | Render the Live state from event data using DOM nodes and `textContent`. | `events.js` | Select Live; inspect event cards and metadata. |
| 4.3 | T-03C | Show Empty and Error messages; provide a keyboard operable Retry action. | `events.js` | Select Empty and Error, then activate Retry with Enter. |
| **5** | **Review** | Check the separate work packages and record verification limits. | `AI_WORKFLOW.md`, Git history, submission screenshots | Review task-specific commits and the evidence in the report. |

The task IDs follow the three exercises in the slides. WBS 1 and 5 record planning and review; WBS 2-4 cover the implementation. Only WBS 3 and 4 have numbered subtasks because they contain several distinct work packages. The original planning commit contains the task contracts, and the later documentation commits clarify the WBS presentation.

## DOM and data contract

The page uses only semantic HTML containers. Nav links target existing section IDs. All form fields have visible labels. Project cards are `article` elements. Event data is an array of `{title, date, location, type}` objects. The component exposes `renderEvents(state, events)` where `state` belongs to `{loading, ready, empty, error}`; data is never inserted with `innerHTML`. The Retry action reloads the local sample. Demo buttons let the assessor inspect each state without relying on an external API.

## Event hub state machine

`loading -> ready | empty | error`; `error -> loading` on retry. Manual demo controls can select any state. A monotonically increasing request token prevents an older timer from overwriting a newer state. The controls are buttons, and the content container has `role="status"` and `aria-live="polite"`.

## Verification log

Run `python3 -m http.server 5500` from this directory; open `http://localhost:5500`. Verify narrow and desktop screens, Tab and Enter, theme persistence, and all four event states. Exact measurements and screenshots are recorded in the submission PDF.

## Homework 1 - Production portfolio

This rebuild starts from the completed Lab 1 commit `8aa4676`. Branch: `hw-atomic-rebuild`. The existing main branch is preserved. The current implementation at main commit `66fe05a` can be used as a reference; this branch records its own work and checks.

Planning was committed before application changes. M1-M4 have isolated implementation and fresh local verification. The student reported the M3 Vercel check as OK; no raw online header capture was supplied. Do not copy previous audit scores into the new verification log. Each implementation commit includes its task-specific evidence and log/status updates; these do not broaden its application code scope.

| WBS | Milestone | Component contract | Allowed files | Acceptance checks | Planned atomic commit |
| --- | --- | --- | --- | --- | --- |
| 6 | HW1 planning | Record isolated work packages before implementation | TASK_DECOMPOSITION.md, project-rules.md, DEVELOPMENT_LOG.md | Four HW1 milestones present; no application code changes | docs(spec): define HW1 atomic milestones |
| 6.1 | M1: WCAG 2.2 AA audit | One h1; zero divs; distinct named landmarks; accessible names include visible labels; sufficient text/control contrast | index.html, styles.css | Axe audit light/dark; computed contrast >=4.5:1 for normal text, >=3:1 for large text/control boundaries; inspect 375px overflow | fix(a11y): contrast and landmarks |
| 6.2 | M2: Focus trap audit | Skip link moves focus to main; all controls reachable with keyboard; optional storage failure does not stop the page | app.js; related HTML only if a focus defect requires it | Tab/Shift+Tab/Enter through navigation and form to footer; repeat skip-link activation; storage-denied browser context; zero page errors | fix(nav): keyboard trap prevention |
| 6.3 | M3: Strict CSP | Same-origin scripts, styles and assets; zero inline scripts or event handlers; frame-ancestors in a response header | index.html, vercel.json | Source inspection; reload with enforced CSP and no violations; inspect actual Vercel headers after publishing | fix(security): enforce strict CSP |
| 6.4 | M4: Lighthouse 100 audit | Lightweight local assets, fixed image dimensions, efficient critical requests | Only files implicated by the measured audit | Run actual mobile/desktop Lighthouse; record URL, settings, score and date; optimize based on findings; keep actual results if below target | perf: optimize assets |

### Verification and execution protocol

1. Each chat turn handles one current work package. Do not implement the later milestones automatically.
2. Before a change, read project-rules.md and the current contract; inspect only relevant source.
3. Perform the isolated implementation, then run the stated checks. Report findings before the next milestone.
4. Inspect the diff and commit only the current work package. Additional defects get their own focused fix if needed.
5. Record the actual tester and environment. Assistant-run checks and student-run checks must be distinguished.
6. Future HW2/HW3 work gets a separate planning turn before implementation. HW2 begins with the HTML data-sound contract; HW3 will have the required five-or-more atomic slices and an evidence-backed AI_FAILURE_AUDIT.md.

### Milestone status

| Milestone | Status | Evidence |
| --- | --- | --- |
| Planning | Published as c62400a | Documentation-only commit; app files unchanged from baseline |
| M1 | Implemented; automated checks passed | verification/hw1-m1/README.md, before.json, after.json; manual screen-reader/user checks pending |
| M2 | Implemented; automated checks passed | verification/hw1-m2/README.md, before.json, after.json; 20 configurations / 160 checks; student/browser diversity checks pending |
| M3 | Local checks passed; student reports Vercel check OK on 7 Oct 2026 | verification/hw1-m3/README.md; assistant's earlier anonymous Preview check remains recorded as blocked |
| M4 | Implemented; local mobile/desktop Lighthouse all four categories 100 | verification/hw1-m4/README.md; full before/after LHRs; preload-check.json |

## Homework 2 - Drum Kit Engine (contract-first)

Source requirements: Lab 1 slide page 23 (keyboard example) and page 24 (four mandatory architectural steps). This plan starts after HW1 commit `4c1a65b` on `hw-atomic-rebuild`. No HW2 application files or audio assets are added in the planning task.

The implementation will live at `homework/drum-kit/`. The nine-pad mapping below follows the existing main reference `66fe05a`; this branch will implement and verify its own four steps. Existing main and production are preserved.

| WBS | Work package | Contract and boundary | Application files allowed | Actual acceptance checks to run in that step | Planned atomic commit |
| --- | --- | --- | --- | --- | --- |
| 7 | HW2 planning | Specify DOM, audio, keyboard and queue contracts before application changes | None; planning documents only | Four steps present; unique binding/path table; application diff empty | docs(spec): define HW2 contract and atomic milestones |
| 7.1 | Step 1: HTML data-sound contract | Semantic page, native pad buttons; key and sound mapping owned by HTML; responsive styling; no JavaScript implementation or script tag yet | homework/drum-kit/index.html, homework/drum-kit/styles.css | Parse all nine button contracts; one h1, zero divs, visible names and kbd; unique data-key values and same-origin relative sound paths; 375px and desktop overflow/focus/axe check; no JS file in this commit | feat(drum): define HTML data-sound contract |
| 7.2 | Step 2: independent polyphonic audio | External audio module and click adapter; each accepted hit creates its own Audio instance, including repeated hits on one pad; handle play failure; do not add keydown or recorder behavior | homework/drum-kit/audio.js, app.js, index.html (external module tag only), sounds/*.wav | All nine files load/decode; click pads; repeated same-pad and mixed-pad hits overlap; denied/failed playback yields accessible feedback and no unhandled rejection; real laptop listening check, especially Kick/Low tom | feat(audio): implement independent polyphonic playback |
| 7.3 | Step 3: keyboard adapter | keydown + event.key; normalize case; skip event.repeat, modifier/composition input and editable targets; dispatch through the same pad activation path as click; no keyCode/keypress/switch-case sound map | homework/drum-kit/keyboard.js, app.js | Lower/upper-case bindings; one hit for held mapped key; unknown/modifier/editable keys do nothing; Tab/Enter/Space still operate native controls; temporarily change a binding in HTML, reload and prove JS needs no edit | feat(drum): add keydown repeat-safe bindings |
| 7.4 | Step 4: FIFO beat recorder | Timestamp live input hits in arrival order; replay with original spacing; keep replay hits out of the recording queue; explicit state and cancellation; no array mutation during replay | homework/drum-kit/recorder.js, app.js, index.html (wire the recorder contract), styles.css (state styles only) | Record A-S-A and inspect increasing relative times/order; replay same sequence and spacing within documented tolerance; stop cancels pending replay callbacks; rapid start/stop/clear and empty replay; replay does not add hits; keyboard-accessible controls; queue/time bounds | feat(recorder): implement timestamped FIFO beat tape |

Evidence scripts, task-specific reports and DEVELOPMENT_LOG.md/status updates accompany their corresponding work package. They do not expand its application scope. Each step is a separate chat turn, checked and committed before the next step. Portfolio navigation integration and final cross-homework review will be their own later work package; do not mix those changes into the four steps above.

### HTML pad contract

Each pad is `button[type="button"].drum-pad` with:
- `data-key`: one unique lowercase character.
- `data-sound`: relative same-origin WAV URL; the engine reads this attribute, rather than defining its own sound-path table.
- Visible sound name and `kbd` key label; accessible name includes both.
- A stable pad element for transient visual feedback; animation respects reduced motion.

| Key | Visible sound | data-sound (relative to the drum page) |
| --- | --- | --- |
| a | Kick | sounds/kick.wav |
| s | Snare | sounds/snare.wav |
| d | Clap | sounds/clap.wav |
| f | Closed hat | sounds/hat.wav |
| g | Open hat | sounds/open-hat.wav |
| h | Low tom | sounds/tom.wav |
| j | Rimshot | sounds/rim.wav |
| k | Shaker | sounds/shaker.wav |
| l | Crash | sounds/crash.wav |

Step 1 defines these paths; Step 2 supplies and tests the files. A data-sound attribute does not itself request audio. Do not report audio playback as passed in Step 1.

Recorder DOM contract: `#record-btn`, `#stop-btn`, `#replay-btn`, `#clear-btn`; state label `#tape-state`; count `#beat-count`; ordered list `#beat-list`; polite live status `#record-status`. Step 1 supplies the markup, with Stop/Replay/Clear initially disabled. Step 4 implements their behavior. No inline onclick/style/script, no div containers, one h1, and external local CSS.

### Audio and activation contracts

- The audio boundary is `playPad(pad) -> Promise<boolean>`: read pad.dataset.sound, start one independent Audio voice, resolve true if playback starts, or false with accessible failure feedback. Missing files and denied playback must not cause uncaught errors.
- Click handling is an adapter. Keyboard handling is a separate adapter added only in Step 3. Both use a shared activation entry point; neither holds a duplicate sound map.
- Step 4 adds `activatePad(pad, source)` behavior with `source` equal to live or replay. Capture the input timestamp synchronously at activation, before awaiting audio. The queue records input intent; a later audio failure is reported separately, and is not falsely logged as successful sound playback.
- Keyboard bindings are derived from the HTML contract at initialization. Changing data-key and the visible kbd label, then reloading, must not require editing the engine or keyboard module. Keep the live-defense procedure small enough to demonstrate within the slide's three-minute window.
- Reuse the existing local WAV assets selectively in Step 2, after checking the nine files and the corrected Kick/Low tom versions at the frozen main reference. Do not copy a completed HW2 folder or its old tests as new implementation evidence.

### FIFO queue and recorder state contract

- In-memory queue: `{ key, at }[]`; `at` is milliseconds relative to the recording start from performance.now(). Append live input hits in arrival order. Equal timestamp values retain insertion order.
- States: idle, recording, replaying. Start Record from idle clears the previous queue and sets the time origin. Stop Recording returns to idle and retains the tape. Replay is available only from idle with a nonempty tape; Record/Clear are disabled during replay. Stop Replay cancels all pending callbacks and returns to idle. Clear is available only from idle and resets tape, count and list.
- Capture both click and keyboard live hits. Replay uses a snapshot of the queue and the same audio activation path with source=replay, so it cannot re-record itself.
- Playback scheduling uses each recorded offset from one replay time origin, not repeated equal intervals. Maintain a cancellation token/timer registry so callbacks from an old replay cannot fire after Stop or a new session. Manual live hits during replay may sound, but are not appended to the tape.
- Bounds: at most 256 hits or 120 seconds per take. On either limit, stop recording, retain the captured tape and explain the limit in the live status. An empty queue cannot replay.
- Recorded keys are valid under the current page contract; a page reload starts a fresh in-memory session. Render the list with DOM nodes/textContent, never innerHTML.
- Verification records actual ordering and timing tolerance, plus browser environment. Browser timer scheduling can vary; distinguish automated timing checks from a student listening test. Do not claim that a headless test proves audibility on laptop speakers.

### HW2 milestone status

| Work package | Status | Evidence |
| --- | --- | --- |
| Planning | Documented before implementation | This WBS and documentation-only diff |
| Step 1 | Implemented and locally checked | HTML/CSS only; verification/hw2-step1/result.json: 112/112 checks, four configurations, zero axe violations |
| Step 2 | Assistant checks passed; student-reported prior Preview OK | verification/hw2-step2: 9/9 assets, 84/84 normal browser checks, 6/6 fault/recovery cases; user reported all requested prior Preview checks OK on 7 October at 14:44, without a detailed device/listening capture |
| Step 3 | Implemented and locally checked | verification/hw2-step3/result.json: 180/180 checks and two HTML-only reload/rebinding checks; student live defense not timed |
| Step 4 | Locally checked; student-reported recorder Preview OK | verification/hw2-step4: 22 model, 92 normal browser and 6 integration checks; 21 axe audits; user reported OK on 7 October at 15:07, without a raw recorder capture |

## Homework 3 - Resilient landing page and AI failure audit

Source: supplied Lab 1 slide page 25. It requires three functional slices, at least five atomic implementation commits, and AI_FAILURE_AUDIT.md documenting three actual AI-induced defects with diagnostic methods and verified fixes. This plan starts after HW2 commit `a17b2d0` on `hw-atomic-rebuild`. No HW3 application file or audit report is created in this planning package.

Route: `homework/event-hub/`. Only the sample event metadata and form field/DOM naming contract were inspected in frozen main `66fe05a`; no completed countdown/form/service/validation implementation is reused. The page remains a clearly labeled coursework demo. Registration is simulated locally; no email, real booking, database, fetch request or persistent registration storage is introduced.

### Five implementation packages and a separate report

| WBS | Slice / work package | Contract and boundary | Application files allowed | Checks to run in that package | Planned atomic commit |
| --- | --- | --- | --- | --- | --- |
| 8 | HW3 planning | Define DOM, UTC clock, form/transport lifecycle, input policy and audit evidence before implementation | None; TASK_DECOMPOSITION.md and DEVELOPMENT_LOG.md only | Five implementation rows correspond to the three slices; exact metadata/interfaces present; no HW3 code/report added | docs(spec): define HW3 atomic milestones |
| 8.1 | Slice 1A: semantic landing/countdown contract | Static semantic event page, explicit UTC datetime, countdown slots and labeled form/receipt DOM; responsive CSS; no script yet | homework/event-hub/index.html, styles.css | One h1/zero divs, valid dl structure, exact UTC datetime, all labels/unique IDs, native field constraints, disabled static Submit, 375/1440px light/dark overflow/focus/axe | feat(event): define semantic landing and UTC contract |
| 8.2 | Slice 1B: drift-free UTC countdown | Independent clock module; external app module wires the HTML datetime; recompute from absolute clock, never decrement a stored counter | homework/event-hub/countdown.js, app.js, index.html (module tag and countdown wiring only) | UTC/timezone invariance; invalid/calendar/zone-less timestamps; fractional-second boundary, exact start, past event; delayed timers/background resync; repeated start/stop, pagehide/pageshow, no leaked timers; no every-second live-region spam | feat(countdown): implement absolute UTC clock |
| 8.3 | Slice 2: form state machine | Idle -> Submitting -> Success/Error; native validation, safe text rendering, deterministic local success/error transport and retry; basic state guard is present from the first async handler | homework/event-hub/registration.js, registration-service.js, app.js, index.html/styles.css (form state wiring only) | Valid success, simulated error/retry, invalid native fields, preserved values after error, disabled/loading controls and busy state, status announcements/focus, no navigation or outgoing registration request | feat(form): implement registration state machine |
| 8.4 | Slice 3A: double-submit and request lifecycle | Defense beyond disabled UI: synchronous in-flight lock, request generation, AbortController, cancel/timeout/reset/unload handling; obsolete callbacks cannot change a new session | homework/event-hub/registration.js, registration-service.js, app.js, index.html (cancel/reset wiring only) | Rapid double click/Enter/requestSubmit and direct controller re-entry cause one service attempt; delayed promise, cancel then retry, stale success/error ignored; 5-second timeout; timers/listeners cleanup and restored-page recovery; keyboard cancellation | fix(form): guard concurrent submissions and stale responses |
| 8.5 | Slice 3B: normalization and safe input/output | Independent validation module; normalize and bound a validated snapshot, allowlist interest, reject meaningless input; safe sinks remain textContent/DOM nodes from earlier stages | homework/event-hub/validation.js, registration.js, app.js, index.html (field errors/constraints only) | Whitespace-only name, control characters, Unicode/Vietnamese/apostrophe names, length boundaries, bad email/interest including bypassed native constraints; hostile HTML/SVG/event-handler notes render literally with no created executable nodes; valid correction/retry; axe/keyboard | fix(form): normalize inputs and enforce safe rendering |
| 8.6 | Mandatory AI failure report | Write evidence-backed descriptions, diagnostics, fixes and lessons for at least three distinct actual defects; do not manufacture broken app stages | AI_FAILURE_AUDIT.md, task-specific verification notes, DEVELOPMENT_LOG.md/status only | Match each defect to failing source/check and fix commit/passing evidence; clearly distinguish new runs from historical reports and application defects from harness errors | docs(audit): document three verified AI-induced defects |

The five application commits, not the planning/report commits, satisfy the minimum-five implementation rule. Each package is one separate chat turn with actual checks and its own commit. Never deliberately introduce duplicate-submit, XSS or timer drift to create an audit example. Evidence scripts/reports and the task log accompany the matching package. Portfolio navigation integration, final cross-homework review and merging into main are later packages; do not mix them into these slices.

### Event and DOM contract

- Sample event: Build for Everyone; sample venue: UIT Campus; startsAt `2026-11-21T02:00:00Z`, displayed event zone `Asia/Ho_Chi_Minh` (21 November 2026, 09:00). This is fixed coursework metadata from the frozen reference, not a claim about an actual UIT event.
- The source timestamp is `time#event-start[datetime]` in HTML. No separate JS target date or local date parsing. Use one h1 `#event-title`, a skip link to `main#main`, distinct section headings and an outgoing portfolio link.
- Countdown slots: `#days`, `#hours`, `#minutes`, `#seconds` in valid semantic structure, plus polite `#countdown-status`. Numeric updates are not a per-second live announcement.
- Form: `#registration-form`; fields `#attendee-name` (name, required, minlength 2, maxlength 80), `#attendee-email` (email, type=email, required, maxlength 120), `#attendee-interest` (interest, required; empty/design/code/both options), `#attendee-note` (note, optional, maxlength 300, visible hint).
- Demo failure choice: `#simulate-error`, with an explicit local-preview explanation; snapshot this boolean for the current attempt so a later UI change cannot alter an in-flight outcome.
- Controls: `#submit-btn`, `#cancel-btn`, `#reset-btn`; `#form-state`; polite atomic `#registration-status`; `#privacy-note`; per-field error nodes associated with their input. Submit/Cancel/Reset are disabled in the static contract until the form controller is implemented; fields remain inspectable/editable.
- Success receipt: `#registration-summary`, initially hidden, with text-only `#receipt-name`, `#receipt-email`, `#receipt-interest`, `#receipt-note`. No raw markup or request-debug details appear in the product flow. A local-preview disclaimer stays visible.
- Native HTML/CSS/ES6 only; zero divs; no inline handler/style/script; local CSS and, from 8.2 onward, external app module; current strict CSP meta/header; 375px first, system light/dark, visible focus and reduced motion.

### Countdown boundary

- `startCountdown({targetISO, onTick, onStatus, now, schedule, cancel}) -> stop`; defaults use Date.now and timeout scheduling. The independently testable clock does not query form controls.
- Accept a finite valid UTC ISO timestamp with explicit Z (`YYYY-MM-DDTHH:mm:ssZ` or millisecond form). Reject zone-less input and calendar dates normalized silently by Date.parse; validate by UTC round-trip. The HTML target is the single source of truth.
- Each tick derives remaining milliseconds from targetEpoch - now(). Convert positive remaining time using ceil(seconds), so the UI does not announce the event started before its actual boundary. Clamp at zero at/after the target; terminal state stops scheduling. Invalid target reports a useful status and starts no timer.
- Schedule against the absolute clock's next relevant boundary; never subtract one from an old displayed number. Delayed/clamped callbacks and visibility restoration recompute current time immediately. Scheduling overhead must not accumulate drift.
- Stop is idempotent and cancels owned timers/listeners. App lifecycle must stop on pagehide and reinitialize on pageshow, including a restored page. An invalid countdown must not prevent the unrelated form from initializing.
- Automated timezone tests use the same epoch under Asia/Ho_Chi_Minh, UTC and America/Los_Angeles; formatted event time stays in the explicit display zone. Record the exact virtual/native clock setup rather than labeling virtual advances as real elapsed waits.

### Form, transport and lifecycle boundary

- The form controller has only idle/submitting/success/error. Valid input from idle/error can begin a submit; success offers Reset for a fresh attempt. Invalid validation never calls the transport. Basic submitting-state rejection and safe output are implemented in 8.3, rather than intentionally leaving defects for 8.4/8.5.
- `submitRegistration(validatedPayload, {simulateError, signal}) -> Promise<receipt>` is a deterministic local mock, about 600ms per attempt. Payload fields are name/email/interest/note. The service never fetches/sends/stores data. Invalid/aborted attempts reject through handled paths. Transport is injectable for isolated rejection, delayed completion and attempt-count tests; no QA counter is added to the user flow.
- Slice 3A adds a synchronous in-flight guard before the first await, an attempt token, one AbortController and a 5,000ms deadline. Disabled Submit alone is not treated as the guard. Copy the current data/preview-error choice so later edits cannot mutate the pending request.
- While submitting: fields and Submit/Reset are disabled, Cancel is available, form aria-busy is true and feedback says submitting. Cancel retains input and returns to idle; Reset from nonpending states clears values/errors/receipt. A programmatic reset/dispose must also invalidate any pending attempt.
- Success shows a text-only receipt; Error retains input and exposes retry; timeout becomes a useful retryable Error. A stale resolve/reject/finally from a cancelled or older request cannot change new status, controls or receipt. All rejections are handled.
- Clean up service/deadline timers and listeners on settlement/abort/dispose. Interrupted submissions on pagehide must not stay stuck when pageshow restores the page; recover into a retryable state and reestablish countdown/controller lifecycle safely.
- State changes keep keyboard focus on an enabled control; validation focuses the first invalid field; do not create a modal or focus trap. Avoid repeatedly announcing the countdown through the form's live region.

### Input policy and safe output

- Independent `validateRegistration(raw) -> {ok, data, errors}`. Its data snapshot is immutable; transport/rendering use that snapshot. Native validity is the first check, but programmatic/bypassed constraints must also be checked by the controller's validator.
- Normalize Unicode NFC, trim outer whitespace, collapse name whitespace, remove disallowed control characters; reject an empty/short normalized name. Preserve Vietnamese diacritics, apostrophes, hyphens and ordinary Unicode names. Bounds match the form's native string lengths: name 2–80, email 1–120, note at most 300 after normalization; overlength input is rejected, not silently truncated.
- Email is trimmed, has no whitespace/control/newline injection, and passes the documented practical email check/native type=email validity. Do not claim full RFC address validation or change local-part case. Interest must be exactly design/code/both, even if the DOM option value was tampered with.
- Notes are plain text: normalize line endings and controls while retaining meaningful text, including literal <, > and quotes. Do not rely on deleting angle brackets as the XSS defense. No input is interpreted as HTML, JavaScript, URL or a style value.
- All user-derived messages/receipt values go through textContent or created text nodes. Never use innerHTML/outerHTML/insertAdjacentHTML/eval/new Function for user input. Do not pre-HTML-escape values and then display escaped entities through textContent.
- Tests use malicious img/svg/script/event-handler strings and inspect actual DOM/event outcomes, not just string filtering. Field errors clear when corrected; useful native/custom errors and keyboard focus are checked after failed validation and retry.

### AI failure audit evidence policy

The report covers the AI-assisted Lab 1 baseline and homework rebuild, with exact scope/provenance stated. Three distinct already-observed candidates have before/after evidence:

| Actual defect candidate | Failing evidence/source | Fix and passing evidence |
| --- | --- | --- |
| Accessible names omit visible link labels | Baseline/c62400a HTML; verification/hw1-m1/before.json: label-content-name-mismatch on four links | cdc93ec; verification/hw1-m1/after.json |
| Optional storage exceptions stop unrelated initialization or leave theme accessibility state stale | cdc93ec app.js and verification/hw1-m2/before.json storage-denied cases | 42bd2f6; verification/hw1-m2/after.json; treat related read/write failures as one storage-resilience category |
| Pad foreground switches before animated background, creating transient low contrast | 18fc999 CSS and verification/hw2-step4/before-feedback-fix.json: Recording contrast 1.20:1 light / 1.48:1 dark | a17b2d0; verification/hw2-step4/result.json: final state audits zero violations |

These are candidate report entries, not a completed report in this planning commit. In 8.6 inspect source/evidence again, identify the diagnostic method and engineering lesson, and add any genuine HW3 defect found during its implementation. Missing not-yet-implemented features, deliberate fault injection and test-harness assumptions are not counted as AI application defects. Do not invent countdown/XSS bugs that the code never had or copy the old main audit as new verification. Historical results retain their actual dates; fresh rechecks, if needed, are labeled separately. Student-reported Preview OK is not an assistant laptop test or timed live defense.

### HW3 milestone status

| Work package | Status | Evidence |
| --- | --- | --- |
| Planning | Documented before implementation | This WBS; only planning/log documents changed |
| 8.1 | Locally checked; student-reported Preview OK | HTML/CSS only; verification/hw3-step1/result.json: 148/148 checks across 375/1440px light/dark, zero axe violations/incomplete; user reported OK on 7 October at 15:31, without raw screenshots or keyboard capture |
| 8.2 | Locally checked; student-reported Preview OK | verification/hw3-step2: 47/47 model, 68/68 native browser and 21/21 integration checks; four axe audits zero violations/incomplete; user reported OK on 7 October at 15:48, without raw countdown/tab capture |
| 8.3 | Locally checked; student-reported Preview OK | verification/hw3-step3: 13/13 service, 144/144 native UI and 12/12 integration checks; 20 axe audits zero violations/incomplete; user reported OK on 7 October at 16:07 without a raw form-state capture |
| 8.4 | Locally checked; student-reported Preview OK | verification/hw3-step4: 188/188 native UI checks and 25/25 controller contract checks; 24 axe audits zero violations/incomplete; virtual deadlines/synthetic lifecycle explicitly labeled; user reported OK on 7 October at 17:26 without a raw Cancel/retry capture |
| 8.5 | Locally checked; student-reported Preview OK | verification/hw3-step5: 86/86 independent validator, 130/130 native/injected input-output, 188/188 native UI regression and 25/25 virtual/injected lifecycle regression checks; 40 axe audits zero violations/incomplete; hostile strings produced literal receipt text and no executable DOM/event outcome; user reported OK on 7 October at 17:38 without a raw input/correction capture |
| 8.6 | Report written; evidence/source checked | AI_FAILURE_AUDIT.md documents four distinct actual defects across the agreed Lab 1/homework scope, including the HW3 countdown defect; verification/hw3-audit/result.json: 30/30 fresh integrity checks, original before/after timestamps and sources preserved; no application rerun claimed |

## Homework separation and final integration

On 7 October at 17:50 (Asia/Ho_Chi_Minh), the student relayed the instructor's rule: homework may share the Lab repository, but must use a different branch or directory. The rebuild already uses `hw-atomic-rebuild`; HW2/HW3 also have dedicated directories. HW1's root portfolio changes remain assessed on this separate branch. Preserve the original Lab baseline at `8aa4676` and the existing main/history. Keep the homework branch separate for submission; this latest constraint supersedes earlier prospective references to merging homework into main in logs/reports. A deployment may serve the homework branch without changing that source separation.

| WBS | Work package | Contract | Application scope | Checks | Commit |
| --- | --- | --- | --- | --- | --- |
| 9 | Portfolio homework navigation | Add a native Homework anchor and a two-card section linking to HW2/HW3 routes; identify the root portfolio as HW1 in visible copy. Document branch/directory mapping. Reuse existing responsive CSS. | index.html only; separation notes in README.md, homework/README.md, project-rules.md and this WBS/log | At 375/1440px light/dark: native Tab/Enter links and back links, correct independent routes/assets, no 404/runtime/CSP error, focus/overflow/axe. Inspect no modifications to homework modules/assets and main branch. | feat(nav): link isolated homework pages from portfolio |
| 10 | Final cross-homework review | Run final relevant checks on the integrated branch, record current measurements and remaining user-only observations. Do not treat prior scores as new runs. | Only fixes justified by actual findings, each with an isolated commit | Portfolio/CSP/performance, drum input/audio/recorder, landing/countdown/form and audit references; verify submission branch/folder mapping | Separate review/fix package after student confirms navigation |
| 11 | Deployed CSP verification | Verify anonymous Homework access and the actual CSP response header for HW1 M3. | verification/publication/ and brief README links | Check deployed source bytes, HTTP responses, actual headers and source separation | Separate hosted verification after final review |

### Navigation package acceptance

- Preserve the Lab component's existing four-state demo and previously corrected visible/accessibility link names. Add a separately labeled Homework section and nav anchor; no duplicate IDs, new h1, divs, inline script/style/handlers, framework, JS routing or new network dependency.
- New native anchors use `homework/drum-kit/` and `homework/event-hub/` in the same tab. Existing homework back links resolve to the portfolio. The HW1 portfolio stays at `/` on the separate homework branch.
- Record fresh checks only for navigation/initialization in this package. It is not a complete audio/listening, recorder, registration, CSP-host or Lighthouse rerun; final cross-homework checks are WBS 10.
- Document the instructor's branch-or-directory rule and explicit GitHub branch URL in the README; keep implementation/deployment notes out of the product interaction flow.
- One work package per turn; do not run final review or change production/main in this navigation turn.

Status: WBS 9 planned before its HTML change, implemented and locally checked. verification/homework-navigation/result.json records 89/89 assertions and 12 zero-violation axe audits, with root icon/glyph incomplete items explicitly retained. WBS 10 is locally reviewed after student confirmation; the later deployed CSP check is recorded under WBS 11. No main merge is planned under the latest source-separation rule.

### Final review acceptance — WBS 10

Reviewed application head: `7ac14ab`; new evidence is in [verification/final-review](verification/final-review/README.md). All 18 application/evidence suites and the separate branch/host source checker completed. There are 1,398 passing assertions, nine valid unchanged PCM assets, 158 passing portfolio contrast measurements and two passing CSP probe groups. Lighthouse 13.5 mobile and desktop each scored raw 1.0 (100) in performance/accessibility/best-practices/SEO. Actual mobile LCP was 911.946ms and desktop LCP 250.723ms; TBT and CLS were zero. These are new assistant local measurements, not reused milestone scores or a hosted Lighthouse run.

Ninety-seven axe executions reported zero violations: 92 retain structured audit results, four audio assertions and one capped-recorder assertion retain their zero-violation outcomes. Twenty root audits have explicit glyph/icon contrast incomplete items; no full WCAG certification is claimed. Recorder native constructor-dispatch timing errors were within 0.9ms of recorded offsets, under the specified ±100ms tolerance; this does not measure audio output latency/audibility. Virtual timers/injected services and synthetic page lifecycle remain labeled separately.

The initial stale audio/keyboard-stage assumptions and an incorrect host-checker asset path are preserved with exact source/output in the review directory, followed by their corrected passing checks. They are QA harness errors, not new AI application defects. Original milestone scripts/evidence and application modules/assets remain unchanged.

At 18:38 on 7 October the student reported general Preview OK, without raw capture artifacts. Main's separately authorized cleanup commit `712f494` restored the current Lab runtime and preserved prior history; the Homework branch remains separate. Fresh anonymous Homework Preview access returned 302 to Vercel SSO; app response headers and assessor access remain unverified. Production returned the original Lab HTML, not HW1. At this review, a later anonymous-access/hosted-header check remained pending; its actual results are recorded under WBS 11. This final review changes no main/production source and performs no merge/history rewrite.


### Deployed CSP verification — WBS 11

At 19:25 on 7 October the student reported disabling Vercel Authentication and opening the Homework page. [Fresh anonymous HTTPS publication checks](verification/publication/README.md) subsequently passed 98/98 assertions over 31 responses for 28 runtime files plus the explicit portfolio and directory routes. Every response returned HTTP 200 without a sign-in redirect, matched the reviewed application bytes and carried the exact CSP header including frame-ancestors. GitHub deployment metadata ties the supplied Preview URL to application commit 7ac14ab; application files remain byte-identical at final-review commit a0396d4. Starting remote main remained 712f494 and Homework remained separate.

WBS 11's deployed source/CSP verification passed. WBS 10's earlier blocked-host observations and scores retain their original dates. Submission/capture instructions belong in chat and are not additional Homework deliverables. This package contains no application change, new hosted browser/Lighthouse/listening result, main merge or history rewrite.
