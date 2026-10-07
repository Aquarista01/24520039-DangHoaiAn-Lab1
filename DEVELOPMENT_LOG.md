# Homework rebuild development log

Student: Đặng Hoài An - 24520039
Branch: hw-atomic-rebuild
Starting commit: 8aa4676

## Task 6 - HW1 planning

Date: 7 October 2026 (Asia/Ho_Chi_Minh).
Scope: define the four HW1 milestones, their contracts, checks, allowed files and atomic commit boundaries.

Actions actually performed by the assistant:
- Fetched the public GitHub repository and inspected current main (66fe05a).
- Read the Lab 1 baseline rules, WBS and development notes.
- Created a local rebuild branch/worktree from 8aa4676.
- Added the HW1 milestone plan and this execution protocol.
- Checked that the application files were unchanged from the baseline and the documentation diff was free of whitespace errors.

Not yet performed:
- HW1 M1-M4 implementation or browser/Lighthouse checks for this branch.
- Any new student-run test.
- Publishing this branch to GitHub. The GitHub plugin is not connected at this point.

GitHub and Vercel main are not modified by this planning task. Later entries will record the real result of each isolated milestone.

## Task 6.1 - HW1 M1: contrast and landmarks

Date: 7 October 2026 (Asia/Ho_Chi_Minh).
Scope: accessibility names, unique landmarks and control contrast only.

Actions actually performed by the assistant:
- Verified the connected GitHub account and repository write access.
- Published planning as `c62400a` on `hw-atomic-rebuild`, based on `8aa4676`. CLI push lacked credentials; the connected GitHub API published the same planning tree. The local branch was aligned to that published commit.
- Ran a fresh baseline audit in 16 theme/viewport/event-state combinations. Found four label-content-name mismatches, one duplicate landmark and insufficient control boundaries.
- Changed only index.html and styles.css in application source: included visible link labels, removed the duplicate wrapper landmark name, introduced separate control border colors.
- Ran the after audit: zero axe violations, zero tested contrast failures, one h1, zero divs, no horizontal overflow and zero page errors across all 16 combinations.
- Viewed light/dark full-page screenshots at 375px and 1440px and checked the color-token ratios for glyphs that axe marked incomplete. Kept the incomplete entries in the raw reports.
- Added a reproducible local audit script, before/after JSON and a report with the actual environment and limits.
- While making the audit script portable, its first launch failed to locate Playwright in the separate QA dependency directory. Fixed dependency lookup, then successfully ran the committed version; this was a test-tool setup issue, not an application pass.

Evidence: `verification/hw1-m1/README.md`, `before.json`, `after.json`, `audit.mjs`.

Not performed: student-run checks, manual screen-reader evaluation, M2 keyboard/storage checks, enforced CSP checks, Lighthouse checks. Do not infer a full WCAG certification from automated results.

The implementation is isolated to M1. The next work package is M2 in a later chat turn.

## Task 6.2 - HW1 M2: keyboard trap prevention

Date: 7 October 2026 (Asia/Ho_Chi_Minh).
Baseline: cdc93ec. Scope: keyboard/focus behavior and optional theme storage.

Actions actually performed by the assistant:
- Re-read project rules and the M2 contract; confirmed the remote rebuild branch at cdc93ec and main at 66fe05a.
- Inspected app.js, skip-link markup and focus styles.
- Recovered a truncated local Chromium executable from the existing compressed browser package. The first browser launch failed before any application audit ran; no test pass was recorded from that attempt.
- Built a browser check for 375/1440px, light/dark and five storage conditions, including real Tab/Shift+Tab/Enter/Space input.
- Corrected a test-navigation mistake: the second skip activation initially pressed Shift+Tab only twice, which reached Contact instead of the skip link. Corrected it to return through all eight header targets, then ran the before audit again on unchanged application source.
- The corrected baseline audit passed normal keyboard navigation and repeated skip-link activation. It reproduced blocked storage initialization failures, failed theme accessibility updates after denied writes, and invalid stored theme mismatch on dark systems.
- Modified only app.js in application source: validate and guard storage reads; update the theme button before optional persistence; catch write failures.
- Ran the after audit: 20 configurations, 160 checks passed, zero uncaught page errors, no horizontal overflow. Normal contexts verified all 22 Tab targets, reverse navigation, repeated skip activation, keyboard form submission, Retry and valid theme persistence.
- Inspected the application diff and recorded source-specific before/after evidence. Kept M1 reports unchanged.

