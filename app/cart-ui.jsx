'use client';

import { useCart } from './providers';

// Small interactive leaves that read the cart. Everything around them is server-rendered.

export function CartBadge() {
  const { count } = useCart();
  return count > 0 ? <span className="badge">{count}</span> : null;
}

export function AddToCartButton({ id }) {
  const { add } = useCart();
  return <button onClick={() => add(id)}>Add to cart</button>;
}

// `dishes` arrives as props from the server page, so this file does not
// import the dish data module into the client bundle.
export function CartContents({ dishes }) {
  const { items, remove } = useCart();
  const lines = dishes.filter((d) => items[d.id]);
  if (lines.length === 0) return <p>Your cart is empty.</p>;
  const total = lines.reduce((sum, d) => sum + d.price * items[d.id], 0);

  return (
    <div>
      <ul>
        {lines.map((d) => (
          <li key={d.id}>
            {d.name} × {items[d.id]} — ${d.price * items[d.id]}{' '}
            <button onClick={() => remove(d.id)}>Remove</button>
          </li>
        ))}
      </ul>
      <p><strong>Total: ${total}</strong></p>
    </div>
  );
}
