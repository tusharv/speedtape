import { describe, expect, it } from "vitest";
import {
  formatOutageDuration,
  outageWindow,
  PREVIOUS_RUN_LIMIT,
} from "@/lib/outage";
import type { SpeedTestRow } from "@/lib/types";

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

function fail(
  partial: Partial<SpeedTestRow> & { id: number; testedAt: string },
): SpeedTestRow {
  return row({
    downloadMbps: null,
    uploadMbps: null,
    pingMs: null,
    jitterMs: null,
    packetLoss: null,
    error: "timeout",
    ...partial,
  });
}

const ok1 = row({ id: 1, testedAt: "2026-08-13T01:00:00.000Z" });
const fail2 = fail({ id: 2, testedAt: "2026-08-13T02:00:00.000Z" });
const fail3 = fail({ id: 3, testedAt: "2026-08-13T03:00:00.000Z" });
const fail4 = fail({ id: 4, testedAt: "2026-08-13T04:00:00.000Z" });
const ok5 = row({ id: 5, testedAt: "2026-08-13T05:00:00.000Z" });
const ordered = [ok1, fail2, fail3, fail4, ok5];

describe("outageWindow", () => {
  it("returns null for a successful run", () => {
    expect(outageWindow(ok5, ordered)).toBeNull();
  });

  it("uses the first consecutive failure as went-down and the next ok as restored", () => {
    expect(outageWindow(fail3, ordered)).toEqual({
      wentDownAt: "2026-08-13T02:00:00.000Z",
      restoredAt: "2026-08-13T05:00:00.000Z",
    });
  });

  it("leaves restored empty when the line is still down", () => {
    expect(outageWindow(fail3, [ok1, fail2, fail3, fail4])).toEqual({
      wentDownAt: "2026-08-13T02:00:00.000Z",
      restoredAt: null,
    });
  });

  it("treats a lone failure as both the start and the current sample", () => {
    expect(outageWindow(fail2, [ok1, fail2, ok5])).toEqual({
      wentDownAt: "2026-08-13T02:00:00.000Z",
      restoredAt: "2026-08-13T05:00:00.000Z",
    });
  });
});

describe("formatOutageDuration", () => {
  it("formats hours and minutes between down and restore", () => {
    expect(
      formatOutageDuration(
        "2026-08-13T02:00:00.000Z",
        "2026-08-13T05:48:00.000Z",
      ),
    ).toBe("3h 48m");
  });

  it("says still down when there is no restore time", () => {
    expect(formatOutageDuration("2026-08-13T02:00:00.000Z", null)).toBe(
      "Still down",
    );
  });
});

describe("PREVIOUS_RUN_LIMIT", () => {
  it("keeps five earlier samples on a run page", () => {
    expect(PREVIOUS_RUN_LIMIT).toBe(5);
  });
});
