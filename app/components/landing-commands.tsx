"use client";

import { useRef, useState } from "react";
import {
  CheckIcon,
  CopyIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/ssr";

const icon = { size: 15, weight: "regular" as const, "aria-hidden": true };

const COMMANDS = [
  {
    name: "Install CLI",
    command: "brew tap teamookla/speedtest && brew install speedtest",
  },
  {
    name: "Install dependencies",
    command: "npm install",
  },
  {
    name: "Install agent",
    command: "npm run install-agent",
  },
  {
    name: "Start dashboard",
    command: "npm run dev",
  },
] as const;

type CopyResult = "copied" | "failed";
type CopyState = { name: string; result: CopyResult } | null;

export async function copyCommand(
  writeText: (text: string) => Promise<void>,
  command: string,
): Promise<CopyResult> {
  try {
    await writeText(command);
    return "copied";
  } catch {
    return "failed";
  }
}

export function copyRequestIsCurrent(
  scheduledRequest: number,
  latestRequest: number,
) {
  return scheduledRequest === latestRequest;
}

export function LandingCommands() {
  const [copyState, setCopyState] = useState<CopyState>(null);
  const latestCopyRequest = useRef(0);

  return (
    <ul className="min-w-0 divide-y divide-hairline">
      {COMMANDS.map((item) => {
        const result = copyState?.name === item.name ? copyState.result : null;
        const feedback =
          result === "copied"
            ? "Copied"
            : result === "failed"
              ? "Copy failed"
              : "Copy command";

        return (
          <li key={item.name}>
            <button
              type="button"
              onClick={async () => {
                const copyRequest = ++latestCopyRequest.current;
                const nextResult = await copyCommand(
                  navigator.clipboard.writeText.bind(navigator.clipboard),
                  item.command,
                );
                if (!copyRequestIsCurrent(copyRequest, latestCopyRequest.current)) {
                  return;
                }
                setCopyState({ name: item.name, result: nextResult });
                window.setTimeout(() => {
                  if (
                    !copyRequestIsCurrent(
                      copyRequest,
                      latestCopyRequest.current,
                    )
                  ) {
                    return;
                  }
                  setCopyState((current) =>
                    current?.name === item.name ? null : current,
                  );
                }, 1800);
              }}
              className="group flex w-full min-w-0 flex-col items-start gap-3 py-5 text-left outline-none transition-[color,transform] hover:text-copper active:translate-y-px focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
            >
              <span className="flex w-full items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-sm font-medium text-paper group-hover:text-copper">
                  {result === "copied" ? (
                    <CheckIcon {...icon} />
                  ) : result === "failed" ? (
                    <WarningCircleIcon {...icon} />
                  ) : (
                    <CopyIcon {...icon} />
                  )}
                  {item.name}
                </span>
                <span
                  aria-live="polite"
                  className={`shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] ${
                    result === "failed"
                      ? "text-fail"
                      : result === "copied"
                        ? "text-copper"
                        : "sr-only"
                  }`}
                >
                  {feedback}
                </span>
              </span>
              <span className="min-w-0 break-all font-mono text-[11px] leading-5 text-muted sm:text-xs sm:leading-6">
                {item.command}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
