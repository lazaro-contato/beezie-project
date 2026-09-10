import Image, { getImageProps } from "next/image";
import type { CSSProperties } from "react";
import { preload } from "react-dom";
import { cn } from "@/lib/cn";
import styles from "./CardArt.module.css";
import { isVectorImage } from "@/lib/image";

type CardArtProps = {
  src: string;
  /** Empty string for the back face, which carries no information the front
   * face's own alt text does not already give. */
  alt: string;
  sizes: string;
  priority?: boolean;
  /**
   * Emits the holo and glare layers over the image. Opt-in, never
   * automatic: only the *front* face of a card a viewer can actually point
   * at gets them, so the back face of a flipping card and every
   * `CardSlab`-based tile stay two plain elements with no blend-moded
   * compositing layer of their own.
   */
  holo?: boolean;
  className?: string;
};

export function CardArt({ src, alt, sizes, priority, holo, className }: CardArtProps) {
  // Both layers take the identical mask. Inline because the URL is data,
  // not style: everything static about the mask (size, repeat, position,
  // and the `-webkit-` aliases for those) lives in the CSS module.
  const mask: CSSProperties = {
    maskImage: `url("${src}")`,
    WebkitMaskImage: `url("${src}")`,
  };

  return (
    <div className={cn(styles.art, className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={isVectorImage(src)}
        draggable={false}
        className="object-contain"
      />
      {holo ? (
        <>
          <div className={cn(styles.layer, styles.holo)} style={mask} aria-hidden />
          <div className={cn(styles.layer, styles.glare)} style={mask} aria-hidden />
        </>
      ) : null}
    </div>
  );
}

/**
 * Starts downloading a card's art at exactly the URL a `CardArt` with the same
 * `sizes` will request, so the card is already decoded when it is shown.
 */
export function preloadCardArt(src: string, sizes: string): void {
  if (isVectorImage(src)) {
    preload(src, { as: "image", fetchPriority: "low" });
    return;
  }
  const { props } = getImageProps({ src, alt: "", fill: true, sizes });
  preload(props.src, {
    as: "image",
    imageSrcSet: props.srcSet,
    imageSizes: props.sizes,
    fetchPriority: "low",
  });
}
