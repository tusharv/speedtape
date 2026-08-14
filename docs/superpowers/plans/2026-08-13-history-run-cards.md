# History Run Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Runs section under History with one card per speed test, plus status / slow-down / high-ping filters, sort, and 24-per-page paging in the URL.

**Architecture:** Keep `loadDashboard(range)` as the only SQLite read. Pure helpers in `lib/runs.ts` parse the URL, filter, sort, and page `data.tests` using `data.summary` averages. `HistoryRuns` is a client component (needs `useSearchParams`) that renders the toolbar, card grid, and pager as `Link`s. `RangeTabs` preserve filter/sort params via `runHref`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4 (existing tokens), Vitest.

**Spec:** `docs/superpowers/specs/2026-08-13-history-run-cards-design.md`

---

## File map

| File | Responsibility |
| --- | --- |
| Create: `lib/runs.ts` | Types, `parseRunQuery`, `runHref`, `filterRuns`, `sortRuns`, `pageRuns`, `PAGE_SIZE` |
| Create: `lib/runs.test.ts` | Unit tests for those helpers |
| Create: `app/components/run-card.tsx` | One test card |
| Create: `app/components/history-runs.tsx` | Toolbar, grid, pager, empty-filter state |
| Modify: `app/components/stats.tsx` | `RangeTabs` takes `RunQuery` and uses `runHref` |
| Modify: `app/page.tsx` | Parse run query, pass it to `RangeTabs`, render `HistoryRuns` under History |
| Modify: `README.md` | Mention the Runs list |

Do not add SQLite queries, indexes, columns, React Testing Library, or new color tokens.

`HistoryRuns` is a client component because it reads `useSearchParams`. Wrap it in `<Suspense>` on the page. Filtering still uses the `tests` array already loaded for the range (no extra SQL).

---

### Task 1: URL parse and href

**Files:**
- Create: `lib/runs.test.ts`
- Create: `lib/runs.ts`
- Modify: none yet

- [ ] **Step 1: Write the failing tests**

Create `lib/runs.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseRunQuery, runHref } from "@/lib/runs";

describe("parseRunQuery", () => {
  it("defaults unknown and missing values", () => {
    expect(parseRunQuery({})).toEqual({
      range: "24h",
      status: "all",
      slow: false,
      ping: false,
      sort: "newest",
      page: 1,
    });
    expect(
      parseRunQuery({
        range: "nope",
        status: "weird",
        slow: "yes",
        ping: "true",
        sort: "fastest",
        page: "0",
      }),
    ).toEqual({
      range: "24h",
      status: "all",
      slow: false,
      ping: false,
      sort: "newest",
      page: 1,
    });
  });

  it("reads known values", () => {
    expect(
      parseRunQuery({
        range: "7d",
        status: "failed",
        slow: "1",
        ping: "1",
        sort: "slowest-down",
        page: "3",
      }),
    ).toEqual({
      range: "7d",
      status: "failed",
      slow: true,
      ping: true,
      sort: "slowest-down",
      page: 3,
    });
  });
});

describe("runHref", () => {
  it("omits default params", () => {
    expect(
      runHref({
        range: "24h",
        status: "all",
        slow: false,
        ping: false,
        sort: "newest",
        page: 1,
      }),
    ).toBe("/?range=24h");
  });

  it("includes only non-default params", () => {
    expect(
      runHref({
        range: "7d",
        status: "ok",
        slow: true,
        ping: true,
        sort: "highest-ping",
        page: 2,
      }),
    ).toBe("/?range=7d&status=ok&slow=1&ping=1&sort=highest-ping&page=2");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/runs.test.ts`

Expected: FAIL with `Cannot find module '@/lib/runs'` or similar.

- [ ] **Step 3: Write minimal implementation**

Create `lib/runs.ts`:

