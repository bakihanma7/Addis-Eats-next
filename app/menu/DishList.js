import { categories, fetchDishes } from '@/lib/dishes';
import { AddToCartButton } from '../cart-ui';
import DishCard from './DishCard';

// Async server component: awaits its own data and ships no JS to the browser
// (apart from the small ADD button leaf on each row).
// Dishes are grouped under their category like the sections of a printed menu.
// On a single-category page the h1 already names the section, so the heading is dropped.
// `prioritizeFirst` gives the first photo `priority`; the home page turns it off
// because its hero photo is the above-the-fold image there.
export default async function DishList({ categoryLabel, prioritizeFirst = true }) {
  const dishes = await fetchDishes(categoryLabel);
  const groups = categories
    .map((c) => ({ ...c, dishes: dishes.filter((d) => d.category === c.label) }))
    .filter((g) => g.dishes.length > 0);
  const firstId = dishes[0]?.id;

  return (
    <div className="menu">
      {groups.map((g) => (
        <section
          key={g.slug}
          className={categoryLabel ? 'menu-section menu-section--bare' : 'menu-section'}
          aria-labelledby={categoryLabel ? undefined : `menu-${g.slug}`}
        >
          {!categoryLabel && (
            <div className="menu-section-head">
              <h2 id={`menu-${g.slug}`}>{g.label}</h2>
              <span className="menu-count">{g.dishes.length} {g.dishes.length === 1 ? 'dish' : 'dishes'}</span>
            </div>
          )}
          <ul className="menu-list">
            {g.dishes.map((d) => (
              <DishCard key={d.id} dish={d} tier={d.price < 10 ? 'budget' : 'regular'} priority={prioritizeFirst && d.id === firstId}>
                <AddToCartButton id={d.id} name={d.name} />
              </DishCard>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
