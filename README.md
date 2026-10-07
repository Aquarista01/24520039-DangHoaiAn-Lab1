# Lab 1 and Homework 1-3

**Đặng Hoài An · 24520039 · MSIS207.R11.CTTT**

The original Lab 1 exercise commits are preserved. The homework extension builds on baseline `8aa4676` and uses only native HTML5, CSS and JavaScript modules.

| Work | Entry point | Main features |
| --- | --- | --- |
| HW1 | `/` | Portfolio, theme persistence, accessible keyboard flow, self-hosted CSP |
| HW2 | `/homework/drum-kit/` | Nine drum pads, polyphony, key repeat guard, FIFO beat recording and replay |
| HW3 | `/homework/event-hub/` | UTC countdown, registration state machine, duplicate prevention, safe text output |

## Run locally

Open this folder in VS Code. Right-click `index.html` and select **Open with Live Server**. Alternatively run `python3 -m http.server 5500` and visit `http://localhost:5500/`. Do not open HTML through file://.

No npm installation or build step is needed for the website. All sounds and artwork are local. The event and forms are disclosed as coursework previews; submissions are not sent or saved.

## Review documents

- `TASK_DECOMPOSITION.md`: original Lab 1 WBS and homework pointer.
- `homework/TASK_DECOMPOSITION.md`: detailed homework contracts and atomic stages.
- `AI_FAILURE_AUDIT.md`: three observed AI-assisted defects, diagnoses and fixes.
- `homework/CHECKS.md`: actual verification results and remaining deployed checks.
- `homework/HUONG_DAN.md`: Vietnamese run, submission and oral-defense guide.
- `homework/evidence/`: browser screenshots, functional results, and Lighthouse reports.
- `vercel.json`: strict CSP and security headers for the deployed website.

Use `git log --oneline` to inspect the focused homework history. The first homework commit defines the WBS before implementation; the HW2 HTML contract precedes its JavaScript engine.
