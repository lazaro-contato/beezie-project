// Pure, and chosen once server-side: which encode plays is decided before
// the page is sent, never renegotiated in the browser.
import type { MachineMediaDTO, RevealSourceDTO } from "./types";

type SelectRevealSourceOptions = {
  readonly isMobile: boolean;
};

export function selectRevealSource(media: MachineMediaDTO, { isMobile }: SelectRevealSourceOptions): RevealSourceDTO {
  return isMobile
    ? { src: media.mobileUrl, poster: media.mobilePosterUrl }
    : { src: media.desktopUrl, poster: media.desktopPosterUrl };
}
