import { execFileSync } from "node:child_process";
import { AGENT_LABEL, LEGACY_AGENT_LABEL } from "@/lib/paths";

export { AGENT_LABEL, LEGACY_AGENT_LABEL };

export type LaunchdCtl = {
  isLoaded: (label: string) => boolean;
  load: (plistPath: string) => void;
  unload: (label: string, plistPath?: string) => boolean;
};

export function isAgentLoaded(label = AGENT_LABEL): boolean {
  try {
    execFileSync("launchctl", ["list", label], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function uid(): number {
  return Number(execFileSync("id", ["-u"], { encoding: "utf8" }).trim());
}

export function unloadAgent(label: string, plistPath?: string): boolean {
  const domain = `gui/${uid()}`;
  try {
    execFileSync("launchctl", ["bootout", `${domain}/${label}`], {
      stdio: "pipe",
    });
    return true;
  } catch {
    if (!plistPath) return false;
    try {
      execFileSync("launchctl", ["unload", "-w", plistPath], { stdio: "pipe" });
      return true;
    } catch {
      return false;
    }
  }
}

export function loadAgent(plistPath: string): void {
  const domain = `gui/${uid()}`;
  const label = plistPath.split("/").pop()?.replace(/\.plist$/, "") ?? "";
  try {
    execFileSync("launchctl", ["bootout", `${domain}/${label}`], {
      stdio: "pipe",
    });
  } catch {
    // Agent may not be loaded yet.
  }
  try {
    execFileSync("launchctl", ["bootstrap", domain, plistPath], {
      stdio: "pipe",
    });
  } catch {
    execFileSync("launchctl", ["load", "-w", plistPath], { stdio: "inherit" });
  }
}

export function defaultLaunchd(): LaunchdCtl {
  return {
    isLoaded: isAgentLoaded,
    load: loadAgent,
    unload: unloadAgent,
  };
}

export function countLoadedAgents(
  labels: string[],
  isLoaded: (label: string) => boolean = isAgentLoaded,
): number {
  return labels.filter((label) => isLoaded(label)).length;
}
