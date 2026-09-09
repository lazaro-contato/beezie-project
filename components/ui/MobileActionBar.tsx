import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type MobileActionBarProps = {
  children: ReactNode;
  className?: string;
};

/**
 * A pure positioning wrapper with no domain sizing constant of its own —
 * `components/**` may import `lib/**` only. The bar's footprint below `nav`
 * (`ACTION_ROW_HEIGHT_MOBILE` in `features/machine/constants.ts`) is
 * compositional: `ActionRow` fixes its own height at
 * `ACTION_ROW_HEIGHT` regardless of breakpoint, and this wrapper adds 8px of
 * padding top and bottom.
 *
 * Below `nav` the bar is pinned to the viewport bottom, with
 * `env(safe-area-inset-bottom)` padding for the iOS home indicator
 * (`viewportFit: "cover"` in the root layout is what makes that value
 * non-zero). At `nav` and up it renders in flow, wherever its caller's
 * `order-*` places it.
 */
export function MobileActionBar({ children, className }: MobileActionBarProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background px-4 pt-2",
        "pb-[calc(env(safe-area-inset-bottom)+0.5rem)]",
        "nav:static nav:z-auto nav:border-0 nav:bg-transparent nav:px-0 nav:pt-0 nav:pb-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