Evidence: verification/hw1-m2/README.md, audit.mjs, before.json, after.json. JSON timestamps come from the real runs; the checks were performed by the assistant, not the student.

Not performed: student laptop or screen-reader checks, Firefox/Safari checks, M3 enforced CSP or M4 Lighthouse. No new focus trap was found in the tested baseline flows; the code fix addresses optional storage disrupting keyboard-operable controls.

This turn ends after the isolated M2 commit. Next work package: M3 in a later turn.

## Task 6.3 - HW1 M3: enforce strict CSP

Date: 7 October 2026 (Asia/Ho_Chi_Minh).
Baseline: 42bd2f6. Scope: CSP declaration, enforcement and deployment headers.

Actions actually performed by the assistant:
- Re-read rules and the M3 contract; confirmed remote rebuild at 42bd2f6, main at 66fe05a.
- Inspected HTML, JS, CSS and SVG resource references. Baseline had external local scripts/styles and no inline handlers; it lacked CSP meta and Vercel response-header configuration.
- Consulted official Vercel header configuration and W3C CSP documentation. Kept frame-ancestors exclusively in the HTTP response header.
- Ran a fresh baseline audit: 8 theme/viewport/delivery configurations. Inline script, handler and style probes executed; framing was allowed because CSP was absent.
- Added one CSP meta to index.html and a same-origin enforced CSP header in vercel.json. No app.js/styles.css/events.js changes.
- Ran after audit: 108/108 normal application checks passed; no normal CSP violations or page/console errors; modules, SVG, CSS, theme, event actions, Retry, form and reload worked under enforced policy.
- Separate injection and framing probes were blocked as expected. Their deliberate violations are recorded separately from normal application results.
- Improved the audit recorder to retain violations from both the initial document and reload rather than recording only the final document. Baseline had no CSP or violations, so this does not change its findings.
- Verified the actual M2 Preview deployment via GitHub deployment metadata. An unauthenticated GET returned HTTP 302 to Vercel SSO; no portfolio CSP response could be inspected. M3 remote header verification remains pending access to the protected Preview, rather than being marked passed from local evidence.
- Inspected the diff; retained M1/M2 source and evidence unchanged.

Evidence: verification/hw1-m3/README.md, audit.mjs, before.json, after.json. Actual test timestamps and tester are in the JSON.

Not performed: authenticated M3 Preview header verification, student-run browser checks, M4 Lighthouse. Main/production and Preview protection settings are preserved. This turn does not implement M4.

### M3 post-publication evidence

- Published source commit `2f038e4` (`fix(security): enforce strict CSP`) on the rebuild branch.
- GitHub reported the Vercel status as success. GitHub deployment metadata identifies Preview deployment 6903234727 for that exact source commit.
- Requested https://24520039-xvu10l5np-aquarista.vercel.app/ without following redirects: HTTP 302 to Vercel SSO; no portfolio CSP header accessible. Recorded `headerVerified: false` and the authentication block in verification/hw1-m3/vercel-preview.json.
- This follow-up commit records online evidence only; application code is unchanged from 2f038e4. The authenticated online header check remains pending.

## Task 6.4 - HW1 M4: optimize assets and verify Lighthouse

Date: 7 October 2026 (Asia/Ho_Chi_Minh).
Baseline: e24f36a. Scope: actual mobile/desktop Lighthouse audit and early module discovery.

Student-provided update:
- The user reported that the Vercel M3 check was OK and requested the next step. No raw header capture or checked URL was provided. This is recorded as a student-reported result; the assistant's earlier anonymous HTTP check is retained unchanged.

Actions actually performed by the assistant:
- Re-read project rules and M4 contract; confirmed remote branch at e24f36a, main at 66fe05a.
- Ran fresh Lighthouse 13.5.0 against the rebuild source with enforced CSP response headers. Both baseline profiles already scored 100/100/100/100, CLS 0; inspected the measured network dependency tree before editing.
- Added one modulepreload link for events.js in index.html to remove late discovery through app.js. No JS/CSS/image/CSP changes.
- Ran one after audit per profile with the same official Lighthouse presets: both again had raw category scores exactly 1.0, zero run warnings, TBT 0 and CLS 0. Recorded the actual LCP and request-chain measurements without claiming universal speedup from one run.
- Added a focused preload regression check at 375/1440px, light/dark, with enforced CSP.
- The first test-tool assertion incorrectly expected Resource Timing initiatorType to be link; a second CDP check incorrectly expected parser. Chromium reported script/about:client. Corrected the check to use actual early request timing and one request, retained initiator data for inspection, then ran the final script successfully in all four contexts. These were test-tool assumptions, not application errors.
- Saved all four complete LHR JSON reports, both summaries and the passing preload check. No earlier homework scores were reused; no audit category was skipped and no repeated best-score selection was performed.
- Inspected the application diff: exactly one modulepreload line. Kept all M1/M2 evidence and M3 raw audit/anonymous-response JSON unchanged.

