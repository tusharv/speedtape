import type { ReactNode } from "react";
import Link from "next/link";
import {
  GaugeIcon,
  GearSixIcon,
  StackIcon,
} from "@phosphor-icons/react/ssr";
import { BrandLockup } from "@/app/components/brand-lockup";
import { chipClass } from "@/app/components/chrome";
import { archiveHref, configHref, homeHref } from "@/lib/runs";

const icon = { size: 14, weight: "regular" as const, "aria-hidden": true };

const headerBar =
  "flex min-h-16 flex-wrap items-center justify-between gap-4 border-b border-hairline py-4";

export type SiteNavCurrent = "home" | "runs" | "config";

export function SiteNav({ current }: { current: SiteNavCurrent }) {
  return (
    <nav aria-label="Site" className="flex flex-wrap items-center gap-2">
      <Link
        href={homeHref("24h")}
        aria-current={current === "home" ? "page" : undefined}
        className={chipClass(current === "home")}
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
        className={chipClass(current === "runs")}
      >
        <StackIcon {...icon} />
        Runs
      </Link>
      <Link
        href={configHref()}
        aria-current={current === "config" ? "page" : undefined}
        className={chipClass(current === "config")}
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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] text-paper sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted">{children}</p>
      </div>
      {extra ? <div className="shrink-0">{extra}</div> : null}
    </div>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-1 flex-col gap-10 px-5 pb-12 sm:px-8">
      {children}
    </div>
  );
}
