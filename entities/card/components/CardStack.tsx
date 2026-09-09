import { cn } from "@/lib/cn";
import { CardArt } from "./CardArt";
import { CARD_ASPECT, CARD_STACK_PERSPECTIVE } from "../constants";
import type { CardDTO } from "../types";
import styles from "./CardStack.module.css";

type CardStackProps = {
  card: Pick<CardDTO, "name" | "imageUrl" | "backImageUrl">;
  maxWidth: number | string;
  priority?: boolean;
  /**
   * Emits the two-face flip structure instead of a single face, so
   * `HoloCard.client`'s drag can turn the card over. Opt-in and, like
   * `CardSlab`'s old `flip` prop before it, silently degraded to one face
   * when the card has no back image (the seeded sealed collector box).
   */
  flip?: boolean;
  perspective?: number;
  detailShadow?: boolean;
  fitHeight?: boolean;
  pad?: boolean;
};

export function CardStack({
  card,
  maxWidth,
  priority,
  flip,
  perspective = CARD_STACK_PERSPECTIVE,
  detailShadow,
  fitHeight,
  pad = true,
}: CardStackProps) {
  const sizes = typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth;
  const hasBack = Boolean(flip && card.backImageUrl);
  const faceClassName = cn(styles.face, detailShadow && styles.faceDetail);

  const front = <CardArt src={card.imageUrl} alt={card.name} sizes={sizes} priority={priority} holo />;

  return (
    <div
      className={cn(styles.perspective, !pad && styles.flush, fitHeight && styles.fit)}
      style={{ perspective: `${perspective}px` }}
    >
      <div
        data-tilt=""
        className={styles.stack}
        style={
          fitHeight
            ? { maxWidth, aspectRatio: CARD_ASPECT, height: "100%", width: "auto" }
            : { maxWidth, aspectRatio: CARD_ASPECT }
        }
      >
        {hasBack ? (
          <div className={styles.flipInner}>
            <div className={faceClassName}>{front}</div>
            <div className={cn(faceClassName, styles.faceBack)}>
              <CardArt src={card.backImageUrl as string} alt="" sizes={sizes} />
            </div>
          </div>
        ) : (
          <div className={faceClassName}>{front}</div>
        )}
      </div>
    </div>
  );
}
