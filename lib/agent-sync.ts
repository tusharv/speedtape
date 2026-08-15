import fs from "node:fs";
import path from "node:path";
import type Database from "better-sqlite3";
import type { LaunchdCtl } from "@/lib/agent";
import {
  defaultCollectorRuntime,
  launchdCollectorRuntime,
  unloadWarning,
  type CollectorRuntime,
} from "@/lib/collector-runtime";
import {
  AGENT_LABEL,
  LEGACY_AGENT_LABEL,
  agentPlistPath,
  legacyAgentPlistPath,
} from "@/lib/paths";
import {
  cadenceLine,
  deleteAllSchedules,
  deleteSchedule,
  insertSchedule,
  listSchedules,
  type ScheduleInput,
  type ScheduleRow,
} from "@/lib/schedules";

export type AgentSyncOptions = {
  homeDir: string;
  db: Database.Database;
  launchd?: LaunchdCtl;
  runtime?: CollectorRuntime;
  platform?: NodeJS.Platform;
  projectRoot: string;
  nodePath: string;
  tsxPath: string;
  pathEnv: string;
};

function collectorFor(options: AgentSyncOptions): CollectorRuntime {
  if (options.runtime) return options.runtime;
  if (options.launchd) {
    return launchdCollectorRuntime({
      homeDir: options.homeDir,
      launchd: options.launchd,
      projectRoot: options.projectRoot,
      nodePath: options.nodePath,
      tsxPath: options.tsxPath,
      pathEnv: options.pathEnv,
    });
  }
  return defaultCollectorRuntime({
    homeDir: options.homeDir,
    platform: options.platform,
    projectRoot: options.projectRoot,
    nodePath: options.nodePath,
    tsxPath: options.tsxPath,
    pathEnv: options.pathEnv,
  });
}

export type AgentRuntimePathOptions = {
  platform?: NodeJS.Platform;
  pathEnv?: string;
  programFiles?: string;
  localAppData?: string;
};

export function agentRuntimePaths(
  projectRoot = process.cwd(),
  options: AgentRuntimePathOptions = {},
): {
  projectRoot: string;
  nodePath: string;
  tsxPath: string;
  pathEnv: string;
} {
  const platform = options.platform ?? process.platform;
  const join = platform === "win32" ? path.win32.join : path.posix.join;
  const delimiter = platform === "win32" ? ";" : ":";
  const extras =
    platform === "win32"
      ? [
          join(
            options.programFiles ??
              process.env.ProgramFiles ??
              "C:\\Program Files",
            "Ookla",
            "Speedtest CLI",
          ),
          join(
            options.localAppData ??
              process.env.LOCALAPPDATA ??
              join(
                process.env.USERPROFILE ?? "C:\\Users\\Default",
                "AppData",
                "Local",
              ),
            "Microsoft",
            "WinGet",
            "Links",
          ),
          join(
            options.programFiles ??
              process.env.ProgramFiles ??
              "C:\\Program Files",
            "nodejs",
          ),
        ]
      : ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin"];
  const current = (options.pathEnv ?? process.env.PATH ?? "").split(
    delimiter,
  );
  return {
    projectRoot,
    nodePath: process.execPath,
    tsxPath: join(projectRoot, "node_modules", "tsx", "dist", "cli.mjs"),
    pathEnv: [...new Set([...extras, ...current.filter(Boolean)])].join(
      delimiter,
    ),
  };
}

function removePlist(plistPath: string): void {
  if (fs.existsSync(plistPath)) fs.unlinkSync(plistPath);
}

export function importLegacyHourlyIfNeeded(options: AgentSyncOptions): void {
  if (!options.launchd) return;
  const unlabeled = agentPlistPath(options.homeDir);
  const present =
    fs.existsSync(unlabeled) || options.launchd.isLoaded(AGENT_LABEL);
  if (!present) return;

  const existing = listSchedules(options.db);
  options.launchd.unload(AGENT_LABEL, unlabeled);
  removePlist(unlabeled);

  if (existing.length > 0) return;

  const row = insertSchedule(options.db, {
    name: "Hourly",
    kind: "interval",
    intervalSeconds: 3600,
  });
  collectorFor(options).install(row);
}

