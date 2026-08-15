import Link from "next/link";
import { GaugeIcon, StackIcon } from "@phosphor-icons/react/ssr";
import { chipClass } from "@/app/components/chrome";
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
          className={chipClass(true)}
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
          className={chipClass(false)}
        >
          <StackIcon {...icon} />
          All runs
        </Link>
      </div>
    </PageShell>
  );
}
