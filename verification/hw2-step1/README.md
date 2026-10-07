# HW2 Step 1 — HTML data-sound contract

Starting commit: `0058940`. Application scope: only `homework/drum-kit/index.html` and `styles.css`.

This is the static contract stage. The nine pads own their unique lowercase key and relative WAV path in HTML. The page supplies the recorder IDs and initial states. There is no application JavaScript or script tag, and no audio asset is supplied yet. Pad activation, letter-key shortcuts and recording are future stages; the help text describes the intended complete kit. `data-sound` does not itself request a file.

## Actual assistant verification

Fresh local Chromium 153.0.8010.0 under the repository CSP response header plus the page's CSP meta. `result.json` contains the actual timestamp, all assertions, keyboard observations, contrast ratios and axe results. The test injects axe and its CSP observer through browser automation; these are test instrumentation, not application scripts.

| Width | Theme | Assertions | axe violations | axe incomplete |
| --- | --- | --- | --- | --- |
| 375px | Light | 28/28 | 0 | 0 |
| 375px | Dark | 28/28 | 0 | 0 |
| 1440px | Light | 28/28 | 0 | 0 |
| 1440px | Dark | 28/28 | 0 | 0 |

Checks cover all nine native button contracts, visible sound/key names, unique IDs and bindings, same-origin relative sound paths, one h1/zero divs, no scripts/inline handlers/styles, local CSS loading, recorder initial states, polite live status, pad target sizes, text/border/focus contrast, no horizontal overflow, skip-link activation, forward/reverse Tab focus, native details Enter/Space and reduced motion. Normal navigation made no WAV requests and had no page/console errors, failed responses or CSP violations. The assistant also inspected full-page screenshots of all four configurations; no clipped labels or overlapping panels were seen.

## Test harness correction

The first run passed the structure and axe checks but failed the full Tab sweep. The harness used reload after the skip link had set `#main`, so Chromium preserved the fragment focus/navigation position. Its assertion incorrectly assumed a fresh document starting at the skip link. The correction starts that independent sweep on a fresh URL without the fragment; the application files were unchanged. `initial-harness-check.json` preserves the initial outcome and diagnosis. The corrected full run is `result.json`.

## Reproduce

Use Node with Playwright and axe-core available. Set `CHROMIUM_PATH` if Chromium is not installed in Playwright's cache. `QA_NODE_MODULES` or `CODEX_PRIMARY_RUNTIME_NODE_MODULES` can point to the dependency directory.

```sh
node verification/hw2-step1/audit.mjs
```

The script starts and closes its own HTTP server, writes `result.json`, and exits nonzero on failure. Optional `SCREENSHOTS_DIR` saves visual inspection images outside the repository.

Limits: these are local assistant checks, not student or Vercel preview checks. They do not prove audio audibility, polyphony, letter-key handling or FIFO recording. Those tests belong to Steps 2–4. Existing main/production are preserved.
