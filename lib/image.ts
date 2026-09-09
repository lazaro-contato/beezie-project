/** Next's optimizer refuses SVG unless `dangerouslyAllowSVG` is on, and has
 *  nothing to offer a vector anyway: there are no raster dimensions to resize
 *  toward and no format to negotiate. Bitmaps are a different question, and
 *  the seeded card art has been webp and avif since the SVG placeholders were
 *  replaced. */
export function isVectorImage(src: string): boolean {
  return src.endsWith(".svg");
}
