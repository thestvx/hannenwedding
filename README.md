# Hanene & Smail — Wedding Invitation

A single, mobile-first digital wedding invitation, built as a React + Vite app
and deployed to Cloudflare Pages.

The first view is a full-screen gate on `background04.png`. Pressing **anywhere**
on it opens the invitation, which is set on `background03.png` and scrolls like a
printed card: a large chandelier at the top that drifts away as you scroll, the
bismillah, the verse, the couple's names, then the date, a countdown and the venue,
then the notes. Rose petals fall over the writing throughout.

**هناء و إسماعيل — 15 أكتوبر 2026 — قاعة عزوز للافراح والمناسبات**

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
index.html            document shell, fonts, metadata, <title>, <noscript> fallback,
                      the #gate-boot stylesheet that paints the gate background
                      before React exists
src/main.jsx          React entry
src/App.jsx           gate-vs-invitation state, body scroll lock, removes #gate-boot
src/components/
  Gate.jsx            background04 gate, full-bleed <button>, fade transition
  Invitation.jsx      background03 card, in-flow chandelier, stacked details,
                      maps link, names float
  Countdown.jsx       days / hours / minutes / seconds to 15 October 2026
  Petals.jsx          fixed overlay of 16 falling rose petals
  SplitText.jsx       supplied GSAP text component, per-character or per-word
src/styles.css        the design
public/
  background/         background03.png (card), background04.png (gate)
  vectors/            thorya, bsm, bark, date, gps, pin
  fonts/              JF Flat regular (Arabic body), Bettrisia Script Alt (names)
  fonts.css           @font-face declarations
  assets/svg/         favicon
