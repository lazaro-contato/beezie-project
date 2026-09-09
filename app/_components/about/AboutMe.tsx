import { ArrowRight, Mail } from "lucide-react";
import { MAILTO, ME } from "@/lib/me";
import { GithubMark } from "./GithubMark";

type AboutMeProps = {
  /** The nav section that led here. Present on the four out-of-scope
   * routes, absent on `/about` itself. */
  section?: string;
};

const buttonBase =
  "flex h-12 items-center gap-2.5 rounded-lg px-5 text-sm font-semibold transition-shadow";
const secondaryButton = `${buttonBase} bg-secondary text-foreground shadow-[inset_0_0_0_1px_var(--color-border-2)] hover:shadow-[inset_0_0_0_1px_var(--color-primary)]`;
const primaryButton =
  "flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-[rgb(255,214,79)]";

export function AboutMe({ section }: AboutMeProps) {
  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-12 px-6 pt-10 pb-20">
      {section ? (
        <p className="rounded-xl border border-border bg-card px-5 py-4 text-sm text-secondary-foreground">
          <span className="font-semibold text-foreground">{section}</span> is out of scope for this
          build. The brief asks for depth in the pull flow, not breadth, so here is the person who
          made the Claw instead.
        </p>
      ) : null}

      <div className="flex max-w-[68ch] flex-col gap-5">
        <span className="text-xs font-semibold tracking-[0.12em] uppercase text-primary">
          About me
        </span>
        <h1 className="text-[32px] leading-[1.15] font-semibold text-white sm:text-[38px] nav:text-[44px] nav:leading-[1.1]">
          {ME.name}
        </h1>
        <p className="text-base leading-[1.6] font-medium text-secondary-foreground sm:text-lg">
          {ME.role}
        </p>
        <p className="text-sm font-medium text-muted-foreground">{ME.meta}</p>
        <p className="max-w-[46ch] text-base leading-[1.75] text-pretty text-[rgb(200,200,200)]">
          {ME.bio}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <a href={ME.github} target="_blank" rel="noreferrer" className={secondaryButton}>
            <GithubMark />
            GitHub
          </a>
          <a href={MAILTO} className={secondaryButton}>
            <Mail size={18} aria-hidden="true" />
            Email me
          </a>
          <a href={MAILTO} className={primaryButton}>
            Hire me
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))]">
        {ME.facts.map((fact) => (
          <div
            key={fact.title}
            className="flex flex-col gap-2 rounded-xl bg-card p-5 shadow-[inset_0_0_0_1px_var(--color-border)]"
          >
            <span className="text-[15px] font-semibold text-foreground">{fact.title}</span>
            <span className="text-sm leading-[1.6] text-pretty text-secondary-foreground">
              {fact.body}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-[linear-gradient(120deg,rgb(35,35,35)_0%,rgb(26,26,26)_100%)] p-7 shadow-[inset_0_0_0_1px_var(--color-border)]">
        <div className="flex flex-col gap-1.5">
          <span className="text-lg font-semibold text-white sm:text-xl">
            Got a product that needs this level of polish?
          </span>
          <span className="text-sm font-medium text-secondary-foreground">
            This whole Claw experience was designed and built by me.
          </span>
        </div>
        <a href={MAILTO} className={`${primaryButton} shrink-0`}>
          Hire me
        </a>
      </div>
    </div>
  );
}
