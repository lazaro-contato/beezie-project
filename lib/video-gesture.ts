/**
 * The reveal video's DOM id. A global id rather than a callback prop because
 * the payment sheet and the reveal orchestrator are sibling islands under a
 * server layout: the element is the only channel between them.
 */
export const REVEAL_VIDEO_ELEMENT_ID = "reveal-video";

function getRevealVideoElement(): HTMLVideoElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  const element = document.getElementById(REVEAL_VIDEO_ELEMENT_ID);
  return element instanceof HTMLVideoElement ? element : null;
}

/** Marks the unlocking `play()` below, so the orchestrator knows the
 *  `play`/`pause` pair it is about to receive is not a run anyone is watching. */
export const REVEAL_VIDEO_PRIMING_ATTRIBUTE = "priming";

/** Set by a successful confirm: start the cut when the reveal route arrives.
 *  The sheet is unmounted by that navigation, so it leaves the instruction on
 *  the element instead of acting on it. */
export const REVEAL_VIDEO_ARMED_ATTRIBUTE = "armed";

/** Applied on top of the level mixed into the file's audio. iOS ignores
 *  `volume`, so a change meant to reach every device goes into the file. */
export const REVEAL_VIDEO_VOLUME = 0.5;

/**
 * Unlocks the video inside the confirm gesture without letting a frame of it
 * run: plays, then pauses and rewinds in the same synchronous block.
 *
 * Two requirements collide and this is the only shape that satisfies both.
 * iOS Safari permits `play()` only inside the synchronous chain of a user
 * gesture, so it has to happen at the click. But the pull stage covers the
 * video for eight seconds after that, and a run that actually played would
 * burn most of the cut behind an opaque panel. Starting playback grants the
 * activation flag; keeping it playing does not, so the flag is claimed and
 * playback handed straight back.
 *
 * Must be the first statement of the click handler, with nothing awaited
 * ahead of it.
 */
export function playRevealVideoSync(): void {
  const element = getRevealVideoElement();
  if (!element) {
    return;
  }

  // Set *before* `play()`, so the `play` event this is about to queue
  // already finds the flag in place when the orchestrator's listener runs.
  element.dataset[REVEAL_VIDEO_PRIMING_ATTRIBUTE] = "1";

  void element.play().catch(() => {
    // Swallowed: the usual rejection here is the `AbortError` the `pause()`
    // two lines down produces, which is the intended outcome.
  });

  // Still inside the gesture, still synchronous, and still ahead of any
  // paint: the activation flag is claimed and the playback is handed back.
  element.pause();
  try {
    element.currentTime = 0;
  } catch {
    // Seeking can throw before metadata loads. The element is paused either
    // way, and `restartRevealVideo()` seeks again when it matters.
  }

  element.volume = REVEAL_VIDEO_VOLUME;

  if (element.dataset.unmute === "1") {
    element.muted = false;
  }
}

export function armRevealVideo(): void {
  const element = getRevealVideoElement();
  if (element) {
    element.dataset[REVEAL_VIDEO_ARMED_ATTRIBUTE] = "1";
  }
}

/** Whether a confirm armed this element and nothing has spent it yet. */
export function isRevealVideoArmed(): boolean {
  return getRevealVideoElement()?.dataset[REVEAL_VIDEO_ARMED_ATTRIBUTE] === "1";
}

/**
 * Starts the run the viewer actually watches. A `play()` on an element already
 * played under a gesture needs no fresh gesture; that is the flag
 * `playRevealVideoSync` bought, and this is what spends it.
 *
 * Called by the reveal orchestrator when the reveal route arrives, which is
 * the commit that takes the pull stage off the screen.
 */
export function restartRevealVideo(): void {
  const element = getRevealVideoElement();
  if (!element) {
    return;
  }

  delete element.dataset[REVEAL_VIDEO_PRIMING_ATTRIBUTE];
  delete element.dataset[REVEAL_VIDEO_ARMED_ATTRIBUTE];

  try {
    element.currentTime = 0;
  } catch {
    // Seeking can throw if metadata has not loaded. Playback from wherever
    // the element already is beats no playback at all.
  }

  void element.play().catch(() => {
    // Same swallow, same reasons, as `playRevealVideoSync` above.
  });
}

/** Pauses and rewinds after a failed confirm. The orchestrator hides its
 *  overlay on the `pause` at `currentTime === 0` this produces. */
export function cancelRevealVideo(): void {
  const element = getRevealVideoElement();
  if (!element) {
    return;
  }
  // Cleared first for the same reason `restartRevealVideo` clears it: the
  // flag exists only for the duration of the unlock, and a failed confirm
  // must leave the element in a state a *second* confirm can unlock again.
  delete element.dataset[REVEAL_VIDEO_PRIMING_ATTRIBUTE];
  delete element.dataset[REVEAL_VIDEO_ARMED_ATTRIBUTE];
  element.pause();
  element.currentTime = 0;
}
