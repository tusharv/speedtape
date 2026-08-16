/** Pure helpers for the GitHub Pages landing. Keep in sync with the spec. */

export const APP_NAME = "Speedtape";
export const LICENSE_LABEL = "MIT";
export const GITHUB_URL = "https://github.com/tusharv/speedtape";
export const CLONE_COMMAND = "git clone https://github.com/tusharv/speedtape.git";
export const COPY_FEEDBACK_MS = 1800;
export const WINDOWS_BUILD_TOOLS_NOTE =
  "Visual Studio C++ Build Tools are required so npm can compile better-sqlite3.";

export const DASHBOARD_NOTE =
  "Only when you want reports. The collector does not need localhost.";

const SHARED_COMMANDS = [
  { name: "Install dependencies", command: "npm install" },
  { name: "Install agent", command: "npm run install-agent" },
  { name: "Start dashboard", command: "npm run dev", note: DASHBOARD_NOTE },
];

export function detectSetupOs(userAgent) {
  return /windows/i.test(userAgent) ? "windows" : "mac";
}

export function commandsFor(os) {
  const cli =
    os === "windows"
      ? {
          name: "Install CLI",
          command: "winget install -e --id Ookla.Speedtest.CLI",
        }
      : {
          name: "Install CLI",
          command: "brew tap teamookla/speedtest && brew install speedtest",
        };
  return [cli, ...SHARED_COMMANDS];
}

export async function copyCommand(writeText, command) {
  if (!writeText) return "failed";
  try {
    await writeText(command);
    return "copied";
  } catch {
    return "failed";
  }
}

const SAMPLE_DOWN = [
  42, 55, 60, 58, 80, 90, 88, 70, 40, 35, 38, 95, 110, 108, 100, 92, 85, 60, 22,
  18, 40, 70, 88, 96,
];

function dayPartForHour(hour) {
  if (hour < 5) return "Late night";
  if (hour < 11) return "Morning";
  if (hour < 15) return "Noon";
  if (hour < 20) return "Evening";
  return "Night";
}

export function landingTapeCells() {
  return SAMPLE_DOWN.map((down, i) => {
    const failed = i === 18;
    return {
      label: String(i).padStart(2, "0"),
      downloadMbps: failed ? null : down,
      uploadMbps: failed ? null : 12,
      pingMs: failed ? null : 9,
      failed,
    };
  });
}

export function landingHourReadout(cell) {
  const hour = Number.parseInt(cell.label, 10);
  const part = dayPartForHour(hour);
  const clock = `${cell.label}:00`;
  if (cell.failed) return `${part} ${clock} failed`;
  if (cell.downloadMbps === null) return `${part} ${clock} no reading`;
  const down = cell.downloadMbps.toFixed(1);
  const up = (cell.uploadMbps ?? 0).toFixed(1);
  const ping = (cell.pingMs ?? 0).toFixed(1);
  return `${part} ${clock}  ${down} down  ${up} up  ${ping} ping`;
}

export function barHeightPercent(cell) {
  if (cell.failed || cell.downloadMbps === null) return 18;
  return Math.max(12, Math.min(100, (cell.downloadMbps / 110) * 100));
}
