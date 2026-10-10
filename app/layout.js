import Link from 'next/link';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { CartBadge } from './cart-ui';
import { AuthNav } from './auth-nav';
import { Analytics } from './analytics';
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/lib/site';

// Self-hosted: next/font downloads Inter at build time and serves it from this
// site (no request to Google from the browser). `display: swap` shows text
// at once, and next/font adds a size-adjusted fallback so the swap doesn't move
// the layout (CLS).
const inter = Inter({ subsets: ['latin'], display: 'swap' });

// metadataBase turns every relative URL in metadata (canonical, og:image) into
// an absolute one. Pages set only their own title; the template adds the site name.
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — ${SITE_TAGLINE}`, template: `%s | ${SITE_NAME}` },
  description: 'Order Ethiopian food online: doro wat, kitfo, shiro, injera and more, delivered to your door.',
  applicationName: SITE_NAME,
  openGraph: { siteName: SITE_NAME, type: 'website', locale: 'en_US' },
  twitter: { card: 'summary_large_image' },
};

// Root layout: the only place that owns <html> and <body>.
// Header and footer live here so they are shared by every route.
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Providers>
        <header className="site-header">
          <Link href="/" className="brand">Addis Eats</Link>
          <nav>
            <Link href="/menu">Menu</Link>
            <Link href="/cart">Cart <CartBadge /></Link>
            <Link href="/checkout">Checkout</Link>
            <Link href="/orders">Orders</Link>
            <AuthNav />
          </nav>
        </header>
        <main className="site-main">{children}</main>
        <footer className="site-footer">© Addis Eats — Ethiopian food, delivered.</footer>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