Evidence: verification/hw1-m4/README.md, audit.mjs, verify-preload.mjs, before/after-mobile.json, before/after-desktop.json, before/after-summary.json, preload-check.json.

Limits: local lab runs by the assistant, not Vercel Lighthouse results or student Lighthouse runs. M3 online confirmation is student-reported. Existing main/production remain preserved.

This turn ends after the isolated M4 commit. The next package is HW2 planning in a separate turn; HW2 implementation is not started here.

## Task 7 - HW2 contract and atomic milestone planning

Date: 7 October 2026 (Asia/Ho_Chi_Minh).
Starting commit: 4c1a65b. Scope: planning documents only.

Actions actually performed by the assistant:
- Read the repository rules and existing WBS, and confirmed remote rebuild at 4c1a65b and main at 66fe05a.
- Re-read the supplied slide text: page 23 requires keydown/event.key/repeat handling and HTML-owned sound paths; page 24 requires HTML contract before JS, independent polyphonic audio, keyboard adapter and timestamped FIFO recorder as separate steps.
- Inspected only the nine pad bindings and recorder DOM IDs in the existing main reference to preserve the naming contract. No completed engine/recorder implementation was copied into this branch.
- Specified four isolated implementation commits, their allowed application files and their acceptance checks.
- Defined the audio and shared activation boundaries, the recorder queue/state/cancellation rules and the three-minute HTML key-rebinding demonstration.
- Included a real student laptop listening check for Step 2, especially Kick and Low tom, because the user previously reported those sounds as inaudible. Automated audio checks will be recorded separately.
- Checked that this turn changes only TASK_DECOMPOSITION.md and DEVELOPMENT_LOG.md; no HW2 page, JS, CSS, audio asset or old audit result is added.

Not performed: HW2 implementation, browser tests, audio playback, laptop listening, recorder timing tests or any new student test. All four implementation steps remain not started.

The next turn handles Step 1 only: semantic HTML data-sound contract and its CSS, checks and commit. It must not create an audio engine, keydown listener or recorder implementation yet.

## Task 7.1 - HW2 Step 1: HTML data-sound contract

Date: 7 October 2026 (Asia/Ho_Chi_Minh).
Starting commit: 0058940. Scope: nine-pad HTML contract and responsive CSS only.

Actions actually performed by the assistant:
- Re-read project rules and the four-step HW2 contract; confirmed remote rebuild at 0058940 and main at 66fe05a.
- Created a new semantic drum page from the committed contract, with nine native buttons, unique data-key/data-sound attributes, visible kbd and sound names, one h1 and no divs.
- Added the recorder DOM IDs, Idle/0/empty initial state and initially disabled Stop/Replay/Clear controls. No recorder behavior was added.
- Added local CSS with mobile-first three-column pads, stacked panels at 375px, side-by-side panels on desktop, system light/dark colors, visible focus and reduced-motion feedback styling.
- Included the current strict CSP meta for direct static serving. Existing root files and Vercel header configuration were not modified.
- Ran a fresh local browser audit. The initial full Tab assertion was invalid because the harness reloaded after skip-link navigation and kept #main. Retained its outcome in initial-harness-check.json; corrected the harness to start that independent sweep with a fresh fragment-free URL. No application change was needed for this test-tool error.
- Re-ran the corrected audit: 112/112 assertions passed across 375/1440px and light/dark; axe WCAG through 2.2 AA plus best-practice had zero violations and zero incomplete results in each configuration.
- Verified all nine path/name/key contracts, no application scripts/inline handlers/styles, target sizes, contrast, skip link, forward/reverse Tab focus, native help activation, reduced motion and no horizontal overflow. Normal loading had no WAV requests, failed responses, page/console errors or CSP violations.
- Visually inspected full-page screenshots for all four configurations. Labels fit; mobile panels stack and desktop panels align without overlap.
- Inspected the focused diff and updated only this milestone's status and evidence alongside its two application files.

