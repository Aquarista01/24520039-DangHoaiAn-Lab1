# Homework rebuild development log

Student: Đặng Hoài An - 24520039
Branch: hw-atomic-rebuild
Starting commit: 8aa4676

## Task 6 - HW1 planning

Date: 7 October 2026 (Asia/Ho_Chi_Minh).
Scope: define the four HW1 milestones, their contracts, checks, allowed files and atomic commit boundaries.

Actions actually performed by the assistant:
- Fetched the public GitHub repository and inspected current main (66fe05a).
- Read the Lab 1 baseline rules, WBS and development notes.
- Created a local rebuild branch/worktree from 8aa4676.
- Added the HW1 milestone plan and this execution protocol.
- Checked that the application files were unchanged from the baseline and the documentation diff was free of whitespace errors.

Not yet performed:
- HW1 M1-M4 implementation or browser/Lighthouse checks for this branch.
- Any new student-run test.
- Publishing this branch to GitHub. The GitHub plugin is not connected at this point.

GitHub and Vercel main are not modified by this planning task. Later entries will record the real result of each isolated milestone.

## Task 6.1 - HW1 M1: contrast and landmarks

Date: 7 October 2026 (Asia/Ho_Chi_Minh).
Scope: accessibility names, unique landmarks and control contrast only.

Actions actually performed by the assistant:
- Verified the connected GitHub account and repository write access.
- Published planning as `c62400a` on `hw-atomic-rebuild`, based on `8aa4676`. CLI push lacked credentials; the connected GitHub API published the same planning tree. The local branch was aligned to that published commit.
- Ran a fresh baseline audit in 16 theme/viewport/event-state combinations. Found four label-content-name mismatches, one duplicate landmark and insufficient control boundaries.
- Changed only index.html and styles.css in application source: included visible link labels, removed the duplicate wrapper landmark name, introduced separate control border colors.
- Ran the after audit: zero axe violations, zero tested contrast failures, one h1, zero divs, no horizontal overflow and zero page errors across all 16 combinations.
- Viewed light/dark full-page screenshots at 375px and 1440px and checked the color-token ratios for glyphs that axe marked incomplete. Kept the incomplete entries in the raw reports.
- Added a reproducible local audit script, before/after JSON and a report with the actual environment and limits.
- While making the audit script portable, its first launch failed to locate Playwright in the separate QA dependency directory. Fixed dependency lookup, then successfully ran the committed version; this was a test-tool setup issue, not an application pass.

Evidence: `verification/hw1-m1/README.md`, `before.json`, `after.json`, `audit.mjs`.

Not performed: student-run checks, manual screen-reader evaluation, M2 keyboard/storage checks, enforced CSP checks, Lighthouse checks. Do not infer a full WCAG certification from automated results.

The implementation is isolated to M1. The next work package is M2 in a later chat turn.
