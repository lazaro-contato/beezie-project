import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import type { Route } from "next";
import { cn } from "@/lib/cn";
import {
  CRATE_ICON_HEIGHT,
  CRATE_ICON_WIDTH,
  MACHINE_CRATE_ICONS,
  type MachineSlug,
} from "@/lib/machines";
import { Money } from "@/components/ui/Money";
import { getMoreMachines } from "../queries";
import { MORE_MACHINE_TILE_HEIGHT } from "../constants";

type MoreMachinesProps = {
  currentSlug: string;
  className?: string;
};

const CRATE_SHADOW = "drop-shadow(0 8px 8px rgba(3,3,3,0.35)) drop-shadow(0 2px 3px rgba(3,3,3,0.25))";

export async function MoreMachines({ currentSlug, className }: MoreMachinesProps) {
  // Per request, so it loads behind its skeleton with the rest of the page;
  // the query underneath stays cached.
  await connection();
  const machines = await getMoreMachines();

  return (
    <div className={cn("flex flex-col justify-end gap-2.5 nav:grow", className)}>
      <h2 className="text-base font-semibold text-foreground">More claw machines</h2>
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {machines.map((machine) => (
          <Link
            key={machine.slug}
            href={`/claw/${machine.slug}` as Route}
            aria-current={machine.slug === currentSlug ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-1.5 text-center",
              "transition-shadow hover:shadow-[inset_0_0_0_1px_var(--color-primary)]",
              machine.slug === currentSlug
                ? "shadow-[inset_0_0_0_1px_var(--color-primary)]"
                : "shadow-[inset_0_0_0_1px_var(--color-border-2)]",
            )}
            style={{ height: MORE_MACHINE_TILE_HEIGHT }}
          >
            <Image
              src={MACHINE_CRATE_ICONS[machine.slug as MachineSlug]}
              alt=""
              width={CRATE_ICON_WIDTH}
              height={CRATE_ICON_HEIGHT}
              className="shrink-0 object-contain"
              style={{ filter: CRATE_SHADOW }}
            />
            <div className="flex w-full flex-col items-center gap-1">
              <Money cents={machine.unitPriceCents} className="text-sm font-semibold text-foreground" />
              <p className="w-full truncate text-xs font-medium leading-4 text-secondary-foreground">
                {machine.name}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
