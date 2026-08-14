"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react/ssr";

const icon = { size: 14, weight: "regular" as const, "aria-hidden": true };

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

export function LandingCommands() {
  const [copied, setCopied] = useState<string | null>(null);

  return (
    <ul className="min-w-0 divide-y divide-hairline">
      {COMMANDS.map((item) => {
        const isCopied = copied === item.name;
        return (
          <li key={item.name}>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(item.command);
                  setCopied(item.name);
                  window.setTimeout(() => setCopied(null), 1500);
                } catch {
                  setCopied(null);
                }
              }}
              className="flex w-full min-w-0 flex-col items-start gap-2 px-0 py-4 text-left transition-colors hover:text-copper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
            >
              <span className="flex items-center gap-2 text-sm text-paper">
                {item.name}
                {isCopied ? (
                  <CheckIcon {...icon} />
                ) : (
                  <CopyIcon {...icon} />
                )}
                <span className="sr-only">
                  {isCopied ? "Copied" : "Copy command"}
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
