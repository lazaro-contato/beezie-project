import { Skeleton } from "@/components/ui/Skeleton";
import { CARD_ASPECT, CARD_HERO_MAX_WIDTH } from "@/entities/card/constants";
import { revealFooterVars } from "../constants";

const HERO_SKELETON_HEIGHT = Math.round(CARD_HERO_MAX_WIDTH / CARD_ASPECT);

export function RevealLoadingPanel() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col p-4">
      <div className="flex min-h-0 flex-1 flex-col gap-10 rounded-2xl bg-card p-6 ring-1 ring-inset ring-border">
        <div className="flex shrink-0 justify-end" style={{ minHeight: 24 }}>
          <Skeleton height={24} width={24} className="rounded-md" />
        </div>
        <div className="grid items-center gap-8 px-6 pb-6 sm:grid-cols-2">
          <div className="mx-auto w-full" style={{ maxWidth: CARD_HERO_MAX_WIDTH }}>
            <Skeleton height={HERO_SKELETON_HEIGHT} className="w-full rounded-lg" />
          </div>
          <div className="flex w-full max-w-[460px] flex-col gap-10 py-6">
            <Skeleton height={50} className="w-4/5 rounded-md" />
            <div className="flex flex-col gap-2.5">
              <Skeleton height={27} width={110} className="rounded-md" />
              <Skeleton height={60} width={200} className="rounded-md" />
            </div>
            <div
              className="flex min-h-[var(--reveal-footer-h)] flex-col gap-3 short:min-h-[var(--reveal-footer-row-h)] short:flex-row short:*:flex-1"
              style={revealFooterVars}
            >
              <Skeleton height={48} className="w-full rounded-md" />
              <Skeleton height={48} className="w-full rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
