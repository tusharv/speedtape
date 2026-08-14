import type { ReactNode } from "react";
import Link from "next/link";
import { archiveHref, configHref, homeHref } from "@/lib/runs";

const tab =
  "border px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] sm:px-3 sm:tracking-[0.16em]";

export function SiteNav({ current }: { current: "home" | "runs" | "config" }) {
  return (
    <nav aria-label="Site" className="flex flex-wrap items-center gap-1">
      <Link
        href="/"
        className={`${tab} border-hairline text-muted hover:border-copper hover:text-paper`}
      >
        Speedtape
      </Link>
      <Link
        href={homeHref("24h")}
        className={`${tab} ${
          current === "home"
            ? "border-copper bg-copper text-white"
            : "border-hairline text-muted hover:border-copper hover:text-paper"
        }`}
      >
        Dashboard
      </Link>
      <Link
        href={archiveHref({
          status: "all",
          slow: false,
          ping: false,
          sort: "newest",
        })}
        className={`${tab} ${
          current === "runs"
            ? "border-copper bg-copper text-white"
            : "border-hairline text-muted hover:border-copper hover:text-paper"
        }`}
      >
        Runs
      </Link>
      <Link
        href={configHref()}
        className={`${tab} ${
          current === "config"
            ? "border-copper bg-copper text-white"
            : "border-hairline text-muted hover:border-copper hover:text-paper"
        }`}
      >
        Config
      </Link>
    </nav>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-1 flex-col gap-8 overflow-x-clip px-4 py-10 sm:px-8">
      {children}
    </div>
  );
}
