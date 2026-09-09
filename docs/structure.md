# Structure

`architecture.md` decides where the server/client boundary sits. This document
decides where files sit, and what may import what. It exists because the
boundary rules alone leave one question open: when two features need the same
thing, where does that thing live?

---

## 1. The reuse problem, stated concretely

The graded slab is the same object in six different layouts:

| Surface | Shape |
| --- | --- |
| Top Items | tile, name, FMV |
| Recent Pulls | 64px thumb, name, buyer, price |
| Payment Summary | 88px thumb, name, price, points |
| Single reveal | large hero, swap value, two actions |
| Multi reveal grid | tile, name, "Swap for $X", selection state |
| What you can pull | tile in a carousel |

Six implementations of one object is the failure mode this structure is
designed to prevent. The unit of reuse is not "a Card component"; it is a
shared domain entity with composition variants. That entity gets its own
top-level folder, `entities/card/`, and every domain composes it.

---

## 2. Layers

```
app/            routes, plus the shell and page UI only a route uses
   ↓
features/       domains: machine, checkout, reveal
   ↓
entities/card/  the shared entity, in all its forms
   ↓
components/ui/  UI kit with no domain knowledge
   ↓
lib/            pure, testable, no JSX
```

Dependencies point down and never sideways. `components/ui/Button` does not
know what a pull is. `features/machine` does not import `features/reveal`, and
neither imports a route. When two domains need the same thing, it is promoted
into `components/ui/` or `entities/card/` rather than imported across.

Four things live in `app/` that are not routes, and each is there because
only routes use it: `SiteChrome`, `SiteHeader`/`Nav` (the shell), the top
progress bar, and `about/` (the copy those six stub pages render).

---

## 3. Tree

```
app/
  layout.tsx                          fonts, tokens, metadata, JSON-LD
  page.tsx                            redirect to the default machine
  robots.ts sitemap.ts manifest.ts    generated at request time
  icon.svg apple-icon.png favicon.ico opengraph-image.png
  about|profile|marketplace|leaderboard|resources|more/page.tsx
  _components/
    SiteChrome.tsx SiteHeader.tsx Nav.tsx    the shell, used only by routes
    TopProgressBar.client.tsx                ISLAND 10
    JsonLd.tsx
    about/  AboutMe.tsx ProfileCard.tsx GithubMark.tsx
  claw/[slug]/
    layout.tsx                        owns the reveal video and every overlay
    page.tsx  not-found.tsx
    @sheet/ @card/ @swap/ @swapped/   parallel slots, one per overlay
    pull/[pullId]/  page.tsx loading.tsx not-found.tsx
  api/odds/[slug]/route.ts            SSE

features/
  machine/
    components/
      MachineHero.tsx                 RSC   the cabinet still, LCP
      MachineIdleStage.tsx            RSC   reads prefs
      MachineStage.tsx                RSC   the idle <video> and its pill
      MachineSummary.tsx PurchasePanel.tsx ActionRow.tsx   RSC
      OddsPanel.tsx                   RSC   shell and initial values
      OddsPanel.client.tsx            ISLAND 2
      QuantityStepper.client.tsx      ISLAND 1
      ToggleForm.tsx                  RSC   <form action={setPref}>
      SwapRateBadge.tsx SwapRateDialog.tsx  RSC
      TopItems.tsx RecentPulls.tsx MoreMachines.tsx skeletons.tsx  RSC
    queries.ts actions.ts schema.ts types.ts constants.ts
    idle-media.ts swap-rate.ts
  checkout/
    components/
      PaymentSheet.client.tsx         ISLAND 3, receives RSC children
      sheet/PullStage.tsx             the eight-second waiting state
      PaymentSummary.tsx WalletOption.tsx PayMethodList.tsx  RSC
      PromoCodeForm.tsx PullPreviewCard.tsx WalletBadgeSlot.tsx  RSC
    queries.ts actions.ts schema.ts types.ts constants.ts pull-stage.ts
  reveal/
    components/
      RevealOrchestrator.client.tsx   ISLAND 4
      VideoPreloader.client.tsx       ISLAND 5
      SwapSelection.client.tsx        ISLAND 7
      SwapSuccessDialog.client.tsx    ISLAND 9, mounted in the layout
      swap/SwapPendingButton.client.tsx   ISLAND 8, imported by an RSC
      swap/SwapHand.tsx swap/SwapFooter.tsx   the panel, split by responsibility
      SingleReveal.tsx MultiRevealGrid.tsx RevealActions.tsx  RSC
      RevealStage.tsx SwapSuccessPanel.tsx skeletons.tsx      RSC
    hooks/    useCountdown useHandFlip useHandMeasurements
    utils/    hand-layout.ts
    queries.ts queries.pull.ts actions.ts schema.ts types.ts source.ts

entities/card/
  components/
    CardSlab.tsx                      RSC   frame, image, grading label
    CardTile.tsx CardRow.tsx CardHero.tsx CardDetail.tsx CardArt.tsx  RSC
    CardStack.tsx                     RSC   the sizing wrapper
    HoloCard.client.tsx               ISLAND 6, wraps CardSlab
  types.ts constants.ts               CardDTO, the contract everyone shares

components/ui/
  Button Badge Money RarityChip Separator Skeleton Field Panel
  WalletBadge MobileActionBar

lib/
  db/       client.ts schema.ts ids.ts seed.ts seed-data.ts seed/catalogue.ts
  pull/     rng.ts fairness.ts draw.ts odds.ts   import 'server-only'
            tiers.ts limits.ts                   pure
  video-gesture.ts nav-progress.ts quantity-memory.ts swap-outcome.ts
  money.ts pricing.ts points.ts progress.ts format.ts time.ts
  prefs.ts prefs.server.ts auth.ts env.ts site.ts machines.ts
  card-facts.ts device.ts image.ts market-tick.ts cn.ts me.ts
```

