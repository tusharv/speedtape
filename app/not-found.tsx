import Link from "next/link";
import { PageShell, SiteNav } from "@/app/components/site-nav";
import { archiveHref, homeHref } from "@/lib/runs";

export default function NotFound() {
  return (
    <PageShell>
      <header className="flex flex-col gap-4 border-b border-hairline pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold text-paper sm:text-6xl">
            Not found
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted">
            That page or run is not on this Mac.
          </p>
        </div>
        <SiteNav current="home" />
      </header>
      <div className="flex flex-wrap gap-2">
        <Link
          href={homeHref("24h")}
          className="border border-copper bg-copper px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white"
        >
          Home
        </Link>
        <Link
          href={archiveHref({
            status: "all",
            slow: false,
            ping: false,
            sort: "newest",
          })}
          className="border border-hairline px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted hover:border-copper hover:text-paper"
        >
          All runs
        </Link>
      </div>
    </PageShell>
  );
}
