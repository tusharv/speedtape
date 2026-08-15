import Link from "next/link";
import { ghostBtn, panel, sectionTitle } from "@/app/components/chrome";
import { RunCard } from "@/app/components/run-card";
import { archiveHref, runDetailHref } from "@/lib/runs";
import type { SpeedTestRow } from "@/lib/types";

export function HistoryRuns({ tests }: { tests: SpeedTestRow[] }) {
  return (
    <section className={`flex flex-col gap-5 ${panel}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h2 className={sectionTitle}>Runs</h2>
          <p className="mt-2 text-xs leading-5 text-muted">
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
          className={ghostBtn}
        >
          All runs
        </Link>
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
