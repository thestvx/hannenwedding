# Hanene & Smail — Wedding Invitation

A single, mobile-first digital wedding invitation, built as a React + Vite app
and deployed to GitHub Pages.

The first view is a full-screen gate on `background04.png`. Pressing **anywhere**
on it opens the invitation, which is set on `background03.png` and scrolls like a
printed card: a large chandelier at the top, the bismillah, the verse, the
couple's names, then the date and venue, then the notes.

**هناء و إسماعيل — 15 أكتوبر 2026 — صالة عزوز للافراح والمناسبات**

---

## Commands

```bash
npm install        # install dependencies
npm run dev        # local dev server
npm run build      # production build into dist/
npm run preview    # serve the built dist/ locally
```

## How it is put together

```
index.html            document shell, fonts, metadata, <noscript> fallback
src/main.jsx          React entry
src/App.jsx           gate-vs-invitation state, body scroll lock
src/components/
  Gate.jsx            background04 gate, any-click handler, bloom transition
  Invitation.jsx      background03 card, masked artwork, stacked details
  ScrollFloat.jsx     supplied GSAP scroll-float component
  ScrollFloat.css     styles for the above
src/styles.css        the design
public/
  background/         background03.png (card), background04.png (gate)
  vectors/            thorya, bsm, bark, date, gps, pin
  fonts/              Janna 2 Thin, Bettrisia Script Alt
  fonts.css           @font-face declarations
  assets/svg/         favicon
.github/workflows/deploy.yml   builds and publishes to GitHub Pages
```

Static images live in `public/` and are referenced by path. Vite does not process
imports out of `public/`, and `import.meta.env.BASE_URL` is only `./` under a
repository sub-path, so URLs are resolved to absolute ones against the document
instead — see `asset()` in `Invitation.jsx`. A relative `url()` left in CSS would
resolve against the bundled stylesheet under `/assets/` and 404.

## Design notes

**The gate.** `background04.png` fills the screen. The click handler is on the
gate itself rather than the seal, so a press anywhere opens it. The seal is a
real `<button>`, so the gate is still reachable by keyboard. `sessionStorage` key
`hanene.gate.opened` remembers the choice for the rest of the session; a revisit
goes straight to the card.

**The artwork.** Every supplied vector is a single warm near-black (`#392d2d`)
drawing on a transparent ground. Each one is used as a CSS `mask-image` and
filled with a light tone, so the shapes, proportions and antialiasing are the
original pixels and only the colour changes to suit the dark `background03`.

**Contrast.** `background03` is dark, so all text is light cream over a dark
halo. Measured against the background across six viewports, the worst block
sits at 8.2:1 — well clear of the 4.5:1 requirement. The halo is not decorative:
without it the same blocks drop to as low as 1.2:1.

**The backgrounds themselves are untouched.** No overlay, scrim, tint, gradient
or filter is applied to either. Everything is baked into the artwork and the
type, as supplied.

**The chandelier** is sized to fill the content column (100% of the measure on
mobile, 97% on desktop) and is anchored to the very top of the page. Its
intrinsic 1:1 ratio is preserved via `aspect-ratio`, so it is never stretched.

**Icons sit above their text**, on their own line, rather than beside them.

**Motion.** The `[data-reveal]` blocks fade up on an `IntersectionObserver`. The
names use the supplied `ScrollFloat` component; each word owns its own
`ScrollTrigger`, so the three words float in in sequence as they are reached.
`ScrollTrigger.refresh()` runs once the gate is gone, because the triggers are
first built while the page is still scroll-locked behind it.

**Reduced motion.** Under `prefers-reduced-motion: reduce` the gate transition
collapses to a plain fade, `[data-reveal]` drops its transform, and the names
render as plain text in the same wrappers — GSAP is not started at all.

**Without JavaScript** the React root is empty, so `index.html` carries a
`<noscript>` block with the names, date, venue and notes over `background03`.

## Deployment

`.github/workflows/deploy.yml` builds with Node 20 and publishes `dist/` to
GitHub Pages on every push to `main`.

One setting is required in the repository, once: **Settings → Pages → Build and
deployment → Source → GitHub Actions**. The workflow will not run until this is
set.

`vite.config.js` sets `base: './'` so the build works from a repository
sub-path without further configuration.
