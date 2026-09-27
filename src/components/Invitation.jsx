import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import SplitText from './SplitText.jsx';
import Countdown from './Countdown.jsx';
import Guestbook from './Guestbook.jsx';
import Petals from './Petals.jsx';

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

// Where the guests are: a Google Maps short link, so the pin opens the actual
// place rather than a typed-out address.
const MAPS_URL = 'https://maps.app.goo.gl/6RuePAV2UujnUMK57';

// Hanene and Smail are Latin runs inside a dir="rtl" document, so dir="ltr"
// is passed through to SplitText: once each character is its own inline-block
// the base direction would otherwise reverse the run.
const NAME_WORDS = [
  { text: 'Hanene', className: 'names__line' },
  { text: '&', className: 'names__amp' },
  { text: 'Smail', className: 'names__line' }
];

// The names arrive on the splitting-text motion: every character starts
// off-axis and wrong-way-round and settles into place.
//
// These are the exact values of the `vibe` preset from the supplied
// SplittingText component -- initial {y:50, scale:0.5, opacity:0, x:50, rotate:90}
// to animate {y:0, scale:1, opacity:1, x:0, rotate:0} over 0.5s easeOut -- driven
// through the GSAP splitter already in this project rather than the shadcn
// primitive, and that is deliberate rather than a shortcut:
//
//   The names already run on GSAP. Introducing a second animation library on the
//   same characters would have two systems writing the same transform, and the
//   only question then is which one wins.
//
//   SplitText here already handles the two things that are easy to get wrong with
//   per-character splitting of a Latin name inside a dir="rtl" document: the run
//   keeps its own order (otherwise "Hanene" renders as "enenaH"), and under
//   prefers-reduced-motion the text is never split at all, so no character is
//   ever moved. Reimplementing that to switch libraries would be a downgrade.
//
// The 0.42em/0.36em padding on .names .split-parent is what the initial
// transform needs: rotated 90 degrees and shifted 50px, a character would
// otherwise be half-clipped by its own overflow box on the way in.
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
          delay={reduced ? 0 : 30}
          duration={0.5}
          ease="easeOut"
          from={{ opacity: 0, y: 50, x: 50, scale: 0.5, rotate: 90 }}
          to={{ opacity: 1, y: 0, x: 0, scale: 1, rotate: 0 }}
          reduced={reduced}
        />
      ))}
    </>
  );
}

