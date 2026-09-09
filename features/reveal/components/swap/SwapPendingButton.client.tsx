"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import progressStyles from "../SwapProgress.module.css";

/** The single reveal's swap button, which becomes a progress bar while its
 *  form action is running. A leaf inside a server-rendered `<form action>`:
 *  it owns no state, no timer and no action, only the status React already
 *  publishes for the form around it. */
export function SwapPendingButton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();

  if (!pending) {
    return (
      <button
        type="submit"
        className="h-12 w-full rounded-md bg-primary text-sm font-semibold leading-5 text-primary-foreground transition-colors hover:bg-[rgb(255,214,79)]"
      >
        {children}
      </button>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative flex h-12 w-full items-center justify-center overflow-hidden rounded-md bg-[rgb(120,86,10)]"
    >
      <div className={progressStyles.fill} />
      <span className="relative flex items-center gap-2 text-sm font-semibold text-foreground">
        <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" />
        Swap in progress
      </span>
    </div>
  );
}
