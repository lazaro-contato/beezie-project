"use client";

import { useRef, useSyncExternalStore } from "react";
import { Minus, Plus } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { formatCents } from "@/lib/money";
import { purchasePointsFor } from "@/lib/points";
import { beginNavProgress } from "@/lib/nav-progress";
import { STEP_SOUND_SRC, STEP_SOUND_VOLUME } from "../idle-media";
import {
  recallQuantity,
  rememberQuantity,
  serverQuantitySnapshot,
  subscribeQuantity,
} from "@/lib/quantity-memory";

type QuantityStepperProps = {
  slug: string;
  min: number;
  max: number;
  unitPriceCents: number;
  openCheckout: (formData: FormData) => Promise<void>;
  soundOn: boolean;
};

export function QuantityStepper({
  slug,
  min,
  max,
  unitPriceCents,
  openCheckout,
  soundOn,
}: QuantityStepperProps) {
  const remembered = useSyncExternalStore(
    subscribeQuantity,
    () => recallQuantity(slug),
    serverQuantitySnapshot,
  );
  const quantity = remembered ?? min;

  const totalCents = unitPriceCents * quantity;
  const totalPoints = purchasePointsFor(totalCents);

  const clickRef = useRef<HTMLAudioElement | null>(null);

  function playStep() {
    if (!soundOn) {
      return;
    }
    let sound = clickRef.current;
    if (!sound) {
      sound = new Audio(STEP_SOUND_SRC);
      sound.volume = STEP_SOUND_VOLUME;
      clickRef.current = sound;
    }
    // Rewind rather than overlap: ten taps in a row should sound like ten
    // clicks, not one smear.
    sound.currentTime = 0;
    // A rejected `play()` is not an error worth surfacing — the stepper's
    // job is the number, and the click is decoration.
    void sound.play().catch(() => {});
  }

  function step(delta: number) {
    const next = Math.min(max, Math.max(min, quantity + delta));
    if (next === quantity) {
      // At the floor or the ceiling. The button is disabled there anyway,
      // so this only guards a keyboard repeat: no change, no click.
      return;
    }
    rememberQuantity(slug, next);
    playStep();
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <data
          value={totalCents}
          className="text-2xl font-semibold leading-8 tabular-nums text-foreground"
        >
          {formatCents(totalCents, { precision: "auto" })}
        </data>
        {/* One interpolated string, not adjacent JSX children: React's SSR
            output separates those with an `<!-- -->` marker, which breaks a
            literal `curl | grep`. */}
        <span className="text-sm font-semibold text-primary">{`+${totalPoints} points`}</span>
      </div>

      <form
        action={openCheckout}
        onSubmit={beginNavProgress}
        className="flex w-full items-center gap-3"
      >
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="quantity" value={quantity} />

        <div
          role="group"
          aria-label={`Quantity, ${formatCents(unitPriceCents, { precision: "auto" })} each`}
          className="flex h-12 w-32 shrink-0 items-center justify-between rounded-lg bg-secondary px-1 shadow-[inset_0_0_0_1px_var(--color-border)]"
        >
          <button
            type="button"
            disabled={quantity <= min}
            onClick={() => step(-1)}
            aria-label="Decrease quantity"
            className={buttonClasses({
              variant: "ghost",
              size: "sm",
              className: "tap-target h-10 w-10 rounded-md px-0",
            })}
          >
            <Minus size={20} aria-hidden="true" />
          </button>
          <data
            value={quantity}
            aria-live="polite"
            className="w-8 text-center text-base font-semibold tabular-nums text-foreground"
          >
            {quantity}
          </data>
          <button
            type="button"
            disabled={quantity >= max}
            onClick={() => step(1)}
            aria-label="Increase quantity"
            className={buttonClasses({
              variant: "ghost",
              size: "sm",
              className: "tap-target h-10 w-10 rounded-md px-0",
            })}
          >
            <Plus size={20} aria-hidden="true" />
          </button>
        </div>

        <button
          type="submit"
          className={buttonClasses({
            variant: "primary",
            size: "md",
            className: "h-12 flex-1 text-sm",
          })}
        >
          Start Now
        </button>
      </form>
    </div>
  );
}
