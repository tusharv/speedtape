import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { agentLogPaths, labeledAgentPlistPath, scheduleLabel } from "@/lib/paths";

export { labeledAgentPlistPath, agentPlistPath } from "@/lib/paths";

export type PlistPaths = {
  nodePath: string;
  tsxPath: string;
  scriptPath: string;
  workdir: string;
  pathEnv: string;
  outLog: string;
  errLog: string;
};

export type CalendarEntry = {
  weekday?: number;
  hour: number;
  minute: number;
};

export type PlistSchedule =
  | { kind: "interval"; seconds: number }
  | { kind: "clock"; entries: CalendarEntry[] };

function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function calendarXml(entries: CalendarEntry[]): string {
  const dicts = entries
    .map((entry) => {
      const weekday =
        entry.weekday === undefined
          ? ""
          : `      <key>Weekday</key>
      <integer>${entry.weekday}</integer>
`;
      return `    <dict>
${weekday}      <key>Hour</key>
      <integer>${entry.hour}</integer>
      <key>Minute</key>
      <integer>${entry.minute}</integer>
    </dict>`;
    })
    .join("\n");
  return `  <key>StartCalendarInterval</key>
  <array>
${dicts}
  </array>
  <key>RunAtLoad</key>
  <false/>`;
}

function intervalXml(seconds: number): string {
  return `  <key>StartInterval</key>
  <integer>${seconds}</integer>
  <key>RunAtLoad</key>
  <true/>`;
}

export function generatePlist(
  paths: PlistPaths,
  options: { label: string; schedule: PlistSchedule },
): string {
  const nodePath = xmlEscape(paths.nodePath);
  const tsxPath = xmlEscape(paths.tsxPath);
  const scriptPath = xmlEscape(paths.scriptPath);
  const workdir = xmlEscape(paths.workdir);
  const pathEnv = xmlEscape(paths.pathEnv);
  const outLog = xmlEscape(paths.outLog);
  const errLog = xmlEscape(paths.errLog);
  const label = xmlEscape(options.label);
  const scheduleXml =
    options.schedule.kind === "interval"
      ? intervalXml(options.schedule.seconds)
      : calendarXml(options.schedule.entries);

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${label}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${nodePath}</string>
    <string>${tsxPath}</string>
    <string>${scriptPath}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${workdir}</string>
${scheduleXml}
  <key>StandardOutPath</key>
  <string>${outLog}</string>
  <key>StandardErrorPath</key>
  <string>${errLog}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>${pathEnv}</string>
  </dict>
</dict>
</plist>
`;
}

export function writeAgentPlist(options: {
  homeDir?: string;
  projectRoot: string;
  nodePath: string;
  tsxPath: string;
  pathEnv: string;
  id: number;
  schedule: PlistSchedule;
}): string {
  const homeDir = options.homeDir ?? os.homedir();
  const plistPath = labeledAgentPlistPath(homeDir, options.id);
  const logs = agentLogPaths(homeDir);
  fs.mkdirSync(path.dirname(plistPath), { recursive: true });
  fs.mkdirSync(path.join(homeDir, "Library", "Logs"), { recursive: true });
  const xml = generatePlist(
    {
      nodePath: options.nodePath,
      tsxPath: options.tsxPath,
      scriptPath: path.join(options.projectRoot, "scripts", "run-speedtest.ts"),
      workdir: options.projectRoot,
      pathEnv: options.pathEnv,
      outLog: logs.outLog,
      errLog: logs.errLog,
    },
    {
      label: scheduleLabel(options.id),
      schedule: options.schedule,
    },
  );
  fs.writeFileSync(plistPath, xml);
  return plistPath;
}
