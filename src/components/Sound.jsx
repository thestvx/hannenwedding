import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

const PREF = 'hanene.sound';

const asset = (p) => new URL(p.replace(/^\//, ''), document.baseURI).href;

// Under a page people are reading. Audible, not competing with the words.
const VOLUME = 0.3;

/**
 * The guest has a preference, and once they have expressed it we stop asking.
 * 'off' in particular is a decision, not a default: a visitor who silenced this
 * once should never be ambushed by it again on the next visit, so nothing here
 * autostarts while 'off' is set.
 */
function readPref() {
  try {
    return localStorage.getItem(PREF);
  } catch {
    return null; // private mode: behave as a first-time visitor
  }
}

function writePref(v) {
  try {
    localStorage.setItem(PREF, v);
  } catch {
    /* nothing to remember it with; the music still works for this visit */
  }
}

/**
 * Background music.
 *
 * The important constraint is that this cannot simply autoplay. Every current
 * browser refuses to start audio with sound until the document has been
 * activated by a real press or key press, and there is no attribute, flag or
 * polyfill that changes that on a public site. So the earliest moment the
 * music can legally sound is the tap on the gate -- which is also the first
 * thing the guest does anyway, so it feels immediate rather than delayed.
 *
 * That is why this exposes an imperative start() instead of waiting for a
 * prop: the gate calls it from inside its own click handler, synchronously, on
 * the same task as the press. Calling play() from the setTimeout that runs
 * later, when the card is actually revealed, is what iOS in particular refuses
 * -- the gesture is gone by then. Hence Gate's onGesture prop.
 *
 * On a revisit the gate is skipped, so there is no tap to hang it on and the
 * first press anywhere takes its place. A scroll is deliberately not used: it
 * does not count as activation in Chrome, so listening for it would leave the
 * music permanently blocked.
 *
 * The button is not decoration. Sound that starts on its own needs a way to
 * stop it, and it is a real <button> so it works from the keyboard.
 */
const Sound = forwardRef(function Sound({ showToggle = false, needsGesture = false }, ref) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const start = useCallback(() => {
    if (readPref() === 'off') return;
    const a = audioRef.current;
    if (!a) return;
    a.volume = VOLUME;
    // The element can already be playing if the guest pressed twice quickly;
    // play() is idempotent but the promise is not, so guard on paused.
    if (!a.paused) return;
    const p = a.play();
    if (p && typeof p.then === 'function') {
      p.then(
        () => setPlaying(true),
        () => setPlaying(false) // refused: the button is there for them
      );
    }
  }, []);

  useImperativeHandle(ref, () => ({ start }), [start]);

  // Try for sound the instant the page opens.
  //
  // This is not a formality, and it is the closest thing to what a browser will
  // actually permit. Measured, not assumed: with a normal Chrome this is
  // refused with NotAllowedError, but for a visitor whose browser allows
  // autoplay with sound -- they switched it on for the site, or Chrome's media
  // engagement is high enough to wave them through -- the same call succeeds and
  // the music is audible from the first moment, with no press at all. Adding the
  // attempt therefore wins the whole audience that can be won, and costs the
  // rest nothing: the refusal is swallowed here rather than surfaced, and the
  // gate press below remains the fallback for them.
  useEffect(() => {
    start();
  }, [start]);

  // No gate this visit, so wait for the first real press to start. Listeners
  // come off as soon as one fires, and also on unmount.
  useEffect(() => {
    if (!needsGesture || readPref() === 'off') return undefined;

    const events = ['pointerdown', 'keydown', 'touchstart'];
    const onFirst = () => {
      events.forEach((e) => window.removeEventListener(e, onFirst));
      start();
    };
    events.forEach((e) => window.addEventListener(e, onFirst, { passive: true }));

    return () => events.forEach((e) => window.removeEventListener(e, onFirst));
  }, [needsGesture, start]);

  // Pause it if the tab is hidden. A wedding card is something people leave
  // open in another tab, and music playing out of sight is the fastest way to
  // make someone close it.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return undefined;
    const onVis = () => {
      if (document.hidden) a.pause();
      else if (readPref() === 'on') a.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.volume = VOLUME;
      const p = a.play();
      if (p && typeof p.then === 'function') {
        p.then(
          () => {
            setPlaying(true);
            writePref('on');
          },
          () => {}
        );
      }
    } else {
      a.pause();
      setPlaying(false);
      writePref('off');
    }
  };

  return (
    <>
      {/* No controls: this is a soundtrack for the card, not a player. It sits
          in the DOM from the first paint so the gate's click handler has
          something to play. */}
      <audio ref={audioRef} src={asset('sound/music.mp3')} loop preload="auto" />

      {showToggle && (
        <button
          type="button"
          className="sound"
          onClick={toggle}
          // aria-pressed describes the toggle's state, so a screen reader
          // announces it as a switch rather than as a mystery button
          aria-pressed={!playing}
          aria-label={playing ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى'}
          title={playing ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path className="sound__body" d="M4 9.5v5h3.6L13 18.6V5.4L7.6 9.5H4z" />
            {playing ? (
              <>
                <path className="sound__wave" d="M16.2 9.4a3.6 3.6 0 0 1 0 5.2" />
                <path className="sound__wave" d="M18.7 7a7.2 7.2 0 0 1 0 10" />
              </>
            ) : (
              <path className="sound__wave" d="M16.4 9.6l4.4 4.8M20.8 9.6l-4.4 4.8" />
            )}
          </svg>
        </button>
      )}
    </>
  );
});

export default Sound;
