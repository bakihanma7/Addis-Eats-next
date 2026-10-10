// Server-side session. The cookie "session" holds "<userId>.<hmac>"; the
// signature means a visitor can't invent or edit a userId. Everything else
// (name, role) is looked up from the user store on each request, so a role is
// never trusted from the browser.
//
// getSession() is the one helper every server surface uses: pages, server
// actions and route handlers. Middleware only checks that the cookie exists
// (it runs on the Edge runtime and is a convenience redirect, not the proof).
import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { getUserById } from '@/lib/users';

export const SESSION_COOKIE = 'session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET must be set in production');
  }
  return 'dev-only-secret-change-me';
}

function sign(value) {
  return createHmac('sha256', secret()).update(value).digest('base64url');
}

// Returns { userId, name, email, role } for a valid session, otherwise null.
export async function getSession() {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const [userId, sig, extra] = raw.split('.');
  if (!userId || !sig || extra !== undefined) return null;
  const given = Buffer.from(sig);
  const expected = Buffer.from(sign(userId));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  const user = getUserById(userId);
  if (!user) return null;
  return { userId: user.id, name: user.name, email: user.email, role: user.role };
}

// Only callable from a server action or route handler (it sets a cookie).
export async function createSession(userId) {
  const store = await cookies();
  store.set(SESSION_COOKIE, `${userId}.${sign(userId)}`, {
    httpOnly: true, // not readable from JavaScript, so XSS can't steal it
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production (plain-http localhost in dev)
    sameSite: 'lax', // not sent on cross-site POSTs
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}
