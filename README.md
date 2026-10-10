# Addis Eats (Next.js, App Router)

```
npm install
npm run dev      # http://localhost:3000
npm run build    # lists every route found
```

Routes: `/`, `/menu`, `/menu/category/[slug]`, `/menu/[id]`, `/cart`, `/checkout`, `/orders`, `/orders/[id]`, `/signin`, `/kitchen` (staff only), `/sitemap.xml`, `/robots.txt`, `/opengraph-image`, `/menu/[id]/opengraph-image`

API: `GET /api/dishes`, `GET /api/dishes/[id]`, `POST /api/orders` (signed in), `GET /api/orders/[id]` (owner), `GET|POST|DELETE /api/session`, `GET /api/kitchen/orders` (staff)

Authentication: see `AUTH.md` (demo accounts, layers, how to break it). `middleware.js` guards `/checkout` and `/orders`.

`DATA.md` lists every client-side query (SWR): its key, refresh rule and why.

See `BOUNDARY.md` for which components are server and which are client, `STRATEGY.md` for each route's rendering strategy and `BUILD_OUTPUT.md` for the recorded build.

Try these:
- `/menu` — category row renders first, dishes stream in behind a skeleton
- `/menu/broken` — forces `error.js`
- `/menu/999` — `notFound()` renders `menu/not-found.js`
- `/nope` — global 404

## Deployed site and fresh-clone setup

**Deployed URL:** _not deployed yet_. Replace this line with your URL once live.

Deploy on Vercel (the first morning, not the last afternoon):
1. Push the repo to GitHub, then "Import Project" on vercel.com.
2. Set environment variables: `SESSION_SECRET` (`openssl rand -base64 32`) and `SITE_URL` (the production URL, no trailing slash). `NEXT_PUBLIC_ANALYTICS_DOMAIN` is optional.
3. Deploy, then verify from the source: `BASE=https://your-site npm run check:seo`.

Run from a fresh clone:
```
git clone <your-repo-url> addis-eats && cd addis-eats
npm install
cp .env.example .env.local     # set SESSION_SECRET; SITE_URL can stay localhost in dev
npm run dev                    # http://localhost:3000
# production check:
npm run build && npm start
npm run check:api && npm run test:auth
```
Demo logins are in `AUTH.md`.

## Environment and performance
- Copy `.env.example` to `.env.local` (gitignored) and fill it in. `SESSION_SECRET` is required in production.
- Images use `next/image` (`app/menu/DishCard.jsx`), the font uses `next/font` (`app/layout.js`), third-party scripts use `next/script` `lazyOnload` (`app/analytics.jsx`).
- `PERF.md` explains each change and how to record Lighthouse numbers with `npm run perf -- <label>`. **The measured numbers are not filled in yet.**

## Search and sharing
See `SEO.md`: metadata, title template, per-dish social images, JSON-LD, sitemap, robots. Set `SITE_URL` in production, then run `BASE=https://your-site npm run check:seo`.

## Design
The UI follows the "Printed Menu" mockup: warm paper background, ink-black text, one rust accent.
Newsreader (serif) carries the voice; Inter is only used for small tracked-out capitals. Both load through
`next/font` in `app/layout.js` as `--font-serif` / `--font-sans`. All colours, widths and spacing are CSS
variables at the top of `app/globals.css`, so a re-theme is a change to that one block.
The home page is the hero, a photo strip and the full menu; `/menu` adds search, the under-$10 filter and the category row.

## Project tree
```
app/
  layout.js            root shell (html, body, fonts, header, footer, Providers)
  globals.css          the whole design: tokens, header/footer, menu rows, forms (see Design below)
  hero-strip.jsx       home page photo strip
  status-badge.jsx     order status dot + label
  providers.jsx        client: cart context
  cart-ui.jsx          client leaves: CartBadge, AddToCartButton, CartContents
  actions.js           "use server": signIn, signOut, placeOrder, cancelOrder
  sitemap.js robots.js opengraph-image.jsx json-ld.jsx   SEO (see SEO.md)
  analytics.jsx        optional lazy-loaded third-party script (off unless env var set)
  signin/page.js       /signin (form + safe return-to-destination)
  kitchen/page.js      /kitchen (staff only)
  auth-nav.jsx         client: header sign-in/out + Kitchen link
  page.js              /
  cart/page.js         /cart
  checkout/
    page.js            /checkout (dynamic, reads cart cookie)
    CheckoutForm.jsx   client: useActionState form -> placeOrder
  menu/
    layout.js          persistent category row (CategoryNav)
    page.js            /menu
    loading.js  error.js  not-found.js        special files
    category/[slug]/page.js                   /menu/category/mains|sides|drinks
    [id]/page.js                              /menu/1 ... /menu/7
    broken/page.js                            forces error.js
    CategoryNav.js CategoryLink.jsx DishCard.jsx DishList.js DishListSkeleton.js FilterShell.jsx
    SearchBox.jsx      client: debounced search + paging with SWR
  orders/
    page.js            /orders
    [id]/page.js       /orders/[id] (owner only)
    [id]/OrderStatus.jsx         client: SWR poll every 5 s, seeded by the server page
    [id]/CancelOrderButton.jsx   client: useActionState -> cancelOrder
  api/
    dishes/route.js         GET /api/dishes?q=&page=&pageSize=
    dishes/[id]/route.js    GET /api/dishes/:id
    orders/route.js         POST /api/orders
    orders/[id]/route.js    GET /api/orders/:id (owner only)
lib/  cart.js  dishes.js  orders.js  schema.js  session.js  api.js  fetcher.js  status.js
scripts/check-api.sh        curl assertions for every endpoint (npm run check:api)
```

