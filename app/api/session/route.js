import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api';
import { createSession, destroySession, getSession } from '@/lib/session';
import { verifyCredentials } from '@/lib/users';

// GET /api/session -> 200 { user: { name, role } | null }. Read by the header.
export async function GET() {
  const session = await getSession();
  const user = session ? { name: session.name, role: session.role } : null;
  return NextResponse.json({ user }, { headers: { 'Cache-Control': 'no-store' } });
}

// POST /api/session { email, password } -> 200 { user } + session cookie, or
// 400 invalid_json, 401 invalid_credentials. The JSON twin of the sign-in form,
// handy for curl and scripts/check-api.sh.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, 'invalid_json', 'Request body must be valid JSON.');
  }
  const email = typeof body?.email === 'string' ? body.email : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const user = verifyCredentials(email, password);
  if (!user) return errorResponse(401, 'invalid_credentials', 'Email or password is incorrect.');
  await createSession(user.id);
  return NextResponse.json({ user: { name: user.name, role: user.role } });
}

// DELETE /api/session -> 204, signs out.
export async function DELETE() {
  await destroySession();
  return new NextResponse(null, { status: 204 });
}
