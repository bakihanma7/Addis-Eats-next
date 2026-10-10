import CategorySidebar from './CategorySidebar';

// Nested layout for everything under /menu.
// Layouts do not re-render or remount when you navigate between their child
// routes, so this sidebar persists from /menu to /menu/category/mains to /menu/3.
export default function MenuLayout({ children }) {
  return (
    <div className="menu-layout">
      <CategorySidebar />
      <section>{children}</section>
    </div>
  );
}
