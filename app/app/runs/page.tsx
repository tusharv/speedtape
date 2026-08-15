import { connection } from "next/server";
import { RunArchive } from "@/app/components/run-archive";
import { PageIntro, PageShell, SiteHeader } from "@/app/components/site-nav";
import { loadArchive } from "@/lib/dashboard";
import { parseArchiveQuery } from "@/lib/runs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Runs",
  description: "Every speed test stored on this computer",
};

function firstString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RunsPage({ searchParams }: PageProps<"/app/runs">) {
  await connection();
  const params = await searchParams;
  const query = parseArchiveQuery({
    status: firstString(params.status),
    slow: firstString(params.slow),
    ping: firstString(params.ping),
    sort: firstString(params.sort),
  });
  const data = loadArchive(query);

  return (
    <PageShell>
      <SiteHeader current="runs" />
      <PageIntro title="All runs">
        Scroll for older samples. Open a row for jitter, loss, server, and ISP.
      </PageIntro>
      <RunArchive
        key={`${query.status}-${query.slow}-${query.ping}-${query.sort}`}
        query={query}
        summary={data.summary}
        initialRows={data.rows}
        total={data.total}
      />
    </PageShell>
  );
}
