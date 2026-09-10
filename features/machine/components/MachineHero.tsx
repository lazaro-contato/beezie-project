import type { CSSProperties } from "react";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { ARTWORK_PANEL_HEIGHT } from "../constants";
import type { MachineDTO } from "../types";

type MachineHeroProps = {
  machine: Pick<MachineDTO, "name">;
};

/**
 * The cabinet's box, and what it shows while the cabinet loads.
 *
 * It draws no picture of the cabinet: `MachineIdleStage` streams the video in
 * over it, and until the video's poster paints this is a skeleton.
 */
export function MachineHero({ machine }: MachineHeroProps) {
  return (
    <Panel
      // The video over this box is `aria-hidden`, so the box carries the name.
      role="img"
      aria-label={machine.name}
      // Height in classes, not inline: below `nav` the cabinet is capped at
      // 56vh so the price and Start stay near the fold, and at `nav` it
      // returns to the fixed `ARTWORK_PANEL_HEIGHT` the two columns match on.
      // An inline height would beat the `nav:` variant, so the constant
      // arrives as a custom property instead.
      className="flex h-[min(var(--artwork-h),56vh)] items-center justify-center overflow-hidden p-4 nav:h-full nav:min-h-[var(--artwork-h)] nav:p-6"
      style={{ "--artwork-h": `${ARTWORK_PANEL_HEIGHT}px` } as CSSProperties}
    >
      {/* A size container, so the skeleton can be the largest square that fits.
          The 1:1 video is letterboxed into the same square of the whole panel,
          so its poster covers this one entirely rather than leaving pulsing
          bands around it. */}
      <div className="flex h-full w-full items-center justify-center [container-type:size]">
        <Skeleton className="aspect-square w-[min(100cqw,100cqh)] rounded-xl" />
      </div>
    </Panel>
  );
}
