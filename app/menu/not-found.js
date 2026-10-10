import Link from 'next/link';

export default function MenuNotFound() {
  return (
    <div>
      <h1>Not found</h1>
      <p>We couldn&apos;t find that on our menu.</p>
      <Link href="/menu">Back to menu</Link>
    </div>
  );
}
