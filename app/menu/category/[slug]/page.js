import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { categories, dishes } from '@/lib/dishes';
import { categoryMetadata } from '@/lib/seo';
import DishList from '../../DishList';
import DishListSkeleton from '../../DishListSkeleton';
import FilterShell from '../../FilterShell';

export const revalidate = 60;

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  if (!category) return { title: 'Category not found', robots: { index: false } };
  return categoryMetadata(category, dishes.filter((d) => d.category === category.label));
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  return (
    <>
      <header className="page-head">
        <p className="eyebrow">From the menu</p>
        <h1>{category.label}</h1>
      </header>
      <FilterShell>
        <Suspense fallback={<DishListSkeleton />}>
          <DishList categoryLabel={category.label} />
        </Suspense>
      </FilterShell>
    </>
  );
}
