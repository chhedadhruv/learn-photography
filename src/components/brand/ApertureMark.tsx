import { APERTURE_BARREL, APERTURE_BLADES, APERTURE_OPENING } from "./apertureGeometry";

interface ApertureMarkProps {
  /** Rendered size in pixels. The mark is drawn on a 24-unit grid and scales cleanly. */
  readonly size?: number;
  /** Set when the mark sits next to the wordmark, so it is not announced twice. */
  readonly decorative?: boolean;
  readonly className?: string;
}

/**
 * A six-blade iris. Geometry lives in `apertureGeometry.ts` so the header, the favicon and the
 * Open Graph images all draw from one set of coordinates.
 *
 * Strokes use `currentColor`, so the mark inherits text colour and needs no dark-mode variant.
 */
export function ApertureMark({ size = 24, decorative = false, className }: ApertureMarkProps) {
  const labelProps = decorative
    ? ({ "aria-hidden": true } as const)
    : ({ role: "img", "aria-label": "Learn Photography" } as const);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...labelProps}
    >
      <circle cx={APERTURE_BARREL.cx} cy={APERTURE_BARREL.cy} r={APERTURE_BARREL.r} />
      <path d={APERTURE_OPENING} />
      {APERTURE_BLADES.map((blade) => (
        <path key={blade} d={blade} />
      ))}
    </svg>
  );
}
