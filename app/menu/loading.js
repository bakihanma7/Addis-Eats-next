// Shown inside the menu layout (sidebar stays put) while a menu segment loads.
export default function Loading() {
  return (
    <div>
      <h1>Menu</h1>
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
    </div>
  );
}
