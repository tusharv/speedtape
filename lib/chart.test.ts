import { describe, expect, it } from "vitest";
import {
  CHART_MAX_POINTS,
  downsampleChart,
  neighborRuns,
  NEIGHBOR_RUN_LIMIT,
  runsToChartPoints,
  type ChartPoint,
} from "@/lib/chart";
import type { SpeedTestRow } from "@/lib/types";

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

function row(
  partial: Partial<SpeedTestRow> & { id: number; testedAt: string },
): SpeedTestRow {
  return {
    downloadMbps: 100,
    uploadMbps: 20,
    pingMs: 10,
    jitterMs: 1,
    packetLoss: 0,
    isp: "ISP",
    serverName: "Server",
    serverLocation: "Here",
    error: null,
    ...partial,
  };
}

describe("neighborRuns", () => {
  it("keeps a window of five before, the current run, and five after", () => {
    expect(NEIGHBOR_RUN_LIMIT).toBe(5);
    const previous = Array.from({ length: 7 }, (_, i) =>
      row({
        id: 7 - i,
        testedAt: `2026-08-13T${String(7 - i).padStart(2, "0")}:00:00.000Z`,
        downloadMbps: 7 - i,
      }),
    );
    const current = row({
      id: 8,
      testedAt: "2026-08-13T08:00:00.000Z",
      downloadMbps: 8,
    });
    const next = Array.from({ length: 6 }, (_, i) =>
      row({
        id: 9 + i,
        testedAt: `2026-08-13T${String(9 + i).padStart(2, "0")}:00:00.000Z`,
        downloadMbps: 9 + i,
      }),
    );
    const window = neighborRuns(previous, current, next);
    expect(window).toHaveLength(11);
    expect(window.map((item) => item.id)).toEqual([
      3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
    ]);
  });

  it("uses whatever neighbors exist when the window is short", () => {
    const current = row({
      id: 2,
      testedAt: "2026-08-13T02:00:00.000Z",
    });
    const window = neighborRuns(
      [row({ id: 1, testedAt: "2026-08-13T01:00:00.000Z" })],
      current,
      [row({ id: 3, testedAt: "2026-08-13T03:00:00.000Z" })],
    );
    expect(window.map((item) => item.id)).toEqual([1, 2, 3]);
  });
});

describe("runsToChartPoints", () => {
  it("maps speeds and keeps failed samples as gaps", () => {
    expect(
      runsToChartPoints([
        row({
          id: 1,
          testedAt: "2026-08-13T01:00:00.000Z",
          downloadMbps: 40,
        }),
        row({
          id: 2,
          testedAt: "2026-08-13T02:00:00.000Z",
          downloadMbps: null,
          uploadMbps: null,
          pingMs: null,
          error: "timeout",
        }),
      ]),
    ).toEqual([
      {
        time: "2026-08-13T01:00:00.000Z",
        download: 40,
        upload: 20,
        ping: 10,
      },
      {
        time: "2026-08-13T02:00:00.000Z",
        download: null,
        upload: null,
        ping: null,
      },
    ]);
  });
});