```ts
import { parseRange } from "@/lib/range";
import type { Range } from "@/lib/types";

export type RunStatus = "all" | "ok" | "failed";
export type RunSort = "newest" | "oldest" | "slowest-down" | "highest-ping";

export type RunQuery = {
  range: Range;
  status: RunStatus;
  slow: boolean;
  ping: boolean;
  sort: RunSort;
  page: number;
};

export type RunFilters = {
  status: RunStatus;
  slow: boolean;
  ping: boolean;
};

export const PAGE_SIZE = 24;

export type RunSearchParams = {
  range?: string;
  status?: string;
  slow?: string;
  ping?: string;
  sort?: string;
  page?: string;
};

export function parseRunQuery(params: RunSearchParams): RunQuery {
  const pageNum = Number.parseInt(params.page ?? "", 10);
  const status = params.status;
  const sort = params.sort;
  return {
    range: parseRange(params.range),
    status: status === "ok" || status === "failed" ? status : "all",
    slow: params.slow === "1",
    ping: params.ping === "1",
    sort:
      sort === "oldest" ||
      sort === "slowest-down" ||
      sort === "highest-ping"
        ? sort
        : "newest",
    page: Number.isInteger(pageNum) && pageNum >= 1 ? pageNum : 1,
  };
}

export function runHref(query: RunQuery): string {
  const params = new URLSearchParams();
  params.set("range", query.range);
  if (query.status !== "all") params.set("status", query.status);
  if (query.slow) params.set("slow", "1");
  if (query.ping) params.set("ping", "1");
  if (query.sort !== "newest") params.set("sort", query.sort);
  if (query.page > 1) params.set("page", String(query.page));
  return `/?${params.toString()}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/runs.test.ts`

Expected: PASS (2 describes, 4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/runs.ts lib/runs.test.ts
git commit -m "$(cat <<'EOF'
Add URL helpers for history run filters and paging.

EOF
)"
```

---

### Task 2: filterRuns

**Files:**
- Modify: `lib/runs.test.ts`
- Modify: `lib/runs.ts`

- [ ] **Step 1: Write the failing tests**

Append to `lib/runs.test.ts` (keep existing imports; add `filterRuns` and types):

```ts
import { describe, expect, it } from "vitest";
import { filterRuns, parseRunQuery, runHref } from "@/lib/runs";
import type { SpeedTestRow } from "@/lib/types";
import type { Summary } from "@/lib/db";

function row(partial: Partial<SpeedTestRow> & { id: number }): SpeedTestRow {
  return {
    testedAt: "2026-08-13T12:00:00.000Z",
    downloadMbps: 100,
    uploadMbps: 20,
    pingMs: 10,
    jitterMs: 1,
    packetLoss: 0,
    isp: "ISP",
    serverName: "Server",
    serverLocation: "Here",
    error: null,
    ...partial,
  };
}

const summary: Summary = {
  count: 2,
  download: { min: 40, avg: 100, max: 160 },
  upload: { min: 10, avg: 20, max: 30 },
  ping: { min: 8, avg: 20, max: 50 },
};

const emptySummary: Summary = {
  count: 0,
  download: { min: null, avg: null, max: null },
  upload: { min: null, avg: null, max: null },
  ping: { min: null, avg: null, max: null },
};

const okFast = row({ id: 1, downloadMbps: 160, pingMs: 8 });
const okSlow = row({ id: 2, downloadMbps: 40, pingMs: 50 });
const failed = row({
  id: 3,
  downloadMbps: null,
  uploadMbps: null,
  pingMs: null,
  jitterMs: null,
  packetLoss: null,
  error: "timeout",
});
const tests = [okFast, okSlow, failed];
```

Add this describe (keep the parse/href describes):

```ts
describe("filterRuns", () => {
  it("filters by status", () => {
    expect(filterRuns(tests, summary, { status: "all", slow: false, ping: false })).toEqual(tests);
    expect(filterRuns(tests, summary, { status: "ok", slow: false, ping: false })).toEqual([
      okFast,
      okSlow,
    ]);
    expect(filterRuns(tests, summary, { status: "failed", slow: false, ping: false })).toEqual([
      failed,
    ]);
  });

  it("keeps downloads strictly below the range average", () => {
    expect(filterRuns(tests, summary, { status: "all", slow: true, ping: false })).toEqual([
      okSlow,
    ]);
    const atAvg = row({ id: 4, downloadMbps: 100 });
    expect(
      filterRuns([atAvg], summary, { status: "all", slow: true, ping: false }),
    ).toEqual([]);
  });

  it("keeps pings strictly above the range average", () => {
    expect(filterRuns(tests, summary, { status: "all", slow: false, ping: true })).toEqual([
      okSlow,
    ]);
  });

  it("combines filters with AND and ignores slow/high on failed rows", () => {
    expect(filterRuns(tests, summary, { status: "ok", slow: true, ping: true })).toEqual([
      okSlow,
    ]);
    expect(filterRuns(tests, summary, { status: "failed", slow: true, ping: false })).toEqual([]);
  });

  it("ignores slow and high ping when averages are null", () => {
    expect(
      filterRuns(tests, emptySummary, { status: "all", slow: true, ping: true }),
    ).toEqual(tests);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/runs.test.ts`

