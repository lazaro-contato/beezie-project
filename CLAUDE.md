# beezie-claw

Technical assessment. Reimplementation of the pull-and-reveal flow of a
marketplace for graded collectible cards. A user buys pulls on a claw machine,
watches an opening video, and receives one or more cards, which they can trade
for credit (swap) or keep.

Next.js 16 with `cacheComponents`, App Router, TypeScript, Tailwind,
Drizzle + SQLite. Animation is CSS and the Web Animations the islands drive
directly; no animation library.

## What the brief asks for

1. Mimic the pull and reveal experience
2. Responsive on web and mobile (iOS and Android)
3. Preload the reveal video
4. **Use as much SSR as possible**
5. Submission via GitHub repository

Item 4 is the dominant criterion. Every architectural decision is justified
against it.

## Scope

**In:** the claw page, payment sheet, pull server action, video with preload,
single-item reveal, multi-item reveal grid with swap.

**Out:** marketplace, leaderboard, resources, profile, real authentication.
Those routes exist as stubs with an empty state, nothing more.

Do not build anything outside this scope without asking. Breadth earns no
credit here; depth in the pull flow does.

## Non-negotiable rules

### 1. Server Component is the default

Every component is an RSC until there is a concrete technical reason it can't
be. The valid reasons are exactly these:

- local state that changes on interaction
- a DOM event handler
- a browser API (`HTMLVideoElement`, `pointermove`, `DeviceOrientationEvent`)
- a React hook that requires the client

"It's easier this way" is not a reason. If you are about to mark a component as
client, first try extracting only the interactive part into a smaller island
and leaving the rest on the server.

### 2. Name the boundary

Every file carrying `'use client'` ends in `.client.tsx`. No exceptions. The
boundary must be readable in an `ls`, not just in a grep.

Client islands allowed in this project:

| Island | Reason |
| --- | --- |
| `QuantityStepper.client.tsx` | local state, recomputes price |
| `OddsPanel.client.tsx` | subscribes to SSE; initial values via props |
| `PaymentSheet.client.tsx` | drag gesture, focus trap |
| `RevealOrchestrator.client.tsx` | `HTMLVideoElement`, timing |
| `VideoPreloader.client.tsx` | `canplaythrough`, idle callback |
| `HoloCard.client.tsx` | `pointermove`, gyroscope |
| `SwapSelection.client.tsx` | multi-select, timer |
| `SwapPendingButton.client.tsx` | `useFormStatus`, imported by an RSC |
| `SwapSuccessDialog.client.tsx` | outlives the navigation that produces it |
| `TopProgressBar.client.tsx` | the router publishes no navigation events |
| `MachineCrossfade.client.tsx` | document click listener, subscribes to the transition phase |

Eleven. Adding a twelfth means adding it to this table with the reason beside
it. The table is the count; if a `.client.tsx` file exists that is not listed
here, one of the two is wrong.

### 3. No client-side fetching

There is no `useEffect` fetching data in this project. Data arrives through an
RSC, or through props passed down from an RSC.

The only two permitted crossings:

- client to server: Server Actions
- server to client: SSE, and only after first paint

If a client component needs data, its RSC parent fetches it and passes it down.

### 4. The pull result has a URL

The reveal does not live in modal state. It lives at
`/claw/[slug]/pull/[pullId]`, rendered on the server.

Flow:

```
click Start Now
  ├─ video.play() SYNCHRONOUS in the handler   ← see rule 6
  └─ createPull() server action → persists → pullId
       ↓
router.push(`/claw/${slug}/pull/${pullId}`)
       ↓
video ends → the route already rendered underneath → crossfade
```

Consequences that are features: refresh doesn't lose the result, the back
button works, the link is shareable, and the action's latency hides behind the
video.

### 5. RNG and value live on the server only

`lib/pull/rng.ts` and `lib/pull/fairness.ts` start with `import 'server-only'`.
The draw happens on the server, is written to the database, and only then does
the client learn the outcome.

The client never receives: seeds, the weight table, or the result before it is
committed. No `Math.random()` decides rarity anywhere.

### 6. The video must play on iOS

Safari on iOS blocks any `play()` that isn't in the synchronous chain of a user
gesture. That means **an `await` before `play()` breaks the app**.

Correct:

```ts
function onStart() {
  videoRef.current?.play()                 // first, synchronous
  startTransition(() => createPull(...))   // then, in parallel
}
```

Wrong, and the mistake most candidates make:

```ts
async function onStart() {
  const pull = await createPull(...)  // the gesture expired here
  videoRef.current?.play()            // blocked
}
```

The element always carries `muted`, `playsInline` and `preload="auto"`.

### 7. Preferences come from cookies, read on the server

Mute, skip-reveal and reduced-motion live in cookies and are read with
`cookies()` in `lib/prefs.server.ts`. The server renders the correct state
already. There is no flash and no hydration mismatch.

Only reduced-motion still has a control on screen (the cabinet's animation
pill). The other two are honoured wherever they are read; nothing sets them.

### 8. No layout shift

`loading.tsx` and skeletons reserve the final height. The odds panel and the
recent pulls feed have fixed heights, because both update after paint. CLS
target: 0.

### 9. Cache Components is on; caching is opt-in

`next.config.ts` sets `cacheComponents: true`. This makes Partial Prerendering
the default App Router behaviour, so `experimental.ppr` and `experimental_ppr`
are neither needed nor available.

The model inverts from Next 15: **data fetching is dynamic by default, and you
opt into caching** with the `use cache` directive, scoped with `cacheLife` and
invalidated with `cacheTag`.

