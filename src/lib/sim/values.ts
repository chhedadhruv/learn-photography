/**
 * Control ladders.
 *
 * Every step is exactly one stop — a doubling or halving of light. Real cameras default to third
 * stops, and full stops here are a deliberate simplification: with thirds a beginner clicks three
 * times and sees almost nothing change, which teaches the opposite of the intended lesson.
 *
 * The values are exact powers, and the labels are the rounded conventions printed on a lens. A
 * lens marked f/2.8 really is 2√2 ≈ 2.828, and a shutter marked 1/125 really is 1/128. Computing
 * with the printed numbers would make reciprocity only approximately true — f/2.8 at 1/1000 would
 * not quite equal f/4 at 1/500 — and that equivalence is one of the things the site teaches, so
 * it has to be exact rather than nearly right.
 */

/** Shutter speeds in seconds, fastest first. 2⁻¹² … 2⁰. */
export const SHUTTER_SPEEDS: readonly number[] = [
  -12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0,
].map((stop) => 2 ** stop);

const SHUTTER_LABELS: readonly string[] = [
  "1/4000",
  "1/2000",
  "1/1000",
  "1/500",
  "1/250",
  "1/125",
  "1/60",
  "1/30",
  "1/15",
  "1/8",
  "1/4",
  "1/2",
  "1s",
];

/** f-numbers, widest first. Each step is √2 in diameter, so half the light. */
export const APERTURES: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(
  (stop) => Math.SQRT2 ** stop,
);

const APERTURE_LABELS: readonly string[] = ["1.4", "2", "2.8", "4", "5.6", "8", "11", "16", "22"];

export const ISOS: readonly number[] = [0, 1, 2, 3, 4, 5, 6].map((stop) => 100 * 2 ** stop);

/**
 * Snaps an arbitrary value to the nearest rung.
 *
 * Compared in log space, because the ladders are geometric: 1/4000 and 1/2000 are one stop apart
 * just as 1/2 and 1 are, even though their linear difference is a thousand times smaller.
 */
export function nearestValue(ladder: readonly number[], value: number): number {
  let closest = ladder[0] ?? value;
  let smallestGap = Number.POSITIVE_INFINITY;

  for (const rung of ladder) {
    const gap = Math.abs(Math.log2(rung) - Math.log2(value));
    if (gap < smallestGap) {
      smallestGap = gap;
      closest = rung;
    }
  }

  return closest;
}

export function indexOfValue(ladder: readonly number[], value: number): number {
  const index = ladder.indexOf(nearestValue(ladder, value));
  return index === -1 ? 0 : index;
}

/** Shutter speeds read as fractions: "1/250" is the number a photographer knows, "0.0039" is not. */
export function formatShutter(seconds: number): string {
  const label = SHUTTER_LABELS[indexOfValue(SHUTTER_SPEEDS, seconds)];
  // Off-ladder values reach here from rules of thumb, e.g. the 1/focal-length handheld guide.
  if (
    label === undefined ||
    Math.abs(Math.log2(nearestValue(SHUTTER_SPEEDS, seconds) / seconds)) > 0.2
  ) {
    return seconds >= 1
      ? `${(Math.round(seconds * 10) / 10).toString()}s`
      : `1/${Math.round(1 / seconds).toString()}`;
  }
  return label;
}

export function formatAperture(fNumber: number): string {
  return `f/${APERTURE_LABELS[indexOfValue(APERTURES, fNumber)] ?? (Math.round(fNumber * 10) / 10).toString()}`;
}

export function formatIso(iso: number): string {
  return `ISO ${Math.round(iso).toString()}`;
}

/**
 * Spoken form for `aria-valuetext`. A screen reader should say "one two-hundred-and-fiftieth of a
 * second", not "one slash two five zero".
 */
export function describeShutter(seconds: number): string {
  const label = formatShutter(seconds);
  if (!label.startsWith("1/")) return `${label.replace("s", "")} second`;

  const denominator = Number(label.slice(2));
  const names: Record<number, string> = {
    2: "half",
    4: "quarter",
    8: "eighth",
    15: "fifteenth",
    30: "thirtieth",
    60: "sixtieth",
  };

  return `one ${names[denominator] ?? `${denominator.toString()}th`} of a second`;
}

export function describeAperture(fNumber: number): string {
  return `f ${formatAperture(fNumber).slice(2)}`;
}
