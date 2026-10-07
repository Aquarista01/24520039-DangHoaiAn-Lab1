# HW3 Step 5 — normalized input and text-only output

Starting commit: eb06711b20a2e2bbf922fb970dc6dbba612ea34d.
Tester: assistant, 7 October 2026. These are fresh local runs, not student/hosted Preview results.
Application scope: validation.js and registration.js only.

## Policy and behavior

The independent `validateRegistration(raw)` returns a frozen `{ok, data, errors}` result. Invalid results have `data: null`; valid results contain a frozen string-only snapshot. It does not modify the caller's input.

- Name: Unicode NFC; whitespace collapsed to single spaces; remaining C0/C1 control characters removed; outer whitespace trimmed; 2–80 UTF-16 code units with at least one Unicode letter. Vietnamese diacritics, other Unicode letters, apostrophes and hyphens survive. There is no restrictive Latin-only alphabet filter.
- Email: NFC and outer trimming; 1–120 code units; raw C0/C1 characters and internal whitespace rejected; practical ASCII HTML-email grammar with dot-separated domain labels. Single-label domains are accepted like `type=email`. Case is preserved. This is not a complete RFC parser or deliverability check. Native email controls can sanitize CR/LF before the controller reads them; raw-newline rejection is separately tested directly in the independent module and with a text-field bypass fixture.
- Interest: exact `design`, `code` or `both` allowlist, even if a new option is inserted into the DOM.
- Note: NFC; CRLF/CR become LF; trim outer whitespace; remove C0/C1 except internal tab/LF; at most 300 code units after normalization. HTML characters, quotes and entity-looking text remain literal. Values over a normalized bound are rejected without truncation.

UTF-16 lengths match native minlength/maxlength conventions, including two-unit emoji. Native validity is checked first; an independent validation follows and is still authoritative if native attributes or reportValidity are bypassed. A native constraint can reject a raw value before normalization, so this does not promise to accept all raw strings whose normalized value might fit.

Custom messages are associated with the existing error nodes and native validity. Failed validation focuses the first erroneous field, makes no service attempt and preserves entries. Corrections clear custom/native error feedback; Reset clears validity. Normalization changes the transport/receipt snapshot; typed values remain in the form until Reset. Success renders that snapshot, rather than substituted transport receipt values, through the existing textContent sinks. No escaping entities or tag stripping is used as an XSS defense.

## Actual results

| Fresh suite | Passed | Method |
| --- | --- | --- |
| Independent validator | 86/86 | Node 24 golden inputs, exact expected normalization, bounds/types/immutability/idempotence |
| Input/hostile-string browser and bypass | 130/130 | Native Chromium at 375/1440px, light/dark; separate labeled injected bypass fixture |
| Existing form/UI lifecycle regression | 188/188 | Fresh native four-configuration rerun, actual 600ms service with test-only call/signal observation |
| Controller lifecycle contract regression | 25/25 | Fresh virtual deadline and injected deferred/throwing/rejected/reentrant transport cases |
| Axe | 40/40 audits with zero violations/incomplete | 16 input/output state audits plus 24 existing form-state audits; axe 4.14.0 |

Total assertions: 429/429. Normal UI cases use the actual application and 600ms local service under repository CSP header/meta. The independent suite tests Vietnamese/NFC/apostrophe/hyphen/Chinese/Arabic names, meaningless input, control characters, exact and overlength UTF-16 boundaries, practical email failures, allowlist tampering, notes, non-string inputs and immutable snapshots.

Browser cases type and submit img onerror, svg onload, script, onclick, javascript-URL and entity/quote strings. Hostile names/notes appear exactly as text, with zero child elements in receipt values, zero executable nodes, no dialogs, no execution-counter changes, no unexpected requests or CSP/unhandled errors. Click/mouseover are dispatched to inspect resulting DOM event outcomes. The separate controller fixture removes native attributes, changes type=email to text and replaces reportValidity, then proves 12 invalid inputs reach zero transport calls. It also verifies a corrected normalized frozen payload succeeds and a substituted transport name is not rendered.

Native keyboard correction/retry, linked custom-error focus, whitespace name, programmatic overlength note, exact note 300/name 80/email 120, no overflow/navigation/storage and active countdown are checked. Mobile light and desktop dark literal-output screenshots were visually inspected; receipt wraps without overlap or clipping. Images are temporary QA artifacts, not submitted app assets.

`regression.mjs` and `lifecycle-check.mjs` are explicitly derived from Step 4 checks and write new reports here. They import the earlier QA-only instrument; prior reports and application modules are unchanged. The lifecycle fixture uses virtual 4999/5000ms advances, performance offsets and synthetic page events. Those are not native waits or actual BFCache evidence. Axe is not a complete WCAG certification. No actual student keyboard capture, hosted-header test or live defense is claimed. No failed application run occurred in this package; injected invalid/fault cases are not manufactured AI defects for the later audit.

## Reproduce

From the repository root, use Node and installed Playwright/axe packages; replace machine-specific paths as needed:

```sh
node verification/hw3-step5/validation-check.mjs
QA_NODE_MODULES=/path/to/node_modules CHROMIUM_PATH=/path/to/chromium node verification/hw3-step5/browser-check.mjs
QA_NODE_MODULES=/path/to/node_modules CHROMIUM_PATH=/path/to/chromium node verification/hw3-step5/regression.mjs
QA_NODE_MODULES=/path/to/node_modules CHROMIUM_PATH=/path/to/chromium node verification/hw3-step5/lifecycle-check.mjs
```

Each browser script owns its local HTTP server and closes Chromium/server afterwards. Browser fixture and instrument helpers do not appear in the product module graph. Evidence reports retain actual run timestamps and explicitly separate native, virtual and injected checks. AI_FAILURE_AUDIT.md is the next isolated package, not authored here.
