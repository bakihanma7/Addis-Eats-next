import { STATUS_LABELS } from '@/lib/status';

// An order status as a small dot + label. No hooks, so server pages (orders
// list, kitchen) and the client OrderStatus can both use it.
export function StatusBadge({ status }) {
  return <span className="status" data-status={status}>{STATUS_LABELS[status] ?? status}</span>;
}
