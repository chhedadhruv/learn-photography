import Link from "next/link";

/**
 * Placeholder home page for the Phase 1 shell review. It exists to exercise the type scale,
 * tokens and both themes at every breakpoint — the real home page is built in Phase 9, once
 * there are lessons and challenges to point at.
 */
export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="text-xs font-semibold tracking-[0.12em] text-ink-faint uppercase">
        Phase 1 · Design system and shell
      </p>

      <h1 className="mt-4 max-w-2xl text-4xl leading-[1.1] font-semibold sm:text-5xl">
        Learn what your camera is actually doing.
      </h1>

      <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-muted">
        Read the lesson, then set the shutter, aperture and ISO yourself and see the photograph you
        would have taken.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/start-here"
          className="rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-surface"
        >
          Start here
        </Link>
        <Link
          href="/practice"
          className="rounded-md border border-rule-strong px-5 py-2.5 text-sm font-medium text-ink hover:bg-surface-raised"
        >
          Try the simulator
        </Link>
      </div>

      <section className="mt-20">
        <h2 className="text-2xl font-semibold">Type scale</h2>
        <div className="mt-6 flex flex-col gap-4 border-t border-rule pt-6">
          <p className="text-4xl font-semibold">The exposure triangle</p>
          <p className="text-2xl font-semibold">Aperture controls depth of field</p>
          <p className="text-lg">
            A wider aperture lets in more light and throws the background out of focus.
          </p>
          <p className="text-base leading-relaxed text-ink-muted">
            Body copy at its reading size. Aperture, shutter speed and ISO are the three controls
            that decide how bright a photograph is; change one and you have to change another to
            compensate.
          </p>
          <p className="text-sm text-ink-faint">Caption and metadata size.</p>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold">Zone scale</h2>
        <p className="mt-2 text-sm text-ink-muted">
          The palette&rsquo;s neutral ramp. Zone V is true 18% grey — what a light meter assumes,
          and what the simulator will frame its viewport in.
        </p>
        <ul className="mt-6 grid grid-cols-11 gap-px">
          {["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"].map((zone, index) => (
            <li key={zone} className="flex flex-col gap-2">
              <span
                className="block h-16 w-full"
                style={{ backgroundColor: `var(--color-zone-${index.toString()})` }}
              />
              <span className="text-center text-[10px] text-ink-faint tabular-nums">{zone}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
