import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { CHART_MAX_POINTS } from "@/lib/chart";
import { loadArchive, loadArchiveExport, loadDashboard, loadRunDetail } from "@/lib/dashboard";
import { HOME_PREVIEW_SIZE, insertSpeedTest, openDatabase } from "@/lib/db";

const tmpDirs: string[] = [];
const originalDb = process.env.SPEEDTAPE_DB;

afterEach(() => {
  if (originalDb === undefined) {
    delete process.env.SPEEDTAPE_DB;
  } else {
    process.env.SPEEDTAPE_DB = originalDb;
  }
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("loadDashboard", () => {
  it("caps preview cards and chart points so a long archive stays bounded", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hnc-dash-"));
    tmpDirs.push(dir);
    const dbPath = path.join(dir, "speedtests.db");
    process.env.SPEEDTAPE_DB = dbPath;

    const db = openDatabase(dbPath);
    const now = new Date("2026-08-13T12:00:00.000Z");
    for (let i = 0; i < 120; i += 1) {
      insertSpeedTest(db, {
        testedAt: new Date(now.getTime() - i * 60 * 60 * 1000).toISOString(),
        downloadMbps: 100,
        uploadMbps: 20,
        pingMs: 8,
        jitterMs: 1,
        packetLoss: 0,
        isp: "ISP",
        serverName: "Server",
        serverLocation: "Here",
        error: null,
      });
    }
    db.close();

    const data = loadDashboard("all", now);
    expect(data.preview).toHaveLength(HOME_PREVIEW_SIZE);
    expect(data.preview[0]?.testedAt).toBe(now.toISOString());
    expect(data.chart.length).toBeLessThanOrEqual(CHART_MAX_POINTS);
    expect(data.summary.count).toBe(120);
    expect(data.agentsLoaded).toBe(0);
    expect("tests" in data).toBe(false);
  });

  it("loads previous runs and the outage window for a failed sample", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hnc-dash-"));
    tmpDirs.push(dir);
    const dbPath = path.join(dir, "speedtests.db");
    process.env.SPEEDTAPE_DB = dbPath;

    const db = openDatabase(dbPath);
    insertSpeedTest(db, {
      testedAt: "2026-08-13T01:00:00.000Z",
      downloadMbps: 100,
      uploadMbps: 20,
      pingMs: 8,
      jitterMs: 1,
      packetLoss: 0,
      isp: "ISP",
      serverName: "Server",
      serverLocation: "Here",
      error: null,
    });
    insertSpeedTest(db, {
      testedAt: "2026-08-13T02:00:00.000Z",
      downloadMbps: null,
      uploadMbps: null,
      pingMs: null,
      jitterMs: null,
      packetLoss: null,
      isp: null,
      serverName: null,
      serverLocation: null,
      error: "timeout",
    });
    const current = insertSpeedTest(db, {
      testedAt: "2026-08-13T03:00:00.000Z",
      downloadMbps: null,
      uploadMbps: null,
      pingMs: null,
      jitterMs: null,
      packetLoss: null,
      isp: null,
      serverName: null,
      serverLocation: null,
      error: "timeout",
    });
    insertSpeedTest(db, {
      testedAt: "2026-08-13T05:00:00.000Z",
      downloadMbps: 90,
      uploadMbps: 20,
      pingMs: 8,
      jitterMs: 1,
      packetLoss: 0,
      isp: "ISP",
      serverName: "Server",
      serverLocation: "Here",
      error: null,
    });
    db.close();

    const detail = loadRunDetail(current.id);
    expect(detail?.previous).toHaveLength(2);
    expect(detail?.previous[0]?.testedAt).toBe("2026-08-13T02:00:00.000Z");
    expect(detail?.neighbors.map((row) => row.testedAt)).toEqual([
      "2026-08-13T01:00:00.000Z",
      "2026-08-13T02:00:00.000Z",
      "2026-08-13T03:00:00.000Z",
      "2026-08-13T05:00:00.000Z",
    ]);
    expect(detail?.outage).toEqual({
      wentDownAt: "2026-08-13T02:00:00.000Z",
      restoredAt: "2026-08-13T05:00:00.000Z",
    });
  });
});

