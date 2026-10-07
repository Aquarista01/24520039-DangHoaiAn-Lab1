# Homework submission guide

Student: Đặng Hoài An · 24520039 · MSIS207.R11.CTTT.

## Source and deployed pages

Submit the separate [hw-atomic-rebuild branch](https://github.com/Aquarista01/24520039-DangHoaiAn-Lab1/tree/hw-atomic-rebuild). HW1 uses the root portfolio on that branch; HW2/HW3 also have dedicated directories. Main remains the separate Lab current tree at cleanup commit `712f494`; real history is preserved.

| Work | Source | Deployed page |
| --- | --- | --- |
| HW1 | Root portfolio on hw-atomic-rebuild | [Portfolio](https://24520039-8lc11t8jq-aquarista.vercel.app/index.html) |
| HW2 | homework/drum-kit/ | [Drum kit and recorder](https://24520039-8lc11t8jq-aquarista.vercel.app/homework/drum-kit/) |
| HW3 | homework/event-hub/ | [Countdown and registration](https://24520039-8lc11t8jq-aquarista.vercel.app/homework/event-hub/) |
| Lab | main | [Lab production](https://24520039.vercel.app/) |

The Homework URL is the specific deployment of application commit `7ac14ab`. Final-review commit `a0396d4` adds checks/documentation with identical application files. It is not a branch URL that promises to follow future commits. Use the listed Homework deployment for this checked version; verify a new URL if application code changes.

[Publication evidence](verification/publication/README.md) records fresh anonymous HTTPS access, deployed source/header checks and deployment provenance after the student disabled Vercel Authentication. [Final local review](verification/final-review/README.md) records 1,398 passing assertions and fresh local Lighthouse measurements. These are different test runs with their actual dates/methods; no local score is presented as a hosted or student-run score.

## Workflow and evidence

- [TASK_DECOMPOSITION.md](TASK_DECOMPOSITION.md): planning contracts and isolated milestones.
- [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md): actual work, assistant checks and student-reported checks.
- [AI_FAILURE_AUDIT.md](AI_FAILURE_AUDIT.md): four distinct evidenced defects across the stated Lab/homework scope; one originated in HW3. Historical failing/fixed sources and dates remain available.
- [Commit history on the homework branch](https://github.com/Aquarista01/24520039-DangHoaiAn-Lab1/commits/hw-atomic-rebuild/): actual incremental history, including five isolated HW3 implementation slices.

## Student submission items still needed

| Item | Current status | Action |
| --- | --- | --- |
| Actual shared AI conversation URL | Not supplied | Share the actual conversation(s) used for this work and copy the public share URL. The Git log/development log does not replace a required chat link. |
| Required screenshots/report from the student's run | Not supplied in this handoff | Capture the current Homework pages and the checks required by the slide. Keep Lab's screenshot/PDF requirements separate from Homework requirements. |
| Timed instructor-defense rehearsal | Not recorded | Rehearse HTML-only key rebinding and explain countdown/form/recorder logic. Do not use assistant fixture times as the student's defense time. |

No placeholder chat URL, fabricated screenshot, student Lighthouse result or timed defense is marked complete. The source/deployment checks are available, but a final submission report depends on the actual student artifacts above.

## Review before submitting

1. Open each listed Homework URL in an incognito window and confirm it loads directly. Open portfolio Homework links and both back links.
2. HW1: inspect keyboard/skip link/theme/storage behavior and the deployed HTML response's CSP in DevTools Network. Run the student's own mobile/desktop Lighthouse if the submission requires student captures; the saved assistant local LHRs retain their provenance.
3. HW2: listen to Kick and Low tom, try click/letter keys, hold a key, record A–S–A, Stop, Replay and Clear. For the three-minute rehearsal, change only Kick's HTML data-key a→q and visible kbd A→Q, save/reload, verify q/Q, then restore a/A. [Detailed procedure](verification/hw2-step3/README.md).
4. HW3: check countdown progress, Success, simulated Error and Retry, Cancel with preserved input, Reset and invalid whitespace-name correction. Registration is a local simulation and sends/saves no real registration.
5. Attach the actual shared-chat link and required captures. Keep the homework branch separate and submit the explicit branch URL rather than a link that opens main by default.

Root glyph/icon contrast incomplete items remain in the automated audit evidence. No full WCAG certification, speaker-output measurement, actual BFCache/background suspension or student live defense is claimed.
