"use client";

/**
 * The exposure scale from a camera's viewfinder: a needle between −2 and +2 stops.
 *
 * Marked up as a progress bar with a text value, so it is not a purely visual instrument — a
 * screen reader reads "one stop overexposed" rather than nothing.
 */
export function ExposureMeter({ deviationStops }: { readonly deviationStops: number }) {
  const clamped = Math.max(-2, Math.min(2, deviationStops));
  const percent = ((clamped + 2) / 4) * 100;

  const label =
    Math.abs(deviationStops) <= 0.5
      ? "Correct exposure"
      : `${(Math.round(Math.abs(deviationStops) * 10) / 10).toString()} stops ${
          deviationStops > 0 ? "overexposed" : "underexposed"
        }`;

  return (
    <div>
      <div className="flex justify-between text-[10px] text-ink-faint tabular-nums">
        <span>−2</span>
        <span>0</span>
        <span>+2</span>
      </div>

      <div
        role="meter"
        aria-valuemin={-2}
        aria-valuemax={2}
        aria-valuenow={Math.round(clamped * 10) / 10}
        aria-valuetext={label}
        aria-label="Exposure"
        className="relative mt-1 h-2 w-full rounded-full bg-surface-sunken"
      >
        <span className="absolute top-0 bottom-0 left-1/2 w-px bg-rule-strong" aria-hidden="true" />
        <span
          className="absolute top-1/2 h-3 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink"
          style={{ left: `${percent.toString()}%` }}
          aria-hidden="true"
        />
      </div>

      <p className="mt-1.5 text-xs text-ink-muted">{label}</p>
    </div>
  );
}
