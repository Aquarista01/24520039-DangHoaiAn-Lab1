# Project architectural constraints

- Read this file and TASK_DECOMPOSITION.md before changes.
- Use native HTML5, modern CSS and ES6+ JavaScript only; no external scripts or CSS frameworks.
- Prefer semantic elements; no `div` elements in the DOM.
- Use `const` by default and `let` only when reassignment is necessary.
- Never render user supplied strings with `innerHTML`.
- Mobile first: verify 375px before desktop.
- Preserve keyboard access and visible focus.
- Keep changes focused and inspect the Git diff before committing.

## Branch scope

- Main contains the restored Lab 1 snapshot. Homework is assessed separately on hw-atomic-rebuild.
- The student authorized the current-main cleanup on 7 October 2026; preserve old commits and the separate homework branch.
- Keep baseline restoration checks distinct from HW1 improvement audits. Do not claim removed current files have disappeared from Git history.
