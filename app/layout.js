import Link from 'next/link';
import { Inter, Newsreader } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { HeaderNav } from './header-nav';
import { Analytics } from './analytics';
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/lib/site';

// Self-hosted: next/font downloads both fonts at build time and serves them from
// this site (no request to Google from the browser). `display: swap` shows text
// at once, and next/font adds a size-adjusted fallback so the swap doesn't move
// the layout (CLS). Newsreader is the serif voice of the "printed menu" design;
// Inter is only used for the small tracked-out capitals (nav, labels, buttons).
// Each font is exposed as a CSS variable that globals.css reads.
const serif = Newsreader({ subsets: ['latin'], style: ['normal', 'italic'], display: 'swap', variable: '--font-serif' });
const sans = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-sans' });

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
// Header layout: Menu / Orders on the left, brand in the middle, account + cart on the right.
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <Providers>
          <a href="#main" className="skip-link">Skip to content</a>
          <header className="site-header">
            <div className="header-inner">
              <Link href="/" className="brand">Addis Eats</Link>
              <HeaderNav />
            </div>
          </header>
          <main id="main" className="site-main">{children}</main>
          <footer className="site-footer">
            <div className="footer-inner">
              <span>© Addis Eats</span>
              <span>Ethiopian food, delivered.</span>
            </div>
          </footer>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
