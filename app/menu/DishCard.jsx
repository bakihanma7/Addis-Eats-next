import Image from 'next/image';
import Link from 'next/link';

// One printed-menu row: number, name with a dotted leader, description, photo,
// price and an optional slot (the ADD button) under the price.
// No "use client": it has no hooks, so the server-rendered DishList and the
// client SearchBox can both use it.
//
// Image rules:
//  - The photo fills a CSS box with a fixed aspect ratio (4:3 thumbnail, 4:3 hero),
//    so the browser reserves the space before the image loads (CLS stays 0) and
//    photos of any real size are cropped to fit instead of stretched.
//  - `sizes` matches the CSS: the thumbnail box is 112px wide (80px on phones),
//    so next/image only offers small files. The dish-page photo is as wide as the
//    column, at most 880px.
//  - `priority` preloads the image and turns off lazy loading. Give it to at
//    most one image per page: the biggest one visible without scrolling.
//  - `alt` says what the photo shows (it is in lib/dishes.js next to the data).
export function DishPhoto({ dish, variant = 'thumb', priority = false }) {
  const hero = variant === 'hero';
  return (
    <span className={hero ? 'dish-hero' : 'dish-thumb'}>
      <Image
        src={dish.image}
        alt={dish.alt}
        fill
        sizes={hero ? '(max-width: 880px) 100vw, 880px' : '112px'}
        priority={priority}
      />
    </span>
  );
}

export default function DishCard({ dish, tier, priority = false, children }) {
  return (
    <li className="dish-row" data-tier={tier}>
      <span className="dish-num" aria-hidden="true">{dish.id.padStart(2, '0')}</span>
      <div className="dish-main">
        <div className="dish-title">
          <Link href={`/menu/${dish.id}`} className="dish-name">{dish.name}</Link>
          <span className="dish-leader" aria-hidden="true" />
        </div>
        <p className="dish-desc">{dish.description}</p>
      </div>
      <DishPhoto dish={dish} priority={priority} />
      <div className="dish-buy">
        <span className="dish-price">{`$${dish.price}`}</span>
        {children}
      </div>
    </li>
  );
}
