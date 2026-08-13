# 24h tape day parts

**Status:** Approved design. Ready for an implementation plan.

**Date:** 2026-08-14

## Why this exists

The 24h tape already has one cell per local hour, but the axis only shows three clock numbers (start, middle, end). Those numbers do not tell you which stretch of the day you are looking at. The house needs to scan morning, noon, evening, night, and late night on that tape.

## Decision

Keep one bar per hour. Replace the three hour numbers with five day-part labels aligned under the hours they cover. Draw a hairline between adjacent sections. Hover on a bar still shows the hour and Mbps.

Do not tint the bars by section. Do not add gaps between sections. Do not change the History chart: on a 24h range it keeps clock times so a single sample stays readable.

## Approaches considered

### A. Section labels under the tape (chosen)

Same 24 bars. Labels sit under contiguous runs of hours. A hairline marks each section boundary. Lowest extra ink. The tape still reads as one continuous 24-hour strip.

### B. Tinted bands (rejected)

A wash per section would shout "zones," but five tints compete with copper (ok), fail, and hairline (empty).

### C. Gapped groups (rejected)

Extra space between sections groups the day more strongly, but it breaks the tape metaphor.

## Day parts

Hours are local, using the same `Date#getHours()` already used for tape cell labels. Each hour belongs to exactly one part. Ranges are half-open: start inclusive, end exclusive.

| Section | Local hours | Hour values |
| --- | --- | --- |
| Late night | 00–05 | 0, 1, 2, 3, 4 |
| Morning | 05–11 | 5, 6, 7, 8, 9, 10 |
| Noon | 11–15 | 11, 12, 13, 14 |
| Evening | 15–20 | 15, 16, 17, 18, 19 |
| Night | 20–24 | 20, 21, 22, 23 |

That is 5 + 6 + 4 + 5 + 4 = 24 hours.

Display names, in that vocabulary: `Late night`, `Morning`, `Noon`, `Evening`, `Night`.

## Rolling window

The tape is the last 24 hours ending at the current hour, not a calendar day from midnight. Labels follow the hours and wrap.

Example: at 00:07 the cells run from 01 yesterday through 00 now. Left to right that is Late night (01–04), Morning, Noon, Evening, Night, Late night (00). `Late night` appears twice because it is two contiguous chunks.

If a section is split across the left and right ends, render its name on each chunk. Do not merge wrapped chunks into one label. A one-hour leftover still gets its name.

Do not convert the tape to midnight-to-midnight. That would drop the "last 24 hours" meaning.

## Architecture

```
lib/tape.ts
  dayPartForHour(hour) -> DayPart
  groupTapeDayParts(cells) -> [{ part, startIndex, count }]
  buildSpeedTape (unchanged bucketing)

app/components/speed-tape.tsx
  bars unchanged
  axis row is one flex child per group, flex-grow = count
  hairline between groups
```

| Unit | Job | Depends on |
| --- | --- | --- |
| `dayPartForHour` | Map 0–23 to a day part | none |
| `groupTapeDayParts` | Collapse adjacent cells with the same part | `TapeCell.label` hours, `dayPartForHour` |
| `SpeedTape` | Draw bars plus the grouped axis | `groupTapeDayParts` |

`TapeCell.label` stays the padded hour string (`"00"` … `"23"`). Tooltips keep using it. Day parts are derived at render time from that hour, not stored on the cell.

`dayPartForHour` is only called with 0–23. `buildSpeedTape` only emits those hours. Tests only cover 0–23.

## UI

The track of 24 bars stays as it is (stretched `h-28` cells, copper / fail / hairline).

Under the bars, replace:

```
01                         12                         00
```

with a single row of section labels. Each label is centered in a flex slot whose width matches its hour count (`flex-grow: count`). Hairline on the left of every group after the first.

On a narrow phone, long names may wrap once (`Late night`). Do not hide labels. Do not switch back to hour numbers. `text-[10px] uppercase tracking-wider text-muted` matches the current axis.

No new glossary terms. Labels are plain text, not `TermTip`s.

## Out of scope

- History chart axis, tooltips, or reference bands
- 7d / 30d / all views
- Recoloring bars by time of day
- Changing how tests are stored or queried
- Calendar-day tape (midnight to midnight)

## Testing

Vitest, same style as `lib/tape.test.ts`.

Cover `dayPartForHour` for a value in each bucket and the boundaries 0, 4/5, 10/11, 14/15, 19/20, 23.

Cover `groupTapeDayParts`:

- A midnight-aligned 24-hour run yields five groups in order Late night, Morning, Noon, Evening, Night with counts 5, 6, 4, 5, 4.
- A tape ending at hour 00 (rolling wrap) yields six groups, with Late night on both ends.
- A single cell still produces one group.

`SpeedTape` render test: the axis lists day-part names (`Morning`, `Noon`, and the rest). It does not use only the first, middle, and last hour numbers. Bar hover titles still include the hour.

`SpeedChart` is unchanged. No chart test updates unless a file is touched for another reason.