export function installSpeedtapeAgents(options: AgentSyncOptions): void {
  if (options.launchd) {
    const legacyPlist = legacyAgentPlistPath(options.homeDir);
    options.launchd.unload(LEGACY_AGENT_LABEL, legacyPlist);
    removePlist(legacyPlist);
    importLegacyHourlyIfNeeded(options);
  }

  const runtime = collectorFor(options);
  const rows = listSchedules(options.db);
  if (rows.length === 0) {
    const row = insertSchedule(options.db, {
      name: "Hourly",
      kind: "interval",
      intervalSeconds: 3600,
    });
    runtime.install(row);
    return;
  }

  for (const row of rows) {
    runtime.uninstall(row.id);
    runtime.install(row);
  }
}

export function uninstallSpeedtapeAgents(options: {
  homeDir: string;
  db: Database.Database;
  launchd?: LaunchdCtl;
  runtime?: CollectorRuntime;
  platform?: NodeJS.Platform;
  projectRoot?: string;
  nodePath?: string;
  tsxPath?: string;
  pathEnv?: string;
}): void {
  const runtime = collectorFor({
    homeDir: options.homeDir,
    db: options.db,
    launchd: options.launchd,
    runtime: options.runtime,
    platform: options.platform,
    projectRoot: options.projectRoot ?? "",
    nodePath: options.nodePath ?? "",
    tsxPath: options.tsxPath ?? "",
    pathEnv: options.pathEnv ?? "",
  });
  runtime.uninstallAll(listSchedules(options.db).map((row) => row.id));
  deleteAllSchedules(options.db);
}

export type AddAgentResult =
  | { ok: true; row: ScheduleRow }
  | { ok: false; error: string };

export function addScheduledAgent(
  options: AgentSyncOptions & { input: ScheduleInput },
): AddAgentResult {
  const runtime = collectorFor(options);
  const row = insertSchedule(options.db, options.input);
  try {
    runtime.install(row);
    return { ok: true, row };
  } catch (err) {
    runtime.uninstall(row.id);
    deleteSchedule(options.db, row.id);
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export type RemoveAgentResult = { ok: true; warning?: string };

export function removeScheduledAgent(options: {
  homeDir: string;
  db: Database.Database;
  launchd?: LaunchdCtl;
  runtime?: CollectorRuntime;
  platform?: NodeJS.Platform;
  projectRoot?: string;
  nodePath?: string;
  tsxPath?: string;
  pathEnv?: string;
  id: number;
}): RemoveAgentResult {
  const runtime = collectorFor({
    homeDir: options.homeDir,
    db: options.db,
    launchd: options.launchd,
    runtime: options.runtime,
    platform: options.platform,
    projectRoot: options.projectRoot ?? "",
    nodePath: options.nodePath ?? "",
    tsxPath: options.tsxPath ?? "",
    pathEnv: options.pathEnv ?? "",
  });
  const unloaded = runtime.uninstall(options.id);
  deleteSchedule(options.db, options.id);
  if (!unloaded) {
    return { ok: true, warning: unloadWarning(runtime.kind) };
  }
  return { ok: true };
}

export type ConfigAgent = ScheduleRow & {
  cadence: string;
  loaded: boolean;
};

export function loadConfigAgents(options: AgentSyncOptions): ConfigAgent[] {
  importLegacyHourlyIfNeeded(options);
  const runtime = collectorFor(options);
  return listSchedules(options.db).map((row) => ({
    ...row,
    cadence: cadenceLine(row),
    loaded: runtime.isLoaded(row.id),
  }));
}
