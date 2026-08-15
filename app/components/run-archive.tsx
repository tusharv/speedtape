"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ghostBtn, panel, sectionTitle } from "@/app/components/chrome";
import { loadMoreRuns } from "@/app/actions";
import { RunRow } from "@/app/components/run-row";
import { RunToolbar } from "@/app/components/run-toolbar";
import type { Summary } from "@/lib/db";
import {
  archiveHref,
  type ArchiveQuery,
} from "@/lib/runs";
import type { SpeedTestRow } from "@/lib/types";

export function RunArchive({
  query,
  summary,
  initialRows,
  total,
}: {
  query: ArchiveQuery;
  summary: Summary;
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
    query.status !== "all" || query.slow || query.ping;

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
          status: query.status,
          slow: query.slow,
          ping: query.ping,
          sort: query.sort,
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
      <div>
        <h2 className={sectionTitle}>Archive</h2>
        <p className="mt-2 text-xs leading-5 text-muted">
          Every sample on this computer. Slow down and high ping use the all-time
          average.
        </p>
      </div>
      <RunToolbar
        query={query}
        slowEnabled={slowEnabled}
        pingEnabled={pingEnabled}
        onUpdate={(patch) =>
          router.replace(archiveHref({ ...query, ...patch }))
        }
      />

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
                    status: "all",
                    slow: false,
                    ping: false,
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
