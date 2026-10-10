import Link from 'next/link';

export const metadata = {
  title: { absolute: 'Addis Eats — Ethiopian food, delivered' },
  description: 'Hungry for doro wat, kitfo or shiro? Browse the Addis Eats menu and have fresh Ethiopian food brought to your door.',
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return (
    <div>
      <h1>Addis Eats</h1>
      <p>Ethiopian food, delivered.</p>
      <Link href="/menu">See the menu →</Link>
    </div>
  );
}
