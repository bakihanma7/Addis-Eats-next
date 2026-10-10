import { fetchDishes } from '@/lib/dishes';
import DishCard from './DishCard';

// Async server component: awaits its own data and ships no JS to the browser.
// Only the first photo gets `priority` (the one image certainly above the fold).
export default async function DishList({ categoryLabel }) {
  const dishes = await fetchDishes(categoryLabel);

  return (
    <ul>
      {dishes.map((d, i) => (
        <DishCard key={d.id} dish={d} tier={d.price < 10 ? 'budget' : 'regular'} priority={i === 0} />
      ))}
    </ul>
  );
}
