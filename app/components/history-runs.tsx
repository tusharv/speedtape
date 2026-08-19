import Link from "next/link";
import { FileCsvIcon } from "@phosphor-icons/react/ssr";
import { ghostBtn, panel, sectionTitle } from "@/app/components/chrome";
import { RunCard } from "@/app/components/run-card";
import { DEFAULT_ARCHIVE_QUERY, archiveHref, exportHref, runDetailHref } from "@/lib/runs";
import type { Range, SpeedTestRow } from "@/lib/types";

export function HistoryRuns({
  tests,
  range,
}: {
  tests: SpeedTestRow[];
  range: Range;
}) {
  return (
    <section className={`flex flex-col gap-5 ${panel}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h2 className={sectionTitle}>Runs</h2>
          <p className="mt-2 text-xs leading-5 text-muted">
            Latest samples in this range. Open a card for the full reading.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={exportHref({
              range,
              from: null,
              to: null,
              status: "all",
              slow: false,
              ping: false,
              sort: "newest",
              isp: null,
            })}
            className={ghostBtn}
          >
            <FileCsvIcon size={14} weight="regular" aria-hidden />
            Save CSV
          </a>
          <Link
            href={archiveHref(DEFAULT_ARCHIVE_QUERY)}
            className={ghostBtn}
          >
            All runs
          </Link>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {tests.map((test) => (
          <Link
            key={test.id}
            href={runDetailHref(test.id)}
            className="block h-full"
          >
            <RunCard test={test} />
          </Link>
        ))}
      </div>
    </section>
  );
}
