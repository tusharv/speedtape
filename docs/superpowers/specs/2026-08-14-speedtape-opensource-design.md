# Speedtape open source

**Status:** Approved. Ready for implementation.

**Date:** 2026-08-14

## Why this exists

The app is a local hourly ISP meter on a Mac. The dashboard still says Home line. The repo is `home-network-checker`. There is no public front door. Other developers cannot tell what to clone, how to install the agent, or what license they have.

Ship it as **Speedtape**: a named open-source project with a landing page, MIT license, and a full identity rename, including on-disk paths, while keeping every existing speed sample.

## Decision

1. Public name **Speedtape**. Package `speedtape`. MIT license.
2. Landing at `/`. Meter at `/app`. Archive at `/app/runs`.
3. One developer visual language on landing and dashboard. Copper, Instrument Serif, and House circuit / Home line copy go away.
4. Rename LaunchAgent, logs, and Application Support. Copy the existing SQLite database (old data) into the new folder before writing new samples.

Do not publish to npm. Do not rename the GitHub repository in this work. Do not change tape, chart, or runs behavior except tokens, copy, and URLs.

## Approaches considered

### A. Display name only (rejected)

Keep `home-network-checker` on disk. Safer for this Mac, messy for new clones.

### B. Public Speedtape, keep old disk paths (rejected)

Chosen earlier as option 1. User chose full rename instead.

### C. Full rename plus migrate old SQLite (chosen)

New paths under `speedtape`. Copy `speedtests.db` (and WAL/SHM siblings if present) from the old folder. Unload the old agent so samples do not split.

## Architecture

```
/                    landing (no live DB)
/app                 current dashboard
/app/runs            archive
/app/runs/[id]       run detail

lib/site.ts          APP_NAME, GITHUB_URL, LICENSE
lib/paths.ts         new and legacy Application Support / log / plist names
lib/migrate.ts       copy old SQLite into the new folder
lib/db.ts            SPEEDTAPE_DB, default path speedtape/
lib/agent.ts         com.speedtape.speedtest
lib/launchd.ts       new log file names
```

