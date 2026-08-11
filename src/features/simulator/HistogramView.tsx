"use client";

import { describeHistogram, readClipping, type Histogram } from "@/lib/sim/histogram";

/**
 * The histogram, drawn as bars.
 *
 * The chart itself is decorative to assistive tech — a picture of a picture is no use to someone
 * who cannot see either. The reading below it carries the meaning, and is the same sentence a
 * screen reader gets.
 */
export function HistogramView({ histogram }: { readonly histogram: Histogram }) {
  const peak = Math.max(1, ...histogram.bins);
  const clipping = readClipping(histogram);

  return (
    <section aria-labelledby="histogram-heading">
      <h3
        id="histogram-heading"
        className="text-xs font-semibold tracking-[0.08em] text-ink-faint uppercase"
      >
        Histogram
      </h3>

      <div
        aria-hidden="true"
        className="mt-2 flex h-20 items-end gap-px rounded bg-surface-sunken p-1"
      >
        {histogram.bins.map((count, index) => (
          <span
            key={index}
            className="flex-1 bg-ink-muted"
            style={{ height: `${Math.max(1, (count / peak) * 100).toString()}%` }}
          />
        ))}
      </div>

      <div aria-hidden="true" className="mt-1 flex justify-between text-[10px] text-ink-faint">
        <span>black</span>
        <span>mid-grey</span>
        <span>white</span>
      </div>

      <p
        className={[
          "mt-2 text-xs leading-relaxed",
          clipping.highlightsLost || clipping.shadowsLost ? "text-[#c4402a]" : "text-ink-muted",
        ].join(" ")}
      >
        {/* Colour is reinforcement, not the signal: the sentence itself says what is wrong. */}
        {clipping.message}
      </p>

      <p className="sr-only">{describeHistogram(histogram)}</p>
    </section>
  );
}
