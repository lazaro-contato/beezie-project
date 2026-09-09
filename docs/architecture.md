# Architecture

The brief asks for as much SSR as possible in a flow that is client-side by
nature: video, animation, pointer tracking. This document is the answer to that
tension. It describes where the boundary sits, why it sits there, and how each
requirement of the brief rests on it.

---

## 1. Principle

Server Component is the default state. Client is the exception, and every
exception has a name, a file, and a justification.

The practical result: seven client islands across the whole project, all of them
leaves of the tree, all receiving initial state already rendered by the server.
None of them fetches data.

---

## 2. Cache Components

`next.config.ts` sets `cacheComponents: true`. In Next.js 16 this single flag
replaces the former `ppr`, `useCache` and `dynamicIO` flags, and it makes
Partial Prerendering the default App Router behaviour: a static HTML shell is
prerendered and served immediately, while dynamic content streams in as it
resolves. `experimental.ppr` and the `experimental_ppr` segment config were
removed and are not used here.

The caching model inverts relative to Next 15. Data fetching is dynamic by
default, and caching is opted into per page, component or function with the
`use cache` directive, bounded by `cacheLife` and invalidated by `cacheTag`.

That inversion suits this product well, because most of what the claw page shows
is genuinely per-request:

| Data | Treatment | Why |
| --- | --- | --- |
| Machine metadata, artwork, top items | `use cache` + `cacheTag('machine:'+slug)` | shared across all users, changes rarely |
| Odds | dynamic | the UI states they update every few seconds |
| Recent pulls | dynamic | a live feed |
| Wallet balance | dynamic | per user |
| Pull result | dynamic on first render | per user, then immutable |

The shape this produces is exactly what the brief asks for. The machine shell —
artwork, name, price, the start button — is prerendered and paints immediately.
The odds panel, the recent pulls feed and the wallet balance stream into
Suspense holes in the same document. There is no client-side waterfall and no
loading spinner on the critical path.

Two constraints follow from the flag, and both change decisions elsewhere in
this document.

**Node runtime only.** Cache Components requires the Node.js runtime, so no
route exports `runtime = 'edge'`. This applies to the dynamic OG image route and
to both SSE handlers, which would otherwise be natural edge candidates.

**Routes are preserved, not unmounted.** With Cache Components enabled, Next.js
wraps navigation in React `<Activity>`: the previous route is set to hidden
rather than unmounted, so its component state survives and reappears intact on
back navigation. Effects are cleaned up while hidden and recreated on return.
Section 5 explains why this reshapes where the video element lives.

---

## 3. Routes

```
/                                → redirect to the default machine
/claw/[slug]                     → machine page                 RSC
/claw/[slug]/pull/[pullId]       → pull result                  RSC
/api/odds/[slug]                 → SSE, live odds
```

Both page routes are Server Components, and each overlay is a search param on
the machine route rather than a route of its own: `?checkout=1`, `?card=`,
`?swap=1`, `?swapped=` are served by the `@sheet`, `@card`, `@swap` and
`@swapped` parallel slots. The one API route only streams; it serves no
first-load data.

### Why the pull has its own route

This is the project's central decision.

The obvious alternative would be holding the result in state and opening a
modal. That works, and it's what most implementations do. The cost is that the
product's most important moment becomes invisible to the server.

With its own route:

| Consequence | Effect |
| --- | --- |
| The reveal is server-rendered | card, value and actions ship in the HTML; no loading state |
| Refresh doesn't break | F5 on the reveal screen shows the same card |
| Back works | browser history reflects the flow |
| Latency disappears | the video's seconds cover the action plus navigation |

The URL is durable, not public. `getPull` is owner-scoped in SQL, so the link
recovers the result for the person who paid for it and returns a not-found to
anyone else; the route is `noindex` and disallowed in `robots.txt`. The cost is
real too: because the reveal is a navigation, the video and the swap
confirmation both have to live in the layout to survive it.

The video stops being decoration and becomes infrastructure: it is the time
window that lets the server do its work.

---

## 4. The map

### Server Components

| Component | Responsibility |
| --- | --- |
| `app/claw/[slug]/page.tsx` | fetches the machine, composes the page |
| `features/machine/MachineHero.tsx` | the cabinet still, the LCP element |
| `features/machine/PurchasePanel.tsx` | name, price, stepper, odds, promo |
| `features/machine/OddsPanel.tsx` | shell and initial odds values |
| `features/machine/TopItems.tsx` | grid of highest-value items |
| `features/machine/RecentPulls.tsx` | initial feed list |
| `app/claw/[slug]/pull/[pullId]/page.tsx` | fetches the pull, picks single or multi |
| `features/reveal/SingleReveal.tsx` | single-item reveal layout |
| `features/reveal/MultiRevealGrid.tsx` | grid of the N items |
| `entities/card/CardSlab.tsx` | slab, grading label, image |
| `features/checkout/WalletOption.tsx` | wallet row, balance |

### Client islands

| Island | Justification | Initial state |
| --- | --- | --- |
| `QuantityStepper.client` | local state, recomputes price | qty and unit price via props |
| `OddsPanel.client` | subscribes to SSE | odds rendered by the server |
| `PaymentSheet.client` | drag, focus trap, portal | wallets and summary via props |
| `RevealOrchestrator.client` | `HTMLVideoElement`, timing | video sources via props |
| `VideoPreloader.client` | `canplaythrough`, idle callback | URLs via props |
| `HoloCard.client` | `pointermove`, gyroscope | tier and image via props |
| `SwapSelection.client` | multi-select, timer | items and values via props |
| `SwapPendingButton.client` | `useFormStatus`, imported by an RSC | its label |
| `SwapSuccessDialog.client` | outlives the navigation it triggers | a module store |
| `TopProgressBar.client` | the router publishes no navigation events | none |

