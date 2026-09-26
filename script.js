/* ==========================================================================
   Hanene & Smail — opening sequence controller
   --------------------------------------------------------------------------
   The envelope, the wax, the fracture, the flap, the card, the reveal:
   every visual decision lives in style.css. This file owns exactly one
   thing — the order in which the experience passes through its states, and
   the guarantees that the sequence can never be entered twice, never
   interrupted half-way, and never leave the visitor looking at a sealed
   envelope that will not open.

   State machine
     CLOSED ──tap/Enter/Space──▶ SEAL_CLICKED ──▶ OPENING ──▶ OPEN
                                                                   │
                                                                   ▼
                                                       INVITATION_REVEALED

   No animation loop runs here. No layout is read or written. A single
   scheduled step per phase, and CSS owns the interpolation.
   ========================================================================== */

(function () {
  'use strict';

  /* ----------------------------------------------------------------------
     Elements
     ---------------------------------------------------------------------- */
  var root       = document.documentElement;
  var scene      = document.getElementById('envelopeScene');
  var invitation = document.getElementById('invitation');
  var seal       = document.getElementById('seal');
  var live       = document.getElementById('live');

  /* Nothing to orchestrate without the envelope. Leave the page alone. */
  if (!scene || !invitation || !seal) { return; }

  /* ----------------------------------------------------------------------
     States
     ---------------------------------------------------------------------- */
  var CLOSED    = 'CLOSED';
  var PRESSED   = 'SEAL_CLICKED';
  var OPENING   = 'OPENING';
  var REVEALED  = 'INVITATION_REVEALED';

  var state = CLOSED;
  var timers = [];

  /* The score. [ delay in ms, data-state, machine state ]
     Delays are cumulative from the moment the seal is committed to. Each
     one lines up with a transition-delay declared in style.css, so the
     choreography lives in one readable place. */
  var SCORE = [
    [    0, 'pressed',  PRESSED  ],  /* the wax yields                */
    [  150, 'breaking', OPENING  ],  /* the seal fractures            */
    [  400, 'open',     OPENING  ],  /* flap lifts, card follows       */
    [ 1650, 'revealed', REVEALED ]   /* stage recedes, photograph in  */
  ];

  /* Reduced motion keeps the whole ritual — it simply stops performing. */
  var SCORE_REDUCED = [
    [   0, 'pressed',  PRESSED  ],
    [  60, 'breaking', OPENING  ],
    [ 150, 'open',     OPENING  ],
    [ 480, 'revealed', REVEALED ]
  ];

  var motionQuery = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

  function prefersReduced() {
    return !!(motionQuery && motionQuery.matches);
  }

  /* ----------------------------------------------------------------------
     Small helpers
     ---------------------------------------------------------------------- */
  function clearTimers() {
    for (var i = 0; i < timers.length; i++) {
      window.clearTimeout(timers[i]);
    }
    timers.length = 0;
  }

  function setState(machineState, attribute) {
    if (state === machineState) { return; }
    state = machineState;
    root.setAttribute('data-state', attribute);
  }

  function schedule(fn, delay) {
    timers.push(window.setTimeout(fn, delay));
  }

  /* ----------------------------------------------------------------------
     Hand-off to the invitation
     ---------------------------------------------------------------------- */
  function settle() {
    invitation.classList.add('is-in');
    scene.classList.add('is-gone');

    /* The seal has done its work: out of the tab order, out of the a11y
       tree, and no longer a tap target. */
    seal.disabled = true;
    seal.tabIndex = -1;
    scene.setAttribute('aria-hidden', 'true');

    if (live) {
      live.textContent = 'تم فتح دعوة الزفاف. Hanene و Smail، 15 أكتوبر 2026، '
                       + 'صالة عزوز للافراح والمناسبات.';
    }
  }

  /* Jump straight to the end. Used when the tab is hidden mid-sequence
     (background tabs throttle timers to a crawl) and as the safety net if
     anything at all goes wrong. */
  function finishNow() {
    clearTimers();
    setState(REVEALED, 'revealed');
    settle();
  }

  /* ----------------------------------------------------------------------
     Open
     ---------------------------------------------------------------------- */
  function open() {
    /* The one guard that matters. A second tap, a double tap, an impatient
       double-click, a synthetic click from a screen reader — all land here
       and leave immediately. */
    if (state !== CLOSED) { return; }

    /* Stop listening the instant we start: no listener is left behind to
       fire against a state that no longer exists. */
    seal.removeEventListener('click', open);
    seal.removeEventListener('keydown', onKey);

    /* The entrance is theatre with a runtime on it; a visitor who has already
       decided does not need to wait out the curtain. Waking here drops the
       curtain and the rise so they cannot collide with the opening. */
    root.classList.add('is-awake');

    var score = prefersReduced() ? SCORE_REDUCED : SCORE;

    for (var i = 0; i < score.length; i++) {
      (function (step) {
        schedule(function () {
          setState(step[2], step[1]);
          if (step[1] === 'revealed') { settle(); }
        }, step[0]);
      })(score[i]);
    }
  }

  /* Enter and Space are handled natively by <button>. This only adds a
     guard so a key repeat cannot re-enter the sequence. */
  function onKey(event) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      if (state !== CLOSED) { event.preventDefault(); }
    }
  }

  /* ----------------------------------------------------------------------
     Wiring
     ---------------------------------------------------------------------- */
  try {
    seal.addEventListener('click', open);
    seal.addEventListener('keydown', onKey);

    /* Any sign of intent — key, scroll, a tap anywhere — retires the curtain
       early. It is only a courtesy; the sequence never waits on it. */
    function wake() {
      root.classList.add('is-awake');
      document.removeEventListener('pointerdown', wake);
      document.removeEventListener('keydown', wake);
      document.removeEventListener('wheel', wake);
      document.removeEventListener('touchstart', wake);
    }
    document.addEventListener('pointerdown', wake, { passive: true });
    document.addEventListener('keydown', wake);
    document.addEventListener('wheel', wake, { passive: true });
    document.addEventListener('touchstart', wake, { passive: true });

    /* Never let a throttled background tab stretch the ritual. */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && state !== CLOSED && state !== REVEALED) {
        finishNow();
      }
    });

    /* Last-resort net: should the decorative layer ever fail to build, the
       invitation still reaches the visitor. */
    window.addEventListener('error', function () {
      if (state !== REVEALED) { finishNow(); }
    });

    root.setAttribute('data-state', 'closed');
  } catch (err) {
    finishNow();
  }

  /* Exposed for the record; also keeps the sequence inspectable from the
     console without a build step. */
  root.invitation = {
    get state() { return state; },
    open: open,
    finish: finishNow
  };
}());
