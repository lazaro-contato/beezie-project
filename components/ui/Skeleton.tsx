import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SkeletonProps = {
  height?: number | string;
  width?: number | string;
  className?: string;
};

/** A loading placeholder: the final box, fading. Nothing more — no shimmer
 *  sweep, no drawn stand-in for the thing that is coming. */
export function Skeleton({ height, width, className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      style={{ height, width }}
    />
  );
}

type SkeletonTextProps = {
  /** The copy that will replace it. Laid out but never painted. */
  children: ReactNode;
  className?: string;
};

/** A placeholder for a run of text, one bar per line it wraps to. The copy
 *  sets the line breaks, so copy of any length reserves exactly the height it
 *  will take. */
export function SkeletonText({ children, className }: SkeletonTextProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "animate-pulse select-none rounded-md bg-muted text-transparent box-decoration-clone",
        className,
      )}
    >
      {children}
    </span>
  );
}
