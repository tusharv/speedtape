import Link from "next/link";
import { RunCard } from "@/app/components/run-card";
import { archiveHref, runDetailHref } from "@/lib/runs";
import type { SpeedTestRow } from "@/lib/types";

export function HistoryRuns({ tests }: { tests: SpeedTestRow[] }) {
  return (
    <section className="flex flex-col gap-4 border border-hairline bg-raised px-4 py-5 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-paper">Runs</h2>
          <p className="mt-1 text-xs text-muted">
            Latest samples in this range. Open a card for the full reading.
          </p>
        </div>
        <Link
          href={archiveHref({
            status: "all",
            slow: false,
            ping: false,
            sort: "newest",
          })}
          className="inline-flex w-fit items-center border border-hairline px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted hover:border-copper hover:text-paper"
        >
          All runs
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
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
