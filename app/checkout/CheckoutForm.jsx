'use client';

import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { placeOrder } from '../actions';
import { useCart } from '../providers';

const initialState = { status: 'idle' };

export function CheckoutForm() {
  const [state, formAction, pending] = useActionState(placeOrder, initialState);
  const { clear } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (state.status === 'success') {
      clear();
      router.push(`/orders/${state.orderId}`);
    }
  }, [state]);

  if (state.status === 'success') {
    return (
      <p className="empty">
        Order placed. <Link href={`/orders/${state.orderId}`}>View your order</Link>
      </p>
    );
  }

  const errors = state.status === 'invalid' ? state.fieldErrors : {};
  const values = state.status === 'invalid' ? state.values : {};

  return (
    <form action={formAction} className="order-form" noValidate>
      <h2 className="section-label">Delivery details</h2>

      <label>
        Name
        <input name="name" defaultValue={values.name} aria-invalid={!!errors.name} />
        {errors.name && <span className="field-error">{errors.name[0]}</span>}
      </label>

      <label>
        Phone
        <input name="phone" type="tel" defaultValue={values.phone} aria-invalid={!!errors.phone} />
        {errors.phone && <span className="field-error">{errors.phone[0]}</span>}
      </label>

      <label>
        Address
        <input name="address" defaultValue={values.address} aria-invalid={!!errors.address} />
        {errors.address && <span className="field-error">{errors.address[0]}</span>}
      </label>

      <label>
        Notes (optional)
        <textarea name="notes" rows={3} defaultValue={values.notes} aria-invalid={!!errors.notes} />
        {errors.notes && <span className="field-error">{errors.notes[0]}</span>}
      </label>

      {state.status === 'unauthenticated' && (
        <p className="field-error">
          {state.message} <Link href="/signin?next=/checkout">Sign in</Link>
        </p>
      )}
      {errors.items && <p className="field-error">{errors.items[0]}</p>}
      {state.status === 'invalid' && state.formErrors?.length > 0 && (
        <p className="field-error">{state.formErrors[0]}</p>
      )}

      <button type="submit" className="btn btn-solid btn-lg" disabled={pending}>
        {pending ? 'Placing order…' : 'Place order'}
      </button>
    </form>
  );
}
