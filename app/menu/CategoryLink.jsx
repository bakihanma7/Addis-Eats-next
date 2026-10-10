'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// The smallest possible client leaf: one link that needs the current path
// to highlight itself.
export default function CategoryLink({ href, children }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link href={href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>
      {children}
    </Link>
  );
}
