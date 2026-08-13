import { describe, expect, it } from "vitest";
import { buildSpeedTape, dayPartForHour, groupTapeDayParts } from "@/lib/tape";
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