```

## Typography

Body copy is **JF Flat** (`JF Flat regular.ttf`), used at weight **400** only. It
was Tajawal Bold before. The switch came from the report that the Arabic looked
wrong on a phone: JF Flat is the face that was wanted, and asking for weight 700 of
it would make the browser synthesise a bold that smears the kashida runs. Only one
Arabic weight is shipped, so nothing has to be synthesised. The couple's names stay
in **Bettrisia Script Alt**, which is a Latin display face and reads as a signature.
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

**The gate background has to be in the HTML, not in the bundle.** `background04.png`
is 2.9 MB and the only reference to it used to be inside the JavaScript, so nothing
could be painted until the bundle had downloaded, parsed, run and discovered the
URL — which is what the reported "the background does not show on first load" was.
Two things fix it. `index.html` carries `<link rel="preload" as="image">` for the
file, and a `<style id="gate-boot">` that paints it onto `<html>` immediately,
before React exists. The style block is an element rather than an inline style on
`<html>` specifically so `App.jsx` can remove the *element* in a layout effect once
the card's own fixed `.canvas` has mounted; clearing `documentElement.style` would
leave the rule in place and it would flash behind the card on a reload. A `<style>`
in the document is also the right place for a `public/` path, because a `url()` in
the bundled stylesheet gets rewritten to `/assets/` and 404s.

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

**The chandelier is no drop shadow and no longer fixed.** It sits in normal flow at
the top of the card and fades out over the first 60% of a viewport of scrolling,
driven by a `ScrollTrigger` scrub on the wrapper. Nothing is drawn under it: no
`box-shadow`, no `filter`, no `::before`/`::after`, no scrim, and the stock
`background03` is not darkened to compensate. The fade is on the wrapper and the
drop-in keyframe is on the `<img>` inside it, deliberately — both animate opacity,
and two systems writing opacity on the same element would fight, with whichever
started last winning.

It is still sized from a CSS custom property pair so its space is reserved exactly:
`--chandelier-w: min(26rem, 92vw)` and
`--chandelier-h: calc(var(--chandelier-w) / 0.95213)`. The `0.952` is the real
intrinsic ratio of `358×376`; forcing `1:1` would stretch it by about 5%.
`.opening` reserves that height with
`padding-top: calc(var(--chandelier-h) + 3svh)`, so the first real line of text is
never underneath the chandelier, and `.opening > *:not(.chandelier-wrap)` is given
`position: relative; z-index: 1` to sit above it.

`ScrollSmoother` is deliberately *not* used. It wraps the page in a transformed
element, which is unnecessary now that nothing is pinned, and it would also
hijack touch scrolling on phones. The smooth feel comes from the eased tweens
instead.

**The names drift where they stand.** A continuous idle tween — `y += 0.55rem`,
`x += 0.3rem`, `5.5s`, `sine.inOut`, `yoyo` — on each name fragment, so they float
in place rather than moving. It is separate from the entrance, and it targets the
`.split-parent` blocks rather than the character spans, so it does not fight
`SplitText` for the same transforms.

**Icons sit above their text**, on their own line, rather than beside them.

**The venue is a link.** The venue block is a real `<a>` to the Google Maps short
link, `target="_blank"` with `rel="noopener noreferrer"`, and it keeps the pin
icon and the typography of the rest of the card — no underline, no browser blue.

**The countdown** (`Countdown.jsx`) shows days, hours, minutes and seconds to
`2026-10-15T00:00:00` local. Midnight local was chosen because no time of day was
given for the ceremony; change `TARGET` if there is one. The ticking row is
`aria-hidden`, because a screen reader announcing four numbers every second is
unusable, and a single `.sr-only` line states the date and the remaining days,
hours and minutes instead. On reaching the date the cells show `--` and the title
becomes `وصلنا إلى اليوم الكبير`. The interval is re-armed on focus and on
`visibilitychange` so a backgrounded tab does not resume with a stale value.

**The petals** (`Petals.jsx`) are 16 elements in a `position: fixed` overlay at
`z-index: 30` — above the card, which is at `z-index: 1` — with
`pointer-events: none`, so they fall across the writing without ever intercepting a
scroll or a tap. Each is a `span` with its own left offset, size, delay and
duration, animated by three CSS keyframes: `petal-fall` for the descent, `petal-sway`
for the horizontal drift, `petal-spin` for the tumble. Only `transform`, `opacity`
and the two independent `translate`/`rotate` properties are animated, so nothing
triggers layout. `contain: strict` keeps them out of the overflow calculation.

**Motion.** Four things move, in sequence.

1. The chandelier **drops in from above the page** (`chandelier-drop`, a
   `translateY(-85vh)` to `0`) the moment the gate clears. It is armed by
   `.invitation.is-open` rather than running on load, because the card is mounted
   and hidden behind the gate — a plain animation would play unseen and be over
   before the visitor ever saw it.
2. The bismillah, the rules and the icons **fade in** as they are reached, via an
   `IntersectionObserver` on `[data-fade]`.
3. Every piece of **text** — all three verse lines, the three name fragments, the
   date, the venue and both notes, ten blocks in all — is animated by the
   supplied `SplitText` component, which staggers them in. `ScrollTrigger.refresh()`
   runs once the gate is gone, because the triggers are first built while the page
   is still scroll-locked behind it.
4. The **chandelier fades out** and the **names drift**, both scrubbed or looping
   off scroll position as described above.

**Arabic is split per word, not per character.** The report was that the Arabic
looked broken on a phone, with the letters visibly detached. The cause was
`splitType="chars"`: each letter in its own `inline-block` is a shaping run of
length one, so every letter falls back to its isolated form and the words stop
being joined. Every Arabic block — the three verse lines, both notes and the venue
— therefore uses `splitType="words"`, which keeps each word as one shaping run.
The Latin names and the date keep the per-character split, with `dir="ltr"`.
Measured across six viewports, the page copy is within 0–1% of the same string set
as one unsplit run, which is what "still shaping" looks like numerically.

`SplitText` carries three additions that the supplied version needed here:
`dir`, so Latin text is split with `dir="ltr"` inside this `dir="rtl"` document
(otherwise `Hanene` splits and re-renders as `enenaH`); `lang`, so shapers get
the right language; and `reduced`, which renders the text as plain unwrapped
markup with no spans and no GSAP at all. It also waits on `document.fonts.ready`
before splitting, because the page has to re-split once the Arabic face has
actually loaded or every glyph would be measured against the fallback.

**The verse is the one element that could not be enlarged.** Each supplied line
carries hard-coded kashida runs — `[4,11,4,5,5]`, `[7,10,9,18]`, `[6,4,5,8]` — so
the width of a line is fixed by its character count and scales only with the font
size; the longest needs about 22.8× the font size in pixels. The Arabic body face
is also noticeably wider than the Janna Thin it first replaced. In the old 33rem
measure the three lines no longer fit, and each one wrapped onto a second row, which
is no longer the line that was supplied. The verse is therefore full-bleed like the
names (`width: 100vw` with a `2vw` inset) and sized to `clamp(0.88rem, 3.9vw,
1.45rem)`, which is the largest that keeps all three lines on one row at every
viewport tested — 360, 390, 430, 740, 768 and 1280 — with 3–24% to spare.
Everything else did get larger.

**Reduced motion.** `usePrefersReducedMotion()` in `Invitation.jsx` tracks the
media query live, so a change takes effect without a reload. When it matches, the
gate transition and the `[data-fade]` blocks collapse to plain opacity with no
travel, the chandelier appears without its drop and without the scroll fade, every
`SplitText` is passed `reduced` — it renders the text as plain markup with no
`.split-char` or `.split-word` spans and GSAP is never started for it — the names
do not drift, and the petals are removed from the page entirely.

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
