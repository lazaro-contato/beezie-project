import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { MAILTO, ME } from "@/lib/me";
import { Nav, type NavActive } from "./Nav";

type SiteHeaderProps = {
  active: NavActive;
  clawSlug: string;
  /** Pre-rendered by the caller — see `app/_components/SiteChrome.tsx`,
   * which wraps `WalletBadgeSlot` in a Suspense boundary before passing it
   * in. */
  wallet: ReactNode;
};

const hireClasses =
  "tap-target flex h-10 items-center justify-center rounded-lg bg-primary px-[18px] text-sm font-bold whitespace-nowrap text-primary-foreground transition-colors hover:bg-[rgb(255,214,79)]";

function Monogram({ size }: { size: 40 | 48 }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary shadow-[inset_0_0_0_1px_rgb(60,60,60)]"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {ME.initials}
    </span>
  );
}

export function SiteHeader({ active, clawSlug, wallet }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="flex items-center gap-6 px-5 py-4 nav:px-12.5 nav:py-5.5">
        <Link
          href={`/claw/${clawSlug}` as Route}
          aria-label="Beezie, go to the claw"
          className="tap-target flex shrink-0 items-center justify-center nav:justify-start"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/brand/icon.svg"
            alt=""
            width={22}
            height={32}
            className="h-8 w-auto nav:hidden"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/brand/wordmark.svg"
            alt=""
            width={94}
            height={40}
            className="hidden h-10 w-auto nav:block"
          />
        </Link>

        <Nav active={active} clawSlug={clawSlug} className="hidden min-w-0 flex-1 nav:flex" />

        <div className="ml-auto flex items-center gap-3">
          <a href={MAILTO} className={`hidden nav:flex ${hireClasses}`}>
            Hire me
          </a>

          {wallet}

          <Link
            href="/profile"
            aria-label={`${ME.name}, view profile`}
            className="tap-target hidden items-center justify-center rounded-full transition-shadow hover:shadow-[0_0_0_2px_var(--color-primary)] nav:flex"
          >
            <Monogram size={40} />
          </Link>

          <details className="group/menu nav:hidden">
            <summary
              aria-label="Menu"
              className="flex size-11 cursor-pointer list-none items-center justify-center rounded-lg bg-card text-foreground shadow-[inset_0_0_0_1px_rgb(47,47,47)] transition-shadow marker:content-none hover:shadow-[inset_0_0_0_1px_var(--color-primary)] [&::-webkit-details-marker]:hidden"
            >
              <Menu size={22} aria-hidden="true" className="group-open/menu:hidden" />
              <X size={22} aria-hidden="true" className="hidden text-primary group-open/menu:block" />
            </summary>

              <div className="absolute inset-x-0 top-full hidden animate-[overlay-in_160ms_ease-out] flex-col gap-1 border-t border-border bg-background px-5 pt-3 pb-5 group-open/menu:flex">
              <Nav active={active} clawSlug={clawSlug} layout="stack" />

              <Link
                href="/profile"
                className="mt-2 flex items-center gap-3 border-t border-border pt-4"
              >
                <Monogram size={40} />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-foreground">{ME.handle}</span>
                  <span className="text-xs font-medium text-secondary-foreground">View profile</span>
                </span>
              </Link>

              <a href={MAILTO} className={`mt-1 h-12 justify-center ${hireClasses}`}>
                Hire me
              </a>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
