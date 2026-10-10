import { notFound } from 'next/navigation';
import { dishes, getDish } from '@/lib/dishes';
import { AddToCartButton } from '../../cart-ui';
import { DishPhoto } from '../DishCard';
import { JsonLd } from '../../json-ld';
import { dishJsonLd, dishMetadata } from '@/lib/seo';

// Pre-render one page per dish at build time. Ids not listed here are still
// rendered on demand (dynamicParams defaults to true) and hit notFound().
export function generateStaticParams() {
  return dishes.map((d) => ({ id: d.id }));
}

// Title, description, canonical and social tags come from the dish itself.
export async function generateMetadata({ params }) {
  const { id } = await params;
  const dish = getDish(id);
  if (!dish) return { title: 'Dish not found', robots: { index: false } };
  return dishMetadata(dish);
}

export default async function DishPage({ params }) {
  const { id } = await params;
  const dish = getDish(id);

  if (!dish) notFound();

  return (
    <div>
      {/* Structured data from the same `dish` object rendered below. */}
      <JsonLd data={dishJsonLd(dish)} />
      <p>Dish id: {id}</p>
      <h1>{dish.name}</h1>
      {/* The one largest above-the-fold image on this page, so the only priority one. */}
      <DishPhoto dish={dish} variant="hero" priority />
      <p>{dish.description}</p>
      <p><strong>${dish.price}</strong></p>
      <AddToCartButton id={id} />
    </div>
  );
}
