"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import {
  CheckIcon,
  CopyIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/ssr";
import {
  MAC_COMMANDS,
  WINDOWS_BUILD_TOOLS_NOTE,
  WINDOWS_COMMANDS,
} from "@/lib/guide";
import {
  COPY_FEEDBACK_MS,
  copyCommand,
  copyFeedbackReducer,
  createCopyRequestTracker,
  detectSetupOs,
  initialCopyFeedbackState,
  type SetupOs,
} from "@/app/components/copy-command";

const icon = { size: 15, weight: "regular" as const, "aria-hidden": true };

export type { SetupOs };

export {
  MAC_COMMANDS,
  WINDOWS_BUILD_TOOLS_NOTE,
  WINDOWS_COMMANDS,
  COPY_FEEDBACK_MS,
  copyCommand,
  copyFeedbackReducer,
  createCopyRequestTracker,
  detectSetupOs,
  initialCopyFeedbackState,
};
export type { CopyFeedbackState, CopyResult } from "@/app/components/copy-command";

function commandsFor(os: SetupOs) {
  return os === "windows" ? WINDOWS_COMMANDS : MAC_COMMANDS;
}

export function CopyCommandList({
  commands,
  note,
  listKey = "commands",
}: {
  commands: readonly { name: string; command: string }[];
  note?: string;
  listKey?: string;
}) {
  const [copyState, dispatchCopyState] = useReducer(
    copyFeedbackReducer,
    initialCopyFeedbackState,
  );
  const copyRequests = useRef(createCopyRequestTracker());
  const feedbackTimeout = useRef<number | null>(null);

  useEffect(
    () => () => {
      copyRequests.current.invalidate();
      if (feedbackTimeout.current !== null) {
        window.clearTimeout(feedbackTimeout.current);
      }
    },
    [],
  );

  async function copyNamedCommand(name: string, command: string) {
    const copyRequest = copyRequests.current.start();
    if (feedbackTimeout.current !== null) {
      window.clearTimeout(feedbackTimeout.current);
      feedbackTimeout.current = null;
    }
    dispatchCopyState({ type: "start", requestId: copyRequest });
    const nextResult = await copyCommand(
      navigator.clipboard?.writeText?.bind(navigator.clipboard),
      command,
    );
    if (!copyRequests.current.isCurrent(copyRequest)) {
      return;
    }
    dispatchCopyState({
      type: "settle",
      requestId: copyRequest,
      name,
      result: nextResult,
    });
    feedbackTimeout.current = window.setTimeout(() => {
      if (!copyRequests.current.isCurrent(copyRequest)) {
        return;
      }
      dispatchCopyState({ type: "reset", requestId: copyRequest });
      feedbackTimeout.current = null;
    }, COPY_FEEDBACK_MS);
  }

  return (
    <div>
      <ul className="min-w-0 divide-y divide-hairline">
        {commands.map((item) => {
          const result =
            copyState.feedback?.name === item.name
              ? copyState.feedback.result
              : null;
          const feedback =
            result === "copied"
              ? "Copied"
              : result === "failed"
                ? "Copy failed"
                : "";

          return (
            <li key={`${listKey}-${item.name}`}>
              <button
                type="button"
                onClick={() => void copyNamedCommand(item.name, item.command)}
                className="group flex w-full min-w-0 flex-col items-start gap-3 py-6 text-left outline-none transition-[color,transform] hover:text-copper active:translate-y-px focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
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
                  <span className="sr-only">Copy command</span>
                </span>
                <span className="min-w-0 break-all font-mono text-[11px] leading-5 text-muted sm:text-xs sm:leading-6">
                  {item.command}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {note ? (
        <p className="py-5 text-xs leading-5 text-muted">{note}</p>
      ) : null}
    </div>
  );
}

export function LandingCommands() {
  const [os, setOs] = useState<SetupOs>("mac");

  useEffect(() => {
    setOs(detectSetupOs(navigator.userAgent));
  }, []);

  const tabClass = (selected: boolean) =>
    `rounded-lg px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-panel ${
      selected ? "border border-copper text-copper" : "border border-transparent text-muted hover:text-paper"
    }`;

  return (
    <div>
      <div
        role="tablist"
        aria-label="Setup operating system"
        className="flex flex-wrap gap-2 border-b border-hairline py-4"
      >
        <button
          type="button"
          role="tab"
          aria-selected={os === "mac"}
          className={tabClass(os === "mac")}
          onClick={() => setOs("mac")}
        >
          Mac
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={os === "windows"}
          className={tabClass(os === "windows")}
          onClick={() => setOs("windows")}
        >
          Windows
        </button>
      </div>
      <CopyCommandList
        key={os}
        listKey={os}
        commands={commandsFor(os)}
        note={os === "windows" ? WINDOWS_BUILD_TOOLS_NOTE : undefined}
      />
    </div>
  );
}
