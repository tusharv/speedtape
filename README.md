# Speedtape

Internet speed for the house. Results stay in SQLite on this computer. Collectors run the same test on the schedules you set, even when the dashboard is closed.

## What you need

- macOS or Windows
- Node.js 20+
- Official Ookla Speedtest CLI

### macOS

Homebrew, then:

```bash
brew tap teamookla/speedtest
brew install speedtest
```

### Windows

[Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) so `npm install` can compile `better-sqlite3`, then:

```powershell
winget install -e --id Ookla.Speedtest.CLI
```

The first CLI run may ask you to accept the license. Collectors pass `--accept-license` and `--accept-gdpr` so they can run unattended.

## Setup

```bash
npm install
npm run install-agent
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page, then Open dashboard, or go to [http://localhost:3000/app](http://localhost:3000/app). From another device on the same Wi-Fi use `http://<this-computer-lan-ip>:3000`. The dev server listens on all interfaces and allows private LAN origins so charts and **Run test now** work off-localhost.

## Collectors

Open [http://localhost:3000/app/config](http://localhost:3000/app/config) to add or remove agents and set each one to an interval (15 minutes through 24 hours) or to clock times. You can also use the CLI:

```bash
npm run install-agent    # create Hourly (every 60 minutes) if none exist, or rewrite every collector
npm run uninstall-agent  # unload every Speedtape collector and clear schedules
npm run speedtest        # one-off test from the terminal
```

macOS:

- Plists: `~/Library/LaunchAgents/com.speedtape.speedtest.<id>.plist`
- Login Items app: `~/Library/Application Support/speedtape/Speedtape.app` (name and icon in System Settings)
- Logs: `~/Library/Logs/speedtape.out.log` and `.err.log`
- Database: `~/Library/Application Support/speedtape/speedtests.db`

Windows:

- Tasks: `Speedtape.speedtest.<id>` in Task Scheduler
- Logs and database: `%APPDATA%\speedtape\`

If two schedules fire at once, the second waits until the first test finishes.

If you already ran the old `home-network-checker` agent on a Mac, the first dashboard open and `npm run install-agent` copy `speedtests.db` into the Speedtape folder. The old unlabeled `com.speedtape.speedtest` job becomes a schedule named Hourly.

If you move this project folder, run `npm run install-agent` again so every collector points at the new path.

Override the database path with `SPEEDTAPE_DB`.

The computer must be **awake** for scheduled tests. Sleeping skips the job. Closing the browser is fine; the agents do not need the dashboard.

## Dashboard

`/app` shows the latest download, upload, and ping, a 24-hour speed tape, a history chart (24h / 7d / 30d / all), and a Runs list of each sample. `/app/runs` is the archive: pick start and end days, or a 24h / 7d / 30d window, then filter by status, slow download, or high ping, and Save CSV for that window. `/app/config` adds and removes collectors. Sort newest, oldest, slowest download, or highest ping. Failed tests are stored as error rows so gaps stay visible. Open a failed run to see when the line went down and when it came back.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Landing and dashboard on this computer and the home LAN (`0.0.0.0:3000`) |
| `npm start` | Production server after `npm run build` |
| `npm test` | Unit tests, listing each pass |
| `npm run speedtest` | Run one test and save it |
| `npm run install-agent` | Create Hourly if needed, or rewrite every collector |
| `npm run uninstall-agent` | Stop every Speedtape collector |

## License

MIT