Evidence: verification/hw2-step1/README.md, audit.mjs, initial-harness-check.json and result.json. Actual timestamp/tester/browser are in the report.

Not performed: audio playback or asset loading, laptop listening, letter-key adapter, recording/replay, student checks or Vercel preview verification. Pads and Record have no application behavior at this static stage. Main/production and earlier evidence remain preserved.

This turn ends after the isolated Step 1 commit. The next package is Step 2: independent polyphonic audio and click adapter, in a separate turn.

## Task 7.2 - HW2 Step 2: independent polyphonic audio

Date: 7 October 2026 (Asia/Ho_Chi_Minh).
Starting commit: 6ed1d97. Scope: audio engine, click adapter, external module tag and nine local WAV assets.

Actions actually performed by the assistant:
- Re-read project rules and the Step 2 contract. Confirmed remote rebuild at 6ed1d97 and main at 66fe05a.
- Implemented audio.js independently of click/letter-key/recorder adapters. Each accepted hit reads data-sound and creates a fresh native Audio voice; voices are released on ended/error. The engine returns true when playback starts, or false for caught pre-start failure, with polite textContent feedback.
- Added app.js with a shared activation entry point, transient feedback and native button click listeners only. No letter-key listener, sound-path map or recorder behavior was added.
- Added exactly one external module tag to the Step 1 HTML; did not change its pad contracts, recorder markup or CSS.
- Selectively copied only the nine WAV files from frozen main 66fe05a, including the corrected Kick/Low tom. Verified byte equality, Git blobs and SHA256 values rather than copying old reports or completed HW2 source.
- Ran actual PCM/FFT measurements. The first test wrongly assumed 44,100 Hz; preserved initial-assets-check.json, inspected the real 22,050 Hz headers and corrected that assertion without modifying the assets. All nine assets then passed: valid mono PCM16, nonzero signal, no clipped samples. Kick/Low tom band-energy fractions were 22.82%/38.01% at 250–4000 Hz; this is signal evidence, not a student audibility result.
- Ran native Chromium playback/decode tests under enforced CSP at 375/1440px in light/dark. The first overlap assertion used Locator.click, whose stability wait spaced repeated hits too slowly for three simultaneous 420ms Kicks. Preserved initial-browser-check.json and replaced that input cadence with real rapid mouse clicks at pad centers. No application change was needed. The test now checks simultaneous native playing events and subsequent natural completion, rather than requiring a just-started voice's clock to already be positive.
- The corrected audit passed. Added a focused direct-engine check to verify true resolution and that a temporary DOM sound-path change is read immediately; then ran the final full audit: 84/84 normal assertions and 6/6 failure/recovery cases passed. Normal playback was not mocked.
- All nine sounds loaded/decoded/played; repeated same-pad and mixed-pad hits overlapped; native Enter/Space still activated the click adapter. Letter keys and recorder behavior remained absent. Axe had zero violations in all four configurations; no overflow or normal runtime/network/CSP errors occurred.
- Failure tests covered injected play denial, real missing-file HTTP 404, corrupt WAV/native decode failure, injected constructor failure, missing data-sound and an injected post-start error event. Feedback was accessible, caught pre-start engine calls resolved false, and the next real hit recovered without unhandled rejection. Expected fault-case console/network errors are recorded separately.
- Reviewed the focused diff; Step 1 CSS and its historical report remain byte-for-byte unchanged.

Evidence: verification/hw2-step2/README.md, assets.py, assets.json, initial-assets-check.json, audit.mjs, result.json and initial-browser-check.json. Timestamps and tester are recorded in the new reports.

Not performed: student laptop listening, authenticated Vercel audio testing, letter-key adapter or recorder implementation. The student Kick/Low tom listening check is explicitly pending; headless events do not prove speaker audibility. Main/production remain preserved.

This turn ends after the isolated Step 2 commit. Step 3 adds the repeat-safe letter-key adapter in a separate turn.

## Task 7.3 - HW2 Step 3: repeat-safe keyboard adapter

Date: 7 October 2026 (Asia/Ho_Chi_Minh).
Starting commit: c7d1abc. Scope: keyboard.js and its integration in app.js only.

