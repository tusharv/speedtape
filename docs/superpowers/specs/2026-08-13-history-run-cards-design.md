# History run cards

**Status:** Approved design. Ready for an implementation plan.

**Date:** 2026-08-13

## Why this exists

The dashboard already shows the latest Down / Up / Ping, a 24-hour speed tape, and a History block (range tabs, min/avg/max, chart). Individual hourly samples are stored in SQLite and loaded as `data.tests`, but they are not listed. The house needs a way to scan every run and narrow the list to failures, slow downloads, and high ping.

## Decision

Add a **Runs** section under History. One card per test. Filter, sort, and paginate the already-loaded range in the browser. Keep filter, sort, and page in the URL next to `range`.

Do not replace the chart. Do not add new SQLite queries for these controls.

## Approaches considered

### A. Filter, sort, and page in the browser (chosen)

`loadDashboard(range)` already returns every test in the selected range. A client component filters, sorts, and pages that array. Range averages for Slow down / High ping come from `data.summary`. URL search params keep the view across refresh.

Fits this house: 30 days is about 720 rows; a year is still small enough to send with the page.

### B. Query SQLite on every control change (rejected)

Each chip or page click would hit the server with `LIMIT 24`. Better for a huge public dataset. Extra query logic and slower chips. The range average still needs a separate query. Overkill here.

### C. Client filters as React state only (rejected)

Same as A, but the URL stays `?range=` only. Refresh or sharing a filtered view loses the filters.

## Architecture

The existing History block stays as-is: range tabs, min/avg/max, chart, run-test button.

A new Runs section sits under it and uses the same range.

```
Home (server)
  loadDashboard(range)
  History (unchanged)
  HistoryRuns (client)
    RunQueryProvider holds status, slow, ping, sort, page
    filter/sort/page write the URL without navigation
    filterRuns(tests, summary, filters)
    sortRuns(filtered, sort)
    pageRuns(sorted, page, 24)
    toolbar (selects + checkboxes) + RunCard grid + pager
```

| Unit | Job | Depends on |
| --- | --- | --- |
| `lib/runs.ts` | Pure filter, sort, page, and URL parse/serialize | `SpeedTestRow`, `Summary`, `Range` types |
| `app/components/history-runs.tsx` | Toolbar, grid, pager; writes search params | `lib/runs.ts`, `RunCard` |
| `app/components/run-card.tsx` | One test card | `SpeedTestRow` |
| `app/page.tsx` | Render Runs under History when the range has tests | `HistoryRuns`, `loadDashboard` |

Range tabs keep working. They change `range`, preserve filter/sort params, and reset `page` to 1. After filter/sort, `page` is also clamped if it is past the last page.

## URL

Next to the existing range param:

```
/?range=7d&status=ok&slow=1&ping=1&sort=newest&page=2
```

| Param | Values | Default |
| --- | --- | --- |
| `status` | `all` \| `ok` \| `failed` | `all` |
| `slow` | `1` present, anything else off | off |
| `ping` | `1` present, anything else off | off |
| `sort` | `newest` \| `oldest` \| `slowest-down` \| `highest-ping` | `newest` |
| `page` | integer `>= 1` | `1` |

Unknown values are ignored and treated as the default. Params at default are omitted from the href (`/?range=7d`, not `status=all&sort=newest&page=1`). Changing filter or sort resets `page` to 1. After filtering, if `page` is past the last page, clamp to the last page (or `1` when the filtered list is empty).

Filter, sort, and page updates stay on the client. They write the URL with `history.replaceState` so the list can change without a Next.js navigation or a dashboard reload. Range tabs still navigate, because a new range needs a new `loadDashboard` result. Range tab links read the live client query so they keep the current filters.

If `slow=1` but `summary.download.avg` is null, ignore Slow down (treat as off). Same for `ping=1` when `summary.ping.avg` is null.

Range tab links are built with a shared href helper so they preserve `status`, `slow`, `ping`, and `sort`, and reset `page`. A 24h view with Slow down on stays Slow down when switching to 7d.

## Card

Successful run:

- DOM `id` is `run-{id}` so a card can be targeted (`#run-42`)
- Visible run id as `#42`
- Phosphor icons on time, status, Down / Up / Ping, jitter, loss, server, and ISP
- Timestamp (same `formatTime` style as the rest of the page)
- Status chip: Ok
- Primary: Down, Up, Ping (large numbers, Mbps / ms)
- Secondary: jitter (ms), packet loss as a percent with one decimal (Ookla stores 0-100), server name, server location, ISP

Failed run:

- Same `id` and visible run id
- Timestamp and Failed chip
- Error text in place of the metrics
- No Down / Up / Ping / jitter / loss

Null metrics on an otherwise successful row render as an em dash, not `0`.

Grid: one column on a phone, two columns from `sm` up. Match existing tokens (ink, panel, hairline, copper, amber, fail). No new palette.

## Filters and sort

Filters combine with AND.

- **Status:** labeled select with icon. All / Ok / Failed. One active. Ok means `error === null`. Failed means `error !== null`.
- **Sort:** labeled select with icon. Newest / Oldest / Slowest download / Highest ping.
- **Slow down:** checkbox. `downloadMbps` is a number and is below `summary.download.avg`.
- **High ping:** checkbox. `pingMs` is a number and is above `summary.ping.avg`.

Slow down and High ping only match successful tests. Failed rows show when Status is All or Failed.

If the range has no successful tests (`summary.download.avg` or `summary.ping.avg` is null), disable the matching chip. It cannot be turned on.

Sort:

- **Newest** (default): `testedAt` descending, `id` descending as tie-break
- **Oldest:** `testedAt` ascending, `id` ascending
- **Slowest down:** `downloadMbps` ascending; failed and null download sink to the end, then newest among those
- **Highest ping:** `pingMs` descending; failed and null ping sink to the end, then newest among those

## Paging

24 cards per page. Show `N-M of T` plus prev/next. Prev disabled on page 1. Next disabled on the last page (including when `T === 0`).

Empty cases:

- Range has no tests: hide Runs. The existing “No readings yet” / empty chart path covers this.
- Range has tests, filters match none: show the toolbar, a short line that no runs match, and a control that clears `status`, `slow`, `ping` (back to All, chips off) and resets `page` to 1. Sort is left as-is.

## Data flow

The server page still calls `loadDashboard(range)` and passes `tests` and `summary` into `HistoryRuns`. Filter, sort, and page never open SQLite again.

Averages for Slow down / High ping are the same numbers already shown as min/avg/max in History.

## Out of scope

- Replacing or removing the chart
- New database queries, indexes, or columns
- Share / delete actions on a run
- Typed Mbps / ms cutoffs (thresholds stay relative to the range average)
- Server-side pagination
- Device type icons (this house is one Mac agent)

## Testing

Vitest, same style as `lib/range.test.ts` and `lib/tape.test.ts`. Cover `lib/runs.ts`:

- Status all / ok / failed
- Slow down and high ping against a known average
- AND combinations (ok + slow, failed ignores slow)
- Sort newest / oldest / slowest-down / highest-ping, including failed rows at the end of metric sorts
- Page size 24, last page remainder, clamp when filters shrink the list
- URL parse defaults and unknown values ignored
- Disabled slow/high when averages are null

## Success

From the dashboard, a person can open Runs, see every sample in the current range 24 at a time, filter to failed / slow / high-ping problems, sort those ways, and keep that view after refresh.
