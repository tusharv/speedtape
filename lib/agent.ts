import { execFileSync } from "node:child_process";
import { AGENT_LABEL, LEGACY_AGENT_LABEL } from "@/lib/paths";

export { AGENT_LABEL, LEGACY_AGENT_LABEL };

export function isAgentLoaded(label = AGENT_LABEL): boolean {
  try {
    execFileSync("launchctl", ["list", label], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}
