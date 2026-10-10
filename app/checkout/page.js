import Link from 'next/link';
import { cookies } from 'next/headers';
import { getDish } from '@/lib/dishes';
import { CART_COOKIE, parseCart } from '@/lib/cart';
import { CheckoutForm } from './CheckoutForm';
import { NO_INDEX } from '@/lib/seo';

export const metadata = {
  title: 'Checkout',
  description: 'Enter your delivery details and place your order.',
  robots: NO_INDEX, // private: also excluded in robots.js
};

// Forced dynamic: checkout must never be served from a cached/prerendered page.
// The read that requires it is cookies() below. The cart lives in the
// visitor's "cart" cookie, which only exists at request time, so the result
// differs per visitor and cannot be computed at build time.
export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const cookieStore = await cookies();
  const items = parseCart(cookieStore.get(CART_COOKIE)?.value);
  const lines = Object.entries(items)
    .map(([id, qty]) => ({ dish: getDish(id), qty }))
    .filter((l) => l.dish);
  const total = lines.reduce((sum, l) => sum + l.dish.price * l.qty, 0);

  return (
    <div className="page page-narrow">
      <header className="page-head">
        <p className="eyebrow">Almost there</p>
        <h1>Checkout</h1>
      </header>
      {lines.length === 0 ? (
        <div className="empty">
          <p>Your cart is empty.</p>
          <Link href="/menu" className="btn">Browse the menu</Link>
        </div>
      ) : (
        <>
          <h2 className="section-label">Your order</h2>
          <ul className="receipt">
            {lines.map((l) => (
              <li key={l.dish.id}>
                <span className="receipt-name">{l.dish.name}</span>
                <span className="receipt-qty">× {l.qty}</span>
                <span className="leader" aria-hidden="true" />
                <span className="receipt-price">{`$${l.dish.price * l.qty}`}</span>
              </li>
            ))}
          </ul>
          <p className="receipt-total">
            <span>Total</span>
            <strong>{`$${total}`}</strong>
          </p>
          <CheckoutForm />
        </>
      )}
      <p className="back-link"><Link href="/cart">← Back to cart</Link></p>
    </div>
  );
}
