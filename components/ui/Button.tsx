import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "md" | "sm";

// Full literal strings per key, not `bg-${variant}` interpolation: Tailwind's
// production scanner only detects complete class names in source.
const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "bg-transparent text-foreground hover:bg-accent",
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "h-12 px-5 text-base",
  sm: "h-9 px-3 text-sm",
};

type ButtonClassesOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

/**
 * The base radius is `rounded-md` (8px). A pill is opt-in — pass
 * `rounded-full` in `className` — because the design uses one only for the
 * cabinet control pills and the card-detail arrows, never for a CTA.
 */
export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: ButtonClassesOptions = {}): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  // Required, not defaulted: a button whose type is left to the browser
  // default silently becomes type="submit" inside a <form>.
  type: "button" | "submit" | "reset";
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

export function Button({
  type,
  variant,
  size,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      {...props}
    >
      {children}
    </button>
  );
}

type LinkButtonProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function LinkButton({
  variant,
  size,
  className,
  ...props
}: LinkButtonProps) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...props} />
  );
}