Actions actually performed by the assistant:
- Re-read rules and the Step 3 contract. Confirmed remote rebuild at c7d1abc and main at 66fe05a.
- Added a keydown adapter with HTML-derived key→pad bindings and event.key lowercase normalization. Repeat/composing/already-prevented and Control/Alt/Meta events are ignored; native inputs, textarea/select, inherited contenteditable and custom textbox targets are protected.
- Shared the same pad collection and activatePad entry point between click and keyboard. Shift remains allowed for uppercase input. No audio-path map, keyCode/keypress/switch mapping or recorder behavior was added.
- Verified that Step 1 HTML/CSS, Step 2 audio.js/WAVs and all earlier verification files remain byte-for-byte unchanged.
- Ran a fresh native Chromium keyboard audit at 375/1440px, light/dark, under enforced CSP. The first run's uppercase assertions used Shift+a, which actually emitted key=a, shift=true in the test environment. Preserved initial-check.json and corrected the injected input to Shift+A plus an actual uppercase event assertion. The first select typeahead assertion also assumed a choice change that Chromium did not perform; the adapter had left the event uncancelled. Added a native ArrowDown selection check and retained the direct no-hit/default-preservation guard checks. No application change was needed for these test-tool assumptions.
- Re-ran the corrected full audit: 180/180 assertions passed, axe had zero violations in every configuration and no normal page/console/network/CSP error or unhandled rejection occurred.
- Tested all nine lowercase and uppercase bindings with real trusted keyboard events/native Audio voices; one voice for held a with two repeat events; another hit after release; unknown/navigation/modifier keys; temporary native/editable fixtures; and explicitly labeled synthetic IME/default-prevented branch probes.
- Verified rapid A-S-A overlap through shared activation, focused-button Enter/Space, native help Enter/Space, both Tab directions/visible focus and skip-link main focus. Recorder state stayed static; semantic structure and width were preserved.
- Ran two temporary HTTP HTML-only a→q/A→Q rebindings with reload, unchanged modules, actual q/Q activation and restoration to a/A. Automated elapsed times including restoration: 361.56ms at 375px and 291.76ms at 1440px. These are not student/live-defense times.
- Added a concrete student rehearsal procedure and reviewed the focused application diff before committing.

Evidence: verification/hw2-step3/README.md, audit.mjs, initial-check.json and result.json; actual timestamp/tester/browser and detailed assertions are recorded in the reports.

Not performed: student timed key-rebinding defense, real OS IME composition, authenticated Vercel keyboard testing, student laptop listening or recorder implementation. The Step 2 Kick/Low tom listening result remains pending; the user's latest continuation instruction is not treated as a hearing-test result. Main/production and existing history remain preserved.

This turn ends after the isolated Step 3 commit. Step 4 implements the FIFO beat recorder in a separate turn.

## Task 7.4 - HW2 Step 4: timestamped FIFO beat recorder

Date: 7 October 2026 (Asia/Ho_Chi_Minh).
Starting commit: 18fc999. Scope: recorder module, shared activation/UI wiring and recorder/feedback state styles.

Student-provided update:
- At 14:44 the user reported that all requested prior Preview checks were OK and asked to continue. Recorded this as a student-reported Preview result; no device details, raw listening capture or timed live-defense result were supplied. Earlier historical reports remain unchanged.

Actions actually performed by the assistant:
- Read project rules and the Step 4 contract; confirmed remote rebuild at 18fc999 and main at 66fe05a.
- Added an independent recorder module with idle/recording/replaying states, input-order {key, at} queue, relative performance timestamps, cloned snapshots/replay take, one replay time origin, timer registry/generation cancellation, key/time validation and 256-hit/120-second bounds.
- Captured the timestamp/queue synchronously at shared live activation before invoking audio. Replay uses source=replay; manual live hits during replay do not mutate the tape. Failed audio remains an input-intent hit with separate accessible audio feedback.
- Wired Record/Stop/Replay/Clear and safe list rendering, state labels/status, state-dependent disabled controls, enabled-control focus transfer and a bounded keyboard-scrollable ordered list. Added visible limits/help without adding inline handlers/styles or divs.
- Ran 22 deterministic contract checks against the production module. FIFO/equal timestamps, exact relative offsets, immutable snapshots, transition guards, stop/new-session stale callbacks, clear/reset, cap boundaries, virtual 120-second deadline/delayed timer input, 30 rapid sessions and scheduler-overhead/error handling all passed. The duration boundary uses virtual time, explicitly not a real 120-second student test.
- The first native browser harness aborted because a generic data-key locator also matched a recorded list item. Recorded initial-check.json and scoped only the test's pad lookup; production adapters already used .drum-pad.
- The first completed browser audit exposed a real feedback contrast defect inherited from the earlier CSS: pad text switched immediately while background-color transitioned, producing axe ratios of 1.20:1 light and 1.48:1 dark in Recording. Preserved before-feedback-fix.json and removed the background-color transition so foreground/background switch atomically, retaining transform/reduced-motion feedback. This is a real application fix, not a test assumption.
- Corrected the capped-list test to wait for Chromium's native End scroll animation rather than read scrollTop immediately. No app scrolling fix was needed.
- Re-ran the final full native audit: 92/92 normal browser assertions across 375/1440px light/dark, plus 6/6 labeled integration checks passed. All 21 axe audits (five states per configuration plus capped list) had zero violations. No normal page/console/network/CSP error or unhandled rejection occurred.
- Verified mixed keyboard/click A-S-A timestamps/order; replay dispatch within the predeclared ±100ms tolerance (maximum observed absolute error 85.50ms under audit workload); no replay self-recording; manual live hits during replay; cancellation/clear; keyboard focus and five rapid sessions.
- Deliberately delayed a native play promise by 320ms and proved the input timestamp/queue precedes its resolution. Injected denied play to verify failed-input recording and the real UI 256-hit cap without stressing 257 audible voices; keyboard scrolling/axe and reload reset passed.
- Inspected 375px/dark empty/capped screenshots and reviewed the focused diff. Audio engine, keyboard adapter, nine WAVs and all prior evidence remain unchanged.