## API
Every error uses one shape: `{ "error": { "code": "...", "message": "...", ...extra } }`.
Test with curl before touching any UI (orders need a signed-in user: `POST /api/session` sets the cookie, and `-c/-b jar.txt` keeps it; see `AUTH.md`):

```
curl -i localhost:3000/api/dishes                 # 200
curl -i localhost:3000/api/dishes/1               # 200
curl -i localhost:3000/api/dishes/999             # 404 not_found

# 400 invalid_json
curl -i -X POST localhost:3000/api/orders -H 'content-type: application/json' -d '{oops'

# 422 validation_failed with fieldErrors
curl -i -X POST localhost:3000/api/orders -H 'content-type: application/json' -d '{"name":"A","items":[]}'

# 422 unknown dish id
curl -i -X POST localhost:3000/api/orders -H 'content-type: application/json' \
  -d '{"name":"Abebe","phone":"+1 555 123 4567","address":"12 Bole Rd","items":[{"id":"99","qty":1}]}'

# 201 Created + Location header
curl -i -c jar.txt -X POST localhost:3000/api/orders -H 'content-type: application/json' \
  -d '{"name":"Abebe","phone":"+1 555 123 4567","address":"12 Bole Rd","items":[{"id":"1","qty":2}]}'
```

## Endpoints and status codes
| Request | Status | Body |
|---|---|---|
| `GET /api/dishes?q=&page=&pageSize=` | 200 | `{ dishes, page, pageSize, total, totalPages }` (no query string = all dishes) |
| `GET /api/dishes?page=0` (or pageSize > 20) | 422 | `{ error: { code: "validation_failed", fieldErrors } }` |
| `GET /api/dishes/:id` | 200 / 404 | `{ dish }` / `{ error: { code: "not_found", message } }` |
| `GET /api/orders/:id` | 200 / 404 | `{ order }` / not found (also for someone else's order) |
| `POST /api/orders` valid | 201 + `Location` | `{ order }` |
| `POST /api/orders` body is not JSON | 400 | `{ error: { code: "invalid_json", message } }` |
| `POST /api/orders` invalid order or unknown dish | 422 | `{ error: { code: "validation_failed", message, fieldErrors, formErrors } }` |

`npm run build && npm start`, then `npm run check:api` asserts all of the above.

## Attack your own app
Run these from the browser console on the running site (they use the same endpoint the form's action mirrors):
```js
// 1. Tamper with the price: the server prices orders itself, so the total must still be real.
await (await fetch('/api/orders', {method:'POST', headers:{'content-type':'application/json'},
  body: JSON.stringify({name:'Abebe',phone:'+1 555 123 4567',address:'12 Bole Rd',items:[{id:'1',qty:1,price:0}]})})).json()
// 2. Absurd quantity -> expect 422.
await (await fetch('/api/orders', {method:'POST', headers:{'content-type':'application/json'},
  body: JSON.stringify({name:'Abebe',phone:'+1 555 123 4567',address:'12 Bole Rd',items:[{id:'1',qty:99999}]})})).json()
// 3. Someone else's order: place an order, then in a private window (new session) open /orders/<that id> -> expect 404.
// 4. Forge the session: set document.cookie = 'session=<any-uuid>.abc' (httpOnly cookies can't be edited from JS,
//    so this only adds a second, invalid cookie) -> the real cookie still wins; a bad signature is treated as no session.
```
To attack `cancelOrder`, open `/orders/<id>` from a different browser profile: it 404s before the cancel button can even render, and a forged call to the action would fail the owner check in `lib/orders.js`.

## Failure checks (run on `npm run build && npm start`)
1. `/api/dishes/999` returns 404 JSON in the standard shape.
2. `/menu/999` renders `menu/not-found.js`.
3. `/menu/broken` renders `menu/error.js`.
4. `/nope` renders the global 404.
5. Submitting the checkout form with bad data shows field errors and keeps what was typed; `POST /api/orders` returns the same errors as 422.
6. JavaScript disabled: the checkout form still submits, shows the errors, and on success shows a link to the order.

(The image doesn't list the six checks, so these are my choice. Replace them with your course's list if it differs.)

## Build output
Paste the output of `npm run build` here after running it on your machine, then compare it with the table in `STRATEGY.md`:

```
(paste here)
```

## Orders and auth
- `lib/schema.js` is the single zod schema, used by the API route and the `placeOrder` server action.
- `app/actions.js` (`"use server"`): `placeOrder` and `cancelOrder`. Prices are computed on the server; the cart is read from the cart cookie on the server.
- `lib/session.js`: signed httpOnly/secure/sameSite `session` cookie set at sign-in; `getSession()` is used by pages, actions and handlers. Set `SESSION_SECRET` in production. See `AUTH.md`.
- `cancelOrder` checks the session and that the order belongs to it before writing. Someone else's order returns "not found".
- `lib/orders.js` stores orders **in memory** as a stand-in for a database: they reset when the server restarts.

## Commit to GitHub
```
git init && git add . && git commit -m "Move Addis Eats onto Next.js"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```
