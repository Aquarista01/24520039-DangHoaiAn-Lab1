# AI Failure Audit — Lab 1 and Homework Rebuild

Student: Đặng Hoài An · 24520039. Branch: `hw-atomic-rebuild`.
Report prepared: 7 October 2026 (Asia/Ho_Chi_Minh), after application commit `c9a30f2`.

## Scope and provenance

This report documents **four distinct defects in AI-assisted application code** across the Lab 1 baseline and the incremental homework rebuild: two portfolio defects, one HW2 feedback defect and one HW3 countdown defect. It does not claim that all four originated in HW3. This is the cross-Lab/homework audit scope defined before HW3 implementation in [TASK_DECOMPOSITION.md](TASK_DECOMPOSITION.md).

The initial Lab 1 implementation was AI-assisted, as established in the project conversation. Its HTML/theme defects remained in the baseline inspected during HW1. The drum-pad feedback and countdown defects were in the assistant's rebuild implementation and were discovered by its checks. The evidence proves the faulty behavior/source and the fix; it does not expose a model's internal reasoning or invent a particular original prompt. Each cause below is a diagnosis of the code's behavior.

All before/after results below are **historical assistant runs from 7 October**, with their original UTC timestamps retained. Writing this report did not rerun the application suites or replace their results. A fresh read-only evidence/source integrity check is recorded in [verification/hw3-audit/result.json](verification/hw3-audit/result.json). Student Preview “Ok” messages are recorded separately in [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md), without claiming access to the student's laptop or raw keyboard recordings.

## Defect index

