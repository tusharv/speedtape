import type { ReactNode } from "react";
import Link from "next/link";
import {
  GaugeIcon,
  GearSixIcon,
  StackIcon,
} from "@phosphor-icons/react/ssr";
import { BrandLockup } from "@/app/components/brand-lockup";
import { archiveHref, configHref, homeHref } from "@/lib/runs";

const icon = { size: 14, weight: "regular" as const, "aria-hidden": true };

const tab =
  "inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] sm:px-3 sm:tracking-[0.16em]";

const headerBar =
  "flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-hairline py-4";

export type SiteNavCurrent = "home" | "runs" | "config";

function tabClass(active: boolean) {
  return `${tab} ${
    active
      ? "border-copper bg-copper text-white"
      : "border-hairline text-muted hover:border-copper hover:text-paper"
  }`;
}

export function SiteNav({ current }: { current: SiteNavCurrent }) {
  return (
    <nav aria-label="Site" className="flex flex-wrap items-center gap-1">
      <Link
        href={homeHref("24h")}
        aria-current={current === "home" ? "page" : undefined}
        className={tabClass(current === "home")}
      >
        <GaugeIcon {...icon} />
        Dashboard
      </Link>
      <Link
        href={archiveHref({
          status: "all",
          slow: false,
          ping: false,
          sort: "newest",
        })}
        aria-current={current === "runs" ? "page" : undefined}
        className={tabClass(current === "runs")}
      >
        <StackIcon {...icon} />
        Runs
      </Link>
      <Link
        href={configHref()}
        aria-current={current === "config" ? "page" : undefined}
        className={tabClass(current === "config")}
      >
        <GearSixIcon {...icon} />
        Config
      </Link>
    </nav>
  );
}

export function SiteHeader({
  current,
  nav,
}: {
  current?: SiteNavCurrent;
  nav?: ReactNode;
}) {
  return (
    <header className={headerBar}>
      <BrandLockup />
      {nav ?? (current ? <SiteNav current={current} /> : null)}
    </header>
  );
}

export function PageIntro({
  title,
  children,
  extra,
}: {
  title: string;
  children: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] text-paper sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted">{children}</p>
      </div>
      {extra}
    </div>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-1 flex-col gap-8 px-4 pb-10 sm:px-8">
      {children}
    </div>
  );
}
