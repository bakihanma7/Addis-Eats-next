import { ImageResponse } from 'next/og';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site';

// Site-wide preview image (1200x630). Any route without its own
// opengraph-image (the dish pages have one) uses this.
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', height: '100%', background: '#0b6b3a', color: '#ffffff', padding: 80 }}>
        <div style={{ display: 'flex', fontSize: 120, fontWeight: 700 }}>{SITE_NAME}</div>
        <div style={{ display: 'flex', fontSize: 56, marginTop: 16, color: '#ffd66b' }}>{SITE_TAGLINE}</div>
      </div>
    ),
    { ...size },
  );
}
