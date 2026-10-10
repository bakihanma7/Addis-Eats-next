'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// The smallest possible client leaf: one link that needs the current path
// to highlight itself.
export default function SidebarLink({ href, children }) {
  const pathname = usePathname();
  return (
    <Link href={href} className={pathname === href ? 'active' : ''}>
      {children}
    </Link>
  );
}
