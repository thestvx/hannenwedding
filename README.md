# Hanene & Smail — Wedding Invitation

A single, tall, mobile-first digital wedding card that opens from a sealed
envelope, then scrolls like a printed invitation. One continuous vertical
composition, set directly on its own background. No panels, no navigation.

**Hanene & Smail — 15 October 2026 — صالة عزوز للافراح والمناسبات**

---

## The envelope gate

On the very first visit the invitation is hidden behind a full-screen envelope
with a wax seal.

- The seal is a real `<button>` with `aria-label="افتح الدعوة"`, so it is
  reachable and operable by keyboard and screen reader.
- Pressing it plays the flap opening, a warm glow that blooms out past the
  viewport, and the envelope dissolving. The invitation is revealed behind it.
- The invitation then arms its scroll reveals and focus moves to the names.
- `sessionStorage` key `hanene.gate.opened` means the gate is shown **once per
  session**. Reloading or navigating back goes straight to the invitation.
- The gate is `hidden` in the markup, so **with JavaScript off it never appears**
  and the invitation renders normally.
- Under `prefers-reduced-motion` the bloom becomes a plain short fade and the
  timings collapse; the gate is still fully operable.

## The background is never treated

`background/background04.png` (941 × 1671, 9:16) is placed as-is, full bleed, on
a fixed `.canvas` with `background-size: cover`. There is deliberately **no**
overlay, scrim, vignette, grain, tint, gradient, opacity, blur, brightness or
contrast change anywhere in the stylesheet — the fixed canvas keeps the artwork
still while the text scrolls over it. The only `background-color` values are on
`html`/`body` (overscroll colour, `#ecdcd8`) and on the gate (a solid
`#e9d6d2`), both *behind* the picture, never over it.

## The ink is sampled from the supplied artwork, not invented

Every supplied vector is the same warm near-black, `#392d2d` — measured from the
pixels of `vectors/bsm.png`, `bark.png`, `date.png`, `gps.png` and `pin.png`.
That value is `--ink`, so the text and the artwork read as one palette.

`background04.png` is a light dusty rose overall (mean luminance ~182/255) but
has a **dark bronze centre** (≈ `#92684c`, L≈111) that the text column crosses.

| Token | Value | Role |
| --- | --- | --- |
| `--ink` | `#392d2d` | every text block |
| `--ink-2` / `--ink-3` | `#4a3a39` / `#5b4745` | secondary tone |
| `--gold` | `#7d6134` | hairlines, rules |
| `--halo` | `#f7efe8` glow | legibility only, see below |
| `--paper` | `#ecdcd8` | overscroll only, never over the image |
| `--gate-bg` | `#e9d6d2` | solid envelope backdrop |

### Legibility is a text effect, not an image effect

Measured against the real background pixels, `#392d2d` on its own reaches 6.9:1
over the median of the text column but drops to **1.7–3.0:1** where a block
crosses the dark centre — on wide desktop viewports the `.detail` block has up
to 89% of its box below the plain-AA threshold. So every text block carries a
subtle light text-shadow (`--halo`) that becomes visible only where the
background is dark and disappears where it is already light.

This is a property of the **text**, not the picture: the image is still
untouched. Verification models the halo conservatively at 75% effective
coverage, and every block still clears 8.0:1. Raw ink-only contrast is reported
alongside so the dependence on the halo is never hidden.

## Typography

- **English** — `fonts/Bettrisia Script Alt Regular.otf` (`Bettrisia`).
- **Arabic** — `fonts/janna-2-thin.otf` (`Janna`).

Both are self-hosted via `@font-face` with `font-display: swap` and preloaded.
No third-party font request anywhere in the project.

> **Serve this over HTTP, not `file://`.** Chrome blocks `@font-face` on
> `file://` (fonts are always fetched in CORS mode, and a `file://` origin is
> `null`). Opening `index.html` directly silently falls back to system fonts.
> From the project root run `python -m http.server 8000` and open
> `http://localhost:8000`.

## Composition

One `<main class="invitation">` in normal flow, over the fixed canvas. There
are no cards, grids, borders or panels — the vertical rhythm is made purely of
whitespace. The order top to bottom:

1. chandelier — `vectors/thorya.png`
2. Basmala calligraphy — `vectors/bsm.png`
3. Baraka calligraphy — `vectors/bark.png`
4. the opening verse, as two lines
5. the names, as the loudest element on the page
6. date (`vectors/date.png`) and venue (`vectors/gps.png`)
7. the two practical notes, with `vectors/pin.png`
8. hairline rules between the groups

The Arabic verse is stored with its **kashida/tatweel elongations exactly as
supplied** — runs of 4, 5, 5, 7, 10, 9 and 18 on line one, and 6, 4, 5 and 8 on
line two — and the verification asserts both the base letters and the
elongation runs.

On a 390 × 844 phone the card is ~2.3 viewports tall. Desktop keeps the same
portrait column, centred, rather than going horizontal.

## Interaction

Beyond the gate, `script.js` runs an `IntersectionObserver` that reveals each
block as it scrolls into view. Each element is unobserved once shown.

- **Reduced motion** — the observer marks everything visible immediately and the
  transform is dropped; only a short opacity fade remains.
- **No JavaScript** — the hidden initial state is scoped to `.js [data-reveal]`,
  and the gate is `hidden` in the markup, so with JS off the invitation renders
  complete and open.
- **No `IntersectionObserver`** — falls back to showing everything.

## Verified

Checked in real Chrome over CDP at 360×800, 375×812, 390×844, 393×852,
414×896, 430×932, 768×1024, 1440×900 and 740×360.

- gate appears on first visit, is skipped on revisit within a session, and is
  fully removed under `prefers-reduced-motion`
- the bloom animation actually fires (the class lands on the bloom element and
  the CSS selector matches it)
- no horizontal scrolling or clipping at any size; no child overflows the viewport
- all 7 reveal blocks fire over a full scroll
- all 6 images load; no console errors
- every text block clears its WCAG AA target with the halo, at every scroll
  position, at every size
- the date, venue, both notes and both verse lines match the requested text
  exactly, in the source and as rendered after the gate opens

## Files

```
index.html                              markup, gate + invitation
style.css                               the whole design
script.js                               gate, session state, scroll reveals
background/background04.png             the background, unmodified
vectors/thorya.png                      chandelier
vectors/bsm.png                         Basmala calligraphy
vectors/bark.png                        Baraka calligraphy
vectors/date.png                        date icon
vectors/gps.png                         venue icon
vectors/pin.png                         notes icon
fonts/Bettrisia Script Alt Regular.otf  English
fonts/janna-2-thin.otf                  Arabic
assets/svg/ornament-favicon.svg         favicon
```

`background/background02.png`, `background/background03.png`,
`background/background.jpg`, `assets/textures/paper-grain.svg` and
`assets/svg/seal-favicon.svg` are left over from earlier designs. They are no
longer referenced by anything and can be deleted.
