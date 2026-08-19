import { orderedDays, parseDay } from "@/lib/days";
import { parseRange } from "@/lib/range";
import type { Range } from "@/lib/types";

export type RunStatus = "all" | "ok" | "failed";
export type RunSort = "newest" | "oldest" | "slowest-down" | "highest-ping";

export type ArchiveQuery = {
  range: Range;
  from: string | null;
  to: string | null;
  status: RunStatus;
  slow: boolean;
  ping: boolean;
  sort: RunSort;
  isp: string | null;
};

export const DEFAULT_ARCHIVE_QUERY: ArchiveQuery = {
  range: "all",
  from: null,
  to: null,
  status: "all",
  slow: false,
  ping: false,
  sort: "newest",
  isp: null,
};

export type RunSearchParams = {
  range?: string;
  from?: string;
  to?: string;
  status?: string;
  slow?: string;
  ping?: string;
  sort?: string;
  isp?: string;
  page?: string;
};

export function firstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseIsp(value: string | undefined): string | null {
  const name = value?.trim();
  return name ? name : null;
}

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

export function parseArchiveQuery(params: RunSearchParams): ArchiveQuery {
  const days = orderedDays(parseDay(params.from), parseDay(params.to));
  const customDays = days.from !== null || days.to !== null;
  return {
    range: customDays ? "all" : parseRange(params.range, "all"),
    from: days.from,
    to: days.to,
    status: parseStatus(params.status),
    slow: params.slow === "1",
    ping: params.ping === "1",
    sort: parseSort(params.sort),
    isp: parseIsp(params.isp),
  };
}

export function runCardId(id: number): string {
  return `run-${id}`;
}

export function formatRunId(id: number): string {
  return `#${id}`;
}

export function homeHref(range: Range): string {
  return range === "24h" ? "/app" : `/app?range=${range}`;
}

export function configHref(): string {
  return "/app/config";
}

function archiveSearch(query: ArchiveQuery): string {
  const params = new URLSearchParams();
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (!query.from && !query.to && query.range !== "all") {
    params.set("range", query.range);
  }
  if (query.status !== "all") params.set("status", query.status);
  if (query.slow) params.set("slow", "1");
  if (query.ping) params.set("ping", "1");
  if (query.sort !== "newest") params.set("sort", query.sort);
  if (query.isp) params.set("isp", query.isp);
  return params.toString();
}

export function archiveHref(query: ArchiveQuery): string {
  const qs = archiveSearch(query);
  return qs ? `/app/runs?${qs}` : "/app/runs";
}

export function exportHref(query: ArchiveQuery): string {
  const qs = archiveSearch(query);
  return qs ? `/app/runs/export?${qs}` : "/app/runs/export";
}

export function runDetailHref(id: number): string {
  return `/app/runs/${id}`;
}

export function parseRunId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;
  return Number.parseInt(value, 10);
}
