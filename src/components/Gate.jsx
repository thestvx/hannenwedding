import { useEffect, useMemo, useRef, useState } from 'react';

const SEEN = 'hanene.gate.opened';

const asset = (p) => new URL(p.replace(/^\//, ''), document.baseURI).href;

/**
 * The gate is background04.png, filling the screen the moment the page loads.
 * There is no envelope and no seal: a press anywhere on the background enters
 * the invitation, and the gate fades away to reveal it.
 *
 * The whole surface is a real <button>, so the gate is reachable and operable
 * from the keyboard as well as by pointer -- a div with a click handler would
 * not be.
 *
 * Shown once per session: a reload or a back-navigation goes straight to the
 * invitation, but closing the tab and coming back shows it again.
 *
 * onGesture is called synchronously from inside the press, before any of the
 * opening work below. It exists for the music: browsers will not start audio
 * with sound without a user gesture, and iOS in particular wants play() to be
 * called on the gesture's own task rather than from the setTimeout that reveals
 * the card 620ms later, by which point the gesture has expired.
 */
export default function Gate({ onEnter, onGesture }) {
  const [opening, setOpening] = useState(false);

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

    // same task as the press, so this is still a live user gesture
    onGesture?.();

    try {
      sessionStorage.setItem(SEEN, '1');
    } catch {
      /* private mode: the gate simply shows again next visit */
    }

    setOpening(true);
    timers.current.push(setTimeout(() => onEnter(), reduce ? 260 : 620));
  };

  return (
    <button
      type="button"
      className={`gate${opening ? ' is-opening' : ''}`}
      onClick={enter}
      aria-label="ادخل إلى دعوة الزفاف"
      style={{ backgroundImage: `url("${asset('background/background04.png')}")` }}
    />
  );
}
