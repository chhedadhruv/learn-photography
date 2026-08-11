/**
 * The zone scale, rendered as a hairline under the header.
 *
 * Eleven steps from maximum black to paper white, each about one stop of light apart — the same
 * ramp the palette is built from and the same one the exposure lessons describe. It is the
 * site's one piece of ornament, and it earns its place by being the subject.
 */
const ZONES = [
  { zone: "0", color: "var(--color-zone-0)" },
  { zone: "I", color: "var(--color-zone-1)" },
  { zone: "II", color: "var(--color-zone-2)" },
  { zone: "III", color: "var(--color-zone-3)" },
  { zone: "IV", color: "var(--color-zone-4)" },
  { zone: "V", color: "var(--color-zone-5)" },
  { zone: "VI", color: "var(--color-zone-6)" },
  { zone: "VII", color: "var(--color-zone-7)" },
  { zone: "VIII", color: "var(--color-zone-8)" },
  { zone: "IX", color: "var(--color-zone-9)" },
  { zone: "X", color: "var(--color-zone-10)" },
] as const;

export function ZoneStrip() {
  return (
    <div className="flex h-[3px] w-full" aria-hidden="true">
      {ZONES.map(({ zone, color }) => (
        <span key={zone} className="flex-1" style={{ backgroundColor: color }} />
      ))}
    </div>
  );
}
