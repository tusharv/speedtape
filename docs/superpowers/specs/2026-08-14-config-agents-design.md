# Config page: add and remove agents

**Status:** Approved design. Ready for an implementation plan.

**Date:** 2026-08-14

## Why this exists

Speedtape collects samples with one LaunchAgent. Install and uninstall are CLI-only. The interval is hardcoded to 3600 seconds. The house cannot add a second cadence, pick clock times, or change the hourly job without editing a plist.

A Config page on the dashboard lets the house add and remove independent collectors on this Mac, and set each collector to an interval or to clock times.

## Decision

1. New page at `/app/config`, linked from site nav as Config.
2. Each schedule is its own LaunchAgent (`com.speedtape.speedtest.<id>`).
3. A schedule is either an interval (`StartInterval`) or clock times (`StartCalendarInterval`). Not both on one agent.
4. SQLite `schedules` is the list the page shows. Saving syncs the matching plist and `launchctl` load/unload.
5. All agents run `scripts/run-speedtest.ts` into the same `speed_tests` table.
6. Overlapping runs queue: a file lock in Application Support. The second caller waits, then runs. After 3 minutes waiting, it fails with a stable error.
7. No pause. No in-place edit. Change a time by removing the agent and adding another.
8. The unlabeled legacy agent `com.speedtape.speedtest` becomes a schedule named Hourly (every 60 minutes) on first Config open or `install-agent`.

Do not add remote machines, ESP32, Ookla flag controls, or a dispatcher that wakes every minute.

## Approaches considered

### A. One LaunchAgent per schedule (chosen)

Add and remove real macOS jobs. Interval maps to `StartInterval`. Clock times map to `StartCalendarInterval`. Tests still run with the dashboard closed. Queueing is a lock around `recordSpeedtest`.

### B. One dispatcher, schedules in the database (rejected)

A single 1-minute LaunchAgent would reimplement cron. Pause would be easier, but a dispatcher keeps running even with zero schedules. Does not match "add or remove agents."

### C. One plist rewritten on every save (rejected)

launchd cannot merge two different intervals into one `StartInterval` without over-firing or dropping times.

## Architecture

```
/app/config                 list + add form + remove
app/actions.ts              addAgent, removeAgent (and existing runTestNow)
lib/schedules.ts            CRUD, import legacy hourly, display lines
lib/launchd.ts              generate plist from a schedule (label, interval or calendar)
lib/agent.ts                list loaded labels, load/unload by label
lib/record.ts               file lock around collect + insert
lib/paths.ts                lock path, labeled plist path
scripts/install-agent.ts    import or create Hourly; resync all plists
scripts/uninstall-agent.ts  unload and delete every com.speedtape.speedtest*
```

| Unit | Job | Depends on |
| --- | --- | --- |
| `lib/schedules.ts` | Insert, list, delete schedule rows; import unlabeled hourly; format the one-line cadence | `lib/db.ts`, `lib/paths.ts` |
| `lib/launchd.ts` | Build plist XML for one schedule; write it | `lib/paths.ts` |
| `lib/agent.ts` | `launchctl` bootstrap/bootout/list for a label; `isAgentLoaded(label)` | `lib/paths.ts` |
| `lib/record.ts` | Acquire lock, run test, insert row, release lock | `lib/db.ts`, `lib/paths.ts` |
| Config page | Render list and form; call server actions | `lib/schedules.ts`, `lib/agent.ts` |
| `install-agent` / `uninstall-agent` | CLI sync of all agents | schedules, launchd, agent |

Source of truth for *what exists* is the `schedules` table. Source of truth for *whether it is running* is `launchctl list`. The page shows both: cadence from SQLite, loaded/not loaded from launchd.

## URLs and nav

| Route | Page |
| --- | --- |
| `/app` | Dashboard |
| `/app/runs` | Archive |
| `/app/config` | Config (new) |

`SiteNav` current values: `"home" | "runs" | "config"`. Add a Config tab using the same uppercase tracking tab style. Landing page nav is unchanged (no Config on `/`).

Dashboard header today: `Hourly agent: loaded | not installed`. Replace with a link to `/app/config`: `1 agent loaded`, `2 agents loaded`, or `No agents loaded` (fail color when zero). Count how many schedule labels are loaded, not a boolean on the unlabeled name.

Empty dashboard copy: point at Config (and still mention `npm run install-agent` as the CLI equivalent).

## Schedule records

New table created in `openDatabase` next to `speed_tests`:

