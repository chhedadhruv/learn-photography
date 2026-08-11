/**
 * Star count as both glyphs and text.
 *
 * The glyphs are hidden from assistive tech and the label carries the meaning, so a screen
 * reader hears "two of three stars" rather than a run of punctuation.
 */
export function Stars({
  count,
  size = "sm",
}: {
  readonly count: number;
  readonly size?: "sm" | "md";
}) {
  const filled = Math.max(0, Math.min(3, Math.round(count)));

  return (
    <span className={size === "md" ? "text-base" : "text-sm"}>
      <span aria-hidden="true" className="text-[var(--color-tungsten)]">
        {"★".repeat(filled)}
        <span className="text-ink-faint">{"☆".repeat(3 - filled)}</span>
      </span>
      <span className="sr-only">{filled} of 3 stars</span>
    </span>
  );
}
