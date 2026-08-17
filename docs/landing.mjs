/** Pure helpers for the GitHub Pages landing. Keep in sync with the in-app landing. */

export const APP_NAME = "Speedtape";
export const LICENSE_LABEL = "MIT";
export const GITHUB_URL = "https://github.com/tusharv/speedtape";
export const CLONE_COMMAND = "git clone https://github.com/tusharv/speedtape.git";
export const COPY_FEEDBACK_MS = 1800;
export const WINDOWS_BUILD_TOOLS_NOTE =
  "Visual Studio C++ Build Tools are required so npm can compile better-sqlite3.";

export const AGENT_COMMANDS = [
  {
    name: "Check CLI on Mac",
    command: "command -v speedtest && speedtest --version",
  },
  { name: "Check CLI on Windows", command: "where.exe speedtest" },
  {
    name: "Read logs on Mac",
    command:
      "tail -n 80 ~/Library/Logs/speedtape.out.log ~/Library/Logs/speedtape.err.log",
  },
  {
    name: "Read logs on Windows",
    command:
      'Get-Content -Tail 80 "$env:APPDATA\\speedtape\\speedtape.out.log","$env:APPDATA\\speedtape\\speedtape.err.log"',
  },
  { name: "Run tests", command: "npm test" },
  { name: "Start dashboard", command: "npm run dev" },
  { name: "One-off test", command: "npm run speedtest" },
  { name: "Install collectors", command: "npm run install-agent" },
];

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

export function guideCommands(section) {
  if (section === "windows") return commandsFor("windows");
  if (section === "agents") return AGENT_COMMANDS;
  if (section === "mac") return commandsFor("mac");
  return commandsFor(section);
}

export async function copyCommand(writeText, command) {
  if (writeText) {
    try {
      await writeText(command);
      return "copied";
    } catch {
      return copyViaDocument(command);
    }
  }
  return copyViaDocument(command);
}

function copyViaDocument(command) {
  if (typeof document === "undefined" || typeof document.execCommand !== "function") {
    return "failed";
  }

  const area = document.createElement("textarea");
  area.value = command;
  area.setAttribute("readonly", "");
  area.setAttribute("aria-hidden", "true");
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.left = "0";
  area.style.width = "1px";
  area.style.height = "1px";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.focus?.();
  area.select();
  try {
    return document.execCommand("copy") ? "copied" : "failed";
  } catch {
    return "failed";
  } finally {
    area.remove();
  }
}

const SAMPLE_DOWN = [
  42, 55, 60, 58, 80, 90, 88, 70, 40, 35, 38, 95, 110, 108, 100, 92, 85, 60, 22,
  18, 40, 70, 88, 96,
];

export function dayPartForHour(hour) {
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

export function landingHourBits(cell) {
  const hour = Number.parseInt(cell.label, 10);
  const part = dayPartForHour(hour);
  const clock = `${cell.label}:00`;
  if (cell.failed) return [`${part} ${clock} failed`];
  if (cell.downloadMbps === null) return [`${part} ${clock} no reading`];
  return [
    `${part} ${clock}`,
    `${cell.downloadMbps.toFixed(1)} down`,
    `${(cell.uploadMbps ?? 0).toFixed(1)} up`,
    `${(cell.pingMs ?? 0).toFixed(1)} ping`,
  ];
}

export function landingHourReadout(cell) {
  const bits = landingHourBits(cell);
  return bits.length === 1 ? bits[0] : bits.join("  ");
}

export function summarizeTapeGroups(cells) {
  const groups = [];
  for (let i = 0; i < cells.length; i += 1) {
    const hour = Number.parseInt(cells[i].label, 10);
    const part = dayPartForHour(hour);
    const last = groups[groups.length - 1];
    if (last && last.part === part) {
      last.count += 1;
      last.cells.push(cells[i]);
    } else {
      groups.push({
        part,
        startIndex: i,
        count: 1,
        cells: [cells[i]],
      });
    }
  }
  return groups;
}

function successfulDownload(cell) {
  if (cell.failed || cell.downloadMbps === null) return null;
  return cell.downloadMbps;
}

export function tapeBarMax(cells) {
  let max = 0;
  for (const cell of cells) {
    const value = successfulDownload(cell);
    if (value !== null && value > max) max = value;
  }
  return max;
}

export function tapeBarHeightPct(cell, max) {
  const value = successfulDownload(cell);
  if (value === null || max <= 0) {
    return cell.failed ? 20 : 8;
  }
  return Math.max(8, (value / max) * 100);
}

export function tapeIndexFromClientX(clientX, left, width, count) {
  if (count <= 0 || width <= 0) return 0;
  const x = Math.min(Math.max(clientX - left, 0), width - 1);
  return Math.min(count - 1, Math.floor((x / width) * count));
}

export function barHeightPercent(cell) {
  return tapeBarHeightPct(cell, 110);
}
