import { connection } from "next/server";
import { AddAgentForm } from "@/app/components/add-agent-form";
import { AgentList } from "@/app/components/agent-list";
import { PageIntro, PageShell, SiteHeader } from "@/app/components/site-nav";
import { houseAgentContext, loadConfigAgents } from "@/lib/agent-sync";
import { withDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Config",
  description: "Add or remove Speedtape collectors on this computer",
};

export default async function ConfigPage() {
  await connection();
  const agents = withDatabase((db) => loadConfigAgents(houseAgentContext(db)));

  return (
    <PageShell>
      <SiteHeader current="config" />
      <PageIntro title="Config">
        Add or remove collectors on this computer. Each one runs a speed test on
        its own schedule.
      </PageIntro>
      <AgentList agents={agents} />
      <AddAgentForm />
      <p className="text-xs text-muted">
        This computer must be awake for a scheduled test to run. Sleeping skips
        the job.
      </p>
    </PageShell>
  );
}
