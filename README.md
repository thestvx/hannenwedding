# Hanene & Smail — Wedding Invitation

A single-screen digital wedding invitation. A sealed ivory envelope rests on a
dark stage; breaking the burgundy wax seal swings the flap, lifts the card out,
and dissolves the stage to reveal the invitation over `background/background.jpg`.

Plain HTML, CSS and JavaScript. No build step, no dependencies, no network calls
except the two Google Fonts (which degrade to local serif fallbacks).

## Files

```
index.html                      markup, inline SVG sprite, noscript fallback
style.css                       design tokens, 3D envelope, reveal choreography
script.js                       state machine, tap guard, timelines, fallbacks
background/background.jpg       the photograph (600x923, portrait)
assets/textures/paper-grain.svg reusable paper grain
assets/svg/seal-favicon.svg     wax-seal favicon
```

Open `index.html` directly — it runs from `file://` with no server.

## The envelope

Built from stacked layers, back to front, so the fold order is real rather than
painted on:

| layer            | what it is                                                        |
| ---------------- | ----------------------------------------------------------------- |
| `.envelope__back`| the rear panel — warm corner light, 1px edge, inner top highlight |
| `.envelope__throat` | burgundy lining with a gold damask trellis, glimpsed on open  |
| `.envelope__card`| the invitation, tucked in, rising on `open`                       |
| `.envelope__front` | the two side panels, the bottom panel, the gold foil frame   |
| `.envelope__flap`| outer paper face + a burgundy/gold patterned liner                |
| `.seal`          | the wax seal, straddling the flap's apex                          |

Two details do most of the work:

- **`.env-frame`** — a double gold rule struck into the face. One element, and
  it is the difference between "an envelope" and "fine stationery".
- **`.env-panel--l/r/b::after`** — a light/dark hairline pair along each fold.
  Without it the three panels read as flat colour blocks; with it they read as
  folded paper.

The flap ornament (`.flap-orn`) is two gold rules and a lozenge. Its width is
bounded by the fold — at fraction *t* down a triangle of width *W* there is only
*W·(1−t)* of paper, and the flap is `clip-path`'d, so anything wider gets its
ends sliced. It sits at 44%, where 221px of paper is available for a 163px
ornament, and clear of the seal's crown.

## Motion

The load is staged, and every stage can be skipped.

1. **Curtain** — `.envelope-scene__veil` lifts over 1.5s.
2. **Rise** — the envelope fades up and settles from `translateY(4.5%) scale(.965)`.
3. **Idle** — the seal breathes, its gloss travels, a halo pulses outward, the
   aura breathes, the hint drifts.
4. **Press → break → open → reveal** — the sequence in `script.js` below.
5. **Reveal** — the photograph fades up from `scale(1.08)`, the vignette fades
   in, gold motes begin drifting, and the type staggers in **with a blur that
   resolves to sharp** (10px on the names, 5–6px on the date and venue, 3px on
   the notes). This is the "fade in" beat — a cross-fade alone reads as flat;
   resolving out of blur reads as focus pulling onto the card.

Any sign of intent — `pointerdown`, `keydown`, `wheel`, `touchstart` — adds
`.is-awake` to `<html>`, which drops the curtain and the rise immediately. A
visitor who has already decided never waits out the theatre.

`prefers-reduced-motion: reduce` removes the curtain, the rise, the motes and
every blur, and shortens the rest. The envelope still opens — that interaction
is the entire point of the page.

## The opening

`script.js` is a small state machine over one attribute, `data-state` on
`<html>`. CSS owns every visual; JavaScript only advances the attribute and
schedules the beats.

```
closed ──click──> pressed ──> breaking ──> open ──> revealed
```

| state     | what happens                                                        |
| --------- | ------------------------------------------------------------------- |
| `closed`  | envelope at rest, seal breathing, hint drifting                      |
| `pressed` | seal compresses, hint is cancelled outright and cannot return        |
| `breaking`| the seal splits down the crack, halves fall away, dust drops         |
| `open`    | flap rotates back through `rotateX(-173deg)`, card rises             |
| `revealed`| stage dissolves, type staggers in, scene leaves the tree             |

The reduced-motion timeline is a separate, much shorter score in `script.js`;
every duration and delay in `style.css` is a custom property, so the two paths
never drift apart.

### Timing tokens

All in `:root` at the top of `style.css`; the reduced-motion block at the bottom
overrides them.

```
--t-press 180ms   --t-break 660ms   --t-flap 880ms   --t-rise 1000ms   --t-dissolve 920ms
--d-break 140ms   --d-flap  250ms   --d-rise   700ms --d-reveal 700ms   --d-scene-hide 1100ms
```

## Layout

One background image, treated two ways:

- **below 760px** — `.invitation__plate` fills the viewport with `cover`.
- **760px and up** — the photograph is shown sharp and uncropped as a centred
  portrait plate (`background-size: auto min(128vh, 1240px)`) with a
  `90deg` mask fading its left and right edges, over
  `.invitation__ambient` — a blurred, darkened, slightly enlarged copy of the
  *same* file — so the composition never shows a hard vertical seam.

No image is ever upscaled beyond its native 600x923 on desktop.

## Accessibility

- The seal is a real `<button>`; `Enter` and `Space` activate it.
- `aria-label` on the seal, `aria-describedby` pointing at the hint, and an
  `aria-live="polite"` region that announces the names, date and venue once
  open.
- On `settle()` the stage is marked `aria-hidden`, the seal is `disabled` and
  removed from the tab order.
- `prefers-reduced-motion: reduce` gets a short, low-travel version of the same
  story, not a degraded one.
- Without JavaScript, `<noscript>` hides the envelope and shows the invitation
  directly, so the content is never locked behind an interaction.
- All copy is the supplied text and nothing else — no invented details, links or
  calls to action.

## Resilience

- `visibility` on the invitation is gated on the `.is-in` class, never on a
  transition completing, so a dropped or throttled transition can never leave
  the invitation permanently invisible.
- Rapid taps are absorbed: the listeners detach on the first activation and the
  state machine ignores every state after `CLOSED`.
- If the tab is hidden mid-sequence, or any script error occurs, the sequence
  fast-forwards to the finished invitation rather than stranding the visitor on
  a sealed envelope.

## Customising

- **Colours and type** — the token block at the top of `style.css`.
- **Envelope proportions** — `--env-w`, `--env-h`, `--flap-h`, `--seal-size`.
  The flap is 56% of the envelope height and the front panels occupy the
  remaining 44%; the seal is centred on the flap apex at 30% of the width.
- **Pace** — the `--t-*` and `--d-*` tokens, plus the two score arrays in
  `script.js`.
- **The seal artwork** — the `#waxBlob` path in the sprite at the top of
  `index.html`. It is a hand-built organic blob; the two halves are the same
  path clipped either side of a vertical crack, which is what makes the
  fracture line stay put while the halves separate.
