export const TERMS = {
  download:
    "How fast this house can pull data in. Higher means pages, videos, and downloads feel quicker.",
  upload:
    "How fast this house can send data out. Higher helps video calls, backups, and sending photos.",
  ping: "How long a tiny hello takes to reach the internet and come back. Lower feels snappier in calls and games.",
  jitter:
    "How much ping jumps around from moment to moment. High jitter makes calls and games stutter even when average ping looks fine.",
  loss: "The share of data that never arrived. A little is normal. A lot means frozen video, gaps in speech, and retries.",
  mbps: "Megabits per second. The unit for download and upload speed. Bigger is faster.",
  ms: "Milliseconds. Thousandths of a second. Used for ping and jitter. Smaller is better.",
  isp: "Your internet company. The name of who sells this house its connection.",
  server:
    "The nearby speed-test machine this run used. A farther server can make the numbers look worse.",
  ok: "This run finished and recorded numbers.",
  failed: "This run did not finish. The message says what went wrong.",
  slowDown: "Download was slower than usual for this house.",
  highPing: "Ping was higher than usual, so the line felt more laggy.",
  minAvgMax:
    "The lowest, typical, and highest values from successful tests in this time window.",
  range24h: "Samples from the last 24 hours.",
  range7d: "Samples from the last 7 days.",
  range30d: "Samples from the last 30 days.",
  rangeAll: "Every sample stored on this Mac.",
  agent:
    "The hourly job on this Mac that runs a test even when the dashboard is closed.",
  run: "One speed test. Each hourly sample gets its own number.",
} as const;

export type TermKey = keyof typeof TERMS;

export function termText(key: TermKey): string {
  return TERMS[key];
}
