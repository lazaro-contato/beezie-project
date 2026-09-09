import { z } from "zod";
import { MACHINE_SLUGS } from "@/lib/machines";

export const setPrefSchema = z.object({
  key: z.enum(["muted", "reducedMotion", "skipReveal"]),
  value: z.enum(["on", "off"]),
  slug: z.enum(MACHINE_SLUGS),
});

export type SetPrefInput = z.infer<typeof setPrefSchema>;
