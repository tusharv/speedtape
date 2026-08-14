import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { getLatest, listSpeedTests, openDatabase } from "@/lib/db";
import { ANOTHER_TEST_RUNNING, recordSpeedtest } from "@/lib/record";
import type { SpawnFn } from "@/lib/speedtest";

const tmpDirs: string[] = [];
const originalDb = process.env.SPEEDTAPE_DB;

function tempDbPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "st-lock-"));
  tmpDirs.push(dir);
  const dbPath = path.join(dir, "speedtests.db");
  process.env.SPEEDTAPE_DB = dbPath;
  return dbPath;
}

function okSpawn(delayMs = 0): SpawnFn {
  return async () => {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    return {
      code: 0,
      stdout: JSON.stringify({
        timestamp: "2026-08-14T12:00:00.000Z",
        ping: { latency: 8 },
        download: { bandwidth: 125000 },
        upload: { bandwidth: 125000 },
      }),
      stderr: "",
    };
  };
}

afterEach(() => {
  if (originalDb === undefined) delete process.env.SPEEDTAPE_DB;
  else process.env.SPEEDTAPE_DB = originalDb;
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("recordSpeedtest lock", () => {
  it("queues a second run until the first finishes", async () => {
    tempDbPath();
    const order: string[] = [];
    const first = recordSpeedtest({
      spawn: async () => {
        order.push("first-start");
        await new Promise((resolve) => setTimeout(resolve, 80));
        order.push("first-end");
        return okSpawn()("", []);
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    const second = recordSpeedtest({
      spawn: async () => {
        order.push("second");
        return okSpawn()("", []);
      },
    });
    await Promise.all([first, second]);
    expect(order).toEqual(["first-start", "first-end", "second"]);

    const db = openDatabase(process.env.SPEEDTAPE_DB as string);
    expect(listSpeedTests(db, "all")).toHaveLength(2);
    db.close();
  });

  it("inserts an error row when the lock wait times out", async () => {
    const dbPath = tempDbPath();
    const lockPath = path.join(path.dirname(dbPath), "speedtest.lock");
    fs.writeFileSync(lockPath, "1");
    const row = await recordSpeedtest({
      spawn: okSpawn(),
      lockWaitMs: 40,
    });
    expect(row.error).toBe(ANOTHER_TEST_RUNNING);
    const db = openDatabase(dbPath);
    expect(getLatest(db)?.error).toBe(ANOTHER_TEST_RUNNING);
    db.close();
  });
});
