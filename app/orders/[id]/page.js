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
    <div className="page page-narrow">
      <header className="page-head">
        <p className="eyebrow">Placed {new Date(order.createdAt).toLocaleString('en-US')}</p>
        <h1>Your order</h1>
      </header>
      <OrderStatus initialOrder={{ id: order.id, status: order.status }} />
      <ul className="receipt">
        {order.lines.map((l) => (
          <li key={l.dishId}>
            <span className="receipt-name">{l.name}</span>
            <span className="receipt-qty">× {l.qty}</span>
            <span className="leader" aria-hidden="true" />
            <span className="receipt-price">{`$${l.price * l.qty}`}</span>
          </li>
        ))}
      </ul>
      <p className="receipt-total">
        <span>Total</span>
        <strong>{`$${order.total}`}</strong>
      </p>
      <p className="muted center" style={{ marginTop: '2rem' }}>Delivering to {order.customer.name}, {order.customer.address}</p>
      <p className="back-link"><Link href="/orders">← All orders</Link></p>
    </div>
  );
}
