/**
 * Canonical geometry for the aperture mark, on a 24-unit grid.
 *
 * Every coordinate is derived rather than eyeballed:
 * - The barrel is r=9.25, so a 1.5 stroke lands its outer edge exactly on 10.
 * - The opening is a regular hexagon of circumradius 4.2 — about 45% of the barrel, which reads
 *   as a mid aperture rather than wide open or stopped down.
 * - Each blade is that hexagon's own edge continued until it meets the barrel. The tangency is
 *   what makes the mark read as an iris rather than a wheel.
 *
 * The six blades were originally one path rotated by `transform`, which is tidier to maintain
 * but not portable: librsvg (favicon rasterisation) and Satori (Open Graph images) both render
 * a constrained SVG subset. The rotations are baked into literal coordinates here, and every
 * command is explicit, so the same paths render identically in a browser, a rasteriser and an
 * image-generation route.
 */
export const APERTURE_BARREL = { cx: 12, cy: 12, r: 9.25 } as const;

/** The hexagonal opening. Vertices at 0°, 60°, … 300° from centre, circumradius 4.2. */
export const APERTURE_OPENING =
  "M16.2 12 L14.1 15.637 L9.9 15.637 L7.8 12 L9.9 8.363 L14.1 8.363 Z";

/** Six blades, each running from a hexagon vertex out to the barrel. */
export const APERTURE_BLADES = [
  "M14.1 15.637 L10.9 21.185",
  "M9.9 15.637 L3.496 15.64",
  "M7.8 12 L4.596 6.455",
  "M9.9 8.363 L13.1 2.815",
  "M14.1 8.363 L20.504 8.36",
  "M16.2 12 L19.404 17.545",
] as const;