Expected: FAIL with `filterRuns is not a function` or `does not export filterRuns`.

- [ ] **Step 3: Write minimal implementation**

Add to `lib/runs.ts`:

```ts
import type { Range, SpeedTestRow } from "@/lib/types";
import type { Summary } from "@/lib/db";
```

(`Range` stays; add the two type imports.)

```ts
export function filterRuns(
  tests: SpeedTestRow[],
  summary: Summary,
  filters: RunFilters,
): SpeedTestRow[] {
  const slowActive = filters.slow && summary.download.avg !== null;
  const pingActive = filters.ping && summary.ping.avg !== null;
  const downAvg = summary.download.avg;
  const pingAvg = summary.ping.avg;

  return tests.filter((item) => {
    if (filters.status === "ok" && item.error !== null) return false;
    if (filters.status === "failed" && item.error === null) return false;
    if (slowActive) {
      if (item.error !== null || item.downloadMbps === null || downAvg === null) {
        return false;
      }
      if (!(item.downloadMbps < downAvg)) return false;
    }
    if (pingActive) {
      if (item.error !== null || item.pingMs === null || pingAvg === null) {
        return false;
      }
      if (!(item.pingMs > pingAvg)) return false;
    }
    return true;
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/runs.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/runs.ts lib/runs.test.ts
git commit -m "$(cat <<'EOF'
Filter history runs by status, slow download, and high ping.

EOF
)"
```

---

### Task 3: sortRuns

**Files:**
- Modify: `lib/runs.test.ts`
- Modify: `lib/runs.ts`

- [ ] **Step 1: Write the failing tests**

Import `sortRuns`. Add:

```ts
describe("sortRuns", () => {
  const a = row({
    id: 1,
    testedAt: "2026-08-13T10:00:00.000Z",
    downloadMbps: 80,
    pingMs: 30,
  });
  const b = row({
    id: 2,
    testedAt: "2026-08-13T12:00:00.000Z",
    downloadMbps: 40,
    pingMs: 10,
  });
  const cFailed = row({
    id: 3,
    testedAt: "2026-08-13T11:00:00.000Z",
    downloadMbps: null,
    pingMs: null,
    error: "timeout",
  });

  it("sorts newest and oldest by testedAt then id", () => {
    expect(sortRuns([a, b], "newest").map((item) => item.id)).toEqual([2, 1]);
    expect(sortRuns([b, a], "oldest").map((item) => item.id)).toEqual([1, 2]);
  });

  it("sorts slowest download with missing values last, then newest", () => {
    expect(sortRuns([a, b, cFailed], "slowest-down").map((item) => item.id)).toEqual([
      2, 1, 3,
    ]);
  });

  it("sorts highest ping with missing values last, then newest", () => {
    expect(sortRuns([a, b, cFailed], "highest-ping").map((item) => item.id)).toEqual([
      1, 2, 3,
    ]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/runs.test.ts`

Expected: FAIL with `sortRuns is not a function`.

- [ ] **Step 3: Write minimal implementation**

Add to `lib/runs.ts`:

