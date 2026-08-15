"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
        <h2 className="font-display text-2xl font-semibold text-paper">
          No collectors yet
        </h2>
        <p className="mt-2 max-w-lg text-sm text-muted">
          Add an agent below so this computer keeps running tests on a schedule.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-hairline bg-raised px-4 py-5 sm:px-6">
      <h2 className="text-[11px] uppercase tracking-[0.12em] text-muted">
        Agents on this computer
      </h2>
      {warning ? (
        <p className="mt-3 border border-fail/40 bg-fail/10 px-4 py-3 text-sm text-fail">
          {warning}
        </p>
      ) : null}
      <ul className="mt-3 divide-y divide-hairline">
        {agents.map((agent) => (
          <li
            key={agent.id}
            className="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="break-words font-semibold text-paper">{agent.name}</p>
              <p className="break-words font-mono text-xs text-muted">
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
              className="shrink-0 border border-hairline px-3 py-1 text-xs uppercase tracking-[0.16em] text-fail hover:border-fail disabled:opacity-60"
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
