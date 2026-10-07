# AI-assisted development log

Student: Dang Hoai An - 24520039

The tasks were split in TASK_DECOMPOSITION.md before implementation. The following focused requests describe the scope used for each stage; this file is an auditable summary, not a substitute for the public AI Agent conversation URL requested by the instructor.

| Stage | Focused AI instruction | Review performed |
| --- | --- | --- |
| T-01 | Build semantic HTML landmarks with a skip link, one h1 and no divs; do not add CSS or JS. | Checked every anchor target and visible form label. |
| T-02A | Define light/dark design tokens and border-box reset only. | Calculated primary and muted text contrast against backgrounds. |
| T-02B | Build the mobile-first portfolio layout using auto-fit Grid; do not touch JavaScript. | Checked grid min width `min(100%, 280px)` for a 375px viewport. |
| T-02C | Implement a localStorage `theme` toggle with aria-pressed. | Reviewed persisted values and media-query precedence in source. |
| T-03A | Add a CSS-only skeleton and reduced-motion behavior. | Checked skeleton markup uses aria-hidden and panel uses aria-busy. |
| T-03B | Render supplied events safely using textContent and DOM nodes. | Inspected for unescaped innerHTML and checked ready-state cards. |
| T-03C | Add empty and error views plus a Retry button. | Reviewed cancellation token to prevent stale timers overwriting selected state. |

## Homework verification update

The earlier Lab 1 source review is retained above as historical context. The homework extension has now been tested in local Chromium. Actual results and deployment limitations are in `homework/CHECKS.md`; observed AI-assisted defects are in `AI_FAILURE_AUDIT.md`. The new WBS was committed before homework implementation. Source inspection is not represented as a Lighthouse or deployed-browser audit.
