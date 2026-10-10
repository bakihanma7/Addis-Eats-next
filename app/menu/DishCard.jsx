import Image from 'next/image';
import Link from 'next/link';
import { IMAGE_WIDTH, IMAGE_HEIGHT } from '@/lib/dishes';

// One dish row: photo, name, price and an optional slot for a button.
// No "use client": it has no hooks, so the server-rendered DishList and the
// client SearchBox can both use it.
//
// Image rules:
//  - width/height are the file's real size, so the browser reserves the space
//    before the image loads (no layout shift, CLS stays 0).
//  - `sizes` matches the CSS: the thumbnail is shown 120px wide at every
//    viewport, so next/image only offers 128w/256w, not the full 800px file.
//    On the dish page the photo is min(100% of the column, 640px).
//  - `priority` preloads the image and turns off lazy loading. Give it to at
//    most one image per page: the biggest one visible without scrolling.
//  - `alt` says what the photo shows (it is in lib/dishes.js next to the data).
export function DishPhoto({ dish, variant = 'thumb', priority = false }) {
  const hero = variant === 'hero';
  return (
    <Image
      src={dish.image}
      alt={dish.alt}
      width={IMAGE_WIDTH}
      height={IMAGE_HEIGHT}
      sizes={hero ? '(max-width: 688px) calc(100vw - 48px), 640px' : '120px'}
      priority={priority}
      className={hero ? 'dish-hero' : 'dish-thumb'}
    />
  );
}

export default function DishCard({ dish, tier, priority = false, children }) {
  return (
    <li className="dish-card" data-tier={tier}>
      <DishPhoto dish={dish} priority={priority} />
      <div>
        <Link href={`/menu/${dish.id}`}>{dish.name}</Link> — ${dish.price}
        {children && <div className="dish-actions">{children}</div>}
      </div>
    </li>
  );
}
