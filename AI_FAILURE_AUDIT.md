# AI failure mode audit

Student: Đặng Hoài An - 24520039
Scope: the AI-assisted Lab 1 baseline and HW1-HW3 extension.
These are observed defects, not invented examples. Baseline findings refer to commit `8aa4676`. Evidence is in `homework/evidence/accessibility-before-fixes.json`, `homework/evidence/accessibility.json`, and `homework/evidence/functional.json`.

## 1. Optional browser storage stopped unrelated components

**Defect description.** The baseline `app.js` called `localStorage.getItem('theme')` at module top level without exception handling. Browsers can deny storage. One thrown SecurityError prevented theme handlers, contact handlers and `initializeEventHub()` from running.

**Diagnostic method.** Reviewed the module execution order in the Git diff, then injected a blocked-storage getter in a Chromium context. The baseline raised `Storage blocked for review` and the event panel remained empty. The exact observation is retained in `homework/evidence/accessibility.json` under `baseline.storageFinding`.

**Refactored solution.** Put storage reads and writes in try/catch. Accept only `light` or `dark`, keep an in-memory theme when persistence is unavailable, and respect the system theme otherwise. The final blocked-storage browser test visits all three pages, toggles the theme and records zero page errors.

**Lesson.** Optional persistence must not be a prerequisite for the rest of a page.

## 2. HTML minlength allowed whitespace-only contact data

**Defect description.** The baseline contact form relied on native minlength alone. A name containing three spaces and a message containing twelve spaces satisfied it and produced the success message. Those strings have no useful content.

**Diagnostic method.** Filled the original form with those values and a valid email address, then submitted it in Chromium. The baseline returned `Form validated. This local demo did not send a message.` This observation is stored as `baseline.spacesFinding`.

**Refactored solution.** Normalize Unicode with NFC, trim surrounding whitespace, and explicitly validate the resulting length using setCustomValidity. Clear custom errors when the user types. HW3 uses the same principle in a separate validation module and returns a frozen validated snapshot. User content reaches the DOM only through textContent; validation and safe output are separate controls.

**Verification.** The final browser tests reject whitespace-only names in both forms. A hostile name such as `<img src=x onerror=alert(1)>` appears as literal text in the HW3 status and creates no image or executable markup.

**Lesson.** Native validation is a useful base, but it does not enforce the meaning of an input.

## 3. Countdown styling used invalid description-list structure

**Defect description.** The first HW3 draft put section elements directly inside a dl, then nested dt and dd inside those sections. That structure is invalid even though it looks correct. It arose while trying to group four countdown cells without generic div containers.

**Diagnostic method.** axe-core reported `definition-list` and `dlitem` violations on both mobile and desktop. See the HW3 entries in `homework/evidence/accessibility-before-fixes.json`. Source inspection confirmed that the direct parent of each dt/dd was section rather than dl.

**Refactored solution.** Replace the dl with a named countdown section containing four paragraphs, each with a strong numeric value and a span label. Keep the CSS Grid and the IDs used by the countdown renderer. The correction is preserved in commit `ed746de`.

**Verification.** The final accessibility report contains zero violations for all three pages at 375px and 1440px in both light and dark themes.

**Lesson.** A visual group must still follow the content model of its HTML element. A ban on generic containers does not justify invalid semantic markup.

## Further findings caught during review

- Accessible link names omitted the visible words Explore, Play and Visit. Names now include them; drum pads use their full visible content as the accessible name.
- Nested named sections shared a landmark name. The outer wrappers no longer create duplicate named landmarks.
- Lifecycle review found that pagehide cleanup also needed a pageshow path for the back-forward cache. The countdown restarts on restored pages and interrupted submissions recover into a retryable error state. The functional report includes a pagehide/pageshow regression test.

## Verification limits

The supplied evidence is from local Chromium, not a published Vercel deployment. Automated accessibility checks plus keyboard checks do not establish complete WCAG 2.2 conformance. A physical listening check, published HTTPS/header inspection, and Lighthouse on the final Vercel URL remain part of the student's final submission review.
