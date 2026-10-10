'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { CART_COOKIE, parseCart } from '@/lib/cart';
import { cancelOrderForUser, createOrder, validateOrderInput } from '@/lib/orders';
import { createSession, destroySession, getSession } from '@/lib/session';
import { safeNext } from '@/lib/safe-next';
import { verifyCredentials } from '@/lib/users';

const text = (v) => (typeof v === 'string' ? v : '');

// Form action for /signin. `next` is client-controlled, so it is re-validated
// here; an unsafe value silently becomes "/" instead of an open redirect.
export async function signIn(formData) {
  const next = safeNext(text(formData.get('next')));
  const user = verifyCredentials(text(formData.get('email')), text(formData.get('password')));
  if (!user) {
    const params = new URLSearchParams({ error: '1' });
    if (next !== '/') params.set('next', next);
    redirect(`/signin?${params}`);
  }
  await createSession(user.id);
  redirect(next);
}

export async function signOut() {
  await destroySession();
  redirect('/');
}

// Used with useActionState on the checkout form: (previousState, formData).
// Same schema and same validation as POST /api/orders. The cart comes from the
// cart cookie on the server, never from the form, so it can't be tampered with.
export async function placeOrder(_prevState, formData) {
  // Actions are public endpoints: middleware does not protect them.
  const session = await getSession();
  if (!session) {
    return { status: 'unauthenticated', message: 'Please sign in to place an order.' };
  }

  const values = {
    name: text(formData.get('name')),
    phone: text(formData.get('phone')),
    address: text(formData.get('address')),
    notes: text(formData.get('notes')),
  };

  const cart = parseCart((await cookies()).get(CART_COOKIE)?.value);
  const items = Object.entries(cart).map(([id, qty]) => ({ id, qty }));

  const result = validateOrderInput({ ...values, items });
  if (!result.ok) {
    // `values` is sent back so the form keeps what the visitor typed.
    return { status: 'invalid', fieldErrors: result.fieldErrors, formErrors: result.formErrors, values };
  }

  const order = createOrder({
    userId: session.userId,
    customer: result.customer,
    lines: result.lines,
    total: result.total,
  });

  // Clear the cart on the server too, so it also works with JavaScript disabled.
  (await cookies()).delete(CART_COOKIE);
  revalidatePath('/orders');
  return { status: 'success', orderId: order.id };
}

// Bound to an order id in the page: cancelOrder.bind(null, order.id), then used
// with useActionState, so React calls it as (orderId, previousState, formData).
// The id is client-controlled, so it is checked like any other input.
export async function cancelOrder(orderId, _prevState, _formData) {
  const session = await getSession();
  if (!session) {
    return { status: 'error', message: 'Please sign in to cancel an order.' };
  }
  if (typeof orderId !== 'string' || orderId.length === 0) {
    return { status: 'error', message: 'Invalid order.' };
  }

  // The owner check lives inside cancelOrderForUser, right next to the write.
  const result = cancelOrderForUser(orderId, session.userId);
  if (!result.ok) {
    return {
      status: 'error',
      message: result.reason === 'not_cancellable' ? 'This order can no longer be cancelled.' : 'Order not found.',
    };
  }

  revalidatePath('/orders');
  revalidatePath(`/orders/${orderId}`);
  return { status: 'success' };
}
