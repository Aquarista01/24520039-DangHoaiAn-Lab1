# Portfolio homework navigation — WBS 9

Starting commit: b470cccf7826da1fe7e16ec9338ce73387060d85.
Assistant local checks on 7 October 2026, Chromium 153.0.8010.0.

Application changes are limited to index.html: one native Homework nav anchor, one separately named section identifying the current portfolio as HW1, two existing-style cards linking to HW2/HW3 directories, and adjusted visible section numbers. Existing corrected accessible names, CSS/modules, all homework implementation/assets and CSP configuration remain unchanged. The user relayed the instructor's separate-branch-or-directory requirement before this package; README/WBS/project-rules now explicitly keep HW1 on hw-atomic-rebuild, with HW2/HW3 in dedicated directories. Earlier prospective main-merge plans are superseded.

## Actual checks

| Configuration | Assertions | Axe |
| --- | --- | --- |
| 375px light | 21/21 | Portfolio, drum initial, workshop initial: zero violations |
| 375px dark | 21/21 | Same |
| 1440px light | 21/21 | Same |
| 1440px dark | 21/21 | Same |
| 375px with JavaScript disabled | 5/5 | Not run |

Total: 89/89 assertions and 12 axe 4.14.0 audits with zero violations. The portfolio audits retain color-contrast incomplete items for existing short/icon glyphs (4 nodes light, 3 dark); these are not claimed as resolved or as a full WCAG certification. Drum/workshop initial audits have no incomplete items. The source/header CSP and same-origin module assets were enforced by the local server, not inferred from a Vercel screenshot.

Trusted Tab/Enter reaches the Homework nav, activates its native hash, enters the first card, opens the drum page and follows its back link, then opens the workshop and returns. Focus outlines are visible at each tested link. Each route loads its own module and independent initial state; countdown/form initialize, all nine pads and idle recorder appear, and the portfolio's existing four-state component returns. This package does not exercise audio/record/replay or full registration behavior. There are no popup, failed responses/requests, runtime/CSP errors or unhandled rejections in the tested round trip. One h1/zero divs, unique IDs, no inline code and no overflow pass on all routes/configurations.

A separate JavaScript-disabled native-click round trip preserves usable page/back links and the workshop's safe disabled-submit fallback. It is not a no-JavaScript audio/form claim. Mobile light and desktop dark Homework section screenshots were visually inspected. The workshop badge was shortened to LOCAL DEMO so the mobile link/arrow fits cleanly; the final suite and mobile screenshot were refreshed after that HTML edit.

The first harness launch waited for an incorrect assumed sample-event title and timed out. The actual portfolio emits “3 upcoming events”; only the harness wait was corrected. No application defect was introduced/fixed for that wait, and it is not part of the AI failure audit.

## Reproduce

```sh
QA_NODE_MODULES=/path/to/node_modules CHROMIUM_PATH=/path/to/chromium node verification/homework-navigation/audit.mjs
```

The script imports the previous QA-only local server/browser helper, starts its own process/server, and writes result.json here. Optional SCREENSHOTS_DIR writes temporary inspection screenshots outside the repository. It exits nonzero on a failed assertion and closes its browser/server. Original evidence is untouched.

Limits: fresh navigation/initialization checks only. No full final homework review, new Lighthouse/listening result, hosted-header check, student laptop capture or live defense is claimed. Final review and publication remain later packages. The original main/history and separate homework branch are preserved.
