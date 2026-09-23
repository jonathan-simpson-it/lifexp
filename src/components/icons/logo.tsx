import Image from "next/image";

/**
 * The brand lockup.
 *
 * Rendered from the client's artwork rather than redrawn in SVG, so the app
 * and everything the client ships share one mark. The source JPEGs carry a
 * `#f7f7f7` field; `lifexp-logo-green.png` and `lifexp-logo-cream.png` are the
 * same artwork with that field extracted to transparency (ffmpeg colorkey, and
 * a distance-based alpha for the cream, whose letters sit only a few levels
 * off the background). That is why the marks sit cleanly on both the cream
 * ground and the ink closing band without a white box or a blend mode.
 *
 * If the client ships updated artwork, regenerate the PNGs from the JPEGs in
 * `public/` with the same commands rather than editing the pixels by hand.
 */

export const PRODUCT_NAME = "LifeXP";

const GREEN_RATIO = 1154 / 255; // source artwork, width / height
const CREAM_RATIO = 1052 / 237;

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <Image
      src="/lifexp-logo-green.png"
      alt={PRODUCT_NAME}
      width={Math.round(size * GREEN_RATIO)}
      height={size}
      className="block"
    />
  );
}

/** The cream variant, for ink grounds. Same artwork, light ink. */
export function LogoCream({ size = 30 }: { size?: number }) {
  return (
    <Image
      src="/lifexp-logo-cream.png"
      alt={PRODUCT_NAME}
      width={Math.round(size * CREAM_RATIO)}
      height={size}
      className="block"
    />
  );
}
