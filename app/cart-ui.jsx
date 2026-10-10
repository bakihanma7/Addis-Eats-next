'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from './providers';

// Small interactive leaves that read the cart. Everything around them is server-rendered.

// Renders " (2)" next to "Cart" in the header, nothing when the cart is empty.
export function CartBadge() {
  const { count } = useCart();
  return count > 0 ? <span className="cart-count">{` (${count})`}</span> : null;
}

// `size="sm"` is the outlined ADD button on a menu row; `size="lg"` is the solid
// one on the dish page. The label flips to "Added" for a moment as feedback.
export function AddToCartButton({ id, name, size = 'sm' }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1200);
    return () => clearTimeout(t);
  }, [added]);

  const label = name ? (added ? `Added ${name}` : `Add ${name} to cart`) : undefined;

  return (
    <button
      type="button"
      className={`btn btn-add ${size === 'lg' ? 'btn-solid btn-lg' : 'btn-sm'}`}
      aria-label={label}
      onClick={() => {
        add(id);
        setAdded(true);
      }}
    >
      {added ? 'Added' : 'Add'}
    </button>
  );
}

// `dishes` arrives as props from the server page, so this file does not
// import the dish data module into the client bundle.
export function CartContents({ dishes }) {
  const { items, remove, ready } = useCart();

  // The cart lives in a cookie that is read after hydration, so until then
  // show placeholders instead of flashing "Your cart is empty".
  if (!ready) {
    return (
      <div aria-busy="true">
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    );
  }

  const lines = dishes.filter((d) => items[d.id]);
  if (lines.length === 0) {
    return (
      <div className="empty">
        <p>Your cart is empty.</p>
        <Link href="/menu" className="btn">Browse the menu</Link>
      </div>
    );
  }
  const total = lines.reduce((sum, d) => sum + d.price * items[d.id], 0);

  return (
    <div>
      <h2 className="section-label">Your order</h2>
      <ul className="receipt">
        {lines.map((d) => (
          <li key={d.id}>
            <span className="receipt-name">{d.name}</span>
            <span className="receipt-qty">× {items[d.id]}</span>
            <span className="leader" aria-hidden="true" />
            <span className="receipt-price">{`$${d.price * items[d.id]}`}</span>
            <button type="button" className="btn-link" aria-label={`Remove ${d.name}`} onClick={() => remove(d.id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <p className="receipt-total">
        <span>Total</span>
        <strong>{`$${total}`}</strong>
      </p>
      <div className="actions">
        <Link href="/menu" className="btn">Keep browsing</Link>
        <Link href="/checkout" className="btn btn-solid">Go to checkout</Link>
      </div>
    </div>
  );
}
