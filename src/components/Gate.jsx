import { useEffect, useMemo, useRef, useState } from 'react';

const SEEN = 'hanene.gate.opened';

const asset = (p) => `${import.meta.env.BASE_URL}${p}`;

/**
 * The gate is background04.png, shown the moment the page loads. Pressing
 * anywhere -- the wax seal, the envelope, or the empty space around them --
 * opens it, and background04 blooms away to reveal the invitation beneath.
 *
 * Shown once per session: a reload or a back-navigation goes straight to the
 * invitation, but closing the tab and coming back shows it again.
 */
export default function Gate({ onEnter }) {
  const [opening, setOpening] = useState(false);
  const [blooming, setBlooming] = useState(false);
  const [bloom, setBloom] = useState({ x: 0, y: 0 });

  const stageRef = useRef(null);
  const fired = useRef(false);
  const timers = useRef([]);

  const reduce = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    []
  );

  const enter = () => {
    if (fired.current) return;
    fired.current = true;

    try {
      sessionStorage.setItem(SEEN, '1');
    } catch {
      /* private mode: the gate simply shows again next visit */
    }

    const rect = stageRef.current && stageRef.current.getBoundingClientRect();
    if (rect) {
      setBloom({ x: rect.left + rect.width / 2, y: rect.top + rect.height * 0.46 });
    }

    setOpening(true);

    const bloomDelay = reduce ? 20 : 430;
    const enterDelay = reduce ? 360 : 1560;

    timers.current.push(setTimeout(() => setBlooming(true), bloomDelay));
    timers.current.push(setTimeout(() => onEnter(), enterDelay));
  };

  const cls = ['gate', opening ? 'is-opening' : '', blooming ? 'is-blooming' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={cls}
      onClick={enter}
      style={{ backgroundImage: `url("${asset('background/background04.png')}")` }}
    >
      <div className="gate__stage" ref={stageRef}>
        <div className="envelope">
          <div className="envelope__card" />

          <div className="envelope__body">
            <span className="envelope__seam" />
          </div>

          <div className="envelope__flap" />

          <button className="seal" type="button" aria-label="افتح الدعوة">
            <span className="seal__blob" />
            <span className="seal__mark" aria-hidden="true">
              <svg viewBox="0 0 40 40" focusable="false">
                <path
                  d="M20 6 C14 12 11 17 11 22 a9 9 0 0 0 18 0 c0-5-3-10-9-16 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M20 30 v-9 M20 26 l4-3 M20 26 l-4-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="seal__half seal__half--l" aria-hidden="true" />
            <span className="seal__half seal__half--r" aria-hidden="true" />
          </button>
        </div>

        <p className="gate__hint" aria-hidden="true">
          اضغط في أي مكان
        </p>
      </div>

      <span
        className="bloom"
        aria-hidden="true"
        style={{ left: bloom.x + 'px', top: bloom.y + 'px' }}
      />
    </div>
  );
}
