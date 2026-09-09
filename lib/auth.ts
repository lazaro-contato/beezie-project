import "server-only";
import { DEMO_USER_ID } from "@/lib/db/ids";

export async function getCurrentUserId(): Promise<string> {
  return DEMO_USER_ID;
}
