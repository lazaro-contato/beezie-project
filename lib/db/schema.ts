import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";
import { newId } from "./ids";

export const machines = sqliteTable(
  "machines",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("mch")),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    // Superseded by `PURCHASE_POINTS_RATE` in lib/points.ts: purchase
    // points are a share of what was spent, not a per-machine constant.
    // The column stays because the seed still writes it and nothing reads
    // it; dropping it is a migration for no behavioural gain.
    pointsPerPull: integer("points_per_pull").notNull(),
    artworkUrl: text("artwork_url").notNull(),
    artworkWidth: integer("artwork_width").notNull(),
    artworkHeight: integer("artwork_height").notNull(),
    revealDesktopUrl: text("reveal_desktop_url").notNull(),
    revealDesktopPosterUrl: text("reveal_desktop_poster_url").notNull(),
    revealMobileUrl: text("reveal_mobile_url").notNull(),
    revealMobilePosterUrl: text("reveal_mobile_poster_url").notNull(),
    status: text("status", { enum: ["active", "restocking"] }).notNull(),
    sortOrder: integer("sort_order").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    check("machines_status_check", sql`${t.status} in ('active', 'restocking')`),
  ],
);

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => newId("usr")),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url").notNull(),
  beezieWalletCents: integer("beezie_wallet_cents").notNull(),
  externalWalletCents: integer("external_wallet_cents").notNull(),
  pointsBalance: integer("points_balance").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const promoCodes = sqliteTable(
  "promo_codes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("promo")),
    code: text("code").notNull().unique(),
    kind: text("kind", { enum: ["percent", "fixed"] }).notNull(),
    valueBps: integer("value_bps"),
    valueCents: integer("value_cents"),
    isActive: integer("is_active", { mode: "boolean" }).notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    timesRedeemed: integer("times_redeemed").notNull().default(0),
  },
  (t) => [
    check("promo_codes_kind_check", sql`${t.kind} in ('percent', 'fixed')`),
  ],
);

export const items = sqliteTable(
  "items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("itm")),
    machineId: text("machine_id")
      .notNull()
      .references(() => machines.id),
    name: text("name").notNull(),
    imageUrl: text("image_url").notNull(),
    // Nullable: the sealed collector box is unslabbed and has no back face
    // to photograph, and that row already exercises the null path for
    // `grader`/`grade`/`certNumber` below — this column reuses the same
    // seeded row for the same reason rather than inventing a second one.
    backImageUrl: text("back_image_url"),
    fmvCents: integer("fmv_cents").notNull(),
    tier: integer("tier").notNull(),
    grader: text("grader"),
    grade: text("grade"),
    certNumber: text("cert_number"),
    sortOrder: integer("sort_order").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("items_machine_tier_idx").on(t.machineId, t.tier),
    index("items_machine_fmv_idx").on(t.machineId, t.fmvCents),
  ],
);

export const machineTierWeights = sqliteTable(
  "machine_tier_weights",
  {
    machineId: text("machine_id")
      .notNull()
      .references(() => machines.id),
    tier: integer("tier").notNull(),
    weightBps: integer("weight_bps").notNull(),
  },
  (t) => [primaryKey({ columns: [t.machineId, t.tier] })],
);

export const pulls = sqliteTable(
  "pulls",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("pull")),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    machineId: text("machine_id")
      .notNull()
      .references(() => machines.id),
    quantity: integer("quantity").notNull(),
    unitPriceCentsAtPull: integer("unit_price_cents_at_pull").notNull(),
    discountCents: integer("discount_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    pointsAwarded: integer("points_awarded").notNull(),
    paymentMethod: text("payment_method", {
      enum: ["beezie_wallet", "external_wallet", "card"],
    }).notNull(),
    promoCodeId: text("promo_code_id").references(() => promoCodes.id),
    clientSeed: text("client_seed").notNull(),
    // the commitment, identical to what the machine page displayed.
    serverSeedHash: text("server_seed_hash").notNull(),
    // the reveal, written at commit time. Exposed only in the pull-result
    // DTO, never in any machine-page DTO.
    serverSeed: text("server_seed").notNull(),
    // the user's pull ordinal for this machine. UNIQUE with (userId,
    // machineId) below — without it the server could silently re-roll by
    // reusing an index.
    nonceIndex: integer("nonce_index").notNull(),
    // the weight vector snapshot at draw time.
    tierWeightsJson: text("tier_weights_json", { mode: "json" })
      .$type<number[]>()
      .notNull(),
    quoteExpiresAt: integer("quote_expires_at", {
      mode: "timestamp_ms",
    }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    check(
      "pulls_payment_method_check",
      sql`${t.paymentMethod} in ('beezie_wallet', 'external_wallet', 'card')`,
    ),
    unique("pulls_user_machine_nonce_unique").on(
      t.userId,
      t.machineId,
      t.nonceIndex,
    ),
    index("pulls_machine_created_idx").on(t.machineId, t.createdAt),
  ],
);

export const pullItems = sqliteTable(
  "pull_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("pli")),
    pullId: text("pull_id")
      .notNull()
      .references(() => pulls.id),
    itemId: text("item_id")
      .notNull()
      .references(() => items.id),
    drawIndex: integer("draw_index").notNull(),
    rollValue: integer("roll_value").notNull(),
    tier: integer("tier").notNull(),
    fmvCentsAtPull: integer("fmv_cents_at_pull").notNull(),
    swapValueCents: integer("swap_value_cents").notNull(),
    status: text("status", {
      enum: ["pending", "swapped", "kept"],
    }).notNull(),
    resolvedAt: integer("resolved_at", { mode: "timestamp_ms" }),
  },
  (t) => [
    check(
      "pull_items_status_check",
      sql`${t.status} in ('pending', 'swapped', 'kept')`,
    ),
    unique("pull_items_pull_draw_unique").on(t.pullId, t.drawIndex),
  ],
);
