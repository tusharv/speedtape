import type { Summary } from "@/lib/db";
import { parseRange } from "@/lib/range";
import type { Range, SpeedTestRow } from "@/lib/types";

export type RunStatus = "all" | "ok" | "failed";
export type RunSort = "newest" | "oldest" | "slowest-down" | "highest-ping";

export type RunQuery = {
  range: Range;
  status: RunStatus;
  slow: boolean;
  ping: boolean;
  sort: RunSort;
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

export function parseRunQuery(params: RunSearchParams): RunQuery {
  const pageNum = Number.parseInt(params.page ?? "", 10);
  const status = params.status;
  const sort = params.sort;
  return {
    range: parseRange(params.range),
    status: status === "ok" || status === "failed" ? status : "all",
    slow: params.slow === "1",
    ping: params.ping === "1",
    sort:
      sort === "oldest" ||
      sort === "slowest-down" ||
      sort === "highest-ping"
        ? sort
        : "newest",
    page: Number.isInteger(pageNum) && pageNum >= 1 ? pageNum : 1,
  };
}

export function runHref(query: RunQuery): string {
  const params = new URLSearchParams();
  params.set("range", query.range);
  if (query.status !== "all") params.set("status", query.status);
  if (query.slow) params.set("slow", "1");
  if (query.ping) params.set("ping", "1");
  if (query.sort !== "newest") params.set("sort", query.sort);
  if (query.page > 1) params.set("page", String(query.page));
  return `/?${params.toString()}`;
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
