"use server";

import { writePrefs } from "@/lib/prefs.server";
import { setPrefSchema } from "./schema";

export async function setPref(formData: FormData): Promise<void> {
  const result = setPrefSchema.safeParse({
    key: formData.get("key"),
    value: formData.get("value"),
    slug: formData.get("slug"),
  });

  if (!result.success) {
    return;
  }

  // `slug` is required by the schema and present in every submission (the
  // form's hidden field), but this action has nothing to do with it unless
  // the redirect fallback below is ever switched on.
  const { key, value } = result.data;
  await writePrefs({ [key]: value === "on" });
}
