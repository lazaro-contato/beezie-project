# beezie-claw

A reimplementation of Beezie's pull-and-reveal flow: buy pulls on a claw
machine, watch the box open, turn the cards over, and swap them for credit or
keep them.

Next.js 16 (App Router, `cacheComponents`), TypeScript, Tailwind v4,
Drizzle + SQLite.

---

## Run it

```bash
pnpm install
pnpm db:reset       # drops .data, pushes the schema, seeds it
pnpm dev
```

Open http://localhost:3000. It redirects to the default machine. No `.env` is
needed for local development — both variables have working defaults, and
`.env.example` documents them.

To exercise it the way it ships, build it:

```bash
pnpm build && pnpm start
```

### Deploying

Two environment variables, both set before the build:

| | |
| --- | --- |
| `PULL_SERVER_SECRET` | 32+ chars. The app refuses to boot in production with the dev default |
| `NEXT_PUBLIC_SITE_URL` | read at **build** time; without it every canonical and `og:url` ships as `localhost` |

The database is gitignored and built from the seed, so it has to exist before
`next build` prerenders anything that reads it. `pnpm build` does that itself:

```json
"build": "pnpm db:push && pnpm db:seed && next build"
```

It lives in the `build` script rather than in a host config file so that any
host running the default command gets a database, whatever its own build
settings say. `outputFileTracingIncludes` in `next.config.ts` then ships
`.data/` inside the serverless functions, which file tracing would otherwise
miss: the file is opened by path, not imported.

**SQLite on a serverless host is a demo arrangement, and it behaves like
one.** The bundle is mounted read-only, so on the first request in a container
the database is copied to the one writable directory available and opened
there. Pulls and swaps persist for the life of that container and the data
returns to the seed on the next cold start. A deployment meant to keep its
data points `DATABASE_URL` at a mounted volume, or moves to hosted libSQL,
and that branch never runs.

---

## What the brief asked for, and where it is

### 1. Mimic the pull and reveal experience

`/claw/[slug]` is the machine. Choose a quantity, open the payment sheet,
confirm. An eight-second stage covers the pull while the server draws it, the
box-opening video plays, and the result lands at its own URL. One card gets a
two-column reveal you flip by dragging; several get a fanned hand you deal one
card at a time, then select and swap together.

### 2. Responsive on web and mobile

Verified from 360x640 up. Interactions adapt rather than degrade: the card
tilt is a hover on a mouse and a press-and-hold on touch, the multi-card swap
grid caps at two columns on a phone, and where height is the scarce dimension
a `short:` variant lays the reveal's actions out in a row so the card keeps
the space.

### 3. Preload the reveal video

The element is server-rendered with `preload="none"`, so it costs nothing on
first paint. `VideoPreloader.client` then waits for `requestIdleCallback`
(2s ceiling), checks `navigator.connection` and **skips the preload entirely
on save-data or 2g**, and only then flips the element to `preload="auto"` and
calls `load()`. It marks the element ready on `canplaythrough`.

### 4. Use as much SSR as possible

This was the dominant constraint. Ten client components exist in the whole
project, each for a reason a Server Component cannot cover:

| Island | Why it cannot be a Server Component |
| --- | --- |
| `QuantityStepper.client` | local state, recomputes price |
| `OddsPanel.client` | subscribes to SSE; initial values arrive as props |
| `PaymentSheet.client` | drag gesture, focus trap |
| `RevealOrchestrator.client` | `HTMLVideoElement`, playback timing |
| `VideoPreloader.client` | `requestIdleCallback`, `canplaythrough` |
| `HoloCard.client` | `pointermove`, device orientation |
| `SwapSelection.client` | multi-select, timers, drag-to-flip |
| `SwapPendingButton.client` | `useFormStatus`, imported by an RSC |
| `SwapSuccessDialog.client` | must outlive the navigation that produces it |
| `TopProgressBar.client` | the App Router publishes no navigation events |

