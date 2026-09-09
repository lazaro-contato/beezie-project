import { z } from "zod";
import { MACHINE_SLUGS } from "@/lib/machines";
import { MAX_PULL_QUANTITY, MIN_PULL_QUANTITY } from "@/lib/pull/limits";

export const createPullSchema = z.object({
  slug: z.enum(MACHINE_SLUGS),
  quantity: z.number().int().min(MIN_PULL_QUANTITY).max(MAX_PULL_QUANTITY),
  paymentMethod: z.enum(["beezie_wallet", "external_wallet"]),
  clientSeed: z
    .string()
    .regex(/^[A-Za-z0-9_-]{1,64}$/)
    .optional(),
  /**
   * The one money value the client sends, and it is assert-only: the server
   * computes its own total from its own numbers and refuses when that total
   * exceeds this value. It can cause a refusal (`PRICE_CHANGED`); it can
   * never cause a charge.
   */
  expectedTotalCents: z.number().int().nonnegative(),
});

export type CreatePullInput = z.infer<typeof createPullSchema>;

export const applyPromoSchema = z
  .object({
    intent: z.enum(["apply", "clear"]).default("apply"),
    code: z.string().trim().min(1).max(32).optional(),
  })
  .refine((data) => data.intent === "clear" || Boolean(data.code), {
    message: "code is required to apply a promo",
    path: ["code"],
  });

export type ApplyPromoInput = z.infer<typeof applyPromoSchema>;
