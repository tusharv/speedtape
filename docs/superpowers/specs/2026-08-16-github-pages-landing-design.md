# GitHub Pages landing

**Status:** Approved. Implemented.

**Date:** 2026-08-16

## Why this exists

The Next.js app already has a landing at `/` for people who run Speedtape locally. That page’s primary action is Open dashboard. GitHub Pages cannot open the dashboard or SQLite.

The public repo needs a static front door that developers can open without cloning first: what Speedtape is, why it is worth trying (privacy first, zero cost, background collector), and how to clone and install.

## Decision

1. Ship a **new marketing page**, not a restyle of the in-app landing.
2. Visual language: **fax tape** (blue-white printout, monospace, one fail-red accent).
3. Layout: **desk split** hero (printout left, copy right), then distinct sections below.
4. Host as **static files in `site/`** on `main`. A GitHub Action publishes that folder to Pages. `docs/` stays for specs (`docs/superpowers/`) and is not the public site.
5. Do not change the Next.js app, routes, or in-app landing.

Live URL after Pages is enabled: `https://tusharv.github.io/speedtape/`

GitHub Pages from a branch can only serve `/` (repo root) or `/docs`. Root would expose the Next.js tree. `/docs` would also publish `docs/superpowers/`. So the landing lives in `site/` and Actions deploys that folder.

## Approaches considered

### A. Static site in `site/` plus Pages Action (chosen)

Self-contained HTML, CSS, and a small script in `site/`. Workflow uploads `site/` as the Pages artifact. Specs stay in `docs/superpowers/`. No Next build. Relative asset paths.

### B. Static site in `docs/` (rejected)

GitHub’s built-in `/docs` source. Would publish `docs/superpowers/` next to the landing.

### C. Next.js static export (rejected)

Conflicts with SQLite, server actions, and the dashboard. Extra machinery for a page that does not need a server.

### D. Separate `gh-pages` branch (rejected)

Same HTML as A, a second branch to keep in sync. Actions from `main` is enough.

## Architecture

```
site/index.html                    public landing
site/styles.css                    tokens, layout, dark mode
site/tape.js                       sample tape, copy-to-clipboard, OS toggle
site/fonts/                        self-hosted IBM Plex Mono (woff2)
.github/workflows/pages.yml        deploy site/ to GitHub Pages
```

| Unit | Job | Depends on |
|---|---|---|
| `site/index.html` | Markup, copy, semantic structure | `styles.css`, `tape.js` |
| `site/styles.css` | Fax-tape tokens, desk split, dark mode, reduced motion | fonts |
| `site/tape.js` | Sample 24h bars, copy clone, copy commands, Mac/Windows | none |
| `site/fonts/` | IBM Plex Mono woff2, `@font-face` in CSS | none |
| `.github/workflows/pages.yml` | On push to `main` (paths `site/**` and the workflow), upload `site/` and deploy Pages | `actions/upload-pages-artifact`, `actions/deploy-pages` |

No SQLite. No Next. No build step. Asset hrefs are relative (`styles.css`, not `/styles.css`) so the project site works under `/speedtape/`.

After merge, enable GitHub Pages: Settings → Pages → Source → GitHub Actions.

## Visual

**Reading this as:** public OSS landing for developers, fax-tape language, native CSS (no design system package).

Dials: variance 7, motion 4, density 4.

| Token | Light | Dark (`prefers-color-scheme: dark`) |
|---|---|---|
| Desk | `#d5dde6` | `#121820` |
| Printout | `#f7f9fc` | `#1a2433` |
| Ink | `#1a2433` | `#e7edf4` |
| Mute | `#5b6b7e` | `#8b97a8` |
| Hairline | `#8b97a8` | `#3a4656` |
| Fail | `#c43c2c` | `#e05645` |

- Type: IBM Plex Mono for the whole page, self-hosted, `font-display: swap`. No Google Fonts link.
- Shape: radius 0 everywhere (buttons, printout, fact boxes).
- One accent: fail red. Ink fills primary CTAs.
- Theme: system preference only. No toggle. The whole page stays one theme (no inverted mid-page section except the dark “close the browser” band, which is a single ink block on the desk, not a theme flip).
- Motion: tape bars rise once on load (`transform` only). Disabled under `prefers-reduced-motion`.
- Hero: `min-h-[100dvh]` is not required; the desk split must fit the first viewport with CTA visible. Top padding capped so the split does not float.

