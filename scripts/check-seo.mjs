// Reads the HTML a crawler would see and checks the SEO tags.
//   BASE=https://your-deployed-site npm run check:seo
//   (defaults to http://localhost:3000 for a local `npm run build && npm start`)
// Exits non-zero on the first failing group. Checks, per page: <title>, description,
// absolute canonical, og:/twitter: tags with an absolute, reachable og:image,
// and (dish pages) JSON-LD that parses and matches the visible page.
import { dishes, categories } from '../lib/dishes.js';

const BASE = (process.env.BASE ?? 'http://localhost:3000').replace(/\/+$/, '');
const deployed = !/^https?:\/\/(localhost|127\.0\.0\.1)/.test(BASE);
let failed = 0;
const ok = (name) => console.log(`PASS ${name}`);
const bad = (name, why) => { failed++; console.log(`FAIL ${name}: ${why}`); };
const check = (name, cond, why) => (cond ? ok(name) : bad(name, why));

const get = async (path) => {
  const res = await fetch(BASE + path, { redirect: 'follow' });
  return { res, text: await res.text() };
};
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const meta = (html, attr, key) => {
  for (const tag of html.match(/<meta\b[^>]*>/g) ?? []) {
    if (new RegExp(`${attr}="${key}"`).test(tag)) return decode(/content="([^"]*)"/.exec(tag)?.[1] ?? '');
  }
  return null;
};
const link = (html, rel) => {
  for (const tag of html.match(/<link\b[^>]*>/g) ?? []) {
    if (new RegExp(`rel="${rel}"`).test(tag)) return decode(/href="([^"]*)"/.exec(tag)?.[1] ?? '');
  }
  return null;
};
const title = (html) => decode(/<title[^>]*>([^<]*)<\/title>/.exec(html)?.[1] ?? '');
const isAbs = (u) => typeof u === 'string' && /^https?:\/\//.test(u);

async function checkPublicPage(path, { jsonLdDish } = {}) {
  const { res, text: html } = await get(path);
  const n = (s) => `${path} ${s}`;
  check(n('returns 200'), res.status === 200, `status ${res.status}`);
  const t = title(html);
  check(n('title'), t.length > 0 && t.length <= 70, `"${t}"`);
  const d = meta(html, 'name', 'description');
  check(n('description'), !!d && d.length >= 50 && d.length <= 200, `"${d}"`);
  const canon = link(html, 'canonical');
  check(n('canonical is absolute and points at this page'), isAbs(canon) && new URL(canon).pathname === path, `got ${canon}`);
  check(n('og:title/description/url'), !!meta(html, 'property', 'og:title') && !!meta(html, 'property', 'og:description') && isAbs(meta(html, 'property', 'og:url')), 'missing');
  check(n('twitter:card'), meta(html, 'name', 'twitter:card') === 'summary_large_image', `got ${meta(html, 'name', 'twitter:card')}`);
  const img = meta(html, 'property', 'og:image');
  check(n('og:image is absolute'), isAbs(img), `got ${img}`);
  if (isAbs(img)) {
    const r = await fetch(img);
    check(n('og:image loads as an image'), r.status === 200 && /^image\//.test(r.headers.get('content-type') ?? ''), `${r.status} ${r.headers.get('content-type')}`);
  }
  check(n('og:image size 1200x630'), meta(html, 'property', 'og:image:width') === '1200' && meta(html, 'property', 'og:image:height') === '630', 'missing/different');
  if (deployed) check(n('no localhost in the page source'), !/localhost/.test(html), 'found "localhost"; set SITE_URL');

  if (jsonLdDish) {
    const raw = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1];
    let data = null;
    try { data = JSON.parse(raw); } catch {}
    check(n('JSON-LD parses'), !!data, 'no valid JSON-LD');
    if (data) {
      const dish = jsonLdDish;
      check(n('JSON-LD is a MenuItem for this dish'), data['@type'] === 'MenuItem' && data.name === dish.name && data.description === dish.description, JSON.stringify(data).slice(0, 120));
      check(n('JSON-LD price matches the page'), data.offers?.price === dish.price.toFixed(2) && data.offers?.priceCurrency === 'USD' && html.includes(`$${dish.price}`), `offer ${JSON.stringify(data.offers)}`);
      check(n('JSON-LD url and image are absolute'), isAbs(data.url) && isAbs(data.image), `${data.url} ${data.image}`);
      check(n('page shows the dish name in its <h1>'), new RegExp(`<h1[^>]*>${dish.name}</h1>`).test(html), 'h1 missing');
    }
  }
}

// 1. Public pages
await checkPublicPage('/');
await checkPublicPage('/menu');
for (const c of categories) await checkPublicPage(`/menu/category/${c.slug}`);
for (const d of dishes) await checkPublicPage(`/menu/${d.id}`, { jsonLdDish: d });

// 2. Private pages must say noindex (signed-out requests to /checkout and /orders redirect to /signin).
for (const path of ['/cart', '/checkout', '/signin']) {
  const { text: html } = await get(path);
  check(`${path} is noindex`, /noindex/.test(meta(html, 'name', 'robots') ?? ''), `robots meta: ${meta(html, 'name', 'robots')}`);
}

// 3. robots.txt
const robots = (await get('/robots.txt')).text;
for (const p of ['/cart', '/checkout', '/orders', '/kitchen', '/signin', '/api/']) {
  check(`robots.txt disallows ${p}`, new RegExp(`^Disallow: ${p}\\s*$`, 'm').test(robots), 'missing');
}
check('robots.txt has an absolute Sitemap line', /^Sitemap: https?:\/\/\S+\/sitemap\.xml$/m.test(robots), robots);

// 4. sitemap.xml
const sitemap = (await get('/sitemap.xml')).text;
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]));
check('sitemap URLs are all absolute', locs.length > 0 && locs.every(isAbs), locs.filter((u) => !isAbs(u)).join(', '));
check('sitemap lists every dish', dishes.every((d) => locs.some((u) => u.endsWith(`/menu/${d.id}`))), 'a dish is missing');
check('sitemap lists every category', categories.every((c) => locs.some((u) => u.endsWith(`/menu/category/${c.slug}`))), 'a category is missing');
check('sitemap has no private routes', !locs.some((u) => /\/(cart|checkout|orders|kitchen|signin|api)(\/|$)/.test(new URL(u).pathname)), 'private route listed');
if (deployed) check('sitemap has no localhost', !locs.some((u) => /localhost/.test(u)), 'found localhost');

console.log(failed ? `\n${failed} check(s) failed` : '\nAll SEO checks passed');
process.exit(failed ? 1 : 0);
