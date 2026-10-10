import { PRIVATE_PATHS } from '@/lib/seo';
import { absoluteUrl } from '@/lib/site';

// Crawlers may read the public site; the private routes are excluded.
// (Those pages also send noindex: robots.txt alone only stops crawling, and a
// blocked URL can still be listed if another site links to it.)
export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: PRIVATE_PATHS },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
