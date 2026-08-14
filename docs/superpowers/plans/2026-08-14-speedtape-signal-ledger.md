# Speedtape Signal Ledger Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the Speedtape landing page a professional Signal Ledger identity with a reusable logo, instrument-style tape hero, polished command feedback, and an asymmetric system ledger.

**Architecture:** Keep `app/page.tsx` as a Server Component that composes static landing content around the existing client-side tape and command islands. Add one focused server-safe brand component, keep clipboard state inside `LandingCommands`, and use the existing Tailwind v4 tokens so the dashboard and landing page continue sharing one light/dark visual system.

**Tech Stack:** Next.js 16.3 App Router, React 19 Server and Client Components, TypeScript, Tailwind CSS v4, Phosphor Icons, Vitest, React server rendering tests.

---

## File map

| File | Responsibility |
| --- | --- |
| `app/components/brand-lockup.tsx` | Render the reusable Signal Ledger mark and linked Speedtape wordmark. |
| `app/components/brand-lockup.test.tsx` | Verify readable branding, home link semantics, and decorative mark behavior. |
| `app/icon.svg` | Supply the geometric Signal Ledger browser/app icon through the Next.js 16.3 icon convention. |
| `app/components/landing-commands.tsx` | Keep the four commands and add explicit copied and copy-failed feedback. |
| `app/components/landing-commands.test.tsx` | Verify command content and clipboard success/failure logic. |
| `app/page.tsx` | Compose the redesigned header, hero instrument, command rail, system ledger, and footer. |
| `app/page.test.tsx` | Verify the approved landing copy, landmarks, actions, and forbidden punctuation. |

Do not modify dashboard routes, database code, tape interaction logic, command strings, or shared color tokens.

## Local command note

The Homebrew Node binary on this machine currently points at a removed ICU library. Use the working Node binary directly for all JavaScript commands in this worktree:

```bash
/Users/tusharvagela/.nvm/versions/node/v22.17.0/bin/node
```

The baseline in `.worktrees/signal-ledger-landing` is 22 test files and 115 passing tests.

### Task 1: Add the Signal Ledger brand system

**Files:**
- Create: `app/components/brand-lockup.test.tsx`
- Create: `app/components/brand-lockup.tsx`
- Create: `app/icon.svg`

- [ ] **Step 1: Write the failing brand-lockup test**

Create `app/components/brand-lockup.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BrandLockup } from "@/app/components/brand-lockup";

describe("BrandLockup", () => {
  it("links the readable Speedtape name home and hides the mark", () => {
    const html = renderToStaticMarkup(<BrandLockup />);

    expect(html).toContain('href="/"');
    expect(html).toContain('aria-label="Speedtape home"');
    expect(html).toContain("Speedtape");
    expect(html).toContain('data-brand-mark="true"');
    expect(html).toContain('aria-hidden="true"');
  });
});
```

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run:

```bash
/Users/tusharvagela/.nvm/versions/node/v22.17.0/bin/node node_modules/vitest/vitest.mjs run app/components/brand-lockup.test.tsx
```

Expected: FAIL because `@/app/components/brand-lockup` does not exist.

- [ ] **Step 3: Implement the reusable mark and lockup**

Create `app/components/brand-lockup.tsx`:

```tsx
import Link from "next/link";
import { APP_NAME } from "@/lib/site";

type BrandMarkSize = "sm" | "md" | "lg";

const markSizes: Record<BrandMarkSize, string> = {
  sm: "size-7",
  md: "size-9",
  lg: "size-16",
};

export function BrandMark({
  size = "md",
  className = "",
}: {
  size?: BrandMarkSize;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-brand-mark="true"
      className={`inline-flex shrink-0 items-end gap-[12%] rounded-lg border border-copper/40 bg-copper/5 p-[20%] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${markSizes[size]} ${className}`}
    >
      <span className="h-[34%] min-w-0 flex-1 rounded-[1px] bg-copper" />
      <span className="h-[61%] min-w-0 flex-1 rounded-[1px] bg-copper" />
      <span className="h-[88%] min-w-0 flex-1 rounded-[1px] bg-copper" />
    </span>
  );
}

export function BrandLockup({
  href = "/",
  markSize = "md",
  className = "",
}: {
  href?: string;
  markSize?: BrandMarkSize;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={`${APP_NAME} home`}
      className={`inline-flex items-center gap-2.5 rounded-lg font-display text-lg font-semibold tracking-[-0.03em] text-paper outline-none transition-colors hover:text-copper focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${className}`}
    >
      <BrandMark size={markSize} />
      <span>{APP_NAME}</span>
    </Link>
  );
}
```

