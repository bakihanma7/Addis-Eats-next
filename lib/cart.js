// Plain module (no directive): shared by the client provider and server pages.
// Cart is stored in the "cart" cookie as "id:qty|id:qty".
export const CART_COOKIE = 'cart';

export function parseCart(value) {
  const items = {};
  if (!value) return items;
  for (const part of value.split('|')) {
    const [id, qty] = part.split(':');
    const n = Number(qty);
    if (id && n > 0) items[id] = n;
  }
  return items;
}

export function serializeCart(items) {
  return Object.entries(items).map(([id, qty]) => `${id}:${qty}`).join('|');
}