```sql
CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('interval', 'clock')),
  interval_seconds INTEGER,
  times_json TEXT,
  weekdays_json TEXT,
  created_at TEXT NOT NULL
);
```

| Field | Interval row | Clock row |
| --- | --- | --- |
| `name` | trimmed, 1–40 characters | same |
| `kind` | `interval` | `clock` |
| `interval_seconds` | one of the preset values | `NULL` |
| `times_json` | `NULL` | JSON array of `"HH:MM"` 24-hour strings, at least one |
| `weekdays_json` | `NULL` | JSON array of launchd weekday integers 0–6 (Sunday–Saturday). All seven days means "every day" |
| `created_at` | ISO timestamp | same |

Duplicate names are allowed. `id` is the LaunchAgent suffix and never reused after delete (SQLite autoincrement).

### Interval presets (only these)

| Label | Seconds |
| --- | --- |
| 15 min | 900 |
| 30 min | 1800 |
| 1 hour | 3600 |
| 2 hours | 7200 |
| 6 hours | 21600 |
| 12 hours | 43200 |
| 24 hours | 86400 |

No custom second values.

### Clock times

Times are local to the Mac. Each time is hour 0–23 and minute 0–59, stored as `HH:MM` with zero-padded hour and minute (`"08:00"`, `"21:30"`). At least one time, at most 24. Order in the UI is the order the user added them; plist order is sorted by hour then minute.

Weekday chips default to all seven selected. If the user deselects all, treat as all seven (every day), do not save an empty list.

### Cadence line on the list

- Interval: `every 15 min`, `every 30 min`, `every 1 hour`, `every 2 hours`, `every 6 hours`, `every 12 hours`, `every 24 hours`
- Clock, every day: `18:00, 21:00 · every day`
- Clock, subset: `18:00 · Mon, Wed, Fri`

Loaded status is a separate fragment: `loaded` (up color) or `not loaded` (fail color).

## LaunchAgent plists

Label: `com.speedtape.speedtest.<id>`

Plist path: `~/Library/LaunchAgents/com.speedtape.speedtest.<id>.plist`

Program arguments, working directory, PATH, and log files stay as they are today (shared logs `speedtape.out.log` / `speedtape.err.log` are fine; do not create per-agent logs).

