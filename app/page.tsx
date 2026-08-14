import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BrandLockup,
  BrandMark,
} from "@/app/components/brand-lockup";
import { LandingCommands } from "@/app/components/landing-commands";
import { LandingTape } from "@/app/components/landing-tape";
import { landingTapeCells } from "@/lib/landing-tape";
import { GITHUB_URL, LICENSE_LABEL } from "@/lib/site";

const dashboardHref = "/app";

const primaryCta =
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-copper bg-copper px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] outline-none transition-[transform,background-color] hover:bg-paper hover:text-ink active:translate-y-px focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-ink";
const secondaryCta =
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-hairline px-3 py-2 text-[11px] font-medium uppercase tracking-[0.1em] text-paper outline-none transition-[transform,border-color,color] hover:border-copper hover:text-copper active:translate-y-px focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:px-4 sm:text-xs";

const systemFacts = [
  {
    title: "This Mac only",
    body: "Collectors are LaunchAgents on one machine, not a site you leave open.",
  },
  {
    title: "Ookla Speedtest CLI",
    body: "The same official CLI you run in Terminal. The browser never runs the test.",
  },
  {
    title: "SQLite on disk",
    body: "Samples never leave this house. Phones on the same Wi-Fi can still watch the tape.",
  },
  {
    title: "Tape, chart, runs",
    body: "A day strip, history, and every test kept, on the schedule you set.",
  },
] as const;

function firstString(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Landing({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  if (typeof params.range === "string") {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      const text = firstString(value);
      if (text !== undefined) qs.set(key, text);
    }
    redirect(`/app?${qs.toString()}`);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full min-w-0 max-w-7xl flex-col overflow-x-clip px-4 sm:px-8 lg:px-10">
      <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-hairline py-4">
        <BrandLockup />
        <nav
          aria-label="Landing"
          className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto"
        >
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className={secondaryCta}
          >
            View on GitHub
          </a>
          <Link href={dashboardHref} className={primaryCta}>
            Open dashboard
          </Link>
        </nav>
      </header>

      <main className="flex min-w-0 flex-1 flex-col">
        <section className="grid min-w-0 gap-10 py-12 md:py-16 lg:grid-cols-[minmax(0,0.76fr)_minmax(0,1.24fr)] lg:items-end lg:gap-16">
          <div className="max-w-lg min-w-0">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-copper">
              Local network monitor
            </p>
            <h1 className="mt-4 max-w-[9ch] font-display text-5xl font-semibold leading-[0.96] tracking-[-0.055em] text-paper sm:text-6xl lg:text-7xl">
              Know your line.
            </h1>
            <p className="mt-5 max-w-[38ch] text-base leading-7 text-muted sm:text-lg">
              A continuous record of download, upload, and ping from the Mac in
              your house.
            </p>
            <div className="mt-7">
              <Link href={dashboardHref} className={primaryCta}>
                Open dashboard
              </Link>
            </div>
          </div>

          <div
            aria-label="24 hour signal"
            role="group"
            className="min-w-0 rounded-lg border border-hairline bg-panel p-4 shadow-[0_28px_80px_-54px_rgba(15,118,110,0.7)] sm:p-6"
          >
            <div className="mb-5 flex items-center justify-between gap-4 border-b border-hairline pb-4 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
              <span>24 hour signal</span>
              <span>Sample data</span>
            </div>
            <LandingTape cells={landingTapeCells()} />
          </div>
        </section>

        <section className="grid gap-10 border-t border-hairline py-14 md:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] md:gap-14 md:py-20">
          <div className="max-w-sm">
            <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-paper md:text-4xl">
              How it runs
            </h2>
            <p className="mt-3 max-w-[36ch] text-sm leading-6 text-muted">
              Click a command to copy it. Then open the dashboard on this Mac or
              the LAN IP.
            </p>
          </div>
          <div className="min-w-0 rounded-lg border border-hairline bg-panel px-5 sm:px-6">
            <LandingCommands />
          </div>
        </section>

        <section className="grid gap-8 border-t border-hairline py-14 md:py-20 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] lg:gap-14">
          <div className="relative overflow-hidden rounded-lg border border-hairline bg-panel p-6 sm:p-8">
            <BrandMark size="lg" className="mb-16 opacity-90 sm:mb-24" />
            <h2 className="max-w-[18ch] font-display text-3xl font-semibold leading-[1.05] tracking-[-0.04em] text-paper sm:text-4xl md:text-5xl">
              Close the dashboard. The Mac keeps the record.
            </h2>
            <p className="mt-5 max-w-[50ch] text-sm leading-6 text-muted">
              macOS only. Official Ookla Speedtest CLI. Not a test inside the
              browser.
            </p>
          </div>

          <dl className="grid content-start sm:grid-cols-2">
            {systemFacts.map((fact) => (
              <div
                key={fact.title}
                className="border-t border-hairline py-6 sm:min-h-40 sm:px-5"
              >
                <dt className="font-medium text-paper">{fact.title}</dt>
                <dd className="mt-2 text-sm leading-6 text-muted">{fact.body}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      <footer className="flex flex-col gap-5 border-t border-hairline py-7 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <BrandLockup markSize="sm" className="text-sm" />
          <p>{LICENSE_LABEL}</p>
        </div>
        <nav aria-label="Footer" className="flex items-center gap-5">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg outline-none transition-colors hover:text-copper focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            GitHub
          </a>
          <Link
            href={dashboardHref}
            className="rounded-lg outline-none transition-colors hover:text-copper focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            Dashboard
          </Link>
        </nav>
      </footer>
    </div>
  );
}
