export const BRAND_MARK_VIEWBOX = {
  width: 38,
  height: 24,
} as const;

export const BRAND_TEAL = "#2dd4bf";
export const BRAND_INK = "#09090b";

export type BrandMarkPoint = {
  x: number;
  y: number;
};

const BAR_WIDTH = 7;
const BAR_GAP = 4.5;
const SKEW = 0.31;
const HEIGHTS = [0.86, 0.98, 1] as const;

export function brandMarkPolygons(): BrandMarkPoint[][] {
  const { height } = BRAND_MARK_VIEWBOX;
  return HEIGHTS.map((fraction, index) => {
    const barHeight = height * fraction;
    const x = index * (BAR_WIDTH + BAR_GAP);
    const skew = SKEW * barHeight;
    const top = height - barHeight;
    return [
      { x, y: height },
      { x: x + BAR_WIDTH, y: height },
      { x: x + BAR_WIDTH + skew, y: top },
      { x: x + skew, y: top },
    ];
  });
}

export function brandMarkPointsAttr(points: BrandMarkPoint[]): string {
  return points
    .map((point) => `${formatMarkNumber(point.x)},${formatMarkNumber(point.y)}`)
    .join(" ");
}

export function pointInBrandMark(
  x: number,
  y: number,
  polygons = brandMarkPolygons(),
): boolean {
  return polygons.some((polygon) => pointInConvexPolygon(x, y, polygon));
}

function formatMarkNumber(value: number): string {
  return Number.parseFloat(value.toFixed(2)).toString();
}

function pointInConvexPolygon(
  x: number,
  y: number,
  polygon: BrandMarkPoint[],
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i]!;
    const b = polygon[j]!;
    const intersects =
      a.y > y !== b.y > y &&
      x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

function brandMarkPolygonMarkup(fill: string): string {
  return brandMarkPolygons()
    .map(
      (points) =>
        `<polygon points="${brandMarkPointsAttr(points)}" fill="${fill}" />`,
    )
    .join("");
}

export function brandMarkSvg(
  options: {
    className?: string;
    fill?: string;
  } = {},
): string {
  const fill = options.fill ?? "var(--copper)";
  const classAttr = options.className ? ` class="${options.className}"` : "";
  return `<svg${classAttr} data-brand-mark="true" viewBox="0 0 ${BRAND_MARK_VIEWBOX.width} ${BRAND_MARK_VIEWBOX.height}" aria-hidden="true">${brandMarkPolygonMarkup(fill)}</svg>`;
}

export function brandMarkAppIconSvg(size: number): string {
  const pad = size * 0.18;
  const inner = size - pad * 2;
  const scale = Math.min(
    inner / BRAND_MARK_VIEWBOX.width,
    inner / BRAND_MARK_VIEWBOX.height,
  );
  const markWidth = BRAND_MARK_VIEWBOX.width * scale;
  const markHeight = BRAND_MARK_VIEWBOX.height * scale;
  const x = (size - markWidth) / 2;
  const y = (size - markHeight) / 2;
  const radius = (12 / 64) * size;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect x="1" y="1" width="${size - 2}" height="${size - 2}" rx="${formatMarkNumber(radius)}" fill="${BRAND_INK}"/>
  <g transform="translate(${formatMarkNumber(x)} ${formatMarkNumber(y)}) scale(${formatMarkNumber(scale)})">${brandMarkPolygonMarkup(BRAND_TEAL)}</g>
</svg>
`;
}
