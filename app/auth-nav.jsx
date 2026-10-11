'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { signOut } from './actions';
import { useCart } from './providers';

// Client leaf for the header: who is signed in. The root layout stays static
// (no cookies() read), so the session is fetched here instead. The pathname is
// part of the SWR key, so it refreshes after every navigation, including the
// redirect that follows sign-in and sign-out.
export function AuthNav() {
  const pathname = usePathname();
  const { data } = useSWR(['/api/session', pathname], ([url]) => fetcher(url));
  const user = data?.user;
  const { clear } = useCart();

  // Until the session arrives, hold the space with an invisible "Sign in" so the
  // header doesn't shift when the real link appears.
  if (!data) return <span className="nav-placeholder" aria-hidden="true">Sign in</span>;
  if (!user) return <Link href="/signin">Sign in</Link>;
  return (
    <>
      {user.role === 'staff' && <Link href="/kitchen">Kitchen</Link>}
      <form
        action={async () => {
          clear();
          await signOut();
        }}
        className="inline-form"
      >
        <button type="submit" className="link-button">
          Sign out<span className="nav-user">{` (${user.name})`}</span>
        </button>
      </form>
    </>
  );
}
