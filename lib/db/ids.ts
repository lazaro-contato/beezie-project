/**
 * A prefixed UUID, e.g. `newId('itm')` -> `"itm_3e1f...-...-...-...-..."`.
 * The prefix makes an id readable in logs and query output without a join.
 */
export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export const DEMO_USER_ID = "usr_demo";
