import { useEffect, useRef, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import ScrollFloat from './ScrollFloat.jsx';

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
 * The bismillah, the icons and the chandelier are all used as CSS masks: the
 * shape, proportions and antialiasing are the original pixels' alpha, and only
 * the fill changes.
 *
 * The fill is not uniform, and deliberately so. --art-tone is a light cream,
 * which is what the bismillah and the icons need because they sit on the dark
 * middle of background03. The chandelier sits at the very top, where that
 * background is light (median luminance 172/255), so a light fill would score
 * only 2.1:1 against it and read as a smudge. It takes the supplied near-black
 * #392d2d instead, which scores 3.9:1 there -- the same colour family as the
 * bismallah, but chosen for the ground it actually stands on.
 */
function Art({ file, ratio, tone, className = '', ...rest }) {
  const url = `url("${asset(file)}")`;
  return (
    <span
      className={`art ${className}`}
      style={{
        maskImage: url,
        WebkitMaskImage: url,
        aspectRatio: String(ratio),
        ...(tone ? { backgroundColor: tone } : null)
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

const NAME_WORDS = [
  { text: 'Hanene', className: 'names__line', start: 'top bottom-=12%' },
  { text: '&', className: 'names__amp', start: 'top bottom-=8%' },
  { text: 'Smail', className: 'names__line', start: 'top bottom-=12%' }
];

function Names({ reduced }) {
  // Under reduced motion the words are rendered as plain text in the same
  // wrappers ScrollFloat emits, so they are readable and fully opaque with no
  // scrub, scale or float. The supplied component is left untouched.
  if (reduced) {
    return (
      <>
        {NAME_WORDS.map((w) => (
          <span className={`scroll-float names__float${w.className === 'names__amp' ? ' names__float--amp' : ''}`} key={w.text}>
            <span className={`scroll-float-text ${w.className}`}>{w.text}</span>
          </span>
        ))}
      </>
    );
  }

  return (
    <>
      {NAME_WORDS.map((w) => (
        <ScrollFloat
          as="span"
          key={w.text}
          containerClassName={`names__float${w.className === 'names__amp' ? ' names__float--amp' : ''}`}
          textClassName={w.className}
          scrollStart={w.start}
          scrollEnd="top center"
        >
          {w.text}
        </ScrollFloat>
      ))}
    </>
  );
}

export default function Invitation({ revealed, focusNames = false }) {
  const rootRef = useRef(null);
  const namesRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  // The scroll reveals for everything except the names, which are driven by
  // GSAP ScrollTrigger inside ScrollFloat. Two systems never touch the same
  // element, so they cannot fight over opacity.
  useEffect(() => {
    if (!revealed) return undefined;

    const root = rootRef.current;
    if (!root) return undefined;

    // Two groups, two behaviours:
    //   [data-reveal] rises and fades as it is reached
    //   [data-fade]   fades only, with no travel
    // The names are driven by GSAP ScrollFloat instead, and are in neither
    // group, so no two systems ever write to the same element's opacity.
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
            {/* Large, anchored to the very top of the page, and dropped in from
                above on entry. 358x376 is its real intrinsic size, so the
                aspect-ratio is 0.952 and not 1 -- forcing 1:1 would squash it. */}
            <Art
              file="vectors/thorya.png"
              ratio={358 / 376}
              tone="#392d2d"
              className="art--chandelier"
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

            {/* One element per line so each fades in on its own as it is
                reached. The kashida runs inside each string are the supplied
                ones, untouched. */}
            {VERSE.map((line) => (
              <p className="verse" lang="ar" data-fade key={line}>
                {line}
              </p>
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

          {/* icon on its own line, the value on the line below it */}
          <div className="details" data-reveal>
            <div className="detail">
              <Art file="vectors/date.png" ratio={1} className="art--icon" />
              <span className="detail__value" lang="en" dir="ltr">
                15 . 10 . 2026
              </span>
            </div>
            <div className="detail">
              <Art file="vectors/gps.png" ratio={1} className="art--icon" />
              <span className="detail__value" lang="ar">
                صالة عزوز للافراح والمناسبات
              </span>
            </div>
          </div>

          <div className="rule rule--fine" data-reveal aria-hidden="true">
            <i className="rule__line" />
            <i className="rule__mark" />
            <i className="rule__line" />
          </div>

          <div className="notes" data-reveal>
            <Art file="vectors/pin.png" ratio={1} className="art--icon art--icon--pin" />
            <p className="notes__line" lang="ar">
              يمنع اصطحاب الأطفال
            </p>
            <p className="notes__line" lang="ar">
              ممنوع التصوير لطفلياً
            </p>
          </div>
        </article>
      </main>
    </>
  );
}
