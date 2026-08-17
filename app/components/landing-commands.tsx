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

const icon = { size: 15, weight: "regular" as const, "aria-hidden": true };

export type SetupOs = "mac" | "windows";

export {
  MAC_COMMANDS,
  WINDOWS_BUILD_TOOLS_NOTE,
  WINDOWS_COMMANDS,
};

export function detectSetupOs(userAgent: string): SetupOs {
  return /windows/i.test(userAgent) ? "windows" : "mac";
}

function commandsFor(os: SetupOs) {
  return os === "windows" ? WINDOWS_COMMANDS : MAC_COMMANDS;
}

export const COPY_FEEDBACK_MS = 1800;

export type CopyResult = "copied" | "failed";
export type CopyFeedbackState = {
  latestRequestId: number;
  feedback?: { name: string; result: CopyResult };
};
type CopyFeedbackAction =
  | { type: "start"; requestId: number }
  | { type: "settle"; requestId: number; name: string; result: CopyResult }
  | { type: "reset"; requestId: number };

export const initialCopyFeedbackState: CopyFeedbackState = {
  latestRequestId: 0,
};

export async function copyCommand(
  writeText: ((text: string) => Promise<void>) | undefined,
  command: string,
): Promise<CopyResult> {
  if (!writeText) {
    return "failed";
  }

  try {
    await writeText(command);
    return "copied";
  } catch {
    return "failed";
  }
}

export function createCopyRequestTracker() {
  let active = true;
  let latestRequestId = 0;

  return {
    start() {
      active = true;
      latestRequestId += 1;
      return latestRequestId;
    },
    isCurrent(requestId: number) {
      return active && requestId === latestRequestId;
    },
    invalidate() {
      active = false;
      latestRequestId += 1;
    },
  };
}

export function copyFeedbackReducer(
  state: CopyFeedbackState,
  action: CopyFeedbackAction,
): CopyFeedbackState {
  switch (action.type) {
    case "start":
      return { latestRequestId: action.requestId };
    case "settle":
      return action.requestId === state.latestRequestId
        ? {
            ...state,
            feedback: { name: action.name, result: action.result },
          }
        : state;
    case "reset":
      return action.requestId === state.latestRequestId
        ? { latestRequestId: state.latestRequestId }
        : state;
  }
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
                onClick={async () => {
                  const copyRequest = copyRequests.current.start();
                  if (feedbackTimeout.current !== null) {
                    window.clearTimeout(feedbackTimeout.current);
                    feedbackTimeout.current = null;
                  }
                  dispatchCopyState({ type: "start", requestId: copyRequest });
                  const nextResult = await copyCommand(
                    navigator.clipboard?.writeText?.bind(navigator.clipboard),
                    item.command,
                  );
                  if (!copyRequests.current.isCurrent(copyRequest)) {
                    return;
                  }
                  dispatchCopyState({
                    type: "settle",
                    requestId: copyRequest,
                    name: item.name,
                    result: nextResult,
                  });
                  feedbackTimeout.current = window.setTimeout(() => {
                    if (!copyRequests.current.isCurrent(copyRequest)) {
                      return;
                    }
                    dispatchCopyState({ type: "reset", requestId: copyRequest });
                    feedbackTimeout.current = null;
                  }, COPY_FEEDBACK_MS);
                }}
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
