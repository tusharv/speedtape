import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  defaultDbPath,
  getLatest,
  getSpeedTest,
  insertSpeedTest,
  listChartPoints,
  listOutageContext,
  listPreviousSpeedTests,
  listNextSpeedTests,
  listRecentSpeedTests,
  listIsps,
  listSpeedTests,
  listSpeedTestsPage,
  openDatabase,
  resolveDbPath,
  summarize,
  summarizeRange,
  summarizeWindow,
  type SpeedTestRecord,
} from "@/lib/db";
import { PREVIOUS_RUN_LIMIT } from "@/lib/outage";

const tmpDirs: string[] = [];

function tempDbPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hnc-"));
  tmpDirs.push(dir);
  return path.join(dir, "speedtests.db");
}

function sample(overrides: Partial<SpeedTestRecord> = {}): SpeedTestRecord {
  return {
    testedAt: "2026-08-13T07:00:00.000Z",
    downloadMbps: 100,
    uploadMbps: 20,
    pingMs: 8,
    jitterMs: 1,
    packetLoss: 0,
    isp: "Example ISP",
    serverName: "Example",
    serverLocation: "Austin, TX",
    error: null,
    ...overrides,
  };
}

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("defaultDbPath", () => {
  it("stores the database under Application Support", () => {
    expect(defaultDbPath("/Users/tushar", { platform: "darwin" })).toBe(
      "/Users/tushar/Library/Application Support/speedtape/speedtests.db",
    );
  });
});

describe("resolveDbPath", () => {
  it("reads SPEEDTAPE_DB", () => {
    const previous = process.env.SPEEDTAPE_DB;
    process.env.SPEEDTAPE_DB = "/tmp/custom.db";
    expect(resolveDbPath()).toBe("/tmp/custom.db");
    if (previous === undefined) delete process.env.SPEEDTAPE_DB;
    else process.env.SPEEDTAPE_DB = previous;
  });
});

