# Homework 1-3 - Work Breakdown Structure

Student: Đặng Hoài An - 24520039
Baseline: `8aa4676` in Aquarista01/24520039-DangHoaiAn-Lab1.
The homework plan is committed before new implementation. Existing Lab 1 exercises remain the starting point for HW1.

| WBS | Work package | Contract / output | Verification |
| --- | --- | --- | --- |
| 1 | Planning | This WBS, project rules, recorded baseline | Planning commit precedes homework code |
| 2 | HW1: Production portfolio | Root `index.html` | Four focused improvement milestones |
| 2.1 | Contrast and landmarks | One h1, zero divs, named regions; AA text contrast; control boundaries | Contrast calculation and accessibility audit |
| 2.2 | Keyboard navigation | Skip link moves focus; no keyboard trap; theme survives unavailable storage | Tab/Enter traversal, storage failure test |
| 2.3 | Content Security Policy | Self-hosted scripts/styles/assets; no inline handlers; Vercel response headers | Review CSP, load all pages without CSP errors |
| 2.4 | Performance | Sized local artwork, lightweight assets | Actual Lighthouse reports; no invented scores |
| 3 | HW2: Drum kit | `homework/drum-kit/index.html` | Four separate subsystem contracts |
| 3.1 | HTML data contract | Nine native buttons; data-key and data-sound; unique local WAV paths | Each key resolves one button and one audio source |
| 3.2 | Polyphonic audio | `createAudioEngine`: play(src), stopAll(), activeCount | Overlapping voices; blocked-play errors handled |
| 3.3 | Input binding | keydown / event.key / event.repeat; ignore input fields and modifiers | Click, keyboard, uppercase, held keys, Space to stop |
| 3.4 | FIFO recorder | Queue of {key, at}; elapsed monotonic ms; record/stop/replay/clear | FIFO order, timing, bounded queue, replay cancellation |
| 4 | HW3: Event landing page | `homework/event-hub/index.html` | Minimum five focused commits |
| 4.1 | Event contract | Explicit UTC ISO timestamp; visible local timezone; labelled demo | Verify UTC/local equivalence |
| 4.2 | Countdown | Remaining = max(0, target - Date.now()); no incremental subtraction | Delayed timer, elapsed date, visibility resume |
| 4.3 | Form state machine | idle -> submitting -> success/error; request service isolated | All states including retry |
| 4.4 | Duplicate prevention | Lock before the first await; immutable submitted snapshot | Burst submits produce one request |
| 4.5 | Input safety | Trim/NFC/length checks; native validation; textContent-only feedback | Whitespace and hostile markup remain inert |
| 5 | Review and handoff | AI_FAILURE_AUDIT.md, CHECKS.md, evidence, Git bundle | Report real findings and remaining deployment checks |

## Interfaces and lifecycle

HW2 markup is committed before JavaScript. The UI maps `data-key` to `data-sound`; audio accepts a URL and does not query the DOM. Recorder accepts keys and a monotonic clock. Replay calls the same pad trigger with recording disabled. Audio and replay stop on pagehide or when the document becomes hidden. Queue maximum: 256 beats / 120 seconds.

HW3 event data is `{title, startsAt, timezone, venue}`. Countdown accepts an ISO UTC string and a render callback. Form submission service receives a frozen validated snapshot and an AbortSignal. Local success/error is simulated, visibly disclosed, and never represented as a real registration. The submitting lock is set synchronously. Timer handles and pending requests are cancelled on pagehide.

## Atomic generation and evidence

Implement and inspect one WBS subsystem before moving to the next. Focused commits preserve this sequence. The audit will only record defects actually found during this run. Lighthouse and browser measurements will identify the tested URL, viewport, and environment. Screenshots and source inspection alone do not establish full WCAG conformance.
