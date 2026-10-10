// Plain module (no server-only imports) so client components can use it.
export const STATUS_LABELS = {
  pending: 'Order received',
  preparing: 'Being prepared',
  on_the_way: 'On the way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

// Once an order is delivered or cancelled it can't change, so polling stops.
export const isTerminal = (status) => status === 'delivered' || status === 'cancelled';
