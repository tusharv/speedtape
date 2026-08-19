import Link from "next/link";
import { BookOpenIcon, GaugeIcon, GithubLogoIcon } from "@phosphor-icons/react/ssr";
import { BrandLockup } from "@/app/components/brand-lockup";
import { primaryCta, secondaryCta } from "@/app/components/chrome";
import { CopyCommandList } from "@/app/components/landing-commands";
import { SiteHeader } from "@/app/components/site-nav";
import {
  DOCS_LABEL,
  DOCS_LEDE,
  DOCS_TITLE,
  GUIDE_SECTIONS,
  guideSection,
  type GuideSection,
} from "@/lib/guide";
import { GITHUB_URL, LICENSE_LABEL } from "@/lib/site";

const dashboardHref = "/app";
const icon = { size: 15, weight: "regular" as const, "aria-hidden": true };
const jumpLink =
  "rounded-lg px-2 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-muted outline-none transition-colors hover:text-copper focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-ink";
const footerLink =
  "rounded-lg outline-none transition-colors hover:text-copper focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

export const metadata = {
  title: "Docs",
  description: DOCS_LEDE,
};

function GuideItems({ section }: { section: GuideSection }) {
  return (
    <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
      {section.items.map((item) => (
        <div key={item.title} className="border-t border-hairline pt-5">
          <dt className="font-medium text-paper">{item.title}</dt>
          <dd className="mt-2 text-sm leading-6 text-muted">{item.body}</dd>
        </div>
      ))}
    </dl>
  );
}

function GuidePaths({ section }: { section: GuideSection }) {
  if (!section.paths?.length) return null;

  return (
    <dl className="grid gap-x-8 sm:grid-cols-2">
      {section.paths.map((path) => (
        <div key={path.name} className="border-t border-hairline py-5">
          <dt className="font-medium text-paper">{path.name}</dt>
          <dd className="mt-2 break-all font-mono text-[11px] leading-5 text-muted sm:text-xs">
            {path.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function CommandsPanel({ section }: { section: GuideSection }) {
  return (
    <div className="min-w-0 rounded-lg border border-hairline bg-panel px-5 sm:px-6">
      <CopyCommandList
        listKey={section.id}
        commands={section.commands}
        note={section.note}
      />
    </div>
  );
}

export default function DocsPage() {
  const mac = guideSection("mac");
  const windows = guideSection("windows");
  const agents = guideSection("agents");

  return (
    <div className="mx-auto flex min-h-dvh w-full min-w-0 max-w-7xl flex-col overflow-x-clip px-4 sm:px-8 lg:px-10">
      <div className="sticky top-0 z-[1] bg-ink">
        <SiteHeader
          nav={
            <nav
              aria-label="Guide"
              className="flex w-full min-w-0 flex-wrap items-center gap-1 sm:w-auto"
            >
              {GUIDE_SECTIONS.map((section) => (
                <a key={section.id} href={`#${section.id}`} className={jumpLink}>
                  {section.title}
                </a>
              ))}
            </nav>
          }
        />
      </div>

      <main className="flex min-w-0 flex-1 flex-col">
        <section className="max-w-lg py-12 md:py-16">
          <h1 className="max-w-[12ch] font-display text-5xl font-semibold leading-[0.96] tracking-[-0.055em] text-paper sm:text-6xl lg:text-7xl">
            {DOCS_TITLE}
          </h1>
          <p className="mt-5 max-w-[40ch] text-base leading-7 text-muted sm:text-lg">
            {DOCS_LEDE}
          </p>
          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link href={dashboardHref} className={primaryCta}>
              <GaugeIcon {...icon} />
              Open dashboard
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className={secondaryCta}
            >
              <GithubLogoIcon {...icon} />
              View on GitHub
            </a>
          </div>
        </section>

        <section
          id={mac.id}
          className="scroll-mt-24 border-t border-hairline py-14 md:py-20"
          aria-labelledby="mac-title"
        >
          <div className="grid gap-10 md:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] md:gap-14">
            <div className="max-w-sm">
              <h2
                id="mac-title"
                className="font-display text-3xl font-semibold tracking-[-0.035em] text-paper md:text-4xl"
              >
                {mac.title}
              </h2>
              <p className="mt-3 max-w-[36ch] text-sm leading-6 text-muted">
                {mac.lede}
              </p>
            </div>
            <CommandsPanel section={mac} />
          </div>
          <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <GuideItems section={mac} />
            <GuidePaths section={mac} />
          </div>
        </section>

        <section
          id={windows.id}
          className="scroll-mt-24 border-t border-hairline py-14 md:py-20"
          aria-labelledby="windows-title"
        >
          <h2
            id="windows-title"
            className="font-display text-3xl font-semibold tracking-[-0.035em] text-paper md:text-4xl"
          >
            {windows.title}
          </h2>
          <p className="mt-3 max-w-[54ch] text-sm leading-6 text-muted">
            {windows.lede}
          </p>
          <div className="mt-10">
            <CommandsPanel section={windows} />
          </div>
          <div className="mt-12">
            <GuideItems section={windows} />
          </div>
          <div className="mt-4">
            <GuidePaths section={windows} />
          </div>
        </section>

        <section
          id={agents.id}
          className="scroll-mt-24 border-t border-hairline py-14 md:py-20"
          aria-labelledby="agents-title"
        >
          <h2
            id="agents-title"
            className="max-w-[18ch] font-display text-3xl font-semibold tracking-[-0.035em] text-paper md:text-4xl"
          >
            {agents.title}
          </h2>
          <p className="mt-3 max-w-[54ch] text-sm leading-6 text-muted">
            {agents.lede}
          </p>
          <div className="mt-10">
            <GuideItems section={agents} />
          </div>
          <div className="mt-12">
            <CommandsPanel section={agents} />
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-5 border-t border-hairline py-8 text-xs leading-5 text-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <BrandLockup markSize="sm" className="text-sm" />
          <p>{LICENSE_LABEL}</p>
        </div>
        <nav aria-label="Footer" className="flex items-center gap-5">
          <span className={`${footerLink} text-paper`} aria-current="page">
            <BookOpenIcon {...icon} className="mr-1 inline align-text-bottom" />
            {DOCS_LABEL}
          </span>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className={footerLink}>
            GitHub
          </a>
          <Link href={dashboardHref} className={footerLink}>
            Dashboard
          </Link>
        </nav>
      </footer>
    </div>
  );
}