Evidence: verification/hw2-step4/README.md, model-check.mjs, model-result.json, audit.mjs, initial-check.json, before-feedback-fix.json and result.json. Actual timestamps/tester/environment are in the reports.

Limits: no student recorder listening/replay check or timed live defense is claimed. Replay timing measures dispatch, not acoustic output latency; already-started sound tails finish naturally after Stop. Main/production and existing Git history remain preserved.

This turn ends after the isolated Step 4 commit. HW2 now has its four separate implementation milestones. The next package is HW3 contract/milestone planning in a separate turn, followed by its required atomic steps; portfolio integration/final merge remain later work.

## Task 8 - HW3 contract and atomic milestone planning

Date: 7 October 2026 (Asia/Ho_Chi_Minh).
Starting commit: a17b2d0. Scope: planning/status/log only.

Student-provided update:
- At 15:07 the user reported the recorder Preview was OK and asked to continue. Recorded as student-reported; no raw recording/replay/timing capture was supplied. Earlier local test reports are preserved.

Actions actually performed by the assistant:
- Read repository rules and WBS; confirmed remote rebuild at a17b2d0 and main at 66fe05a.
- Re-read page 25 of the supplied slide in extracted text and its rendered image: three functional slices, minimum five atomic implementation commits, mandatory three-defect AI_FAILURE_AUDIT.md and live defense of Git history.
- Inspected only the frozen main HTML's sample event/UTC metadata, field naming/constraints and event-data metadata. Read the old audit to understand its provenance; did not copy its content, completed application modules or old reports into this branch.
- Defined five separate code packages: semantic/UTC DOM contract; absolute countdown; form state machine; concurrency/request lifecycle; normalization/safe output. Defined a separate evidence-backed report package after them. Planning/report commits are not counted toward the five application commits.
- Pinned the sample workshop to 2026-11-21T02:00:00Z with explicit Asia/Ho_Chi_Minh display zone and kept registration a clearly described local simulation.
- Specified countdown parsing/boundary/drift/lifecycle checks and a form/transport contract with safe output/basic state guards from the first async stage, followed by stronger in-flight/abort/token/timeout protection and independent validation. No deliberately unsafe intermediate implementation is requested.
- Specified safe input policy, native/programmatic validation boundaries, immutable payload snapshots, keyboard/focus feedback and malicious-payload DOM checks.
- Reviewed actual HW1 M1/M2 and HW2 Step 4 failure evidence/source for three distinct AI-assisted application defect candidates: accessible-name mismatch, optional-storage resilience and transient pad contrast. The future report will use explicit source/fix/evidence provenance; harness errors and missing future features are excluded.
- Checked that this turn changes only TASK_DECOMPOSITION.md and DEVELOPMENT_LOG.md, with all HW3 application/report stages still not started.

Not performed: HW3 page/clock/form/service/validation implementation, new browser/timing/security test, AI_FAILURE_AUDIT.md authoring or any new student test. All acceptance checks described here are planned, not labeled passed. Main/production and old history remain preserved.

This turn ends after the documentation-only planning commit. The next package is 8.1: semantic landing/countdown/form HTML contract and CSS, in its own turn.
