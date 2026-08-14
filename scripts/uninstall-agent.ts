import os from "node:os";
import { defaultLaunchd } from "@/lib/agent";
import { uninstallSpeedtapeAgents } from "@/lib/agent-sync";
import { withDatabase } from "@/lib/db";
import { prepareDatabasePath } from "@/lib/migrate";

prepareDatabasePath();
withDatabase((db) => {
  uninstallSpeedtapeAgents({
    homeDir: os.homedir(),
    db,
    launchd: defaultLaunchd(),
  });
});
console.log("Removed Speedtape collectors.");