No island imports from `lib/db/` or `lib/pull/rng.ts`. The `import 'server-only'`
guard enforces that at build time, not by discipline.

### Crossings

```
client → server    Server Actions
                   createPull, swapPullItems, keepPullItems, setPref,
                   applyPromo, openCheckout, finishPull
                   input validated with zod

server → client    SSE, and only after first paint
                   /api/odds/[slug]
```

There is no third path. In particular, there is no `fetch` inside `useEffect`.

---

## 5. The pull pipeline

```
 user                  client                     server
────────────────────────────────────────────────────────────────────
 opens the page  →                            →  RSC renders machine,
                                                 odds, top items, pulls
                      VideoPreloader mounts,
                      waits for idle, downloads
                      the video, waits for
                      canplaythrough
                            │
 picks qty       →    QuantityStepper
 clicks Start    →    PaymentSheet opens
 confirms        →    ┌─ video.play()  ← synchronous, inside the gesture
                      └─ createPull()  →  validates, debits, draws
                                          (server-only rng),
                                          persists pull, returns pullId
                            │
                      router.push(/pull/[pullId])
                            │                →  RSC renders the reveal
                      video runs 2-4s
                      hits the reveal frame
                      → crossfade
                            │
 sees the card   ←    the route was already rendered underneath
 swap or keep    →    Server Action           →  updates, revalidatePath
```

### Where the video element lives

The video does not mount on the machine page. It mounts in
`app/claw/[slug]/layout.tsx`, shared by the machine page and the pull route.

This is a direct consequence of Cache Components. Because navigation hides the
previous route via `<Activity>` instead of unmounting it, a `<video>` owned by
the page segment would be hidden mid-playback at the exact moment we push to
`/pull/[pullId]`, and its effects would be torn down while it is still the thing
the user is watching. Mounting it one level up in the shared layout means it
never leaves the visible tree, so playback continues across the navigation
without a single frame lost.

The same rule applies to anything that must outlive the push: the payment sheet,
and any open dialog. Nothing whose lifetime spans the navigation belongs to the
page segment.

A useful side effect: because state is preserved rather than destroyed, going
back from the pull result to the machine page restores scroll position, the
quantity stepper's value and the odds subscription without a refetch.

### Order matters

`play()` comes first, synchronously, inside the click handler. Safari on iOS
only permits playback inside the user activation chain; an `await` before
`play()` ends that chain and playback is blocked. This is the one place in the
project where line ordering is semantically meaningful, and it is the most
likely mistake a candidate makes.

### Failures

| Failure | Behaviour |
| --- | --- |
| Action fails | hold the last frame, inline error, debit reverted |
| Action outlasts the video | hold the last frame with a quiet indicator |
| Video fails to load | skip straight to the reveal, no black screen |
| Invalid `pullId` | `not-found.tsx` |

No path ends in a black screen or an endless spinner.

---

## 6. Video preload

The brief calls this out explicitly, so it gets treated as a feature.

**Encode.** H.264 MP4 with `-movflags +faststart`, so the moov atom sits at
the front and playback can start before the download finishes. Two encodes,
1.44 MB desktop and 654 KB mobile, chosen server-side from the request rather
than renegotiated in the browser. A poster identical to frame 0.

**It does not compete with the first paint.** The element is server-rendered
with `preload="none"`, so it costs nothing up front. LCP is the cabinet still,
which carries `priority` on `next/image`.

**Then it warms up on idle.** `VideoPreloader.client` waits for
`requestIdleCallback` with a 2s ceiling, and only then flips the element to
`preload="auto"` and calls `load()`. It reads `navigator.connection` first and
**skips the preload entirely** on `saveData`, `2g` or `slow-2g`: a viewer on a
metered connection does not get 1.4 MB spent on their behalf for a video they
may never reach.

**Decode warm-up is the same call that unlocks iOS.** `playRevealVideoSync()`
runs inside the confirm click: it plays, then pauses and seeks to zero in the
same synchronous block. That claims Safari's user-activation flag and forces
the first frame to decode, and it costs none of the cut, because the pull
stage covers the screen for the next eight seconds.

**Cache.** `Cache-Control: public, max-age=31536000, immutable` on
`/video/:path*`, set in `next.config.ts`.

One reveal video is shared by every machine, so there is nothing per-machine
to prefetch.

---

## 7. Folder structure

```
app/                    routes, all RSC
  claw/[slug]/layout.tsx  owns the video element (survives navigation)
features/               by domain; .client.tsx marks the boundary
  machine/ checkout/ reveal/
lib/                    pure code, no JSX, no framework
  db/ pull/ prefs.ts money.ts env.ts
entities/card/          the shared entity every domain composes
docs/                   architecture.md, structure.md
public/video/           mp4 encodes and posters
```

`features/` is organized by domain instead of by file type. Things that change
together sit together, and the `.client.tsx` suffix turns counting islands into
an `ls` rather than a grep.

---

## 8. Verification

There is no automated suite. A change is verified by `typecheck`, `lint`,
`build`, and by driving the flow in a browser against a production build:
`pnpm start`, not `pnpm dev`, whose slower navigation hides real timing bugs
and invents ones production does not have.

The SSR claim is checked mechanically rather than by eye — the claw page is
requested with `curl` and the card names, prices, odds and top items have to
be present in the response with no JavaScript involved. `README.md` carries
that command and the walkthrough that covers every path.

---

## 9. Out of scope

Marketplace, leaderboard, resources, profile and real authentication were not
built. The brief points at the pull flow, and depth in one flow communicates more
than breadth across ten screens.

Those routes exist as stubs that land on an about page, so header navigation
doesn't look broken.
