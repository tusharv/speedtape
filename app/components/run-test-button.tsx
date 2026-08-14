"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { runTestNow } from "@/app/actions";
import { formatSpeedtestError } from "@/lib/speedtest-error";

export function RunTestButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const row = await runTestNow();
            if (row.error) {
              setMessage(formatSpeedtestError(row.error));
            } else {
              setMessage(
                `Down ${row.downloadMbps?.toFixed(1)} · Up ${row.uploadMbps?.toFixed(1)} Mbps`,
              );
            }
            router.refresh();
          });
        }}
        className="border border-copper bg-copper px-4 py-2 text-xs uppercase tracking-[0.16em] text-white hover:bg-amber disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Testing line…" : "Run test now"}
      </button>
      {message ? (
        <p className="max-w-sm text-xs text-muted" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
