# Speedtape

Internet speed for the house. Results stay in SQLite on the Mac. LaunchAgents run the same test on the schedules you set, even when the dashboard is closed.

## What you need

- macOS
- Node.js 20+
- Homebrew
- Official Ookla Speedtest CLI

```bash
brew tap teamookla/speedtest
brew install speedtest
```

The first CLI run may ask you to accept the license. Collectors pass `--accept-license` and `--accept-gdpr` so they can run unattended.

## Setup

```bash
npm install
npm run install-agent
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page, then Open dashboard, or go to [http://localhost:3000/app](http://localhost:3000/app). From another device on the same Wi-Fi use `http://<this-mac-lan-ip>:3000`. The dev server listens on all interfaces and allows private LAN origins so charts and **Run test now** work off-localhost.

## Collectors

Open [http://localhost:3000/app/config](http://localhost:3000/app/config) to add or remove agents and set each one to an interval (15 minutes through 24 hours) or to clock times. You can also use the CLI:

```bash
npm run install-agent    # create Hourly (every 60 minutes) if none exist, or rewrite every plist
npm run uninstall-agent  # unload every Speedtape collector and clear schedules
npm run speedtest        # one-off test from the terminal
```

- Plists: `~/Library/LaunchAgents/com.speedtape.speedtest.<id>.plist`
- Logs: `~/Library/Logs/speedtape.out.log` and `.err.log`
- Database: `~/Library/Application Support/speedtape/speedtests.db`

If two schedules fire at once, the second waits until the first test finishes.

If you already ran the old `home-network-checker` agent, the first dashboard open and `npm run install-agent` copy `speedtests.db` into the Speedtape folder. The old unlabeled `com.speedtape.speedtest` job becomes a schedule named Hourly.

If you move this project folder, run `npm run install-agent` again so every plist points at the new path.

Override the database path with `SPEEDTAPE_DB`.

The Mac must be **awake** for scheduled tests. launchd will not run the test while the machine is fully asleep. Closing the browser is fine; the agents do not need the dashboard.

## Dashboard

`/app` shows the latest download, upload, and ping, a 24-hour speed tape, a history chart (24h / 7d / 30d / all), and a Runs list of each sample. `/app/config` adds and removes collectors. Filter Runs by status, slow download, or high ping (relative to the range average). Sort newest, oldest, slowest download, or highest ping. Failed tests are stored as error rows so gaps stay visible.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Landing and dashboard on this Mac and the home LAN (`0.0.0.0:3000`) |
| `npm start` | Production server after `npm run build` |
| `npm test` | Unit tests |
| `npm run speedtest` | Run one test and save it |
| `npm run install-agent` | Create Hourly if needed, or rewrite every collector plist |
| `npm run uninstall-agent` | Stop every Speedtape collector |

## License

MIT
