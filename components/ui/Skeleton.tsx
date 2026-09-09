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
