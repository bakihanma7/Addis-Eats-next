'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { CART_COOKIE, parseCart, serializeCart } from '@/lib/cart';

const CartContext = createContext(null);

// The only place cart state lives. It wraps `children`, which stay server
// components: they are passed in from the root layout, not imported here.
export function Providers({ children }) {
  const [items, setItems] = useState({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const match = document.cookie.split('; ').find((c) => c.startsWith(`${CART_COOKIE}=`));
    setItems(parseCart(match ? decodeURIComponent(match.split('=')[1]) : ''));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.cookie = `${CART_COOKIE}=${encodeURIComponent(serializeCart(items))}; path=/; max-age=604800`;
  }, [items, hydrated]);

  const add = (id) => setItems((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const remove = (id) =>
    setItems((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  const clear = () => {
    setItems({});
    document.cookie = `${CART_COOKIE}=; path=/; max-age=0`;
  };
  const count = Object.values(items).reduce((a, b) => a + b, 0);

  return <CartContext.Provider value={{ items, add, remove, clear, count, ready: hydrated }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <Providers>');
  return ctx;
}