What that means here:

| Data | Treatment |
| --- | --- |
| Machine metadata, top items | `use cache` + `cacheTag('machine:'+slug)` |
| Odds, recent pulls, wallet balance | dynamic, streamed into the shell |
| A pull result | dynamic on first render, then immutable |

Do not sprinkle `use cache` to make warnings go away. Something is cached only
when it is genuinely shared across users and safe to serve stale.

Two constraints that follow:

- **Node runtime only.** Cache Components requires it. Never export
  `runtime = 'edge'`, including in the SSE route.
- **Routes stay mounted on navigation.** Cache Components uses React
  `<Activity>` to preserve state across client-side navigation instead of
  unmounting the previous route. Effects are torn down when a route is hidden
  and recreated when it returns. See rule 10.

### 10. The video element lives in the layout, not the page

Because `<Activity>` hides the previous route rather than unmounting it, a
`<video>` that lives on the claw page would be hidden mid-playback the moment we
navigate to the pull route, and its effects would be torn down.

The video therefore mounts in `app/claw/[slug]/layout.tsx`, which is shared by
the machine page and the pull route. It survives the navigation because it never
leaves the visible tree.

The same reasoning applies to the payment sheet and any open dialog: nothing
that must outlive the push to `/pull/[pullId]` may live inside the page segment.

### 11. A file is at most 400 lines

Components, actions, queries and helpers alike. Past 400 the file is doing
more than one job and gets split; 300 is the point to start looking for the
seam rather than the point to panic.

Split by responsibility, not by line count: a sub-component that owns a
distinct piece of the screen, a hook, a pure helper. Group the pieces in a
directory inside the feature (`features/reveal/components/swap/`), and put
files that are only functions in `features/<domain>/utils/`.

**Splitting an island does not create islands.** Rule 2 counts boundaries,
not files. Only the entry point carries `'use client'`; the pieces it is
split into are plain `.tsx` modules that inherit the boundary from it, and
they belong in a directory only that island imports from. A file gets the
directive, the `.client.tsx` name and an allow-list entry when a *Server*
Component imports it — that is a new boundary, and it is the only thing that
is.

## Code conventions

- Organize by domain (`features/machine/`), not by file type. The shared card
  entity is `entities/card/`; the UI kit is `components/ui/`; anything only a
  route uses lives under `app/_components/`
- `lib/` holds pure, testable code only, no JSX
- Every Server Action input is validated with zod before touching the database
- Money in integer cents. Format only at the edge, with `Intl.NumberFormat`
- No `any`. No `@ts-ignore` without a comment explaining it
- Tailwind for layout; CSS Modules when the effect demands it
  (`HoloCard.module.css`)
- Animations run unconditionally. There is no `@media (prefers-reduced-motion:
  reduce)` block anywhere in our CSS: suppressing motion here deletes the
  product's signature moment. The cabinet's "Animation off" pill pauses the
  idle loop and touches nothing else
- Sentence case in interface copy. Verb first on buttons: "Swap now", not
  "Submit"

### Comments

Comment the *why* of a non-obvious choice, in one or two lines. Nothing else.

Do not write:

- history: what the code used to do, what a refactor changed, what was tried
- provenance: decision-log ids, `docs/plans/*` pointers, "rule N", design
  reference line numbers, measurements from a session
- restatements of what the line below already says
- process notes addressed to whoever is editing the file

The decision log is where the reasoning lives. A reader of the source wants
the code and the one sentence that stops them breaking it.

## Commands

```bash
pnpm install
pnpm db:reset         # rm .data, drizzle-kit push, seed
pnpm dev

pnpm build            # seeds, then builds; `pnpm start` to run it
pnpm typecheck        # tsc --noEmit
pnpm lint
pnpm db:push          # schema only
pnpm db:seed          # data only
```

Run `pnpm typecheck` and `pnpm lint` after every edit. Do not hand back work
that fails either one.

**There is no test suite.** A change is verified by `typecheck`, `lint`,
`build`, and by driving the flow in a browser against `pnpm start` — not
against `pnpm dev`, where the navigation is slow enough to hide timing bugs
and to invent ones that do not exist in production. `README.md` has the
walkthrough that covers every path.

## Budgets

- Bundle per client island: under 15 KB gzip
- Total JS on the claw page: under 220 KB gzip, 200 KB today. Measure it by
  summing the gzip size of the scripts the page references; the build output
  does not print per-route sizes
- LCP under 2s on simulated 4G
- CLS equal to 0
- Reveal video under 1.5 MB — 1.44 MB desktop, 652 KB mobile

If a change blows past any of these, stop and report before continuing.

## Assets

The reveal video was supplied with the brief. It lives in `public/video/` as
two encodes, desktop and mobile, both with `-movflags +faststart`, a poster
identical to frame 0, and the audio 6 dB under the master: iOS ignores the
element's `volume`, so the level every device hears lives in the file. The
cabinet's idle loop sits beside them.

Do not *source* third-party intellectual property for this repository. Assets
that came with the brief — the graded slab photographs, the cabinet video, the
brand marks — are supplied material and stay; inventing names or artwork that
imitate a real franchise is what the rule forbids.

## The README is a deliverable

`README.md` at the root must contain: how to run it, where each of the brief's
four requirements lives, the server/client boundary map, the video preload
strategy including the iOS pitfall, SSR evidence via `curl`, the walkthrough
that replaces the deleted test suite, the measured numbers, the scope that was
cut and why, and what you'd do with more time.

