import type { Summary } from "@/lib/db";
import { parseRange } from "@/lib/range";
import type { Range, SpeedTestRow } from "@/lib/types";

export type RunStatus = "all" | "ok" | "failed";
export type RunSort = "newest" | "oldest" | "slowest-down" | "highest-ping";

export type ArchiveQuery = {
  status: RunStatus;
  slow: boolean;
  ping: boolean;
  sort: RunSort;
};

export type RunQuery = ArchiveQuery & {
  range: Range;
  page: number;
};

export type RunFilters = {
  status: RunStatus;
  slow: boolean;
  ping: boolean;
};

export const PAGE_SIZE = 24;

export type RunSearchParams = {
  range?: string;
  status?: string;
  slow?: string;
  ping?: string;
  sort?: string;
  page?: string;
};

function parseStatus(value: string | undefined): RunStatus {
  return value === "ok" || value === "failed" ? value : "all";
}

function parseSort(value: string | undefined): RunSort {
  return value === "oldest" ||
    value === "slowest-down" ||
    value === "highest-ping"
    ? value
    : "newest";
}

export function parseRunQuery(params: RunSearchParams): RunQuery {
  const pageNum = Number.parseInt(params.page ?? "", 10);
  return {
    range: parseRange(params.range),
    status: parseStatus(params.status),
    slow: params.slow === "1",
    ping: params.ping === "1",
    sort: parseSort(params.sort),
    page: Number.isInteger(pageNum) && pageNum >= 1 ? pageNum : 1,
  };
}

export function parseArchiveQuery(params: RunSearchParams): ArchiveQuery {
  return {
    status: parseStatus(params.status),
    slow: params.slow === "1",
    ping: params.ping === "1",
    sort: parseSort(params.sort),
  };
}

export function runCardId(id: number): string {
  return `run-${id}`;
}

export function formatRunId(id: number): string {
  return `#${id}`;
}

export function patchRunQuery(
  query: RunQuery,
  patch: Partial<RunQuery>,
): RunQuery {
  const next: RunQuery = { ...query, ...patch };
  const filterChanged =
    (patch.status !== undefined && patch.status !== query.status) ||
    (patch.slow !== undefined && patch.slow !== query.slow) ||
    (patch.ping !== undefined && patch.ping !== query.ping) ||
    (patch.sort !== undefined && patch.sort !== query.sort) ||
    (patch.range !== undefined && patch.range !== query.range);
  if (filterChanged && patch.page === undefined) {
    next.page = 1;
  }
  return next;
}

export function runHref(query: RunQuery): string {
  const params = new URLSearchParams();
  params.set("range", query.range);
  if (query.status !== "all") params.set("status", query.status);
  if (query.slow) params.set("slow", "1");
  if (query.ping) params.set("ping", "1");
  if (query.sort !== "newest") params.set("sort", query.sort);
  if (query.page > 1) params.set("page", String(query.page));
  return `/app?${params.toString()}`;
}

export function homeHref(range: Range): string {
  return range === "24h" ? "/app" : `/app?range=${range}`;
}

export function archiveHref(query: ArchiveQuery): string {
  const params = new URLSearchParams();
  if (query.status !== "all") params.set("status", query.status);
  if (query.slow) params.set("slow", "1");
  if (query.ping) params.set("ping", "1");
  if (query.sort !== "newest") params.set("sort", query.sort);
  const qs = params.toString();
  return qs ? `/app/runs?${qs}` : "/app/runs";
}

export function runDetailHref(id: number): string {
  return `/app/runs/${id}`;
}

export function parseRunId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;
  return Number.parseInt(value, 10);
}

export function filterRuns(
  tests: SpeedTestRow[],
  summary: Summary,
  filters: RunFilters,
): SpeedTestRow[] {
  const slowActive = filters.slow && summary.download.avg !== null;
  const pingActive = filters.ping && summary.ping.avg !== null;
  const downAvg = summary.download.avg;
  const pingAvg = summary.ping.avg;

  return tests.filter((item) => {
    if (filters.status === "ok" && item.error !== null) return false;
    if (filters.status === "failed" && item.error === null) return false;
    if (slowActive) {
      if (item.error !== null || item.downloadMbps === null || downAvg === null) {
        return false;
      }
      if (!(item.downloadMbps < downAvg)) return false;
    }
    if (pingActive) {
      if (item.error !== null || item.pingMs === null || pingAvg === null) {
        return false;
      }
      if (!(item.pingMs > pingAvg)) return false;
    }
    return true;
  });
}

function timeKey(item: SpeedTestRow): number {
  return new Date(item.testedAt).getTime();
}

export function sortRuns(tests: SpeedTestRow[], sort: RunSort): SpeedTestRow[] {
  const copy = [...tests];
  copy.sort((left, right) => {
    if (sort === "newest") {
      return timeKey(right) - timeKey(left) || right.id - left.id;
    }
    if (sort === "oldest") {
      return timeKey(left) - timeKey(right) || left.id - right.id;
    }
    if (sort === "slowest-down") {
      const leftMissing = left.downloadMbps === null;
      const rightMissing = right.downloadMbps === null;
      if (leftMissing !== rightMissing) return leftMissing ? 1 : -1;
      if (
        !leftMissing &&
        !rightMissing &&
        left.downloadMbps !== right.downloadMbps
      ) {
        return (left.downloadMbps as number) - (right.downloadMbps as number);
      }
      return timeKey(right) - timeKey(left) || right.id - left.id;
    }
    const leftMissing = left.pingMs === null;
    const rightMissing = right.pingMs === null;
    if (leftMissing !== rightMissing) return leftMissing ? 1 : -1;
    if (!leftMissing && !rightMissing && left.pingMs !== right.pingMs) {
      return (right.pingMs as number) - (left.pingMs as number);
    }
    return timeKey(right) - timeKey(left) || right.id - left.id;
  });
  return copy;
}

export type RunPage = {
  rows: SpeedTestRow[];
  total: number;
  page: number;
  pageCount: number;
  from: number;
  to: number;
};

export function pageRuns(
  rows: SpeedTestRow[],
  page: number,
  pageSize = PAGE_SIZE,
): RunPage {
  const total = rows.length;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const clamped = total === 0 ? 1 : Math.min(Math.max(page, 1), lastPage);
  const start = (clamped - 1) * pageSize;
  const slice = rows.slice(start, start + pageSize);
  return {
    rows: slice,
    total,
    page: clamped,
    pageCount: lastPage,
    from: total === 0 ? 0 : start + 1,
    to: start + slice.length,
  };
}
