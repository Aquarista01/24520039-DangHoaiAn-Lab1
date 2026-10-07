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
| Step 2 | Implemented; assistant checks passed; student listening pending | verification/hw2-step2: 9/9 assets, 84/84 normal browser checks, 6/6 fault/recovery cases; laptop Kick/Low tom check still required |
| Step 3 | Not started | Pending keyboard adapter and rebinding test |
| Step 4 | Not started | Pending FIFO/state/cancellation tests |
