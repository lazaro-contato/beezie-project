import Link from "next/link";
import type { Route } from "next";
import { Mail } from "lucide-react";
import { MAILTO, ME } from "@/lib/me";
import { GithubMark } from "./GithubMark";

type ProfileCardProps = {
  clawSlug: string;
};

const rowButton =
  "flex h-12 items-center justify-center gap-2.5 rounded-lg bg-secondary text-sm font-semibold text-foreground transition-shadow shadow-[inset_0_0_0_1px_var(--color-border)] hover:shadow-[inset_0_0_0_1px_var(--color-primary)]";

export function ProfileCard({ clawSlug }: ProfileCardProps) {
  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-5 px-6 pt-12 pb-20">
      <div className="flex flex-col items-center gap-[18px] rounded-[20px] bg-[linear-gradient(134deg,rgb(35,35,35)_0%,rgb(27,27,27)_50%,rgb(26,26,26)_100%)] px-7 py-8 shadow-[inset_0_0_0_1px_var(--color-border)]">
        <span
          className="flex size-28 items-center justify-center rounded-full bg-secondary text-3xl font-bold text-primary shadow-[0_0_0_3px_var(--color-primary)]"
          aria-hidden="true"
        >
          {ME.initials}
        </span>

        <div className="flex flex-col items-center gap-1.5">
          <h1 className="text-2xl font-semibold text-white">{ME.name}</h1>
          <span className="text-sm font-medium text-primary">{ME.handle}</span>
          <span className="text-xs font-medium text-muted-foreground">{ME.meta}</span>
        </div>

        <p className="text-center text-[15px] leading-[1.7] text-pretty text-[rgb(200,200,200)]">
          {ME.note}
        </p>

        <div className="flex w-full flex-col gap-2.5 pt-1.5">
          <a
            href={MAILTO}
            className="flex h-12 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-[rgb(255,214,79)]"
          >
            Hire me
          </a>
          <a href={MAILTO} className={rowButton}>
            <Mail size={18} aria-hidden="true" />
            {ME.email}
          </a>
          <a href={ME.github} target="_blank" rel="noreferrer" className={rowButton}>
            <GithubMark />
            GitHub
          </a>
        </div>
      </div>

      <Link
        href={`/claw/${clawSlug}` as Route}
        className="self-center rounded-lg px-[18px] py-3 text-sm font-semibold text-secondary-foreground transition-colors hover:text-primary"
      >
        ← Back to the Claw
      </Link>
    </div>
  );
}
