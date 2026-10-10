// Order logic shared by POST /api/orders and the server actions.
// The store is in memory (kept on globalThis so dev hot-reload doesn't wipe it).
// It is a stand-in for a real database: orders vanish when the server restarts
// and are not shared between serverless instances.
import { randomUUID } from 'node:crypto';
import { getDish } from '@/lib/dishes';
import { orderSchema, MAX_QTY } from '@/lib/schema';

const store = (globalThis.__addisOrders ??= new Map());

// Validate with the shared schema, then check the dish ids exist and price the
// order from our own data. The client never tells us a price.
export function validateOrderInput(input) {
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) {
    const { fieldErrors, formErrors } = parsed.error.flatten();
    return { ok: false, fieldErrors, formErrors };
  }

  const { items, ...customer } = parsed.data;

  const qtyById = new Map();
  for (const { id, qty } of items) qtyById.set(id, (qtyById.get(id) || 0) + qty);

  const unknown = [...qtyById.keys()].filter((id) => !getDish(id));
  if (unknown.length > 0) {
    return { ok: false, fieldErrors: { items: [`Unknown dish id: ${unknown.join(', ')}`] }, formErrors: [] };
  }
  if ([...qtyById.values()].some((q) => q > MAX_QTY)) {
    return { ok: false, fieldErrors: { items: [`Maximum ${MAX_QTY} of any one dish`] }, formErrors: [] };
  }

  const lines = [...qtyById].map(([id, qty]) => {
    const dish = getDish(id);
    return { dishId: id, name: dish.name, price: dish.price, qty };
  });
  const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  return { ok: true, customer, lines, total };
}

// Stand-in for a real kitchen: a pending order moves through the stages below
// as time passes, so the polling order page has something to show. The stored
// status is only "pending" or "cancelled"; the rest is derived from the age.
const STAGES = [
  ['pending', 0],
  ['preparing', 30_000],
  ['on_the_way', 60_000],
  ['delivered', 90_000],
];

function currentStatus(order) {
  if (order.status === 'cancelled') return 'cancelled';
  const age = Date.now() - Date.parse(order.createdAt);
  let status = 'pending';
  for (const [name, from] of STAGES) if (age >= from) status = name;
  return status;
}

// Never expose the owner's id in responses or props.
function toPublic({ userId, ...order }) {
  return { ...order, status: currentStatus(order) };
}

export function createOrder({ userId, customer, lines, total }) {
  if (!userId) throw new Error('createOrder needs the signed-in user id');
  const order = {
    id: randomUUID(),
    userId,
    status: 'pending',
    customer,
    lines,
    total,
    createdAt: new Date().toISOString(),
  };
  store.set(order.id, order);
  return toPublic(order);
}

// Returns the order only if it exists AND belongs to this user.
export function getOrderForUser(id, userId) {
  const order = store.get(id);
  return order && order.userId === userId ? toPublic(order) : null;
}

// Staff only: every order. Callers must check session.role === 'staff' first;
// the page and route handler that use it do.
export function listAllOrders() {
  return [...store.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(toPublic);
}

export function listOrdersForUser(userId) {
  return [...store.values()]
    .filter((o) => o.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toPublic);
}

// Ownership is enforced here, next to the write, so no caller can forget it.
// A missing order and someone else's order both return "not_found" so we don't
// reveal which order ids exist.
export function cancelOrderForUser(id, userId) {
  const order = store.get(id);
  if (!order || order.userId !== userId) return { ok: false, reason: 'not_found' };
  if (currentStatus(order) !== 'pending') return { ok: false, reason: 'not_cancellable' };
  order.status = 'cancelled';
  return { ok: true, order: toPublic(order) };
}
