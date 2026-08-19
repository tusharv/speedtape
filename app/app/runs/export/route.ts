import { connection } from "next/server";
import { csvFilename, speedTestsToCsv } from "@/lib/csv";
import { loadArchiveExport } from "@/lib/dashboard";
import { parseArchiveQuery } from "@/lib/runs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  await connection();
  const url = new URL(request.url);
  const query = parseArchiveQuery({
    range: url.searchParams.get("range") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    slow: url.searchParams.get("slow") ?? undefined,
    ping: url.searchParams.get("ping") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
    isp: url.searchParams.get("isp") ?? undefined,
  });
  const csv = speedTestsToCsv(loadArchiveExport(query));
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${csvFilename(new Date(), query)}"`,
      "Cache-Control": "no-store",
    },
  });
}
