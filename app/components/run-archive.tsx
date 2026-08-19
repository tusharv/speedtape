"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileCsvIcon } from "@phosphor-icons/react/ssr";
import { ghostBtn, panel, sectionTitle } from "@/app/components/chrome";
import { loadMoreRuns } from "@/app/actions";
import { RunRow } from "@/app/components/run-row";
import { RunToolbar } from "@/app/components/run-toolbar";
import { RangeTabs, Triple } from "@/app/components/stats";
import { TermTip } from "@/app/components/term-tip";
import type { Summary } from "@/lib/db";
import {
  DEFAULT_ARCHIVE_QUERY,
  archiveHref,
  exportHref,
  type ArchiveQuery,
} from "@/lib/runs";
import type { SpeedTestRow } from "@/lib/types";

export function RunArchive({
  query,
  summary,
  providers,
  initialRows,
  total,
}: {
  query: ArchiveQuery;
  summary: Summary;
  providers: string[];
  initialRows: SpeedTestRow[];
  total: number;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [loadedTotal, setLoadedTotal] = useState(total);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const slowEnabled = summary.download.avg !== null;
  const pingEnabled = summary.ping.avg !== null;
  const hasMore = rows.length < loadedTotal;
  const filtersOn =
    query.range !== "all" ||
    query.from !== null ||
    query.to !== null ||
    query.status !== "all" ||
    query.slow ||
    query.ping ||
    query.isp !== null;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);
        void loadMoreRuns({
          offset: rows.length,
          ...query,
        }).then((next) => {
          setRows((current) => {
            if (next.rows.length === 0) {
              setLoadedTotal(current.length);
              return current;
            }
            const seen = new Set(current.map((row) => row.id));
            return [
              ...current,
              ...next.rows.filter((row) => !seen.has(row.id)),
            ];
          });
          if (next.rows.length > 0) setLoadedTotal(next.total);
          loadingRef.current = false;
          setLoading(false);
        });
      },
      { rootMargin: "240px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, query, rows.length]);

  return (
    <section className={`flex flex-col gap-5 ${panel}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h2 className={sectionTitle}>Archive</h2>
          <p className="mt-2 text-xs leading-5 text-muted">
            Samples in this window. Pick start and end days, or use 24h / 7d /
            30d. Slow down and high ping use this range average. Save CSV to
            share those days with your ISP.
          </p>
        </div>
        <a href={exportHref(query)} className={ghostBtn}>
          <FileCsvIcon size={14} weight="regular" aria-hidden />
          Save CSV
        </a>
      </div>
      <RangeTabs
        range={query.from || query.to ? null : query.range}
        label="Archive range"
        hrefFor={(range) =>
          archiveHref({ ...query, range, from: null, to: null })
        }
      />
      <RunToolbar
        query={query}
        providers={providers}
        slowEnabled={slowEnabled}
        pingEnabled={pingEnabled}
        onUpdate={(patch) =>
          router.replace(archiveHref({ ...query, ...patch }))
        }
      />

      {query.isp ? (
        <div className="grid gap-4 rounded-lg border border-hairline bg-panel px-5 py-5 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <p className="text-xs leading-5 text-muted">
              <TermTip term="minAvgMax">Min / avg / max</TermTip> for{" "}
              <TermTip term="isp">{query.isp}</TermTip>
            </p>
          </div>
          <Triple
            label="Down"
            stats={summary.download}
            unit="Mbps"
            term="download"
            unitTerm="mbps"
          />
          <Triple
            label="Up"
            stats={summary.upload}
            unit="Mbps"
            term="upload"
            unitTerm="mbps"
          />
          <Triple
            label="Ping"
            stats={summary.ping}
            unit="ms"
            term="ping"
            unitTerm="ms"
          />
        </div>
      ) : null}

      {loadedTotal === 0 ? (
        <div className="flex flex-col gap-3 rounded-lg border border-dashed border-hairline bg-panel px-5 py-6">
          <p className="text-sm leading-6 text-muted">
            {filtersOn
              ? "No runs match these filters."
              : "No readings yet."}
          </p>
          {filtersOn ? (
            <button
              type="button"
              onClick={() =>
                router.replace(
                  archiveHref({
                    ...DEFAULT_ARCHIVE_QUERY,
                    sort: query.sort,
                  }),
                )
              }
              className={ghostBtn}
            >
              Clear filters
            </button>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((test) => (
            <RunRow key={test.id} test={test} />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-hairline pt-5">
        <p className="text-xs text-muted">
          {loadedTotal === 0
            ? "0 of 0"
            : `${rows.length} of ${loadedTotal}`}
        </p>
        <div ref={sentinelRef} className="h-4" />
        {loading ? (
          <p className="text-xs text-muted" role="status">
            Loading more runs
          </p>
        ) : null}
      </div>
    </section>
  );
}