Nothing under `components/ui/` carries `'use client'`: the kit is universal.
The ten islands marked above are the only client files in the project, and the
name is the marker — that is what makes the rule checkable with `ls` rather
than aspirational.

---

## 4. Anatomy of a feature

Every folder under `features/` has at most these five slots, always named the
same way:

| Slot | Role | Marker |
| --- | --- | --- |
| `components/` | JSX. RSC by default; `.client.tsx` names the exception | — |
| `queries.ts` | reads. `use cache` + `cacheTag` where genuinely shared | `import 'server-only'` |
| `actions.ts` | writes. zod validation on the first line | `'use server'` |
| `schema.ts` | zod schemas, kept out of the `'use server'` file so anything may import them | — |
| `types.ts` | DTOs: what is allowed to cross to the client | — |

`types.ts` is what enforces rule 5 in practice. Islands accept only types
declared there, never Drizzle row types. A `toCardDTO()` in `queries.ts` does
the conversion and is the single place where it is decided what the client may
see. Seeds and the weight table have no DTO, so they cannot leak.

---

## 5. Two patterns that buy SSR

### Shell / island pair

When something updates after paint, the RSC renders the initial state and the
island takes over from there. Both files sit next to each other and share a
base name.

```tsx
// OddsPanel.tsx  (RSC)
export async function OddsPanel({ slug }: { slug: string }) {
  const odds = await getOdds(slug)                 // dynamic, streamed
  return <OddsPanelLive slug={slug} initial={odds} />
}
```

No flash, no spinner, and the percentages are present in the HTML that `curl`
returns.

### Server children through a client island

`PaymentSheet.client` owns the drag gesture and the focus trap. Its contents do
not:

```tsx
// app/claw/[slug]/layout.tsx
<PaymentSheet>
  <PaymentSummary machine={machine} />   {/* RSC, ships no JS */}
</PaymentSheet>
```

`RevealOrchestrator` uses the same mechanism around the layout's `{children}`,
which means it wraps the entire reveal route while that route stays server
rendered. This is what lets the video survive `<Activity>` (rule 10) without
pulling the reveal into the client.

---

## 6. Import rules

| From | May import |
| --- | --- |
| `app/**` | features, entities, components, lib |
| `features/{machine,checkout,reveal}` | `entities/card`, components, lib |
| `entities/card` | components, lib, `lib/pull/tiers` |
| `components/**` | `lib` only |
| `lib/**` | nothing above |
| anything below `app/` | never `app/**` |
| any `*.client.tsx` | never `lib/db`, `lib/pull/*`, `**/queries*.ts` |

The last two rows are configured as `import/no-restricted-paths` in
`eslint.config.mjs`. The final row is already guaranteed at build time by
`server-only`; the lint rule exists so the error appears in the editor instead
of in the build. The glob is `**/queries*.ts`, not `**/queries.ts`, so that
`features/reveal/queries.pull.ts` sits inside the same boundary as its
sibling.

---

## 7. Design surface to component map

| Screen | Composition |
| --- | --- |
| Claw page, left | `MachineHero` + `MachineIdleStage` over `MachineStage` |
| Claw page, right | `MachineSummary` + `QuantityStepper` + `PromoCodeForm` + `OddsPanel` + `MoreMachines` |
| Top Items | `TopItems` over `CardTile` |
| Recent Pulls | `RecentPulls` over `CardRow` |
| Payment sheet | `PaymentSheet.client` wrapping `PaymentSummary` over `CardRow` |
| Reveal, 1 item | `SingleReveal` over `CardHero` + `HoloCard.client` + `RevealActions` |
| Reveal, N items | `MultiRevealGrid` over `CardTile` + `SwapSelection.client` |
| What you can pull | the payment sheet's `PullStage` over `PullPreviewCard` |

Five of the eight surfaces are variants of one entity. The map is the argument
for `entities/card/` existing.

### The "Do not refresh" state

The carousel with the spinning "Do not refresh" bar is not a browse feature;
it is the waiting state while the pull resolves, and the payment sheet owns it
for a fixed eight seconds.

`pull/[pullId]/loading.tsx` renders `RevealLoadingPanel` instead of that
carousel, because `loading.tsx` receives no props: it has no `slug` to fetch
against. The panel is a fixed-size placeholder with no data dependency, sized
as a reasonable approximation of the single- or multi-item layout rather than
a match to either, since it cannot know which one it is waiting for.
