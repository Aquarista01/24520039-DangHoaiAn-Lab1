# Lab 1 - Task decomposition

Student: Dang Hoai An (24520039)

This document defines the contracts before implementation. Each code stage is committed separately.

| Task | Contract | Isolated verification |
| --- | --- | --- |
| T-01 | One `h1`; no `div`; skip link targets `#main`; header, nav, main, sections, footer. | Inspect DOM landmarks; Tab activates skip link. |
| T-02A | CSS tokens in `:root`; universal border-box reset; color pairs meet 4.5:1. | Inspect computed styles at 375px. |
| T-02B | Project and skills grids use `repeat(auto-fit, minmax(min(100%, 280px), 1fr))`. | 375px and desktop widths without overflow. |
| T-02C | Button `#theme-toggle` has `aria-pressed`; persist `theme` as `light` or `dark`. | Toggle twice and reload, check storage and console. |
| T-03A | `#event-status` initially shows CSS skeleton; reduced motion stops animation. | Select Loading and check live region. |
| T-03B | Ready state renders supplied events using DOM nodes and `textContent`. | Select Live and inspect cards and badges. |
| T-03C | Empty and Error have messages; Error includes keyboard-operable Retry. | Select Empty/Error, then Retry. |

## DOM and data contract

The page uses only semantic HTML containers. Nav links target existing section IDs. All form fields have visible labels. Project cards are `article` elements. Event data is an array of `{title, date, location, type}` objects. The component exposes `renderEvents(state, events)` where `state` belongs to `{loading, ready, empty, error}`; data is never inserted with `innerHTML`. The Retry action reloads the local sample. Demo buttons let the assessor inspect each state without relying on an external API.

## Event hub state machine

`loading -> ready | empty | error`; `error -> loading` on retry. Manual demo controls can select any state. A monotonically increasing request token prevents an older timer from overwriting a newer state. The controls are buttons, and the content container has `role="status"` and `aria-live="polite"`.

## Verification log

Run `python3 -m http.server 5500` from this directory; open `http://localhost:5500`. Verify narrow and desktop screens, Tab and Enter, theme persistence, and all four event states. Exact measurements and screenshots are recorded in the submission PDF.
