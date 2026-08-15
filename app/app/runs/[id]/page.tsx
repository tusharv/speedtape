import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { ghostBtn } from "@/app/components/chrome";
import { RunPass } from "@/app/components/run-pass";
import { PageShell, SiteHeader } from "@/app/components/site-nav";
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
    title: `Line pass ${formatRunId(id)}`,
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
      <SiteHeader current="runs" />
      <div className="flex flex-col gap-4">
        <Link
          href={archiveHref({
            status: "all",
            slow: false,
            ping: false,
            sort: "newest",
          })}
          className={`run-pass-chrome ${ghostBtn}`}
        >
          <ArrowLeftIcon size={14} weight="regular" aria-hidden />
          All runs
        </Link>
        <RunPass test={test} />
      </div>
    </PageShell>
  );
}
