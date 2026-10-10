'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { isTerminal } from '@/lib/status';
import { StatusBadge } from '../../status-badge';
import { CancelOrderButton } from './CancelOrderButton';

// Seeded by the server page: `initialOrder` is the order as the server just
// read it, passed as fallbackData, so the first paint already shows the real
// status (no spinner, no loading state). After mount SWR polls every 5 seconds
// until the order reaches a final status. See DATA.md.
export function OrderStatus({ initialOrder }) {
  const { data, error, mutate } = useSWR(`/api/orders/${initialOrder.id}`, fetcher, {
    fallbackData: { order: initialOrder },
    // `latest` is undefined before the first fetch finishes; keep polling then.
    refreshInterval: (latest) => (latest && isTerminal(latest.order.status) ? 0 : 5000),
    // Don't hammer an endpoint that says the order is gone; retry other errors a few times.
    onErrorRetry: (err, _key, _config, revalidate, { retryCount }) => {
      if (err.status === 404 || retryCount >= 3) return;
      setTimeout(() => revalidate({ retryCount }), 5000);
    },
  });

  const { status } = data.order;

  return (
    <div className="status-panel">
      <p aria-live="polite">
        <StatusBadge status={status} />
      </p>
      {!isTerminal(status) && <p className="muted">Checking for updates every 5 seconds.</p>}
      {error && (
        <p className="field-error">
          {error.status === 404 ? 'This order is no longer available.' : "Couldn't refresh the status. Retrying."}
        </p>
      )}
      {status === 'pending' && <CancelOrderButton orderId={initialOrder.id} onCancelled={() => mutate()} />}
    </div>
  );
}