```ts
function timeKey(item: SpeedTestRow): number {
  return new Date(item.testedAt).getTime();
}

export function sortRuns(tests: SpeedTestRow[], sort: RunSort): SpeedTestRow[] {
  const copy = [...tests];
  copy.sort((left, right) => {
    if (sort === "newest") {
      return timeKey(right) - timeKey(left) || right.id - left.id;
    }
    if (sort === "oldest") {
      return timeKey(left) - timeKey(right) || left.id - right.id;
    }
    if (sort === "slowest-down") {
      const leftMissing = left.downloadMbps === null;
      const rightMissing = right.downloadMbps === null;
      if (leftMissing !== rightMissing) return leftMissing ? 1 : -1;
      if (
        !leftMissing &&
        !rightMissing &&
        left.downloadMbps !== right.downloadMbps
      ) {
        return (left.downloadMbps as number) - (right.downloadMbps as number);
      }
      return timeKey(right) - timeKey(left) || right.id - left.id;
    }
    const leftMissing = left.pingMs === null;
    const rightMissing = right.pingMs === null;
    if (leftMissing !== rightMissing) return leftMissing ? 1 : -1;
    if (!leftMissing && !rightMissing && left.pingMs !== right.pingMs) {
      return (right.pingMs as number) - (left.pingMs as number);
    }
    return timeKey(right) - timeKey(left) || right.id - left.id;
  });
  return copy;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/runs.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/runs.ts lib/runs.test.ts
git commit -m "$(cat <<'EOF'
Sort history runs by time, slowest download, or highest ping.

EOF
)"
```

---

### Task 4: pageRuns

**Files:**
- Modify: `lib/runs.test.ts`
- Modify: `lib/runs.ts`

- [ ] **Step 1: Write the failing tests**

Import `PAGE_SIZE` and `pageRuns`. Add:

```ts
describe("pageRuns", () => {
  const many = Array.from({ length: 25 }, (_, index) =>
    row({ id: index + 1, testedAt: `2026-08-13T${String(index).padStart(2, "0")}:00:00.000Z` }),
  );

  it("uses pages of 24 and returns the remainder on the last page", () => {
    expect(PAGE_SIZE).toBe(24);
    const first = pageRuns(many, 1);
    expect(first.rows).toHaveLength(24);
    expect(first.rows[0]?.id).toBe(1);
    expect(first.total).toBe(25);
    expect(first.page).toBe(1);
    expect(first.pageCount).toBe(2);
    expect(first.from).toBe(1);
    expect(first.to).toBe(24);

    const second = pageRuns(many, 2);
    expect(second.rows).toHaveLength(1);
    expect(second.rows[0]?.id).toBe(25);
    expect(second.from).toBe(25);
    expect(second.to).toBe(25);
  });

  it("clamps page to the last page, or 1 when empty", () => {
    expect(pageRuns(many, 99).page).toBe(2);
    expect(pageRuns(many, 0).page).toBe(1);
    const empty = pageRuns([], 4);
    expect(empty).toEqual({
      rows: [],
      total: 0,
      page: 1,
      pageCount: 1,
      from: 0,
      to: 0,
    });
  });
});
```

Note: `padStart` on hour `24` is `"24"` which is an invalid ISO hour if length is 25 (ids 1-25, index 0-24). Use a safer timestamp:

```ts
const many = Array.from({ length: 25 }, (_, index) =>
  row({
    id: index + 1,
    testedAt: new Date(Date.UTC(2026, 7, 13, 0, index, 0)).toISOString(),
  }),
);
```

Use that `many` definition, not the hour-padded one.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/runs.test.ts`

Expected: FAIL with `pageRuns is not a function`.

- [ ] **Step 3: Write minimal implementation**

Add to `lib/runs.ts`:

```ts
export type RunPage = {
  rows: SpeedTestRow[];
  total: number;
  page: number;
  pageCount: number;
  from: number;
  to: number;
};

export function pageRuns(
  rows: SpeedTestRow[],
  page: number,
  pageSize = PAGE_SIZE,
): RunPage {
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
  const clamped =
    total === 0 ? 1 : Math.min(Math.max(page, 1), Math.ceil(total / pageSize));
  const start = (clamped - 1) * pageSize;
  const slice = rows.slice(start, start + pageSize);
  return {
    rows: slice,
    total,
    page: clamped,
    pageCount: total === 0 ? 1 : Math.ceil(total / pageSize),
    from: total === 0 ? 0 : start + 1,
    to: start + slice.length,
  };
}
```

(`pageCount` for empty is 1 so next/prev can disable against `page >= pageCount`.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/runs.test.ts`

