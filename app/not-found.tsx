import Link from "next/link";
import { GaugeIcon, StackIcon } from "@phosphor-icons/react/ssr";
import { PageIntro, PageShell, SiteHeader } from "@/app/components/site-nav";
import { archiveHref, homeHref } from "@/lib/runs";

const icon = { size: 14, weight: "regular" as const, "aria-hidden": true };

export default function NotFound() {
  return (
    <PageShell>
      <SiteHeader current="home" />
      <PageIntro title="Not found">
        That page or run is not on this computer.
      </PageIntro>
      <div className="flex flex-wrap gap-2">
        <Link
          href={homeHref("24h")}
          className="inline-flex items-center gap-1.5 border border-copper bg-copper px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white"
        >
          <GaugeIcon {...icon} />
          Home
        </Link>
        <Link
          href={archiveHref({
            status: "all",
            slow: false,
            ping: false,
            sort: "newest",
          })}
          className="inline-flex items-center gap-1.5 border border-hairline px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted hover:border-copper hover:text-paper"
        >
          <StackIcon {...icon} />
          All runs
        </Link>
      </div>
    </PageShell>
  );
}
