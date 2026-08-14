import { useId, type ReactNode } from "react";
import { termText, type TermKey } from "@/lib/terms";

export function TermTip({
  term,
  children,
  className = "",
}: {
  term: TermKey;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <abbr className={`term-tip ${className}`.trim()} aria-describedby={id}>
      {children}
      <span id={id} className="term-tip-bubble" role="tooltip">
        {termText(term)}
      </span>
    </abbr>
  );
}
