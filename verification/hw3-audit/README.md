# HW3 Step 6 — AI failure report evidence check

Starting application commit: c9a30f2303d54157f0687dfe26530305d9d724b8.
Prepared by the assistant on 7 October 2026.

The root AI_FAILURE_AUDIT.md records four actual AI-assisted application defects across Lab 1/HW1, HW2 and HW3. Their historical before/after JSON reports and source/fix commits are linked explicitly; this package does not rerun those application suites or edit their reports.

`check-evidence.py` reads the report links, Git objects/ancestry and original JSON. It checks affected-node counts, exact assertion/audit totals, original timestamps, the saved countdown source SHA-256, actual source changes and the existing Step 5 result totals. `result.json` records the fresh integrity-check timestamp, 30/30 passing checks and hashes of the linked historical evidence. The output report is excluded from its own hash inputs to avoid circular self-hashing; its link is checked against the designated output path.

Run from the repository root:

```sh
python verification/hw3-audit/check-evidence.py
```

This requires Python and the repository's real Git objects; it has no external package, browser or network dependency. It updates only this package's result.json. It never replaces the historical before/after reports. A nonzero exit indicates an evidence/source mismatch requiring review, not necessarily a newly observed runtime defect.

While preparing the helper, schema reads were adjusted for list-valued `detail` records and for the generated result's self-reference. These are audit-helper corrections, not application defects or entries in the mandatory report. The final completed evidence run passed all 30 checks. No new application suite was run in this documentation package, and no new student, hosted-header or live-defense observation is claimed.
