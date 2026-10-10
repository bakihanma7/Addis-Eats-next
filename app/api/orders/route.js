import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { errorResponse } from '@/lib/api';
import { createOrder, validateOrderInput } from '@/lib/orders';
import { getSession } from '@/lib/session';

// POST /api/orders
//   401 unauthenticated               no valid session
//   201 { order } + Location header   created
//   400 invalid_json                  body isn't JSON
//   422 validation_failed + fieldErrors   JSON, but not a valid order
export async function POST(request) {
  const session = await getSession();
  if (!session) return errorResponse(401, 'unauthenticated', 'Sign in to place an order.');

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, 'invalid_json', 'Request body must be valid JSON.');
  }

  const result = validateOrderInput(body);
  if (!result.ok) {
    return errorResponse(422, 'validation_failed', 'The order could not be validated.', {
      fieldErrors: result.fieldErrors,
      formErrors: result.formErrors,
    });
  }

  const order = createOrder({
    userId: session.userId,
    customer: result.customer,
    lines: result.lines,
    total: result.total,
  });

  revalidatePath('/orders');
  return NextResponse.json({ order }, { status: 201, headers: { Location: `/orders/${order.id}` } });
}
