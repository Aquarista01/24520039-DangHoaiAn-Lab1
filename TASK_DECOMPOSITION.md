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

Planning was committed before application changes. M1 and M2 have their own implementation and fresh verification; M3-M4 are pending. Do not copy previous audit scores into the new verification log. Each implementation commit includes its task-specific evidence and log/status updates; these do not broaden its application code scope.

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
| M3 | Not started | Pending |
| M4 | Not started | Pending |
