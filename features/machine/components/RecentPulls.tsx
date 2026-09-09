import type { Route } from "next";
import { CardRow } from "@/entities/card/components/CardRow";
import { Panel } from "@/components/ui/Panel";
import { Money } from "@/components/ui/Money";
import { getRecentPulls } from "../queries";
import { BOTTOM_PANEL_HEIGHT, SCROLL_VIEWPORT_HEIGHT } from "../constants";

type RecentPullsProps = {
  slug: string;
};

export async function RecentPulls({ slug }: RecentPullsProps) {
  const pulls = await getRecentPulls(slug);

  return (
    <Panel className="flex flex-col gap-4 p-6" style={{ height: BOTTOM_PANEL_HEIGHT }}>
      <h2 className="text-center text-lg font-semibold text-foreground">Recent pulls</h2>
      <div className="overflow-y-auto" style={{ height: SCROLL_VIEWPORT_HEIGHT }}>
        {pulls.map((pull) => (
          <CardRow
            key={pull.pullItemId}
            card={pull.card}
            secondaryLabel={pull.buyerDisplayName}
            trailing={<Money cents={pull.pricePaidCents} />}
            href={`/claw/${slug}?card=${pull.pullItemId}&from=pulls` as Route}
            
          />
        ))}
      </div>
    </Panel>
  );
}
