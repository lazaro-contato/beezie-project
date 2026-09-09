import "server-only";
import { eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db/client";
import { machines } from "@/lib/db/schema";
import type { MachineMediaDTO } from "./types";

export async function getMachineMedia(slug: string): Promise<MachineMediaDTO> {
  "use cache";
  cacheTag(`machine:${slug}`);
  cacheLife("days");

  const [row] = await db
    .select({
      desktopUrl: machines.revealDesktopUrl,
      desktopPosterUrl: machines.revealDesktopPosterUrl,
      mobileUrl: machines.revealMobileUrl,
      mobilePosterUrl: machines.revealMobilePosterUrl,
    })
    .from(machines)
    .where(eq(machines.slug, slug))
    .limit(1);

  if (!row) {
    throw new Error(`getMachineMedia: no machine for slug ${slug}`);
  }

  return row;
}
