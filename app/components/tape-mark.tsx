export function TapeMark({
  tone = "copper",
  className = "",
}: {
  tone?: "copper" | "ink" | "paper";
  className?: string;
}) {
  const fill =
    tone === "ink" ? "bg-ink" : tone === "paper" ? "bg-paper" : "bg-copper";

  return (
    <span
      aria-hidden="true"
      data-ticket-tape="true"
      className={`inline-flex h-4 w-4 shrink-0 items-end gap-0.5 ${className}`}
    >
      <span className={`h-[34%] min-w-0 flex-1 ${fill}`} />
      <span className={`h-[61%] min-w-0 flex-1 ${fill}`} />
      <span className={`h-[88%] min-w-0 flex-1 ${fill}`} />
    </span>
  );
}

export function passSerial(id: number): string {
  return `ST-${String(id).padStart(4, "0")}`;
}