- [ ] **Step 4: Add the Next.js app icon**

Create `app/icon.svg` using the installed Next.js 16.3 `app/icon.svg` metadata convention:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="1" y="1" width="62" height="62" rx="12" fill="#09090b" stroke="#28534e" stroke-width="2"/>
  <rect x="14" y="37" width="9" height="13" rx="2" fill="#2dd4bf"/>
  <rect x="28" y="27" width="9" height="23" rx="2" fill="#2dd4bf"/>
  <rect x="42" y="14" width="9" height="36" rx="2" fill="#2dd4bf"/>
</svg>
```

- [ ] **Step 5: Run the focused test and verify it passes**

Run:

```bash
/Users/tusharvagela/.nvm/versions/node/v22.17.0/bin/node node_modules/vitest/vitest.mjs run app/components/brand-lockup.test.tsx
```

Expected: 1 test file passes with 1 test.

- [ ] **Step 6: Commit the brand system**

```bash
git add app/components/brand-lockup.tsx app/components/brand-lockup.test.tsx app/icon.svg
git commit -m "feat: add Speedtape signal mark"
```

### Task 2: Add explicit command-copy feedback

**Files:**
- Create: `app/components/landing-commands.test.tsx`
- Modify: `app/components/landing-commands.tsx`

- [ ] **Step 1: Write failing tests for command content and clipboard results**

Create `app/components/landing-commands.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  LandingCommands,
  copyCommand,
} from "@/app/components/landing-commands";

describe("LandingCommands", () => {
  it("keeps the four setup commands readable before hydration", () => {
    const html = renderToStaticMarkup(<LandingCommands />);

    expect(html).toContain("Install CLI");
    expect(html).toContain("Install dependencies");
    expect(html).toContain("Install agent");
    expect(html).toContain("Start dashboard");
    expect(html).toContain("Copy command");
    expect(html).toContain('aria-live="polite"');
  });

  it("returns copied when the clipboard write succeeds", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    await expect(copyCommand(writeText, "npm install")).resolves.toBe("copied");
    expect(writeText).toHaveBeenCalledWith("npm install");
  });

  it("returns failed when the clipboard write rejects", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("clipboard denied"));

    await expect(copyCommand(writeText, "npm install")).resolves.toBe("failed");
  });
});
```

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run:

```bash
/Users/tusharvagela/.nvm/versions/node/v22.17.0/bin/node node_modules/vitest/vitest.mjs run app/components/landing-commands.test.tsx
```

Expected: FAIL because `copyCommand` is not exported and the idle markup has no polite live region.

- [ ] **Step 3: Implement clipboard result handling and polished command rows**

Replace `app/components/landing-commands.tsx` with:

```tsx
"use client";