## Page composition

Four layout families, used once each:

1. **Hero, desk split.** Left: printout with 24-hour sample tape. Right: audience, headline, subtext, CTAs.
2. **Ink band.** Full-width printout-inverse block: dashboard can stay closed.
3. **Command list.** Mac / Windows toggle, click-to-copy rows.
4. **Two-column steps** (ISP), then **four boxed facts**, then footer strip.

Nav is one line: Speedtape wordmark left, View on GitHub right. Height under 80px. Reuse the existing three-bar mark as a tiny ink-colored inline SVG (same geometry as `BrandMark` in the app), not a new illustration.

No Open dashboard. No live data.

## Copy (locked)

Audience label: `For developers`

Headline: `Know your line.`

Hero subtext: `Privacy first. Zero cost. Clone it and the collector runs in the background.`

Primary CTA (nav, hero, footer): `View on GitHub` → `https://github.com/tusharv/speedtape`

Secondary CTA: `Copy clone` copies `git clone https://github.com/tusharv/speedtape.git`

Ink band title: `No account. No cloud. Close the browser.`

Ink band body: `Samples stay in SQLite on this computer. The agent keeps testing while you work. Localhost is only for reports, not for the collector to live.`

Commands heading: `Try it on this machine`

Commands helper: `Click a row to copy.`

Commands (macOS):

- Install CLI: `brew tap teamookla/speedtest && brew install speedtest`
- Install dependencies: `npm install`
- Install agent: `npm run install-agent`
- Start dashboard: `npm run dev` with helper text that this is only for reports

Commands (Windows):

- Install CLI: `winget install -e --id Ookla.Speedtest.CLI`
- Same npm rows
- Note: Visual Studio C++ Build Tools are required so npm can compile better-sqlite3.

ISP heading: `Take a week of samples to your ISP`

- Baseline the day. Peak and quiet hours, on a schedule.
- Keep testing. A ticket wants a week, not one screenshot.
- Export CSV. Attach the house record.
- Mark the outage. Failed hours stay on the tape.

Facts:

- Privacy first. Nothing leaves this computer.
- Zero cost. MIT. No plan. No meter.
- Background job. Localhost stays off.
- Failed runs stay. Gaps stay visible.

Footer: `Speedtape` `MIT` `For developers` and `GitHub`.

No em-dashes anywhere in visible copy.

## Tape

Reuse the in-app sample series from `lib/landing-tape.ts` (download values, hour 18 failed). Label the printout `24 hour signal` and `Sample`. Hover or keyboard focus on a bar reads the hour. One red bar for the failed hour.

## Behavior

- Copy uses `navigator.clipboard.writeText`. Success: button or row says `Copied` for about 1.8s. Failure: `Couldn’t copy`.
- Mac / Windows toggle is a segmented control. Default from `navigator.userAgent` (`windows` → Windows, else Mac). Switching updates the CLI row and the build-tools note.
- Focus rings: 2px ink (or printout on the ink band), offset 2px.
- Images: none besides the CSS tape bars. No fake dashboard screenshot.

## Out of scope

- Next.js `output: 'export'`
- Dashboard, SQLite, or LAN URLs on the public page
- npm publish
- Cookie banner, analytics, version footer
- Manual theme toggle
- Changing `app/page.tsx`

## Test plan

Static HTML has no Vitest harness. Check by hand and with a local static server:

1. Open `site/index.html` via `npx serve site` (or equivalent), not as a `file://` page, so clipboard works.
2. Hero fits the first viewport on a 1280px window. CTA visible without scroll.
3. Copy clone and one command row each copy the right string.
4. Mac / Windows toggle swaps the CLI command and shows the Windows build-tools note only on Windows.
5. Tape has 24 bars, one failed (red). Focus a bar, readout updates.
6. `prefers-color-scheme: dark` inverts desk and printout, not a random mid-page light section.
7. `prefers-reduced-motion: reduce` stops bar-rise.
8. Asset URLs are relative. A subpath like `/speedtape/` still loads CSS, JS, and fonts.
9. Lighthouse-style pass: contrast AA on body and buttons, no layout jump from fonts (`font-display: swap` plus fallback metrics).

## README

Add one line under Setup (or a short Public site blurb): the public page lives in `site/` and is served at `https://tusharv.github.io/speedtape/` after Pages source is set to GitHub Actions. Do not replace the local landing instructions. Do not use `docs/` for the public site.
