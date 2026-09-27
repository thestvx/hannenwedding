# Hanene & Smail — Wedding Invitation

A single, mobile-first digital wedding invitation, built as a React + Vite app
and deployed to Cloudflare Pages.

The first view is a full-screen gate on `background04.png`. Pressing **anywhere**
on it opens the invitation, which is set on `background03.png` and scrolls like a
printed card: a large chandelier at the top that drifts away as you scroll, the
bismillah, the verse, the couple's photograph, their names, then the date, a
countdown and the venue, then the notes, then a guestbook. Rose petals fall over
the writing throughout.

**هناء و إسماعيل — 18 أكتوبر 2026 — قاعة عزوز للافراح والمناسبات**

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
  Invitation.jsx      background03 card, in-flow chandelier, portrait photo,
                      stacked details, maps link, names float
  Countdown.jsx       days / hours / minutes / seconds to 18 October 2026
  Petals.jsx          fixed overlay of 16 falling rose petals
  SplitText.jsx       supplied GSAP text component, per-character or per-word
  Guestbook.jsx       name + message form, posts to the Pages Function
src/styles.css        the design
functions/
  api/guestbook.js    Pages Function: validates, throttles, sends to Telegram
public/
  background/         background03.png (card), background04.png (gate)
  vectors/            thorya2, bsm, bark, date, gps, pin, namephoto
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

**The chandelier keeps its own colours.** `thorya2.png` is not a near-black vector
— it is a light cream drawing (mean `rgb(196,186,163)`) — so it is *not* masked
 and *not* recoloured. It is
dropped in as an ordinary element with no overlay, filter, `mix-blend-mode` or
background, exactly as supplied. That was a deliberate correction: the previous
build masked it to `#392d2d`, and the fix was rejected — the chandelier keeps the
colour it was drawn in.

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

It is `public/vectors/thorya2.png` — the `736×736` file, on request. Its canvas is
square, but the drawing inside it is not: the opaque ink measures `635×719`, which
is 86.3% of the width and 97.7% of the height. So the element is sized from the
**ink**, not the square. `--chandelier-w: min(27.5rem, 92vw)`
(`min(33.9rem, 92vw)` on desktop) puts the drawing at ~380px, which is what the
previous `thorya.png` still came out at once its own 91% ink ratio is accounted
for; picking a box the same size as the old one would have made the new drawing a
seventh narrower. `aspect-ratio` stays `736 / 736`, because that is the file's own
ratio and the transparent padding belongs to the file — cropping it away would be
an edit to the artwork, which is exactly what was asked not to happen.

Nothing is done to the pixels or the box around them. `filter`, `box-shadow`,
`text-shadow`, `backdrop-filter`, `mix-blend-mode`, `background`, `mask`,
`clip-path` and the `::before`/`::after` of both the image and its wrapper are each
stated as `none` in `.chandelier` rather than merely left unset, so a later rule
cannot quietly reintroduce one. The verifier asserts every one of those as well as
the `736×736` natural size, and measures the file's alpha bounds to confirm the
**drawing** — not the transparent padding — still fits inside every viewport.

A `thorayavideo.webm` transparent loop was tried in place of the still and then
reverted on request; nothing in the build references it and the file is no longer
in the repository. The earlier `thorya.png` is also no longer referenced; it is
left in `vectors/` rather than deleted, since deleting a supplied asset is not
something to do unasked.

`html { overflow-x: clip }` is kept for a different reason now: `.names` and
`.portrait__caption` are both `width: 100vw` pulled back onto the sheet with a
negative inline margin, which overhangs by the width of a desktop scrollbar.
`clip`, not `hidden`, because `hidden` would make the root a scroll container and
break the `scrollIntoView` that both the gate and the reveal depend on.

`ScrollSmoother` is deliberately *not* used. It wraps the page in a transformed
element, which is unnecessary now that nothing is pinned, and it would also
hijack touch scrolling on phones. The smooth feel comes from the eased tweens
instead.

**The names arrive on the splitting-text motion.** Each character comes in from
`{ opacity: 0, y: 50, x: 50, scale: 0.5, rotate: 90 }` to
`{ opacity: 1, y: 0, x: 0, scale: 1, rotate: 0 }` over `0.5s` `easeOut`, staggered
`30ms`. Those are the exact values of the `vibe` preset from the supplied
`animate-ui` `SplittingText` component, and the motion is asserted by sampling
every character transform per frame while it plays: peak rotation `90.0°`,
smallest scale `0.500`, largest offset `x 50.0 / y 50.0`, lowest opacity `0.00`,
and a settled state of scale `1.000`, rotation `0.00°`, `x 0.00`, `y 0.00`,
opacity `1`. Reading only the settled state would have passed a dead entrance.

