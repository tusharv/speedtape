import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { defaultDbPath, legacyDbPath } from "@/lib/paths";

export type MigrateResult =
  | { status: "copied"; rows: number }
  | { status: "skipped"; reason: "dest-exists" | "no-legacy" };

function sidecar(filePath: string): string[] {
  return [`${filePath}-wal`, `${filePath}-shm`];
}

function countRows(filePath: string): number {
  const db = new Database(filePath, { readonly: true, fileMustExist: true });
  try {
    const row = db.prepare("SELECT COUNT(*) AS n FROM speed_tests").get() as {
      n: number;
    };
    return row.n;
  } finally {
    db.close();
  }
}

function removeDest(dest: string): void {
  for (const file of [dest, ...sidecar(dest)]) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
}

export function migrateLegacyDatabase(
  homeDir = os.homedir(),
): MigrateResult {
  const dest = defaultDbPath(homeDir);
  const src = legacyDbPath(homeDir);
  if (fs.existsSync(dest)) {
    return { status: "skipped", reason: "dest-exists" };
  }
  if (!fs.existsSync(src)) {
    return { status: "skipped", reason: "no-legacy" };
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  try {
    fs.copyFileSync(src, dest);
    for (const extra of sidecar(src)) {
      if (fs.existsSync(extra)) {
        fs.copyFileSync(extra, extra.replace(src, dest));
      }
    }
    const rows = countRows(src);
    const copied = countRows(dest);
    if (copied !== rows) {
      removeDest(dest);
      throw new Error(
        `Speedtape migrate copied ${copied} rows from ${src} into ${dest}, expected ${rows}`,
      );
    }
    return { status: "copied", rows };
  } catch (err) {
    removeDest(dest);
    if (err instanceof Error && err.message.startsWith("Speedtape migrate")) {
      throw err;
    }
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Speedtape could not copy ${src} to ${dest}: ${detail}`,
    );
  }
}

export function prepareDatabasePath(homeDir = os.homedir()): string {
  if (process.env.SPEEDTAPE_DB) return process.env.SPEEDTAPE_DB;
  migrateLegacyDatabase(homeDir);
  return defaultDbPath(homeDir);
}
