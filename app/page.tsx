import Link from "next/link";
import { redirect } from "next/navigation";
import { LandingCommands } from "@/app/components/landing-commands";
import { LandingTape } from "@/app/components/landing-tape";
import { landingTapeCells } from "@/lib/landing-tape";
import { APP_NAME, GITHUB_URL, LICENSE_LABEL } from "@/lib/site";

const dashboardHref = "/app";

const primaryCta =
  "inline-flex items-center border border-copper bg-copper px-4 py-2 text-xs uppercase tracking-[0.16em] text-white transition-transform hover:bg-amber active:scale-[0.98]";
const secondaryCta =
  "inline-flex items-center whitespace-nowrap border border-hairline px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-paper transition-colors hover:border-copper hover:text-copper sm:px-4 sm:text-xs sm:tracking-[0.16em]";

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
    <div className="mx-auto flex min-h-dvh w-full min-w-0 max-w-6xl flex-col overflow-x-clip px-4 sm:px-8">
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
        <p className="font-display text-lg font-semibold text-paper">{APP_NAME}</p>
        <nav aria-label="Landing" className="flex shrink-0 items-center gap-2">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className={secondaryCta}
          >
            View on GitHub
          </a>
        </nav>
      </header>

      <main className="flex min-w-0 flex-1 flex-col gap-12 pb-16 pt-8 sm:gap-20">
        <section className="grid min-w-0 items-end gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-14">
          <div className="max-w-md min-w-0">
            <h1 className="font-display text-[2rem] font-semibold leading-[1.1] tracking-tight text-paper sm:text-4xl md:text-5xl">
              Internet speed for the house.
            </h1>
            <p className="mt-4 max-w-[36ch] text-base leading-relaxed text-muted">
              Watch the line from any device on this LAN. Close the page.
              Sampling continues.
            </p>
            <div className="mt-6">
              <Link href={dashboardHref} className={primaryCta}>
                Open dashboard
              </Link>
            </div>
          </div>
          <div className="min-w-0 overflow-x-clip">
            <LandingTape cells={landingTapeCells()} />
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold text-paper">
            How it runs
          </h2>
          <p className="mt-2 max-w-[65ch] text-sm text-muted">
            Click a command to copy it. Then open the dashboard on this Mac or
            the LAN IP.
          </p>
          <div className="mt-6 min-w-0 max-w-xl border-y border-hairline">
            <LandingCommands />
          </div>
        </section>

        <section className="border-t border-hairline pt-10">
          <h2 className="font-display text-2xl font-semibold leading-[1.15] text-paper md:text-3xl">
            Close the dashboard. The Mac keeps the record.
          </h2>
          <p className="mt-3 max-w-[55ch] text-sm leading-6 text-muted">
            macOS only. Official Ookla Speedtest CLI. Not a test inside the
            browser.
          </p>
          <dl className="mt-8 max-w-xl divide-y divide-hairline">
            <div className="flex flex-col gap-1 py-4 first:pt-0 sm:flex-row sm:gap-8">
              <dt className="shrink-0 font-medium text-paper sm:w-48">This Mac only</dt>
              <dd className="text-sm leading-6 text-muted">
                Collectors are LaunchAgents on one machine, not a site you leave
                open.
              </dd>
            </div>
            <div className="flex flex-col gap-1 py-4 sm:flex-row sm:gap-8">
              <dt className="shrink-0 font-medium text-paper sm:w-48">Ookla Speedtest CLI</dt>
              <dd className="text-sm leading-6 text-muted">
                The same official CLI you run in Terminal. The browser never
                runs the test.
              </dd>
            </div>
            <div className="flex flex-col gap-1 py-4 sm:flex-row sm:gap-8">
              <dt className="shrink-0 font-medium text-paper sm:w-48">SQLite on disk</dt>
              <dd className="text-sm leading-6 text-muted">
                Samples never leave this house. Phones on the same Wi-Fi can
                still watch the tape.
              </dd>
            </div>
            <div className="flex flex-col gap-1 py-4 last:pb-0 sm:flex-row sm:gap-8">
              <dt className="shrink-0 font-medium text-paper sm:w-48">Tape, chart, runs</dt>
              <dd className="text-sm leading-6 text-muted">
                A day strip, history, and every test kept, on the schedule you
                set.
              </dd>
            </div>
          </dl>
        </section>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline py-6 text-xs text-muted">
        <p>{LICENSE_LABEL}</p>
      </footer>
    </div>
  );
}
