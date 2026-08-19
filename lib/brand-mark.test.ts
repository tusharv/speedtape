import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BRAND_MARK_VIEWBOX,
  brandMarkAppIconSvg,
  brandMarkPointsAttr,
  brandMarkPolygons,
} from "@/lib/brand-mark";

describe("brand mark", () => {
  it("is three right-leaning bars, shortest on the left", () => {
    const bars = brandMarkPolygons();

    expect(bars).toHaveLength(3);
    expect(BRAND_MARK_VIEWBOX.width).toBeGreaterThan(BRAND_MARK_VIEWBOX.height);

    const heights = bars.map((bar) => {
      const ys = bar.map((point) => point.y);
      return Math.max(...ys) - Math.min(...ys);
    });
    expect(heights[0]).toBeLessThan(heights[1]!);
    expect(heights[1]).toBeLessThan(heights[2]!);

    for (const bar of bars) {
      const bottom = bar.filter((point) => point.y === Math.max(...bar.map((p) => p.y)));
      const top = bar.filter((point) => point.y === Math.min(...bar.map((p) => p.y)));
      const bottomLeft = Math.min(...bottom.map((point) => point.x));
      const topLeft = Math.min(...top.map((point) => point.x));
      expect(topLeft).toBeGreaterThan(bottomLeft);
    }
  });

  it("serializes polygon points for SVG", () => {
    const points = brandMarkPointsAttr(brandMarkPolygons()[2]!);
    expect(points).toMatch(/^\d+(\.\d+)?,\d+(\.\d+)?( \d+(\.\d+)?,\d+(\.\d+)?){3}$/);
  });

  it("is the same mark in the app icon and Pages favicon", () => {
    const icon = readFileSync(join(process.cwd(), "app/icon.svg"), "utf8");
    const favicon = readFileSync(join(process.cwd(), "docs/favicon.svg"), "utf8");
    expect(icon).toBe(brandMarkAppIconSvg(64));
    expect(favicon).toBe(brandMarkAppIconSvg(32));
    for (const points of brandMarkPolygons().map(brandMarkPointsAttr)) {
      expect(icon).toContain(points);
      expect(favicon).toContain(points);
    }
  });
});
