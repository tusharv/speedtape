export function parseDay(value: string | undefined): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return value;
}

export function orderedDays(
  from: string | null,
  to: string | null,
): { from: string | null; to: string | null } {
  if (from && to && from > to) return { from: to, to: from };
  return { from, to };
}

export function dayStartIso(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date).toISOString();
}

export function dayEndExclusiveIso(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date + 1).toISOString();
}

export function formatDay(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
