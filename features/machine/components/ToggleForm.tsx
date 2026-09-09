import type { LucideIcon } from "lucide-react";
import { setPref } from "../actions";

export type ToggleFormProps = {
  slug: string;
  prefKey: "muted" | "reducedMotion" | "skipReveal";
  /** The preference's own current boolean value — not a UI-inverted "is
   *  this the good state" flag. `aria-pressed` mirrors it directly, and the
   *  submitted `value` is always its opposite (a click always flips it). */
  current: boolean;
  Icon?: LucideIcon;
  ActiveIcon?: LucideIcon;
  nextLabel: string;
  shortLabel: string;
};

const PILL_CLASSES =
  "inline-flex h-11 items-center gap-[9px] rounded-full bg-[rgba(19,19,19,0.6)] px-[18px] text-[15px] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] backdrop-blur-md transition-colors hover:bg-[rgba(19,19,19,0.82)]";

export function ToggleForm({
  slug,
  prefKey,
  current,
  Icon,
  ActiveIcon,
  nextLabel,
  shortLabel,
}: ToggleFormProps) {
  const CurrentIcon = current ? ActiveIcon : Icon;
  const nextValue = current ? "off" : "on";

  return (
    <form action={setPref}>
      <input type="hidden" name="key" value={prefKey} />
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        name="value"
        value={nextValue}
        aria-pressed={current}
        aria-label={nextLabel}
        className={PILL_CLASSES}
      >
        {CurrentIcon ? <CurrentIcon size={18} aria-hidden="true" /> : null}
        {shortLabel}
      </button>
    </form>
  );
}
