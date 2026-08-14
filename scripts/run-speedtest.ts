import { recordSpeedtest } from "../lib/record";

async function main() {
  const row = await recordSpeedtest();
  if (row.error) {
    console.error(`Speed test failed: ${row.error}`);
    process.exitCode = 1;
    return;
  }
  console.log(
    JSON.stringify({
      testedAt: row.testedAt,
      downloadMbps: row.downloadMbps,
      uploadMbps: row.uploadMbps,
      pingMs: row.pingMs,
    }),
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
