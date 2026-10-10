// Shown inside the menu layout (the category row stays put) while a menu segment loads.
export default function Loading() {
  return (
    <div aria-busy="true">
      <header className="page-head">
        <h1>Menu</h1>
      </header>
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
    </div>
  );
}
