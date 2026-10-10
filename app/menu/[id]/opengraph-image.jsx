import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getDish } from '@/lib/dishes';
import { SITE_NAME } from '@/lib/site';

// One preview image per dish (1200x630), drawn from the same dish object the
// page renders. Pre-rendered at build for every id in generateStaticParams.
export const alt = `A dish on the ${SITE_NAME} menu`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }) {
  const { id } = await params;
  const dish = getDish(id);
  if (!dish) return new Response('Not found', { status: 404 });

  // The renderer can't fetch a relative URL, so the photo is inlined as a data URI.
  const photo = await readFile(path.join(process.cwd(), 'public', dish.image));
  const src = `data:image/jpeg;base64,${photo.toString('base64')}`;

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: '#0b6b3a', color: '#ffffff', padding: 60 }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, paddingRight: 40 }}>
          <div style={{ display: 'flex', fontSize: 36, fontWeight: 700 }}>{SITE_NAME}</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 88, fontWeight: 700 }}>{dish.name}</div>
            <div style={{ display: 'flex', fontSize: 52, marginTop: 12, color: '#ffd66b' }}>{`$${dish.price}`}</div>
          </div>
          <div style={{ display: 'flex', fontSize: 28 }}>{dish.description}</div>
        </div>
        <img src={src} width={560} height={420} alt="" style={{ alignSelf: 'center', borderRadius: 24 }} />
      </div>
    ),
    { ...size },
  );
}
