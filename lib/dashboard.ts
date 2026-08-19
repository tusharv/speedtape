import type Database from "better-sqlite3";
import { downsampleChart, neighborRuns, type ChartPoint } from "@/lib/chart";
import { houseCollectorRuntime } from "@/lib/agent-sync";
import {
  getLatest,
  getSpeedTest,
  listChartPoints,
  listIsps,
  listOutageContext,
  listPreviousSpeedTests,
  listNextSpeedTests,
  listRecentSpeedTests,
  listSpeedTests,
  listSpeedTestsPage,
  summarizeRange,
  summarizeWindow,
  timeBounds,
  withDatabase,
  type Range,
  type SpeedTestPageQuery,
  type Summary,
} from "@/lib/db";
import { outageWindow, type OutageWindow } from "@/lib/outage";
import type { ArchiveQuery } from "@/lib/runs";
import { listSchedules } from "@/lib/schedules";
import { buildSpeedTape, type TapeCell } from "@/lib/tape";
import type { SpeedTestRow } from "@/lib/types";

export type DashboardData = {
  range: Range;
  latest: SpeedTestRow | null;
  summary: Summary;
  tape: TapeCell[];
  chart: ChartPoint[];
  preview: SpeedTestRow[];
  agentsLoaded: number;
};

export function loadDashboard(range: Range, now = new Date()): DashboardData {
  return withDatabase((db) => {
    const runtime = houseCollectorRuntime();
    const tapeSource = listSpeedTests(db, "24h", now);
    return {
      range,
      latest: getLatest(db),
      summary: summarizeRange(db, range, now),
      tape: buildSpeedTape(tapeSource, now),
      chart: downsampleChart(listChartPoints(db, range, now)),
      preview: listRecentSpeedTests(db, range, now),
      agentsLoaded: listSchedules(db).filter((row) => runtime.isLoaded(row.id))
        .length,
    };
  });
}

export type ArchiveData = {
  summary: Summary;
  rows: SpeedTestRow[];
  total: number;
  providers: string[];
};

function archivePageQuery(
  query: ArchiveQuery,
  summary: Summary,
  now: Date,
  offset: number,
  limit?: number,
): SpeedTestPageQuery {
  return {
    range: query.range,
    from: query.from,
    to: query.to,
    status: query.status,
    slow: query.slow,
    ping: query.ping,
    sort: query.sort,
    isp: query.isp,
    offset,
    limit,
    downAvg: summary.download.avg,
    pingAvg: summary.ping.avg,
    now,
  };
}

function loadArchivePage(
  db: Database.Database,
  query: ArchiveQuery,
  now: Date,
  offset: number,
  limit?: number,
) {
  const bounds = timeBounds({ ...query, now });
  const summary = summarizeWindow(db, { ...bounds, isp: query.isp });
  const page = listSpeedTestsPage(
    db,
    archivePageQuery(query, summary, now, offset, limit),
  );
  return { bounds, summary, page };
}

export function loadArchive(
  query: ArchiveQuery,
  offset = 0,
  now = new Date(),
): ArchiveData {
  return withDatabase((db) => {
    const { bounds, summary, page } = loadArchivePage(db, query, now, offset);
    return {
      summary,
      rows: page.rows,
      total: page.total,
      providers: listIsps(db, bounds),
    };
  });
}

export function loadRun(id: number): SpeedTestRow | null {
  return withDatabase((db) => getSpeedTest(db, id));
}

export type RunDetail = {
  test: SpeedTestRow;
  previous: SpeedTestRow[];
  neighbors: SpeedTestRow[];
  outage: OutageWindow | null;
};

export function loadRunDetail(id: number): RunDetail | null {
  return withDatabase((db) => {
    const test = getSpeedTest(db, id);
    if (!test) return null;
    const previous = listPreviousSpeedTests(db, test);
    const next = listNextSpeedTests(db, test);
    return {
      test,
      previous,
      neighbors: neighborRuns(previous, test, next),
      outage: outageWindow(test, listOutageContext(db, test)),
    };
  });
}

export const EXPORT_LIMIT = 100_000;

export function loadArchiveExport(
  query: ArchiveQuery,
  now = new Date(),
): SpeedTestRow[] {
  return withDatabase((db) => {
    return loadArchivePage(db, query, now, 0, EXPORT_LIMIT).page.rows;
  });
}
