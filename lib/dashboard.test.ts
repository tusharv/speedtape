import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { CHART_MAX_POINTS } from "@/lib/chart";
import { loadDashboard } from "@/lib/dashboard";
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
});
