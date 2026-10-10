import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api';
import { listAllOrders } from '@/lib/orders';
import { getSession } from '@/lib/session';

// GET /api/kitchen/orders -> every order. Staff only.
//   401 not signed in   403 signed in but not staff
export async function GET() {
  const session = await getSession();
  if (!session) return errorResponse(401, 'unauthenticated', 'Sign in first.');
  if (session.role !== 'staff') return errorResponse(403, 'forbidden', 'Staff only.');
  return NextResponse.json({ orders: listAllOrders() }, { headers: { 'Cache-Control': 'no-store' } });
}
