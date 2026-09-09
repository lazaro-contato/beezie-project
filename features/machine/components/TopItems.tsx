import type { Route } from "next";
import { CardTile } from "@/entities/card/components/CardTile";
import { Panel } from "@/components/ui/Panel";
import { getTopItems } from "../queries";
import { BOTTOM_PANEL_HEIGHT, SCROLL_VIEWPORT_HEIGHT } from "../constants";

type TopItemsProps = {
  slug: string;
};

export async function TopItems({ slug }: TopItemsProps) {
  const items = await getTopItems(slug);

  return (
    <Panel className="flex flex-col gap-4 p-6" style={{ height: BOTTOM_PANEL_HEIGHT }}>
      <h2 className="text-center text-lg font-semibold text-foreground">Top items</h2>
      <div
        className="grid auto-rows-min grid-cols-2 gap-3 overflow-y-auto sm:gap-4 sm:[grid-template-columns:repeat(auto-fill,minmax(128px,1fr))]"
        style={{ height: SCROLL_VIEWPORT_HEIGHT }}
      >
        {items.map((item) => (
          <CardTile key={item.id} card={item} href={`/claw/${slug}?card=${item.id}&from=top` as Route} />
        ))}
      </div>
    </Panel>
  );
}
