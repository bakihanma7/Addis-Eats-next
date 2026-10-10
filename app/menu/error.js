'use client';

export default function MenuError({ error, reset }) {
  return (
    <div className="empty">
      <h1>Something went wrong</h1>
      <p>{error.message}</p>
      <button type="button" className="btn" onClick={() => reset()}>Try again</button>
    </div>
  );
}
