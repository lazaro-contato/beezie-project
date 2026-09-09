/** The idle loop's static asset paths — one shared loop for every machine,
 * so no per-machine column. The poster is frame 0 of the loop and is
 * server-rendered on the element, so the cabinet box is filled from first
 * paint. */
export const IDLE_VIDEO_SRC = "/video/idle-loop.mp4";
export const IDLE_VIDEO_POSTER = "/video/idle-loop-poster.jpg";

/** The poster is square; the hero reserves its box from this. */
export const IDLE_POSTER_SIZE = 800;

/** The stepper's click, from the supplied `assets/audio/
 * increase-decrease-audio.wav` — a 204ms transient, re-encoded to mono AAC
 * at 48kbps (54KB -> 2.3KB). It plays inside a click handler, so no autoplay
 * policy is involved. */
export const STEP_SOUND_SRC = "/audio/step.m4a";

export const STEP_SOUND_VOLUME = 0.5;
