# Project architectural constraints

- Read this file and TASK_DECOMPOSITION.md before changes.
- Use native HTML5, modern CSS and ES6+ JavaScript only; no external scripts or CSS frameworks.
- Prefer semantic elements; no `div` elements in the DOM.
- Use `const` by default and `let` only when reassignment is necessary.
- Never render user supplied strings with `innerHTML`.
- Mobile first: verify 375px before desktop.
- Preserve keyboard access and visible focus.
- Keep changes focused and inspect the Git diff before committing.

## Homework rebuild workflow

- Work on hw-atomic-rebuild from Lab 1 baseline 8aa4676.
- One isolated work package per chat turn; stop after its implementation, checks and commit.
- Read its contract in TASK_DECOMPOSITION.md before modifying application code.
- Do not generate a finished homework package in one turn.
- Preserve the existing main branch and its history.
- Record actual results in DEVELOPMENT_LOG.md; distinguish assistant and student checks.
- Do not label unperformed checks as passed or reuse old scores as new evidence.

## Homework source separation

- Instructor rule relayed by the student on 7 October 2026: same repository is allowed, but homework must use a different branch or directory.
- Submit HW1's root portfolio from hw-atomic-rebuild; HW2/HW3 additionally live in homework/drum-kit and homework/event-hub.
- Keep this homework branch separate for assessment and preserve the original Lab baseline/main history. Earlier prospective merge plans are superseded by this user constraint.

## Repository scope

- Keep assignment source, required specification/audit files and directly relevant verification evidence in Git.
- Give submission/capture instructions in chat; do not add submission guides or duplicate administrative documents unless the student explicitly asks for them.