describe("loadArchive", () => {
  it("keeps the list and CSV export inside the selected time window", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hnc-dash-"));
    tmpDirs.push(dir);
    const dbPath = path.join(dir, "speedtests.db");
    process.env.SPEEDTAPE_DB = dbPath;

    const db = openDatabase(dbPath);
    const now = new Date("2026-08-16T12:00:00.000Z");
    insertSpeedTest(db, {
      testedAt: "2026-08-16T11:00:00.000Z",
      downloadMbps: 100,
      uploadMbps: 20,
      pingMs: 8,
      jitterMs: 1,
      packetLoss: 0,
      isp: "ISP",
      serverName: "Server",
      serverLocation: "Here",
      error: null,
    });
    insertSpeedTest(db, {
      testedAt: "2026-08-01T12:00:00.000Z",
      downloadMbps: 40,
      uploadMbps: 10,
      pingMs: 20,
      jitterMs: 1,
      packetLoss: 0,
      isp: "ISP",
      serverName: "Server",
      serverLocation: "Here",
      error: null,
    });
    db.close();

    const query = {
      range: "7d" as const,
      from: null,
      to: null,
      status: "all" as const,
      slow: false,
      ping: false,
      sort: "newest" as const,
      isp: null,
    };
    const archive = loadArchive(query, 0, now);
    expect(archive.total).toBe(1);
    expect(archive.rows).toHaveLength(1);
    expect(archive.rows[0]?.testedAt).toBe("2026-08-16T11:00:00.000Z");
    expect(archive.summary.count).toBe(1);

    const csvRows = loadArchiveExport(query, now);
    expect(csvRows).toHaveLength(1);
    expect(csvRows[0]?.testedAt).toBe("2026-08-16T11:00:00.000Z");
  });

  it("keeps the list and CSV export inside picked calendar days", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hnc-dash-"));
    tmpDirs.push(dir);
    const dbPath = path.join(dir, "speedtests.db");
    process.env.SPEEDTAPE_DB = dbPath;

    const db = openDatabase(dbPath);
    const early = insertSpeedTest(db, {
      testedAt: "2026-08-01T12:00:00.000Z",
      downloadMbps: 40,
      uploadMbps: 10,
      pingMs: 20,
      jitterMs: 1,
      packetLoss: 0,
      isp: "ISP",
      serverName: "Server",
      serverLocation: "Here",
      error: null,
    });
    insertSpeedTest(db, {
      testedAt: "2026-08-16T11:00:00.000Z",
      downloadMbps: 100,
      uploadMbps: 20,
      pingMs: 8,
      jitterMs: 1,
      packetLoss: 0,
      isp: "ISP",
      serverName: "Server",
      serverLocation: "Here",
      error: null,
    });
    db.close();

    const day = new Date(early.testedAt);
    const from = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    const query = {
      range: "7d" as const,
      from,
      to: from,
      status: "all" as const,
      slow: false,
      ping: false,
      sort: "newest" as const,
      isp: null,
    };
    const archive = loadArchive(query);
    expect(archive.total).toBe(1);
    expect(archive.rows[0]?.testedAt).toBe("2026-08-01T12:00:00.000Z");
    expect(loadArchiveExport(query)).toHaveLength(1);
  });

  it("filters the archive list, stats, and CSV by service provider", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hnc-dash-"));
    tmpDirs.push(dir);
    const dbPath = path.join(dir, "speedtests.db");
    process.env.SPEEDTAPE_DB = dbPath;

    const db = openDatabase(dbPath);
    insertSpeedTest(db, {
      testedAt: "2026-08-16T11:00:00.000Z",
      downloadMbps: 40,
      uploadMbps: 10,
      pingMs: 20,
      jitterMs: 1,
      packetLoss: 0,
      isp: "Spectrum",
      serverName: "Server",
      serverLocation: "Here",
      error: null,
    });
    insertSpeedTest(db, {
      testedAt: "2026-08-16T12:00:00.000Z",
      downloadMbps: 120,
      uploadMbps: 30,
      pingMs: 8,
      jitterMs: 1,
      packetLoss: 0,
      isp: "Spectrum",
      serverName: "Server",
      serverLocation: "Here",
      error: null,
    });
    insertSpeedTest(db, {
      testedAt: "2026-08-16T13:00:00.000Z",
      downloadMbps: 200,
      uploadMbps: 40,
      pingMs: 5,
      jitterMs: 1,
      packetLoss: 0,
      isp: "Comcast Cable",
      serverName: "Server",
      serverLocation: "Here",
      error: null,
    });
    db.close();

    const query = {
      range: "all" as const,
      from: null,
      to: null,
      status: "all" as const,
      slow: false,
      ping: false,
      sort: "newest" as const,
      isp: "Spectrum",
    };
    const archive = loadArchive(query);
    expect(archive.providers).toEqual(["Comcast Cable", "Spectrum"]);
    expect(archive.total).toBe(2);
    expect(archive.rows.map((row) => row.isp)).toEqual(["Spectrum", "Spectrum"]);
    expect(archive.summary.download.min).toBe(40);
    expect(archive.summary.download.avg).toBe(80);
    expect(archive.summary.download.max).toBe(120);
    expect(loadArchiveExport(query)).toHaveLength(2);
  });
});
