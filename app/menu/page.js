import { Suspense } from 'react';
import DishList from './DishList';
import DishListSkeleton from './DishListSkeleton';
import FilterShell from './FilterShell';
import SearchBox from './SearchBox';

export const metadata = {
  title: 'Menu',
  description: 'The full Addis Eats menu: mains like doro wat and kitfo, sides, and Ethiopian coffee and honey wine. Search by dish and order online.',
  alternates: { canonical: '/menu' },
};

// Server component, no hooks. Static with ISR: refreshed at most once a minute.
export const revalidate = 60;

export default function MenuPage() {
  return (
    <>
      <header className="page-head">
        <p className="eyebrow">Ethiopian food, delivered</p>
        <h1>Menu</h1>
        <p className="lede">A short menu of stews, sides and drinks. Everything served with injera.</p>
      </header>
      <SearchBox>
        <FilterShell>
          <Suspense fallback={<DishListSkeleton />}>
            <DishList />
          </Suspense>
        </FilterShell>
      </SearchBox>
    </>
  );
}
