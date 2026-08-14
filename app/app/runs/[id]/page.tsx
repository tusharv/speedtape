import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RunCard } from "@/app/components/run-card";
import { PageShell, SiteNav } from "@/app/components/site-nav";
import { formatTime } from "@/app/components/stats";
import { loadRun } from "@/lib/dashboard";
import { archiveHref, formatRunId, parseRunId } from "@/lib/runs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function generateMetadata({
  params,
}: PageProps<"/app/runs/[id]">): Promise<Metadata> {
  const { id: rawId } = await params;
  const id = parseRunId(rawId);
  if (id === null) return { title: "Run not found" };
  const test = loadRun(id);
  if (!test) return { title: "Run not found" };
  return {
    title: `Run ${formatRunId(id)}`,
    description: `Speed test ${formatRunId(id)} at ${formatTime(test.testedAt)}`,
  };
}

export default async function RunDetailPage({
  params,
}: PageProps<"/app/runs/[id]">) {
  await connection();
  const { id: rawId } = await params;
  const id = parseRunId(rawId);
  if (id === null) notFound();
  const test = loadRun(id);
  if (!test) notFound();

  return (
    <PageShell>
      <header className="flex flex-col gap-4 border-b border-hairline pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-copper">
            House circuit
          </p>
          <h1 className="mt-2 font-display text-5xl text-paper sm:text-6xl">
            Run {formatRunId(test.id)}
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted">
            Full reading from {formatTime(test.testedAt)}.
          </p>
        </div>
        <SiteNav current="runs" />
      </header>
      <div className="flex flex-col gap-4">
        <Link
          href={archiveHref({
            status: "all",
            slow: false,
            ping: false,
            sort: "newest",
          })}
          className="inline-flex w-fit items-center border border-hairline px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted hover:border-copper hover:text-paper"
        >
          All runs
        </Link>
        <RunCard test={test} />
      </div>
    </PageShell>
  );
}
