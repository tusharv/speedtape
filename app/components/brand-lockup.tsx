import Link from "next/link";
import { APP_NAME } from "@/lib/site";

type BrandMarkSize = "sm" | "md" | "lg";

const markSizes: Record<BrandMarkSize, string> = {
  sm: "size-7",
  md: "size-9",
  lg: "size-16",
};

export function BrandMark({
  size = "md",
  className = "",
}: {
  size?: BrandMarkSize;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-brand-mark="true"
      className={`inline-flex shrink-0 items-end gap-[12%] rounded-lg border border-copper/40 bg-copper/5 p-[20%] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${markSizes[size]} ${className}`}
    >
      <span className="h-[34%] min-w-0 flex-1 rounded-[1px] bg-copper" />
      <span className="h-[61%] min-w-0 flex-1 rounded-[1px] bg-copper" />
      <span className="h-[88%] min-w-0 flex-1 rounded-[1px] bg-copper" />
    </span>
  );
}

export function BrandLockup({
  href = "/",
  markSize = "md",
  className = "",
}: {
  href?: string;
  markSize?: BrandMarkSize;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={`${APP_NAME} home`}
      className={`inline-flex items-center gap-2.5 rounded-lg font-display text-lg font-semibold tracking-[-0.03em] text-paper outline-none transition-colors hover:text-copper focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${className}`}
    >
      <BrandMark size={markSize} />
      <span>{APP_NAME}</span>
    </Link>
  );
}
