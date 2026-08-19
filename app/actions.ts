"use server";

import { revalidatePath } from "next/cache";
import {
  addScheduledAgent,
  houseAgentContext,
  removeScheduledAgent,
} from "@/lib/agent-sync";
import { loadArchive, loadDashboardHistory } from "@/lib/dashboard";
import { withDatabase } from "@/lib/db";
import { parseRange } from "@/lib/range";
import { recordSpeedtest } from "@/lib/record";
import type { ArchiveQuery } from "@/lib/runs";
import { parseAgentInput } from "@/lib/schedules";
import type { Range } from "@/lib/types";

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

export async function loadDashboardRange(range: Range) {
  return loadDashboardHistory(parseRange(range));
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
  const result = withDatabase((db) =>
    addScheduledAgent({
      ...houseAgentContext(db),
      input: parsed.value,
    }),
  );
  if (result.ok) revalidateMeter();
  return result;
}

export async function removeAgent(id: number) {
  const result = withDatabase((db) =>
    removeScheduledAgent({
      ...houseAgentContext(db),
      id,
    }),
  );
  revalidateMeter();
  return result;
}
