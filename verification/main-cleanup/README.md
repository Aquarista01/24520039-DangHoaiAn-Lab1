# Restore current main to the Lab 1 snapshot

Authorized by the student on 7 October 2026 at 18:19 Asia/Ho_Chi_Minh.
Previous main: 66fe05a243cdc936c427179d445cfb6bfb148642.
Lab baseline: 8aa4676e8f691b39e1e599c7335b9e70d628a2b9.
Separate Homework branch retained at: 7ac14abdd9be04d2fa80b0ac4b65a5fbf37a8e00.

The candidate main tree restores the baseline application/assets and removes the old Homework application/evidence/config/audit from current content. README points to the separate homework branch. Branch-scope/cleanup documents and these verification artifacts are the only additions beyond the baseline. A new commit with the existing main head as parent preserves old commits; no reset/rebase/force push or homework merge is involved. This is content cleanup, not concealment or deletion of Git history.

## Actual local checks

`result.json` records 69/69 passing checks on Chromium 153.0.8010.0: nine source/separation assertions and 15 ordinary Lab checks in each 375/1440px light/dark configuration. Six application/asset blobs are byte-identical to 8aa4676: index.html, styles.css, app.js, events.js, favicon.svg and portrait.svg. Current Homework paths/audit are absent and the homework branch ref remains unchanged.

Native browser checks verify root/assets and three local event entries, one h1/zero divs/no overflow, no Homework links/section, keyboard skip link, empty/error/ready, busy Loading and keyboard Retry recovery, ordinary storage-backed theme toggling, native valid contact preview/reset without sending, no normal runtime/asset error, and intentional 404 responses for both old Homework routes.

The first helper used an incorrect event-card CSS selector and falsely counted zero entries. The Lab's actual event-list entries are li elements; the helper was corrected to query the semantic list children. `initial-check.json` preserves that failed helper run. Application source was not modified to repair it. The final suite passed all 69 checks. No accessibility, denied-storage, Lighthouse or hosted-runtime claim is inferred from these ordinary smoke checks.

Run from the repository root with Node and installed Playwright:

```sh
CODEX_PRIMARY_RUNTIME_NODE_MODULES=/path/to/node_modules CHROMIUM_PATH=/path/to/chromium node verification/main-cleanup/audit.mjs
```

The script owns/closes its local server and browser, compares Git blobs and writes only result.json. It serves the restored baseline without asserting Homework CSP headers. Known baseline issues and the later HW1 accessibility/storage/CSP/performance fixes stay documented on hw-atomic-rebuild. Original AI_WORKFLOW.md is retained as historical baseline content, not rewritten as a new workflow claim.

Hosted deployment verification occurs after the cleanup commit is published; this local report does not certify that deployment, actual student behavior or a shared conversation link. Vercel may deploy main as the Lab, so Homework is opened from the separate branch's Preview.
