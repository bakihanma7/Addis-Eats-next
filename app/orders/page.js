import Link from 'next/link';
import { redirect } from 'next/navigation';
import { listOrdersForUser } from '@/lib/orders';
import { getSession } from '@/lib/session';
import { StatusBadge } from '../status-badge';
import { NO_INDEX } from '@/lib/seo';

export const metadata = {
  title: 'Your orders',
  description: 'Your Addis Eats orders and their delivery status.',
  robots: NO_INDEX, // private: also excluded in robots.js
};

// Reads the session cookie, so this is dynamic and different per visitor.
export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect('/signin?next=/orders'); // middleware only saw a cookie; this proves it
  // Scoped to the session's own id: there is no way to ask for another account's orders.
  const orders = listOrdersForUser(session.userId);

  return (
    <div className="page page-narrow">
      <header className="page-head">
        <p className="eyebrow">Order history</p>
        <h1>Your orders</h1>
      </header>
      {orders.length === 0 ? (
        <div className="empty">
          <p>No orders yet.</p>
          <Link href="/menu" className="btn">Browse the menu</Link>
        </div>
      ) : (
        <ul className="order-list">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/orders/${o.id}`} className="order-row">
                <span className="order-date">{new Date(o.createdAt).toLocaleString('en-US')}</span>
                <span className="order-total">{`$${o.total}`}</span>
                <StatusBadge status={o.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