| Unit | Job | Depends on |
| --- | --- | --- |
| `lib/site.ts` | Display name, GitHub URL, license label | none |
| `lib/paths.ts` | New and legacy filesystem locations | `os.homedir` |
| `lib/migrate.ts` | Copy old DB if new DB is missing; return what happened | `lib/paths.ts`, `fs` |
| `lib/db.ts` | Open SQLite at the new path after migrate | `lib/migrate.ts` |
| `scripts/install-agent.ts` | Migrate DB, unload old agent, write and load new plist | `lib/migrate.ts`, `lib/launchd.ts`, `lib/agent.ts` |
| `app/page.tsx` | Landing | `lib/site.ts`, sample tape cells, `SpeedTape` |
| `app/app/page.tsx` | Dashboard (today's `app/page.tsx`) | `loadDashboard` |
| `app/app/runs/*` | Archive (today's `app/runs/*`) | existing run components |

Root `app/layout.tsx` sets Geist, Geist Mono, metadata title Speedtape, and the shared color tokens. Landing and dashboard share that layout. Landing does not open SQLite.

## URLs

| Today | Speedtape |
| --- | --- |
| `/` dashboard | `/app` |
| `/?range=7d` | `/app?range=7d` |
| `/runs` | `/app/runs` |
| `/runs/12` | `/app/runs/12` |
| (none) | `/` landing |

`homeHref` returns `/app` or `/app?range=`. `archiveHref` returns `/app/runs`. `runDetailHref` returns `/app/runs/:id`. `runHref` (if kept) uses `/app`.

Redirects in `next.config.ts`:

- `/runs` -> `/app/runs` (query string kept)
- `/runs/:id` -> `/app/runs/:id`

If the landing request has a `range` search param, the landing server component redirects to `/app` with the same query. That covers old dashboard bookmarks like `/?range=7d`. A bookmark of exactly `/` shows the landing. Primary CTA is Open dashboard.

Site nav on meter pages: Dashboard / Runs, plus a text link to `/` labeled Speedtape. Landing nav: Speedtape wordmark, View on GitHub, Open dashboard. One label per intent: Open dashboard never becomes Get started.

## On-disk identity

| Kind | Today | Speedtape |
| --- | --- | --- |
| Application Support | `~/Library/Application Support/home-network-checker/speedtests.db` | `~/Library/Application Support/speedtape/speedtests.db` |
| LaunchAgent | `com.home-network-checker.speedtest` | `com.speedtape.speedtest` |
| Plist | `~/Library/LaunchAgents/com.home-network-checker.speedtest.plist` | `~/Library/LaunchAgents/com.speedtape.speedtest.plist` |
| Logs | `~/Library/Logs/home-network-checker.{out,err}.log` | `~/Library/Logs/speedtape.{out,err}.log` |
| DB override env | `HOME_NETWORK_CHECKER_DB` | `SPEEDTAPE_DB` |
| Plist template | `launchd/com.home-network-checker.speedtest.plist.template` | `launchd/com.speedtape.speedtest.plist.template` |
| npm package | `home-network-checker` | `speedtape` |

Keep `private: true`. This is an app people clone, not a library they install from npm.

`SPEEDTAPE_DB` skips filesystem migration and opens that file only. Tests keep using a temp path through this env var.

## Old data migration

Old data means the SQLite file with every hourly sample, not the logs.

`migrateLegacyDatabase(homeDir)` must run **before** `openDatabase` creates the new file. If the new file is created empty first, migrate will see it and skip, and the meter will look empty.

`prepareDatabasePath()` is the only entry used by `withDatabase` and `install-agent` for the default location:

1. If `SPEEDTAPE_DB` is set, return that path. Do not migrate.
2. Run `migrateLegacyDatabase`.
3. Return `defaultDbPath()`. Then `openDatabase` may create the schema.

`migrateLegacyDatabase(homeDir)`:

1. If the new db file already exists, do nothing. Do not overwrite new data with old data.
2. If the old db file is missing, do nothing.
3. Create `~/Library/Application Support/speedtape/` if needed.
4. Copy `speedtests.db`. If `speedtests.db-wal` or `speedtests.db-shm` exist next to it, copy those too.
5. Open both files, count `speed_tests` rows. If counts differ, delete the new copy (and copied WAL/SHM) and throw. The next launch can retry. The old file stays untouched.
6. Leave the old folder in place. README says it is safe to delete after the meter shows the same history.

Do not move. Do not delete the old database in code.

### Agent cutover

`install-agent`:

1. Run `prepareDatabasePath` so old samples are copied before the new agent writes.
2. Unload `com.home-network-checker.speedtest` if it is loaded.
3. Delete the old plist if it exists. Two LaunchAgents must not run at once, or samples split across two files.
4. Write and load `com.speedtape.speedtest`.

`uninstall-agent` unloads and removes the new plist, and also unloads/removes the legacy plist if it is still there. It never deletes SQLite files.

New samples always go to the new database after a successful copy. If copy has not run yet and there is no new file, migrate runs before the first open so the dashboard is not empty.

## Visual language

One theme for `/` and `/app`. Follow system light/dark. No mid-page theme flip.

| Token | Light | Dark |
| --- | --- | --- |
| Background | zinc-50 (`#fafafa`) | zinc-950 (`#09090b`) |
| Surface | white (`#ffffff`) | zinc-900 (`#18181b`) |
| Text | zinc-900 (`#18181b`) | zinc-100 (`#f4f4f5`) |
| Muted | zinc-500 | zinc-400 |
| Line | zinc-200 | zinc-800 |
| Accent / up / tape fill | teal-700 (`#0f766e`) | teal-400 (`#2dd4bf`) |
| Current hour on tape | teal-500 | teal-300 |
| Fail | red-700 / red-400 | same semantic red |

No copper. No Instrument Serif. No IBM Plex as the primary face.

Type: `Geist` and `Geist_Mono` from `next/font`. Display headings use Geist semibold, not a second family. Numbers stay Geist Mono.

Radius: 8px on panels, inputs, and buttons. No mixed radius scale.

Icons stay `@phosphor-icons/react`. Tape bars that used `bg-copper` / `bg-amber` use the teal tokens above. Empty hours use the line color. Failed hours use fail.

## Landing page (`/`)

Job: tell a developer they can run this on a home Mac, then send them to GitHub or `/app`.

Sections, in order:

1. Nav (wordmark Speedtape, View on GitHub, Open dashboard). Height under 80px. One row on desktop.
2. Hero. Headline: `Hourly internet speed for the house.` Subtext: `Clone it, install the hourly agent, watch download, upload, and ping from any device on the LAN.` CTAs: Open dashboard (primary), View on GitHub (secondary). No extra eyebrow, no scroll cue, no version label.
3. How it runs. The five commands from today's README: install Ookla CLI, `npm install`, `npm run install-agent`, `npm run dev`, open localhost. Not labeled Step 1 / Stage 1. Use the command as the label (Install CLI, Install agent, Start dashboard).
4. What you get. Local SQLite, hourly launchd agent while the Mac is awake, 24-hour tape, history chart, runs archive. Hero visual is the real `SpeedTape` component fed with fixed sample cells, captioned as a sample. No div-based fake dashboard.
5. Footer. MIT, View on GitHub, Open dashboard.

Copy rules: no em dashes, no en dashes as separators, no "House circuit", no "Home line". GitHub URL comes from `lib/site.ts` (`GITHUB_URL`). Set `GITHUB_URL` to `https://github.com/tusharvagela/home-network-checker`. When that GitHub repo is later renamed to speedtape, change that one constant.

Landing does not call `loadDashboard`. Sample tape data lives in `lib/landing-tape.ts` so the page stays static and does not depend on migrate.

## Dashboard (`/app`)

Keep the current structure: header, empty state, tape, latest stats, history chart, run-test, recent runs. Replace branding and tokens only.

Header title: Speedtape. Subtitle: the same meaning as today (download, upload, ping for this network; hourly samples stay on the Mac). Empty state still points at `npm run install-agent`. 404 uses Speedtape, not House circuit. Metadata title: Speedtape. Description: Hourly internet speed for the house.

## Open source files

- Add `LICENSE` (MIT, copyright year 2026, copyright holder Tushar Vagela).
- `package.json`: `"name": "speedtape"`, `"license": "MIT"`.
- Rewrite `README.md` as a clone-and-run guide under the Speedtape name. Document new disk paths, the one-time copy from `home-network-checker`, and that the old folder can be deleted after the history looks right. Document `SPEEDTAPE_DB`.
- Do not add CONTRIBUTING.md.

Renaming the GitHub repository itself is a manual follow-up. This work does not run `gh repo rename`.

## Error handling

- Migrate copy failure: throw a clear error that names both paths. Do not open an empty new database. Old file stays. Dashboard surfaces the error instead of "No readings yet".
- Row-count mismatch after copy: delete the incomplete new copy, throw, old file stays.
- `install-agent` migrate failure: do not write the new plist. Print the error. Old agent stays loaded so hourly collection does not stop.
- Unload of the old agent fails after a successful DB copy: still write and load the new agent, print a warning to remove `~/Library/LaunchAgents/com.home-network-checker.speedtest.plist` by hand. README says to run `npm run uninstall-agent` then `npm run install-agent` again if both agents appear loaded.
- Landing GitHub link: always use `GITHUB_URL`. If it 404s after a future repo rename, that is a one-line fix in `lib/site.ts`.

## Testing

Vitest, same style as `lib/db.test.ts` and `lib/launchd.test.ts`. Use temp home directories. Do not touch the real `~/Library`.

- `defaultDbPath` ends with `Application Support/speedtape/speedtests.db`.
- `resolveDbPath` reads `SPEEDTAPE_DB`.
- Migrate copies a legacy db into the new path and preserves row count.
- Migrate copies `-wal` / `-shm` when present.
- Migrate is a no-op when the new db already exists (even if legacy has more rows).
- Migrate is a no-op when legacy is missing.
- `homeHref("24h")` is `/app`. `archiveHref` starts with `/app/runs`. `runDetailHref(12)` is `/app/runs/12`.
- `AGENT_LABEL` is `com.speedtape.speedtest`.
- `writeAgentPlist` writes `Library/Logs/speedtape.out.log` under the fake home.
- `generatePlist` contains the new label.
- Landing sample tape helper returns 24 cells.
- `prepareDatabasePath` copies legacy data before any new empty `speedtests.db` is created.

No browser e2e in this spec. `npm test` must pass. `npm run build` must pass.

## Out of scope

- ESP32 / other hardware.
- npm publish.
- GitHub repository rename, topics, or social preview.
- Changing test interval, Ookla CLI flags, or SQLite schema.
- Adding auth. This stays a LAN home app.
- Rewriting tape grouping, chart downsample, or run filters.
