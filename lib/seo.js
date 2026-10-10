// Metadata and JSON-LD built from the same dish / category objects the pages
// render, so the tags can never describe something different from the page.
// Pure functions (no Next imports) so they are easy to test.
import { SITE_NAME, absoluteUrl } from '@/lib/site';

// Note: a page's `openGraph` / `twitter` objects REPLACE the layout's (they are
// not merged), so each one repeats siteName and card type.
function pageMeta({ title, description, path }) {
  const ogTitle = `${title} | ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: ogTitle, description, url: path, siteName: SITE_NAME, type: 'website', locale: 'en_US' },
    twitter: { card: 'summary_large_image', title: ogTitle, description },
  };
}

export function dishMetadata(dish) {
  return pageMeta({
    title: `${dish.name} — $${dish.price}`,
    description: `${dish.description} $${dish.price}. Order ${dish.name} for delivery from ${SITE_NAME}.`,
    path: `/menu/${dish.id}`,
  });
}

export function categoryMetadata(category, categoryDishes) {
  const names = categoryDishes.map((d) => d.name).join(', ');
  return pageMeta({
    title: `${category.label} menu`,
    description: `${category.label} at ${SITE_NAME}: ${names}. Order Ethiopian ${category.label.toLowerCase()} for delivery.`,
    path: `/menu/category/${category.slug}`,
  });
}

// schema.org MenuItem for a dish page. Name, description and price are the
// values the page shows; prices on the site are US dollars.
export function dishJsonLd(dish) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MenuItem',
    name: dish.name,
    description: dish.description,
    url: absoluteUrl(`/menu/${dish.id}`),
    image: absoluteUrl(dish.image),
    offers: {
      '@type': 'Offer',
      price: dish.price.toFixed(2),
      priceCurrency: 'USD',
      url: absoluteUrl(`/menu/${dish.id}`),
    },
  };
}

// Keeps all private routes in one list, shared by robots.js and the page metadata.
export const PRIVATE_PATHS = ['/cart', '/checkout', '/orders', '/kitchen', '/signin', '/api/', '/menu/broken'];
export const NO_INDEX = { index: false, follow: false };
