# Hanene & Smail — Wedding Invitation

A single, tall, mobile-first digital wedding card. One continuous vertical
composition that scrolls like a printed invitation, set directly on its own
paper. No envelope, no navigation, no panels.

**Hanene & Smail — 15 October 2026 — صالة عزوز للافراح والمناسبات**

---

## The background is never treated

`background/background02.png` (736 × 1104, 2:3) is placed as-is, full bleed,
with `background-size: cover`. There is deliberately **no** overlay, scrim,
vignette, grain, tint, gradient, opacity, blur, brightness or contrast change
anywhere in the stylesheet. The only `background-color` in the project is on
`html`/`body`, set to `#ece2d9` — a tone sampled from the image itself — and it
sits *behind* the picture purely so mobile overscroll does not flash white.

Legibility is solved with type colour, position, size and spacing instead.

## The palette is sampled from the image, not invented

The background is light and warm, so the type is dark and warm. Measured
luminance of the paper is ~212/255, with the cleanest area at the centre
(~230). Every ink tone below was chosen against real pixel values from the
file, not by eye.

| Token | Value | Worst measured contrast | Role |
| --- | --- | --- | --- |
| `--ink` | `#3f2d1f` | 9.8:1 | names, venue |
| `--ink-2` | `#5a4433` | 6.8:1 | date |
| `--ink-3` | `#6f5a45` | 5.0:1 | notes |
| `--gold` | `#7d6134` | 4.3:1 | ornaments, ampersand |
| `--gold-soft` | `#8f7043` | — | hairline rules |
| `--paper` | `#ece2d9` | — | overscroll only, never over the image |

## Typography

- **English** — `fonts/Bettrisia Script Alt Regular.otf` (`Bettrisia`), for
  every English character on the page.
- **Arabic** — `fonts/janna-2-thin.otf` (`Janna`), for every Arabic character.

Both are self-hosted via `@font-face` with `font-display: swap` and preloaded.
There is no Google Fonts request and no Cormorant/Amiri anywhere in the
project.

> **Serve this over HTTP, not `file://`.** Chrome blocks `@font-face` on
> `file://` (fonts are always fetched in CORS mode, and a `file://` origin is
> `null`). Opening `index.html` directly will silently fall back to system
> fonts. From the project root run `python -m http.server 8000` and open
> `http://localhost:8000`.

## Composition

One `<article class="sheet">` in normal flow. There are no sections, cards,
grids, borders or panels — the vertical rhythm is made purely of whitespace, so
the whole thing reads as a single tall card. The order top to bottom:

1. botanical crown ornament
2. the names, as the loudest element on the page
3. broad rule with a lozenge
4. the date
5. the venue
6. fine rule
7. a long breath, then the two practical notes
8. mirrored foot ornament

On a 390 × 844 phone the card is ~2.2 viewports tall. Desktop keeps the same
portrait column, centred, rather than going horizontal.

## Interaction

There are no buttons. `script.js` only runs an `IntersectionObserver` that
reveals each block as it scrolls into view (opacity, a short rise, a 3px blur
that resolves). Each element is unobserved once shown.

- **Reduced motion** — the observer marks everything visible immediately and
  the transform/blur are dropped; only a short opacity fade remains.
- **No JavaScript** — the hidden initial state is scoped to `.js [data-reveal]`,
  so with JS off every element renders at full opacity. Nothing is ever
  permanently hidden.
- **No `IntersectionObserver`** — falls back to showing everything.

## Verified

Checked in real Chrome over CDP at 360×800, 375×812, 390×844, 393×852,
414×896, 430×932, 768×1024, 1440×900 and 740×360, each in both normal and
`prefers-reduced-motion` modes.

- no horizontal scrolling or clipping at any size; no child overflows the viewport
- every text block meets WCAG AA against the **actual sampled background
  pixels** behind it (names 9.8:1, date 6.8:1, venue 6.8:1, notes 5.0:1)
- all 8 reveal blocks fire over a full scroll, in both motion modes
- no console errors
- both fonts confirmed loaded and applied

## Files

```
index.html                              markup + inline ornament sprite
style.css                               the whole design
script.js                               scroll reveals only
background/background02.png             the paper, unmodified
fonts/Bettrisia Script Alt Regular.otf  English
fonts/janna-2-thin.otf                  Arabic
assets/svg/ornament-favicon.svg         favicon
```

`background/background.jpg`, `assets/textures/paper-grain.svg` and
`assets/svg/seal-favicon.svg` are left over from the previous envelope design.
They are no longer referenced by anything and can be deleted.
