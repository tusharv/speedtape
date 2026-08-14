import { withDatabase, insertSpeedTest } from "@/lib/db";
import { collectSpeedtest, type SpawnFn } from "@/lib/speedtest";
import type { SpeedTestRow } from "@/lib/types";

export async function recordSpeedtest(options?: {
  spawn?: SpawnFn;
  now?: () => Date;
}): Promise<SpeedTestRow> {
  const record = await collectSpeedtest(options);
  return withDatabase((db) => insertSpeedTest(db, record));
}
