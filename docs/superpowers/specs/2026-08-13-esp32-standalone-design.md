# ESP32 standalone home network checker

**Status:** Future plan. Do not implement until this spec is picked up on purpose.

**Date:** 2026-08-13

**Hardware:** ESP32-S3N16R8 (16 MB flash, 8 MB PSRAM)

## Why this exists

The current app is a Next.js dashboard on a Mac. A LaunchAgent runs Ookla `speedtest` every hour and writes SQLite at `~/Library/Application Support/home-network-checker/speedtests.db`. Hourly samples only happen while the Mac is awake.

The ESP32 is meant to be the always-on box for this house: plug it in, leave it on the LAN, browse to it from a phone. It replaces the Mac for collection and viewing. It does not replace Ookla-grade Mbps numbers.

## Decision

**Standalone device.** The ESP32 joins home Wi-Fi, runs its own tests on a timer, stores history on flash, and serves a small local web page. No Mac, no Next.js runtime, no launchd, no posting results to this repo’s dashboard.

This repo’s Mac app stays as it is until someone later chooses to retire it.

## What will not move

These cannot run on the ESP32 and are out of scope:

- Next.js, Node, React, Recharts
- Official Ookla Speedtest CLI
- `better-sqlite3` / the Mac SQLite file
- launchd / `npm run install-agent`

A “port” of `app/page.tsx` is the wrong shape. The device gets a new firmware project with the same *job* (sample the house line, show latest + history), not the same stack.

## Approaches considered

### 1. ESP32 as probe, Mac still hosts the dashboard (rejected)

ESP32 measures and HTTP POSTs into the existing Next.js app. Least new UI work, but the Mac must stay on for history and charts. User chose standalone instead.

### 2. Probe plus a local screen (not chosen)

Same firmware as standalone, plus an OLED/TFT for the latest numbers. This board may not have a screen. Add only if hardware with a display shows up later.

### 3. Standalone ESP32 (chosen)

Device owns Wi-Fi join, measurement, storage, and a tiny web UI. Recommended when the Mac sleeping is the problem and the dashboard does not need to live on the Mac.

**Firmware stack for (3):**

| Stack | Trade-off |
| --- | --- |
| **PlatformIO + Arduino (recommended)** | Fastest path: `WiFi`, NTP, LittleFS, a small HTTP server, OTA later. Fits this board. |
| ESP-IDF | More control, more boilerplate. Use only if Arduino libraries block something real. |
| MicroPython | Easy to tinker, weaker as a long-running appliance (RAM, packaging, OTA). |

Live in this repo as `firmware/` so the Mac dashboard and the device plan stay in one place. Do not mix firmware into `app/` or `lib/`.

## Architecture (when built)

```
phone / laptop on LAN
        |
        v
  ESP32-S3 HTTP :80
        |
        +-- GET /            latest stats + 24hr History + history
        +-- POST /test       run one sample now
        +-- GET /api/tests   JSON history
        |
        +-- scheduler        every 60 minutes (same cadence as the Mac agent)
        +-- measurer         HTTP download + ping (+ RSSI)
        +-- store            LittleFS ring of records
        +-- wifi             STA on home SSID; SoftAP portal on first boot
        +-- NTP              timestamps in UTC ISO-8601
```

**First-run:** If no SSID is saved, start a SoftAP (for example `home-line-setup`) and a captive portal. Save credentials in NVS. After join, serve the dashboard on the LAN IP and, if practical, `http://homeline.local` via mDNS.

**Power:** USB always plugged in. No deep-sleep duty cycle in v1; sleep would skip tests the same way a sleeping Mac does.

## Measurement

Ookla will not run here. Numbers will not match the Mac dashboard. Treat them as a house health signal, and label the UI so nobody compares them to an ISP speed-test screenshot.

**Default for v1 (recommended; not yet confirmed in chat):**

- **Download Mbps** — timed HTTPS GET of a fixed-size payload from a known URL (Cloudflare or a similar public speed endpoint). Record error rows if DNS, TLS, or the transfer fails.
- **Ping ms** — ICMP to `1.1.1.1` or TCP connect time if ICMP is awkward. Store one latency number; jitter/packet loss can wait.
- **Wi-Fi RSSI** — dBm at sample time, so a slow hour can be “radio” vs “upstream.”

**Deferred:**

- **Upload** — needs an endpoint that accepts a POST. Add only with a concrete URL (public or a box on the LAN). Until then `uploadMbps` stays null.
- ISP name / Ookla server fields — not available. Omit or leave null.

Failed tests are stored as error rows so gaps stay visible, same idea as `lib/speedtest.ts` `errorRecord()`.

**Interval:** 60 minutes, plus a **Run test now** control on the page. Do not overlap tests; ignore or queue a second request while one is running.

## Data

Keep the Mac record shape where it still makes sense, so a later export could be compared or imported:

```
id
testedAt          ISO-8601 UTC
downloadMbps      number | null
uploadMbps        number | null   // null in v1
pingMs            number | null
rssiDbm           number | null   // ESP32-only
error             string | null
```

Do not use SQLite on device for v1. Append a binary or JSONL ring on LittleFS (target: at least 30 days of hourly samples, ~720 rows; 16 MB flash is plenty). Oldest rows drop when full.

JSON from `GET /api/tests` should be easy to copy off the device.

## Web UI

A static page from LittleFS, small enough to load on a phone on the LAN. Inspired by the current dashboard, not a pixel port:

- Latest down / ping (and RSSI)
- Last-test time and a clear “not Ookla” note
- Failed last test shown as an error banner
- 24-hour tape of hourly cells (reuse the idea in `lib/tape.ts`, implemented in firmware JS or precomputed JSON)
- History: last 24h / 7d / 30d with min/avg/max for successful rows
- Run test now
- A settings path to change Wi-Fi without reflashing

No Recharts. A simple SVG or canvas polyline is enough. No auth in v1; the device is on the home LAN only.

## Testing (when built)

Host-side unit tests for parse/store/tape logic (same habit as `lib/*.test.ts`), plus a device smoke list: join Wi-Fi, NTP, one download sample, persist reboot, serve `/`, run-now, SoftAP recovery after clearing NVS.

## Out of scope until a later spec

- Changing the Mac Next.js app or sharing its SQLite file
- Posting ESP32 samples back to the Mac
- Official Ookla or claiming ISP-plan Mbps
- Screen UI, battery, mesh/multi-device
- Cloud, Vercel, or remote access from outside the house

## Open points (defaults above apply if still unset)

1. Confirm v1 metrics: download + ping + RSSI, upload later.
2. Pick the exact download URL and size (enough bytes for a stable Mbps, small enough for RAM).
3. mDNS hostname (`homeline.local` vs something else).
4. Whether to retire the Mac agent once the ESP32 has a week of trusted samples.

## First milestone when this is picked up

1. PlatformIO Arduino project in `firmware/` targeting ESP32-S3, 16 MB flash, 8 MB PSRAM, LittleFS.
2. Wi-Fi portal + STA + NTP.
3. One download + ping sample, persisted, shown on a one-page UI with run-now and hourly timer.

Stop there before charts, OTA, or upload.
