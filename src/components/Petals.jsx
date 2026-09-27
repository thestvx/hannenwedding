import { useMemo } from 'react';

/**
 * Rose petals drifting down over the card.
 *
 * Done with CSS animations on a fixed pool of nodes rather than canvas or one
 * tween per petal: every petal animates transform and opacity only, which the
 * compositor handles without touching layout or paint, and a paused tab costs
 * nothing. GSAP is deliberately not used here -- it would put a running rAF loop
 * on the page for a purely decorative effect.
 *
 * The randomness is per-mount, via a seeded generator, so the scatter differs
 * on every visit but the pool is stable across re-renders. Positions are chosen
 * in percentages of the viewport rather than pixels, so the same layout holds
 * on any screen.
 */

// Pinned to the viewport, not the document: petals are meant to be everywhere.
const COUNT = 16;

// Enough randomness to look scattered, few enough that the pattern does not
// repeat visibly. mulberry32 is a 15-line PRNG rather than Math.random, which
// would make the layout differ on every React render.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildPetals() {
  const rand = mulberry32(0x5eed1a);
  return Array.from({ length: COUNT }, (_, i) => {
    // Two petal tones plus an occasional deeper one, so the drift is not a
    // single repeated shape. These sit in the invitation's own rose/gold range
    // and are kept translucent so they never fight the type underneath.
    const tone = rand();
    const color =
      tone > 0.82
        ? 'rgba(203, 141, 152, 0.55)'
        : tone > 0.4
          ? 'rgba(232, 197, 197, 0.6)'
          : 'rgba(244, 220, 214, 0.5)';

    return {
      key: i,
      // Start off the top edge, spread across the width.
      left: 2 + rand() * 96,
      // Negative delay, so they are already part-way down on the first frame
      // instead of all appearing together at the top.
      delay: -rand() * 14,
      // Slow, and varied, so the fall never looks like one loop.
      duration: 13 + rand() * 12,
      size: 0.5 + rand() * 0.55,
      // Horizontal sway, as a share of the petal's own size.
      sway: (rand() * 2.6 + 0.7).toFixed(2),
      // Tilt: petals are never upright while falling.
      tilt: Math.round(rand() * 150 - 75),
      spin: Math.round(rand() * 900 - 450),
      opacity: (0.5 + rand() * 0.42).toFixed(2),
      color
    };
  });
}

export default function Petals() {
  const petals = useMemo(buildPetals, []);

  return (
    <div className="petals" aria-hidden="true">
      {petals.map((p) => (
        <span
          className="petal"
          key={p.key}
          style={{
            left: `${p.left}%`,
            width: `${p.size}rem`,
            height: `${p.size * 0.72}rem`,
            backgroundColor: p.color,
            '--petal-delay': `${p.delay}s`,
            '--petal-duration': `${p.duration}s`,
            '--petal-sway': p.sway,
            '--petal-tilt': `${p.tilt}deg`,
            '--petal-spin': `${p.spin}deg`,
            '--petal-opacity': p.opacity
          }}
        />
      ))}
    </div>
  );
}
