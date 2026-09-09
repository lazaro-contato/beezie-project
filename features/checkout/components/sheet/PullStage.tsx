import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { PULL_STAGE_Z } from "../../pull-stage";

type PullStageProps = {
  /** Server-rendered preview cards; this component only indexes into them. */
  pullPreview: readonly ReactNode[];
  previewIndex: number;
  pullProgress: number;
  progressWidth: (progress: number) => string;
};

/** The opaque panel covering the sheet while a pull is created: a carousel of
 *  what the machine can give, over a progress bar. */
export function PullStage({ pullPreview, previewIndex, pullProgress, progressWidth }: PullStageProps) {
  return (
  <div
    role="status"
    aria-live="polite"
    aria-label="What you can pull"
    className="fixed inset-0 flex items-start justify-center overflow-auto bg-background/90 p-6 backdrop-blur-lg"
    style={{ zIndex: PULL_STAGE_Z }}
  >
    <div className="m-auto flex w-[490px] max-w-full flex-col gap-5 rounded-xl border border-border-2 bg-card p-6">
      <p className="text-center text-sm font-semibold text-foreground">What you can pull</p>

      {pullPreview.length > 0 ? (
        <div className="flex flex-col items-center gap-3.5">
          {pullPreview.map((frame, index) => (
            <div key={index} hidden={index !== previewIndex} className="w-full">
              {frame}
            </div>
          ))}
          {pullPreview.length > 1 ? (
            <div className="flex items-center gap-[5px]" aria-hidden="true">
              {pullPreview.map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    "h-1 rounded-full transition-all",
                    index === previewIndex ? "w-[18px] bg-foreground" : "w-1 bg-muted-foreground/60",
                  )}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="relative flex h-11 items-center justify-center overflow-hidden rounded-md bg-primary/25">
        <div
          className="absolute bottom-0 left-0 top-0 bg-primary"
          style={{ width: progressWidth(pullProgress) }}
        />
        <span className="relative flex items-center gap-2 text-sm font-semibold text-foreground">
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          Do not refresh
        </span>
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center gap-2 text-sm font-semibold text-primary-foreground"
          style={{ clipPath: `inset(0 calc(100% - ${progressWidth(pullProgress)}) 0 0)` }}
        >
          <Loader2 size={16} className="animate-spin" />
          Do not refresh
        </span>
      </div>
    </div>
  </div>
  );
}
