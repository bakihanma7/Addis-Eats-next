// The one place that knows the site's public address. Everything that must be
// an absolute URL (metadataBase, canonical links, og:image, JSON-LD, sitemap,
// robots) is built from here, so a wrong value is wrong everywhere and easy to spot.
//
// Set SITE_URL in production (e.g. https://addis-eats.example.com). On Vercel the
// production domain is picked up automatically. The localhost fallback is for
// development only; scripts/check-seo.mjs fails if it shows up on a deployed site.
export const SITE_NAME = 'Addis Eats';
export const SITE_TAGLINE = 'Ethiopian food, delivered.';

function resolveSiteUrl() {
  const raw =
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
    'http://localhost:3000';
  return raw.replace(/\/+$/, '');
}

export const SITE_URL = resolveSiteUrl();

// absoluteUrl('/menu/1') -> 'https://addis-eats.example.com/menu/1'
export const absoluteUrl = (path = '/') => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
