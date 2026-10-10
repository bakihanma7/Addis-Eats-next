import Link from 'next/link';

export default function MenuNotFound() {
  return (
    <div className="empty">
      <h1>Not found</h1>
      <p>We couldn&apos;t find that on our menu.</p>
      <Link href="/menu" className="btn">Back to menu</Link>
    </div>
  );
}