**It is the supplied motion, not the supplied package.** The values are passed
through the GSAP `SplitText` already here rather than installing `motion` and the
shadcn primitive, for three reasons: the names already run on GSAP and two
libraries writing the same transform is only a question of which one wins; the
local splitter already keeps a Latin run in its own order inside this `dir="rtl"`
document (without that, `Hanene` renders as `enenaH`); and under
`prefers-reduced-motion` it renders the text whole and never splits it at all, so
no character is ever moved — all of which would have to be re-implemented to
switch libraries. The `0.42em`/`0.36em` padding below is also what the entrance
needs, since a character rotated `90°` and shifted `50px` would otherwise be
half-clipped by its own overflow box on the way in.

**The names are the subject of the card, so they are set large** —
`clamp(3.1rem, 21.5vw, 8.4rem)` and `9.2rem` on desktop, the ampersand
`clamp(1.6rem, 9.5vw, 3.4rem)`. The size is then measured as real ink rather than
trusted: at `360×800` the widest name spans `75%` of the screen and still clears
its clip on all four sides, and no viewport gains a sideways scroll.

**The names float upward, slowly.** A continuous idle tween — `y -= 0.6rem`,
`6.4s`, `sine.inOut`, `yoyo`, staggered `1.4s` — on each name block, so each name
rises and settles back rather than moving side to side. There is deliberately
**no horizontal component**: a left/right drift made the names look like they were
sliding off. It is separate from the entrance, and it targets the `.split-parent`
blocks rather than the character spans, so it does not fight `SplitText` for the
same transforms.

**The names have room to be seen in.** Each `.split-parent` carries its own
`padding-block: 0.42em` and `padding-inline: 0.36em`, and the `&` block has
`0.16em` above and `0.74em` below, so ascenders, descenders and the ampersand's
own overhang all clear the character line box. Without it the `Hanene` `H` and the
`Smail` tails were being clipped by their own overflow box.

**The caption sits under the photograph**, `من حُـــــب الصغــــــر الى حُــــــــب العمـــــــر`,
on its own line, inside `.portrait` rather than after it — so it moves with the
photo. The supplied elongations are long runs (`[5,6]` and `[8,7]`), so like the
notes it is sized off the longest run and split **per word**, never per character,
because a letter on its own loses its shaping. It is a full-bleed line
(`100vw`, pulled back with `margin-inline: calc(50% - 50vw)`) and scales with
`clamp()`.

**Icons sit above their text**, on their own line, rather than beside them.

**The venue is a link.** The venue block is a real `<a>` to the Google Maps short
link, `target="_blank"` with `rel="noopener noreferrer"`, and it keeps the pin
icon and the typography of the rest of the card — no underline, no browser blue.

**The countdown** (`Countdown.jsx`) shows days, hours, minutes and seconds to
`2026-10-18T00:00:00` local. Midnight local was chosen because no time of day was
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
2. The bismillah, the rules, the portrait, the names, the details, the notes and
   the guestbook **fade in** as they are reached, via an `IntersectionObserver` on
   `[data-fade]`, `[data-reveal]` and `[data-settle]`. This observer is
   **two-way**: it toggles `.is-in` from `entry.isIntersecting` instead of adding
   the class once and unobserving. Scrolling back up therefore takes each block
   out again, and the card returns to how it was found rather than being left
   fully lit. Hysteresis comes from the asymmetric `rootMargin`
   (`0px 0px -12% 0px`): a block starts appearing once its top passes 88% of the
   way down the viewport, and is only released once it has left the top entirely,
   so the band between those two moments is as tall as the block and small scroll
   jitter at the boundary cannot chatter the class back and forth.
3. Every piece of **text** — all three verse lines, the three name fragments, the
   date, the venue and both notes, ten blocks in all — is animated by the
   supplied `SplitText` component, which staggers them in. `ScrollTrigger.refresh()`
   runs once the gate is gone, because the triggers are first built while the page
   is still scroll-locked behind it.
4. The **chandelier fades out** and the **names drift**, both scrubbed or looping
   off scroll position as described above.

The text blocks are in the reveal system through a wrapper of their own —
`data-fade` on `.names`, `.details`, `.notes` and `.guestbook` — rather than by
moving the `SplitText` tween. Two reasons. Their entrance stays a once-per-visit
event, so scrolling up and down does not replay the whole splitting animation each
time; and a parent's `opacity` multiplies with its children's instead of competing
for it, which is what lets the two systems coexist on the same subtree without
either clipping the other. The decorative `.rule` separators are `aria-hidden`
and carry `data-reveal` themselves, since they hold no text.

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
gate transition and the reveal blocks — `[data-fade]`, `[data-reveal]` and
`[data-settle]` alike — collapse to plain opacity with no travel, the chandelier
appears without its drop and without the scroll fade, every
`SplitText` is passed `reduced` — it renders the text as plain markup with no
`.split-char` or `.split-word` spans and GSAP is never started for it — the names
do not drift, and the petals are removed from the page entirely. The scroll-up
fade-out still happens, because it is opacity only and nothing travels; only the
movement is given up.

