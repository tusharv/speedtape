# 24hr History as day-part weather

**Status:** Approved. Building.

**Date:** 2026-08-14

## Why this exists

The home page shows a 24hr History and a History chart. Both were the same line graph, so they did not give two overviews. The tape should be weather of the last 24 hours. History stays the analytical line chart.

## Jobs

| Block | Question it answers |
| --- | --- |
| 24hr History | How did each stretch of the last 24 hours feel? |
| History | What is the trend, with down / up / ping and a range you pick? |

History is unchanged: range tabs, min / avg / max, `SpeedChart` line graph.

## Tape UI

Headlines over one rolling strip. Left is 24 hours ago. Right is now.

Each contiguous day-part group (`groupTapeDayParts`) is a flex slot (`flex-grow: count`) with:

1. Day-part name (`Late night`, `Morning`, `Noon`, `Evening`, `Night`)
2. Average download for successful hours in that group (`formatMbps`)
3. One bar per hour in that group

Hairline between groups. Caption under the strip: `24h ago` on the left, `now` on the right.

Heading stays `24hr History`. Subtitle: `Avg download · one bar per hour`.

`SpeedTape` does not use `SpeedChart`.

## Data rules

Reuse `buildSpeedTape` (24 hourly cells, current hour on the right) and `groupTapeDayParts`.

`summarizeTapeGroups(cells)` maps each group to `{ part, startIndex, count, avgDownloadMbps, cells }`.

- Average uses successful hours only (`failed === false` and `downloadMbps !== null`).
- Empty hours and failed hours are not zeros.
- One successful hour → that number is the headline.
- No successful hours → `avgDownloadMbps` is `null` (dashboard empty glyph via `formatMbps`).
- Wrapped Late night is two groups with two averages. Do not merge.

`tapeBarMax(cells)` is the max successful download in the 24h window, or `0`.

Bar paint:

| Hour | Fill | Height |
| --- | --- | --- |
| Successful | copper, or amber if it is the rightmost (current) hour | `download / tapeBarMax`, minimum a visible stub |
| Failed | fail red | short tick, not on the speed scale |
| Empty | hairline | stub |

If `tapeBarMax` is 0, every hour is a stub / fail tick.

Hover `title`:

- success: `12: 40.0 Mbps`
- failed: `12: failed`
- empty: `12: no reading`

## Architecture

```
lib/tape.ts
  TapeCell, buildSpeedTape, dayPartForHour, groupTapeDayParts (unchanged)
  summarizeTapeGroups, tapeBarMax, tapeBarTitle, tapeBarHeightPct (new)
  tapeChartPoints removed (History has its own points)

app/components/speed-tape.tsx
  server component
  headlines + hour bars
  no SpeedChart
```

| Unit | Job |
| --- | --- |
| `summarizeTapeGroups` | Average and slice per contiguous day-part |
| `tapeBarMax` | Scale for bar heights |
| `tapeBarTitle` | Hover string |
| `tapeBarHeightPct` | 0-100 height; failed/empty are stubs |
| `SpeedTape` | Draw weather tape |

## Out of scope

- History chart, range tabs, min/avg/max
- Upload or ping in the tape headline
- Section background tints
- Calendar-day (midnight to midnight) tape

## Testing

Vitest.

`summarizeTapeGroups`: skips empty and failed; wrap at 00 yields two Late night averages; all-empty group → null avg.

`tapeBarMax`: ignores null and failed; 0 when none succeeded.

`SpeedTape` render: day-part names, average figures, hour titles, `24h ago` / `now`, no line-chart markup.
