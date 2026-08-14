import fs from "node:fs";
import path from "node:path";
import { withDatabase, insertSpeedTest, resolveDbPath } from "@/lib/db";
import { speedtestLockPath } from "@/lib/paths";
import {
  collectSpeedtest,
  errorRecord,
  type SpawnFn,
} from "@/lib/speedtest";
import type { SpeedTestRow } from "@/lib/types";

export const ANOTHER_TEST_RUNNING = "another test is still running";
export const LOCK_WAIT_MS = 180_000;
const LOCK_POLL_MS = 25;

export async function recordSpeedtest(options?: {
  spawn?: SpawnFn;
  now?: () => Date;
  lockWaitMs?: number;
}): Promise<SpeedTestRow> {
  const now = options?.now ?? (() => new Date());
  const lockPath = speedtestLockPath(resolveDbPath());
  const fd = await acquireLock(lockPath, options?.lockWaitMs ?? LOCK_WAIT_MS);
  if (fd === null) {
    const record = errorRecord(ANOTHER_TEST_RUNNING, now().toISOString());
    return withDatabase((db) => insertSpeedTest(db, record));
  }
  try {
    const record = await collectSpeedtest(options);
    return withDatabase((db) => insertSpeedTest(db, record));
  } finally {
    releaseLock(lockPath, fd);
  }
}

function stealIfStale(lockPath: string): void {
  try {
    const pid = Number(fs.readFileSync(lockPath, "utf8").trim());
    if (!Number.isInteger(pid) || pid <= 0) return;
    try {
      process.kill(pid, 0);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "EPERM") return;
      fs.unlinkSync(lockPath);
    }
  } catch {
    // Missing or unreadable lock. The next wx open will win or fail.
  }
}

async function acquireLock(
  lockPath: string,
  waitMs: number,
): Promise<number | null> {
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  const deadline = Date.now() + waitMs;
  while (true) {
    stealIfStale(lockPath);
    try {
      const fd = fs.openSync(lockPath, "wx");
      fs.writeSync(fd, String(process.pid));
      return fd;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
      if (Date.now() >= deadline) return null;
      await new Promise((resolve) => setTimeout(resolve, LOCK_POLL_MS));
    }
  }
}

function releaseLock(lockPath: string, fd: number): void {
  try {
    fs.closeSync(fd);
  } catch {
    // Already closed.
  }
  try {
    fs.unlinkSync(lockPath);
  } catch {
    // Already removed.
  }
}
