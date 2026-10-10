import { categories } from '@/lib/dishes';
import SidebarLink from './SidebarLink';

// Server component: the list and the category data stay out of the client bundle.
export default function CategorySidebar() {
  const links = [{ href: '/menu', label: 'All' }, ...categories.map((c) => ({ href: `/menu/category/${c.slug}`, label: c.label }))];

  return (
    <aside className="sidebar">
      <h2>Categories</h2>
      <ul>
        {links.map((l) => (
          <li key={l.href}>
            <SidebarLink href={l.href}>{l.label}</SidebarLink>
          </li>
        ))}
      </ul>
    </aside>
  );
}
