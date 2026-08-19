"use client";

import Link from "next/link";
import { chipClass } from "@/app/components/chrome";
import { TermTip } from "@/app/components/term-tip";
import { RANGE_LABELS, RANGES } from "@/lib/range";
import { homeHref } from "@/lib/runs";
import type { TermKey } from "@/lib/terms";
import type { Range } from "@/lib/types";

const RANGE_TERMS: Record<Range, TermKey> = {
  "24h": "range24h",
  "7d": "range7d",
  "30d": "range30d",
  all: "rangeAll",
};

export function RangeTabs({
  range,
  hrefFor = homeHref,
  label = "History range",
  onSelect,
}: {
  range: Range | null;
  hrefFor?: (range: Range) => string;
  label?: string;
  onSelect?: (range: Range) => void;
}) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {RANGES.map((value) => {
        const active = range !== null && value === range;
        const chip = (
          <TermTip term={RANGE_TERMS[value]}>{RANGE_LABELS[value]}</TermTip>
        );
        if (onSelect) {
          return (
            <button
              key={value}
              type="button"
              className={chipClass(active)}
              aria-pressed={active}
              onClick={() => onSelect(value)}
            >
              {chip}
            </button>
          );
        }
        return (
          <Link
            key={value}
            href={hrefFor(value)}
            scroll={false}
            className={chipClass(active)}
          >
            {chip}
          </Link>
        );
      })}
    </nav>
  );
}