describe("speed test database", () => {
  it("inserts a record and returns it as the latest", () => {
    const db = openDatabase(tempDbPath());
    insertSpeedTest(db, sample());

    const latest = getLatest(db);
    expect(latest?.downloadMbps).toBe(100);
    expect(latest?.isp).toBe("Example ISP");
    db.close();
  });

  it("filters history to the selected range", () => {
    const db = openDatabase(tempDbPath());
    insertSpeedTest(
      db,
      sample({ testedAt: "2026-08-13T06:00:00.000Z", downloadMbps: 90 }),
    );
    insertSpeedTest(
      db,
      sample({ testedAt: "2026-08-01T06:00:00.000Z", downloadMbps: 40 }),
    );

    const day = listSpeedTests(db, "24h", new Date("2026-08-13T07:00:00.000Z"));
    const month = listSpeedTests(db, "30d", new Date("2026-08-13T07:00:00.000Z"));
    const all = listSpeedTests(db, "all", new Date("2026-08-13T07:00:00.000Z"));

    expect(day).toHaveLength(1);
    expect(month).toHaveLength(2);
    expect(all).toHaveLength(2);
    db.close();
  });

  it("stores failed runs so gaps stay visible", () => {
    const db = openDatabase(tempDbPath());
    insertSpeedTest(
      db,
      sample({
        downloadMbps: null,
        uploadMbps: null,
        pingMs: null,
        jitterMs: null,
        packetLoss: null,
        error: "speedtest CLI was not found",
      }),
    );

    const latest = getLatest(db);
    expect(latest?.error).toBe("speedtest CLI was not found");
    expect(latest?.downloadMbps).toBeNull();
    db.close();
  });

  it("summarizes successful tests only", () => {
    const stats = summarize([
      {
        id: 1,
        ...sample({ downloadMbps: 80, uploadMbps: 10, pingMs: 12 }),
      },
      {
        id: 2,
        ...sample({ downloadMbps: 120, uploadMbps: 30, pingMs: 8 }),
      },
      {
        id: 3,
        ...sample({
          downloadMbps: null,
          uploadMbps: null,
          pingMs: null,
          error: "failed",
        }),
      },
    ]);

    expect(stats.count).toBe(2);
    expect(stats.download.min).toBe(80);
    expect(stats.download.avg).toBe(100);
    expect(stats.download.max).toBe(120);
    expect(stats.upload.min).toBe(10);
    expect(stats.ping.min).toBe(8);
    expect(stats.ping.max).toBe(12);
  });

  it("loads one run by id and returns null when missing", () => {
    const db = openDatabase(tempDbPath());
    const saved = insertSpeedTest(db, sample());

    expect(getSpeedTest(db, saved.id)?.downloadMbps).toBe(100);
    expect(getSpeedTest(db, saved.id + 99)).toBeNull();
    db.close();
  });

  it("summarizes a range in SQLite without loading every row", () => {
    const db = openDatabase(tempDbPath());
    const now = new Date("2026-08-13T07:00:00.000Z");
    insertSpeedTest(
      db,
      sample({ testedAt: "2026-08-13T06:00:00.000Z", downloadMbps: 80, uploadMbps: 10, pingMs: 12 }),
    );
    insertSpeedTest(
      db,
      sample({ testedAt: "2026-08-13T05:00:00.000Z", downloadMbps: 120, uploadMbps: 30, pingMs: 8 }),
    );
    insertSpeedTest(
      db,
      sample({
        testedAt: "2026-08-01T06:00:00.000Z",
        downloadMbps: 40,
        uploadMbps: 5,
        pingMs: 40,
      }),
    );
    insertSpeedTest(
      db,
      sample({
        testedAt: "2026-08-13T04:00:00.000Z",
        downloadMbps: null,
        uploadMbps: null,
        pingMs: null,
        error: "failed",
      }),
    );

    const day = summarizeRange(db, "24h", now);
    expect(day.count).toBe(2);
    expect(day.download.min).toBe(80);
    expect(day.download.avg).toBe(100);
    expect(day.download.max).toBe(120);
    expect(day.upload.min).toBe(10);
    expect(day.ping.min).toBe(8);
    expect(day.ping.max).toBe(12);

    const all = summarizeRange(db, "all", now);
    expect(all.count).toBe(3);
    expect(all.download.min).toBe(40);
    db.close();
  });

  it("lists only the newest N tests in a range", () => {
    const db = openDatabase(tempDbPath());
    const now = new Date("2026-08-13T10:00:00.000Z");
    for (let hour = 0; hour < 5; hour += 1) {
      insertSpeedTest(
        db,
        sample({
          testedAt: new Date(Date.UTC(2026, 7, 13, hour, 0, 0)).toISOString(),
          downloadMbps: hour,
        }),
      );
    }

    const recent = listRecentSpeedTests(db, "24h", now, 2);
    expect(recent.map((row) => row.downloadMbps)).toEqual([4, 3]);
    db.close();
  });

  it("pages filtered runs in SQLite with a total count", () => {
    const db = openDatabase(tempDbPath());
    const now = new Date("2026-08-13T10:00:00.000Z");
    insertSpeedTest(
      db,
      sample({
        testedAt: "2026-08-13T01:00:00.000Z",
        downloadMbps: 160,
        pingMs: 8,
      }),
    );
    insertSpeedTest(
      db,
      sample({
        testedAt: "2026-08-13T02:00:00.000Z",
        downloadMbps: 40,
        pingMs: 50,
      }),
    );
    insertSpeedTest(
      db,
      sample({
        testedAt: "2026-08-13T03:00:00.000Z",
        downloadMbps: null,
        uploadMbps: null,
        pingMs: null,
        error: "timeout",
      }),
    );

    const summary = summarizeRange(db, "all", now);
    const slow = listSpeedTestsPage(db, {
      range: "all",
      status: "all",
      slow: true,
      ping: false,
      sort: "newest",
      offset: 0,
      limit: 50,
      downAvg: summary.download.avg,
      pingAvg: summary.ping.avg,
      now,
    });
    expect(slow.total).toBe(1);
    expect(slow.rows).toHaveLength(1);
    expect(slow.rows[0]?.downloadMbps).toBe(40);

    const paged = listSpeedTestsPage(db, {
      range: "all",
      status: "all",
      slow: false,
      ping: false,
      sort: "oldest",
      offset: 1,
      limit: 1,
      downAvg: null,
      pingAvg: null,
      now,
    });
    expect(paged.total).toBe(3);
    expect(paged.rows).toHaveLength(1);
    expect(paged.rows[0]?.downloadMbps).toBe(40);
    db.close();
  });

  it("filters paged runs and range stats by service provider", () => {
    const db = openDatabase(tempDbPath());
    const now = new Date("2026-08-13T10:00:00.000Z");
    insertSpeedTest(
      db,
      sample({
        testedAt: "2026-08-13T01:00:00.000Z",
        downloadMbps: 40,
        uploadMbps: 10,
        pingMs: 20,
        isp: "Spectrum",
      }),
    );
    insertSpeedTest(
      db,
      sample({
        testedAt: "2026-08-13T02:00:00.000Z",
        downloadMbps: 120,
        uploadMbps: 30,
        pingMs: 8,
        isp: "Spectrum",
      }),
    );
    insertSpeedTest(
      db,
      sample({
        testedAt: "2026-08-13T03:00:00.000Z",
        downloadMbps: 200,
        isp: "Comcast Cable",
      }),
    );
    insertSpeedTest(
      db,
      sample({
        testedAt: "2026-08-13T04:00:00.000Z",
        downloadMbps: null,
        uploadMbps: null,
        pingMs: null,
        isp: null,
        error: "timeout",
      }),
    );

    expect(listIsps(db, { since: null, until: null })).toEqual([
      "Comcast Cable",
      "Spectrum",
    ]);

    const page = listSpeedTestsPage(db, {
      range: "all",
      status: "all",
      slow: false,
      ping: false,
      sort: "oldest",
      offset: 0,
      isp: "Spectrum",
      downAvg: null,
      pingAvg: null,
      now,
    });
    expect(page.total).toBe(2);
    expect(page.rows.map((row) => row.downloadMbps)).toEqual([40, 120]);

    const stats = summarizeWindow(db, {
      since: null,
      until: null,
      isp: "Spectrum",
    });
    expect(stats.count).toBe(2);
    expect(stats.download.min).toBe(40);
    expect(stats.download.avg).toBe(80);
    expect(stats.download.max).toBe(120);
    db.close();
  });

  it("lists narrow chart points in chronological order", () => {
    const db = openDatabase(tempDbPath());
    const now = new Date("2026-08-13T10:00:00.000Z");
    insertSpeedTest(
      db,
      sample({ testedAt: "2026-08-13T03:00:00.000Z", downloadMbps: 30 }),
    );
    insertSpeedTest(
      db,
      sample({ testedAt: "2026-08-13T01:00:00.000Z", downloadMbps: 10 }),
    );
    insertSpeedTest(
      db,
      sample({
        testedAt: "2026-07-01T01:00:00.000Z",
        downloadMbps: 1,
      }),
    );

    const points = listChartPoints(db, "24h", now);
    expect(points).toEqual([
      {
        time: "2026-08-13T01:00:00.000Z",
        download: 10,
        upload: 20,
        ping: 8,
      },
      {
        time: "2026-08-13T03:00:00.000Z",
        download: 30,
        upload: 20,
        ping: 8,
      },
    ]);
    db.close();
  });

  it("lists the five previous runs newest first", () => {
    const db = openDatabase(tempDbPath());
    const inserted = [];
    for (let hour = 1; hour <= 8; hour += 1) {
      inserted.push(
        insertSpeedTest(
          db,
          sample({
            testedAt: `2026-08-13T${String(hour).padStart(2, "0")}:00:00.000Z`,
            downloadMbps: hour,
          }),
        ),
      );
    }
    const current = inserted[7];
    if (!current) throw new Error("expected current run");
    const previous = listPreviousSpeedTests(db, current);
    expect(previous).toHaveLength(PREVIOUS_RUN_LIMIT);
    expect(previous.map((row) => row.downloadMbps)).toEqual([7, 6, 5, 4, 3]);

    const mid = inserted[2];
    if (!mid) throw new Error("expected mid run");
    const next = listNextSpeedTests(db, mid);
    expect(next).toHaveLength(PREVIOUS_RUN_LIMIT);
    expect(next.map((row) => row.downloadMbps)).toEqual([4, 5, 6, 7, 8]);
    db.close();
  });

  it("loads the outage streak around a failed run", () => {
    const db = openDatabase(tempDbPath());
    insertSpeedTest(
      db,
      sample({ testedAt: "2026-08-13T01:00:00.000Z", downloadMbps: 100 }),
    );
    insertSpeedTest(
      db,
      sample({
        testedAt: "2026-08-13T02:00:00.000Z",
        downloadMbps: null,
        uploadMbps: null,
        pingMs: null,
        error: "timeout",
      }),
    );
    const current = insertSpeedTest(
      db,
      sample({
        testedAt: "2026-08-13T03:00:00.000Z",
        downloadMbps: null,
        uploadMbps: null,
        pingMs: null,
        error: "timeout",
      }),
    );
    insertSpeedTest(
      db,
      sample({
        testedAt: "2026-08-13T04:00:00.000Z",
        downloadMbps: null,
        uploadMbps: null,
        pingMs: null,
        error: "timeout",
      }),
    );
    insertSpeedTest(
      db,
      sample({ testedAt: "2026-08-13T05:00:00.000Z", downloadMbps: 90 }),
    );

    const context = listOutageContext(db, current);
    expect(context.map((row) => row.testedAt)).toEqual([
      "2026-08-13T02:00:00.000Z",
      "2026-08-13T03:00:00.000Z",
      "2026-08-13T04:00:00.000Z",
      "2026-08-13T05:00:00.000Z",
    ]);
    db.close();
  });
});
