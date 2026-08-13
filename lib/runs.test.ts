import { describe, expect, it } from "vitest";
import { filterRuns, parseRunQuery, runHref, sortRuns } from "@/lib/runs";
import type { Summary } from "@/lib/db";
import type { SpeedTestRow } from "@/lib/types";

function row(partial: Partial<SpeedTestRow> & { id: number }): SpeedTestRow {
  return {
    testedAt: "2026-08-13T12:00:00.000Z",
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

const summary: Summary = {
  count: 2,
  download: { min: 40, avg: 100, max: 160 },
  upload: { min: 10, avg: 20, max: 30 },
  ping: { min: 8, avg: 20, max: 50 },
};

const emptySummary: Summary = {
  count: 0,
  download: { min: null, avg: null, max: null },
  upload: { min: null, avg: null, max: null },
  ping: { min: null, avg: null, max: null },
};

const okFast = row({ id: 1, downloadMbps: 160, pingMs: 8 });
const okSlow = row({ id: 2, downloadMbps: 40, pingMs: 50 });
const failed = row({
  id: 3,
  downloadMbps: null,
  uploadMbps: null,
  pingMs: null,
  jitterMs: null,
  packetLoss: null,
  error: "timeout",
});
const tests = [okFast, okSlow, failed];

describe("parseRunQuery", () => {
  it("defaults unknown and missing values", () => {
    expect(parseRunQuery({})).toEqual({
      range: "24h",
      status: "all",
      slow: false,
      ping: false,
      sort: "newest",
      page: 1,
    });
    expect(
      parseRunQuery({
        range: "nope",
        status: "weird",
        slow: "yes",
        ping: "true",
        sort: "fastest",
        page: "0",
      }),
    ).toEqual({
      range: "24h",
      status: "all",
      slow: false,
      ping: false,
      sort: "newest",
      page: 1,
    });
  });

  it("reads known values", () => {
    expect(
      parseRunQuery({
        range: "7d",
        status: "failed",
        slow: "1",
        ping: "1",
        sort: "slowest-down",
        page: "3",
      }),
    ).toEqual({
      range: "7d",
      status: "failed",
      slow: true,
      ping: true,
      sort: "slowest-down",
      page: 3,
    });
  });
});

describe("runHref", () => {
  it("omits default params", () => {
    expect(
      runHref({
        range: "24h",
        status: "all",
        slow: false,
        ping: false,
        sort: "newest",
        page: 1,
      }),
    ).toBe("/?range=24h");
  });

  it("includes only non-default params", () => {
    expect(
      runHref({
        range: "7d",
        status: "ok",
        slow: true,
        ping: true,
        sort: "highest-ping",
        page: 2,
      }),
    ).toBe("/?range=7d&status=ok&slow=1&ping=1&sort=highest-ping&page=2");
  });
});

describe("filterRuns", () => {
  it("filters by status", () => {
    expect(filterRuns(tests, summary, { status: "all", slow: false, ping: false })).toEqual(tests);
    expect(filterRuns(tests, summary, { status: "ok", slow: false, ping: false })).toEqual([
      okFast,
      okSlow,
    ]);
    expect(filterRuns(tests, summary, { status: "failed", slow: false, ping: false })).toEqual([
      failed,
    ]);
  });

  it("keeps downloads strictly below the range average", () => {
    expect(filterRuns(tests, summary, { status: "all", slow: true, ping: false })).toEqual([
      okSlow,
    ]);
    const atAvg = row({ id: 4, downloadMbps: 100 });
    expect(
      filterRuns([atAvg], summary, { status: "all", slow: true, ping: false }),
    ).toEqual([]);
  });

  it("keeps pings strictly above the range average", () => {
    expect(filterRuns(tests, summary, { status: "all", slow: false, ping: true })).toEqual([
      okSlow,
    ]);
  });

  it("combines filters with AND and ignores slow/high on failed rows", () => {
    expect(filterRuns(tests, summary, { status: "ok", slow: true, ping: true })).toEqual([
      okSlow,
    ]);
    expect(filterRuns(tests, summary, { status: "failed", slow: true, ping: false })).toEqual([]);
  });

  it("ignores slow and high ping when averages are null", () => {
    expect(
      filterRuns(tests, emptySummary, { status: "all", slow: true, ping: true }),
    ).toEqual(tests);
  });
});

describe("sortRuns", () => {
  const a = row({
    id: 1,
    testedAt: "2026-08-13T10:00:00.000Z",
    downloadMbps: 80,
    pingMs: 30,
  });
  const b = row({
    id: 2,
    testedAt: "2026-08-13T12:00:00.000Z",
    downloadMbps: 40,
    pingMs: 10,
  });
  const cFailed = row({
    id: 3,
    testedAt: "2026-08-13T11:00:00.000Z",
    downloadMbps: null,
    pingMs: null,
    error: "timeout",
  });

  it("sorts newest and oldest by testedAt then id", () => {
    expect(sortRuns([a, b], "newest").map((item) => item.id)).toEqual([2, 1]);
    expect(sortRuns([b, a], "oldest").map((item) => item.id)).toEqual([1, 2]);
  });

  it("sorts slowest download with missing values last, then newest", () => {
    expect(sortRuns([a, b, cFailed], "slowest-down").map((item) => item.id)).toEqual([
      2, 1, 3,
    ]);
  });

  it("sorts highest ping with missing values last, then newest", () => {
    expect(sortRuns([a, b, cFailed], "highest-ping").map((item) => item.id)).toEqual([
      1, 2, 3,
    ]);
  });
});