Expected: PASS.

Then run: `npm test`

Expected: PASS (existing tests plus these).

- [ ] **Step 5: Commit**

```bash
git add lib/runs.ts lib/runs.test.ts
git commit -m "$(cat <<'EOF'
Page filtered history runs 24 at a time.

EOF
)"
```

---

### Task 5: RunCard

**Files:**
- Create: `app/components/run-card.tsx`
- Modify: none

No React test runner in this repo. Do not add one. Logic is already covered in `lib/runs.ts`.

- [ ] **Step 1: Create the card component**

Create `app/components/run-card.tsx`:

```tsx
import { formatMbps, formatMs, formatTime } from "@/app/components/stats";
import type { SpeedTestRow } from "@/lib/types";

function formatPercent(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

function detail(value: string | null): string {
  return value && value.length > 0 ? value : "—";
}

export function RunCard({ test }: { test: SpeedTestRow }) {
  const failed = test.error !== null;

  return (
    <article className="border border-hairline bg-panel px-4 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs text-muted">{formatTime(test.testedAt)}</p>
        {failed ? (
          <p className="text-[11px] uppercase tracking-[0.16em] text-fail">Failed</p>
        ) : null}
      </div>

      {failed ? (
        <p className="mt-3 text-sm leading-6 text-fail">{test.error}</p>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Down</p>
              <p className="mt-1 font-display text-3xl leading-none text-amber">
                {formatMbps(test.downloadMbps)}
                <span className="ml-1 font-mono text-xs tracking-normal text-muted">
                  Mbps
                </span>
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Up</p>
              <p className="mt-1 font-display text-3xl leading-none text-paper">
                {formatMbps(test.uploadMbps)}
                <span className="ml-1 font-mono text-xs tracking-normal text-muted">
                  Mbps
                </span>
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Ping</p>
              <p className="mt-1 font-display text-3xl leading-none text-paper">
                {formatMs(test.pingMs)}
                <span className="ml-1 font-mono text-xs tracking-normal text-muted">
                  ms
                </span>
              </p>
            </div>
          </div>
          <p className="mt-4 border-t border-hairline pt-3 text-xs leading-6 text-muted">
            Jitter {formatMs(test.jitterMs)} ms
            {" · "}
            Loss {formatPercent(test.packetLoss)}
            <br />
            {detail(test.serverLocation)}
            {" · "}
            {detail(test.serverName)}
            {" · "}
            {detail(test.isp)}
          </p>
        </>
      )}
    </article>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/run-card.tsx
git commit -m "$(cat <<'EOF'
Add a run card with primary Down, Up, and Ping.

EOF
)"
```

---

### Task 6: HistoryRuns, RangeTabs, and page

**Files:**
- Create: `app/components/history-runs.tsx`
- Modify: `app/components/stats.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Add HistoryRuns**

Create `app/components/history-runs.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RunCard } from "@/app/components/run-card";
import type { Summary } from "@/lib/db";
import {
  filterRuns,
  pageRuns,
  parseRunQuery,
  runHref,
  sortRuns,
  type RunQuery,
  type RunSort,
  type RunStatus,
} from "@/lib/runs";
import type { SpeedTestRow } from "@/lib/types";

const chip =
  "border px-3 py-1 text-[11px] uppercase tracking-[0.16em]";
const chipOn = `${chip} border-copper bg-copper text-ink`;
const chipOff = `${chip} border-hairline text-muted hover:border-copper hover:text-paper`;
const chipDisabled = `${chip} cursor-not-allowed border-hairline text-muted opacity-40`;

const SORTS: { value: RunSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "slowest-down", label: "Slowest down" },
  { value: "highest-ping", label: "Highest ping" },
];

function hrefWith(query: RunQuery, patch: Partial<RunQuery>): string {
  const next: RunQuery = { ...query, ...patch };
  return runHref(next);
}

