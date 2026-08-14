import os from "node:os";
import { connection } from "next/server";
import { AddAgentForm } from "@/app/components/add-agent-form";
import { AgentList } from "@/app/components/agent-list";
import { PageShell, SiteNav } from "@/app/components/site-nav";
import { defaultLaunchd } from "@/lib/agent";
import { agentRuntimePaths, loadConfigAgents } from "@/lib/agent-sync";
import { withDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Config",
  description: "Add or remove Speedtape collectors on this Mac",
};

export default async function ConfigPage() {
  await connection();
  const agents = withDatabase((db) =>
    loadConfigAgents({
      homeDir: os.homedir(),
      db,
      launchd: defaultLaunchd(),
      ...agentRuntimePaths(),
    }),
  );

  return (
    <PageShell>
      <header className="flex flex-col gap-4 border-b border-hairline pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold text-paper sm:text-6xl">
            Config
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted">
            Add or remove collectors on this Mac. Each one runs a speed test on
            its own schedule.
          </p>
        </div>
        <SiteNav current="config" />
      </header>
      <AgentList agents={agents} />
      <AddAgentForm />
      <p className="text-xs text-muted">
        This Mac must be awake for a scheduled test to run. Sleeping skips the
        job.
      </p>
    </PageShell>
  );
}
