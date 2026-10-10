// Run with: npm run test:auth
import test from 'node:test';
import assert from 'node:assert/strict';
import { safeNext } from '../lib/safe-next.js';

const ok = ['/orders', '/orders/abc-123', '/checkout?x=1', '/menu/category/mains', '/'];
const bad = [
  'https://evil.com', 'http://evil.com/orders', '//evil.com', '///evil.com', '/\\evil.com', '\\\\evil.com',
  '/\t/evil.com', '/\n/evil.com', '/\r/evil.com', 'evil.com', 'orders', 'javascript:alert(1)',
  '', null, undefined, 42, ['/orders'], '/signin', '/signin?next=/orders',
];

for (const v of ok) test(`allows ${JSON.stringify(v)}`, () => assert.equal(safeNext(v), v));
for (const v of bad) test(`rejects ${JSON.stringify(v)}`, () => assert.equal(safeNext(v), '/'));
test('uses a custom fallback', () => assert.equal(safeNext('//evil.com', '/orders'), '/orders'));