export function HistoryRuns({
  tests,
  summary,
}: {
  tests: SpeedTestRow[];
  summary: Summary;
}) {
  const params = useSearchParams();
  const query = parseRunQuery({
    range: params.get("range") ?? undefined,
    status: params.get("status") ?? undefined,
    slow: params.get("slow") ?? undefined,
    ping: params.get("ping") ?? undefined,
    sort: params.get("sort") ?? undefined,
    page: params.get("page") ?? undefined,
  });

  const slowEnabled = summary.download.avg !== null;
  const pingEnabled = summary.ping.avg !== null;
  const filtered = filterRuns(tests, summary, {
    status: query.status,
    slow: query.slow,
    ping: query.ping,
  });
  const sorted = sortRuns(filtered, query.sort);
  const paged = pageRuns(sorted, query.page);

  function statusHref(status: RunStatus): string {
    return hrefWith(query, { status, page: 1 });
  }

  return (
    <section className="flex flex-col gap-4 border border-hairline bg-raised px-4 py-5 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="font-display text-2xl text-paper">Runs</h2>
          <p className="mt-1 text-xs text-muted">
            Each sample in this range. Slow down and high ping use this range average.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <nav aria-label="Run status" className="flex flex-wrap gap-1">
            <Link
              href={statusHref("all")}
              className={query.status === "all" ? chipOn : chipOff}
            >
              All
            </Link>
            <Link
              href={statusHref("ok")}
              className={query.status === "ok" ? chipOn : chipOff}
            >
              Ok
            </Link>
            <Link
              href={statusHref("failed")}
              className={query.status === "failed" ? chipOn : chipOff}
            >
              Failed
            </Link>
          </nav>
          <nav aria-label="Run problems" className="flex flex-wrap gap-1">
            {slowEnabled ? (
              <Link
                href={hrefWith(query, { slow: !query.slow, page: 1 })}
                className={query.slow ? chipOn : chipOff}
              >
                Slow down
              </Link>
            ) : (
              <span className={chipDisabled}>Slow down</span>
            )}
            {pingEnabled ? (
              <Link
                href={hrefWith(query, { ping: !query.ping, page: 1 })}
                className={query.ping ? chipOn : chipOff}
              >
                High ping
              </Link>
            ) : (
              <span className={chipDisabled}>High ping</span>
            )}
          </nav>
          <nav aria-label="Run sort" className="flex flex-wrap gap-1">
            {SORTS.map((item) => (
              <Link
                key={item.value}
                href={hrefWith(query, { sort: item.value, page: 1 })}
                className={query.sort === item.value ? chipOn : chipOff}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {paged.total === 0 ? (
        <div className="flex flex-col gap-3 border border-dashed border-hairline bg-panel px-4 py-6">
          <p className="text-sm text-muted">No runs match these filters.</p>
          <Link
            href={hrefWith(query, {
              status: "all",
              slow: false,
              ping: false,
              page: 1,
            })}
            className={chipOff}
          >
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {paged.rows.map((test) => (
            <RunCard key={test.id} test={test} />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-hairline pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          {paged.total === 0
            ? "0 of 0"
            : `${paged.from}-${paged.to} of ${paged.total}`}
        </p>
        <nav aria-label="Run pages" className="flex gap-1">
          {paged.page <= 1 ? (
            <span className={chipDisabled}>Prev</span>
          ) : (
            <Link
              href={hrefWith(query, { page: paged.page - 1 })}
              className={chipOff}
            >
              Prev
            </Link>
          )}
          {paged.page >= paged.pageCount ? (
            <span className={chipDisabled}>Next</span>
          ) : (
            <Link
              href={hrefWith(query, { page: paged.page + 1 })}
              className={chipOff}
            >
              Next
            </Link>
          )}
        </nav>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Update RangeTabs to preserve run params**

In `app/components/stats.tsx`:

Replace the `Range` import usage in `RangeTabs` with `RunQuery`. Add:

```ts
import { runHref, type RunQuery } from "@/lib/runs";
```

You can drop `import type { Range } from "@/lib/types"` if nothing else in this file needs it. `Range` is unused after this change, so remove that import.

Replace `RangeTabs`:

```tsx
export function RangeTabs({ query }: { query: RunQuery }) {
  return (
    <nav aria-label="History range" className="flex gap-1">
      {RANGES.map((value) => {
        const active = value === query.range;
        return (
          <Link
            key={value}
            href={runHref({ ...query, range: value, page: 1 })}
            className={`border px-3 py-1 text-[11px] uppercase tracking-[0.16em] ${
              active
                ? "border-copper bg-copper text-ink"
                : "border-hairline text-muted hover:border-copper hover:text-paper"
            }`}
          >
            {RANGE_LABELS[value]}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 3: Wire the page**

In `app/page.tsx`:

1. Add imports:

```ts
import { Suspense } from "react";
import { HistoryRuns } from "@/app/components/history-runs";
import { parseRunQuery } from "@/lib/runs";
```

Remove `parseRange` import if unused after switching to `parseRunQuery`.

2. Change `searchParams` typing and parsing:

```tsx
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string;
    status?: string;
    slow?: string;
    ping?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  await connection();
  const params = await searchParams;
  const query = parseRunQuery(params);
  const range = query.range;
  const data = loadDashboard(range);
```

3. Replace `<RangeTabs range={range} />` with `<RangeTabs query={query} />`.

4. After the History `</section>` (the chart block), before the page wrapper closes, render Runs only when this range has tests:

```tsx
      {data.tests.length > 0 ? (
        <Suspense
          fallback={
            <section className="border border-dashed border-hairline bg-panel px-6 py-10 text-sm text-muted">
              Loading runs…
            </section>
          }
        >
          <HistoryRuns tests={data.tests} summary={data.summary} />
        </Suspense>
      ) : null}
```

Keep `range` for `<SpeedChart tests={data.tests} range={range} />`.

- [ ] **Step 4: Run unit tests and lint**

Run: `npm test`

Expected: PASS.

Run: `npx tsc --noEmit`

Expected: no errors.

If `Range` import leftover or `parseRange` unused, delete them and re-run `tsc`.

- [ ] **Step 5: Manual check**

Run: `npm run dev`

Open `http://localhost:3000`. Confirm:

- History chart still there
- Runs section under it when samples exist
- Cards show Down / Up / Ping large, then jitter, loss, server, location, ISP
- Failed card shows the error
- Status / Slow down / High ping / sort chips update the URL
- Range tabs keep those chips and reset to page 1
- 25+ samples: pager shows `1-24 of N`, Next works
- Filters that match nothing show Clear filters
- Refresh keeps the filtered URL

- [ ] **Step 6: Commit**

```bash
git add app/components/history-runs.tsx app/components/stats.tsx app/page.tsx
git commit -m "$(cat <<'EOF'
Show filterable run cards under history.

EOF
)"
```

---

### Task 7: README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update the Dashboard section**

Replace the Dashboard paragraph with:

```md
## Dashboard

The page shows the latest download, upload, and ping, a 24-hour speed tape, a history chart (24h / 7d / 30d / all), and a Runs list of each sample in that range. Filter Runs by status, slow download, or high ping (relative to the range average). Sort newest, oldest, slowest download, or highest ping. Pages of 24. Failed tests are stored as error rows so gaps stay visible.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
Document the Runs history list on the dashboard.

EOF
)"
```

---

## Self-review

Spec coverage:

| Spec item | Task |
| --- | --- |
| Runs under History, chart unchanged | 6 |
| One card per test, primary Down/Up/Ping, all fields | 5 |
| Failed card shows error | 5 |
| Status / slow / high ping AND filters, relative to range avg | 2, 6 |
| Disable slow/high when avg is null; URL `slow=1` ignored | 2, 6 |
| Sort newest/oldest/slowest-down/highest-ping, failed last | 3, 6 |
| 24 per page, N-M of T, prev/next, clamp | 4, 6 |
| URL params, omit defaults, reset page on filter/sort | 1, 6 |
| Range tabs preserve filters, reset page | 6 |
| Hide Runs when range has no tests | 6 |
| Empty filters + clear | 6 |
| No new SQLite | all |
| Vitest for `lib/runs.ts` | 1-4 |
| README | 7 |

No TBD/TODO placeholders. Types (`RunQuery`, `RunStatus`, `RunSort`, `PAGE_SIZE`) are defined in Task 1 and reused later.
