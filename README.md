# Oscar Kilgore — Portfolio

Personal portfolio for a web developer working in WordPress, Shopify, e-commerce, WebOps and technical support.

**Status: Phase 1 — design system and homepage.** The six case-study pages are Phase 2 and are not built yet.

Semantic HTML, modern CSS, vanilla JavaScript. No framework, no build step, no dependencies, nothing to install. Deploy by uploading the folder.

---

## Run it

There is nothing to install. Open `index.html` in a browser — it works from
`file://` because there are no ES modules, imports or fetches.

To serve it over HTTP instead (closer to production):

```bash
npx serve .
```

## Deploy

Static output with no build step, so any static host works as-is.

- **Cloudflare Pages** — connect the repo, leave the build command empty, output directory `/`
- **GitHub Pages** — push to `main`, enable Pages from the branch root
- **Netlify** — drag the folder in, or connect the repo with no build command

---

## Structure

```
index.html                  Homepage (Phase 1 — complete)
work/                       Case-study pages (Phase 2 — empty)
resume/                     Resume PDF drop point
assets/
  css/
    main.css                Tokens, reset, base type, layout primitives
    components.css          Every section and interactive component
    responsive.css          Breakpoint composition, pointer/print queries
    opening-hand.css        Opening Hand + Investigation Mode
  js/
    utils.js                Shared frame loop, pointer, resize bus
    theme.js                Palette wheel — popover, keyboard model, storage
    cursor.js               Contextual cursor label
    magnetic.js             Pointer attraction for [data-magnetic]
    projects.js             Work index state + cursor-following preview
    cards.js                Opening Hand card pool (data only)
    opening-hand.js         Opening Hand, Mulligan, Investigation Mode
    main.js                 Nav, hero headline, reveals, parallax, details
  images/                   Placeholder project SVGs
_archive/v1/                Earlier draft. Its case-study copy is useful
                            source material for Phase 2. Safe to delete.
```

---

## Design system

Everything is driven by custom properties in `main.css`. There are no
arbitrary values in component rules.

**Colour** — warm off-white paper, warm near-black ink, three greys, one
accent (vermilion `#b03a1e`). No gradients.

Six palettes ship, selectable from the wheel in the masthead. Each is the
**same eleven custom properties with different values** — no component rule
anywhere in the site knows a theme exists, which is the whole payoff of
building on tokens:

| Theme | Character |
|---|---|
| Auto | Follows the operating system (default) |
| Paper | Warm off-white, vermilion |
| Blueprint | Cool grey, drafting-ink blue |
| Moss | Warm sand, deep green |
| Ink | Warm dark, ember |
| Carbon | Cool near-black, signal amber |

Every palette is contrast-verified: `--ink`, `--ink-2`, `--ink-3` and
`--accent` all clear WCAG AA (4.5:1) against both `--paper` and
`--paper-sunk`. Lowest measured value across all five explicit themes is
4.80:1.

The choice persists in `localStorage` and is applied by the inline `<head>`
script **before first paint**, so a stored theme never flashes the default
first. `[data-theme]` on `<html>` outranks the `prefers-color-scheme` media
query by specificity, so an explicit choice always beats the system
preference; `auto` declares no palette and falls through to it.

**Type** — two families. `Archivo` (variable, `wght 100–900` / `wdth
62–125`) carries display and UI; the width axis gives typographic range
without a third font file. `IBM Plex Mono` is used only for small,
uppercase, non-prose metadata — project numbers, categories, stack lists,
status. Sizes come from a fluid `clamp()` scale, not per-section guesses.

**Space** — one `--sp-1 … --sp-10` scale. Section rhythm and page gutters
are fluid (`clamp`), so they respond continuously rather than jumping at
breakpoints.

**Motion** — `--dur-fast` 160ms (state feedback), `--dur-med` 320ms
(element transitions), `--dur-slow` 640ms (reveals), plus three easings.
There is no `transition: all` anywhere.

**Grid** — 12 columns. It switches on at `64em`; below that the page is
ordinary flow re-composed for the width, not a collapsed grid.

Press **Alt+G** on the live page to overlay the grid.

---

## Interaction

