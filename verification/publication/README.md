# Deployed CSP and source verification

Student reported disabling Vercel Authentication at 19:25 on 7 October 2026 (Asia/Ho_Chi_Minh).

[check-host.py](check-host.py) and [result.json](result.json) record a fresh anonymous HTTPS check: **98/98 assertions passed** across 31 responses for 28 runtime files and explicit page routes. All responses returned HTTP 200 without a sign-in redirect, matched reviewed source bytes and carried the exact CSP response header, including frame-ancestors none.

GitHub deployment metadata identifies the checked Preview at application commit 7ac14ab. Application files are identical at final-review commit a0396d4. This is a specific-deployment URL. Earlier SSO-blocked reports retain their original dates.

Run from the repository root: `python verification/publication/check-host.py`. Branch-head expectations record the starting refs of that original run and must be updated for a new run on later refs.

This evidence supports the deployed HW1 CSP check. It is not a hosted interactive browser, Lighthouse, axe or listening run; local application checks retain their actual provenance in verification/final-review.
