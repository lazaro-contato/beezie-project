import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Field } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { applyPromo } from "../actions";
import { readAppliedPromo } from "../queries";
import type { PromoStatus } from "../types";

type PromoCodeFormProps = {
  className?: string;
};

const PROMO_ERROR_MESSAGES: Record<Exclude<PromoStatus, "applied">, string> = {
  invalid: "That code isn't valid.",
  expired: "That code has expired.",
  inactive: "That code is no longer active.",
};

export const PROMO_FORM_HEIGHT = 58;

const PROMO_ROW_HEIGHT = 36;

/** Fallback for `PromoCodeForm`, sized from `PROMO_FORM_HEIGHT`. */
export function PromoCodeFormSkeleton({ className }: PromoCodeFormProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)} style={{ minHeight: PROMO_FORM_HEIGHT }}>
      <Skeleton height={16} width={120} />
      <div className="flex gap-2">
        <Skeleton height={PROMO_ROW_HEIGHT} className="flex-1 rounded-md" />
        <Skeleton height={PROMO_ROW_HEIGHT} width={81} className="rounded-md" />
      </div>
    </div>
  );
}

const applyButtonClasses =
  "inline-flex w-[81px] shrink-0 items-center justify-center rounded-md border border-[rgb(35,35,35)] bg-[rgb(35,35,35)] text-xs font-medium text-[rgb(124,124,124)] transition-[color,opacity] hover:text-foreground";

// Apply goes inert while the input is empty. `:placeholder-shown` is the
// empty state and the browser re-evaluates it on every keystroke, so this
// tracks typing without a client island; `required` on the input is what
// actually blocks a keyboard submit, since CSS cannot disable a button.
const applyEmptyClasses =
  "group-has-[input:placeholder-shown]/promo:pointer-events-none group-has-[input:placeholder-shown]/promo:opacity-40 group-has-[input:placeholder-shown]/promo:hover:text-[rgb(124,124,124)]";

/**
 * `<form action={applyPromo}>` with zero client state. `useActionState` is
 * not available to an RSC form, so the error status comes from
 * `readAppliedPromo()` — the httpOnly cookie `applyPromo` wrote on the
 * previous submit — and reaches the user through the status line beside the
 * label. The accepted cost: a stale error persists until the next submit or
 * an explicit clear, because a Server Component cannot rewrite a cookie
 * during its own render.
 *
 * Lives in `features/checkout` because `applyPromo` does; `PurchasePanel`
 * cannot import it, so `app/claw/[slug]/page.tsx` renders it and threads it
 * in as a slot.
 *
 * `<details open>` is the browser's own disclosure, expanded at every
 * breakpoint with zero JS. A breakpoint-dependent default open state would
 * mean fighting the element's native content-hiding with an author
 * stylesheet, which is not reliably overridable; `<summary>` still toggles.
 */
export async function PromoCodeForm({ className }: PromoCodeFormProps) {
  const applied = await readAppliedPromo();
  const errorMessage = applied && applied.status !== "applied" ? PROMO_ERROR_MESSAGES[applied.status] : undefined;
  const isApplied = applied?.status === "applied";

  return (
    <details open className={cn("group", className)} style={{ minHeight: PROMO_FORM_HEIGHT }}>
      <summary className="tap-target flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-foreground marker:content-none">
        Apply promo code
        <ChevronDown
          className="size-3 shrink-0 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
        {errorMessage ? <span className="ml-auto min-w-0 truncate text-destructive">{errorMessage}</span> : null}
        {isApplied ? <span className="ml-auto min-w-0 truncate text-primary">{`Code ${applied.code} applied`}</span> : null}
      </summary>
      <form
        action={applyPromo}
        className="group/promo mt-1.5 flex items-stretch gap-2"
        style={{ height: PROMO_ROW_HEIGHT }}
      >
        <Field
          id="promo-code"
          name="code"
          variant="compact"
          placeholder="Enter code"
          required
          defaultValue={applied?.code}
          error={errorMessage}
          containerClassName="flex-1"
          aria-label="Promo code"
        />
        {isApplied ? (
          // `formNoValidate`: Clear must work even after the field is emptied,
          // which `required` would otherwise block.
          <button
            type="submit"
            name="intent"
            value="clear"
            formNoValidate
            className={applyButtonClasses}
          >
            Clear
          </button>
        ) : null}
        <button
          type="submit"
          name="intent"
          value="apply"
          className={`${applyButtonClasses} ${applyEmptyClasses}`}
        >
          Apply
        </button>
      </form>
    </details>
  );
}
