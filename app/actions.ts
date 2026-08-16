"use server";

import os from "node:os";
import { revalidatePath } from "next/cache";
import {
  addScheduledAgent,
  agentRuntimePaths,
  removeScheduledAgent,
} from "@/lib/agent-sync";
import { defaultCollectorRuntime } from "@/lib/collector-runtime";
import { loadArchive } from "@/lib/dashboard";
import { withDatabase } from "@/lib/db";
import { recordSpeedtest } from "@/lib/record";
import type { ArchiveQuery } from "@/lib/runs";
import { parseAgentInput } from "@/lib/schedules";

function revalidateMeter() {
  revalidatePath("/app");
  revalidatePath("/app/runs");
  revalidatePath("/app/config");
}

export async function runTestNow() {
  const row = await recordSpeedtest();
  revalidateMeter();
  return row;
}

export async function loadMoreRuns(query: ArchiveQuery & { offset: number }) {
  const { offset, ...archiveQuery } = query;
  return loadArchive(archiveQuery, offset);
}

export async function addAgent(raw: {
  name: string;
  kind: "interval" | "clock";
  intervalSeconds: number;
  times: string[];
  weekdays: number[];
}) {
  const parsed = parseAgentInput(raw);
  if (!parsed.ok) return parsed;
  const runtime = defaultCollectorRuntime({
    homeDir: os.homedir(),
    ...agentRuntimePaths(),
  });
  const result = withDatabase((db) =>
    addScheduledAgent({
      homeDir: os.homedir(),
      db,
      runtime,
      ...agentRuntimePaths(),
      input: parsed.value,
    }),
  );
  if (result.ok) revalidateMeter();
  return result;
}

export async function removeAgent(id: number) {
  const result = withDatabase((db) =>
    removeScheduledAgent({
      homeDir: os.homedir(),
      db,
      runtime: defaultCollectorRuntime({
        homeDir: os.homedir(),
        ...agentRuntimePaths(),
      }),
      id,
    }),
  );
  revalidateMeter();
  return result;
}
