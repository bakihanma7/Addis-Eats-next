import { categories } from '@/lib/dishes';
import CategoryLink from './CategoryLink';

// Server component: the list and the category data stay out of the client bundle.
// A quiet row of links under the site header, like the section index of a printed menu.
export default function CategoryNav() {
  const links = [{ href: '/menu', label: 'All' }, ...categories.map((c) => ({ href: `/menu/category/${c.slug}`, label: c.label }))];

  return (
    <nav className="category-nav" aria-label="Menu categories">
      <ul>
        {links.map((l) => (
          <li key={l.href}>
            <CategoryLink href={l.href}>{l.label}</CategoryLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
