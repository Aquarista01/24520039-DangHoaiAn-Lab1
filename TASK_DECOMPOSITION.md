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
