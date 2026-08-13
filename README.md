# Home Network Checker

Local internet speed tests for this house. Results are stored on the Mac and charted in a browser dashboard. A LaunchAgent runs the same test every hour even when the dashboard is closed.

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

Open [http://localhost:3000](http://localhost:3000) on this Mac, or `http://<this-mac-lan-ip>:3000` from a phone or other computer on the same Wi-Fi. The dev server listens on all interfaces and allows private LAN origins so charts and **Run test now** work off-localhost. Use **Run test now** for an immediate sample. The agent also runs a test when it is installed, then every 60 minutes.

## Hourly agent

```bash
npm run install-agent    # write LaunchAgent plist and load it
npm run uninstall-agent  # unload and remove the plist
npm run speedtest        # one-off test from the terminal
```

- Plist: `~/Library/LaunchAgents/com.home-network-checker.speedtest.plist`
- Logs: `~/Library/Logs/home-network-checker.out.log` and `.err.log`
- Database: `~/Library/Application Support/home-network-checker/speedtests.db`

If you move this project folder, run `npm run install-agent` again so the plist points at the new path.

The Mac must be **awake** for hourly tests. launchd will not run the test while the machine is fully asleep. Closing the browser is fine; the agent does not need the dashboard.

## Dashboard

The page shows the latest download, upload, and ping, a 24-hour speed tape, a history chart (24h / 7d / 30d / all), and a Runs list of each sample in that range. Filter Runs by status, slow download, or high ping (relative to the range average). Sort newest, oldest, slowest download, or highest ping. Pages of 24. Failed tests are stored as error rows so gaps stay visible.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dashboard on this Mac and the home LAN (`0.0.0.0:3000`) |
| `npm start` | Production dashboard after `npm run build` |
| `npm test` | Unit tests |
| `npm run speedtest` | Run one test and save it |
| `npm run install-agent` | Start hourly collection |
| `npm run uninstall-agent` | Stop hourly collection |
