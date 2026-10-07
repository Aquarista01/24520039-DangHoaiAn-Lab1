# Main branch cleanup log

## Restore the Lab snapshot on main

Date: 7 October 2026 (Asia/Ho_Chi_Minh).
Starting main: 66fe05a243cdc936c427179d445cfb6bfb148642.
Restored Lab baseline: 8aa4676e8f691b39e1e599c7335b9e70d628a2b9.
Homework branch: hw-atomic-rebuild, preserved at 7ac14abdd9be04d2fa80b0ac4b65a5fbf37a8e00.

Student instructions:
- At 17:50 the student relayed the instructor's separate-branch-or-directory rule.
- At 18:06 the student asked about the earlier Homework snapshot on main. The assistant explained that deleting current files would not delete earlier commits, and proposed a new cleanup commit plus explicit submission of the rebuilt Homework branch.
- At 18:19 the student authorized that proposed cleanup. This explicit instruction permits changing main for this package and supersedes the earlier unchanged-main plan. It does not authorize rewriting/deleting historical commits.

Actual assistant work:
- Fetched both branches and confirmed the heads above. Used an isolated lab-main-cleanup worktree based on current main; read the source rules and wrote the cleanup contract before restoring files.
- Restored the 8aa4676 Lab application and original documents. Removed the later Homework directory/assets/evidence, old root AI_FAILURE_AUDIT.md and later vercel.json from the current candidate main tree. Added README mapping to the separate Homework branch and branch-scope/cleanup notes. No homework implementation was copied or merged into this Lab snapshot.
- Verified all six runtime/asset blobs equal the original Lab objects exactly. Retained original AI_WORKFLOW.md as historical baseline material; no old prompt/check claims were fabricated or rewritten.
- Ran fresh Chromium 153.0.8010.0 source/separation and ordinary Lab checks: 69/69 passed across 375/1440px light/dark. Root UI/assets, skip link, local component states/Retry, ordinary theme and native local contact preview/reset work without normal runtime/asset failure; both removed Homework routes return 404.
- Corrected the helper's initially assumed event-card selector to the actual semantic list children, preserving its initial failed report. This needed no application fix. The final completed local check passed.
- Reviewed the complete removal/restoration diff and checked whitespace. Prepared one new commit whose parent is the old main head, preserving its ancestry and the separate Homework ref. Vercel may automatically redeploy main as the Lab; Homework uses its own branch Preview.

Evidence: verification/main-cleanup/README.md, audit.mjs, initial-check.json and result.json. These are assistant local restoration/smoke checks; no fresh HW1 accessibility/CSP/Lighthouse certification, student laptop behavior, hosted result or shared-chat verification is claimed by those reports.

This package changes current main content and retains the real earlier history. Final cross-homework review/publication remains separate work on hw-atomic-rebuild.
