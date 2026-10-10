import { categories, dishes } from '@/lib/dishes';
import { absoluteUrl } from '@/lib/site';

// Built from the real data, so adding a dish or category adds it here. Private
// routes (cart, checkout, orders, kitchen, sign-in) are left out on purpose.
// No lastModified: the data has no modified dates and a made-up one is worse than none.
export default function sitemap() {
  return [
    { url: absoluteUrl('/'), priority: 1 },
    { url: absoluteUrl('/menu'), priority: 0.9 },
    ...categories.map((c) => ({ url: absoluteUrl(`/menu/category/${c.slug}`), priority: 0.7 })),
    ...dishes.map((d) => ({ url: absoluteUrl(`/menu/${d.id}`), priority: 0.8, images: [absoluteUrl(d.image)] })),
  ];
}
