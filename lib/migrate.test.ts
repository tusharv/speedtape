import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { defaultDbPath, legacyDbPath } from "@/lib/paths";
import { migrateLegacyDatabase, prepareDatabasePath } from "@/lib/migrate";
import { insertSpeedTest, openDatabase } from "@/lib/db";

const tmpDirs: string[] = [];

function tempHome(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "speedtape-home-"));
  tmpDirs.push(dir);
  return dir;
}

function seedLegacy(homeDir: string, rows: number): void {
  const file = legacyDbPath(homeDir);
  const db = openDatabase(file);
  for (let i = 0; i < rows; i += 1) {
    insertSpeedTest(db, {
      testedAt: `2026-08-13T0${i}:00:00.000Z`,
      downloadMbps: 100 + i,
      uploadMbps: 20,
      pingMs: 8,
      jitterMs: 1,
      packetLoss: 0,
      isp: "ISP",
      serverName: "Server",
      serverLocation: "Austin, TX",
      error: null,
    });
  }
  db.close();
}

afterEach(() => {
  delete process.env.SPEEDTAPE_DB;
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("migrateLegacyDatabase", () => {
  it("copies legacy rows into the new path and leaves the old file", () => {
    const home = tempHome();
    seedLegacy(home, 3);
    const result = migrateLegacyDatabase(home);
    expect(result).toEqual({ status: "copied", rows: 3 });
    const dest = openDatabase(defaultDbPath(home));
    const count = dest.prepare("SELECT COUNT(*) AS n FROM speed_tests").get() as {
      n: number;
    };
    expect(count.n).toBe(3);
    dest.close();
    expect(fs.existsSync(legacyDbPath(home))).toBe(true);
  });

  it("copies wal and shm siblings when present", () => {
    const home = tempHome();
    const file = legacyDbPath(home);
    const db = openDatabase(file);
    db.pragma("journal_mode = WAL");
    insertSpeedTest(db, {
      testedAt: "2026-08-13T01:00:00.000Z",
      downloadMbps: 100,
      uploadMbps: 20,
      pingMs: 8,
      jitterMs: 1,
      packetLoss: 0,
      isp: "ISP",
      serverName: "Server",
      serverLocation: "Austin, TX",
      error: null,
    });
    expect(fs.existsSync(`${file}-wal`)).toBe(true);
    migrateLegacyDatabase(home);
    db.close();
    const dest = defaultDbPath(home);
    expect(fs.existsSync(`${dest}-wal`)).toBe(true);
  });

  it("is a no-op when the new db already exists", () => {
    const home = tempHome();
    seedLegacy(home, 2);
    fs.mkdirSync(path.dirname(defaultDbPath(home)), { recursive: true });
    fs.writeFileSync(defaultDbPath(home), "existing");
    expect(migrateLegacyDatabase(home)).toEqual({
      status: "skipped",
      reason: "dest-exists",
    });
    expect(fs.readFileSync(defaultDbPath(home), "utf8")).toBe("existing");
  });

  it("is a no-op when legacy is missing", () => {
    const home = tempHome();
    expect(migrateLegacyDatabase(home)).toEqual({
      status: "skipped",
      reason: "no-legacy",
    });
    expect(fs.existsSync(defaultDbPath(home))).toBe(false);
  });
});

describe("prepareDatabasePath", () => {
  it("returns SPEEDTAPE_DB without migrating", () => {
    const home = tempHome();
    seedLegacy(home, 1);
    process.env.SPEEDTAPE_DB = "/tmp/override.db";
    expect(prepareDatabasePath(home)).toBe("/tmp/override.db");
    expect(fs.existsSync(defaultDbPath(home))).toBe(false);
  });

  it("copies legacy data before any new empty speedtests.db is created", () => {
    const home = tempHome();
    seedLegacy(home, 2);
    const prepared = prepareDatabasePath(home);
    expect(prepared).toBe(defaultDbPath(home));
    expect(fs.existsSync(prepared)).toBe(true);
    const db = new Database(prepared, { readonly: true, fileMustExist: true });
    const count = db.prepare("SELECT COUNT(*) AS n FROM speed_tests").get() as {
      n: number;
    };
    db.close();
    expect(count.n).toBe(2);
  });
});
