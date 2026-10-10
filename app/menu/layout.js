import CategoryNav from './CategoryNav';

// Nested layout for everything under /menu.
// Layouts do not re-render or remount when you navigate between their child
// routes, so this category row persists from /menu to /menu/category/mains to /menu/3.
export default function MenuLayout({ children }) {
  return (
    <>
      <CategoryNav />
      <div className="page">{children}</div>
    </>
  );
}
