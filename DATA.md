# Authentication

Sign-in and sign-out, a signed session cookie, middleware, per-write ownership
checks and one staff-only route. Users are an in-memory stand-in
(`lib/users.js`, passwords hashed with scrypt); swap it for a database table.

## Demo accounts

| Email | Password | Role |
|---|---|---|
| abel@example.com | abel-password | customer |
| selam@example.com | selam-password | customer |
| kitchen@addis-eats.test | kitchen-password | staff |

## The session

`lib/session.js` sets one cookie, `session = "<userId>.<hmac>"`:

- `httpOnly`: JavaScript (and so XSS) can't read it.
- `secure`: HTTPS only. On in production; off in `npm run dev` so plain-http localhost works.
- `sameSite: 'lax'`: not sent on cross-site POSTs.
- Signed with `SESSION_SECRET` (required in production), so a visitor can't invent a userId.

The cookie holds only the user id. Name and **role are looked up on the server
on every request** (`getSession()` returns `{ userId, name, email, role }`), so
a role can't be forged by editing a cookie.

`getSession()` is the one helper used by pages, server actions and route handlers.

## Layers

| Layer | Where | What it proves |
|---|---|---|
| 1. Middleware | `middleware.js` (matcher: `/checkout`, `/orders`, `/orders/*` only) | Only that a `session` cookie **exists**. Redirects to `/signin?next=…`. It can't check the signature (Edge runtime has no `node:crypto`), so it is a convenience, never the proof. |
| 2. `getSession()` | every page, action and handler | The cookie's HMAC is valid **and** the user still exists. This is what proves who the caller is. |
| 3. Ownership | `lib/orders.js` | The order belongs to `session.userId`. Reads and writes are scoped by user id, next to the data. |
| 4. Role | `/kitchen`, `/api/kitchen/orders` | `session.role === 'staff'`, checked on the server from the user store. |

## Protected surfaces

