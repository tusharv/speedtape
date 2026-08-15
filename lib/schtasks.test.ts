import { describe, expect, it } from "vitest";
import type { PlistSchedule } from "@/lib/launchd";
import { scheduleTaskName } from "@/lib/paths";
import {
  generateTaskXml,
  schtasksCreateArgs,
  schtasksDeleteArgs,
  schtasksQueryArgs,
} from "@/lib/schtasks";

const command = {
  nodePath: "C:\\Program Files\\nodejs\\node.exe",
  tsxPath: "C:\\proj\\node_modules\\tsx\\dist\\cli.mjs",
  scriptPath: "C:\\proj\\scripts\\run-speedtest.ts",
  workdir: "C:\\proj",
};

describe("scheduleTaskName", () => {
  it("names Task Scheduler jobs from the schedule id", () => {
    expect(scheduleTaskName(3)).toBe("Speedtape.speedtest.3");
  });
});

describe("schtasks args", () => {
  it("creates, queries, and deletes by task name", () => {
    expect(schtasksQueryArgs("Speedtape.speedtest.3")).toEqual([
      "/Query",
      "/TN",
      "Speedtape.speedtest.3",
    ]);
    expect(schtasksDeleteArgs("Speedtape.speedtest.3")).toEqual([
      "/Delete",
      "/TN",
      "Speedtape.speedtest.3",
      "/F",
    ]);
    expect(
      schtasksCreateArgs("Speedtape.speedtest.3", "C:\\tmp\\task.xml"),
    ).toEqual([
      "/Create",
      "/TN",
      "Speedtape.speedtest.3",
      "/XML",
      "C:\\tmp\\task.xml",
      "/F",
    ]);
  });
});

describe("generateTaskXml", () => {
  it("writes an interval task with working directory and no wake", () => {
    const schedule: PlistSchedule = { kind: "interval", seconds: 900 };
    const xml = generateTaskXml(command, schedule);
    expect(xml).toContain("<Interval>PT15M</Interval>");
    expect(xml).toContain(
      "<Command>C:\\Program Files\\nodejs\\node.exe</Command>",
    );
    expect(xml).toContain(
      '<Arguments>"C:\\proj\\node_modules\\tsx\\dist\\cli.mjs" "C:\\proj\\scripts\\run-speedtest.ts"</Arguments>',
    );
    expect(xml).toContain("<WorkingDirectory>C:\\proj</WorkingDirectory>");
    expect(xml).not.toContain("<WakeToRun>true</WakeToRun>");
  });

  it("writes daily clock triggers for every-day times", () => {
    const schedule: PlistSchedule = {
      kind: "clock",
      entries: [
        { hour: 8, minute: 0 },
        { hour: 21, minute: 30 },
      ],
    };
    const xml = generateTaskXml(command, schedule);
    expect(xml).toContain("<StartBoundary>2020-01-01T08:00:00</StartBoundary>");
    expect(xml).toContain("<StartBoundary>2020-01-01T21:30:00</StartBoundary>");
    expect(xml).not.toContain("<DaysOfWeek>");
  });

  it("writes weekly clock triggers when weekdays are set", () => {
    const schedule: PlistSchedule = {
      kind: "clock",
      entries: [{ weekday: 1, hour: 9, minute: 0 }],
    };
    const xml = generateTaskXml(command, schedule);
    expect(xml).toContain("<Monday />");
    expect(xml).not.toContain("<Sunday />");
  });
});
