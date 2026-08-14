import { describe, expect, it } from "vitest";
import { CHART_MAX_POINTS, downsampleChart, type ChartPoint } from "@/lib/chart";

function point(hour: number, download: number): ChartPoint {
  return {
    time: new Date(Date.UTC(2026, 7, 13, hour, 0, 0)).toISOString(),
    download,
    upload: 10,
    ping: 8,
  };
}

describe("downsampleChart", () => {
  it("returns the input when it already fits", () => {
    const points = [point(0, 10), point(1, 20), point(2, 30)];
    expect(downsampleChart(points, 96)).toEqual(points);
    expect(CHART_MAX_POINTS).toBe(96);
  });

  it("keeps the last sample in each time bucket", () => {
    const points = Array.from({ length: 10 }, (_, hour) => point(hour, hour));
    const sampled = downsampleChart(points, 3);
    expect(sampled.map((item) => item.download)).toEqual([2, 5, 9]);
  });

  it("drops failed samples so the line stays continuous", () => {
    const failed: ChartPoint = {
      time: new Date(Date.UTC(2026, 7, 13, 1, 0, 0)).toISOString(),
      download: null,
      upload: null,
      ping: null,
    };
    const points = [point(0, 10), failed, point(2, 30)];
    expect(downsampleChart(points, 96)).toEqual([point(0, 10), point(2, 30)]);
  });
});