| Surface | Layers | Signed out | Wrong user |
|---|---|---|---|
| `/checkout` | 1, 2 (action) | redirect to `/signin?next=/checkout` | n/a |
| `placeOrder` (server action) | 2 | returns `unauthenticated`, nothing written | n/a |
| `POST /api/orders` | 2 | 401 | n/a (order is created for the session's own id) |
| `/orders` | 1, 2, 3 | redirect to sign-in | only lists the session's own orders |
| `/orders/[id]` | 1, 2, 3 | redirect to sign-in | 404 (same as a missing order) |
| `GET /api/orders/[id]` | 2, 3 | 401 | 404 |
| `cancelOrder` (server action) | 2, 3 | error, nothing written | "Order not found" |
| `/kitchen` | 2, 4 | redirect to sign-in | customer gets 404 |
| `GET /api/kitchen/orders` | 2, 4 | 401 | customer gets 403 |

Why actions and handlers repeat the check: middleware's matcher doesn't cover
them (server actions are POSTs to the page URL, and `/api` is deliberately
outside the matcher), and anyone can call them directly without the UI.

## Redirect after sign-in (`next`)

`/signin?next=/orders/abc` returns the visitor to `/orders/abc` after sign-in.
`lib/safe-next.js` accepts only values that start with a single `/`, and
rejects `https://evil.com`, `//evil.com`, `/\evil.com`, values containing tabs,
newlines or backslashes (browsers normalise these into `//evil.com`), and
`/signin` itself. Anything rejected becomes `/`. It is applied twice: when the
sign-in page renders the hidden field and again in the `signIn` action, because
the field is as editable as the URL. Tests: `npm run test:auth`.

## Try to break it

Start the app (`npm run build && npm start`), then `npm run check:api` runs
these checks, or by hand:

```
# Signed out: write is refused
curl -i -X POST localhost:3000/api/orders -H 'content-type: application/json' -d '{}'      # 401

# Signed in as Abel, create an order; Selam can't see it
curl -c abel.jar -X POST localhost:3000/api/session -H 'content-type: application/json' \
  -d '{"email":"abel@example.com","password":"abel-password"}'
curl -c selam.jar -X POST localhost:3000/api/session -H 'content-type: application/json' \
  -d '{"email":"selam@example.com","password":"selam-password"}'
curl -i -b selam.jar localhost:3000/api/orders/<abels-order-id>                              # 404

# Forged cookie gets past middleware (a cookie exists) but not getSession()
curl -i -b 'session=u_abel.forged' localhost:3000/api/orders/<id>                            # 401

# External next parameter is ignored: after sign-in you land on "/"
open 'http://localhost:3000/signin?next=https://evil.com'
open 'http://localhost:3000/signin?next=//evil.com'
```

## Known limits

- Users and orders are in memory (reset on restart; not shared across serverless instances).
- No sign-up, password reset, rate limiting or lockout on sign-in.
- Sessions can't be revoked server-side before the 7-day expiry (stateless cookie).
- Demo passwords are in source; remove them before real use.

## Attack log (three attacks, what stopped each)

Run against `npm run build && npm start`; `npm run check:api` asserts the same
status codes. "Verified here" means run in the authoring environment.

| # | Attack | Expected result | What stops it | Verified here |
|---|---|---|---|---|
| 1 | Open `/orders/<abels-id>` or `GET /api/orders/<abels-id>` as Selam | 404 (identical to a missing order, so ids can't be probed) | Layer 3: `lib/orders.js` scopes the read by `session.userId` | Run `check:api` |
| 2 | Forge the cookie: `session=u_abel.forged` | Passes middleware (a cookie exists) but gets 401 / redirect from the page or handler | Layer 2: `getSession()` rejects the bad HMAC; middleware (layer 1) was never the proof | Run `check:api` |
| 3 | `/signin?next=https://evil.com` or `//evil.com`, then sign in | You land on `/`, never on the other site | `lib/safe-next.js`, applied at render **and** in the `signIn` action | **Yes**: `npm run test:auth`, 25/25 pass |

Also covered by `check:api`: signed-out `POST /api/orders` (401), customer on
`/api/kitchen/orders` (403), signed-out kitchen (401).
Attacks 1 and 2 need a running server, which could not be started here
(npm registry unreachable), so write the observed status codes into the last
column after you run them.


# Build output

## Before this step
```
Route (app)                                 Size  First Load JS  Revalidate  Expire
┌ ○ /                                      174 B         106 kB
├ ○ /_not-found                            995 B         104 kB
├ ○ /cart                                  174 B         106 kB
├ ƒ /checkout                              174 B         106 kB
├ ○ /menu                                  174 B         106 kB          1m      1y
├ ● /menu/[id]                             131 B         103 kB
├   ├ /menu/1
├   ├ /menu/2
├   ├ /menu/3
├   └ [+4 more paths]
├ ƒ /menu/broken                           131 B         103 kB
└ ● /menu/category/[slug]                  174 B         106 kB          1m      1y
    ├ /menu/category/mains                                               1m      1y
    ├ /menu/category/sides                                               1m      1y
    └ /menu/category/drinks                                              1m      1y
+ First Load JS shared by all             103 kB
```

Measured /menu JS (gzip, all chunks the route loads): 104.95 kB gzip,

## After this step
```
Route (app)                                 Size  First Load JS  Revalidate  Expire
┌ ○ /                                      168 B         106 kB
├ ○ /_not-found                            995 B         104 kB
├ ○ /cart                                1.02 kB         107 kB
├ ƒ /checkout                              168 B         106 kB
├ ○ /menu                                  389 B         106 kB          1m      1y
├ ● /menu/[id]                           1.01 kB         104 kB
├   ├ /menu/1
├   ├ /menu/2
├   ├ /menu/3
├   └ [+4 more paths]
├ ƒ /menu/broken                           127 B         103 kB
└ ● /menu/category/[slug]                  389 B         106 kB          1m      1y
    ├ /menu/category/mains                                               1m      1y
    ├ /menu/category/sides                                               1m      1y
    └ /menu/category/drinks                                              1m      1y
+ First Load JS shared by all             103 kB
```

Measured /menu JS (gzip, all chunks the route loads): 105.85 kB gzip,

## Explanation
/menu First Load JS is 106 kB before and after (104.95 kB vs 105.85 kB measured in gzip, about 0.9 kB more). It did not shrink, for two reasons:

1. The project was already server-first. The menu page and dish list were server components from the start, so there was no large client bundle to remove.
2. This step added a cart provider to the root layout, and the cart UI, filter shell and sidebar link are small client leaves. Together they cost about 0.9 kB on every page.

Shared framework JS (React and Next runtime) is 103 kB and is the floor for any route; the page-specific part is under 1 kB. The gain from this step is placement, not size: the dish list and the category data stay off the client, and the cart provider can't pull the rest of the tree into the bundle.


# Data fetching

Two kinds of data, two tools:

- **Server-side reads** (server components, no client JS): `fetchDishes` in `DishList`, `getOrderForUser` in `/orders/[id]`. Their freshness is set by the route's rendering strategy in `STRATEGY.md`.
- **Client-side live data** (SWR): the two queries below. Both use the one fetcher in `lib/fetcher.js`, which throws a `FetchError` (with the HTTP status) on any non-2xx response, because SWR only treats a *thrown* error as a failure.

## About `staleTime`
SWR has no option called `staleTime` (that is TanStack Query). The closest SWR settings, which each query below sets explicitly, are:
- `dedupingInterval`: how long an identical request is reused instead of sent again (SWR's default is 2 s).
- `refreshInterval`: polling.
- `revalidateOnFocus` / `revalidateOnReconnect`: refetch triggers.

## Queries

### 1. Order status
| | |
|---|---|
| Used in | `app/orders/[id]/OrderStatus.jsx` |
| Key | `/api/orders/<id>` |
| Refresh rule | `refreshInterval`: 5000 ms while the order is not final; `0` (stop) once it is `delivered` or `cancelled`. Revalidates on focus and reconnect (SWR defaults). `dedupingInterval` left at the default 2 s. |
| Initial data | `fallbackData` = the status the server component just read, so first paint shows the real status with no spinner. |
| Errors | 404 (gone, or not yours): no retry. Anything else: up to 3 retries, 5 s apart. |
| Why | A status is only useful if it is current, and it changes on its own as the kitchen works, so poll. 5 s feels live without much load. Stopping at a final status avoids polling something that can never change. Focus revalidation is wanted: someone coming back to the tab expects the latest status. Seeding from the server avoids a loading flash on a page the visitor navigated to specifically to see this. |
| After cancelling | `CancelOrderButton` calls `mutate()` so the status updates immediately rather than at the next poll. |

### 2. Dish search (paged)
| | |
|---|---|
| Used in | `app/menu/SearchBox.jsx` |
| Key | `/api/dishes?q=<term>&page=<n>&pageSize=3`, or **`null`** when the box is empty |
| Debounce | The term is debounced 300 ms before it can change the key. Clearing the box skips the debounce. |
| Null key | An empty term sends no request; the normal server-rendered menu is shown instead. |
| Paging | The page number is in the key's query string. A new term always resets to page 1 (the page is stored with the term it belongs to). Each (term, page) pair is its own key and its own cache entry. |
| `keepPreviousData` | `true`: while a new key loads, the previous results stay on screen (dimmed) instead of the list going empty. |
| Refresh rule | No polling. `revalidateOnFocus: false`. `dedupingInterval: 30000`. |
| Why | The menu changes rarely (the menu page itself is only revalidated once a minute), so refetching on focus or every few seconds would be wasted requests. 30 s means going back to a term you just searched, or flipping Previous/Next, costs nothing. Debounce stops a request per keystroke. A race (slow response for "do" arriving after "doro") cannot show wrong results: SWR only renders the data for the *current* key, so an old key's late response just fills its own cache entry. |

## Decision table: every query

| Query | Where | Key | Refresh rule | Reasoning |
|---|---|---|---|---|
| Menu dishes (`fetchDishes` in `DishList`) | **Server** | n/a (route cache; see `STRATEGY.md`) | `revalidate = 60` | Public, changes rarely, needs to be in the HTML for SEO. No client JS. |
| Dish detail (`/menu/[id]`) | **Server** | n/a | Static, pre-rendered per dish id | Same: indexable, no per-user data. |
| Order detail first paint (`getOrderForUser` in `/orders/[id]`) | **Server** | n/a | Dynamic, every request | Per-user, behind auth; ownership is checked next to the data. Its result seeds query 1 below. |
| Order status | **Client (SWR)** | `/api/orders/<id>` | Poll 5 s until `delivered` or `cancelled`, then stop | Changes on its own while the visitor watches. |
| Dish search | **Client (SWR)** | `/api/dishes?q=&page=&pageSize=` or `null` | No polling; 30 s dedupe; no focus revalidate | Driven by typing, so it can't run on the server; menu is stable. |

## How to verify
1. **Debounce:** open DevTools, Network, filter by Fetch/XHR, type "doro" quickly into the search box: one `/api/dishes?q=doro...` request, not four.
2. **keepPreviousData:** type "doro", wait for results, change to "doros" (or any new term) and watch: the list dims but never empties.
3. **No first-paint spinner:** place an order, open `/orders/<id>`, View Source (or disable JavaScript): the status text is already in the HTML. Network shows a `/api/orders/<id>` request shortly after, repeating every 5 seconds until the status is final.
4. **Null key:** empty the search box; no request is sent and the normal menu returns.

# Rendering strategy per route

| Route | Strategy | Why |
|---|---|---|
| `/` | Static (○) | Same content for everyone; nothing request-specific. |
| `/menu` | Static + ISR, `revalidate = 60` (○) | The menu changes rarely, so serve a prebuilt page and refresh it at most once a minute. The search box on it is client-only and calls `/api/dishes` after load, so it doesn't make the page dynamic. |
| `/menu/category/[slug]` | SSG via `generateStaticParams` + `revalidate = 60` (●) | A fixed set of categories (mains, sides, drinks); prebuilt and refreshed like the menu. |
| `/menu/[id]` | SSG via `generateStaticParams` (●) | One page per dish (7) built ahead of time; unknown ids render on demand and call `notFound()`. |
| `/cart` | Static (○) | Placeholder shell for now; it becomes dynamic once it reads the cart from a cookie. |
| `/checkout` | Dynamic, `force-dynamic` (ƒ) | Reads the visitor's cart via `cookies()`, which only exists at request time. |
| `/orders` | Dynamic, `force-dynamic` (ƒ) | Lists the orders of the session in the cookie; differs per visitor. |
| `/orders/[id]` | Dynamic, `force-dynamic` (ƒ) | Owner-checked read of one order; 404 for anyone else. The server renders the order and seeds the live status, which a client leaf then polls (see `DATA.md`). |
| `/api/dishes`, `/api/dishes/[id]` | Route handlers (ƒ) | JSON endpoints; GET handlers are not cached by default in Next 15. `/api/dishes` reads the query string (search, paging) per request. |
| `/api/orders/[id]` | Route handler (ƒ) | GET only; owner-checked, `no-store`; polled by the order page. |
| `/api/orders` | Route handler (ƒ) | POST only: validate, create, 201 / 400 / 422. |
| `/menu/broken` | Dynamic, `force-dynamic` (ƒ) | Test-only route that throws so `menu/error.js` can be seen. |

## Compare against `npm run build`
Expected symbols in the build output. Any disagreement means the route does not behave the way this table says, so fix the code or the table:

| Route | Expected |
|---|---|
| `/`, `/cart` | ○ |
| `/menu` | ○ with Revalidate 1m |
| `/menu/category/[slug]` | ● with 3 paths, Revalidate 1m |
| `/menu/[id]` | ● with 7 paths |
| `/checkout`, `/orders`, `/orders/[id]`, `/menu/broken` | ƒ |
| `/api/dishes`, `/api/dishes/[id]`, `/api/orders`, `/api/orders/[id]` | ƒ |

## Layouts
- `app/layout.js` — root shell: owns `<html>` and `<body>`, header, footer, global CSS.
- `app/menu/layout.js` — category sidebar; stays mounted while moving between menu, category and dish pages.

## Streaming
The dish list is wrapped in `<Suspense>` with a skeleton fallback, so the page shell and sidebar render before the dishes arrive. `app/menu/loading.js` covers the whole segment.

# Search and sharing (SEO)

## Where each piece lives

| Piece | File | Notes |
|---|---|---|
| Public address | `lib/site.js` | `SITE_URL` env var. Everything absolute is built from it. |
| `metadataBase`, title template, default description | `app/layout.js` | Title template `%s | Addis Eats`; pages set only their own part. |
| Static routes: own title + description | `app/page.js`, `app/menu/page.js`, `cart`, `checkout`, `orders`, `orders/[id]`, `kitchen`, `signin` | Written for a person, 50–200 characters. |
| Category pages | `app/menu/category/[slug]/page.js` | `generateMetadata`, lists the dishes in the category. |
| Dish pages | `app/menu/[id]/page.js` | `generateMetadata` (name, price, description) + JSON-LD. Unknown id: "Dish not found", noindex. |
| Metadata and JSON-LD builders | `lib/seo.js` | Take the same dish object the page renders. |
| Site-wide preview image | `app/opengraph-image.jsx` | 1200×630 `ImageResponse`. |
| Per-dish preview image | `app/menu/[id]/opengraph-image.jsx` | 1200×630, dish name, price, description and photo. Pre-rendered for every dish id. |
| Sitemap | `app/sitemap.js` | `/`, `/menu`, each category, each dish (with its photo). Built from `lib/dishes.js`. |
| robots.txt | `app/robots.js` | Allows `/`; disallows `/cart /checkout /orders /kitchen /signin /api/ /menu/broken`; points to the sitemap. |

## Rules worth knowing

- **Absolute URLs.** Canonical, `og:image`, JSON-LD `url`/`image` and sitemap entries must be absolute. Set `SITE_URL` in production, otherwise they point at `http://localhost:3000`.
- **Page `openGraph` / `twitter` replace the layout's, not merge.** That is why `lib/seo.js` repeats `siteName` and the card type.
- **Private pages send `noindex` as well as being in robots.txt.** robots.txt only stops crawling; a blocked URL can still be listed if another site links to it.
- **JSON-LD** is a schema.org `MenuItem` (name, description, url, image, `Offer` with price and `USD`). `<` is escaped so a description can't close the script tag.
- **No `lastModified` in the sitemap**: the data has no modified dates, and a made-up one is worse than none.
- If dishes move to a database, make `sitemap()` and `generateStaticParams()` read from it (`sitemap` can be `async`).

## Verify on the deployed page

The task's tip is to look at the deployed page source, not trust the code:

```
SITE_URL=https://your-site npm run build && npm start     # or deploy
BASE=https://your-site npm run check:seo
```

`check:seo` fetches the HTML a crawler sees and checks, for every public page,
the title, description, absolute canonical, `og:`/`twitter:` tags and that
`og:image` is absolute, loads as an image and is 1200×630. For dish pages it also
parses the JSON-LD and checks name, description, price and URL against the visible
page. It checks private pages are `noindex`, robots.txt disallows every private
route, and the sitemap is absolute, complete and has no private routes. On a
non-localhost `BASE` it fails if the word `localhost` appears anywhere.

By hand: right-click → View source on `/menu/1` and look for `<title>`,
`<link rel="canonical">`, `og:image`, and `application/ld+json`. Then try
[Google's Rich Results Test](https://search.google.com/test/rich-results) and a
share-preview debugger on a dish URL.

## Status

Not run against a live build: the environment this was written in could not
install Next.js. What *was* run: the metadata, JSON-LD, sitemap and robots logic
(correct output for all 7 dishes), and `check:seo` against a mock server.
The `opengraph-image` files use `next/og` and were not rendered, so
look at `/menu/1/opengraph-image` and `/opengraph-image` once after building. The
image `alt` is the same for every dish (Next only allows a constant there).

# Performance: before and after

## Status — read this first

**The Lighthouse before/after numbers have not been recorded yet.** This work
was done in an environment that could not install Next.js (the npm registry was
blocked) and so could not build or run the app, which Lighthouse needs. The
tables below are therefore **empty on purpose**; nothing in them is estimated or
invented. `scripts/lighthouse.mjs` records them for you in a few minutes
(see "How to measure"). The one set of numbers that *is* real is the image
payload, measured with `sharp` and labelled as an estimate.

## What changed, and what each change should move

| Change | File | Metric it targets | Why |
|---|---|---|---|
| Every dish photo goes through `next/image` with its true `width`/`height` | `app/menu/DishCard.jsx`, `lib/dishes.js` | **CLS**, LCP | The browser reserves the box before the image arrives, so nothing jumps. Next serves a resized WebP instead of the full JPEG. |
| Honest `sizes` (`120px` for thumbnails; `min(column, 640px)` for the dish photo) | `DishCard.jsx` | LCP, bytes | Without `sizes` the browser assumes the image is as wide as the screen and fetches a big one. |
| `priority` on exactly one image per page: the first card on a menu page, the large photo on `/menu/[id]` | `DishList.js`, `menu/[id]/page.js` | **LCP** | Preloaded and not lazy. Everything else stays lazy so it can't compete for bandwidth. |
| `next/font/google` (Inter) on `<html>` | `app/layout.js`, `globals.css` | **CLS**, FCP | The font file is downloaded at build time and served from this site (no request to Google at runtime), and Next adds a size-matched fallback font so the swap doesn't reflow text. |
| Analytics through `next/script` with `strategy="lazyOnload"` | `app/analytics.jsx` | TBT / **INP** | Loads after the page is idle, so it can't block the first paint or an early click. Off unless `NEXT_PUBLIC_ANALYTICS_DOMAIN` is set. |
| `.env.example` committed; `.env*.local` ignored | `.env.example`, `.gitignore` | n/a | Every variable documented with dummy values. Checked: `.env.local` is ignored, `.env.example` is not. |

Facts about the starting point, so the table above isn't oversold: the project
had **no images, no web-font `<link>` and no third-party scripts**. So the
font and script changes here are *set up correctly* rather than *fixes of
something slow*, and the image work added images that did not exist before. The
dish photos are generated placeholders (800×600 JPEG); swap in real photos of
the same size, or update `IMAGE_WIDTH`/`IMAGE_HEIGHT` in `lib/dishes.js`.

## Image payload (measured with `sharp`, an estimate of what Next will serve)

For the 7 dish photos, WebP quality 75 (Next's default) at the widths Next picks
for a 120px thumbnail on 1x and 2x screens:

| What the browser downloads for all 7 thumbnails | Bytes |
|---|---|
| Plain `<img src="/dishes/…jpg">`, full 800×600 files | 138,737 |
| `next/image`, 1x screen (128w WebP) | 6,334 |
| `next/image`, 2x screen (256w WebP) | 14,874 |
| Dish page hero, 640w WebP (one image) | ≈ 5,800 average, 40,422 for all 7 |

With `next/image`, only the first thumbnail is eager and the rest are lazy, so
the real first-load cost on `/menu` is lower again. Not a Lighthouse result:
the placeholder images are small and flat, so real photos will show a larger gap.

## How to measure

Record **before changing anything** (the tip in the task): use the previous
version of the project (`addis-eats-auth.zip`, which has none of these changes)
and then this one. Same machine, same load, same network conditions both times.

```
npm install
npm run build && npm start        # production build, never `npm run dev`
npm run perf -- before            # in a second terminal, against the OLD project
# stop the server, switch to this project, rebuild, restart
npm run perf -- after
```

`npm run perf` runs Lighthouse 5 times per page (`RUNS=…` to change) on `/`,
`/menu` and `/menu/1`, with Lighthouse's default **mobile, simulated slow-4G and
4× CPU throttling**, and prints the **median** (single runs vary by several
percent). Raw reports are kept in `perf/<label>/`. It needs Chrome installed
(set `CHROME_PATH` if it isn't found) and network access to fetch Lighthouse.

Notes:
- **INP** can't be measured by a page-load Lighthouse run (it needs real clicks).
  The script reports **TBT**, the standard lab stand-in. Measure INP in the
  DevTools Performance panel or with the `web-vitals` library.
- `npm run build` fetches the Inter font from Google once (build-time only). It
  needs internet access at build, not at runtime.
- For a meaningful "before" on images, a page that used a plain `<img>` with
  the full file and no `width`/`height` is the honest comparison; the previous
  zip has no images at all, so on the image rows expect "before" to be missing
  rather than slower. The font/CLS rows compare cleanly.

## Performance budget

Both columns are filled for what can be known without a running build. **Budget**
is the target (Google's "good" Core Web Vitals thresholds, at the 75th
percentile). **Measured** is left as `_run_` where it needs `npm run perf`, because
inventing a number would make the table worthless. Fill the Measured and
Before columns, then check each row against its budget.

| Page | Metric | Budget | Before (old zip) | After (this zip) | Cause of the change |
|---|---|---|---|---|---|
| `/menu` | LCP | ≤ 2500 ms | _run_ | _run_ | First dish photo is `priority` + `sizes="120px"`, WebP via `next/image`; rest are lazy |
| `/menu` | CLS | ≤ 0.1 | _run_ | _run_ | `width`/`height` on every image; `next/font` size-matched fallback |
| `/menu` | TBT | ≤ 200 ms | _run_ | _run_ | Analytics `lazyOnload`, off unless env var set |
| `/menu/1` | LCP | ≤ 2500 ms | _run_ | _run_ | Hero image `priority`, 640 px max width |
| `/menu/1` | CLS | ≤ 0.1 | _run_ | _run_ | Reserved image box |
| `/menu/1` | TBT | ≤ 200 ms | _run_ | _run_ | No blocking third-party script |
| `/` | CLS | ≤ 0.1 | _run_ | _run_ | Font swap no longer reflows text |
| any | INP | ≤ 200 ms | _run_ | _run_ | DevTools / `web-vitals` (Lighthouse can't measure it) |

Already measured (see "Image payload" above): `/menu` thumbnails drop from
138,737 bytes (plain `<img>`) to 6,334 bytes on a 1x screen.

# Server / client boundary

Rule: components are server components by default. `"use client"` goes only on the smallest piece that needs state, effects, event handlers or browser APIs.

## Client components (10 files with `"use client"`)

| File | Why it is client |
|---|---|
| `app/providers.jsx` | Cart context: `useState`, `useEffect`, `document.cookie`. Isolated here; it wraps `children` that stay server components. |
| `app/cart-ui.jsx` | Three small leaves that read the cart: `CartBadge`, `AddToCartButton`, `CartContents` (click handlers and context). |
| `app/menu/SidebarLink.jsx` | One link that needs `usePathname` to highlight itself. The sidebar around it is a server component. |
| `app/menu/FilterShell.jsx` | Holds the "Under $10 only" checkbox state. `DishList` is passed in as `children`, never imported, so it stays on the server. |
| `app/checkout/CheckoutForm.jsx` | `useActionState` for the pending flag and returned field errors, and the cart context to empty the cart after success. Calls the `placeOrder` server action. |
| `app/orders/[id]/OrderStatus.jsx` | SWR polling needs hooks. Only the live status is client; the order lines, total and address are rendered by the server page, which passes the status in as `fallbackData`. |
| `app/menu/SearchBox.jsx` | Input state, debounce timer, SWR. The normal menu is passed in as `children`, so `DishList` still stays on the server. |
| `app/orders/[id]/CancelOrderButton.jsx` | `useActionState` for the pending flag and error message. Calls the `cancelOrder` server action. |
| `app/auth-nav.jsx` | Header leaf: SWR reads `/api/session` (keyed by pathname) and the sign-out form calls the `signOut` action. Keeps the root layout static: it never reads cookies itself. |
| `app/menu/error.js` | Next.js requires error boundaries to be client components. |

`app/menu/DishCard.jsx` has no `"use client"`: it has no hooks, so the server `DishList` and the client `SearchBox` both import it (it becomes part of the client bundle only through `SearchBox`).

## Server components (everything else)

| File | Role |
|---|---|
| `app/layout.js` | Root shell: html, body, header, footer. Passes its content through `<Providers>` as children. |
| `app/page.js`, `app/cart/page.js` | Static pages. The cart page hands dish data to `CartContents` as props. |
| `app/menu/layout.js` | Persistent sidebar layout. |
| `app/menu/CategorySidebar.js` | Builds the category list on the server; only the link is client. |
| `app/menu/page.js`, `app/menu/category/[slug]/page.js` | Compose `FilterShell` + `Suspense` + `DishList`. No hooks. |
| `app/menu/DishList.js` | Async: awaits its own data (`fetchDishes`). Ships no JS. |
| `app/menu/[id]/page.js` | Reads `params`, renders the dish, adds one `AddToCartButton` leaf. |
| `app/checkout/page.js` | Dynamic; reads the cart cookie with `cookies()` on the server. |
| `app/actions.js` | `"use server"`: `placeOrder`, `cancelOrder`. Runs only on the server. |
| `app/api/**/route.js` | Route handlers. |
| `app/orders/page.js`, `app/orders/[id]/page.js` | Dynamic; read the session cookie and the order store on the server. |
| `lib/fetcher.js`, `lib/status.js` | Plain modules with no server-only imports, so client components can use them. |
| `app/menu/loading.js`, `not-found.js` | No interactivity. |

## What was removed or not needed
- There is no `useFetch` hook or manual loading/error state: the menu was already fetching in a server component. Loading and errors are handled by `loading.js`, `error.js` and `<Suspense>`.
- The old client-wide `CategorySidebar` became a server component plus a one-link client leaf, so the category data no longer ships to the browser.
