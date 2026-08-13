"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RunCard } from "@/app/components/run-card";
import type { Summary } from "@/lib/db";
import {
  filterRuns,
  pageRuns,
  parseRunQuery,
  runHref,
  sortRuns,
  type RunQuery,
  type RunSort,
  type RunStatus,
} from "@/lib/runs";
import type { SpeedTestRow } from "@/lib/types";

const chip = "border px-3 py-1 text-[11px] uppercase tracking-[0.16em]";
const chipOn = `${chip} border-copper bg-copper text-ink`;
const chipOff = `${chip} border-hairline text-muted hover:border-copper hover:text-paper`;
const chipDisabled = `${chip} cursor-not-allowed border-hairline text-muted opacity-40`;

const SORTS: { value: RunSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "slowest-down", label: "Slowest down" },
  { value: "highest-ping", label: "Highest ping" },
];

function hrefWith(query: RunQuery, patch: Partial<RunQuery>): string {
  const next: RunQuery = { ...query, ...patch };
  return runHref(next);
}

export function HistoryRuns({
  tests,
  summary,
}: {
  tests: SpeedTestRow[];
  summary: Summary;
}) {
  const params = useSearchParams();
  const query = parseRunQuery({
    range: params.get("range") ?? undefined,
    status: params.get("status") ?? undefined,
    slow: params.get("slow") ?? undefined,
    ping: params.get("ping") ?? undefined,
    sort: params.get("sort") ?? undefined,
    page: params.get("page") ?? undefined,
  });

  const slowEnabled = summary.download.avg !== null;
  const pingEnabled = summary.ping.avg !== null;
  const filtered = filterRuns(tests, summary, {
    status: query.status,
    slow: query.slow,
    ping: query.ping,
  });
  const sorted = sortRuns(filtered, query.sort);
  const paged = pageRuns(sorted, query.page);

  function statusHref(status: RunStatus): string {
    return hrefWith(query, { status, page: 1 });
  }

  return (
    <section className="flex flex-col gap-4 border border-hairline bg-raised px-4 py-5 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="font-display text-2xl text-paper">Runs</h2>
          <p className="mt-1 text-xs text-muted">
            Each sample in this range. Slow down and high ping use this range
            average.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <nav aria-label="Run status" className="flex flex-wrap gap-1">
            <Link
              href={statusHref("all")}
              className={query.status === "all" ? chipOn : chipOff}
            >
              All
            </Link>
            <Link
              href={statusHref("ok")}
              className={query.status === "ok" ? chipOn : chipOff}
            >
              Ok
            </Link>
            <Link
              href={statusHref("failed")}
              className={query.status === "failed" ? chipOn : chipOff}
            >
              Failed
            </Link>
          </nav>
          <nav aria-label="Run problems" className="flex flex-wrap gap-1">
            {slowEnabled ? (
              <Link
                href={hrefWith(query, { slow: !query.slow, page: 1 })}
                className={query.slow ? chipOn : chipOff}
              >
                Slow down
              </Link>
            ) : (
              <span className={chipDisabled}>Slow down</span>
            )}
            {pingEnabled ? (
              <Link
                href={hrefWith(query, { ping: !query.ping, page: 1 })}
                className={query.ping ? chipOn : chipOff}
              >
                High ping
              </Link>
            ) : (
              <span className={chipDisabled}>High ping</span>
            )}
          </nav>
          <nav aria-label="Run sort" className="flex flex-wrap gap-1">
            {SORTS.map((item) => (
              <Link
                key={item.value}
                href={hrefWith(query, { sort: item.value, page: 1 })}
                className={query.sort === item.value ? chipOn : chipOff}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {paged.total === 0 ? (
        <div className="flex flex-col gap-3 border border-dashed border-hairline bg-panel px-4 py-6">
          <p className="text-sm text-muted">No runs match these filters.</p>
          <Link
            href={hrefWith(query, {
              status: "all",
              slow: false,
              ping: false,
              page: 1,
            })}
            className={chipOff}
          >
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {paged.rows.map((test) => (
            <RunCard key={test.id} test={test} />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-hairline pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          {paged.total === 0
            ? "0 of 0"
            : `${paged.from}-${paged.to} of ${paged.total}`}
        </p>
        <nav aria-label="Run pages" className="flex gap-1">
          {paged.page <= 1 ? (
            <span className={chipDisabled}>Prev</span>
          ) : (
            <Link
              href={hrefWith(query, { page: paged.page - 1 })}
              className={chipOff}
            >
              Prev
            </Link>
          )}
          {paged.page >= paged.pageCount ? (
            <span className={chipDisabled}>Next</span>
          ) : (
            <Link
              href={hrefWith(query, { page: paged.page + 1 })}
              className={chipOff}
            >
              Next
            </Link>
          )}
        </nav>
      </div>
    </section>
  );
}
