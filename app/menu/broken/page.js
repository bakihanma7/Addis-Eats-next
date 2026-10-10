import { NO_INDEX } from '@/lib/seo';

export const metadata = { title: 'Error demo', robots: NO_INDEX };

// Test-only route to prove menu/error.js works. Forced dynamic so the throw
// happens per request instead of failing the build.
export const dynamic = 'force-dynamic';

export default function Broken() {
  throw new Error('Menu failed to load (forced for testing).');
}