| ID | Application defect | Observed failure | Fix commit | Passing evidence |
| --- | --- | --- | --- | --- |
| A1 | Link accessible names omit visible labels | Four nodes fail `label-content-name-mismatch` | [cdc93ec](https://github.com/Aquarista01/24520039-DangHoaiAn-Lab1/commit/cdc93ec18b36d4a847073c5e49a7f1b874733feb) | [HW1 M1 after](verification/hw1-m1/after.json): 16 configurations, zero axe violations |
| A2 | Optional theme storage exceptions break initialization/state | 54 of 160 assertions fail across storage/theme conditions | [42bd2f6](https://github.com/Aquarista01/24520039-DangHoaiAn-Lab1/commit/42bd2f6dce3427a4d1b6f5a832d4933aa5d1796f) | [HW1 M2 after](verification/hw1-m2/after.json): 160/160 assertions pass |
| A3 | Animated background and immediate pad text change create low contrast | Recording-state label contrast 1.20:1 light / 1.48:1 dark | [a17b2d0](https://github.com/Aquarista01/24520039-DangHoaiAn-Lab1/commit/a17b2d038c34ab591233cb828635c228b8045998) | [HW2 Step 4 result](verification/hw2-step4/result.json): 92/92 native and 6/6 integration assertions; 21 axe audits, zero violations |
| A4 | Rendering overhead crosses a countdown boundary without refreshing the displayed value | Expected immediate correction; scheduled delay was 950ms | [d976694](https://github.com/Aquarista01/24520039-DangHoaiAn-Lab1/commit/d9766945b3983b199a7a737d9f38e8b6b5e46651) | [HW3 Step 2 model](verification/hw3-step2/model-result.json): 47/47, including 0ms correction |

Repeated assertions, read/write variants of one storage failure, and repeated theme/viewport observations do not count as additional independent defects.

## A1 — Visible link labels and accessible names disagree

**Description and trigger.** In baseline `8aa4676`, also present unchanged in planning commit `c62400a`, the brand visibly reads `HA.`, two project links read `Explore`, and one reads `Try demo`. Their `aria-label` values override those labels with descriptions that omit the visible words. For example, the second Explore link has `aria-label="View responsive skills section"`. A user referring to the visible label may encounter a different accessible name.

**Diagnostic method.** The assistant ran axe 4.14.0 in Chromium 153.0.8010.0 across 375/1440px, light/dark and loading/ready/empty/error. [before.json](verification/hw1-m1/before.json), timestamp `2026-10-07T05:23:11.662Z`, records `label-content-name-mismatch` on `.brand` and the three project links in each configuration. These are four affected nodes, not four separately counted defect categories. The inspected old source can be reproduced with `git show c62400a:index.html`.

**Cause and fix.** The AI-assisted markup replaced the accessible name with a helpful-sounding description without preserving the visible label. Commit `cdc93ec` makes the names include the visible wording. This is an HTML/name fix; changing color or using a longer description alone would not address it.

**Verification.** [after.json](verification/hw1-m1/after.json), timestamp `2026-10-07T05:25:16.471Z`, contains 16 audits with zero violations. The same milestone also repaired a duplicate landmark name and control-border contrast; those separate repairs are not counted as A1 or extra audit entries here. See [M1 method/reproduction notes](verification/hw1-m1/README.md).

**Lesson.** Inspect visible text and the computed accessible name together. An explicit ARIA label should retain the control's visible wording, and verification must cover each affected control rather than assuming all ARIA attributes improve access.

## A2 — Optional persistence interrupts unrelated application behavior

**Description and trigger.** In `cdc93ec:app.js`, `localStorage.getItem('theme')` runs at module top level. If access/read throws, event listeners and `initializeEventHub()` never run. In the click handler, `setItem` runs after changing the CSS theme but before updating `aria-pressed`. A write exception therefore leaves visual and accessible state out of sync. An invalid stored theme also produces incorrect button state on a dark system.

**Diagnostic method.** Fresh browser contexts injected denied storage property access, denied reads, denied writes and an invalid stored value, alongside normal storage. Trusted Enter/Space and navigation input checked observable focus/theme/event-hub behavior. The injections expose an unhandled dependency in actual code; they are not deliberately introduced application bugs. [before.json](verification/hw1-m2/before.json), timestamp `2026-10-07T06:13:03.539Z`, records **54 failed assertions out of 160**, over 20 viewport/theme/storage configurations, including uncaught storage errors and missing event-hub initialization.

**Cause and fix.** The AI-assisted implementation treated optional storage as infallible and made essential UI updates depend on saving. Commit `42bd2f6` adds guarded reads, accepts only `light`/`dark`, falls back to the system theme, updates CSS/button state before attempting to save, and catches write failure. Reading/writing/invalid-value behavior is one storage-resilience category here. Although the commit title mentions navigation, its inspected `app.js` diff is the relevant storage fix.

**Verification.** [after.json](verification/hw1-m2/after.json), timestamp `2026-10-07T06:14:00.046Z`, passes **160/160** checks with zero uncaught page errors. Theme/button state stay synchronized and the event hub initializes when optional storage fails. [M2 notes](verification/hw1-m2/README.md) retain the fixture boundaries and keyboard method.

**Lesson.** Keep optional persistence outside essential initialization and state updates. Test dependency failures explicitly and count the underlying defect once, rather than treating every failed assertion as a new bug.

## A3 — Pad feedback temporarily fails contrast during its transition

**Description and trigger.** The drum-pad CSS in pre-recorder source `18fc999` changes the pad foreground immediately to `--button-text` while animating `background-color` for 100ms. Pressing a pad while recording creates a short interval with the new text color on an old/intermediate background. This was real application CSS from the rebuild, observed during the Step 4 recorder audit.

**Diagnostic method.** The actual keyboard/click recording flow was audited while active, rather than only at its idle/end states. [before-feedback-fix.json](verification/hw2-step4/before-feedback-fix.json), timestamp `2026-10-07T07:55:10.499Z`, records `color-contrast` on `.is-hit > span` (the Kick label) in Recording: **1.20:1 light and 1.48:1 dark**, with an expected 4.5:1 in the reported rule. The observations repeat at 375/1440px; they are one timing/contrast defect. Inspect the source with `git show 18fc999:homework/drum-kit/styles.css`.

**Cause and fix.** The AI-generated feedback CSS considered the final colors but not their asynchronous transition. In `a17b2d0`, the background-color transition is removed; foreground/background now switch together. The 100ms transform feedback and reduced-motion behavior remain. The focused CSS diff verifies this repair rather than an unrelated palette change.

**Verification.** [result.json](verification/hw2-step4/result.json), timestamp `2026-10-07T07:56:50.463Z`, passes **92/92 native** and **6/6 integration** assertions. All **21 axe audits** report zero violations: 20 normal state audits plus the capped-list integration audit. This does not claim that every axe incomplete item was resolved or that transient contrast was sampled on every device.

That package also corrected a test selector matching both a pad and a recorded list item, and a test that read scroll position before native scrolling advanced. Those harness corrections are explicitly separate in [Step 4 notes](verification/hw2-step4/README.md) and are **not counted as AI application defects**.

**Lesson.** Check feedback while it changes. A contrast-safe start/end palette does not guarantee a safe intermediate foreground/background pair.

## A4 — Countdown scheduling leaves a stale value after slow rendering

**Description and trigger.** In the first uncommitted HW3 Step 2 implementation, 1250ms remained when `onTick` emitted 2 seconds. The test's render callback consumed 300ms, leaving 950ms. The scheduler recomputed `ceil(950/1000)` and waited 950ms until zero, leaving the emitted 2 stale instead of immediately correcting it to 1.

**Diagnostic method and exact source.** An injected deterministic clock/scheduler isolated callback overhead. [before-boundary-fix.json](verification/hw3-step2/before-boundary-fix.json), timestamp `2026-10-07T08:35:19.861Z`, records **45/46 passing checks**, with the boundary test failing at `scheduledDelay: 950`. Its `failingSource` stores the complete faulty module and SHA-256:

`120b71a130c4e77e78976780009017e25516082791d8acb6f013a8e3a2aab2a6`

The parent `6b8a607` contains only the static landing page; it is **not a faulty countdown commit**. The failing module snapshot, not that parent, is the exact before-source. The source digest is checked again when preparing this report.

**Cause and fix.** The assistant accounted for elapsed time but scheduled relative to a newly calculated value instead of the value already rendered. In `d976694`, the next delay uses `remaining - (totalSeconds - 1) * 1000`, clamped to 0..1000ms. `totalSeconds` is the emitted value. If render crosses its next boundary, a zero-delay callback immediately recomputes the absolute clock; it does not decrement a cached counter.

**Verification.** [model-result.json](verification/hw3-step2/model-result.json), timestamp `2026-10-07T08:35:52.537Z`, passes **47/47** checks. The boundary case now records `scheduledDelay: 0`, and an additional check confirms the next emitted value is 1. The separate [browser result](verification/hw3-step2/result.json) records 68 native and 21 integration assertions, with the clock/fixture distinctions described in [Step 2 notes](verification/hw3-step2/README.md). The 300ms callback overhead and boundary advances are virtual tests, not elapsed waits on a student's laptop.

**Lesson.** Base the next update on the value the UI actually shows, including callback overhead. Absolute-clock arithmetic prevents accumulated drift, but the scheduling boundary still needs an adversarial test.

## Current implementation, exclusions and review

HW3's five implementation commits are separate from its planning and this report:

| Work package | Commit |
| --- | --- |
| Semantic landing/UTC contract | `6b8a607` |
| Absolute UTC countdown | `d976694` |
| Registration state machine | `d97b7e3` |
| Concurrency/cancellation/lifecycle | `eb06711` |
| Independent normalization/safe output | `c9a30f2` |

Their checks and student-reported milestone status are linked in [TASK_DECOMPOSITION.md](TASK_DECOMPOSITION.md). The latest [Step 5 evidence](verification/hw3-step5/README.md) records 429/429 local assertions and 40 axe audits with zero violations/incomplete items. Those are the earlier Step 5 runs, not fresh measurements performed while writing this report.

No double-submit or XSS defect is invented here: the basic state guard and textContent sinks were present in the initial form stage, then strengthened and tested in later packages. Delayed/rejected transports, native-constraint bypasses and hostile input fixtures are tests of defenses, not proof that the app previously had those defects. Unimplemented future tasks are also excluded. There is no claim of full WCAG certification, full RFC email validation, actual BFCache recovery, acoustic latency measurement or a completed timed live defense.

For review, open the linked before result, inspect the corresponding old source/digest, inspect the fix commit, then compare the linked after result. The current report's evidence integrity check can be run with `python verification/hw3-audit/check-evidence.py`; it reads Git/JSON and validates references, counts and source changes without rerunning the browser or replacing historical reports. Final portfolio integration, cross-homework review and merge remain later packages.