export default function Invitation({ revealed, focusNames = false }) {
  const rootRef = useRef(null);
  const namesRef = useRef(null);
  const chandelierRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  // The scroll reveals for the artwork, which is driven here. The text is not
  // in this system at all -- it is driven by GSAP inside SplitText. Two systems
  // never touch the same element, so they cannot fight over opacity.
  useEffect(() => {
    if (!revealed) return undefined;

    const root = rootRef.current;
    if (!root) return undefined;

    // Three groups, three behaviours:
    //   [data-reveal] rises and fades as it is reached
    //   [data-fade]   fades only, with no travel
    //   [data-settle] settles up from slightly small, for the photograph
    // The text is driven by GSAP SplitText instead, and is in none of the three,
    // so no two systems ever write to the same element's opacity. That is why
    // the icons carry data-fade themselves rather than their .details wrapper
    // carrying data-reveal: the wrapper also holds SplitText-driven text.
    const targets = Array.from(
      root.querySelectorAll('[data-reveal], [data-fade], [data-settle]')
    );
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

  // The chandelier sits in the flow at the top of the card and fades out over
  // the first stretch of scroll, so it starts disappearing as soon as the guest
  // scrolls and is not left hanging over the page for the whole read.
  //
  // The fade is on the wrapper and the drop-in keyframe is on the <img> inside
  // it, deliberately: both animate opacity, and two systems writing opacity on
  // the same element would fight, with whichever started last winning.
  useEffect(() => {
    if (!revealed) return undefined;
    const el = chandelierRef.current;
    if (!el) return undefined;
    // Reduced motion: the chandelier is already at full opacity and stays put.
    if (reduced) return undefined;

    const tween = gsap.fromTo(
      el,
      { opacity: 1 },
      {
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          // 60% of a viewport of scrolling, not just the height of the
          // chandelier, so the fade is slow enough to read as a fade.
          end: () => `+=${window.innerHeight * 0.6}`,
          scrub: true,
          invalidateOnRefresh: true
        }
      }
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [revealed, reduced]);

  // The names float gently where they stand. This is a continuous idle drift,
  // separate from the entrance: SplitText animates the characters, this animates
  // each name box, so the two do not touch the same property.
  //
  // Long and yoyoed with a sine ease, which is what makes it read as floating
  // rather than pulsing: sine.inOut spends most of its time near the extremes,
  // so the names hang almost still and drift between them. At 6.4s each way
  // that is 12.8s for a full cycle -- slow enough to be noticed only when
  // watched, and slow enough that no single frame of it looks like a jump.
  useEffect(() => {
    if (!revealed) return undefined;
    const root = namesRef.current;
    if (!root) return undefined;
    if (reduced) return undefined;

    const targets = gsap.utils.toArray('.names .split-parent', root);
    if (!targets.length) return undefined;

    // Upward, on y alone. The drift used to carry an x component as well, which
    // made the names wander sideways; there is only one axis now, so the motion
    // reads as a rise and not as a wander.
    //
    // The three names are a long way apart in time, so they are never in step:
    // Hanene is on its way down while Smail has not started. That offset is
    // what makes it read as floating rather than as a single block breathing.
    const tween = gsap.to(targets, {
      y: '-=0.6rem',
      duration: 6.4,
      ease: 'sine.inOut',
      stagger: 1.4,
      repeat: -1,
      yoyo: true
    });

    return () => {
      tween.kill();
      gsap.set(targets, { clearProps: 'transform' });
    };
  }, [revealed, reduced]);

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
            {/* thorya.png, in its own supplied colour, exactly as it was drawn.
                Nothing is put behind it or on it -- no overlay, scrim, tint,
                gradient, filter, mask, blend mode, background or shadow -- and it
                is not stretched: 358x376 is its real ratio and the CSS keeps it.

                It is NOT fixed. It sits at the top of the card in the normal
                flow, and the wrapper around it is scrubbed to opacity 0 over
                the first stretch of scroll, so it begins to disappear as soon as
                the guest scrolls instead of hovering over the page for the whole
                read. Because it is in flow it needs no reserved height: .opening
                no longer pads space for it, and the text that lifted itself above
                it with a z-index no longer has to.

                The wrapper is a separate node precisely so the two opacity
                animations cannot fight: the drop-in keyframe is on the <img>
                and the scroll fade is on the wrapper, so neither ever writes
                the other's property. */}
            <div className="chandelier-wrap" ref={chandelierRef} aria-hidden="true">
              <img
                className="chandelier"
                src={asset('vectors/thorya.png')}
                alt=""
                width="358"
                height="376"
                decoding="async"
              />
            </div>

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
                ones, untouched.

                splitType is "words", not "chars", and this is not a stylistic
                choice. An Arabic letter takes its shape from its neighbours, so
                a shaping run is only correct while the letters stay together in
                one run of text. Wrapping every character in its own inline-block
                -- which is what splitType="chars" does -- gives each letter a
                run of its own: every letter falls back to its isolated form and
                the words come out looking broken and disconnected, which is
                exactly what was wrong with the Arabic on a phone. Splitting on
                word boundaries keeps each word's letters adjacent and joined
                while still animating them in a stagger. */}
            {VERSE.map((line) => (
              <SplitText
                key={line}
                text={line}
                tag="p"
                dir="rtl"
                className="verse"
                splitType="words"
                delay={reduced ? 0 : 90}
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

          {/* The couple's photograph, arched and already cut to its own shape
              in the file -- 619x787, 43% of it transparent around the arch --
              so it is dropped in as an ordinary <img> like the chandelier. It is
              a photograph, so it is not masked: masking would flatten it to a
              silhouette. 619:787 is its real ratio, kept exactly. */}
          <div className="portrait" data-settle>
            <img
              className="portrait__img"
              src={asset('vectors/namephoto.png')}
              alt="هناء و إسماعيل"
              width="619"
              height="787"
              decoding="async"
            />
            {/* Under the photograph, on its own line. The kashida runs are
                supplied -- [5,6] and [8,7] -- so it is sized off the longest
                one like the notes, and split per word so the letters stay
                joined. */}
            <SplitText
              text="من حُـــــب الصغــــــر الى حُــــــــب العمـــــــر"
              tag="p"
              dir="rtl"
              lang="ar"
              className="portrait__caption"
              splitType="words"
              delay={reduced ? 0 : 90}
              duration={1.1}
              ease="power3.out"
              from={{ opacity: 0, y: 18 }}
              to={{ opacity: 1, y: 0 }}
              reduced={reduced}
            />
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
              {/* Latin run, so chars: there is no shaping to break, and it is
                  the per-character stagger that looks right here. */}
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

            {/* Straight after the date, because the countdown is about the date
                and the eye should not have to travel past the venue to find it. */}
            <Countdown />

            <div className="detail">
              {/* The whole venue block is the link, so the pin and the name are
                  both a comfortable tap target. */}
              <a
                className="detail detail--link"
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="قاعة عزوز للافراح والمناسبات — افتح الموقع في خرائط جوجل"
              >
                <Art file="vectors/gps.png" ratio={1} className="art--icon" data-fade />
                <SplitText
                  text="قاعة عزوز للافراح والمناسبات"
                  tag="span"
                  dir="rtl"
                  lang="ar"
                  className="detail__value"
                  splitType="words"
                  delay={reduced ? 0 : 80}
                  duration={1.1}
                  ease="power3.out"
                  from={{ opacity: 0, y: 24 }}
                  to={{ opacity: 1, y: 0 }}
                  reduced={reduced}
                />
              </a>
            </div>
          </div>

          <div className="rule rule--fine" data-reveal aria-hidden="true">
            <i className="rule__line" />
            <i className="rule__mark" />
            <i className="rule__line" />
          </div>

          <div className="notes">
            <Art file="vectors/pin.png" ratio={1} className="art--icon art--icon--pin" data-fade />
            {/* Supplied with kashida runs, [5,7,6] and [4,5,5], so these are
                the supplied letters and the supplied elongations and nothing
                else. They are what makes the block about 40% wider than the
                unelongated wording, which is why .notes__line is sized off the
                longest of the two. */}
            {['يمنـــــع اصطحـــــــاب الأطفــــــال', 'يمنــــع التصـــــوير لطفـــــاً'].map((line) => (
              <SplitText
                key={line}
                text={line}
                tag="p"
                dir="rtl"
                lang="ar"
                className="notes__line"
                splitType="words"
                delay={reduced ? 0 : 90}
                duration={1.05}
                ease="power3.out"
                from={{ opacity: 0, y: 20 }}
                to={{ opacity: 1, y: 0 }}
                reduced={reduced}
              />
            ))}
          </div>

          {/* The rule that has always separated the blocks, used once more to
              close off the house rules before the card starts asking for
              something back. Same three pieces as every other rule, so the
              guestbook reads as part of the invitation and not as a widget. */}
          <div className="rule rule--fine" data-reveal aria-hidden="true">
            <i className="rule__line" />
            <i className="rule__mark" />
            <i className="rule__line" />
          </div>

          {/* Last thing on the card, after the house rules: the two notes are
              the last thing the card has to say, and the reply is the first
              thing it invites. */}
          <Guestbook />
        </article>
      </main>

      {/* Last in the tree and above the card, so the petals drift over the
          writing as well as over the background. Decorative and inert. */}
      <Petals />
    </>
  );
}
