import { describe, expect, it } from "vitest";
import {
  PAGE_SIZE,
  archiveHref,
  filterRuns,
  formatRunId,
  homeHref,
  pageRuns,
  parseArchiveQuery,
  parseRunId,
  parseRunQuery,
  patchRunQuery,
  runCardId,
  runDetailHref,
  runHref,
  sortRuns,
} from "@/lib/runs";
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

describe("parseArchiveQuery", () => {
  it("defaults unknown values and ignores range and page", () => {
    expect(parseArchiveQuery({})).toEqual({
      status: "all",
      slow: false,
      ping: false,
      sort: "newest",
    });
    expect(
      parseArchiveQuery({
        range: "7d",
        status: "weird",
        page: "9",
        sort: "oldest",
        slow: "1",
      }),
    ).toEqual({
      status: "all",
      slow: true,
      ping: false,
      sort: "oldest",
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
    ).toBe("/app?range=24h");
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
    ).toBe("/app?range=7d&status=ok&slow=1&ping=1&sort=highest-ping&page=2");
  });
});

describe("homeHref", () => {
  it("omits the default 24h range", () => {
    expect(homeHref("24h")).toBe("/app");
    expect(homeHref("7d")).toBe("/app?range=7d");
  });
});

describe("archiveHref", () => {
  it("omits default archive params", () => {
    expect(
      archiveHref({
        status: "all",
        slow: false,
        ping: false,
        sort: "newest",
      }),
    ).toBe("/app/runs");
  });

  it("includes only non-default archive params", () => {
    expect(
      archiveHref({
        status: "failed",
        slow: true,
        ping: true,
        sort: "oldest",
      }),
    ).toBe("/app/runs?status=failed&slow=1&ping=1&sort=oldest");
  });
});

describe("runDetailHref", () => {
  it("points at the run detail page", () => {
    expect(runDetailHref(42)).toBe("/app/runs/42");
  });
});

describe("parseRunId", () => {
  it("accepts a positive integer id and rejects junk", () => {
    expect(parseRunId("42")).toBe(42);
    expect(parseRunId("0")).toBeNull();
    expect(parseRunId("-1")).toBeNull();
    expect(parseRunId("42a")).toBeNull();
    expect(parseRunId("042")).toBeNull();
  });
});

describe("patchRunQuery", () => {
  const base = {
    range: "7d" as const,
    status: "ok" as const,
    slow: true,
    ping: false,
    sort: "newest" as const,
    page: 3,
  };

  it("resets page when status, sort, or problem filters change", () => {
    expect(patchRunQuery(base, { status: "failed" }).page).toBe(1);
    expect(patchRunQuery(base, { sort: "oldest" }).page).toBe(1);
    expect(patchRunQuery(base, { slow: false }).page).toBe(1);
    expect(patchRunQuery(base, { ping: true }).page).toBe(1);
  });

  it("keeps page when only the page changes", () => {
    expect(patchRunQuery(base, { page: 2 })).toEqual({ ...base, page: 2 });
  });

  it("clears status and problem filters without touching sort", () => {
    expect(
      patchRunQuery(base, { status: "all", slow: false, ping: false, page: 1 }),
    ).toEqual({
      ...base,
      status: "all",
      slow: false,
      ping: false,
      page: 1,
    });
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

describe("pageRuns", () => {
  const many = Array.from({ length: 25 }, (_, index) =>
    row({
      id: index + 1,
      testedAt: new Date(Date.UTC(2026, 7, 13, 0, index, 0)).toISOString(),
    }),
  );

  it("uses pages of 24 and returns the remainder on the last page", () => {
    expect(PAGE_SIZE).toBe(24);
    const first = pageRuns(many, 1);
    expect(first.rows).toHaveLength(24);
    expect(first.rows[0]?.id).toBe(1);
    expect(first.total).toBe(25);
    expect(first.page).toBe(1);
    expect(first.pageCount).toBe(2);
    expect(first.from).toBe(1);
    expect(first.to).toBe(24);

    const second = pageRuns(many, 2);
    expect(second.rows).toHaveLength(1);
    expect(second.rows[0]?.id).toBe(25);
    expect(second.from).toBe(25);
    expect(second.to).toBe(25);
  });

  it("clamps page to the last page, or 1 when empty", () => {
    expect(pageRuns(many, 99).page).toBe(2);
    expect(pageRuns(many, 0).page).toBe(1);
    const empty = pageRuns([], 4);
    expect(empty).toEqual({
      rows: [],
      total: 0,
      page: 1,
      pageCount: 1,
      from: 0,
      to: 0,
    });
  });
});

describe("runCardId", () => {
  it("prefixes the numeric run id for a stable DOM id", () => {
    expect(runCardId(42)).toBe("run-42");
  });
});

describe("formatRunId", () => {
  it("shows the run id as a hash label", () => {
    expect(formatRunId(42)).toBe("#42");
  });
});
