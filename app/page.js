import { Suspense } from 'react';
import DishList from './menu/DishList';
import DishListSkeleton from './menu/DishListSkeleton';
import HeroStrip from './hero-strip';

export const metadata = {
  title: { absolute: 'Addis Eats — Ethiopian food, delivered' },
  description: 'Hungry for doro wat, kitfo or shiro? Browse the Addis Eats menu and have fresh Ethiopian food brought to your door.',
  alternates: { canonical: '/' },
};

// The home page shows the whole short menu, so it refreshes like /menu does.
export const revalidate = 60;

// Headline and photos render at once; the menu streams in behind a skeleton.
// The hero strip owns the page's priority image, so the list doesn't ask for one.
export default function HomePage() {
  return (
    <>
      <section className="hero">
        <p className="eyebrow">Ethiopian food, delivered</p>
        <h1>Simple food, <em>slowly</em> made, brought to your door.</h1>
        <p className="lede">A short menu of stews, sides and drinks. Everything served with injera.</p>
      </section>
      <HeroStrip />
      <section className="page" aria-label="Menu">
        <Suspense fallback={<DishListSkeleton />}>
          <DishList prioritizeFirst={false} />
        </Suspense>
      </section>
    </>
  );
}
