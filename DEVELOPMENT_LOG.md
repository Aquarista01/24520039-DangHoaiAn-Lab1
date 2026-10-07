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
