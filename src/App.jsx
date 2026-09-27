import { useLayoutEffect, useState } from 'react';

import Gate from './components/Gate.jsx';
import Invitation from './components/Invitation.jsx';

const SEEN = 'hanene.gate.opened';

function alreadySeen() {
  try {
    return sessionStorage.getItem(SEEN) === '1';
  } catch {
    return false;
  }
}

export default function App() {
  // One source of truth for "has this visitor already tapped the gate".
  //
  // Both flags must start from it. Seeding only showGate left opened === false
  // on a revisit, so the scroll reveals never armed and every [data-reveal]
  // block stayed at opacity 0 for anyone returning within the session.
  const [seen] = useState(alreadySeen);
  const [opened, setOpened] = useState(seen);
  const [showGate, setShowGate] = useState(!seen);

  // Layout effect, not a passive one: the body has to be sealed before the
  // first paint, otherwise the invitation renders unlocked for a frame.
  useLayoutEffect(() => {
    document.body.classList.toggle('is-sealed', showGate);

    // index.html paints background04.png onto <html> so the gate is never a
    // blank screen while this bundle loads. Now that the card's own fixed
    // .canvas is mounted and covers the viewport, drop it -- otherwise a reload
    // that skips the gate would flash the gate's picture for a frame.
    //
    // The rule lives in the #gate-boot stylesheet, so the element carrying it
    // has to go; clearing the inline style of <html> would leave it in place.
    const boot = document.getElementById('gate-boot');
    if (boot) boot.remove();
    document.documentElement.style.removeProperty('background-image');
  }, [showGate]);

  const enter = () => {
    setShowGate(false);
    // unlock scrolling, then reveal on the next frame so the invitation is
    // already laid out when the scroll reveals arm
    requestAnimationFrame(() => {
      document.body.classList.remove('is-sealed');
      setOpened(true);
    });
  };

  return (
    <>
      <Invitation revealed={opened} focusNames={!seen} />
      {showGate && <Gate onEnter={enter} />}
    </>
  );
}
