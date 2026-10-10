'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AuthNav } from './auth-nav';
import { CartBadge } from './cart-ui';

// Desktop: the links sit inline on the right.
// Phone: they hide behind a hamburger button and open as a dropdown.
export function HeaderNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the menu after every navigation.
  useEffect(() => { setOpen(false); }, [pathname]);

  // Close with the Escape key.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="site-nav"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="menu-toggle-bar" aria-hidden="true" />
      </button>

      <nav id="site-nav" className={open ? 'nav site-nav is-open' : 'nav site-nav'} aria-label="Main">
        <Link href="/menu">Menu</Link>
        <Link href="/orders">Orders</Link>
        <AuthNav />
        <Link href="/cart">Cart<CartBadge /></Link>
      </nav>
    </>
  );
}