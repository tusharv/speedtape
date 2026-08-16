import Link from "next/link";
import { redirect } from "next/navigation";
import {
  GaugeIcon,
  GithubLogoIcon,
} from "@phosphor-icons/react/ssr";
import {
  BrandLockup,
  BrandMark,
} from "@/app/components/brand-lockup";
import { LandingCommands } from "@/app/components/landing-commands";
import { LandingTape } from "@/app/components/landing-tape";
import { SiteHeader } from "@/app/components/site-nav";
import { landingTapeCells } from "@/lib/landing-tape";
import { GITHUB_URL, LICENSE_LABEL } from "@/lib/site";

const dashboardHref = "/app";
const icon = { size: 15, weight: "regular" as const, "aria-hidden": true };

const primaryCta =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-copper bg-copper px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.12em] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] outline-none transition-[transform,background-color] hover:bg-paper hover:text-ink active:translate-y-px focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:w-auto sm:whitespace-nowrap";
const secondaryCta =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-hairline px-3 py-2 text-center text-[11px] font-medium uppercase tracking-[0.1em] text-paper outline-none transition-[transform,border-color,color] hover:border-copper hover:text-copper active:translate-y-px focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:w-auto sm:whitespace-nowrap sm:px-4 sm:text-xs";

const systemFacts = [
  {
    title: "Peak and off-peak",
    body: "Collectors fire on an interval or at clock times, so busy evenings and quiet mornings both land in the record.",
  },
  {
    title: "CSV for your ISP",
    body: "Export every sample as a spreadsheet. Share it, chart it, or keep it with the ticket.",
  },
  {
    title: "Failed runs stay",
    body: "When a test cannot finish, the tape keeps the gap. Open the run to see when the line went down and when it came back.",
  },
  {
    title: "This computer only",
    body: "Samples never leave this house. Phones on the same Wi-Fi can still watch the tape.",
  },
] as const;

const ispSteps = [
  {
    title: "Baseline the day",
    body: "Sample across one day, including hours when everyone is online and hours when they are not. A collector does this while you sleep.",
  },
  {
    title: "Keep testing after you call",
    body: "Providers often need a week of independent results, not a single screenshot. Stay on the schedule until the ticket closes.",
  },
  {
    title: "Export CSV",
    body: "Download the house record as a spreadsheet you can attach, chart, or print. Each run also has its own line pass.",
  },
  {
    title: "Mark the outage",
    body: "Failed samples stay in the tape. Open one to see when the line went down and when it came back.",
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
      <SiteHeader
        nav={
          <nav
            aria-label="Landing"
            className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center"
          >
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className={secondaryCta}
            >
              <GithubLogoIcon {...icon} />
              View on GitHub
            </a>
            <Link href={dashboardHref} className={primaryCta}>
              <GaugeIcon {...icon} />
              Open dashboard
            </Link>
          </nav>
        }
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <section className="grid min-w-0 gap-10 py-12 md:grid-cols-[minmax(0,0.76fr)_minmax(0,1.24fr)] md:items-end md:gap-10 md:py-16 lg:gap-16">
          <div className="max-w-lg min-w-0">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-copper">
              Local network monitor
            </p>
            <h1 className="mt-4 max-w-[9ch] font-display text-5xl font-semibold leading-[0.96] tracking-[-0.055em] text-paper sm:text-6xl lg:text-7xl">
              Know your line.
            </h1>
            <p className="mt-5 max-w-[38ch] text-base leading-7 text-muted sm:text-lg">
              Scheduled tests across peak and off-peak hours. Evidence you can
              take to your ISP.
            </p>
            <div className="mt-7">
              <Link href={dashboardHref} className={primaryCta}>
                <GaugeIcon {...icon} />
                Open dashboard
              </Link>
            </div>
          </div>

          <div
            aria-label="24 hour signal"
            role="group"
            className="min-w-0 rounded-lg border border-hairline bg-panel p-5 shadow-[0_28px_80px_-54px_rgba(15,118,110,0.7)] sm:p-6"
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
              Click a command to copy it. Then open the dashboard on this
              computer or the LAN IP.
            </p>
          </div>
          <div className="min-w-0 rounded-lg border border-hairline bg-panel px-5 sm:px-6">
            <LandingCommands />
          </div>
        </section>

        <section className="border-t border-hairline py-14 md:py-20">
          <h2 className="max-w-[18ch] font-display text-3xl font-semibold tracking-[-0.035em] text-paper md:text-4xl">
            Show your provider the record.
          </h2>
          <p className="mt-3 max-w-[54ch] text-sm leading-6 text-muted">
            One slow test is easy to dismiss. A week of independent samples,
            on-peak and off-peak, is harder to ignore.
          </p>
          <ol className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {ispSteps.map((step) => (
              <li key={step.title} className="border-t border-hairline pt-5">
                <h3 className="font-medium text-paper">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-8 border-t border-hairline py-14 md:py-20 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] lg:gap-14">
          <div className="relative overflow-hidden rounded-lg border border-hairline bg-panel p-6 sm:p-8">
            <BrandMark size="lg" className="mb-16 opacity-90 sm:mb-24" />
            <h2 className="max-w-[18ch] font-display text-3xl font-semibold leading-[1.05] tracking-[-0.04em] text-paper sm:text-4xl md:text-5xl">
              Close the dashboard. This computer keeps testing.
            </h2>
            <p className="mt-5 max-w-[50ch] text-sm leading-6 text-muted">
              macOS and Windows. Official Ookla Speedtest CLI. Not a test inside
              the browser.
            </p>
          </div>

          <dl className="grid content-start gap-x-8 sm:grid-cols-2">
            {systemFacts.map((fact) => (
              <div
                key={fact.title}
                className="border-t border-hairline py-6 sm:min-h-40 sm:px-2"
              >
                <dt className="font-medium text-paper">{fact.title}</dt>
                <dd className="mt-2 text-sm leading-6 text-muted">{fact.body}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      <footer className="flex flex-col gap-5 border-t border-hairline py-8 text-xs leading-5 text-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
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
