/**
 * Detects alarm reds in a CSS colour string.
 *
 * LifeXP's palette contains no red token, because nothing in the product is an
 * error or a failure. This predicate is the enforcement: an end-to-end test
 * scans every computed colour on every page through it.
 *
 * Hue-based rather than a raw RGB comparison. An earlier `r > 150 && g < 90 &&
 * b < 90` box had both failure modes at once, it rejected warm terracotta
 * (which is an action colour, not a warning) and it MISSED dark reds like
 * #8b0000, whose red channel is too low to clear the threshold. Hue targets
 * what the rule actually means: saturated red at a visible lightness.
 *
 * Kept dependency-free and pure so it can be unit-tested against known alarm
 * reds directly, see alarm-red.test.ts.
 */
export function isAlarmRed(cssColor: string): boolean {
  const match = cssColor.match(/rgba?\(([^)]+)\)/);
  if (!match) return false;

  const parts = match[1].split(/[,\s/]+/).filter(Boolean).map(parseFloat);
  const [r255, g255, b255, alpha = 1] = parts;
  if (![r255, g255, b255].every(Number.isFinite)) return false;

  // Fully transparent colours are never seen, whatever their channels say.
  if (alpha === 0) return false;

  const [r, g, b] = [r255, g255, b255].map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let hue = 0;
  if (delta !== 0) {
    hue =
      max === r
        ? (g - b) / delta + (g < b ? 6 : 0)
        : max === g
          ? (b - r) / delta + 2
          : (r - g) / delta + 4;
    hue *= 60;
  }

  const lightness = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));

  return (
    (hue >= 345 || hue <= 14) &&
    saturation >= 0.45 &&
    lightness >= 0.2 &&
    lightness <= 0.7
  );
}
