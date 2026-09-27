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
index.html            document shell, fonts, metadata, <title>, <noscript> fallback
src/main.jsx          React entry
src/App.jsx           gate-vs-invitation state, body scroll lock
src/components/
  Gate.jsx            background04 gate, full-bleed <button>, fade transition
  Invitation.jsx      background03 card, fixed chandelier, stacked details
  SplitText.jsx       supplied GSAP per-character text component
src/styles.css        the design
public/
  background/         background03.png (card), background04.png (gate)
  vectors/            thorya, bsm, bark, date, gps, pin
  fonts/              Tajawal Bold (Arabic body), Bettrisia Script Alt (names)
  fonts.css           @font-face declarations
  assets/svg/         favicon
```

## Typography

Body copy is **Tajawal Bold** (`Tajawal-Bold.ttf`, weight 700), preloaded in
`index.html` and the only Arabic weight shipped. The couple's names stay in
**Bettrisia Script Alt**, which is a Latin display face and reads as a signature.
`Janna` is still declared in `fonts.css` for reference but nothing uses it, so it
never loads — `document.fonts` reports it `unloaded`, which is expected.

The document title, and the `og:title`, are
`Hannen & Smail Invitation Wedding`. Note the spelling: the title says
`Hannen`, while the names in the artwork say `Hanene`. That is deliberate — the
title was given exactly.

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

**The artwork.** The bismillah and the icons are single near-black (`#392d2d`)
drawings on a transparent ground, so they are used as a CSS `mask-image`: the
shapes, proportions and antialiasing are the original pixels and only the fill
changes. They sit on the dark middle of `background03`, so they take the light
`--art-tone`.

**The chandelier keeps its own colours.** `thorya.png` is not a near-black vector
— it is a light cream drawing (mean `rgb(207,204,199)`) — so it is *not* masked
and *not* recoloured. It is dropped in as an ordinary `<img>` with no overlay,
filter, `mix-blend-mode` or background, exactly as supplied. That was a deliberate
correction: the previous build masked it to `#392d2d`, and the fix was rejected —
the chandelier keeps the colour it was drawn in. It now sits **behind** the type
rather than in front of it, so the light drawing never has to compete with the
text.

The consequence is stated plainly: measured at the top of the page, where
`background03` is light, the original cream chandelier reaches only about
**2.1:1** against the background and reads faintly. That is accepted, because
recolouring the artwork is not wanted. Nothing else was changed to compensate —
no scrim, tint or gradient is added behind it.

**Contrast.** `background03` is dark, so all text is light cream over a dark
halo. Measured against the background across six viewports, the worst text block
sits at **13.4:1** and the same blocks with the halo removed fall to as low as
**7.5:1** — both well clear of the 4.5:1 requirement. The halo is not decorative;
it is what keeps the type legible over the artwork behind it.

**The backgrounds themselves are untouched.** No overlay, scrim, tint, gradient
or filter is applied to either. Everything is baked into the artwork and the
type, as supplied.

**The chandelier is fixed to the viewport.** It is `position: fixed; top: 0`,
centred, `pointer-events: none` and at `z-index: 0`, so it stays put while the
card scrolls and the text passes over it. Two things keep that working:

- It is sized from a CSS custom property pair so its space can be reserved
  exactly — `--chandelier-w: min(26rem, 92vw)` and
  `--chandelier-h: calc(var(--chandelier-w) / 0.95213)`. The `0.952` is the real
  intrinsic ratio of `358×376`; forcing `1:1` would stretch it by about 5%.
- `.opening` reserves that height with
  `padding-top: calc(var(--chandelier-h) + 3svh)`, so the first real line of text
  is never underneath the chandelier, and `.opening > *:not(.chandelier)` is given
  `position: relative; z-index: 1` to sit above it.

`ScrollSmoother` is deliberately *not* used. It wraps the page in a transformed
element, and a `position: fixed` child of a transformed ancestor is positioned
against that ancestor instead of the viewport — it would scroll away, and it
would also hijack touch scrolling on phones. The smooth feel comes from the
eased character tweens instead.

**Icons sit above their text**, on their own line, rather than beside them.

**Motion.** Three things move, in sequence.

1. The chandelier **drops in from above the page** (`chandelier-drop`, a
   `translateY(-85vh)` to `0`) the moment the gate clears. It is armed by
   `.invitation.is-open` rather than running on load, because the card is mounted
   and hidden behind the gate — a plain animation would play unseen and be over
   before the visitor ever saw it.
2. The bismillah, the rules and the icons **fade in** as they are reached, via an
   `IntersectionObserver` on `[data-fade]`.
3. Every piece of **text** — all three verse lines, the three name fragments, the
   date, the venue and both notes, ten blocks in all — is animated by the
   supplied `SplitText` component, which splits into per-character spans and
   staggers them in. `ScrollTrigger.refresh()` runs once the gate is gone, because
   the triggers are first built while the page is still scroll-locked behind it.

`SplitText` carries three additions that the supplied version needed here:
`dir`, so Latin text is split with `dir="ltr"` inside this `dir="rtl"` document
(otherwise `Hanene` splits and re-renders as `enenaH`); `lang`, so shapers get
the right language; and `reduced`, which renders the text as plain unwrapped
markup with no spans and no GSAP at all. It also waits on `document.fonts.ready`
before splitting, because the page has to re-split once Tajawal has actually
loaded or every glyph would be measured against the fallback.

**The verse is the one element that could not be enlarged.** Each supplied line
carries hard-coded kashida runs — `[4,11,4,5,5]`, `[7,10,9,18]`, `[6,4,5,8]` — so
the width of a line is fixed by its character count and scales only with the font
size; the longest needs about 22.8× the font size in pixels. Tajawal Bold is also
noticeably wider than the Janna Thin it replaced. In the old 33rem measure the
three lines no longer fit, and each one wrapped onto a second row, which is no
longer the line that was supplied. The verse is therefore full-bleed like the
names (`width: 100vw` with a `2vw` inset) and sized to `clamp(0.88rem, 3.9vw,
1.45rem)`, which is the largest that keeps all three lines on one row at every
viewport tested — 360, 390, 430, 740 and 768 — with 3–24% to spare. Everything
else did get larger.

**Reduced motion.** `usePrefersReducedMotion()` in `Invitation.jsx` tracks the
media query live, so a change takes effect without a reload. When it matches, the
gate transition and the `[data-fade]` blocks collapse to plain opacity with no
travel, the chandelier appears without its drop, and every `SplitText` is passed
`reduced` — it renders the text as plain markup with no `.split-char` spans and
GSAP is never started for it.

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
