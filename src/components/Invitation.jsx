import { useEffect, useRef, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import SplitText from './SplitText.jsx';

// Assets live in public/, so they are referenced by path rather than imported
// (Vite does not process imports out of the public directory).
//
// The URL is resolved to an absolute one against the document, not left
// relative. A relative url() is resolved against the stylesheet that contains
// it, and this rule is bundled into /assets/index-*.css -- so "./vectors/x.png"
// would be requested from /assets/vectors/x.png and 404 into the SPA fallback.
// Absolute URLs stay correct under a repository sub-path, where BASE_URL is
// only "./" and therefore useless on its own.
const asset = (p) => new URL(p.replace(/^\//, ''), document.baseURI).href;

// Held as string literals rather than JSX text: JSX collapses newlines and
// indentation between text nodes, which would put the spacing around the verse
// at the mercy of the formatter. The kashida runs are exactly as supplied, and
// each line is its own element so it can fade in on its own.
const VERSE = [
  'لمــــن كـــــــــــان وصالهــــم وداداً دومـــــا على قلوبنـــــا',
  'لازلنـــــــا بالأفــــــــــراح نحـــــــــب وصالكــــــــــــــــــم',
  'اتشــــــرّف بدعوتكــــم لحضور حفـــــل زفافــــــــي'
];

/**
 * The bismillah and the icons are near-black (#392d2d) drawings on a
 * transparent ground, used as CSS masks and filled with a light tone: the
 * shapes, proportions and antialiasing are the original pixels, only the colour
 * changes to suit the darker middle of background03.
 *
 * The chandelier is the exception and is deliberately NOT masked or recoloured
 * -- it is an <img> in its own supplied colour, with no overlay, scrim, tint,
 * gradient or filter of any kind.
 */
function Art({ file, ratio, className = '', ...rest }) {
  const url = `url("${asset(file)}")`;
  return (
    <span
      className={`art ${className}`}
      style={{
        maskImage: url,
        WebkitMaskImage: url,
        aspectRatio: String(ratio)
      }}
      aria-hidden="true"
      {...rest}
    />
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

// Hanene and Smail are Latin runs inside a dir="rtl" document, so dir="ltr"
// is passed through to SplitText: once each character is its own inline-block
// the base direction would otherwise reverse the run.
const NAME_WORDS = [
  { text: 'Hanene', className: 'names__line' },
  { text: '&', className: 'names__amp' },
  { text: 'Smail', className: 'names__line' }
];

function Names({ reduced }) {
  return (
    <>
      {NAME_WORDS.map((w) => (
        <SplitText
          key={w.text}
          text={w.text}
          tag="span"
          dir="ltr"
          className={w.className}
          splitType="chars"
          delay={reduced ? 0 : 26}
          duration={1.15}
          ease="power3.out"
          from={{ opacity: 0, y: 46 }}
          to={{ opacity: 1, y: 0 }}
          reduced={reduced}
        />
      ))}
    </>
  );
}

export default function Invitation({ revealed, focusNames = false }) {
  const rootRef = useRef(null);
  const namesRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  // The scroll reveals for the artwork, which is driven here. The text is not
  // in this system at all -- it is driven by GSAP inside SplitText. Two systems
  // never touch the same element, so they cannot fight over opacity.
  useEffect(() => {
    if (!revealed) return undefined;

    const root = rootRef.current;
    if (!root) return undefined;

    // Two groups, two behaviours:
    //   [data-reveal] rises and fades as it is reached
    //   [data-fade]   fades only, with no travel
    // The text is driven by GSAP SplitText instead, and is in neither group, so
    // no two systems ever write to the same element's opacity. That is why the
    // icons carry data-fade themselves rather than their .details wrapper
    // carrying data-reveal: the wrapper also holds SplitText-driven text.
    const targets = Array.from(root.querySelectorAll('[data-reveal], [data-fade]'));
    if (!targets.length) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      targets.forEach((el) => el.classList.add('is-in'));
      return undefined;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.01 }
    );

    targets.forEach((el) => io.observe(el));

    // The names' ScrollTriggers were built while the page was still scroll
    // locked behind the gate. Recompute every trigger's start/end now that the
    // document is scrollable and the fonts have settled, otherwise the scrub
    // timelines can end up keyed to positions the document no longer has.
    ScrollTrigger.refresh();

    return () => io.disconnect();
  }, [revealed]);

  // The gate is removed from the DOM on open, which drops focus to <body> and
  // loses the screen reader's place. Move it to the names so the visitor
  // continues inside the invitation.
  //
  // Only when the gate actually stood: on a revisit there is nothing to escape
  // from, and stealing focus would be a pointless jump.
  useEffect(() => {
    if (!revealed || !focusNames) return;
    const el = namesRef.current;
    if (!el) return;
    el.focus({ preventScroll: true });
  }, [revealed, focusNames]);

  return (
    <>
      {/* background03.png exactly as supplied: no overlay, scrim, tint, gradient
          or filter. Fixed, so the card scrolls over it like paper under glass. */}
      <div
        className="canvas"
        aria-hidden="true"
        style={{ backgroundImage: `url("${asset('background/background03.png')}")` }}
      />

      <main
        className={`invitation${revealed ? ' is-open' : ''}`}
        id="invitation"
        ref={rootRef}
      >
        <article className="sheet">
          <header className="opening">
            {/* In its own supplied colour, untouched: no mask, no overlay, no
                scrim, no tint, no gradient, no filter. 358x376 is its real
                intrinsic size, so the ratio is 0.952 and not 1 -- forcing 1:1
                would stretch it by about 5%.

                position: fixed, so it stays at the top of the screen instead of
                travelling with the scroll. It is out of flow, so the header
                reserves its height via --chandelier-h to keep the first line of
                text clear of it. */}
            <img
              className="chandelier"
              src={asset('vectors/thorya.png')}
              alt=""
              width="358"
              height="376"
              aria-hidden="true"
            />

            <Art
              file="vectors/bsm.png"
              ratio={658 / 188}
              className="art--calligraphy art--bsm"
              data-fade
            />
            <Art
              file="vectors/bark.png"
              ratio={736 / 182}
              className="art--calligraphy art--bark"
              data-fade
            />

            {/* One element per line so each animates on its own as it is
                reached. The kashida runs inside each string are the supplied
                ones, untouched. */}
            {VERSE.map((line) => (
              <SplitText
                key={line}
                text={line}
                tag="p"
                dir="rtl"
                className="verse"
                splitType="chars"
                delay={reduced ? 0 : 16}
                duration={1.2}
                ease="power3.out"
                from={{ opacity: 0, y: 28 }}
                to={{ opacity: 1, y: 0 }}
                reduced={reduced}
              />
            ))}
          </header>

          <div className="rule rule--broad" data-reveal aria-hidden="true">
            <i className="rule__line" />
            <i className="rule__mark" />
            <i className="rule__line" />
          </div>

          <h1 className="names" id="names" ref={namesRef} tabIndex={-1}>
            <Names reduced={reduced} />
          </h1>

          <div className="rule rule--fine" data-reveal aria-hidden="true">
            <i className="rule__line" />
            <i className="rule__mark" />
            <i className="rule__line" />
          </div>

          {/* icon on its own line, the value on the line below it. The icons
              carry the reveal so they are not double-animated along with the
              text that SplitText now drives. */}
          <div className="details">
            <div className="detail">
              <Art file="vectors/date.png" ratio={1} className="art--icon" data-fade />
              <SplitText
                text="15 . 10 . 2026"
                tag="span"
                dir="ltr"
                lang="en"
                className="detail__value detail__value--latin"
                splitType="chars"
                delay={reduced ? 0 : 40}
                duration={1}
                ease="power3.out"
                from={{ opacity: 0, y: 22 }}
                to={{ opacity: 1, y: 0 }}
                reduced={reduced}
              />
            </div>
            <div className="detail">
              <Art file="vectors/gps.png" ratio={1} className="art--icon" data-fade />
              <SplitText
                text="صالة عزوز للافراح والمناسبات"
                tag="span"
                dir="rtl"
                lang="ar"
                className="detail__value"
                splitType="chars"
                delay={reduced ? 0 : 22}
                duration={1.1}
                ease="power3.out"
                from={{ opacity: 0, y: 24 }}
                to={{ opacity: 1, y: 0 }}
                reduced={reduced}
              />
            </div>
          </div>

          <div className="rule rule--fine" data-reveal aria-hidden="true">
            <i className="rule__line" />
            <i className="rule__mark" />
            <i className="rule__line" />
          </div>

          <div className="notes">
            <Art file="vectors/pin.png" ratio={1} className="art--icon art--icon--pin" data-fade />
            {['يمنع اصطحاب الأطفال', 'ممنوع التصوير لطفلياً'].map((line) => (
              <SplitText
                key={line}
                text={line}
                tag="p"
                dir="rtl"
                lang="ar"
                className="notes__line"
                splitType="chars"
                delay={reduced ? 0 : 20}
                duration={1.05}
                ease="power3.out"
                from={{ opacity: 0, y: 20 }}
                to={{ opacity: 1, y: 0 }}
                reduced={reduced}
              />
            ))}
          </div>
        </article>
      </main>
    </>
  );
}
