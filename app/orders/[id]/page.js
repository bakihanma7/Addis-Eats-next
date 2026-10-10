import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getOrderForUser } from '@/lib/orders';
import { getSession } from '@/lib/session';
import { OrderStatus } from './OrderStatus';
import { NO_INDEX } from '@/lib/seo';

export const metadata = {
  title: 'Your order',
  description: 'Live status of your Addis Eats order.',
  robots: NO_INDEX, // private: also excluded in robots.js
};

export const dynamic = 'force-dynamic';

// Server component: reads the order and renders everything that never changes.
// Only the status is live, so only <OrderStatus> is a client leaf; it receives
// the server's copy of the status as its starting data.
export default async function OrderPage({ params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/signin?next=${encodeURIComponent(`/orders/${id}`)}`);
  // Someone else's order looks exactly like an order that doesn't exist.
  const order = getOrderForUser(id, session.userId);
  if (!order) notFound();

  return (
    <div>
      <h1>Your order</h1>
      <OrderStatus initialOrder={{ id: order.id, status: order.status }} />
      <p>Placed {new Date(order.createdAt).toLocaleString('en-US')}</p>
      <ul>
        {order.lines.map((l) => (
          <li key={l.dishId}>{l.name} × {l.qty} — ${l.price * l.qty}</li>
        ))}
      </ul>
      <p><strong>Total: ${order.total}</strong></p>
      <p>Delivering to {order.customer.name}, {order.customer.address}</p>
      <p><Link href="/orders">← All orders</Link></p>
    </div>
  );
}