Everything else renders on the server. There is no client-side data fetching
anywhere: data comes down through RSCs, and Server Actions are the only way
back up. Cards are passed into islands as **already-rendered `ReactNode`s**,
so `CardTile` and `next/image` never enter a client bundle.

The boundary is not a convention. `eslint.config.mjs` fails the build if a
`*.client.tsx` imports the database, the RNG, a query module or the env
parser, and if a layer imports upward.

---

## SSR evidence

```bash
$ curl -s localhost:3000/claw/gold-claw | grep -o 'Charizard' | wc -l
22
$ curl -s localhost:3000/claw/gold-claw | grep -o '<form' | wc -l
4
$ curl -s localhost:3000/claw/gold-claw | grep -o '<video[^>]*>' | head -1
<video src="/video/idle-loop.mp4" poster="..." autoPlay muted playsInline loop preload="auto">
```

Card names, prices, odds, the top-items grid and the recent-pulls feed are all
in the first response, not fetched after it. The four forms carry React's
`$ACTION_ID` fields, so the preference toggle, the promo code and the checkout
submit without JavaScript; the same is true of swap and keep on the reveal
route.


---

## How to verify it

There is no test suite. This is the walkthrough that covers every path, and
it is what I run before calling a change done. Do it against `pnpm start`
rather than `pnpm dev` — dev's slower navigation both hides real timing bugs
and invents ones that do not exist in production.

The seeded viewer has **$2,500** in the Beezie wallet and $50 external.
Wildcard Claw is $30 a pull, so use it for repeated runs; Gold Claw is $500
and gives you five. `pnpm db:reset` puts the money back.

**A single pull, start to finish**

1. On `/claw/wildcard-claw`, leave the quantity at 1 and press **Start Now**.
2. The payment sheet opens at `?checkout=1`. Press **Confirm**.
3. "What you can pull" covers the screen for eight seconds, cycling previews.
4. The box-opening video plays full-bleed. **Skip to reveal** cuts it short.
5. Drag the card sideways to turn it over. The copy beside it switches from
   "Your pull is face down" to the card's name and swap value.
6. **Swap now** credits the wallet, closes the reveal, and lands you back on
   the machine with a "Swap success" dialog over it. Closing it leaves you on
   the machine with the quantity reset to 1.
7. Repeat and press **Keep item** instead: the panel says "You kept this
   card" and **Back to the claw** ends the flow.

**A multi-card pull**

Set the quantity to 3 or more before Start Now. After the video you get a
fanned hand: drag the top card, or press **Flip all**. Once every card is
face up, **Select all** and the footer button becomes
"Swap now · 3 items · $X". A progress bar runs, then the same success dialog.

**The things that are easy to break**

- **Refresh mid-reveal.** The result is a real URL, so F5 gives you the same
  cards back, face up if you had already turned them.
- **Back button** from the reveal returns to the machine, not to a blank page.
- **Reopen checkout.** Open the sheet, close it, open it again. It must open,
  not reload the page.
- **Quantity lifetime.** Set it to 5, open and close the sheet: still 5.
  Reload the page, or switch machines: back to 1.
- **Promo codes.** `BEEZIE10` is 10% off, `FIRSTPULL` is $25 off, and
  `EXPIRED` is inactive and must be rejected. **Apply** stays disabled while
  the input is empty.
- **Scroll lock.** Open a card from Recent pulls; the page behind must not
  scroll. Close it; it must scroll again.
- **The animation pill** on the cabinet pauses and restarts the idle loop.

**Mobile**

Use a device emulator at 390x844 and 360x640. The card tilt is a
press-and-hold instead of a hover, the multi-swap grid caps at two columns,
and no overlay should scroll the page behind it.

**Without JavaScript**

Disable it and reload the machine page. The cards, prices and odds are all
there, the animation toggle still works, and the promo form still submits —
they are `<form action={serverAction}>`, not handlers.

**SEO and assets**