| Where | What | Notes |
|---|---|---|
| Hero headline | Characters gain weight as the pointer approaches | The one "memorable detail". Each glyph box is frozen at its heaviest width on init, so varying weight never reflows the line. |
| Work index | Row engages, siblings dim, preview follows the pointer | Preview is offset above the pointer (below when there's no room), so it never covers the row being read. Self-healing: see below. |
| Theme wheel | Swatch rotates open, chips preview each palette | Real radio group — arrow keys move and select, Home/End jump, roving tabindex, Escape returns focus to the trigger. |
| Primary CTA | Magnetic attraction, label parallaxes | Opt-in per element via `data-magnetic`. |
| Wordmark | Contracts to `OK` on scroll, expands on hover | |
| Nav | Rolling text, active-section underline via `aria-current` | |
| Reveals | Three behaviours — `mask`, `rule`, `rise` | Declared per element so different content moves differently. |

**The preview never gets stranded.** `pointerleave` is not guaranteed to
arrive — the page can scroll out from under a stationary pointer, the layout
can shift, the window can lose focus mid-gesture. So the preview does not
trust the event: every frame it re-checks that the pointer is still inside
the row that opened it, and closes itself the moment that stops being true.
The reveal is also deferred by one frame for a clean transition start, and
that request is cancelled on hide — otherwise a hide landing in that gap
would be undone by the queued callback, leaving the image visible with no
loop running to move or dismiss it.

---

## Opening Hand

An interactive section between About and Contact. Deals seven cards from a
29-card pool of skills, experience and interests; `MULLIGAN ↻` deals a new
hand. Cards flip to reveal a description.

**Card data** lives in `assets/js/cards.js` and nothing else. Adding,
removing or rewording a card is a one-line change — no markup, no CSS.

**Fan geometry is CSS.** JavaScript writes two unitless numbers per card —
`--card-i` (position 0–6) and `--card-lift` (distance from the middle) — and
every unit, angle, step and breakpoint lives in `opening-hand.css`. The hand
can be re-tuned, or resized, without touching the logic.

**No new rAF loop.** Dealing is CSS transitions driven by a class plus a
per-card `transition-delay`; hover is pure CSS. Deal staggers at 60ms, clears
at 40ms — faster out than in.

**Shuffle** is Fisher–Yates over a copy of the pool, so duplicates within a
hand are structurally impossible. An identical-consecutive-hand guard
reshuffles up to three times; with C(29,7) = 1,560,780 possible hands it
effectively never fires, but a repeat would read as a broken shuffle.

**Responsive.** Fan at ≥64em; below that the fan is *replaced* by a
full-bleed horizontal snap strip with 150×212 cards — shrinking seven
overlapping cards onto a phone makes them unreadable. Cards are 168×236 at
≥75em: a ratio of 1:1.405, where a real playing card is 1:1.397. It reads as
a card without a single card-frame element.

**Accessibility.** Cards are native `<button>`s with `aria-expanded` /
`aria-controls`; the hidden face is `aria-hidden` so a collapsed card never
leaks its description. A polite live region announces deals and every
investigation state change. All statuses are words, never colour alone.
Under `prefers-reduced-motion` the fan is replaced by a flat grid rather than
merely un-animated, and dealing is immediate.

### Testing

```js
window.__OK_FORCE_BUG = true
```

Set that in the console, then press Mulligan. Not referenced anywhere in the
UI.

---

**Performance.** One shared `requestAnimationFrame` loop and one
`pointermove` listener for the whole page (`utils.js`). Listeners record
position and nothing else; all measuring and writing happens in the frame.
Geometry is cached and invalidated on resize/scroll rather than measured
per frame. Only `transform` and `opacity` are animated. Effects unsubscribe
from the loop when their element leaves the viewport, and the loop stops
itself when the last subscriber leaves.

**Accessibility.** Semantic landmarks and heading order, skip link, visible
`:focus-visible` rings, keyboard focus mirroring every hover state, and
`aria-label` on the split headline so it isn't announced letter by letter.
`prefers-reduced-motion: reduce` is honoured in CSS *and* checked in JS —
pointer-driven effects are never registered at all, and reveals resolve
immediately. Nothing important is hover-only: touch devices get inline
thumbnails instead of the cursor preview.

**Progressive enhancement.** With JavaScript disabled the page is complete
and navigable — the headline renders at a fixed weight, project thumbnails
render inline, and the drawer link list is plain anchors.

---

## Before this goes live

- [ ] **Resume PDF** → `resume/oscar-kilgore-resume.pdf`. Linked from the nav and the contact section, marked `TBA` until it exists.
- [ ] **LinkedIn URL** → contact section, currently `[ add profile URL ]`. (GitHub is wired up.)
- [ ] **Canonical + `og:url`** → replace `https://example.com/` in `index.html`.
- [ ] **`og:image`** → add a 1200×630 image and the meta tag.
- [ ] **Favicon**.

- [ ] **Project screenshots** → replace `assets/images/project-0*.svg`. Sanitize first: no client names, domains, private URLs, order IDs, credentials or tokens. Anonymize the client if you're unsure you can name them.

## Phase 2

The six case-study pages in `work/`. Template per the brief: number and
category → title → intro → metadata (role / stack / project type) → the
problem → the investigation → the solution → technical details → the result
→ what I learned → next project.

When they exist, delete the `data-pending` attributes on the index links in
`index.html`, the Phase 1 `.build-note`, and the pending-link block in
`projects.js` (it's marked).

---

Designed and developed by Oscar Kilgore.
