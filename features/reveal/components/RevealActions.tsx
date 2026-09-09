import { revalidatePath } from "next/cache";
import { Check } from "lucide-react";
import { Money } from "@/components/ui/Money";
import { swapPointsFor } from "@/lib/points";
import { keepPullItems, swapPullItems } from "../actions";
import { REVEAL_FOOTER_HEIGHT, revealFooterVars } from "../constants";
import { SwapPendingButton } from "./SwapSelection.client";
import type { RevealItemDTO } from "../types";

type RevealActionsProps = {
  pullId: string;
  item: RevealItemDTO;
  expired: boolean;
  slug: string;
  finishPull: (formData: FormData) => Promise<void>;
};

export function RevealActions({ pullId, item, expired, slug, finishPull }: RevealActionsProps) {
  if (item.status === "swapped") {
    return (
      <div
        className="flex flex-col items-center gap-3.5 rounded-xl border border-border-2 bg-background px-6 py-6"
        style={{ minHeight: REVEAL_FOOTER_HEIGHT }}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500">
          <Check size={30} strokeWidth={2.6} className="text-primary-foreground" aria-hidden="true" />
        </div>
        <p className="text-xl font-semibold text-white">Swap success</p>
        <p className="text-center text-sm font-medium text-muted-foreground">
          <Money cents={item.swapValueCents} /> will be credited to your wallet shortly.
        </p>
        <p className="rounded-sm bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
          +{swapPointsFor(item.swapValueCents)} points
        </p>
        <BackToTheClaw slug={slug} finishPull={finishPull} />
      </div>
    );
  }

  if (item.status === "kept") {
    return (
      <div
        className="flex flex-col items-start gap-4"
        style={{ minHeight: REVEAL_FOOTER_HEIGHT }}
      >
        <p className="text-sm font-medium text-foreground">You kept this card.</p>
        <BackToTheClaw slug={slug} finishPull={finishPull} />
      </div>
    );
  }

  if (expired) {
    return (
      <p className="flex items-center text-sm text-muted-foreground" style={{ minHeight: REVEAL_FOOTER_HEIGHT }}>
        This offer has expired.
      </p>
    );
  }

  const selection = { pullId, pullItemIds: [item.pullItemId] };

  const REVEAL_ROUTE = "/claw/[slug]/pull/[pullId]";

  async function swapAction() {
    "use server";
    const result = await swapPullItems(selection);
    if (!result.ok) {
      revalidatePath(REVEAL_ROUTE, "page");
      return;
    }
    const finish = new FormData();
    finish.set("slug", slug);
    finish.set("swapped", pullId);
    await finishPull(finish);
  }

  async function keepAction() {
    "use server";
    await keepPullItems(selection);
    revalidatePath(REVEAL_ROUTE, "page");
  }

  return (
    <div
      className="flex min-h-[var(--reveal-footer-h)] flex-col gap-3 short:min-h-[var(--reveal-footer-row-h)] short:flex-row short:*:flex-1"
      style={revealFooterVars}
    >
      <form action={swapAction}>
        <SwapPendingButton>Swap now</SwapPendingButton>
      </form>
      <form action={keepAction}>
        <button
          type="submit"
          className="h-12 w-full rounded-md bg-secondary text-sm font-medium leading-5 text-secondary-foreground ring-1 ring-inset ring-border transition-colors hover:text-foreground"
        >
          Keep item
        </button>
      </form>
    </div>
  );
}

function BackToTheClaw({
  slug,
  finishPull,
}: {
  slug: string;
  finishPull: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={finishPull}>
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        className="flex h-11 items-center rounded-lg bg-secondary px-5 text-sm font-semibold text-foreground shadow-[inset_0_0_0_1px_var(--color-border-2)] transition-shadow hover:shadow-[inset_0_0_0_1px_var(--color-primary)]"
      >
        Back to the claw
      </button>
    </form>
  );
}
