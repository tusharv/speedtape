import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import type { ChartPoint } from "@/lib/chart";
import { prepareDatabasePath } from "@/lib/migrate";
import { defaultDbPath } from "@/lib/paths";
import type { Range, SpeedTestRecord, SpeedTestRow } from "@/lib/types";

export type { Range, SpeedTestRecord, SpeedTestRow };
export { defaultDbPath };

const RANGE_MS: Record<Exclude<Range, "all">, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

type DbRow = {
  id: number;
  tested_at: string;
  download_mbps: number | null;
  upload_mbps: number | null;
  ping_ms: number | null;
  jitter_ms: number | null;
  packet_loss: number | null;
  isp: string | null;
  server_name: string | null;
  server_location: string | null;
  error: string | null;
};

export function resolveDbPath(): string {
  return process.env.SPEEDTAPE_DB ?? defaultDbPath();
}

export function openDatabase(filePath: string): Database.Database {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const db = new Database(filePath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS speed_tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tested_at TEXT NOT NULL,
      download_mbps REAL,
      upload_mbps REAL,
      ping_ms REAL,
      jitter_ms REAL,
      packet_loss REAL,
      isp TEXT,
      server_name TEXT,
      server_location TEXT,
      error TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_speed_tests_tested_at
      ON speed_tests (tested_at);
  `);
  return db;
}

function mapRow(row: DbRow): SpeedTestRow {
  return {
    id: row.id,
    testedAt: row.tested_at,
    downloadMbps: row.download_mbps,
    uploadMbps: row.upload_mbps,
    pingMs: row.ping_ms,
    jitterMs: row.jitter_ms,
    packetLoss: row.packet_loss,
    isp: row.isp,
    serverName: row.server_name,
    serverLocation: row.server_location,
    error: row.error,
  };
}

export function insertSpeedTest(
  db: Database.Database,
  record: SpeedTestRecord,
): SpeedTestRow {
  const result = db
    .prepare(
      `INSERT INTO speed_tests (
        tested_at, download_mbps, upload_mbps, ping_ms, jitter_ms,
        packet_loss, isp, server_name, server_location, error
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      record.testedAt,
      record.downloadMbps,
      record.uploadMbps,
      record.pingMs,
      record.jitterMs,
      record.packetLoss,
      record.isp,
      record.serverName,
      record.serverLocation,
      record.error,
    );

  return {
    id: Number(result.lastInsertRowid),
    ...record,
  };
}

export function getLatest(db: Database.Database): SpeedTestRow | null {
  const row = db
    .prepare(
      `SELECT * FROM speed_tests ORDER BY tested_at DESC, id DESC LIMIT 1`,
    )
    .get() as DbRow | undefined;
  return row ? mapRow(row) : null;
}

export function getSpeedTest(
  db: Database.Database,
  id: number,
): SpeedTestRow | null {
  const row = db
    .prepare(`SELECT * FROM speed_tests WHERE id = ?`)
    .get(id) as DbRow | undefined;
  return row ? mapRow(row) : null;
}

export const HOME_PREVIEW_SIZE = 24;
export const ARCHIVE_PAGE_SIZE = 50;

function rangeSince(range: Range, now: Date): string | null {
  if (range === "all") return null;
  return new Date(now.getTime() - RANGE_MS[range]).toISOString();
}

export function listSpeedTests(
  db: Database.Database,
  range: Range,
  now = new Date(),
): SpeedTestRow[] {
  const since = rangeSince(range, now);

  const rows = (
    since
      ? db
          .prepare(
            `SELECT * FROM speed_tests
             WHERE tested_at >= ?
             ORDER BY tested_at ASC, id ASC`,
          )
          .all(since)
      : db
          .prepare(
            `SELECT * FROM speed_tests ORDER BY tested_at ASC, id ASC`,
          )
          .all()
  ) as DbRow[];

  return rows.map(mapRow);
}

export function listRecentSpeedTests(
  db: Database.Database,
  range: Range,
  now = new Date(),
  limit = HOME_PREVIEW_SIZE,
): SpeedTestRow[] {
  const since = rangeSince(range, now);
  const rows = (
    since
      ? db
          .prepare(
            `SELECT * FROM speed_tests
             WHERE tested_at >= ?
             ORDER BY tested_at DESC, id DESC
             LIMIT ?`,
          )
          .all(since, limit)
      : db
          .prepare(
            `SELECT * FROM speed_tests
             ORDER BY tested_at DESC, id DESC
             LIMIT ?`,
          )
          .all(limit)
  ) as DbRow[];
  return rows.map(mapRow);
}

export function listChartPoints(
  db: Database.Database,
  range: Range,
  now = new Date(),
): ChartPoint[] {
  const since = rangeSince(range, now);
  const rows = (
    since
      ? db
          .prepare(
            `SELECT tested_at, download_mbps, upload_mbps, ping_ms
             FROM speed_tests
             WHERE tested_at >= ?
             ORDER BY tested_at ASC, id ASC`,
          )
          .all(since)
      : db
          .prepare(
            `SELECT tested_at, download_mbps, upload_mbps, ping_ms
             FROM speed_tests
             ORDER BY tested_at ASC, id ASC`,
          )
          .all()
  ) as Array<{
    tested_at: string;
    download_mbps: number | null;
    upload_mbps: number | null;
    ping_ms: number | null;
  }>;
  return rows.map((row) => ({
    time: row.tested_at,
    download: row.download_mbps,
    upload: row.upload_mbps,
    ping: row.ping_ms,
  }));
}

export type SpeedTestPageQuery = {
  range: Range;
  status: "all" | "ok" | "failed";
  slow: boolean;
  ping: boolean;
  sort: "newest" | "oldest" | "slowest-down" | "highest-ping";
  offset: number;
  limit?: number;
  downAvg: number | null;
  pingAvg: number | null;
  now?: Date;
};

export type SpeedTestPage = {
  rows: SpeedTestRow[];
  total: number;
};

function pageWhere(query: SpeedTestPageQuery, now: Date): {
  sql: string;
  params: unknown[];
} {
  const clauses: string[] = [];
  const params: unknown[] = [];
  const since = rangeSince(query.range, now);
  if (since) {
    clauses.push("tested_at >= ?");
    params.push(since);
  }
  if (query.status === "ok") clauses.push("error IS NULL");
  if (query.status === "failed") clauses.push("error IS NOT NULL");
  if (query.slow && query.downAvg !== null) {
    clauses.push(
      "error IS NULL AND download_mbps IS NOT NULL AND download_mbps < ?",
    );
    params.push(query.downAvg);
  }
  if (query.ping && query.pingAvg !== null) {
    clauses.push("error IS NULL AND ping_ms IS NOT NULL AND ping_ms > ?");
    params.push(query.pingAvg);
  }
  return {
    sql: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

function pageOrder(sort: SpeedTestPageQuery["sort"]): string {
  if (sort === "oldest") return "tested_at ASC, id ASC";
  if (sort === "slowest-down") {
    return "download_mbps IS NULL, download_mbps ASC, tested_at DESC, id DESC";
  }
  if (sort === "highest-ping") {
    return "ping_ms IS NULL, ping_ms DESC, tested_at DESC, id DESC";
  }
  return "tested_at DESC, id DESC";
}

export function listSpeedTestsPage(
  db: Database.Database,
  query: SpeedTestPageQuery,
): SpeedTestPage {
  const now = query.now ?? new Date();
  const { sql, params } = pageWhere(query, now);
  const limit = query.limit ?? ARCHIVE_PAGE_SIZE;
  const total = Number(
    (
      db.prepare(`SELECT COUNT(*) as count FROM speed_tests ${sql}`).get(
        ...params,
      ) as { count: number }
    ).count,
  );
  const rows = db
    .prepare(
      `SELECT * FROM speed_tests ${sql}
       ORDER BY ${pageOrder(query.sort)}
       LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, query.offset) as DbRow[];
  return { rows: rows.map(mapRow), total };
}

export type MetricStats = {
  min: number | null;
  avg: number | null;
  max: number | null;
};

export type Summary = {
  count: number;
  download: MetricStats;
  upload: MetricStats;
  ping: MetricStats;
};

function metric(values: number[]): MetricStats {
  if (values.length === 0) {
    return { min: null, avg: null, max: null };
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  return { min, avg, max };
}

export function summarize(rows: SpeedTestRow[]): Summary {
  const ok = rows.filter(
    (row) => row.error === null && row.downloadMbps !== null,
  );
  return {
    count: ok.length,
    download: metric(ok.map((row) => row.downloadMbps as number)),
    upload: metric(
      ok
        .map((row) => row.uploadMbps)
        .filter((value): value is number => value !== null),
    ),
    ping: metric(
      ok
        .map((row) => row.pingMs)
        .filter((value): value is number => value !== null),
    ),
  };
}

type SummaryRow = {
  count: number;
  down_min: number | null;
  down_avg: number | null;
  down_max: number | null;
  up_min: number | null;
  up_avg: number | null;
  up_max: number | null;
  ping_min: number | null;
  ping_avg: number | null;
  ping_max: number | null;
};

export function summarizeRange(
  db: Database.Database,
  range: Range,
  now = new Date(),
): Summary {
  const since = rangeSince(range, now);
  const where = since
    ? `WHERE error IS NULL AND download_mbps IS NOT NULL AND tested_at >= ?`
    : `WHERE error IS NULL AND download_mbps IS NOT NULL`;
  const row = (
    since
      ? db
          .prepare(
            `SELECT
              COUNT(*) as count,
              MIN(download_mbps) as down_min,
              AVG(download_mbps) as down_avg,
              MAX(download_mbps) as down_max,
              MIN(upload_mbps) as up_min,
              AVG(upload_mbps) as up_avg,
              MAX(upload_mbps) as up_max,
              MIN(ping_ms) as ping_min,
              AVG(ping_ms) as ping_avg,
              MAX(ping_ms) as ping_max
             FROM speed_tests ${where}`,
          )
          .get(since)
      : db
          .prepare(
            `SELECT
              COUNT(*) as count,
              MIN(download_mbps) as down_min,
              AVG(download_mbps) as down_avg,
              MAX(download_mbps) as down_max,
              MIN(upload_mbps) as up_min,
              AVG(upload_mbps) as up_avg,
              MAX(upload_mbps) as up_max,
              MIN(ping_ms) as ping_min,
              AVG(ping_ms) as ping_avg,
              MAX(ping_ms) as ping_max
             FROM speed_tests ${where}`,
          )
          .get()
  ) as SummaryRow;

  return {
    count: Number(row.count),
    download: {
      min: row.down_min,
      avg: row.down_avg,
      max: row.down_max,
    },
    upload: {
      min: row.up_min,
      avg: row.up_avg,
      max: row.up_max,
    },
    ping: {
      min: row.ping_min,
      avg: row.ping_avg,
      max: row.ping_max,
    },
  };
}

export function withDatabase<T>(fn: (db: Database.Database) => T): T {
  const db = openDatabase(prepareDatabasePath());
  try {
    return fn(db);
  } finally {
    db.close();
  }
}
