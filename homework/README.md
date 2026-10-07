# Homework source and review guide

Student: Đặng Hoài An · 24520039.
Submission branch: [hw-atomic-rebuild](https://github.com/Aquarista01/24520039-DangHoaiAn-Lab1/tree/hw-atomic-rebuild).

The instructor permits the Lab and homework in one repository when homework uses a separate branch or directory. HW1 modifies the portfolio at the root of this separate branch. HW2/HW3 additionally use the directories below. Keep the homework branch separate for review; preserve the original Lab baseline at `8aa4676` and existing main history.

| Homework | Source | Open locally from repository root | Evidence |
| --- | --- | --- | --- |
| HW1 | Root index.html, styles.css, app.js and vercel.json | http://localhost:5500/ | ../verification/hw1-m1/ through ../verification/hw1-m4/ |
| HW2 | [drum-kit](drum-kit/) | http://localhost:5500/homework/drum-kit/ | ../verification/hw2-step1/ through ../verification/hw2-step4/ |
| HW3 | [event-hub](event-hub/) | http://localhost:5500/homework/event-hub/ | ../verification/hw3-step1/ through ../verification/hw3-step5/; ../verification/hw3-audit/ |

Run `python3 -m http.server 5500` from the repository root. Open the portfolio's Homework section, choose a demo and use its back link to return. Both demos are static local coursework; workshop registration sends/saves nothing, and drum takes exist only in memory.

[Task decomposition](../TASK_DECOMPOSITION.md), [development log](../DEVELOPMENT_LOG.md) and [AI failure audit](../AI_FAILURE_AUDIT.md) link the real milestones and distinguish assistant local tests from student-reported Preview checks. This navigation package does not replace any older evidence or claim a fresh full application, Lighthouse, audio-listening or hosted-header audit.


[Final cross-homework review](../verification/final-review/README.md) now records fresh final checks and Lighthouse measurements on application head 7ac14ab. Main's authorized cleanup at 712f494 restored the Lab current tree while preserving history; the Homework branch stays separate. WBS 11 handoff remains pending, including assessor-accessible Homework hosting, app response headers, the shared AI conversation URL and required captures. Production currently serves the original Lab rather than HW1.
