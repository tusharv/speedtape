import { connection } from "next/server";
import { RunArchive } from "@/app/components/run-archive";
import { PageShell, SiteNav } from "@/app/components/site-nav";
import { loadArchive } from "@/lib/dashboard";
import { parseArchiveQuery } from "@/lib/runs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Runs",
  description: "Every speed test stored on this Mac",
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
      <header className="flex flex-col gap-4 border-b border-hairline pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-5xl font-semibold text-paper sm:text-6xl">
            All runs
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted">
            Scroll for older samples. Open a row for jitter, loss, server, and
            ISP.
          </p>
        </div>
        <SiteNav current="runs" />
      </header>
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
