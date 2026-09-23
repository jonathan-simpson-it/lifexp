import { describe, expect, it } from "vitest";
import { isAlarmRed } from "./alarm-red";

const rgb = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
};

describe("alarm-red detection", () => {
  /**
   * The reason this rule exists. If a future change lets any of these through,
   * the no-alarm-colour guarantee is gone.
   */
  describe("catches every common alarm red", () => {
    const alarms: Record<string, string> = {
      "tailwind red-500": "#ef4444",
      "tailwind red-600": "#dc2626",
      "tailwind red-700": "#b91c1c",
      crimson: "#dc143c",
      firebrick: "#b22222",
      "bootstrap danger": "#dc3545",
      "material red": "#f44336",
      "ios destructive": "#ff3b30",
      // The old RGB-box rule MISSED this one: its red channel is below the
      // threshold even though it is unmistakably a dark red.
      "dark red": "#8b0000",
    };

    for (const [name, hex] of Object.entries(alarms)) {
      it(name, () => {
        expect(isAlarmRed(rgb(hex))).toBe(true);
      });
    }
  });

  describe("allows the LifeXP palette", () => {
    const palette: Record<string, string> = {
      "green (accent)": "#6e9f70",
      "deep green (accent-deep)": "#426e4a",
      "chip tint (accent-soft)": "#eae6d6",
      "gold (medal)": "#805a21",
      "bright gold (medal-bright)": "#c9932b",
      "bronze tier": "#96683c",
      "cream (paper)": "#f0f0e6",
      ink: "#211e16",
    };

    for (const [name, hex] of Object.entries(palette)) {
      it(name, () => {
        expect(isAlarmRed(rgb(hex))).toBe(false);
      });
    }
  });

  describe("edge cases", () => {
    it("ignores fully transparent colours", () => {
      expect(isAlarmRed("rgba(220, 38, 38, 0)")).toBe(false);
    });

    it("still flags a partially transparent red", () => {
      expect(isAlarmRed("rgba(220, 38, 38, 0.8)")).toBe(true);
    });

    it("ignores unparseable values", () => {
      expect(isAlarmRed("")).toBe(false);
      expect(isAlarmRed("transparent")).toBe(false);
      expect(isAlarmRed("currentColor")).toBe(false);
    });

    it("ignores greys, which have no hue to speak of", () => {
      expect(isAlarmRed("rgb(128, 128, 128)")).toBe(false);
      expect(isAlarmRed("rgb(0, 0, 0)")).toBe(false);
      expect(isAlarmRed("rgb(255, 255, 255)")).toBe(false);
    });

    it("ignores pale pinks, desaturated, not an alarm", () => {
      expect(isAlarmRed(rgb("#fbe7dd"))).toBe(false);
      expect(isAlarmRed(rgb("#ffe4e6"))).toBe(false);
    });

    it("handles the space-separated modern syntax", () => {
      expect(isAlarmRed("rgb(220 38 38)")).toBe(true);
      expect(isAlarmRed("rgb(220 38 38 / 0.9)")).toBe(true);
    });
  });
});
