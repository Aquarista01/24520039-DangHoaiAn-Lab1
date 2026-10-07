# Verification results

Student: Đặng Hoài An - 24520039
Final local checks: 7 October 2026 (Asia/Ho_Chi_Minh). Source is on the homework branch; the submitted bundle preserves the commit history.

## Lighthouse

Test URL: local HTTP server on 127.0.0.1. Engine: Chromium 153. Lighthouse 13. Reports retain exact versions and settings. Mobile runs use Lighthouse's default simulated mobile network/CPU profile; desktop uses a 1440x900 viewport and lighter throttling. This is a lab result, not a deployed Vercel measurement and not a separate Fast 3G field measurement.

| Run | Performance | Accessibility | Best practices | SEO | LCP (s) | CLS |
| --- | --- | --- | --- | --- | --- | --- |
| hw1-mobile | 100 | 100 | 100 | 100 | 0.910 | 0 |
| hw1-desktop | 100 | 100 | 100 | 100 | 0.250 | 0 |
| hw2-mobile | 100 | 100 | 100 | 100 | 1.213 | 0 |
| hw3-mobile | 100 | 100 | 100 | 100 | 1.244 | 0 |

Machine-readable reports are in `evidence/lighthouse-*.json`. Standalone Lighthouse HTML reports are in the handoff package's `Evidence` folder; open those as downloaded reports, not as application pages. The strict site CSP intentionally does not allow their embedded report scripts.

HW1 satisfies the requested Lighthouse 100 milestone in the recorded local mobile and desktop runs. An earlier HW2 run returned Performance 99; the final run shown above returned the measured score in its report. Scores depend on environment, so remeasure after deployment.

## Accessibility and responsive layout

- axe-core 4.14.0 checked all three pages at 375px and 1440px, in light and dark themes: 12 page configurations, zero violations in the selected WCAG A/AA and best-practice rules.
- One h1 and zero div elements on each page; no horizontal overflow in the measured configurations.
- Final browser test reached each footer using Tab. Skip navigation transfers focus into main; theme persistence works after reload.
- The audit excludes full manual screen-reader evaluation. A Lighthouse score of 100 is not a certificate of complete WCAG conformance.

## Functional browser tests

- PASS: HW1 skip link moves focus to main
- PASS: HW1 theme persists on reload
- PASS: HW1 whitespace is rejected
- PASS: HW1 all event states and retry work
- PASS: HW2 held key adds one beat; uppercase and click work
- PASS: HW2 replay does not append beats and clear resets tape
- PASS: HW2 simultaneous voices and stopAll
- PASS: HW2 bounded recorder and snapshot isolation
- PASS: HW3 duplicate burst accepts exactly one submission
- PASS: HW3 error preserves details and retry succeeds
- PASS: HW3 hostile name is rendered as literal text
- PASS: HW3 whitespace-only name is rejected
- PASS: HW3 countdown catches delays and clamps past dates
- PASS: HW3 interrupted submit recovers and restored countdown runs
- PASS: Tab navigation reaches footer on all pages without trapping focus
- PASS: All pages remain usable with blocked storage

No uncaught page errors or CSP console errors were recorded in the functional test. The audio engine tests confirm overlapping active voices; the final physical listening check should be done on the student's laptop.

## Security and deployment

- User content is rendered through textContent, never innerHTML.
- Runtime HTML has no inline scripts, inline event handlers or external script/CDN dependencies.
- Strict same-origin CSP is present in page metadata. `vercel.json` also defines frame-ancestors, MIME sniffing protection, referrer policy and permissions policy as response headers.
- Local registration uses a simulated adapter; it makes no network request and does not persist input. This is disclosed on the page.
- GitHub and Vercel have not been changed by this local work. After pushing the supplied history, verify the HTTPS URLs and response headers on Vercel and capture final deployment screenshots.
