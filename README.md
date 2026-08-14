# Speedtape

Hourly internet speed for the house. Results stay in SQLite on the Mac. A LaunchAgent runs the same test every hour even when the dashboard is closed.

## What you need

- macOS
- Node.js 20+
- Homebrew
- Official Ookla Speedtest CLI

```bash
brew tap teamookla/speedtest
brew install speedtest
```

The first CLI run may ask you to accept the license. The hourly agent passes `--accept-license` and `--accept-gdpr` so it can run unattended.

## Setup

```bash
npm install
npm run install-agent
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page, then Open dashboard, or go to [http://localhost:3000/app](http://localhost:3000/app). From another device on the same Wi-Fi use `http://<this-mac-lan-ip>:3000`. The dev server listens on all interfaces and allows private LAN origins so charts and **Run test now** work off-localhost.

## Hourly agent

```bash
npm run install-agent    # write LaunchAgent plist and load it
npm run uninstall-agent  # unload and remove the plist
npm run speedtest        # one-off test from the terminal
```

- Plist: `~/Library/LaunchAgents/com.speedtape.speedtest.plist`
- Logs: `~/Library/Logs/speedtape.out.log` and `.err.log`
- Database: `~/Library/Application Support/speedtape/speedtests.db`

If you already ran the old `home-network-checker` agent, the first dashboard open and `npm run install-agent` copy `speedtests.db` into the Speedtape folder. The old folder stays until you delete it after the history looks right.

If you move this project folder, run `npm run install-agent` again so the plist points at the new path.

Override the database path with `SPEEDTAPE_DB`.

The Mac must be **awake** for hourly tests. launchd will not run the test while the machine is fully asleep. Closing the browser is fine; the agent does not need the dashboard.

## Dashboard

`/app` shows the latest download, upload, and ping, a 24-hour speed tape, a history chart (24h / 7d / 30d / all), and a Runs list of each sample. Filter Runs by status, slow download, or high ping (relative to the range average). Sort newest, oldest, slowest download, or highest ping. Failed tests are stored as error rows so gaps stay visible.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Landing and dashboard on this Mac and the home LAN (`0.0.0.0:3000`) |
| `npm start` | Production server after `npm run build` |
| `npm test` | Unit tests |
| `npm run speedtest` | Run one test and save it |
| `npm run install-agent` | Start hourly collection |
| `npm run uninstall-agent` | Stop hourly collection |

## License

MIT
