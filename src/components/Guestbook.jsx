import { useId, useRef, useState } from 'react';

// The form posts to the Pages Function, not to Telegram. The bot token is a
// server-side secret and is never in this bundle; if it were, anyone could read
// it out of the page source and use the bot. See functions/api/guestbook.js.
const ENDPOINT = 'api/guestbook';

// Kept in step with the caps in the function, so the field stops growing before
// the server has to cut it. The server is the one that actually enforces them.
const MAX_NAME = 60;
const MAX_MESSAGE = 500;

const MESSAGES = {
  sending: 'جاري الإرسال…',
  ok: 'وصلت رسالتكم، شكراً لكم 🤍',
  name_required: 'اكتبوا اسمكم من فضلكم.',
  message_required: 'اكتبوا رسالة قصيرة من فضلكم.',
  too_many: 'وصلت رسالتكم، جرّبوا بعد قليل بسبب كثرة المحاولات.',
  not_configured: 'صار خلل بسيط بالرسائل، جرّبوا بعد قليل.',
  no_chat: 'صار خلل بسيط بالرسائل، جرّبوا بعد قليل.',
  telegram_failed: 'صار خلل بالرسائل، جرّبوا بعد قليل.',
  network: 'ما قدرنا نوصل الرسالة، تأكدوا من الإنترنت وجربوا مرة ثانية.',
  default: 'صار خلل بالرسائل، جرّبوا بعد قليل.'
};

export default function Guestbook() {
  const uid = useId();
  const formRef = useRef(null);

  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  async function onSubmit(event) {
    event.preventDefault();
    if (status === 'sending') return;

    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    const message = String(data.get('message') || '').trim();

    // The same checks the server makes, so an obvious mistake never becomes a
    // round trip. The server still checks again; this is only for the feel.
    if (name.length < 2) {
      setStatus('idle');
      setError(MESSAGES.name_required);
      return;
    }
    if (message.length < 2) {
      setStatus('idle');
      setError(MESSAGES.message_required);
      return;
    }

    setStatus('sending');
    setError('');

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          message,
          // A field no human sees, for the bots that fill in every input.
          website: String(data.get('website') || '')
        })
      });

      const body = await res.json().catch(() => ({}));

      if (res.ok && body.ok) {
        setStatus('ok');
        if (formRef.current) formRef.current.reset();
        return;
      }

      setStatus('idle');
      setError(MESSAGES[body.error] || MESSAGES.default);
    } catch {
      setStatus('idle');
      setError(MESSAGES.network);
    }
  }

  const busy = status === 'sending';
  const done = status === 'ok';

  return (
    <section className="guestbook" aria-labelledby={`${uid}-title`}>
      <h2 className="guestbook__title" id={`${uid}-title`}>
        لهـــــا، في أجمــــل أيامهـــــا
      </h2>
      <p className="guestbook__lede">اتركولي كلمة حلوة، أخليها ذكرى من يومي الجميل</p>

      <form className="guestbook__form" ref={formRef} onSubmit={onSubmit} noValidate>
        <div className="guestbook__field">
          <label className="guestbook__label" htmlFor={`${uid}-name`}>
            الاسم
          </label>
          <input
            className="guestbook__input"
            id={`${uid}-name`}
            name="name"
            type="text"
            maxLength={MAX_NAME}
            autoComplete="name"
            required
            disabled={busy || done}
          />
        </div>

        <div className="guestbook__field">
          <label className="guestbook__label" htmlFor={`${uid}-message`}>
            الرسالة
          </label>
          <textarea
            className="guestbook__input guestbook__input--area"
            id={`${uid}-message`}
            name="message"
            rows={4}
            maxLength={MAX_MESSAGE}
            required
            disabled={busy || done}
          />
        </div>

        {/* honeypot: hidden from people, irresistible to bots */}
        <div className="guestbook__trap" aria-hidden="true">
          <label htmlFor={`${uid}-website`}>موقعك</label>
          <input id={`${uid}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <button className="guestbook__send" type="submit" disabled={busy || done}>
          {busy ? MESSAGES.sending : done ? MESSAGES.ok : 'أرسل'}
        </button>

        {/* The one live region on the page: a send either succeeds or explains
            itself, and a sighted guest who cannot see the button change needs
            to be told. */}
        <p
          className={`guestbook__status${error ? ' guestbook__status--bad' : ''}`}
          role="status"
          aria-live="polite"
        >
          {error || (busy ? MESSAGES.sending : done ? MESSAGES.ok : '')}
        </p>
      </form>
    </section>
  );
}
