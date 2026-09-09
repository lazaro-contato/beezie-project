export const MACHINE_SLUGS = ["gold-claw", "silver-claw", "platinum-claw", "wildcard-claw"] as const;

export type MachineSlug = (typeof MACHINE_SLUGS)[number];

/** Where `/` redirects to. */
export const DEFAULT_MACHINE_SLUG: MachineSlug = "gold-claw";

export const MACHINE_CRATE_ICONS: Record<MachineSlug, string> = {
  "wildcard-claw": "/img/crates/crate-blue.avif",
  "silver-claw": "/img/crates/crate-silver.avif",
  "gold-claw": "/img/crates/crate-gold.avif",
  "platinum-claw": "/img/crates/crate-gold.avif",
};

export const CRATE_ICON_WIDTH = 40;
export const CRATE_ICON_HEIGHT = 32;
