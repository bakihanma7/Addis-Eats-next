import Image from 'next/image';
import { getDish } from '@/lib/dishes';

// Four dish photos under the home page headline: kitfo, doro wat, shiro, buna.
// Each sits in a 3:4 box (CSS aspect-ratio reserves the space, so nothing shifts
// while it loads) and the photo is cropped to fill it. The first image is the
// biggest one visible without scrolling, so it is the only `priority` one.
// On wide screens the boxes alternate size and share a bottom edge; on phones the
// strip scrolls sideways.
const STRIP = ['2', '1', '3', '6'];

export default function HeroStrip() {
  return (
    <div className="strip">
      {STRIP.map((id, i) => {
        const dish = getDish(id);
        return (
          <figure className="strip-photo" key={id}>
            <Image src={dish.image} alt={dish.alt} fill sizes="(max-width: 720px) 56vw, 25vw" priority={i === 0} />
          </figure>
        );
      })}
    </div>
  );
}
