import Link from "next/link";
import type { Route } from "next";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

export type NavActive =
  | "marketplace"
  | "claw"
  | "leaderboard"
  | "resources"
  | "more"
  /** Routes with no nav item of their own: nothing takes `aria-current`. */
  | "profile"
  | "about";

type NavItem = {
  readonly key: Exclude<NavActive, "profile" | "about">;
  readonly label: string;
  readonly href?: Route;
};

const NAV_ITEMS: readonly NavItem[] = [
  { key: "marketplace", label: "Marketplace", href: "/marketplace" },
  { key: "claw", label: "Claw" },
  { key: "leaderboard", label: "Leaderboard", href: "/leaderboard" },
  { key: "resources", label: "Resources", href: "/resources" },
  { key: "more", label: "More", href: "/more" },
];

const itemBase =
  "tap-target flex items-center justify-center gap-2 rounded-lg text-base leading-5 font-medium transition-colors";
const rowItem = "px-5 py-2.5";
const stackItem = "min-h-12 px-2 py-3";

type NavProps = {
  active: NavActive;
  clawSlug: string;
  className?: string;
  layout?: "row" | "stack";
};

export function Nav({ active, clawSlug, className, layout = "row" }: NavProps) {
  const stacked = layout === "stack";

  return (
    <nav
      className={cn(
        stacked ? "flex flex-col gap-1" : "flex items-center justify-center gap-1",
        className,
      )}
    >
      {NAV_ITEMS.map((item) => {
        const isClaw = item.key === "claw";
        const isActive = item.key === active;

        return (
          <Link
            key={item.key}
            href={isClaw ? (`/claw/${clawSlug}` as Route) : (item.href as Route)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              itemBase,
              stacked ? stackItem : rowItem,
              isClaw
                ? "text-primary"
                : "text-white hover:bg-card",
              isClaw && stacked && "bg-card font-semibold",
            )}
          >
            {isClaw ? <Sparkles size={14} aria-hidden="true" /> : null}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