import { useState } from "react";
import {
  CheckIcon,
  CopyIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/ssr";

const icon = { size: 15, weight: "regular" as const, "aria-hidden": true };

const COMMANDS = [
  {
    name: "Install CLI",
    command: "brew tap teamookla/speedtest && brew install speedtest",
  },
  {
    name: "Install dependencies",
    command: "npm install",
  },
  {
    name: "Install agent",
    command: "npm run install-agent",
  },
  {
    name: "Start dashboard",
    command: "npm run dev",
  },
] as const;

type CopyResult = "copied" | "failed";
type CopyState = { name: string; result: CopyResult } | null;

export async function copyCommand(
  writeText: (text: string) => Promise<void>,
  command: string,
): Promise<CopyResult> {
  try {
    await writeText(command);
    return "copied";
  } catch {
    return "failed";
  }
}

export function LandingCommands() {
  const [copyState, setCopyState] = useState<CopyState>(null);

  return (
    <ul className="min-w-0 divide-y divide-hairline">
      {COMMANDS.map((item) => {
        const result = copyState?.name === item.name ? copyState.result : null;
        const feedback =
          result === "copied"
            ? "Copied"
            : result === "failed"
              ? "Copy failed"
              : "Copy command";

        return (
          <li key={item.name}>
            <button
              type="button"
              onClick={async () => {
                const nextResult = await copyCommand(
                  navigator.clipboard.writeText.bind(navigator.clipboard),
                  item.command,
                );
                setCopyState({ name: item.name, result: nextResult });
                window.setTimeout(() => {
                  setCopyState((current) =>
                    current?.name === item.name ? null : current,
                  );
                }, 1800);
              }}
              className="group flex w-full min-w-0 flex-col items-start gap-3 py-5 text-left outline-none transition-[color,transform] hover:text-copper active:translate-y-px focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
            >
              <span className="flex w-full items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-sm font-medium text-paper group-hover:text-copper">
                  {result === "copied" ? (
                    <CheckIcon {...icon} />
                  ) : result === "failed" ? (
                    <WarningCircleIcon {...icon} />
                  ) : (
                    <CopyIcon {...icon} />
                  )}
                  {item.name}
                </span>
                <span
                  aria-live="polite"
                  className={`shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] ${
                    result === "failed"
                      ? "text-fail"
                      : result === "copied"
                        ? "text-copper"
                        : "sr-only"
                  }`}
                >
                  {feedback}
                </span>
              </span>
              <span className="min-w-0 break-all font-mono text-[11px] leading-5 text-muted sm:text-xs sm:leading-6">
                {item.command}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
/Users/tusharvagela/.nvm/versions/node/v22.17.0/bin/node node_modules/vitest/vitest.mjs run app/components/landing-commands.test.tsx
```

Expected: 1 test file passes with 3 tests.

- [ ] **Step 5: Run the existing landing-tape test to guard the neighboring client island**

Run:

```bash
/Users/tusharvagela/.nvm/versions/node/v22.17.0/bin/node node_modules/vitest/vitest.mjs run app/components/landing-tape.test.tsx
```

Expected: 1 test file passes with 1 test.

- [ ] **Step 6: Commit the command feedback**

```bash
git add app/components/landing-commands.tsx app/components/landing-commands.test.tsx
git commit -m "feat: show command copy feedback"
```

### Task 3: Recompose the landing page as Signal Ledger

**Files:**
- Create: `app/page.test.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Write the failing landing composition test**

Create `app/page.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Landing from "@/app/page";

describe("Speedtape landing page", () => {
  it("renders the approved Signal Ledger identity and structure", async () => {
    const page = await Landing({
      params: Promise.resolve({}),
      searchParams: Promise.resolve({}),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Know your line.");
    expect(html).toContain("Local network monitor");
    expect(html).toContain('aria-label="24 hour signal"');
    expect(html).toContain("How it runs");
    expect(html).toContain("Close the dashboard. The Mac keeps the record.");
    expect(html).toContain("This Mac only");
    expect(html).toContain("SQLite on disk");
    expect(html).toContain('href="/app"');
    expect(html).toContain("View on GitHub");
    expect(html).toContain("MIT");
    expect(html).not.toContain("—");
    expect(html).not.toContain("–");
  });
});
```

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run:

```bash
/Users/tusharvagela/.nvm/versions/node/v22.17.0/bin/node node_modules/vitest/vitest.mjs run app/page.test.tsx
```

Expected: FAIL because the current hero still says `Internet speed for the house.` and has no `24 hour signal` instrument label.

- [ ] **Step 3: Implement the complete Signal Ledger composition**

Replace `app/page.tsx` with:

```tsx
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
  "inline-flex items-center whitespace-nowrap rounded-lg border border-copper bg-copper px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] outline-none transition-[transform,background-color] hover:bg-amber active:translate-y-px focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-ink";
const secondaryCta =
  "inline-flex items-center whitespace-nowrap rounded-lg border border-hairline px-3 py-2 text-[11px] font-medium uppercase tracking-[0.1em] text-paper outline-none transition-[transform,border-color,color] hover:border-copper hover:text-copper active:translate-y-px focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:px-4 sm:text-xs";

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
        <nav aria-label="Landing" className="flex shrink-0 items-center gap-2">
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
            className="outline-none transition-colors hover:text-copper focus-visible:text-copper"
          >
            GitHub
          </a>
          <Link
            href={dashboardHref}
            className="outline-none transition-colors hover:text-copper focus-visible:text-copper"
          >
            Dashboard
          </Link>
        </nav>
      </footer>
    </div>
  );
}
```

- [ ] **Step 4: Run focused landing tests and verify they pass**

Run:

```bash
/Users/tusharvagela/.nvm/versions/node/v22.17.0/bin/node node_modules/vitest/vitest.mjs run app/page.test.tsx app/components/brand-lockup.test.tsx app/components/landing-commands.test.tsx app/components/landing-tape.test.tsx
```

Expected: 4 test files pass with 6 tests.

- [ ] **Step 5: Run the full suite before committing**

Run:

```bash
/Users/tusharvagela/.nvm/versions/node/v22.17.0/bin/node node_modules/vitest/vitest.mjs run
```

Expected: 25 test files pass with 120 tests.

- [ ] **Step 6: Commit the landing composition**

```bash
git add app/page.tsx app/page.test.tsx
git commit -m "feat: redesign Speedtape landing page"
```

### Task 4: Run production and visual verification

**Files:**
- Verify: `app/page.tsx`
- Verify: `app/components/brand-lockup.tsx`
- Verify: `app/components/landing-commands.tsx`
- Verify: `app/icon.svg`
- Modify only if a verification step exposes a defect.

- [ ] **Step 1: Run the full automated verification set from a clean working tree**

Run:

```bash
/Users/tusharvagela/.nvm/versions/node/v22.17.0/bin/node node_modules/vitest/vitest.mjs run
/Users/tusharvagela/.nvm/versions/node/v22.17.0/bin/node node_modules/eslint/bin/eslint.js .
/Users/tusharvagela/.nvm/versions/node/v22.17.0/bin/node node_modules/next/dist/bin/next build
git diff --check
```

Expected: all tests pass, ESLint exits 0, Next.js production build exits 0, and `git diff --check` prints nothing.

- [ ] **Step 2: Run mechanical pre-flight scans**

Run:

```bash
rg -n "[—–]" app/page.tsx app/components/brand-lockup.tsx app/components/landing-commands.tsx
rg -n "h-screen|window\.addEventListener\(['\"]scroll|Inter|Fraunces|Instrument_Serif" app/page.tsx app/components/brand-lockup.tsx app/components/landing-commands.tsx
```

Expected: both commands return no matches. Confirm one teal accent, one 8px radius family, no fake screenshots, no scroll cues, no version labels, and no decorative status dots by reading the rendered page strings once more.

- [ ] **Step 3: Start the production-shaped local page for browser review**

Run:

```bash
/Users/tusharvagela/.nvm/versions/node/v22.17.0/bin/node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3100
```

Expected: Next.js reports the local URL `http://127.0.0.1:3100` and keeps running for the next steps.

- [ ] **Step 4: Inspect desktop and mobile layouts in the browser**

Open `http://127.0.0.1:3100` and verify:

- At 1440 by 900, the navigation is one line and below 80px, the hero CTA is visible without scrolling, the headline is no more than two lines, and the tape panel has no clipping.
- At 390 by 844 and 320 by 700, the hero and system ledger are single-column, commands wrap without horizontal overflow, and all controls stay reachable.
- The tape slider still responds to pointer movement plus Arrow, Home, and End keys.
- Brand links, GitHub links, dashboard links, focus rings, and active states are visible and correct.
- Trigger one successful copy and one denied clipboard copy. Confirm the visible `Copied` and `Copy failed` feedback does not move neighboring layout.
- Verify the page in system light and dark themes. Check the primary CTA uses high-contrast text in both.
- Enable reduced motion and reload. Tape bars must render without their rise animation.
- Confirm the generated app icon appears in the page metadata or browser tab.

- [ ] **Step 5: Fix only defects found by verification using a red-green cycle**

For each defect, add the smallest failing assertion to the nearest focused test, run it to see the expected failure, apply the minimal fix, and rerun that focused test. Do not add unapproved page sections, dependencies, copy, or animation.

- [ ] **Step 6: Re-run the complete verification set after any refinement**

Run:

```bash
/Users/tusharvagela/.nvm/versions/node/v22.17.0/bin/node node_modules/vitest/vitest.mjs run
/Users/tusharvagela/.nvm/versions/node/v22.17.0/bin/node node_modules/eslint/bin/eslint.js .
/Users/tusharvagela/.nvm/versions/node/v22.17.0/bin/node node_modules/next/dist/bin/next build
git diff --check
```

Expected: every command exits 0. If visual verification caused changes, commit only those verified changes:

```bash
git add app
git commit -m "fix: refine Signal Ledger landing layout"
```

- [ ] **Step 7: Review the final branch diff against the approved specification**

Run:

```bash
git status --short
git log --oneline --decorate -6
git diff main...HEAD --stat
git diff main...HEAD -- app/page.tsx app/components/brand-lockup.tsx app/components/landing-commands.tsx app/icon.svg
```

Expected: working tree is clean; only the approved brand, landing, tests, icon, design specification, worktree-ignore, and implementation-plan changes are present; no dashboard or data behavior changed.
