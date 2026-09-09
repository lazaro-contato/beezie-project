import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { MachineDTO } from "../types";

type MachineSummaryProps = {
  machine: Pick<MachineDTO, "name" | "description">;
  /** `SwapRateBadge`, threaded from `app/claw/[slug]/page.tsx` inside its own
   * Suspense boundary — it awaits `searchParams`, which this component must
   * not, since it belongs to the prerendered shell. */
  swapBadge: ReactNode;
  className?: string;
};

/**
 * Name, badge and description. Static, part of the prerendered shell
 * alongside `MachineHero`. The price moved to `ActionRow`, where it is a
 * running total rather than a unit price.
 */
export function MachineSummary({ machine, swapBadge, className }: MachineSummaryProps) {
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