```bash
curl -s localhost:3000/robots.txt
curl -s localhost:3000/sitemap.xml
curl -s localhost:3000/manifest.webmanifest
curl -s localhost:3000/claw/gold-claw | grep -o '<meta property="og:[^>]*>'
```

---

## The reveal video, and the iOS trap

Safari on iOS only allows `play()` inside the synchronous chain of a user
gesture. **An `await` before `play()` breaks the flow** — the gesture has
expired by the time the promise resolves, and the video is blocked.

So the confirm handler is deliberately not `async`:

```ts
function handleConfirm() {
  playRevealVideoSync();               // first statement, nothing awaited
  startTransition(async () => {
    const result = await createPull(...);
    ...
  });
}
```

`playRevealVideoSync()` plays and immediately pauses and rewinds, in the same
synchronous block. That claims the element's activation flag without burning
any of the cut behind the pull stage, which covers the screen for the next
eight seconds. When the stage closes, `RevealOrchestrator` spends the flag and
the video starts — a `play()` on an element already played under a gesture
needs no fresh gesture.

The video element lives in `app/claw/[slug]/layout.tsx`, not in the page.
Under Cache Components the App Router *hides* the route you leave instead of
unmounting it, so a video owned by the machine page would be hidden mid-
playback the moment the pull route pushes.

---

## Structure

```
app/          routes, plus the shell and page UI only a route uses
features/     domains: machine, checkout, reveal
entities/     the card, which every domain composes
components/   the UI kit, with no domain knowledge
lib/          pure TypeScript, no JSX
```

Dependencies point down and never sideways: `features/machine` cannot import
`features/reveal`, and nothing below `app/` can import a route. Those rules are
lint-enforced.

---

## Numbers

| | |
| --- | --- |
| Client components | 11 |
| JS on the claw page | 200 KB gzip (ceiling: 220 KB) |
| Reveal video | 1.44 MB desktop, 654 KB mobile, `+faststart` |
| LCP element | the idle loop's poster, a 69.8 KB jpeg; a `<video poster>` is not resized by the image optimizer |
| CLS | skeletons reserve final heights; overlays are `fixed` and reserve nothing |

Twelve scripts, the largest 69 KB: the React and Next runtime plus the eleven
islands, rather than a stray dependency.

---

## SEO

Per-machine `generateMetadata` (title, description, canonical, Open Graph and
Twitter), a 1200x630 share card, `Organization` + `WebSite` JSON-LD at the
root and `Product` + `Offer` per machine, `robots.txt`, `sitemap.xml`, a web
manifest, and icons at three sizes. The four out-of-scope routes render the
same body as `/about`, so they carry `noindex` and stay out of the sitemap.

Every overlay is a URL (`?checkout=1`, `?card=`, `?swap=`) and every one of
them canonicalises back to the bare machine page.

---

## Scope that was cut, and why

The brief asks for depth in the pull flow, not breadth. Marketplace,
Leaderboard, Resources and More are stubs that land on an about page.
Authentication is a seeded viewer, not a real session. There is no inventory
screen: a kept card is written to the database and the flow ends.

The card artwork and the cabinet video came with the brief. Nothing imitating
a real franchise was invented to fill gaps.

---

## With more time

- **Get the claw page under its budget.** The islands are small individually;
  the work is in what the framework brings and in whether the reveal route
  should share a bundle with the machine page at all.
- **An inventory.** Keeping a card currently ends the flow, which makes "keep"
  the less interesting of the two choices.
- **A real session**, which turns the owner-scoped pull URL from a correct
  mechanism into a shareable one.
- **A Lighthouse run on the deploy** rather than the local numbers above.

---

## Where the reasoning lives

`CLAUDE.md` is the rules file the whole project is built against: the server
and client boundary, what may import what, the budgets, and the conventions.
`docs/architecture.md` and `docs/structure.md` carry the two questions it
leaves open — where the boundary sits, and where files sit.
