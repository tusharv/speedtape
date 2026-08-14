import Link from "next/link";
import { redirect } from "next/navigation";
import { SpeedTape } from "@/app/components/speed-tape";
import { landingTapeCells } from "@/lib/landing-tape";
import { APP_NAME, GITHUB_URL, LICENSE_LABEL } from "@/lib/site";

const dashboardHref = "/app";

const primaryCta =
  "inline-flex items-center border border-copper bg-copper px-4 py-2 text-xs uppercase tracking-[0.16em] text-white";
const secondaryCta =
  "inline-flex items-center border border-hairline px-4 py-2 text-xs uppercase tracking-[0.16em] text-paper hover:border-copper";

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
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col px-4 sm:px-8">
      <header className="flex h-16 items-center justify-between gap-4">
        <p className="font-display text-lg font-semibold text-paper">{APP_NAME}</p>
        <nav aria-label="Landing" className="flex items-center gap-2">
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

      <main className="flex flex-1 flex-col gap-20 pb-16 pt-10">
        <section className="max-w-2xl">
          <h1 className="font-display text-4xl font-semibold leading-[1.1] text-paper md:text-5xl lg:text-6xl">
            Hourly internet speed for the house.
          </h1>
          <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-muted">
            Clone it, install the hourly agent, watch download, upload, and ping
            from any device on the LAN.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href={dashboardHref} className={primaryCta}>
              Open dashboard
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className={secondaryCta}
            >
              View on GitHub
            </a>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold text-paper">
            How it runs
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-paper">Install CLI</p>
              <pre className="mt-2 overflow-x-auto rounded-lg border border-hairline bg-panel p-4 font-mono text-xs text-paper">
                {`brew tap teamookla/speedtest
brew install speedtest`}
              </pre>
            </div>
            <div>
              <p className="text-sm font-medium text-paper">Install dependencies</p>
              <pre className="mt-2 overflow-x-auto rounded-lg border border-hairline bg-panel p-4 font-mono text-xs text-paper">
                npm install
              </pre>
            </div>
            <div>
              <p className="text-sm font-medium text-paper">Install agent</p>
              <pre className="mt-2 overflow-x-auto rounded-lg border border-hairline bg-panel p-4 font-mono text-xs text-paper">
                npm run install-agent
              </pre>
            </div>
            <div>
              <p className="text-sm font-medium text-paper">Start dashboard</p>
              <pre className="mt-2 overflow-x-auto rounded-lg border border-hairline bg-panel p-4 font-mono text-xs text-paper">
                npm run dev
              </pre>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted">
            Open http://localhost:3000 on this Mac, or the LAN IP from another
            device on the same Wi-Fi.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold text-paper">
            What you get
          </h2>
          <p className="mt-3 max-w-[65ch] text-sm leading-6 text-muted">
            Local SQLite, an hourly launchd agent while the Mac is awake, a
            24-hour tape, a history chart, and a runs archive.
          </p>
          <div className="mt-6">
            <SpeedTape cells={landingTapeCells()} />
            <p className="mt-2 text-xs text-muted">Sample 24-hour tape.</p>
          </div>
        </section>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline py-6 text-xs text-muted">
        <p>{LICENSE_LABEL}</p>
        <div className="flex gap-2">
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
        </div>
      </footer>
    </div>
  );
}
