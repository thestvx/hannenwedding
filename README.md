# Hanene & Smail — Wedding Invitation

A single, mobile-first digital wedding invitation, built as a React + Vite app
and deployed to Cloudflare Pages.

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
  Gate.jsx            background04 gate, full-bleed <button>, fade transition
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
```

Static images live in `public/` and are referenced by path. Vite does not process
imports out of `public/`, and `import.meta.env.BASE_URL` is only `./` under a
repository sub-path, so URLs are resolved to absolute ones against the document
instead — see `asset()` in `Invitation.jsx`. A relative `url()` left in CSS would
resolve against the bundled stylesheet under `/assets/` and 404.

## Design notes

**The gate.** `background04.png` fills the screen and *is* the control: there is
no envelope or seal, the whole frame is one real `<button>`, so a press anywhere
enters and the gate is still reachable by keyboard. `sessionStorage` key
`hanene.gate.opened` remembers the choice for the rest of the session; a revisit
goes straight to the card.

**The artwork.** Each supplied vector is used as a CSS `mask-image`, so the
shapes, proportions and antialiasing are the original pixels and only the fill
changes.

**The fill is not uniform, and deliberately so.** The bismillah and the icons are
single near-black (`#392d2d`) drawings on a transparent ground, and they sit on
the dark middle of `background03`, so they take the light `--art-tone`. The
chandelier is *not* a near-black vector — `thorya.png` is a light cream drawing
(mean `rgb(207,204,199)`) — and it sits at the very top, where `background03` is
light. Measured there, a light fill reaches only **2.1:1** and reads as a smudge,
while `#392d2d` reaches **3.9:1**. So the chandelier takes the dark fill: the same
colour family as the bismillah, chosen for the ground it actually stands on.

**Contrast.** `background03` is dark, so all text is light cream over a dark
halo. Measured against the background across six viewports, the worst block
sits at 8.2:1 — well clear of the 4.5:1 requirement. The halo is not decorative:
without it the same blocks drop to as low as 1.2:1.

**The backgrounds themselves are untouched.** No overlay, scrim, tint, gradient
or filter is applied to either. Everything is baked into the artwork and the
type, as supplied.

**The chandelier** is sized to fill the content column (100% of the measure on
mobile, 97% on desktop) and is anchored to the very top of the page. Its real
intrinsic size is `358×376`, so `aspect-ratio` is `0.952` — forcing `1:1` would
stretch it by about 5%.

**Icons sit above their text**, on their own line, rather than beside them.

**Motion.** Three things move, in sequence.

1. The chandelier **drops in from above the page** (`chandelier-drop`, a
   `translateY(-85vh)` to `0`) the moment the gate clears. It is armed by
   `.invitation.is-open` rather than running on load, because the card is mounted
   and hidden behind the gate — a plain animation would play unseen and be over
   before the visitor ever saw it.
2. The bismillah and each verse line **fade in** as they are reached, via an
   `IntersectionObserver` on `[data-fade]`.
3. The names use the supplied `ScrollFloat` component; each word owns its own
   `ScrollTrigger`, so the words float in in sequence as they are reached.
   `ScrollTrigger.refresh()` runs once the gate is gone, because the triggers are
   first built while the page is still scroll-locked behind it.

**Reduced motion.** Under `prefers-reduced-motion: reduce` the gate transition
and the fade-ins collapse to plain opacity with no travel, the chandelier appears
without its drop, and the names render as plain text in the same wrappers — GSAP
is not started at all.

**Without JavaScript** the React root is empty, so `index.html` carries a
`<noscript>` block with the names, date, venue and notes over `background03`.

## Deployment

Deployed to Cloudflare Pages from this repository. On every push to `main`,
Cloudflare runs `npm run build` and publishes `dist/`.

Three settings in the Cloudflare Pages project, set once:

| Setting | Value |
| --- | --- |
| Framework preset | `None` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | *(empty)* |

`vite.config.js` sets `base: './'` so the build works from a sub-path without
further configuration.

A build that publishes the repository root instead of `dist/` serves
`/src/main.jsx` and answers `fonts.css` as `text/html`. The tell is a MIME error
in the console and a `fonts.css` request that comes back as markup.