- Interval: `StartInterval` = `interval_seconds`. `RunAtLoad` true (same as today's hourly agent).
- Clock: `StartCalendarInterval` is an array of dicts. `RunAtLoad` false so adding an evening job does not fire a test immediately.

Calendar expansion:

- Every day, times T: one dict per time with `Hour` and `Minute` only.
- Subset of weekdays, times T: one dict per (weekday, time) pair with `Weekday`, `Hour`, `Minute`.

launchd `Weekday`: 0 Sunday, 1 Monday, 2 Tuesday, 3 Wednesday, 4 Thursday, 5 Friday, 6 Saturday.

`generatePlist` takes the label and either `{ intervalSeconds }` or `{ calendar: { weekday?: number, hour: number, minute: number }[] }`. It does not hardcode `com.speedtape.speedtest` or `3600`.

## Add and remove

**Add (server action `addAgent`):**

1. Validate: name 1–40 after trim; kind interval or clock; interval in the preset set; clock has 1–24 valid times; weekdays coerced to all seven if empty.
2. Insert the SQLite row. The new `id` is the label suffix.
3. Write the plist.
4. `launchctl bootstrap gui/<uid> <plist>`.
5. If bootstrap fails, delete the plist, delete the SQLite row, return the error to the form. The list is unchanged.

**Remove (server action `removeAgent`):**

1. `launchctl bootout` the label (ignore already-unloaded).
2. Delete the plist if it exists.
3. Delete the SQLite row.
4. Never delete `speed_tests` rows.

If bootout fails, still delete the plist and the row, and return a warning string so the user can check `launchctl list` by hand.

## Queue lock

Path: `~/Library/Application Support/speedtape/speedtest.lock` (honor `SPEEDTAPE_DB` by putting the lock next to that database file's directory when the env override is set; otherwise Application Support as above).

`recordSpeedtest` (used by the agent script and **Run test now**) acquires the lock, runs the Ookla test, inserts the row, then releases. Wait up to 180 seconds. If still blocked, do not run; insert an error row with message `another test is still running` (same shape as other failed tests) and return that row.

Dashboard `/app` already sets `maxDuration` to 60. Raise it to 240 so a queued **Run test now** can wait out the lock and still finish one Ookla run. Config does not run tests and does not need that budget.

## Legacy hourly import

The unlabeled label `com.speedtape.speedtest` and plist `~/Library/LaunchAgents/com.speedtape.speedtest.plist` are legacy.

`importLegacyHourlyIfNeeded()` runs from Config page load and from `install-agent`, after `prepareDatabasePath()`:

1. If that unlabeled plist exists or that label is loaded, and there is no `schedules` row yet:
   - Insert name `Hourly`, kind `interval`, 3600 seconds.
   - Write and load `com.speedtape.speedtest.<newId>`.
   - Unload and delete the unlabeled plist.
2. If `schedules` already has rows and the unlabeled agent is still present: unload and delete the unlabeled plist so two hourlies cannot run. Do not insert another Hourly.

`com.home-network-checker.speedtest` stays on the existing install-agent unload path. It is not a Config row.

## CLI

`npm run install-agent`:

1. `prepareDatabasePath`.
2. Unload/remove the home-network-checker legacy agent as today.
3. `importLegacyHourlyIfNeeded`.
4. If `schedules` is still empty, insert Hourly at 3600, write and load it.
5. If `schedules` already has rows, rewrite and reload every plist (project folder move).

`npm run uninstall-agent`:

- Unload and delete every plist whose label starts with `com.speedtape.speedtest` (labeled and unlabeled) plus `com.home-network-checker.speedtest`.
- Delete all `schedules` rows. Do not delete `speed_tests` or the database file.
- Config then shows no collectors. `install-agent` creates Hourly again.

Keep the npm script names. README documents Config as the UI and these commands as the CLI. The Hourly agent section explains multiple schedules, interval vs clock, and that two jobs queue instead of overlapping.

## Config page UI

Match existing dashboard chrome: `PageShell`, Geist, copper/teal tabs, hairline panels. No new color tokens.

Header: title `Config`. Subtext: `Add or remove collectors on this Mac. Each one runs a speed test on its own schedule.` Nav includes Config as the current tab.

**Agents on this Mac.** One row per schedule: name, cadence line plus loaded/not loaded, Remove. Empty: `No collectors yet` and the add form still shows.

**Add agent.** Label above inputs. Name field (not placeholder-as-label). Toggle: Interval (default) or Clock times. Interval: the seven presets, one selected (default 1 hour). Clock: list of times with add (`HH:MM`) and remove per time; weekday chips, all selected by default. Submit: `Add agent`. Pending: disable the button.

Errors: inline under the form for validation; a red banner for launchd failures, same fail-border treatment as a failed latest test on the dashboard.

`Run test now` stays on the dashboard, not on Config.

## Terms and copy

Update `TERMS.agent` to describe collectors on this Mac that run on a schedule even when the dashboard is closed, not "the hourly job" only.

## Errors

| Case | Behavior |
| --- | --- |
| Empty name / no interval / no clock times | Inline validation. No write. |
| launchd bootstrap fails | Rollback plist and row. Red banner with the command error text. |
| bootout fails on remove | Still delete plist and row. Warning on the page. |
| Plist missing, row remains | Row shows `not loaded`. Fix is Remove, then Add. |
| Overlap wait > 180s | Error row `another test is still running`. |
| `launchctl` unavailable (not the logged-in user) | Add/remove return that error. Page still lists SQLite rows. |

Mac asleep: launchd does not fire. Copy on Config, one line, same meaning as today's README. Do not add a wake-the-Mac feature.

## Tests

No real `launchctl` in unit tests. Inject or mock load/unload. Plist writes use a temp home directory as `launchd.test.ts` already does.

Cover:

- `generatePlist` interval: label suffix, `StartInterval` seconds, `RunAtLoad` true.
- `generatePlist` clock every day: array of Hour/Minute, no Weekday, `RunAtLoad` false.
- `generatePlist` clock subset: cartesian weekday × time.
- Schedule insert/list/delete in a temp DB.
- Cadence line formatting for the three cases above.
- Legacy import: unlabeled plist + empty schedules → Hourly row + labeled plist; unlabeled gone.
- Legacy import: schedules already present + unlabeled still there → unlabeled removed, no extra row.
- Lock: two overlapping `recordSpeedtest` calls serialize (second waits); with a held lock past timeout, error row is inserted.
- `install-agent` logic with zero schedules vs existing schedules (temp home, mocked launchctl).
- `SiteNav` includes Config; dashboard count copy helpers.

## Out of scope

- Pause without delete
- Edit name or time in place
- Per-agent log files
- Custom intervals other than the seven presets
- Remote or ESP32 agents
- Changing Ookla CLI flags
- Running tests while the Mac is asleep
