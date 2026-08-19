export const panel =
  "rounded-lg border border-hairline bg-raised px-5 py-6 sm:px-6";

export const field =
  "w-full min-w-0 rounded-lg border border-hairline bg-panel px-3 py-2.5 font-sans text-sm leading-5 text-paper outline-none focus:border-copper";

export const chip =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em]";

export function chipClass(active: boolean) {
  return `${chip} ${
    active
      ? "border-copper bg-copper text-white"
      : "border-hairline text-muted hover:border-copper hover:text-paper"
  }`;
}

export const primaryBtn =
  "inline-flex w-fit items-center justify-center rounded-lg border border-copper bg-copper px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white outline-none transition-[transform,background-color] hover:bg-amber active:translate-y-px focus-visible:ring-2 focus-visible:ring-copper disabled:cursor-wait disabled:opacity-60";

export const ghostBtn =
  "inline-flex w-fit items-center justify-center gap-1.5 rounded-lg border border-hairline px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted outline-none transition-[transform,color,border-color] hover:border-copper hover:text-paper active:translate-y-px focus-visible:ring-2 focus-visible:ring-copper";

export const sectionTitle =
  "font-display text-2xl font-semibold tracking-[-0.03em] text-paper";

export const kicker =
  "text-[11px] font-medium uppercase tracking-[0.12em] text-muted";

export const primaryCta =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-copper bg-copper px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.12em] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] outline-none transition-[transform,background-color] hover:bg-paper hover:text-ink active:translate-y-px focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:w-auto sm:whitespace-nowrap";

export const secondaryCta =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-hairline px-3 py-2 text-center text-[11px] font-medium uppercase tracking-[0.1em] text-paper outline-none transition-[transform,border-color,color] hover:border-copper hover:text-copper active:translate-y-px focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:w-auto sm:whitespace-nowrap sm:px-4 sm:text-xs";
