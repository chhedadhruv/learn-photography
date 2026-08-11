"use client";

import { useEffect, useRef } from "react";

/**
 * A progress bar pinned under the header.
 *
 * The value is written straight to a CSS custom property via a ref rather than held in React
 * state: scroll fires far more often than React should re-render, and this keeps the work to a
 * single style mutation per frame.
 *
 * It is `aria-hidden` on purpose. Screen-reader users already know their position from the
 * document structure, and a value that changes on every scroll event is noise, not information.
 */
export function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const bar = barRef.current;
      if (!bar) return;

      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable <= 0 ? 0 : Math.min(1, window.scrollY / scrollable);
      bar.style.transform = `scaleX(${progress.toString()})`;
    };

    const onScroll = () => {
      frame ||= window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="sticky top-16 z-40 h-[2px] w-full" aria-hidden="true">
      <div
        ref={barRef}
        className="h-full w-full origin-left bg-[var(--color-tungsten)]"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
