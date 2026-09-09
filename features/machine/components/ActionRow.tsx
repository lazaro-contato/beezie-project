import { readPrefs } from "@/lib/prefs.server";
import { MAX_PULL_QUANTITY, MIN_PULL_QUANTITY } from "@/lib/pull/limits";
import { QuantityStepper } from "./QuantityStepper.client";
import { ACTION_ROW_HEIGHT } from "../constants";

type ActionRowProps = {
  slug: string;
  unitPriceCents: number;
  openCheckout: (formData: FormData) => Promise<void>;
};

export async function ActionRow({ slug, unitPriceCents, openCheckout }: ActionRowProps) {
  const prefs = await readPrefs();

  return (
    <div className="flex w-full items-center" style={{ height: ACTION_ROW_HEIGHT }}>
      <QuantityStepper
        slug={slug}
        min={MIN_PULL_QUANTITY}
        max={MAX_PULL_QUANTITY}
        unitPriceCents={unitPriceCents}
        openCheckout={openCheckout}
        soundOn={!prefs.muted}
      />
    </div>
  );
}
