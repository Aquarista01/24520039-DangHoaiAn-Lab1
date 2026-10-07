# Lab 1 - Web Application Development

**Đặng Hoài An · 24520039 · MSIS207.R11.CTTT**

Exercises 1-3 share a single developer portfolio. Exercise 1 supplies the semantic HTML tree. Exercise 2 adds design tokens, responsive Grid and persistent theme. Exercise 3 adds a four-state event component.

## Run

From this directory: `python3 -m http.server 5500`; visit `http://localhost:5500/`. VS Code Live Server works too. Avoid opening `file://` URLs.

## Review

- Press Tab once to see the skip link, then Enter to jump to main.
- Try every navigation link, the theme toggle and contact form using only keyboard.
- In Event hub, inspect Loading, Live, Empty and Error, then Retry.
- Resize the viewport to 375px and check no horizontal scrollbar.
- `git log --oneline` shows the task-specific commits.

The contact form is a local demo: it validates inputs, reports success on this page and does not transmit messages. The event data is also local so every assessor can reproduce all states without network access. The GitHub repository URL and shared AI conversation URL must be inserted in the final PDF after publishing/sharing; local files cannot create these public links by themselves.

## Homework submission branch and pages

Homework shares this repository with Lab 1 and uses the separate [hw-atomic-rebuild branch](https://github.com/Aquarista01/24520039-DangHoaiAn-Lab1/tree/hw-atomic-rebuild). The instructor's rule relayed on 7 October allows either a separate branch or a separate directory; this branch keeps HW1 separate, and HW2/HW3 also have their own directories.

| Work | Source on hw-atomic-rebuild | Local route |
| --- | --- | --- |
| HW1 — portfolio accessibility, CSP and performance | Root index.html/styles.css/app.js; milestone evidence in verification/hw1-m1 through hw1-m4 | `/` |
| HW2 — drum kit and FIFO recorder | homework/drum-kit/ | `/homework/drum-kit/` |
| HW3 — countdown and local registration | homework/event-hub/ | `/homework/event-hub/` |

The portfolio's Homework section links to both independent demos; each demo links back to the portfolio. [Homework notes](homework/README.md) identify the evidence and review path. [AI_FAILURE_AUDIT.md](AI_FAILURE_AUDIT.md) records actual defects/fixes. [TASK_DECOMPOSITION.md](TASK_DECOMPOSITION.md) and [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md) preserve the incremental work and actual checks.

For submission, use the explicit branch URL above. Original Lab baseline `8aa4676` and the existing main/history remain preserved; retain the homework branch separately for assessment. Earlier prospective merge references are superseded by the instructor rule relayed by the student. [Final cross-homework review](verification/final-review/README.md) records 1,398 passing assertions and fresh local Lighthouse 100/100 in all four categories on mobile/desktop. Main now points to the authorized Lab cleanup at `712f494`, with history preserved. Publication/handoff remains WBS 11; the current Homework Preview requires Vercel sign-in for anonymous access, so assessor access and deployed application headers still need confirmation.
