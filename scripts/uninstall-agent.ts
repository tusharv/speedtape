import os from "node:os";
import {
  agentRuntimePaths,
  uninstallSpeedtapeAgents,
} from "@/lib/agent-sync";
import { defaultCollectorRuntime } from "@/lib/collector-runtime";
import { withDatabase } from "@/lib/db";
import { prepareDatabasePath } from "@/lib/migrate";

prepareDatabasePath();
withDatabase((db) => {
  const runtimePaths = agentRuntimePaths();
  uninstallSpeedtapeAgents({
    homeDir: os.homedir(),
    db,
    runtime: defaultCollectorRuntime({
      homeDir: os.homedir(),
      ...runtimePaths,
    }),
  });
});
console.log("Removed Speedtape collectors.");
