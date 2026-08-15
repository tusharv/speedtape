import fs from "node:fs";
import path from "node:path";
import { defaultLaunchd, type LaunchdCtl } from "@/lib/agent";
import { writeAgentPlist } from "@/lib/launchd";
import {
  AGENT_LABEL,
  LEGACY_AGENT_LABEL,
  agentPlistPath,
  labeledAgentPlistPath,
  legacyAgentPlistPath,
  scheduleLabel,
  scheduleTaskName,
} from "@/lib/paths";
import { toPlistSchedule, type ScheduleRow } from "@/lib/schedules";
import {
  defaultSchtasks,
  generateTaskXml,
  type SchtasksCtl,
} from "@/lib/schtasks";

export type CollectorKind = "launchd" | "schtasks" | "unsupported";

export type CollectorCommand = {
  projectRoot: string;
  nodePath: string;
  tsxPath: string;
  pathEnv: string;
};

export type CollectorRuntime = {
  kind: CollectorKind;
  isLoaded: (id: number) => boolean;
  install: (row: ScheduleRow) => void;
  uninstall: (id: number) => boolean;
  uninstallAll: (ids: number[]) => void;
};

export type CollectorRuntimeOptions = CollectorCommand & {
  homeDir: string;
  platform?: NodeJS.Platform;
};

function scriptPath(projectRoot: string): string {
  return path.join(projectRoot, "scripts", "run-speedtest.ts");
}

function removeFile(filePath: string): void {
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

export function launchdCollectorRuntime(
  options: CollectorCommand & { homeDir: string; launchd: LaunchdCtl },
): CollectorRuntime {
  const { homeDir, launchd } = options;

  function uninstall(id: number): boolean {
    const plistPath = labeledAgentPlistPath(homeDir, id);
    const unloaded = launchd.unload(scheduleLabel(id), plistPath);
    removeFile(plistPath);
    return unloaded;
  }

  return {
    kind: "launchd",
    isLoaded(id) {
      return launchd.isLoaded(scheduleLabel(id));
    },
    install(row) {
      const plistPath = writeAgentPlist({
        homeDir,
        projectRoot: options.projectRoot,
        nodePath: options.nodePath,
        tsxPath: options.tsxPath,
        pathEnv: options.pathEnv,
        id: row.id,
        schedule: toPlistSchedule(row),
      });
      launchd.load(plistPath);
    },
    uninstall,
    uninstallAll(ids) {
      const agentsDir = path.join(homeDir, "Library", "LaunchAgents");
      const names = fs.existsSync(agentsDir) ? fs.readdirSync(agentsDir) : [];
      for (const name of names) {
        if (
          !name.startsWith(`${AGENT_LABEL}.plist`) &&
          !name.startsWith(`${AGENT_LABEL}.`) &&
          name !== `${LEGACY_AGENT_LABEL}.plist`
        ) {
          continue;
        }
        if (!name.endsWith(".plist")) continue;
        const label = name.slice(0, -".plist".length);
        const plistPath = path.join(agentsDir, name);
        launchd.unload(label, plistPath);
        removeFile(plistPath);
      }
      launchd.unload(AGENT_LABEL, agentPlistPath(homeDir));
      launchd.unload(LEGACY_AGENT_LABEL, legacyAgentPlistPath(homeDir));
      for (const id of ids) uninstall(id);
    },
  };
}

export function schtasksCollectorRuntime(
  options: CollectorCommand & { homeDir: string; schtasks: SchtasksCtl },
): CollectorRuntime {
  const { schtasks } = options;

  function uninstall(id: number): boolean {
    return schtasks.delete(scheduleTaskName(id));
  }

  return {
    kind: "schtasks",
    isLoaded(id) {
      return schtasks.isLoaded(scheduleTaskName(id));
    },
    install(row) {
      const xml = generateTaskXml(
        {
          nodePath: options.nodePath,
          tsxPath: options.tsxPath,
          scriptPath: scriptPath(options.projectRoot),
          workdir: options.projectRoot,
        },
        toPlistSchedule(row),
      );
      schtasks.create(scheduleTaskName(row.id), xml);
    },
    uninstall,
    uninstallAll(ids) {
      for (const id of ids) uninstall(id);
    },
  };
}

export function unsupportedCollectorRuntime(): CollectorRuntime {
  return {
    kind: "unsupported",
    isLoaded() {
      return false;
    },
    install() {
      throw new Error("Speedtape collectors need macOS or Windows.");
    },
    uninstall() {
      return false;
    },
    uninstallAll() {},
  };
}

export function defaultCollectorRuntime(
  options: CollectorRuntimeOptions,
): CollectorRuntime {
  const platform = options.platform ?? process.platform;
  if (platform === "darwin") {
    return launchdCollectorRuntime({
      ...options,
      launchd: defaultLaunchd(),
    });
  }
  if (platform === "win32") {
    return schtasksCollectorRuntime({
      ...options,
      schtasks: defaultSchtasks(),
    });
  }
  return unsupportedCollectorRuntime();
}

export function unloadWarning(kind: CollectorKind): string {
  if (kind === "schtasks") {
    return "Removed the collector. Check Task Scheduler if the old job is still loaded.";
  }
  return "Removed the collector. Check launchctl list if the old job is still loaded.";
}
