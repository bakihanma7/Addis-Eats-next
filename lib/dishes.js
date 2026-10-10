export const categories = [
  { slug: 'mains', label: 'Mains' },
  { slug: 'sides', label: 'Sides' },
  { slug: 'drinks', label: 'Drinks' },
];

// Every dish photo is a real file of exactly this size in public/dishes/.
// next/image needs the true width and height to reserve space (no layout shift).
export const IMAGE_WIDTH = 800;
export const IMAGE_HEIGHT = 600;

export const dishes = [
  { id: '1', name: 'Doro Wat', category: 'Mains', price: 14, description: 'Spicy chicken stew with a boiled egg, served with injera.', image: '/dishes/images-doro-wot.jpg', alt: 'Doro Wat: a bowl of dark red chicken stew with a halved boiled egg, on injera' },
  { id: '2', name: 'Kitfo', category: 'Mains', price: 16, description: 'Minced beef seasoned with mitmita and niter kibbeh.', image: '/dishes/images-kitfo.jpg', alt: 'Kitfo: seasoned minced beef with a small mound of cheese, on injera' },
  { id: '3', name: 'Shiro', category: 'Mains', price: 11, description: 'Silky chickpea stew, a fasting-day favorite.', image: '/dishes/images-shiro.jpg', alt: 'Shiro: golden chickpea stew served on injera' },
  { id: '4', name: 'Gomen', category: 'Sides', price: 6, description: 'Collard greens simmered with garlic and ginger.', image: '/dishes/images-gomen.jpg', alt: 'Gomen: chopped collard greens on injera' },
  { id: '5', name: 'Ayib', category: 'Sides', price: 4, description: 'Fresh cottage cheese to cool the spice.', image: '/dishes/images-ayib.jpg', alt: 'Ayib: a scoop of fresh white cottage cheese on injera' },
  { id: '6', name: 'Buna', category: 'Drinks', price: 3, description: 'Traditional Ethiopian coffee.', image: '/dishes/images-buna.jpg', alt: 'Buna: a cup of Ethiopian coffee with a handle' },
  { id: '7', name: 'Tej', category: 'Drinks', price: 7, description: 'Honey wine, lightly sweet.', image: '/dishes/images-tej.jpg', alt: 'Tej: a tall glass of golden honey wine' },
];

export function getDish(id) {
  return dishes.find((d) => d.id === id);
}

// Stand-in for a real data source: slow on purpose so streaming is visible.
export async function fetchDishes(categoryLabel) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return categoryLabel ? dishes.filter((d) => d.category === categoryLabel) : dishes;
}

// Search + paging over the dish list. A page past the end returns an empty list.
export function searchDishes({ q = '', page = 1, pageSize = 20 } = {}) {
  const term = q.trim().toLowerCase();
  const matches = term
    ? dishes.filter((d) =>
        [d.name, d.description, d.category].some((field) => field.toLowerCase().includes(term)))
    : dishes;
  const start = (page - 1) * pageSize;
  return {
    dishes: matches.slice(start, start + pageSize),
    page,
    pageSize,
    total: matches.length,
    totalPages: Math.max(1, Math.ceil(matches.length / pageSize)),
  };
}
