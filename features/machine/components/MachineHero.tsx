import type { CSSProperties } from "react";
import Image from "next/image";
import { Panel } from "@/components/ui/Panel";
import { IDLE_POSTER_SIZE, IDLE_VIDEO_POSTER } from "../idle-media";
import { ARTWORK_PANEL_HEIGHT } from "../constants";
import type { MachineDTO } from "../types";

type MachineHeroProps = {
  machine: Pick<MachineDTO, "name">;
};

/**
 * The cabinet, and the LCP element.
 *
 * The image is the idle loop's own first frame, so the still and the video
 * that covers it once `MachineIdleStage` streams are the same picture and the
 * handover is invisible. Its placeholder is a fading box the size of the
 * final one rather than a drawn stand-in for the cabinet.
 */
export function MachineHero({ machine }: MachineHeroProps) {
  return (
    <Panel
      // Height in classes, not inline: below `nav` the cabinet is capped at
      // 56vh so the price and Start stay near the fold, and at `nav` it
      // returns to the fixed `ARTWORK_PANEL_HEIGHT` the two columns match on.
      // An inline height would beat the `nav:` variant, so the constant
      // arrives as a custom property instead.
      className="flex h-[min(var(--artwork-h),56vh)] items-center justify-center overflow-hidden p-4 nav:h-full nav:min-h-[var(--artwork-h)] nav:p-6"
      style={{ "--artwork-h": `${ARTWORK_PANEL_HEIGHT}px` } as CSSProperties}
    >
      {/* `max-h/max-w` with both dimensions auto, rather than `fill` with
          `object-contain`: on a replaced element that produces the same fit,
          but the element's own box ends up equal to the painted box instead
          of to the panel. That is what lets the skeleton be its background —
          a `fill` image leaves letterbox bands where a separate placeholder
          behind it would still show after the photograph had painted. */}
      <div className="flex h-full w-full items-center justify-center">
        <Image
          src={IDLE_VIDEO_POSTER}
          alt={machine.name}
          width={IDLE_POSTER_SIZE}
          height={IDLE_POSTER_SIZE}
          priority
          sizes="(min-width: 1060px) 50vw, 100vw"
          className="h-auto max-h-full w-auto max-w-full animate-pulse rounded-xl bg-muted"
        />
      </div>
    </Panel>
  );
}
