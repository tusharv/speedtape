export type SetupOs = "mac" | "windows";

export function detectSetupOs(userAgent: string): SetupOs {
  return /windows/i.test(userAgent) ? "windows" : "mac";
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
