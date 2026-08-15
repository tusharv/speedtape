import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { CalendarEntry, PlistSchedule } from "@/lib/launchd";

const WEEKDAY_TAGS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type TaskCommand = {
  nodePath: string;
  tsxPath: string;
  scriptPath: string;
  workdir: string;
};

export type SchtasksCtl = {
  isLoaded: (taskName: string) => boolean;
  create: (taskName: string, xml: string) => void;
  delete: (taskName: string) => boolean;
};

function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function intervalXml(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `    <TimeTrigger>
      <Repetition>
        <Interval>PT${minutes}M</Interval>
        <StopAtDurationEnd>false</StopAtDurationEnd>
      </Repetition>
      <StartBoundary>2020-01-01T00:00:00</StartBoundary>
      <Enabled>true</Enabled>
    </TimeTrigger>`;
}

function clockTrigger(entry: CalendarEntry): string {
  const start = `2020-01-01T${pad2(entry.hour)}:${pad2(entry.minute)}:00`;
  const scheduleXml =
    entry.weekday === undefined
      ? `
      <ScheduleByDay>
        <DaysInterval>1</DaysInterval>
      </ScheduleByDay>`
      : `
      <ScheduleByWeek>
        <DaysOfWeek>
          <${WEEKDAY_TAGS[entry.weekday]} />
        </DaysOfWeek>
        <WeeksInterval>1</WeeksInterval>
      </ScheduleByWeek>`;
  return `    <CalendarTrigger>
      <StartBoundary>${start}</StartBoundary>
      <Enabled>true</Enabled>${scheduleXml}
    </CalendarTrigger>`;
}

export function generateTaskXml(
  command: TaskCommand,
  schedule: PlistSchedule,
): string {
  const triggers =
    schedule.kind === "interval"
      ? intervalXml(schedule.seconds)
      : schedule.entries.map(clockTrigger).join("\n");
  const args = `"${xmlEscape(command.tsxPath)}" "${xmlEscape(command.scriptPath)}"`;
  return `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <Triggers>
${triggers}
  </Triggers>
  <Settings>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <WakeToRun>false</WakeToRun>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <StartWhenAvailable>true</StartWhenAvailable>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>${xmlEscape(command.nodePath)}</Command>
      <Arguments>${args}</Arguments>
      <WorkingDirectory>${xmlEscape(command.workdir)}</WorkingDirectory>
    </Exec>
  </Actions>
</Task>
`;
}

export function schtasksQueryArgs(taskName: string): string[] {
  return ["/Query", "/TN", taskName];
}

export function schtasksDeleteArgs(taskName: string): string[] {
  return ["/Delete", "/TN", taskName, "/F"];
}

export function schtasksCreateArgs(taskName: string, xmlPath: string): string[] {
  return ["/Create", "/TN", taskName, "/XML", xmlPath, "/F"];
}

export function defaultSchtasks(): SchtasksCtl {
  return {
    isLoaded(taskName) {
      try {
        execFileSync("schtasks", schtasksQueryArgs(taskName), { stdio: "pipe" });
        return true;
      } catch {
        return false;
      }
    },
    create(taskName, xml) {
      const xmlPath = path.join(
        os.tmpdir(),
        `speedtape-${taskName.replaceAll(/[^A-Za-z0-9._-]/g, "_")}.xml`,
      );
      fs.writeFileSync(xmlPath, `\uFEFF${xml}`, { encoding: "utf16le" });
      try {
        execFileSync("schtasks", schtasksCreateArgs(taskName, xmlPath), {
          stdio: "pipe",
        });
      } finally {
        try {
          fs.unlinkSync(xmlPath);
        } catch {
          // Temp XML already gone.
        }
      }
    },
    delete(taskName) {
      try {
        execFileSync("schtasks", schtasksDeleteArgs(taskName), {
          stdio: "pipe",
        });
        return true;
      } catch {
        return false;
      }
    },
  };
}
