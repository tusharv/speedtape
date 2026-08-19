import Link from "next/link";
import { APP_NAME } from "@/lib/site";
import {
  BRAND_MARK_VIEWBOX,
  brandMarkPointsAttr,
  brandMarkPolygons,
} from "@/lib/brand-mark";

type BrandMarkSize = "sm" | "md" | "lg";

const markSizes: Record<BrandMarkSize, string> = {
  sm: "h-5 w-auto",
  md: "h-7 w-auto",
  lg: "h-12 w-auto",
};

export function BrandMark({
  size = "md",
  className = "",
}: {
  size?: BrandMarkSize;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      data-brand-mark="true"
      viewBox={`0 0 ${BRAND_MARK_VIEWBOX.width} ${BRAND_MARK_VIEWBOX.height}`}
      className={`inline-block shrink-0 ${markSizes[size]} ${className}`}
    >
      {brandMarkPolygons().map((points) => (
        <polygon
          key={brandMarkPointsAttr(points)}
          points={brandMarkPointsAttr(points)}
          className="fill-copper"
        />
      ))}
    </svg>
  );
}

export function BrandLockup({
  href = "/",
  markSize = "md",
  className = "",
  ariaLabel = `${APP_NAME} home`,
}: {
  href?: string;
  markSize?: BrandMarkSize;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-2.5 rounded-lg font-display text-lg font-semibold tracking-[-0.03em] text-paper outline-none transition-colors hover:text-copper focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${className}`}
    >
      <BrandMark size={markSize} />
      <span>{APP_NAME}</span>
    </Link>
  );
}
