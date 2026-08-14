# 24hr History Day Parts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 24hr History's three hour numbers with Morning, Noon, Evening, Night, and Late night labels aligned under the hours they cover.

**Architecture:** Pure helpers in `lib/tape.ts` map each hour to a day part and collapse adjacent cells into groups. `SpeedTape` keeps one bar per hour and renders one flex axis slot per group (`flex-grow` equals hour count) with a hairline between groups. The History chart is unchanged.

**Tech Stack:** TypeScript, React 19, Tailwind v4 (existing tokens), Vitest, `renderToStaticMarkup` for the tape component test.

**Spec:** `docs/superpowers/specs/2026-08-14-tape-day-parts-design.md`

---

## File map

| File | Responsibility |
| --- | --- |
| Modify: `lib/tape.ts` | `DayPart`, `DAY_PART_LABELS`, `dayPartForHour`, `groupTapeDayParts`; `buildSpeedTape` unchanged |
| Modify: `lib/tape.test.ts` | Tests for hour mapping and grouping, including wrap |
| Modify: `app/components/speed-tape.tsx` | Axis row from groups instead of first/middle/last hours |
| Modify: `app/components/speed-tape.test.tsx` | Axis lists day-part names; hover titles still include the hour |

Do not change `app/components/speed-chart.tsx`, SQLite, or glossary terms.

---

### Task 1: Map hour to day part

**Files:**
- Modify: `lib/tape.test.ts`
- Modify: `lib/tape.ts`

- [ ] **Step 1: Write the failing tests**

Add to `lib/tape.test.ts` (keep the existing `buildSpeedTape` test):

```ts
import { dayPartForHour } from "@/lib/tape";

describe("dayPartForHour", () => {
  it("maps each bucket and the boundaries", () => {
    expect(dayPartForHour(0)).toBe("late-night");
    expect(dayPartForHour(4)).toBe("late-night");
    expect(dayPartForHour(5)).toBe("morning");
    expect(dayPartForHour(8)).toBe("morning");
    expect(dayPartForHour(10)).toBe("morning");
    expect(dayPartForHour(11)).toBe("noon");
    expect(dayPartForHour(14)).toBe("noon");
    expect(dayPartForHour(15)).toBe("evening");
    expect(dayPartForHour(19)).toBe("evening");
    expect(dayPartForHour(20)).toBe("night");
    expect(dayPartForHour(23)).toBe("night");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/tape.test.ts`

Expected: FAIL with `dayPartForHour` is not exported / not a function.

- [ ] **Step 3: Write minimal implementation**

Add to `lib/tape.ts`:

```ts
export type DayPart =
  | "late-night"
  | "morning"
  | "noon"
  | "evening"
  | "night";

export const DAY_PART_LABELS: Record<DayPart, string> = {
  "late-night": "Late night",
  morning: "Morning",
  noon: "Noon",
  evening: "Evening",
  night: "Night",
};

export function dayPartForHour(hour: number): DayPart {
  if (hour < 5) return "late-night";
  if (hour < 11) return "morning";
  if (hour < 15) return "noon";
  if (hour < 20) return "evening";
  return "night";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/tape.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/tape.ts lib/tape.test.ts
git commit -m "Map local hours to morning, noon, evening, night, and late night."
```

If `lib/tape.ts` is still untracked as part of earlier work, include it. Do not add unrelated files.

---

### Task 2: Group adjacent tape cells by day part

**Files:**
- Modify: `lib/tape.test.ts`
- Modify: `lib/tape.ts`

- [ ] **Step 1: Write the failing tests**

Add a helper and tests to `lib/tape.test.ts`:

```ts
import { buildSpeedTape, groupTapeDayParts } from "@/lib/tape";
import type { TapeCell } from "@/lib/tape";

function cellsFromHours(hours: number[]): TapeCell[] {
  return hours.map((hour, index) => ({
    hourStart: index,
    label: String(hour).padStart(2, "0"),
    downloadMbps: null,
    failed: false,
  }));
}

describe("groupTapeDayParts", () => {
  it("groups a midnight-aligned day into five sections", () => {
    const hours = Array.from({ length: 24 }, (_, hour) => hour);
    const groups = groupTapeDayParts(cellsFromHours(hours));
    expect(groups.map((group) => [group.part, group.count])).toEqual([
      ["late-night", 5],
      ["morning", 6],
      ["noon", 4],
      ["evening", 5],
      ["night", 4],
    ]);
  });

  it("splits a wrapped late-night run when the tape ends at hour 00", () => {
    const now = new Date(2026, 7, 14, 0, 7, 0);
    const tape = buildSpeedTape([], now);
    const groups = groupTapeDayParts(tape);
    expect(tape[0]?.label).toBe("01");
    expect(tape[23]?.label).toBe("00");
    expect(groups.map((group) => [group.part, group.count])).toEqual([
      ["late-night", 4],
      ["morning", 6],
      ["noon", 4],
      ["evening", 5],
      ["night", 4],
      ["late-night", 1],
    ]);
  });

  it("returns one group for a single cell", () => {
    expect(groupTapeDayParts(cellsFromHours([12]))).toEqual([
      { part: "noon", startIndex: 0, count: 1 },
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/tape.test.ts`