**Without JavaScript** the React root is empty, so `index.html` carries a
`<noscript>` block with the names, date, venue and notes over `background03`.

**The couple's photograph sits above the names** and is treated as a photograph,
not as artwork. `namephoto.png` is a real photo with a shaped (arched) alpha
ground, so unlike the near-black vector drawings it is **not** used as a
`mask-image` and is **not** recoloured — the shapes, tones and antialiasing are
the original pixels, exactly as with the chandelier. It is dropped in as an
ordinary `<img>` with no overlay, filter, `mix-blend-mode` or `box-shadow`, and it
declares `width="619" height="787"` so the browser reserves the right box before
the file arrives, matching its real `619×787`. CSS pins the ratio with
`aspect-ratio: 619 / 787`, so the measured layout ratio stays `0.7866` against a
real `0.7865` — it cannot be stretched or cropped by a font or font-size change.

Its width is `min(100%, 17rem)`, which keeps it deliberately **narrower than the
bismillah** (`min(100%, 19rem)`). It is the couple's picture, not the subject of
the page, and it still needs to read as part of one composition rather than as a
banner. It reveals on the same `[data-settle]` observer as the rest of the
writing, scaling from `.94` to `1` over `1.15s`, and under reduced motion the
scale is dropped so it simply appears.

**The guestbook is a server-side form, not a `fetch` from the page.**
`Guestbook.jsx` posts a name and a message to `/api/guestbook`, which is a
Cloudflare Pages Function in `functions/api/guestbook.js`. The heading is
`لهـــــا، في أجمــــل أيامهـــــا`, the line under it is
`اتركولي كلمة حلوة، أخليها ذكرى من يومي الجميل`, and the button reads `أرسل` —
all supplied text, kept verbatim, with the same per-word splitting as the notes
so the elongations survive. A thin rule separates the block from the notes above
it. The Telegram bot token lives in that function's environment and is never sent
to the browser. This is the whole point: a token in client JavaScript is readable
by anyone who opens devtools, and with it anyone could read the guestbook, or use
the bot to message every guest themselves. Do not move it into `src/`.

The function defends a public endpoint that sends messages, in this order:

1. **No token configured → `503`**, logged loudly, and reported to the client as a
   generic failure, so a misconfigured deploy does not look like a working one.
2. **Rate limit: 3 requests per minute per IP**, applied before anything is
   parsed or sent, so junk traffic is capped even when the payload is garbage.
   The counter is a `Map` in the isolate, pruned once it grows past 5000 entries
   — pruned rather than cleared, so a busy isolate does not hand everyone still
   inside their window a free pass. It is per-isolate, so it is a throttle, not a
   guarantee.
3. **A honeypot field** named `website`, hidden with the clipped 1px technique
   rather than `display: none`, which bots skip. Filling it returns `200` and
   sends nothing, so the bot learns nothing.
4. **Name and message are capped** at 60 and 500 characters and must each be at
   least 2.
5. **Invisible characters are stripped** — control codes, but also the bidi
   controls (`U+202A`–`U+202E`, `U+2066`–`U+2069`), zero-widths and joiners
   (`U+200B`–`U+200F`), the soft hyphen and the byte-order mark. Telegram renders
   all of them, and a message ending in a right-to-left override displays
   backwards, so none of them belong in a message meant to read as typed. The
   stripping is a loop over code points rather than a regex, so this source file
   contains no control characters of its own.
6. **`parse_mode` is left off on purpose.** The guest's words then arrive as
   literal text, so a guest who writes `*hello*` gets exactly that instead of
   Telegram interpreting it. Nothing in the message needs formatting.
7. **A Telegram failure is surfaced as `502`**, never as a success, so the guest
   is told their message did not arrive instead of watching it disappear.

Anything that is not a `POST` — a `GET` from the address bar, a `HEAD` from a
link preview — gets a `405` and nothing else.

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

Two environment variables, set in the Cloudflare Pages project under
**Settings > Environment variables**, for **both Production and Preview**:

| Variable | Required | Value |
| --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | yes | the token from `@BotFather` |
| `TELEGRAM_CHAT_ID` | no | which chat to post to |

If `TELEGRAM_CHAT_ID` is not set, the function posts to the newest chat that has
written to the bot, so a personal bot works with no extra setup — send the bot a
single message once to create that chat. Setting it explicitly is more reliable,
since `getUpdates` returns nothing if a webhook is ever attached to the bot.

Locally, put the same two lines in `functions/.dev.vars`, which is git-ignored.
Test the function itself with `npx wrangler pages dev dist` — `npm run preview`
is plain Vite and does not run Pages Functions, so the form will fail there.

`vite.config.js` sets `base: './'` so the build works from a sub-path without
further configuration.

A build that publishes the repository root instead of `dist/` serves
`/src/main.jsx` and answers `fonts.css` as `text/html`. The tell is a MIME error
in the console and a `fonts.css` request that comes back as markup.
