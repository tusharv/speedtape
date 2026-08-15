"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ghostBtn, kicker, panel, sectionTitle } from "@/app/components/chrome";
import { removeAgent } from "@/app/actions";

export type AgentListItem = {
  id: number;
  name: string;
  cadence: string;
  loaded: boolean;
};

export function AgentList({ agents }: { agents: AgentListItem[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (agents.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-hairline bg-panel px-6 py-8">
        <h2 className={sectionTitle}>
          No collectors yet
        </h2>
        <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
          Add an agent below so this computer keeps running tests on a schedule.
        </p>
      </section>
    );
  }

  return (
    <section className={panel}>
      <h2 className={kicker}>
        Agents on this computer
      </h2>
      {warning ? (
        <p className="mt-4 border border-fail/40 bg-fail/10 px-4 py-3 text-sm text-fail">
          {warning}
        </p>
      ) : null}
      <ul className="mt-4 divide-y divide-hairline">
        {agents.map((agent) => (
          <li
            key={agent.id}
            className="flex flex-wrap items-center justify-between gap-4 py-4"
          >
            <div className="min-w-0 flex-1">
              <p className="break-words font-semibold text-paper">{agent.name}</p>
              <p className="mt-1 break-words font-mono text-xs leading-5 text-muted">
                {agent.cadence}
                {" · "}
                <span className={agent.loaded ? "text-up" : "text-fail"}>
                  {agent.loaded ? "loaded" : "not loaded"}
                </span>
              </p>
            </div>
            <button
              type="button"
              disabled={pending && pendingId === agent.id}
              className={`${ghostBtn} shrink-0 text-fail hover:border-fail disabled:opacity-60`}
              onClick={() => {
                setWarning(null);
                setPendingId(agent.id);
                startTransition(async () => {
                  const result = await removeAgent(agent.id);
                  if (result.warning) setWarning(result.warning);
                  setPendingId(null);
                  router.refresh();
                });
              }}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
