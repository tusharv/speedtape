export function formatSpeedtestError(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "Speed test failed";
  try {
    const parsed: unknown = JSON.parse(trimmed);
    const message = jsonErrorMessage(parsed);
    if (message) return message;
  } catch {
    // CLI sometimes prints plain text.
  }
  return trimmed;
}

function jsonErrorMessage(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  return jsonErrorMessage(record.error) ?? jsonErrorMessage(record.message);
}
