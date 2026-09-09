import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type FieldVariant = "default" | "compact";

const variantClasses: Record<FieldVariant, string> = {
  default: "h-11 rounded-lg border border-border bg-fill-subtle px-3 text-sm",
  compact: "h-9 rounded-md border border-[rgb(35,35,35)] bg-[rgb(35,35,35)] px-3 text-xs font-medium",
};

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  /** Marks the input invalid and reddens its border. The message itself is
   * the caller's to place — the promo row puts it on its own label line so
   * the block's reserved height never changes. */
  error?: string;
  variant?: FieldVariant;
  /** Applied to the wrapper, not the input — a flex child that has to grow
   * needs the utility on the element the parent row actually lays out. */
  containerClassName?: string;
};

// No `useActionState`, no state of any kind. A form like PromoCodeForm is an
// RSC using <form action={...}>, so its error arrives here as a prop from a
// server re-render after the action runs — not from client state.
export function Field({
  label,
  error,
  id,
  variant = "default",
  className,
  containerClassName,
  ...props
}: FieldProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", containerClassName)}>
      {label ? (
        <label htmlFor={id} className="text-sm text-muted-foreground">
          {label}
        </label>
      ) : null}
      <input
        id={id}
        className={cn(
          "w-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
          variantClasses[variant],
          error && "border-destructive",
          className,
        )}
        aria-invalid={error ? true : undefined}
        {...props}
      />
    </div>
  );
}
