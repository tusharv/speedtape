import os from "node:os";
import { downsampleChart, type ChartPoint } from "@/lib/chart";
import { agentRuntimePaths } from "@/lib/agent-sync";
import { defaultCollectorRuntime } from "@/lib/collector-runtime";
import {
  getLatest,
  getSpeedTest,
  listChartPoints,
  listRecentSpeedTests,
  listSpeedTests,
  listSpeedTestsPage,
  summarizeRange,
  withDatabase,
  type Range,
  type Summary,
} from "@/lib/db";
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
    const runtime = defaultCollectorRuntime({
      homeDir: os.homedir(),
      ...agentRuntimePaths(),
    });
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
};

export function loadArchive(
  query: ArchiveQuery,
  offset = 0,
  now = new Date(),
): ArchiveData {
  return withDatabase((db) => {
    const summary = summarizeRange(db, "all", now);
    const page = listSpeedTestsPage(db, {
      range: "all",
      status: query.status,
      slow: query.slow,
      ping: query.ping,
      sort: query.sort,
      offset,
      downAvg: summary.download.avg,
      pingAvg: summary.ping.avg,
      now,
    });
    return { summary, rows: page.rows, total: page.total };
  });
}

export function loadRun(id: number): SpeedTestRow | null {
  return withDatabase((db) => getSpeedTest(db, id));
}
