"use server";

import { revalidatePath } from "next/cache";
import { loadArchive } from "@/lib/dashboard";
import { recordSpeedtest } from "@/lib/record";
import type { ArchiveQuery } from "@/lib/runs";

export async function runTestNow() {
  const row = await recordSpeedtest();
  revalidatePath("/");
  revalidatePath("/runs");
  return row;
}

export async function loadMoreRuns(query: ArchiveQuery & { offset: number }) {
  return loadArchive(
    {
      status: query.status,
      slow: query.slow,
      ping: query.ping,
      sort: query.sort,
    },
    query.offset,
  );
}
