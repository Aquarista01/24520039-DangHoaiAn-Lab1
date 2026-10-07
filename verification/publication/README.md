# WBS 11 — Homework publication and handoff

Student supplied the Homework Preview URL and reported disabling Vercel Authentication at 19:25 on 7 October 2026 (Asia/Ho_Chi_Minh). This package verifies public delivery and documents the handoff; it does not change application code, main or production settings.

[check-host.py](check-host.py) performs anonymous HTTPS GET requests, with system TLS verification and no cookies/authentication/redirect following. [result.json](result.json) records actual dates, statuses, response CSP, MIME types, byte lengths/SHA-256, source equality, GitHub deployment provenance and starting branch heads.

The script checks all runtime HTML/CSS/JavaScript/SVG/WAV files from the deployed app, plus the explicit portfolio URL and both directory routes. Exact source equality is checked against the unchanged final-reviewed application. The `frame-ancestors 'none'` directive is checked in the actual response header rather than inferred from a CSP meta tag. The deployment metadata ties the student-supplied URL to application commit 7ac14ab; final-review commit a0396d4 has identical application source.

Actual result: **98/98 assertions passed**, over 31 HTTPS responses and 28 runtime source files. Every response was HTTP 200 without a sign-in redirect, matched its source bytes and carried the exact CSP response header. Starting remote heads were Homework a0396d4 and main 712f494.

Earlier reports that observed HTTP 302 to Vercel SSO remain historical evidence. The new report records what changed after the student's setting change; earlier results are not overwritten.

[HOMEWORK_SUBMISSION.md](../../HOMEWORK_SUBMISSION.md) provides the explicit homework branch/page links, provenance, workflow evidence and student review steps. The checked Preview is a commit-specific URL, so it does not promise to track future branch pushes. Main remains the authorized separate Lab cleanup at 712f494, with history preserved.

## Reproduction

From the repository root, with Python/network access:

```sh
python verification/publication/check-host.py
```

The script's branch-head expectations are the actual starting refs of this package. A later checkout/ref must update those expectations for a new run rather than treating later refs as historical facts. Runtime files and response headers remain compared to the named checked application source.

## Limits and remaining student items

This is a fresh HTTP source/header/provenance check, not a fresh hosted interactive browser, axe, Lighthouse or listening run. Those local measurements retain their actual provenance in verification/final-review. Student reports opening the page, without raw screenshots supplied here.

The actual shared AI conversation URL and required student submission captures remain missing. Timed defense and user-only observations require the student. Publication documentation does not mark the final submission package complete without those artifacts.
