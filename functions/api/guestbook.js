/**
 * Guestbook -> Telegram.
 *
 * The bot token lives here, on the server, and never reaches the browser. That
 * is the whole reason this is a Pages Function and not a fetch() from the page:
 * a token in client JavaScript is readable by anyone who opens devtools, and
 * with it anyone can read the guestbook, or use the bot to message every guest
 * themselves. Do not move this into src/.
 *
 * Configure in the Cloudflare Pages dashboard, Settings > Environment
 * variables, for BOTH Production and Preview:
 *
 *   TELEGRAM_BOT_TOKEN   the token from @BotFather
 *   TELEGRAM_CHAT_ID     (optional) which chat to post to. If it is not set,
 *                        the newest chat that has messaged the bot is used, so
 *                        a personal bot works with no extra setup.
 *
 * Locally, put them in a functions/.dev.vars file (git-ignored) instead.
 */

const BOT_TOKEN = 'TELEGRAM_BOT_TOKEN';

const MAX_NAME = 60;
const MAX_MESSAGE = 500;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 3;

// A public form that sends messages is a spam target, so the limits are
// deliberately tight and applied before anything is sent.
const hits = new Map();

function throttled(ip) {
  const now = Date.now();
  const seen = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (seen.length >= MAX_PER_WINDOW) return true;
  seen.push(now);
  hits.set(ip, seen);
  // Keep the map from growing without bound on a long-lived isolate. Pruning
  // the expired entries rather than clearing the whole map, so a busy isolate
  // does not hand everyone still inside their window a free pass.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (!times.some((t) => now - t < WINDOW_MS)) hits.delete(key);
    }
  }
  return false;
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': 'none'
    }
  });
}

// Characters that are not visible on their own. Control codes, but also the
// Unicode formatting characters: the bidi controls (U+202A-U+202E and
// U+2066-U+2069), zero-widths and joiners (U+200B-U+200F), the soft hyphen and
// the byte-order mark. Telegram renders all of them, and a guest whose message
// ends in a right-to-left override gets their own words displayed backwards in
// the chat, so none of them belong in a message meant to read as they typed it.
// Written as a loop rather than a regex so the source file itself contains no
// control characters.
function invisible(code) {
  return (
    code < 32 ||
    code === 127 ||
    code === 0xad ||
    (code >= 0x200b && code <= 0x200f) ||
    (code >= 0x202a && code <= 0x202e) ||
    (code >= 0x2066 && code <= 0x2069) ||
    code === 0xfeff
  );
}

function text(value, max) {
  if (typeof value !== 'string') return '';
  // Each invisible character becomes a space, so it cannot be used to glue words
  // together, and the collapse below also keeps a guest from padding the message
  // past the length cap.
  let out = '';
  for (const ch of value) {
    out += invisible(ch.codePointAt(0)) ? ' ' : ch;
  }
  return out.replace(/\s+/g, ' ').trim().slice(0, max);
}

export async function onRequestPost({ request, env }) {
  const token = env[BOT_TOKEN];
  if (!token) {
    // Loudly, and to the client as a generic failure: a misconfigured deploy
    // should not look like a working one.
    console.error('guestbook: TELEGRAM_BOT_TOKEN is not set on this environment');
    return json({ ok: false, error: 'not_configured' }, 503);
  }

  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for') ||
    'unknown';

  if (throttled(ip)) {
    return json({ ok: false, error: 'too_many' }, 429);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  // A field no human sees, for the bots that fill in every input they find.
  if (payload && typeof payload.website === 'string' && payload.website.trim()) {
    return json({ ok: true }, 200);
  }

  const name = text(payload && payload.name, MAX_NAME);
  const message = text(payload && payload.message, MAX_MESSAGE);

  if (name.length < 2) {
    return json({ ok: false, error: 'name_required' }, 400);
  }
  if (message.length < 2) {
    return json({ ok: false, error: 'message_required' }, 400);
  }

  // parse_mode is left off on purpose. The guest's words then arrive as literal
  // text, so a guest who writes *hello* gets exactly that rather than Telegram
  // markup interpreting it. Nothing here needs formatting that is worth
  // opening that up.
  const body = [
    'رسالة جديدة من دعوة الزفاف',
    '',
    'الاسم: ' + name,
    '',
    'الرسالة:',
    message,
    '',
    'أرسلت في: ' + new Date().toISOString()
  ].join('\n');

  let chatId = env.TELEGRAM_CHAT_ID;
  if (!chatId) {
    // No chat configured: post to the newest chat that has written to the bot.
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`, {
        headers: { accept: 'application/json' }
      });
      const data = await res.json();
      const updates = (data && data.result) || [];
      for (let i = updates.length - 1; i >= 0; i--) {
        const chat = updates[i].message && updates[i].message.chat;
        if (chat && chat.id) {
          chatId = String(chat.id);
          break;
        }
      }
    } catch (err) {
      console.error('guestbook: getUpdates failed', err && err.message);
    }
  }

  if (!chatId) {
    console.error(
      'guestbook: no TELEGRAM_CHAT_ID and no chat found in getUpdates. ' +
        'Message the bot once, or set TELEGRAM_CHAT_ID.'
    );
    return json({ ok: false, error: 'no_chat' }, 503);
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: body,
        disable_web_page_preview: true
      })
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('guestbook: sendMessage failed', res.status, detail.slice(0, 400));
      return json({ ok: false, error: 'telegram_failed' }, 502);
    }
  } catch (err) {
    console.error('guestbook: sendMessage threw', err && err.message);
    return json({ ok: false, error: 'network' }, 502);
  }

  return json({ ok: true }, 200);
}

export async function onRequest() {
  // Anything that is not a POST -- a GET from the address bar, a HEAD from a
  // link preview -- gets nothing and says nothing.
  return json({ ok: false, error: 'method_not_allowed' }, 405);
}
