import { describe, expect, it } from "vitest";
import {
  buildSpeedTape,
  dayPartForHour,
  groupTapeDayParts,
  summarizeTapeGroups,
  tapeBarHeightPct,
  tapeBarMax,
  tapeBarTitle,
} from "@/lib/tape";
import type { TapeCell } from "@/lib/tape";
import type { SpeedTestRow } from "@/lib/types";

function row(partial: Partial<SpeedTestRow> & { testedAt: string }): SpeedTestRow {
  return {
    id: 1,
    downloadMbps: 100,
    uploadMbps: 20,
    pingMs: 8,
    jitterMs: 1,
    packetLoss: 0,
    isp: "ISP",
    serverName: "Server",
    serverLocation: "Here",
    error: null,
    ...partial,
  };
}

describe("buildSpeedTape", () => {
  it("builds 24 hourly cells ending at the current hour", () => {
    const now = new Date(2026, 7, 13, 15, 30, 0);
    const tape = buildSpeedTape(
      [
        row({
          testedAt: new Date(2026, 7, 13, 14, 10, 0).toISOString(),
          downloadMbps: 80,
        }),
        row({
          testedAt: new Date(2026, 7, 13, 13, 0, 0).toISOString(),
          downloadMbps: null,
          error: "failed",
        }),
      ],
      now,
    );

    expect(tape).toHaveLength(24);
    expect(tape[23]?.label).toBe("15");
    expect(tape[22]?.downloadMbps).toBe(80);
    expect(tape[22]?.uploadMbps).toBe(20);
    expect(tape[22]?.pingMs).toBe(8);
    expect(tape[21]?.failed).toBe(true);
    expect(tape[0]?.downloadMbps).toBeNull();
  });
});

describe("dayPartForHour", () => {
  it("maps each bucket and the boundaries", () => {
    expect(dayPartForHour(0)).toBe("late-night");
    expect(dayPartForHour(4)).toBe("late-night");
    expect(dayPartForHour(5)).toBe("morning");
    expect(dayPartForHour(8)).toBe("morning");
    expect(dayPartForHour(10)).toBe("morning");
    expect(dayPartForHour(11)).toBe("noon");
    expect(dayPartForHour(14)).toBe("noon");
    expect(dayPartForHour(15)).toBe("evening");
    expect(dayPartForHour(19)).toBe("evening");
    expect(dayPartForHour(20)).toBe("night");
    expect(dayPartForHour(23)).toBe("night");
  });
});

function cellsFromHours(hours: number[]): TapeCell[] {
  return hours.map((hour, index) => ({
    hourStart: index,
    label: String(hour).padStart(2, "0"),
    downloadMbps: null,
    uploadMbps: null,
    pingMs: null,
    failed: false,
  }));
}

describe("groupTapeDayParts", () => {
  it("groups a midnight-aligned day into five sections", () => {
    const hours = Array.from({ length: 24 }, (_, hour) => hour);
    const groups = groupTapeDayParts(cellsFromHours(hours));
    expect(groups.map((group) => [group.part, group.count])).toEqual([
      ["late-night", 5],
      ["morning", 6],
      ["noon", 4],
      ["evening", 5],
      ["night", 4],
    ]);
  });

  it("splits a wrapped late-night run when the tape ends at hour 00", () => {
    const now = new Date(2026, 7, 14, 0, 7, 0);
    const tape = buildSpeedTape([], now);
    const groups = groupTapeDayParts(tape);
    expect(tape[0]?.label).toBe("01");
    expect(tape[23]?.label).toBe("00");
    expect(groups.map((group) => [group.part, group.count])).toEqual([
      ["late-night", 4],
      ["morning", 6],
      ["noon", 4],
      ["evening", 5],
      ["night", 4],
      ["late-night", 1],
    ]);
  });

  it("returns one group for a single cell", () => {
    expect(groupTapeDayParts(cellsFromHours([12]))).toEqual([
      { part: "noon", startIndex: 0, count: 1 },
    ]);
  });
});

function weatherCell(
  label: string,
  downloadMbps: number | null,
  failed = false,
): TapeCell {
  return {
    hourStart: Number.parseInt(label, 10),
    label,
    downloadMbps,
    uploadMbps: downloadMbps,
    pingMs: downloadMbps === null ? null : 8,
    failed,
  };
}

describe("summarizeTapeGroups", () => {
  it("averages successful downloads and skips empty and failed hours", () => {
    const groups = summarizeTapeGroups([
      weatherCell("11", 80),
      weatherCell("12", null),
      weatherCell("13", null, true),
      weatherCell("14", 60),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.part).toBe("noon");
    expect(groups[0]?.count).toBe(4);
    expect(groups[0]?.avgDownloadMbps).toBe(70);
  });

  it("returns null average when a group has no successful hours", () => {
    const groups = summarizeTapeGroups([
      weatherCell("12", null),
      weatherCell("13", null, true),
    ]);
    expect(groups[0]?.avgDownloadMbps).toBeNull();
  });

  it("keeps separate averages for wrapped late-night chunks", () => {
    const now = new Date(2026, 7, 14, 0, 7, 0);
    const tape = buildSpeedTape(
      [
        row({
          testedAt: new Date(2026, 7, 13, 2, 10, 0).toISOString(),
          downloadMbps: 40,
        }),
        row({
          testedAt: new Date(2026, 7, 14, 0, 5, 0).toISOString(),
          downloadMbps: 10,
        }),
      ],
      now,
    );
    const groups = summarizeTapeGroups(tape);
    expect(groups[0]?.part).toBe("late-night");
    expect(groups[0]?.avgDownloadMbps).toBe(40);
    expect(groups[groups.length - 1]?.part).toBe("late-night");
    expect(groups[groups.length - 1]?.avgDownloadMbps).toBe(10);
  });
});

describe("tapeBarMax", () => {
  it("uses the fastest successful hour and ignores empty and failed", () => {
    expect(
      tapeBarMax([
        weatherCell("11", 40),
        weatherCell("12", null),
        weatherCell("13", 90, true),
        weatherCell("14", 70),
      ]),
    ).toBe(70);
  });

  it("is 0 when nothing succeeded", () => {
    expect(tapeBarMax([weatherCell("12", null, true)])).toBe(0);
  });
});

describe("tapeBarTitle", () => {
  it("names the hour and the outcome", () => {
    expect(tapeBarTitle(weatherCell("12", 40))).toBe("12: 40.0 Mbps");
    expect(tapeBarTitle(weatherCell("13", null))).toBe("13: no reading");
    expect(tapeBarTitle(weatherCell("14", null, true))).toBe("14: failed");
  });
});

describe("tapeBarHeightPct", () => {
  it("scales successful hours to the 24h max and keeps stubs for the rest", () => {
    expect(tapeBarHeightPct(weatherCell("12", 40), 80)).toBe(50);
    expect(tapeBarHeightPct(weatherCell("13", null), 80)).toBeLessThan(15);
    expect(tapeBarHeightPct(weatherCell("14", null, true), 80)).toBeLessThan(30);
    expect(tapeBarHeightPct(weatherCell("12", 40), 0)).toBeLessThan(15);
  });
});
