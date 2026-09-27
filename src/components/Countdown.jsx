import { useEffect, useState } from 'react';

/**
 * Countdown to the wedding.
 *
 * TARGET is midnight local time on 18 October 2026 -- the date printed on the
 * card. The ceremony time was never given, so this counts down to the start of
 * the day rather than to a guessed hour; change the two numbers below if the
 * hour is ever known.
 *
 * Built with Date(y, m, d) rather than the string "2026-10-18", because the
 * string form is parsed as UTC and would land on 17 October for anyone west of
 * Greenwich -- an off-by-one-day countdown.
 */
const TARGET = new Date(2026, 9, 18, 0, 0, 0, 0);

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function remaining(now) {
  const left = TARGET.getTime() - now;
  if (left <= 0) return null;
  return {
    days: Math.floor(left / DAY),
    hours: Math.floor((left % DAY) / HOUR),
    minutes: Math.floor((left % HOUR) / MINUTE),
    seconds: Math.floor((left % MINUTE) / SECOND)
  };
}

const UNITS = [
  { key: 'days', label: 'يوم' },
  { key: 'hours', label: 'ساعة' },
  { key: 'minutes', label: 'دقيقة' },
  { key: 'seconds', label: 'ثانية' }
];

/** Two digits, so the row does not jump width as the numbers change. */
const pad = (n) => String(n).padStart(2, '0');

export default function Countdown() {
  const [left, setLeft] = useState(() => remaining(Date.now()));

  useEffect(() => {
    // Re-sync on tab focus: a backgrounded tab throttles timers to once a
    // minute, so without this the seconds would jump on return.
    const tick = () => setLeft(remaining(Date.now()));
    const id = setInterval(tick, SECOND);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', tick);
    };
  }, []);

  const reached = left === null;

  return (
    <section className="countdown" aria-labelledby="countdown-title">
      {/* The ticking numbers are hidden from assistive tech: read out once a
          second it is unusable. The date is announced once instead, below. */}
      <h2 className="countdown__title" id="countdown-title">
        {reached ? 'وصلنا إلى اليوم الكبير' : 'العد التنازلي للزفاف'}
      </h2>

      <div className="countdown__row" aria-hidden="true">
        {UNITS.map((u, i) => (
          <div className="countdown__cell" key={u.key}>
            <span className="countdown__value">
              {reached ? '--' : u.key === 'days' ? left.days : pad(left[u.key])}
            </span>
            <span className="countdown__label">{u.label}</span>
            {i < UNITS.length - 1 ? <i className="countdown__sep" aria-hidden="true" /> : null}
          </div>
        ))}
      </div>

      <p className="sr-only">
        {!reached && left
          ? `موعد الزفاف يوم 18 أكتوبر 2026. متبقٍ ${left.days} يوم و ${left.hours} ساعة و ${left.minutes} دقيقة`
          : 'موعد الزفاف يوم 18 أكتوبر 2026'}
      </p>
    </section>
  );
}
