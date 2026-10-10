import { notFound } from 'next/navigation';
import Link from 'next/link';
import { categories, dishes, getDish } from '@/lib/dishes';
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

  const category = categories.find((c) => c.label === dish.category);

  return (
    <article>
      {/* Structured data from the same `dish` object rendered below. */}
      <JsonLd data={dishJsonLd(dish)} />
      <header className="page-head">
        <p className="eyebrow">
          {category ? <Link href={`/menu/category/${category.slug}`}>{dish.category}</Link> : dish.category}
        </p>
        <h1>{dish.name}</h1>
      </header>
      {/* The one largest above-the-fold image on this page, so the only priority one. */}
      <DishPhoto dish={dish} variant="hero" priority />
      <div className="dish-detail-body">
        <p className="dish-detail-desc">{dish.description}</p>
        <p className="dish-detail-price">{`$${dish.price}`}</p>
        <AddToCartButton id={id} name={dish.name} size="lg" />
      </div>
      <p className="back-link center"><Link href="/menu">← Back to the menu</Link></p>
    </article>
  );
}
