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

## Lab and Homework source separation

This branch contains the Lab 1 application restored from commit `8aa4676` by a later cleanup commit. The earlier Homework snapshot was removed from the current main tree; its historical commits remain unchanged.

Homework submission and its actual incremental rebuild are on the separate [hw-atomic-rebuild branch](https://github.com/Aquarista01/24520039-DangHoaiAn-Lab1/tree/hw-atomic-rebuild): HW1 at the root, HW2 in homework/drum-kit and HW3 in homework/event-hub. Open that branch's README, task decomposition, development log and AI failure audit for its own work/evidence. Homework routes are intentionally absent from this Lab branch.

On 7 October 2026 the student relayed the instructor's separate-branch-or-directory requirement, then authorized this cleanup. The cleanup uses a new commit and preserves the earlier history; it does not rewrite the record of how earlier versions were produced. Original AI_WORKFLOW.md is retained from the Lab baseline as a historical summary, not a replacement for the shared AI conversation URL.

Fresh checks of this restored Lab are in verification/main-cleanup/result.json. They cover baseline source equality and ordinary local UI behavior, not a new HW1 accessibility/CSP/Lighthouse audit. The baseline's known issues and later fixes are documented on the homework branch. Production may redeploy automatically from main; use the Homework branch's own Preview for those pages.
