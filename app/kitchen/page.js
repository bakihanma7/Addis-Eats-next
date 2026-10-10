import { notFound, redirect } from 'next/navigation';
import { listAllOrders } from '@/lib/orders';
import { getSession } from '@/lib/session';
import { STATUS_LABELS } from '@/lib/status';
import { NO_INDEX } from '@/lib/seo';

export const metadata = {
  title: 'Kitchen',
  description: 'Staff view of all incoming orders.',
  robots: NO_INDEX, // private: also excluded in robots.js
};

export const dynamic = 'force-dynamic';

// Staff only. The role is checked here on the server, from the user store
// (never from the markup or the cookie). Signed out -> sign in; signed in but
// not staff -> 404, so the page looks like it doesn't exist.
export default async function KitchenPage() {
  const session = await getSession();
  if (!session) redirect('/signin?next=/kitchen');
  if (session.role !== 'staff') notFound();

  const orders = listAllOrders();

  return (
    <div>
      <h1>Kitchen</h1>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <ul>
          {orders.map((o) => (
            <li key={o.id}>
              <strong>{STATUS_LABELS[o.status]}</strong> — {new Date(o.createdAt).toLocaleString('en-US')} — {o.customer.name}, {o.customer.address}
              <ul>
                {o.lines.map((l) => (
                  <li key={l.dishId}>{l.qty} × {l.name}</li>
                ))}
              </ul>
              {o.customer.notes && <p className="muted">Note: {o.customer.notes}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
