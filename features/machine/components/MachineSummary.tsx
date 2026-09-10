import type { ReactNode } from "react";
import { connection } from "next/server";
import { cn } from "@/lib/cn";
import type { MachineDTO } from "../types";

type MachineSummaryProps = {
  machine: Pick<MachineDTO, "name" | "description">;
  /** `SwapRateBadge`, inside its own Suspense boundary: it awaits
   * `searchParams`, and its skeleton is sized to the badge alone. */
  swapBadge: ReactNode;
  className?: string;
};

/**
 * Name, badge and description. The price lives in `ActionRow`, where it is a
 * running total rather than a unit price.
 */
export async function MachineSummary({ machine, swapBadge, className }: MachineSummaryProps) {
  // Per request, so it loads behind its skeleton with the rest of the page;
  // the machine it renders is already resolved and cached.
  await connection();

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold leading-8 text-foreground">{machine.name}</h1>
        {swapBadge}
      </div>
      <p className="text-sm font-medium leading-5 text-secondary-foreground">{machine.description}</p>
    </div>
  );
}