Expected: FAIL with `groupTapeDayParts` is not exported / not a function.

- [ ] **Step 3: Write minimal implementation**

Add to `lib/tape.ts`:

```ts
export type TapeDayPartGroup = {
  part: DayPart;
  startIndex: number;
  count: number;
};

export function groupTapeDayParts(cells: TapeCell[]): TapeDayPartGroup[] {
  const groups: TapeDayPartGroup[] = [];
  for (let i = 0; i < cells.length; i += 1) {
    const hour = Number.parseInt(cells[i]!.label, 10);
    const part = dayPartForHour(hour);
    const last = groups[groups.length - 1];
    if (last && last.part === part) {
      last.count += 1;
    } else {
      groups.push({ part, startIndex: i, count: 1 });
    }
  }
  return groups;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/tape.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/tape.ts lib/tape.test.ts
git commit -m "Group 24hr History hours into contiguous day-part runs."
```

---

### Task 3: Render day-part labels on the tape axis

**Files:**
- Modify: `app/components/speed-tape.test.tsx`
- Modify: `app/components/speed-tape.tsx`

- [ ] **Step 1: Write the failing test**

Replace `app/components/speed-tape.test.tsx` contents with:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SpeedTape } from "@/app/components/speed-tape";
import type { TapeCell } from "@/lib/tape";

function cell(
  hourStart: number,
  label: string,
  downloadMbps: number | null,
): TapeCell {
  return { hourStart, label, downloadMbps, failed: false };
}

const noonCells: TapeCell[] = [
  cell(0, "12", 80),
  cell(1, "13", null),
];

describe("SpeedTape", () => {
  it("stretches hour cells to the track height so percentage bars can paint", () => {
    const html = renderToStaticMarkup(<SpeedTape cells={noonCells} />);

    expect(html).toContain("flex h-28 items-stretch gap-px");
    expect(html).toContain(
      "group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end",
    );
  });

  it("labels the axis with day parts instead of three hour numbers", () => {
    const hours = Array.from({ length: 24 }, (_, hour) =>
      cell(hour, String(hour).padStart(2, "0"), hour === 12 ? 40 : null),
    );
    const html = renderToStaticMarkup(<SpeedTape cells={hours} />);

    expect(html).toContain("Late night");
    expect(html).toContain("Morning");
    expect(html).toContain("Noon");
    expect(html).toContain("Evening");
    expect(html).toContain("Night");
    expect(html).toContain('title="12: 40.0 Mbps"');
    expect(html).not.toMatch(
      />01<\/span><span>12<\/span><span>00</,
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/components/speed-tape.test.tsx`

Expected: FAIL because the axis still renders first/middle/last hour labels, not `Morning`.

- [ ] **Step 3: Write minimal implementation**

In `app/components/speed-tape.tsx`, import `DAY_PART_LABELS` and `groupTapeDayParts`. Replace the three-number axis with:

```tsx
      <div className="mt-2 flex text-[10px] uppercase tracking-wider text-muted">
        {groupTapeDayParts(cells).map((group, index) => (
          <span
            key={`${group.part}-${group.startIndex}`}
            className={`min-w-0 text-center ${
              index > 0 ? "border-l border-hairline" : ""
            }`}
            style={{ flexGrow: group.count, flexBasis: 0 }}
          >
            {DAY_PART_LABELS[group.part]}
          </span>
        ))}
      </div>
```

Keep the bar track, hover titles, and heading as they are.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run`

Expected: all tests PASS, including `speed-tape.test.tsx` and `lib/tape.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add app/components/speed-tape.tsx app/components/speed-tape.test.tsx
git commit -m "Show morning through late night under the 24hr History."
```

---
