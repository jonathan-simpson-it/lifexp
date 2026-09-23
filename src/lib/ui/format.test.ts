import { describe, expect, it } from "vitest";
import { formatRemaining, skillColor } from "./format";

/**
 * Converts an oklch() string to a relative luminance, so generated colours can
 * be held to the same contrast bar as the hand-picked hex tokens.
 *
 * The tokens in globals.css are audited by a script; the per-skill colours are
 * computed at runtime from a seed and were not audited by anything, which is
 * how a chip whose readability depended on which seed a skill happened to get
 * reached production.
 */
function oklchLuminance(value: string): number {
  const m = value.match(
    /oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/,
  );
  if (!m) throw new Error(`not an oklch colour: ${value}`);
  const [L, C, H] = [Number(m[1]), Number(m[2]), Number(m[3])];

  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const r = clamp(4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s);
  const g = clamp(-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s);
  const bl = clamp(-0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s);

  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}

const contrastWithWhite = (c: string) => 1.05 / (oklchLuminance(c) + 0.05);

// Enough seeds to cover every residue the formula can produce.
const SEEDS = Array.from({ length: 300 }, (_, i) => i);

describe("skillColor solid", () => {
  it("always carries white text at AA", () => {
    for (const seed of SEEDS) {
      const colour = skillColor(seed, { solid: true });
      expect(
        contrastWithWhite(colour),
        `seed ${seed} → ${colour}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("still tells skills apart", () => {
    // Compressing lightness for contrast must not collapse the set into one
    // colour, that would make the calendar dots useless.
    const distinct = new Set(SEEDS.map((s) => skillColor(s, { solid: true })));
    expect(distinct.size).toBeGreaterThan(30);
  });

  it("stays inside the green band", () => {
    for (const seed of SEEDS) {
      const hue = Number(
        skillColor(seed, { solid: true }).match(/\s([\d.]+)\)$/)![1],
      );
      expect(hue).toBeGreaterThanOrEqual(128);
      expect(hue).toBeLessThanOrEqual(162);
    }
  });
});

describe("formatRemaining", () => {
  it("omits the trailing 'to go' that the label carries", () => {
    // Every call site already says where it is going: "70.1h to Elementary".
    expect(formatRemaining(4206, "minutes")).not.toContain("to go");
  });

  it("formats hours and sessions in their own units", () => {
    expect(formatRemaining(4206, "minutes")).toBe("70.1h");
    expect(formatRemaining(45, "minutes")).toBe("45m");
    expect(formatRemaining(1, "sessions")).toBe("1 session");
    expect(formatRemaining(81, "sessions")).toBe("81 sessions");
  });

  it("is null once there is nothing left to reach", () => {
    expect(formatRemaining(null, null)).toBeNull();
  });
});
