'use client';

import { useActionState, useEffect } from 'react';
import { cancelOrder } from '../../actions';

// Client leaf: the pending flag and the returned error message need
// useActionState. `onCancelled` lets the polling status refresh immediately
// instead of waiting for the next 5-second poll.
export function CancelOrderButton({ orderId, onCancelled }) {
  const [state, formAction, pending] = useActionState(cancelOrder.bind(null, orderId), { status: 'idle' });

  useEffect(() => {
    if (state.status === 'success') onCancelled?.();
  }, [state]);

  return (
    <form action={formAction}>
      <button type="submit" disabled={pending}>{pending ? 'Cancelling…' : 'Cancel order'}</button>
      {state.status === 'error' && <p className="field-error">{state.message}</p>}
    </form>
  );
}
