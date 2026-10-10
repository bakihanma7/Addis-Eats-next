import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api';
import { getOrderForUser } from '@/lib/orders';
import { getSession } from '@/lib/session';

// GET /api/orders/:id -> 200 { order }, 401 signed out, or 404.
// Polled by the order page. Someone else's order is a 404, same as a missing one.
export async function GET(_request, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return errorResponse(401, 'unauthenticated', 'Sign in first.');
  const order = getOrderForUser(id, session.userId);
  if (!order) return errorResponse(404, 'not_found', 'Order not found.');
  return NextResponse.json({ order }, { headers: { 'Cache-Control': 'no-store' } });
}
