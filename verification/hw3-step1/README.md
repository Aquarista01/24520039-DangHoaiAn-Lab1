# HW3 Step 1 — Semantic landing and UTC contract

Starting commit: `4530734`. Application scope: only `homework/event-hub/index.html` and `styles.css`.

This is the first of five separate HW3 implementation packages. The event timestamp lives in HTML as `2026-11-21T02:00:00Z`, with the explicit Vietnam display time. Countdown slots are placeholders, not calculated values. Native labeled form fields and an initially hidden receipt supply the DOM contract for later packages. Register, Cancel and Reset are disabled. No application script or actual registration behavior exists yet.

The sample workshop is clearly labeled as coursework. Form entries are not transmitted or persisted. The design uses local CSS, system light/dark colors, stacked mobile panels, a two-column desktop layout, native controls and visible keyboard focus. Existing HW1/HW2 code and evidence remain untouched.

## Actual assistant checks

Fresh local Chromium 153.0.8010.0, served with the repository CSP response header and the page's CSP meta. `result.json` records the actual timestamp, all assertions, observed keyboard order, contrast ratios, requests and axe results.

| Width | Theme | Checks passed | axe violations | axe incomplete |
| --- | --- | --- | --- | --- |
| 375px | Light | 37/37 | 0 | 0 |
| 375px | Dark | 37/37 | 0 | 0 |
| 1440px | Light | 37/37 | 0 | 0 |
| 1440px | Dark | 37/37 | 0 | 0 |

All 148 assertions passed on the first completed run. Checks include one h1/zero divs, no scripts/inline handlers/styles, unique IDs, valid dt/dd lists, exact UTC/timezone metadata, four aligned non-live countdown slots, native labels/descriptions/constraints, disabled control types, independent polite status regions, hidden empty receipt, local privacy notices, responsive panel placement and no horizontal overflow. Native browser interactions verify short-name/bad-email rejection, valid sample input, checkbox Space activation, skip-link focus, forward/reverse Tab order and disabled-submit prevention of implicit Enter navigation. Text, control borders and focus colors meet the tested contrast thresholds. Reduced-motion behavior has no animations or smooth scrolling.

Normal navigation produced no page/console errors, failed responses, data requests or CSP violations. Axe 4.14.0 reported zero violations and zero incomplete items in all four configurations for WCAG A/AA tags through 2.2 and best-practice. The assistant inspected all four full-page screenshots; labels and controls were visible, panels did not overlap and the mobile text wrapped within the page. Screenshots use synthetic test form values; entries remain empty in the delivered HTML.

## Reproduce

Use Node with Playwright and axe-core available. Optional dependency roots are `QA_NODE_MODULES` and `CODEX_PRIMARY_RUNTIME_NODE_MODULES`; set `CHROMIUM_PATH` for an existing browser binary.

```sh
node verification/hw3-step1/audit.mjs
```

The script owns its temporary HTTP server, closes it and the browser, writes `result.json` and exits nonzero on a failed assertion. `SCREENSHOTS_DIR` optionally writes visual inspection images outside the repository. Axe/CSP observation is injected by browser automation as test instrumentation; no script is added to the application.

Limits: local assistant checks, not student or hosted-header verification. No countdown drift/timezone execution, form transport/state-machine, concurrent-submit or hostile-input execution test is claimed in this static stage. Axe and token contrast checks alone do not certify full WCAG compliance. Those functional checks belong to the later isolated packages.
