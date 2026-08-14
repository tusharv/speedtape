import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openDatabase } from "@/lib/db";
import {
  cadenceLine,
  deleteSchedule,
  expandCalendar,
  formatAgentCount,
  insertSchedule,
  INTERVAL_PRESETS,
  listSchedules,
  parseAgentInput,
} from "@/lib/schedules";

const tmpDirs: string[] = [];

function tempDb() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "st-sched-"));
  tmpDirs.push(dir);
  return openDatabase(path.join(dir, "speedtests.db"));
}

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("expandCalendar", () => {
  it("omits weekday when all seven days are selected and sorts times", () => {
    expect(expandCalendar(["21:30", "08:00"], [0, 1, 2, 3, 4, 5, 6])).toEqual([
      { hour: 8, minute: 0 },
      { hour: 21, minute: 30 },
    ]);
  });

  it("pairs each weekday with each time", () => {
    expect(expandCalendar(["18:00", "21:00"], [1, 5])).toEqual([
      { weekday: 1, hour: 18, minute: 0 },
      { weekday: 1, hour: 21, minute: 0 },
      { weekday: 5, hour: 18, minute: 0 },
      { weekday: 5, hour: 21, minute: 0 },
    ]);
  });
});

describe("cadenceLine", () => {
  it("names interval presets", () => {
    expect(cadenceLine({ kind: "interval", intervalSeconds: 900 })).toBe(
      "every 15 min",
    );
    expect(cadenceLine({ kind: "interval", intervalSeconds: 3600 })).toBe(
      "every 1 hour",
    );
  });

  it("lists clock times every day", () => {
    expect(
      cadenceLine({
        kind: "clock",
        times: ["18:00", "21:00"],
        weekdays: [0, 1, 2, 3, 4, 5, 6],
      }),
    ).toBe("18:00, 21:00 · every day");
  });

  it("lists clock times on a weekday subset", () => {
    expect(
      cadenceLine({
        kind: "clock",
        times: ["18:00"],
        weekdays: [1, 3, 5],
      }),
    ).toBe("18:00 · Mon, Wed, Fri");
  });
});

describe("formatAgentCount", () => {
  it("uses singular, plural, and none", () => {
    expect(formatAgentCount(0)).toBe("No agents loaded");
    expect(formatAgentCount(1)).toBe("1 agent loaded");
    expect(formatAgentCount(2)).toBe("2 agents loaded");
  });
});

describe("parseAgentInput", () => {
  it("trims the name and accepts an interval preset", () => {
    const result = parseAgentInput({
      name: "  Hourly  ",
      kind: "interval",
      intervalSeconds: 3600,
    });
    expect(result).toEqual({
      ok: true,
      value: {
        name: "Hourly",
        kind: "interval",
        intervalSeconds: 3600,
      },
    });
  });

  it("rejects an empty name", () => {
    const result = parseAgentInput({
      name: "   ",
      kind: "interval",
      intervalSeconds: 3600,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/name/i);
  });

  it("coerces empty weekdays to every day", () => {
    const result = parseAgentInput({
      name: "Evening",
      kind: "clock",
      times: ["18:00"],
      weekdays: [],
    });
    expect(result.ok).toBe(true);
    if (result.ok && result.value.kind === "clock") {
      expect(result.value.weekdays).toEqual([0, 1, 2, 3, 4, 5, 6]);
    }
  });

  it("rejects clock input with no times", () => {
    const result = parseAgentInput({
      name: "Evening",
      kind: "clock",
      times: [],
      weekdays: [1],
    });
    expect(result.ok).toBe(false);
  });
});

describe("schedule rows", () => {
  it("inserts, lists, and deletes without touching speed_tests", () => {
    const db = tempDb();
    const created = insertSchedule(db, {
      name: "Hourly",
      kind: "interval",
      intervalSeconds: 3600,
    });
    expect(created.id).toBe(1);
    expect(listSchedules(db)).toHaveLength(1);
    expect(listSchedules(db)[0]?.name).toBe("Hourly");

    db.prepare(
      `INSERT INTO speed_tests (tested_at, download_mbps, upload_mbps, ping_ms, jitter_ms, packet_loss, isp, server_name, server_location, error)
       VALUES ('2026-08-14T00:00:00.000Z', 1, 1, 1, 1, 0, 'x', 'x', 'x', NULL)`,
    ).run();

    deleteSchedule(db, created.id);
    expect(listSchedules(db)).toEqual([]);
    const remaining = db
      .prepare("SELECT COUNT(*) AS n FROM speed_tests")
      .get() as { n: number };
    expect(remaining.n).toBe(1);
    db.close();
  });
});

describe("INTERVAL_PRESETS", () => {
  it("is the seven allowed intervals", () => {
    expect(INTERVAL_PRESETS.map((item) => item.seconds)).toEqual([
      900, 1800, 3600, 7200, 21600, 43200, 86400,
    ]);
  });
});
